import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { SITE_URL } from "./lib/site-config.mjs";

const rootDir = process.cwd();
const removableRootFiles = /^index\.html[@_]p=.*\.html$/;
const encodedSlugDir = /^%[0-9a-f]{2}/i;
const disposableDirs = new Set(["feed", "wp-json", "comments"]);
const legacyPageTargets = new Map([
  ["1144", "/privacy-policy/"],
  ["1148", "/contact/"],
  ["1150", "/about/"],
  ["1265", "/terms-of-service/"],
  ["1770", "/editorial-policy/"],
]);
const pageDirs = [
  "",
  "about",
  "contact",
  "editorial-policy",
  "privacy-policy",
  "terms-of-service",
  "travel-tips",
  "asia-travel",
  "europe-travel",
  "middle-east-travel",
  "southeast-asia-travel",
];
const nonPostDirs = new Set([
  ".github",
  "cdn-cgi",
  "node_modules",
  "scripts",
  ...pageDirs.filter(Boolean),
  ...disposableDirs,
]);

await assertSiteRoot(rootDir);

const removed = {
  duplicateFiles: 0,
  encodedDirs: 0,
  disposableDirs: 0,
};

for (const entry of await fs.readdir(rootDir, { withFileTypes: true })) {
  const full = path.join(rootDir, entry.name);
  if (entry.isFile() && removableRootFiles.test(entry.name)) {
    await fs.rm(full, { force: true });
    removed.duplicateFiles += 1;
  }
  if (entry.isDirectory() && encodedSlugDir.test(entry.name)) {
    await fs.rm(full, { recursive: true, force: true });
    removed.encodedDirs += 1;
  }
}

removed.disposableDirs += await removeDisposableDirs(rootDir);

const htmlFiles = await collectHtmlFiles(rootDir);
let cleanedHtml = 0;
for (const file of htmlFiles) {
  const html = await fs.readFile(file, "utf8");
  if (!html.includes("<html")) {
    continue;
  }

  const $ = load(html, { decodeEntities: false });

  $('link[rel="https://api.w.org/"]').remove();
  $('link[rel="shortlink"]').remove();
  $('link[href*="/wp-json/"]').remove();
  $('link[href*="/feed/"]').remove();
  $('link[href*="feed/index.html"]').remove();
  $('link[href*="comments/feed"]').remove();
  $('a[href*="index.html@p="], a[href*="index.html_p="]').each((_, node) => {
    const anchor = $(node);
    const href = anchor.attr("href") || "";
    if (href.includes("#content")) {
      anchor.attr("href", "#content");
      return;
    }
    const match = href.match(/index\.html[@_]p=(\d+)\.html/);
    const target = match ? legacyPageTargets.get(match[1]) : null;
    if (target) {
      anchor.attr("href", target);
    } else {
      anchor.removeAttr("href");
    }
  });
  $('a[href*="/feed/"], a[href*="feed/index.html"]').each((_, node) => {
    const anchor = $(node);
    const listItem = anchor.closest("li");
    if (listItem.length && listItem.text().replace(/\s+/g, " ").trim() === anchor.text().trim()) {
      listItem.remove();
    } else {
      anchor.remove();
    }
  });

  const next = $.html();
  if (next !== html) {
    await fs.writeFile(file, next, "utf8");
    cleanedHtml += 1;
  }
}

await writeSitemaps(rootDir);

console.log(JSON.stringify({
  removed,
  cleanedHtml,
}, null, 2));

async function assertSiteRoot(dir) {
  const pkg = JSON.parse(await fs.readFile(path.join(dir, "package.json"), "utf8"));
  if (pkg.name !== "shootsense-static") {
    throw new Error(`Refusing to clean unexpected project: ${dir}`);
  }
}

async function collectHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...await collectHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

async function removeDisposableDirs(dir) {
  let removed = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (!entry.isDirectory()) {
      continue;
    }
    if (disposableDirs.has(entry.name)) {
      await fs.rm(full, { recursive: true, force: true });
      removed += 1;
      continue;
    }
    removed += await removeDisposableDirs(full);
  }
  return removed;
}

async function writeSitemaps(dir) {
  const now = new Date().toISOString();
  const pages = [];
  for (const pageDir of pageDirs) {
    const file = pageDir ? path.join(dir, pageDir, "index.html") : path.join(dir, "index.html");
    if (await exists(file)) {
      pages.push({
        loc: toUrl(pageDir),
        lastmod: (await fs.stat(file)).mtime.toISOString(),
      });
    }
  }

  const posts = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || nonPostDirs.has(entry.name) || encodedSlugDir.test(entry.name)) {
      continue;
    }
    const indexFile = path.join(dir, entry.name, "index.html");
    if (await exists(indexFile)) {
      posts.push({
        loc: toUrl(entry.name),
        lastmod: (await fs.stat(indexFile)).mtime.toISOString(),
      });
    }
  }

  posts.sort((a, b) => b.lastmod.localeCompare(a.lastmod));
  await fs.writeFile(path.join(dir, "post-sitemap.xml"), toUrlset(posts), "utf8");
  await fs.writeFile(path.join(dir, "page-sitemap.xml"), toUrlset(pages), "utf8");
  await fs.writeFile(path.join(dir, "sitemap_index.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/post-sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/page-sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>
`, "utf8");
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function toUrl(segment) {
  return segment ? encodeURI(`${SITE_URL}/${segment}/`) : `${SITE_URL}/`;
}

function toUrlset(items) {
  const urls = items.map((item) => `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${item.lastmod}</lastmod>
  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
