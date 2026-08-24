import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const rootDir = process.cwd();
const replacements = new Map([
  ["/wp-content/themes/astra/assets/css/minified/main.min.css%3Fver=4.11.1.css", "/wp-content/themes/astra/assets/css/minified/main.min.css_ver=4.11.1.css"],
  ["/wp-content/plugins/ultimate-blocks/src/extensions/style.css%3Fver=6.9.4.css", "/wp-content/plugins/ultimate-blocks/src/extensions/style.css_ver=6.9.4.css"],
  ["/wp-content/themes/astra/assets/js/minified/frontend.min.js%3Fver=4.11.1", "/wp-content/themes/astra/assets/js/minified/frontend.min.js_ver=4.11.1"]
]);

async function collectHtml(dir) {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'playwright-artifacts') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtml(full));
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

let changed = 0;
for (const filePath of await collectHtml(rootDir)) {
  const html = await fs.readFile(filePath, 'utf8');
  const $ = load(html, { decodeEntities: false });

  $('link[href], script[src]').each((_, node) => {
    const attr = node.tagName === 'link' ? 'href' : 'src';
    const value = $(node).attr(attr) || '';
    const pathname = value.startsWith('http') ? new URL(value).pathname : value;
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    for (const [legacyPath, staticPath] of replacements) {
      if (normalizedPath === legacyPath || normalizedPath.endsWith(legacyPath)) {
        $(node).attr(attr, staticPath);
        break;
      }
    }
  });
  $('script[src*="cdn-cgi/scripts/"][src*="email-decode.min.js"]').remove();

  const output = $.html();
  if (output !== html) {
    await fs.writeFile(filePath, output, 'utf8');
    changed += 1;
  }
}

console.log(`Repaired static asset references in ${changed} HTML files.`);
