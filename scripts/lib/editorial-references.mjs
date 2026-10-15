import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { escapeHtml, writeFileUtf8 } from './static-site-utils.mjs';

const ignored = new Set(['.git', '.github', '.wrangler', 'node_modules', 'scripts', 'content', 'wp-content', 'assets', 'cdn-cgi', 'playwright-artifacts', 'test-results']);
async function pages(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory() && !ignored.has(entry.name)) files.push(...await pages(file));
    else if (entry.isFile() && entry.name === 'index.html') files.push(file);
  }
  return files;
}

export async function syncEditorialReferences(root, guides) {
  const renamed = guides.filter(guide => guide.title && guide.previousTitle);
  if (!renamed.length) return 0;
  let updated = 0;
  for (const file of await pages(root)) {
    const original = await fs.readFile(file, 'utf8');
    const $ = load(original.trimEnd(), { decodeEntities: false });
    const relative = path.relative(root, file).replaceAll('\\', '/');
    let changed = false;
    for (const guide of renamed) {
      for (const anchor of $('a[href]').toArray()) {
        let url;
        try { url = new URL($(anchor).attr('href'), `https://shootsense.com/${relative}`); } catch { continue; }
        if (url.origin !== 'https://shootsense.com') continue;
        const pathname = decodeURIComponent(url.pathname).replace(/\/index\.html$/, '/').replace(/\/+$/, '');
        if (pathname !== `/${guide.slug}`) continue;
        if ($(anchor).text().trim() === guide.previousTitle && !$(anchor).find('img').length) {
          $(anchor).text(guide.title);
          changed = true;
        }
        if ($(anchor).hasClass('ss-guide-cover') && guide.coverNote) {
          const note = $(anchor).find('.overline');
          if (note.text() !== guide.coverNote) { note.text(guide.coverNote); changed = true; }
          if ($(anchor).attr('aria-label') !== guide.title) { $(anchor).attr('aria-label', guide.title); changed = true; }
        }
        const teaser = $(anchor).closest('.ss-region-list li').children('span').last();
        if (guide.homeTeaser && teaser.length && teaser.text() !== guide.homeTeaser) {
          teaser.text(guide.homeTeaser);
          changed = true;
        }
      }
      const warning = guide.categoryWarning;
      if (warning?.path === relative) {
        const markup = `<p id="${escapeHtml(warning.id)}" class="ss-category-safety-note"><strong>${escapeHtml(warning.text)}</strong> <a href="${escapeHtml(warning.url)}">외교부 최신 안내</a></p>`;
        if (!$(`#${warning.id}`).length) { $('.ss-archive-hero').first().after(markup); changed = true; }
        else if (!$(`#${warning.id}`).prev().hasClass('ss-archive-hero')) {
          $(`#${warning.id}`).remove();
          $('.ss-archive-hero').first().after(markup);
          changed = true;
        }
        if (!$('link#ss-regional-style').length) { $('head').append('<link id="ss-regional-style" rel="stylesheet" href="/assets/regional-guides.css">'); changed = true; }
      }
    }
    if (changed) {
      await writeFileUtf8(file, $.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n');
      updated++;
    }
  }
  return updated;
}
