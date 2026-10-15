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
const publishedTools = [];

for (const filePath of files) {
  const html = await fs.readFile(filePath, "utf8");
  const $ = load(html, { decodeEntities: false });
  if ($('.ss-tool').length) publishedTools.push({ route: path.relative(rootDir, path.dirname(filePath)).replaceAll('\\', '/'), title: normalize($('h1').first().text()) });
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
const sourceLightPosts = indexedPosts.filter((post) => post.externalSources === 0);
const navigationLightPosts = indexedPosts.filter((post) => post.internalLinks < 2);

const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    bodyOnly: true,
    scoring: "none",
    note: "Structural inventory only. Character counts, headings and exact paragraph matches do not establish original value or AdSense eligibility. Human editorial review is required."
  },
  summary: {
    editorialAssessment: "manual-review-required",
    totalPosts: posts.length,
    indexedPosts: indexedPosts.length,
    publishedTools: publishedTools.length,
    postsWithoutExternalSources: sourceLightPosts.length,
    postsWithFewerThanTwoInternalLinks: navigationLightPosts.length,
    tocProblems: posts.filter((post) => post.tocCount !== 1).length
  },
  allPosts: [...posts].sort((a, b) => b.bodyChars - a.bodyChars),
  tools: publishedTools,
  manualReviewQuestions: [
    "Can the reader complete a concrete task with the page?",
    "What original calculation, analysis, comparison or verified reporting does it add?",
    "Are examples and research clearly distinguished from firsthand experience?",
    "Could repeated conclusions be removed without losing useful information?",
    "Are traffic and usage claims supported by actual data?"
  ],
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
console.log('\nNo approval score is calculated. Review original value and actual reader outcomes manually.');
