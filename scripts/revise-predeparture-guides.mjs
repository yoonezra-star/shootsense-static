import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { ensureMobileReadingLayout, escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';
import { PREDEPARTURE_GUIDES, PREDEPARTURE_HOME_UPDATE, PREDEPARTURE_MODIFIED } from './predeparture-content.mjs';
import { REGIONAL_REVISION } from './regional-access-content.mjs';
import { SAFI_MLEIHA_REVISION } from './safi-mleiha-content.mjs';
import { TUYHOA_KODAI_REVISION } from './tuyhoa-kodai-content.mjs';
import { BANPONG_LUSHAN_REVISION } from './banpong-lushan-content.mjs';
import { DINING_REVISION } from './dining-content.mjs';
import { syncEditorialReferences } from './lib/editorial-references.mjs';

export async function reviseEditorialBatch({
  guides = PREDEPARTURE_GUIDES, modified = PREDEPARTURE_MODIFIED,
  homeUpdate = PREDEPARTURE_HOME_UPDATE, updateId = 'predeparture-update',
  className = 'ss-predeparture-guide', stylesheet = '/assets/predeparture-guides.css',
  styleId = 'ss-predeparture-style', trustNote = '공개 자료 확인·점검표 구성',
  limitation = '현장 방문 기록이나 전문 안전 검사가 아닙니다.', worksheets = 3
} = {}) {
const root = process.cwd();
const day = modified.slice(0, 10);
const origin = 'https://shootsense.com';
const changed = new Set(guides.map(guide => `${origin}/${guide.slug}/`));
const serialize = $ => $.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';
const latest = (current, proposed) => Date.parse(current) > Date.parse(proposed) ? current : proposed;

for (const guide of guides) {
  const file = path.join(root, guide.slug, 'index.html');
  const $ = load((await fs.readFile(file, 'utf8')).trimEnd(), { decodeEntities: false });
  if ($('.ss-post-body').length !== 1 || $('.ss-toc').length !== 1) throw new Error(`Unexpected article layout: ${guide.slug}`);
  $('.ss-post').addClass(className);
  if (!$(`link#${styleId}`).length) $('head').append(`<link id="${escapeHtml(styleId)}" rel="stylesheet" href="${escapeHtml(stylesheet)}">`);
  $('.ss-post-body').html(guide.body);
  if (guide.title) {
    $('h1').first().text(guide.title);
    $('title').text(`${guide.title} - 여행정보엑스퍼트`);
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) $(selector).attr('content', guide.title);
    $('.ss-breadcrumb .here').text(guide.title);
  }
  const headings = $('.ss-post-body h2').toArray().map(node => ({ id: $(node).attr('id'), text: $(node).text().replace(/^\d+\.\s*/, '') }));
  if (headings.some(item => !item.id) || new Set(headings.map(item => item.id)).size !== headings.length) throw new Error(`Invalid section identifiers: ${guide.slug}`);
  $('.ss-toc').html(`<div class="ss-toc-head">목차</div><ol>${headings.map(item => `<li><a href="#${escapeHtml(item.id)}">${escapeHtml(item.text)}</a></li>`).join('')}</ol>`);
  $('.ss-post-summary p').first().text(guide.summary);
  $('.ss-trust-note').first().html(`최종 검토일: ${day} · ${escapeHtml(trustNote)}: <a href="/author/">여행엑스퍼트(필명)</a> · ${escapeHtml(limitation)} <a href="/editorial-policy/">편집 원칙</a> · <a href="/contact/">오류 제보</a>`);
  let published;
  $('script[type="application/ld+json"]').each((_, script) => {
    const schema = JSON.parse($(script).text());
    const nodes = schema['@graph'] || [schema];
    for (const node of nodes) {
      const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
      if (guide.title && types.includes('BreadcrumbList')) {
        const last = node.itemListElement?.at(-1);
        if (last?.item && typeof last.item === 'object') last.item.name = guide.title;
        else if (last) last.name = guide.title;
      }
      if (!types.some(type => ['BlogPosting', 'WebPage', 'Article'].includes(type))) continue;
      if (guide.title) {
        node.name = guide.title;
        if (types.some(type => ['BlogPosting', 'Article'].includes(type))) node.headline = guide.title;
      }
      if (types.includes('BlogPosting')) published = node.datePublished?.slice(0, 10);
      node.dateModified = modified;
      node.description = guide.summary;
    }
    $(script).text(JSON.stringify(schema));
  });
  $('.ss-post-meta').html(`${published ? `<span>게시 ${escapeHtml(published)}</span>` : ''}<span>최종 수정 ${day}</span><span>작성 · 여행엑스퍼트(필명)</span>`);
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) $(selector).attr('content', guide.summary);
  for (const selector of ['meta[property="og:updated_time"]', 'meta[property="article:modified_time"]']) $(selector).attr('content', modified);
  $('meta[name="twitter:label2"], meta[name="twitter:data2"]').remove();
  ensureMobileReadingLayout($);
  await writeFileUtf8(file, serialize($));
}

const homeFile = path.join(root, 'index.html');
const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd(), { decodeEntities: false });
if (home('.ss-home-updates').length !== 1) throw new Error('Home revision log is missing');
home(`#${updateId}`).remove();
home('.ss-home-updates').prepend(homeUpdate);
const homeModified = latest(home('meta[property="og:updated_time"]').attr('content'), modified);
home('meta[property="og:updated_time"]').attr('content', homeModified);
home('script.rank-math-schema').each((_, script) => {
  const schema = JSON.parse(home(script).text());
  for (const node of schema['@graph'] || []) if (node['@type'] === 'WebPage') node.dateModified = homeModified;
  home(script).text(JSON.stringify(schema));
});
await writeFileUtf8(homeFile, serialize(home));
const referencePagesUpdated = await syncEditorialReferences(root, guides);

for (const name of ['post-sitemap.xml', 'page-sitemap.xml']) {
  const file = path.join(root, name);
  const $ = load(await fs.readFile(file, 'utf8'), { xml: true });
  const targets = name === 'post-sitemap.xml' ? changed : new Set([`${origin}/`]);
  for (const url of targets) {
    const item = $('url').filter((_, node) => $(node).find('loc').text() === url);
    if (item.length !== 1) throw new Error(`Sitemap entry not unique: ${url}`);
    const date = name === 'page-sitemap.xml' ? latest(item.find('lastmod').text(), modified) : modified;
    if (item.find('lastmod').length) item.find('lastmod').text(date);
    else item.append(`<lastmod>${date}</lastmod>`);
  }
  await writeFileUtf8(file, $.xml().trimEnd() + '\n');
}
const indexFile = path.join(root, 'sitemap_index.xml');
const index = load(await fs.readFile(indexFile, 'utf8'), { xml: true });
index('sitemap').filter((_, node) => /\/(post|page)-sitemap\.xml$/.test(index(node).find('loc').text())).find('lastmod').each((_, node) => index(node).text(latest(index(node).text(), modified)));
await writeFileUtf8(indexFile, index.xml().trimEnd() + '\n');
console.log(JSON.stringify({ rewritten: [...changed], worksheets, homepageLogUpdated: true, referencePagesUpdated }, null, 2));
}

await reviseEditorialBatch(process.argv.includes('--dining') ? DINING_REVISION : process.argv.includes('--banpong-lushan') ? BANPONG_LUSHAN_REVISION : process.argv.includes('--tuyhoa-kodai') ? TUYHOA_KODAI_REVISION : process.argv.includes('--safi-mleiha') ? SAFI_MLEIHA_REVISION : process.argv.includes('--regional') ? REGIONAL_REVISION : undefined);
