import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const root = process.cwd();
const files = [path.join(root, "index.html")];
for (const entry of await fs.readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(root, entry.name, "index.html");
  try {
    await fs.access(file);
    files.push(file);
  } catch { /* Not a published route. */ }
}

for (const file of files) {
  const $ = load(await fs.readFile(file, "utf8"), { decodeEntities: false });
  if (/noindex/i.test($('meta[name="robots"]').attr('content') || '')) continue;
  const withheld = $('.ss-withheld-link-text');
  if (!withheld.length) continue;
  const count = withheld.length;
  withheld.each((_, node) => {
    const item = $(node).closest('li');
    if (item.length) item.remove();
    else $(node).remove();
  });
  $('.ss-related').each((_, section) => {
    if (!$(section).find('li').length) $(section).remove();
  });
  $('.ss-post-nav').each((_, nav) => {
    if (!$(nav).find('a').length) $(nav).remove();
  });
  await fs.writeFile(file, $.html().replace(/^[ \t]+$/gm, ''));
  console.log(`${path.relative(root, file)}: removed ${count} unavailable items`);
}
