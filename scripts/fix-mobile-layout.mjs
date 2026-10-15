import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { ensureMobileReadingLayout, writeFileUtf8 } from "./lib/static-site-utils.mjs";

const ignored = new Set([".git", ".github", "node_modules", "wp-content", "cdn-cgi", "content", "scripts", "playwright-artifacts", "test-results"]);

async function collect(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory() && !ignored.has(entry.name)) files.push(...await collect(file));
    else if (entry.isFile() && entry.name === "index.html") files.push(file);
  }
  return files;
}

let updated = 0;
let tables = 0;
for (const file of await collect(process.cwd())) {
  const html = await fs.readFile(file, "utf8");
  const $ = load(html, { decodeEntities: false });
  if (!$("#masthead").length) continue;
  ensureMobileReadingLayout($);
  tables += $(".ss-mobile-comparison").length;
  const next = $.html();
  if (next !== html) {
    await writeFileUtf8(file, next);
    updated += 1;
  }
}
console.log(JSON.stringify({ updated, responsiveTables: tables }, null, 2));
