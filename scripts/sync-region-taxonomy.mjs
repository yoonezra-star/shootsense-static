import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { CATEGORY_MAP, SITE_URL, SITE_NAME } from './lib/site-config.mjs';
import { buildCategoryGuide, writeFileUtf8 } from './lib/static-site-utils.mjs';
import { HUB_MODIFIED } from './build-guide-hub.mjs';

export const REGION_TAXONOMY_MODIFIED = HUB_MODIFIED;
const categoryKey = 'middle-east-travel';
const category = CATEGORY_MAP[categoryKey];
const ignored = new Set(['.git', '.github', '.wrangler', 'node_modules', 'scripts', 'content', 'wp-content', 'assets', 'cdn-cgi', 'playwright-artifacts', 'test-results']);
const serialize = page => page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';
const countryLinks = '<a href="/guides/?region=morocco">모로코 사피</a> · <a href="/guides/?region=uae">아랍에미리트 샤르자·믈레이하</a>';

function isCategoryUrl(value, base) {
  if (!value) return false;
  try {
    const url = new URL(value, base);
    return url.origin === SITE_URL && url.pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '') === `/${categoryKey}`;
  } catch { return false; }
}

export function normalizeRegionIdentity(page, relative) {
  const base = `${SITE_URL}/${relative}`;
  page('a[href]').each((_, node) => {
    const link = page(node);
    if (!isCategoryUrl(link.attr('href'), base)) return;
    if (['중동', category.name].includes(link.text().trim()) && !link.find('img, svg').length) link.text(category.name);
    for (const attr of ['title', 'aria-label']) if (link.attr(attr) === '중동') link.attr(attr, category.name);
  });
  page('meta[property="article:section"]').filter((_, node) => page(node).attr('content') === '중동').attr('content', category.name);
  page('script[type="application/ld+json"]').each((_, script) => {
    const schema = JSON.parse(page(script).text());
    let changed = false;
    const visit = value => {
      if (!value || typeof value !== 'object') return;
      if (value.articleSection === '중동') { value.articleSection = category.name; changed = true; }
      if (value.name === '중동' && isCategoryUrl(value.url || value['@id'] || value.item, base)) { value.name = category.name; changed = true; }
      Object.values(value).forEach(visit);
    };
    visit(schema);
    if (changed) page(script).text(JSON.stringify(schema));
  });
}

async function collect(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(file));
    else if (entry.name === 'index.html' || entry.name === '404.html') files.push(file);
  }
  return files;
}

export async function syncRegionTaxonomy(root = process.cwd()) {
  let updated = 0;
  for (const file of await collect(root)) {
    const original = await fs.readFile(file, 'utf8');
    const page = load(original.trimEnd());
    const relative = path.relative(root, file).replaceAll('\\', '/');
    normalizeRegionIdentity(page, relative);
    if (relative === category.path) {
      const title = `${category.name} - ${SITE_NAME}`;
      page('title').text(title);
      for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) page(selector).attr('content', title);
      for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) page(selector).attr('content', category.description);
      page('.ss-archive-hero h1').text(category.name);
      page('.ss-archive-hero > p').text(category.description);
      page('.ss-archive-card .cat').text(category.name);
      const posts = page('.ss-archive-card').toArray().map(node => {
        const card = page(node);
        const href = card.find('a.ti').attr('href');
        const url = new URL(href, `${SITE_URL}/${category.path}`);
        return { slug: decodeURIComponent(url.pathname).replace(/^\//, '').replace(/\/index\.html$/, '').replace(/\/+$/, ''), title: card.find('a.ti').text(), publishedAt: card.find('.dt').text() };
      });
      page('.ss-category-guide').replaceWith(buildCategoryGuide(categoryKey, category, posts));
      page('#ss-mena-country-links').remove();
      if (page('#ss-category-directory').length !== 1) throw new Error('Expected category directory link');
      page('#ss-category-directory').after(`<p id="ss-mena-country-links">${countryLinks}</p>`);
      page('script[type="application/ld+json"]').each((_, script) => {
        const schema = JSON.parse(page(script).text());
        for (const node of schema['@graph'] || [schema]) {
          if (['CollectionPage', 'WebPage'].includes(node['@type'])) { node.name = title; node.description = category.description; }
          if (node.dateModified) node.dateModified = REGION_TAXONOMY_MODIFIED;
        }
        page(script).text(JSON.stringify(schema));
      });
      page('meta[property="og:updated_time"]').attr('content', REGION_TAXONOMY_MODIFIED);
    }
    if (relative === 'index.html') {
      page('#ss-home-region-review').remove();
      if (page('#ss-home-directory').length !== 1) throw new Error('Expected homepage directory');
      page('#ss-home-directory').append(`<p id="ss-home-region-review">${countryLinks}</p>`);
      page('meta[property="og:updated_time"]').attr('content', REGION_TAXONOMY_MODIFIED);
      page('script.rank-math-schema').each((_, script) => {
        const schema = JSON.parse(page(script).text());
        for (const node of schema['@graph'] || [schema]) if (node.dateModified) node.dateModified = REGION_TAXONOMY_MODIFIED;
        page(script).text(JSON.stringify(schema));
      });
    }
    const result = serialize(page);
    if (result !== original) { await writeFileUtf8(file, result); updated++; }
  }
  const file = path.join(root, 'page-sitemap.xml');
  const map = load(await fs.readFile(file, 'utf8'), { xml: true });
  map('url').filter((_, node) => [`${SITE_URL}/`, `${SITE_URL}/guides/`, `${SITE_URL}/${categoryKey}/`].includes(map(node).find('loc').text())).find('lastmod').text(REGION_TAXONOMY_MODIFIED);
  await writeFileUtf8(file, map.xml().trimEnd() + '\n');
  const indexFile = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(indexFile, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => index(node).find('loc').text() === `${SITE_URL}/page-sitemap.xml`).find('lastmod').text(REGION_TAXONOMY_MODIFIED);
  await writeFileUtf8(indexFile, index.xml().trimEnd() + '\n');
  return { updatedPages: updated, categoryRoutePreserved: `/${categoryKey}/`, countryFilters: ['morocco', 'uae'], legacyGroupFilter: 'mena' };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await syncRegionTaxonomy()));
