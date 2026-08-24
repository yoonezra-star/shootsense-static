import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { writeFileUtf8 } from "./lib/static-site-utils.mjs";

const rootDir = process.cwd();
const contactEmail = "replyleaders01@gmail.com";
const files = await collectHtmlFiles(rootDir);
let changed = 0;

for (const file of files) {
  const html = await fs.readFile(file, "utf8");
  const $ = load(html, { decodeEntities: false });
  const footer = $(".ss-site-footer").first();
  const heading = footer.find("h4").filter((_, el) => $(el).text().trim() === "구독·연결").first();
  const list = heading.next("ul");
  const footerEmailLinks = footer.find('a[href^="mailto:"]');
  footerEmailLinks.each((_, node) => {
    $(node).attr("href", `mailto:${contactEmail}`);
    $(node).text(contactEmail);
  });

  // The operator column already exposes the contact address. Keep the
  // connection list focused on navigation so the same email is not repeated.
  list.find('a[href^="mailto:"]').parent("li").remove();

  if ($.html() !== html) {
    await writeFileUtf8(file, $.html().replace(/[ \t]+$/gm, ""));
    changed += 1;
  }
}

console.log(`Removed duplicate footer emails from ${changed} pages.`);

async function collectHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtmlFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(fullPath);
  }
  return files;
}
