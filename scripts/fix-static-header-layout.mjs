import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { ensureStaticHeaderCss, writeFileUtf8 } from "./lib/static-site-utils.mjs";

const rootDir = process.cwd();
const ignoredDirectories = new Set([".git", ".github", "node_modules", "cdn-cgi", "wp-content", "content", "scripts"]);

async function collectHtmlFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...(await collectHtmlFiles(filePath)));
      }
    } else if (entry.name === "index.html") {
      files.push(filePath);
    }
  }
  return files;
}

const files = await collectHtmlFiles(rootDir);
let updated = 0;

for (const filePath of files) {
  const html = await fs.readFile(filePath, "utf8");
  const $ = load(html, { decodeEntities: false });
  if (!$("#masthead").length || $("#ss-static-header-layout").length) {
    continue;
  }
  ensureStaticHeaderCss($);
  await writeFileUtf8(filePath, $.html());
  updated += 1;
}

console.log(JSON.stringify({ ok: true, scanned: files.length, updated }, null, 2));
