import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { SITE_URL } from "./lib/site-config.mjs";

const rootDir = process.cwd();
const skipSegments = new Set(["feed", "comments", "wp-json"]);
const indexableRobots = "follow, index, max-snippet:-1, max-video-preview:-1, max-image-preview:large";

const files = await collectHtmlFiles(rootDir);
let changed = 0;

for (const file of files) {
  const rel = path.relative(rootDir, file).replaceAll("\\", "/");
  if (shouldSkip(rel)) {
    continue;
  }

  const html = await fs.readFile(file, "utf8");
  if (!html.includes("<html")) {
    continue;
  }

  const $ = load(html, { decodeEntities: false });
  const publicUrl = toPublicUrl(rel);
  if (!publicUrl) {
    continue;
  }

  setOrAppendMeta($, "robots", indexableRobots);
  setCanonical($, publicUrl);
  setProperty($, "og:url", publicUrl);

  $('link[rel="https://api.w.org/"]').remove();
  $('link[rel="shortlink"]').remove();
  $('link[rel="alternate"][href*="/feed/"]').remove();
  $('link[rel="alternate"][href*="comments/feed"]').remove();
  $('link[rel="alternate"][href*="wp-json"]').remove();
  $('link[href*="/wp-json/"]').remove();
  $('link[rel="EditURI"]').remove();
  $('meta[name="generator"]').remove();

  const next = $.html();
  if (next !== html) {
    await fs.writeFile(file, next, "utf8");
    changed += 1;
  }
}

console.log(`Hardened ${changed} HTML files for AdSense readiness.`);

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

function shouldSkip(rel) {
  const parts = rel.split("/");
  return parts.some((part) => skipSegments.has(part));
}

function toPublicUrl(rel) {
  if (rel === "index.html") {
    return `${SITE_URL}/`;
  }
  if (rel.endsWith("/index.html")) {
    return `${SITE_URL}/${rel.slice(0, -"/index.html".length)}/`;
  }
  return `${SITE_URL}/${rel}`;
}

function setOrAppendMeta($, name, content) {
  const node = $(`meta[name="${name}"]`).first();
  if (node.length) {
    node.attr("content", content);
  } else {
    $("head").append(`\n<meta name="${name}" content="${content}">`);
  }
}

function setCanonical($, href) {
  const node = $('link[rel="canonical"]').first();
  if (node.length) {
    node.attr("href", href);
  } else {
    $("head").append(`\n<link rel="canonical" href="${href}">`);
  }
}

function setProperty($, property, content) {
  const node = $(`meta[property="${property}"]`).first();
  if (node.length) {
    node.attr("content", content);
  }
}
