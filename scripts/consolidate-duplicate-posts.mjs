import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { EXCLUDED_POST_SLUGS, SITE_URL } from "./lib/site-config.mjs";
import { loadPosts, updateSitemaps, writeFileUtf8 } from "./lib/static-site-utils.mjs";

const rootDir = process.cwd();
const preferredSlug = "honja-yagan-docak-checklist";
const preferredUrl = `${SITE_URL}/${preferredSlug}/`;

for (const legacySlug of EXCLUDED_POST_SLUGS) {
  const legacyPath = path.join(rootDir, legacySlug, "index.html");
  const html = await fs.readFile(legacyPath, "utf8");
  const $ = load(html, { decodeEntities: false });

  $("link[rel='canonical']").attr("href", preferredUrl);
  $("meta[name='robots']").attr("content", "noindex, follow");
  $("meta[property='og:url']").attr("content", preferredUrl);
  $("meta[name='twitter:url']").attr("content", preferredUrl);
  await writeFileUtf8(legacyPath, $.html());
}

await updateSitemaps(rootDir, await loadPosts(rootDir));
console.log(JSON.stringify({ ok: true, preferredUrl, excluded: [...EXCLUDED_POST_SLUGS] }, null, 2));
