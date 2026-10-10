import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const rootDir = process.cwd();
const updatedToday = new Set([
  "honja-lushan-yeohaeng",
  "honja-southeast-asia-safety",
  "honja-yeohaeng-emergency-response",
  "honja-yeohaeng-junbi-gijun",
  "honja-yeohaeng-sukso-goreuneun-beop",
  "관광-코스가-없어-자유로웠던-사피-여행",
  "관광객이-적어-현지의-속도를-느낀-아르타",
  "구경-대신-산책이-전부였던-샤르자-외곽의-오후",
  "심심함이-여행의-일부가-된-반퐁에서의-며칠",
  "여행자보다-주민이-더-많았던-투이호아의-분위기",
  "이탈리아-치비타-디-반뇨레조-근처-마을",
  "추천은-못-해도-기억에서-지워지지-않는-코다이카날"
]);
const currentDate = "2026-10-10T18:57:00+09:00";
const previousDate = "2026-08-24T09:00:00+09:00";

function replaceOne(html, pattern, replacement, label) {
  const globalPattern = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
  const matches = [...html.matchAll(globalPattern)];
  if (matches.length !== 1) throw new Error(`${label}: expected one match, found ${matches.length}`);
  return html.replace(pattern, replacement);
}

let updated = 0;
for (const entry of await fs.readdir(rootDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const filePath = path.join(rootDir, entry.name, "index.html");
  let html;
  try { html = await fs.readFile(filePath, "utf8"); } catch { continue; }
  const $ = load(html);
  if (!$('.ss-post').length || /noindex/i.test($('meta[name="robots"]').attr('content') || '')) continue;

  const date = updatedToday.has(entry.name) ? currentDate : previousDate;
  const shortDate = date.slice(0, 10);
  const schemaText = $('script[type="application/ld+json"]').first().html();
  if (!schemaText) throw new Error(`${entry.name}: missing schema`);
  JSON.parse(schemaText);
  const schemaDates = [...schemaText.matchAll(/"dateModified":"[^"]+"/g)];
  if (schemaDates.length !== 2) throw new Error(`${entry.name}: expected two schema dates`);

  html = replaceOne(html, /(<meta property="og:updated_time" content=")[^"]+(")/, (_, before, after) => before + date + after, `${entry.name} og date`);
  html = replaceOne(html, /(<meta property="article:modified_time" content=")[^"]+(")/, (_, before, after) => before + date + after, `${entry.name} article date`);
  html = html.replace(/"dateModified":"[^"]+"/g, `"dateModified":"${date}"`);
  html = replaceOne(html, /(?:<span>🔁 [^<]+ 수정<\/span>)?<span>최종 수정 [^<]+<\/span>/u, `<span>최종 수정 ${shortDate}</span>`, `${entry.name} visible date`);
  html = replaceOne(html, /(최종 검토일: )\d{4}-\d{2}-\d{2}/, (_, before) => before + shortDate, `${entry.name} review date`);
  await fs.writeFile(filePath, html);
  updated += 1;
}

let sitemap = await fs.readFile(path.join(rootDir, "post-sitemap.xml"), "utf8");
for (const slug of updatedToday) {
  const pattern = new RegExp(`(<loc>https://shootsense\\.com/${slug}/<\\/loc>\\s*<lastmod>)[^<]+(<\\/lastmod>)`);
  sitemap = replaceOne(sitemap, pattern, (_, before, after) => before + currentDate + after, `${slug} sitemap date`);
}
await fs.writeFile(path.join(rootDir, "post-sitemap.xml"), sitemap);

let sitemapIndex = await fs.readFile(path.join(rootDir, "sitemap_index.xml"), "utf8");
sitemapIndex = replaceOne(sitemapIndex, /(<loc>https:\/\/shootsense\.com\/post-sitemap\.xml<\/loc>\s*<lastmod>)[^<]+(<\/lastmod>)/, (_, before, after) => before + currentDate + after, "post sitemap index date");
await fs.writeFile(path.join(rootDir, "sitemap_index.xml"), sitemapIndex);
console.log(`Aligned dates on ${updated} indexable posts`);
