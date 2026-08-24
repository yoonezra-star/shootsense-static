import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const rootDir = process.cwd();
const skipDirs = new Set([".git", "node_modules", "scripts", "content", "cdn-cgi", "wp-content"]);

async function collectIndexFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (skipDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectIndexFiles(fullPath));
    if (entry.isFile() && entry.name === "index.html") files.push(fullPath);
  }
  return files;
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function countWords(text) {
  return normalize(text).split(" ").filter(Boolean).length;
}

function isExternalLink(href = "") {
  return /^https?:\/\//i.test(href) && !href.includes("shootsense.com");
}

const files = await collectIndexFiles(rootDir);
const posts = [];

for (const filePath of files) {
  const html = await fs.readFile(filePath, "utf8");
  const $ = load(html, { decodeEntities: false });
  if (!$('.ss-post').length) continue;

  const body = $('.ss-post-body').first();
  const paragraphs = body.find('p, li')
    .filter((_, node) => !$(node).closest('.ss-source-list, .ss-related-list').length)
    .map((_, node) => normalize($(node).text()))
    .get()
    .filter((text) => text.length >= 35);
  const bodyText = normalize(body.text());
  const relativeDir = path.relative(rootDir, path.dirname(filePath)).replaceAll('\\', '/');
  const robots = $('meta[name="robots"]').attr('content') || '';
  const externalLinks = body.find('a[href]').map((_, node) => $(node).attr('href')).get().filter(isExternalLink);
  const internalLinks = body.find('a[href]').map((_, node) => $(node).attr('href') || '').get().filter((href) => href.startsWith('/') || href.startsWith('../') || href.startsWith('./'));

  posts.push({
    slug: relativeDir,
    title: normalize($('.ss-post h1').first().text()),
    category: normalize($('.ss-cat-badge').first().text()),
    bodyChars: bodyText.length,
    bodyWords: countWords(bodyText),
    sections: body.find('h2').length,
    subSections: body.find('h3').length,
    paragraphs: paragraphs.length,
    externalSources: new Set(externalLinks).size,
    internalLinks: new Set(internalLinks).size,
    tocCount: $('.ss-toc').length,
    indexed: !/noindex/i.test(robots),
    canonical: $('link[rel="canonical"]').attr('href') || '',
    paragraphTexts: paragraphs
  });
}

const paragraphFrequency = new Map();
for (const post of posts.filter((item) => item.indexed)) {
  for (const paragraph of new Set(post.paragraphTexts)) {
    paragraphFrequency.set(paragraph, (paragraphFrequency.get(paragraph) || 0) + 1);
  }
}

for (const post of posts) {
  const repeated = post.paragraphTexts.filter((paragraph) => (paragraphFrequency.get(paragraph) || 0) > 1).length;
  post.uniqueParagraphRatio = post.paragraphs ? Number(((post.paragraphs - repeated) / post.paragraphs).toFixed(2)) : 0;
  delete post.paragraphTexts;
}

const indexedPosts = posts.filter((post) => post.indexed);
const weakPosts = indexedPosts
  .filter((post) => post.bodyChars < 3500 || post.sections < 6 || post.uniqueParagraphRatio < 0.8)
  .sort((a, b) => a.bodyChars - b.bodyChars);
const sourceLightPosts = indexedPosts.filter((post) => post.externalSources === 0);
const navigationLightPosts = indexedPosts.filter((post) => post.internalLinks < 2);
const score = Math.max(0, Math.round(
  100
  - (weakPosts.length / Math.max(indexedPosts.length, 1)) * 40
  - (sourceLightPosts.length / Math.max(indexedPosts.length, 1)) * 15
  - (navigationLightPosts.length / Math.max(indexedPosts.length, 1)) * 10
  - posts.filter((post) => post.tocCount !== 1).length * 2
));

const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    bodyOnly: true,
    strongBodyMinimumChars: 3500,
    strongSectionMinimum: 6,
    uniqueParagraphMinimumRatio: 0.8,
    note: "This is an internal readiness score, not a Google score or approval prediction."
  },
  summary: {
    internalReadinessScore: score,
    totalPosts: posts.length,
    indexedPosts: indexedPosts.length,
    weakIndexedPosts: weakPosts.length,
    postsWithoutExternalSources: sourceLightPosts.length,
    postsWithFewerThanTwoInternalLinks: navigationLightPosts.length,
    tocProblems: posts.filter((post) => post.tocCount !== 1).length
  },
  allPosts: [...posts].sort((a, b) => b.bodyChars - a.bodyChars),
  weakestIndexedPosts: weakPosts.slice(0, 30),
  postsWithoutExternalSources: sourceLightPosts.map(({ slug, title, bodyChars }) => ({ slug, title, bodyChars })),
  postsWithFewerThanTwoInternalLinks: navigationLightPosts.map(({ slug, title, internalLinks }) => ({ slug, title, internalLinks }))
  ,repeatedParagraphs: [...paragraphFrequency.entries()]
    .filter(([, frequency]) => frequency > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([text, frequency]) => ({ frequency, text }))
};

await fs.writeFile(path.join(rootDir, 'adsense-readiness-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report.summary, null, 2));
console.log('\nWeakest indexed posts:');
for (const post of weakPosts.slice(0, 20)) {
  console.log(`${String(post.bodyChars).padStart(5)} chars | ${post.sections} h2 | ${post.externalSources} src | ${post.internalLinks} internal | ${post.slug}`);
}
