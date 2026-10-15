import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { ensureMobileReadingLayout, escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';
import { PREDEPARTURE_GUIDES, PREDEPARTURE_HOME_UPDATE, PREDEPARTURE_MODIFIED } from './predeparture-content.mjs';

const root = process.cwd();
const day = PREDEPARTURE_MODIFIED.slice(0, 10);
const origin = 'https://shootsense.com';
const changed = new Set(PREDEPARTURE_GUIDES.map(guide => `${origin}/${guide.slug}/`));
const serialize = $ => $.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';

for (const guide of PREDEPARTURE_GUIDES) {
  const file = path.join(root, guide.slug, 'index.html');
  const $ = load((await fs.readFile(file, 'utf8')).trimEnd(), { decodeEntities: false });
  if ($('.ss-post-body').length !== 1 || $('.ss-toc').length !== 1) throw new Error(`Unexpected article layout: ${guide.slug}`);
  $('.ss-post-body').html(guide.body);
  const headings = $('.ss-post-body h2').toArray().map(node => ({ id: $(node).attr('id'), text: $(node).text() }));
  if (headings.some(item => !item.id) || new Set(headings.map(item => item.id)).size !== headings.length) throw new Error(`Invalid section identifiers: ${guide.slug}`);
  $('.ss-toc').html(`<div class="ss-toc-head">목차</div><ol>${headings.map(item => `<li><a href="#${escapeHtml(item.id)}">${escapeHtml(item.text)}</a></li>`).join('')}</ol>`);
  $('.ss-post-summary p').first().text(guide.summary);
  $('.ss-trust-note').first().html(`최종 검토일: ${day} · 공개 자료 확인·점검표 구성: <a href="/author/">여행엑스퍼트(필명)</a> · 현장 방문 기록이나 전문 안전 검사가 아닙니다. <a href="/editorial-policy/">편집 원칙</a> · <a href="/contact/">오류 제보</a>`);
  let published;
  $('script[type="application/ld+json"]').each((_, script) => {
    const schema = JSON.parse($(script).text());
    const nodes = schema['@graph'] || [schema];
    for (const node of nodes) {
      const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
      if (!types.some(type => ['BlogPosting', 'WebPage', 'Article'].includes(type))) continue;
      if (types.includes('BlogPosting')) published = node.datePublished?.slice(0, 10);
      node.dateModified = PREDEPARTURE_MODIFIED;
      node.description = guide.summary;
    }
    $(script).text(JSON.stringify(schema));
  });
  $('.ss-post-meta').html(`${published ? `<span>게시 ${escapeHtml(published)}</span>` : ''}<span>최종 수정 ${day}</span><span>작성 · 여행엑스퍼트(필명)</span>`);
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) $(selector).attr('content', guide.summary);
  for (const selector of ['meta[property="og:updated_time"]', 'meta[property="article:modified_time"]']) $(selector).attr('content', PREDEPARTURE_MODIFIED);
  $('meta[name="twitter:label2"], meta[name="twitter:data2"]').remove();
  ensureMobileReadingLayout($);
  await writeFileUtf8(file, serialize($));
}

const homeFile = path.join(root, 'index.html');
const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd(), { decodeEntities: false });
if (home('.ss-home-updates').length !== 1) throw new Error('Home revision log is missing');
home('#predeparture-update').remove();
home('.ss-home-updates').prepend(PREDEPARTURE_HOME_UPDATE);
home('meta[property="og:updated_time"]').attr('content', PREDEPARTURE_MODIFIED);
home('script.rank-math-schema').each((_, script) => {
  const schema = JSON.parse(home(script).text());
  for (const node of schema['@graph'] || []) if (node['@type'] === 'WebPage') node.dateModified = PREDEPARTURE_MODIFIED;
  home(script).text(JSON.stringify(schema));
});
await writeFileUtf8(homeFile, serialize(home));

for (const name of ['post-sitemap.xml', 'page-sitemap.xml']) {
  const file = path.join(root, name);
  const $ = load(await fs.readFile(file, 'utf8'), { xml: true });
  const targets = name === 'post-sitemap.xml' ? changed : new Set([`${origin}/`]);
  for (const url of targets) {
    const item = $('url').filter((_, node) => $(node).find('loc').text() === url);
    if (item.length !== 1) throw new Error(`Sitemap entry not unique: ${url}`);
    if (item.find('lastmod').length) item.find('lastmod').text(PREDEPARTURE_MODIFIED);
    else item.append(`<lastmod>${PREDEPARTURE_MODIFIED}</lastmod>`);
  }
  await writeFileUtf8(file, $.xml().trimEnd() + '\n');
}
const indexFile = path.join(root, 'sitemap_index.xml');
const index = load(await fs.readFile(indexFile, 'utf8'), { xml: true });
index('sitemap').filter((_, node) => /\/(post|page)-sitemap\.xml$/.test(index(node).find('loc').text())).find('lastmod').text(PREDEPARTURE_MODIFIED);
await writeFileUtf8(indexFile, index.xml().trimEnd() + '\n');
console.log(JSON.stringify({ rewritten: [...changed], worksheets: 3, homepageLogUpdated: true }, null, 2));
