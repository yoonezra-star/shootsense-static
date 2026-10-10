import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const rootDir = process.cwd();
const skipDirs = new Set([".git", "node_modules", "scripts", "content", "cdn-cgi"]);

async function collectHtml(dir) {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtml(full));
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const files = await collectHtml(rootDir);
const issues = [];
const brokenLinks = new Set();
const heldRoutes = new Set();
const indexableFiles = [];
let indexedPosts = 0;
let heldPosts = 0;

for (const filePath of files) {
  const html = await fs.readFile(filePath, 'utf8');
  const $ = load(html, { decodeEntities: false });
  const relative = path.relative(rootDir, filePath).replaceAll('\\', '/');
  const robots = $('meta[name="robots"]').attr('content') || '';
  const isPost = $('.ss-post').length > 0;
  const isIndexable = !/noindex/i.test(robots);

  if (isPost && isIndexable) indexedPosts += 1;
  if (isPost && !isIndexable) {
    heldPosts += 1;
    heldRoutes.add(path.relative(rootDir, path.dirname(filePath)).replaceAll('\\', '/'));
  }
  if (isIndexable) indexableFiles.push(filePath);
  if (isPost && isIndexable && $('.ss-editorial-application').length !== 1) issues.push(`${relative}: editorial application count`);
  if (isPost && isIndexable && $('.ss-toc a[href="#editorial-application"]').length !== 1) issues.push(`${relative}: application TOC count`);
  if (isPost && isIndexable) {
    for (const href of $('.ss-toc a[href]').map((_, node) => $(node).attr('href') || '').get()) {
      const hash = href.split('#')[1];
      if (!hash || !$(`[id="${hash}"]`).length) issues.push(`${relative}: TOC target missing ${href}`);
    }
    const modified = $('meta[property="article:modified_time"]').attr('content');
    const updated = $('meta[property="og:updated_time"]').attr('content');
    const visible = $('.ss-post-meta').text();
    const review = $('.ss-trust-note').text();
    let schemaDates = [];
    try {
      const schema = JSON.parse($('script[type="application/ld+json"]').first().html() || '{}');
      schemaDates = (schema['@graph'] || []).filter((node) => node.dateModified).map((node) => node.dateModified);
    } catch {
      issues.push(`${relative}: invalid JSON-LD`);
    }
    if (!modified || updated !== modified || schemaDates.length < 2 || schemaDates.some((date) => date !== modified)) {
      issues.push(`${relative}: modified dates disagree`);
    }
    if (modified && (!visible.includes(modified.slice(0, 10)) || !review.includes(modified.slice(0, 10)))) {
      issues.push(`${relative}: visible review date disagrees`);
    }
  }
  if (isPost && !isIndexable && /pagead2|adsbygoogle|googlesyndication/.test(html)) issues.push(`${relative}: ad code on held page`);
  if (isIndexable && $('title').length !== 1) issues.push(`${relative}: title count ${$('title').length}`);
  if (isIndexable && $('link[rel="canonical"]').length !== 1) issues.push(`${relative}: canonical count ${$('link[rel="canonical"]').length}`);
  if (isIndexable && $('h1').length !== 1) issues.push(`${relative}: h1 count ${$('h1').length}`);

  if (isIndexable) {
    for (const href of $('a[href]').map((_, node) => $(node).attr('href') || '').get()) {
      if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) continue;
      let target = href;
      if (/^https?:\/\//i.test(target)) {
        if (!target.startsWith('https://shootsense.com')) continue;
        target = new URL(target).pathname;
      }
      target = target.split('#')[0].split('?')[0];
      if (!target || target.startsWith('/wp-content/') || target.startsWith('/cdn-cgi/')) continue;
      try { target = decodeURI(target); } catch { /* Keep the original URL path. */ }
      const absoluteTarget = target.startsWith('/')
        ? path.join(rootDir, target.replace(/^\/+/, ''))
        : path.resolve(path.dirname(filePath), target);
      const candidate = target.endsWith('/') || !path.extname(absoluteTarget)
        ? path.join(absoluteTarget, 'index.html')
        : absoluteTarget;
      try {
        await fs.access(candidate);
      } catch {
        brokenLinks.add(`${relative} -> ${href}`);
      }
    }
  }
}

for (const filePath of indexableFiles) {
  const $ = load(await fs.readFile(filePath, 'utf8'), { decodeEntities: false });
  const relative = path.relative(rootDir, filePath).replaceAll('\\', '/');
  for (const href of $('a[href]').map((_, node) => $(node).attr('href') || '').get()) {
    let target = href;
    if (/^https?:\/\//i.test(target)) {
      if (!target.startsWith('https://shootsense.com')) continue;
      target = new URL(target).pathname;
    }
    if (!target || target.startsWith('#') || /^(mailto|tel|javascript):/i.test(target)) continue;
    target = target.split('#')[0].split('?')[0];
    try { target = decodeURI(target); } catch { /* Keep the original URL path. */ }
    const absoluteTarget = target.startsWith('/')
      ? path.join(rootDir, target.replace(/^\/+/, ''))
      : path.resolve(path.dirname(filePath), target);
    const route = path.relative(rootDir, absoluteTarget).replaceAll('\\', '/').replace(/\/$/, '').replace(/\/index\.html$/, '');
    if (heldRoutes.has(route)) issues.push(`${relative}: links to held post ${route}`);
  }
}

const sitemap = await fs.readFile(path.join(rootDir, 'post-sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrls.length !== indexedPosts) issues.push(`post sitemap has ${sitemapUrls.length} URLs but ${indexedPosts} indexed posts`);
if (new Set(sitemapUrls).size !== sitemapUrls.length) issues.push('post sitemap contains duplicate URLs');

const emailOccurrences = (await fs.readFile(path.join(rootDir, 'index.html'), 'utf8')).match(/mailto:replyleaders01@gmail\.com/g)?.length || 0;
if (emailOccurrences !== 1) issues.push(`home footer email count ${emailOccurrences}`);

const requiredPages = {
  'index.html': 2500,
  'about/index.html': 900,
  'author/index.html': 900,
  'contact/index.html': 500,
  'editorial-policy/index.html': 900,
  'privacy-policy/index.html': 900,
  'terms-of-service/index.html': 900
};
const requiredPageChars = {};
for (const [relative, minimum] of Object.entries(requiredPages)) {
  const $ = load(await fs.readFile(path.join(rootDir, relative), 'utf8'), { decodeEntities: false });
  const chars = $('main').first().text().replace(/\s+/g, ' ').trim().length;
  requiredPageChars[relative] = chars;
  if (chars < minimum) issues.push(`${relative}: required page has ${chars} chars, expected at least ${minimum}`);
}

for (const category of ['travel-tips', 'asia-travel', 'europe-travel', 'middle-east-travel', 'southeast-asia-travel']) {
  const $ = load(await fs.readFile(path.join(rootDir, category, 'index.html'), 'utf8'), { decodeEntities: false });
  const cards = $('.ss-archive-card').length;
  if (cards < 2) issues.push(`${category}/index.html: only ${cards} curated cards`);
}

for (const filePath of files.filter((file) => /[\\/]page[\\/]\d+[\\/]index\.html$/.test(file))) {
  const $ = load(await fs.readFile(filePath, 'utf8'), { decodeEntities: false });
  if (!/noindex/i.test($('meta[name="robots"]').attr('content') || '')) {
    issues.push(`${path.relative(rootDir, filePath)}: empty pagination page is indexable`);
  }
}

if (brokenLinks.size) issues.push(...[...brokenLinks].slice(0, 30).map((link) => `broken internal link: ${link}`));

console.log(JSON.stringify({ htmlFiles: files.length, indexedPosts, heldPosts, sitemapUrls: sitemapUrls.length, requiredPageChars, brokenInternalLinks: brokenLinks.size, issues }, null, 2));
if (issues.length) process.exitCode = 1;
