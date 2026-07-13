import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const rootDir = process.cwd();
const skipDirs = new Set(["node_modules", ".git", "feed", "comments", "wp-json"]);
const pageIdTargets = new Map([
  ["1144", "/privacy-policy/"],
  ["1148", "/contact/"],
  ["1150", "/about/"],
  ["1265", "/terms-of-service/"],
  ["1770", "/editorial-policy/"]
]);

const htmlFiles = await collectHtmlFiles(rootDir);
const idToPath = new Map(pageIdTargets);

for (const file of htmlFiles) {
  const rel = path.relative(rootDir, file).replaceAll("\\", "/");
  if (shouldSkip(rel)) {
    continue;
  }
  const publicPath = toPublicPath(rel);
  if (!publicPath || publicPath === "/") {
    continue;
  }
  const html = await fs.readFile(file, "utf8");
  const $ = load(html, { decodeEntities: false });
  if (!$(".ss-post").length) {
    continue;
  }
  const selfId = findSelfPostId(html);
  if (selfId && !idToPath.has(selfId)) {
    idToPath.set(selfId, publicPath);
  }
}

let changedFiles = 0;
let changedLinks = 0;
for (const file of htmlFiles) {
  const rel = path.relative(rootDir, file).replaceAll("\\", "/");
  if (shouldSkip(rel)) {
    continue;
  }
  const html = await fs.readFile(file, "utf8");
  const next = html.replace(/(?:\.\.\/)?index\.html(?:%3F|\?)p=(\d+)\.html(#[^"'<\s]*)?/g, (match, id, hash = "") => {
    const target = idToPath.get(id);
    if (!target) {
      return match;
    }
    changedLinks += 1;
    return `${target}${hash}`;
  });
  if (next !== html) {
    await fs.writeFile(file, normalizeHtml(next), "utf8");
    changedFiles += 1;
  }
}

const unresolved = new Set();
for (const file of htmlFiles) {
  const rel = path.relative(rootDir, file).replaceAll("\\", "/");
  if (shouldSkip(rel)) {
    continue;
  }
  const html = await fs.readFile(file, "utf8");
  for (const id of findLegacyIds(html)) {
    unresolved.add(id);
  }
}

console.log(JSON.stringify({
  mappedIds: idToPath.size,
  changedFiles,
  changedLinks,
  unresolved: [...unresolved].sort()
}, null, 2));

async function collectHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (skipDirs.has(entry.name)) {
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
  return rel.split("/").some((part) => skipDirs.has(part));
}

function toPublicPath(rel) {
  if (rel === "index.html") {
    return "/";
  }
  if (rel.endsWith("/index.html")) {
    return `/${rel.slice(0, -"/index.html".length)}/`;
  }
  return "";
}

function findLegacyIds(html) {
  const ids = new Set();
  const pattern = /index\.html(?:%3F|\?)p=(\d+)\.html/g;
  let match;
  while ((match = pattern.exec(html))) {
    ids.add(match[1]);
  }
  return ids;
}

function findSelfPostId(html) {
  const skipLink = html.match(/href=["'][^"']*index\.html(?:%3F|\?)p=(\d+)\.html#content["']/);
  if (skipLink) {
    return skipLink[1];
  }
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']+["'][^>]*>/i);
  if (!canonical) {
    return null;
  }
  const first = html.match(/index\.html(?:%3F|\?)p=(\d+)\.html/);
  return first ? first[1] : null;
}

function normalizeHtml(html) {
  return html.replace(/[ \t]+$/gm, "");
}
