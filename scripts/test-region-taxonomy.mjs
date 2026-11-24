import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { matchesGuide, readGuideFilters } from '../assets/guide-search.js';
import { readHubEntries, REGION_LABELS, HUB_MODIFIED } from './build-guide-hub.mjs';
import { CATEGORY_MAP } from './lib/site-config.mjs';
import { normalizeRegionIdentity, REGION_TAXONOMY_MODIFIED } from './sync-region-taxonomy.mjs';
import { SAFI_SLUG, MLEIHA_SLUG, SAFI_MLEIHA_MODIFIED, UAE_CAUTION } from './safi-mleiha-content.mjs';
const read = async file => load(await fs.readFile(file, 'utf8'));
const records = entries => entries.map(entry => ({ ...entry, text: `${entry.title} ${entry.summary} ${entry.keywords}` }));

test('country regions identify Morocco and UAE while retaining the mena group URL', async () => {
  const entries = records(await readHubEntries());
  const find = region => entries.filter(entry => matchesGuide(entry, { region })).map(entry => entry.href).sort();
  assert.equal(entries.length, 26);
  assert.deepEqual(find('morocco'), [`/${SAFI_SLUG}/`]);
  assert.deepEqual(find('uae'), [`/${MLEIHA_SLUG}/`]);
  assert.deepEqual(find('mena'), [`/${SAFI_SLUG}/`, `/${MLEIHA_SLUG}/`].sort());
  assert.equal(REGION_LABELS.morocco, '모로코');
  assert.equal(REGION_LABELS.uae, '아랍에미리트(UAE)');
  for (const region of ['mena', 'morocco', 'uae']) assert.equal(readGuideFilters(`?region=${region}`).region, region);
  assert.equal(readGuideFilters('?region=__proto__').region, 'all');
  assert.ok(matchesGuide({ region: 'mena' }, { region: 'mena' }));
});

test('country filters compose with type, topic and multilingual search without leaking other countries', async () => {
  const entries = records(await readHubEntries());
  const find = filters => entries.filter(entry => matchesGuide(entry, filters));
  assert.equal(find({ region: 'morocco', topic: 'regional', type: 'guides', query: 'Morocco Safi' }).length, 1);
  assert.equal(find({ region: 'uae', query: '아랍에미리트 믈레이하' }).length, 1);
  assert.equal(find({ region: 'morocco', query: 'UAE' }).length, 0);
  assert.equal(find({ region: 'uae', query: '사피' }).length, 0);
  assert.equal(find({ region: 'mena', type: 'tools' }).length, 0);
  assert.equal(find({ region: 'morocco', topic: 'stay' }).length, 0);
});

test('directory options and visible country labels match data while canonical remains unfiltered', async () => {
  const page = await read('guides/index.html');
  assert.equal(page('link[rel="canonical"]').attr('href'), 'https://shootsense.com/guides/');
  assert.equal(page('[data-guide-row]').length, 26);
  for (const region of ['morocco', 'uae', 'mena']) assert.equal(page(`#guide-region option[value="${region}"]`).length, 1);
  assert.equal(page('[data-guide-row][data-region="morocco"]').length, 1);
  assert.equal(page('[data-guide-row][data-region="uae"]').length, 1);
  assert.match(page('[data-region="morocco"] .ss-directory-label').text(), /모로코/);
  assert.match(page('[data-region="uae"] .ss-directory-label').text(), /아랍에미리트/);
});

test('identity normalization handles relative category URLs and structured data without rewriting body prose or dates', () => {
  const page = load('<html><head><meta property="article:section" content="중동"><script type="application/ld+json">{"@graph":[{"@type":"BlogPosting","articleSection":"중동","datePublished":"2025-01-01","dateModified":"2026-01-01"},{"@type":"BreadcrumbList","itemListElement":[{"item":{"@id":"https://shootsense.com/middle-east-travel/","name":"중동"}}]}]}</script></head><body><nav><a href="../middle-east-travel/index.html" target="_blank" rel="noopener" aria-label="중동">중동</a><a href="https://example.com/middle-east-travel/">중동</a></nav><article class="ss-post-body"><p>중동 지역의 과거 기록입니다.</p></article></body></html>');
  normalizeRegionIdentity(page, 'sample/index.html');
  assert.equal(page('nav a').first().text(), CATEGORY_MAP['middle-east-travel'].name);
  assert.equal(page('nav a').first().attr('target'), '_blank');
  assert.equal(page('nav a').first().attr('rel'), 'noopener');
  assert.equal(page('nav a').last().text(), '중동');
  assert.equal(page('.ss-post-body').text(), '중동 지역의 과거 기록입니다.');
  const graph = JSON.parse(page('script').text())['@graph'];
  assert.equal(graph[0].articleSection, '중동·북아프리카');
  assert.equal(graph[0].datePublished, '2025-01-01');
  assert.equal(graph[0].dateModified, '2026-01-01');
  assert.equal(graph[1].itemListElement[0].item.name, '중동·북아프리카');
  const before = page.html(); normalizeRegionIdentity(page, 'sample/index.html'); assert.equal(page.html(), before);
});

test('MENA category explains separate country conditions and retains the UAE warning before other content', async () => {
  const page = await read('middle-east-travel/index.html');
  assert.equal(page('.ss-archive-hero h1').text(), CATEGORY_MAP['middle-east-travel'].name);
  assert.equal(page('meta[name="description"]').attr('content'), CATEGORY_MAP['middle-east-travel'].description);
  assert.equal(page('.ss-archive-hero').next().attr('id'), 'ss-uae-review-note');
  assert.ok(page('#ss-uae-review-note').text().includes(UAE_CAUTION));
  assert.equal(page('#ss-category-directory').next().attr('id'), 'ss-mena-country-links');
  assert.equal(page('#ss-mena-country-links a').length, 2);
  assert.match(page('.ss-category-guide').text(), /같은 경보를 모로코에 적용하지 않습니다/);
  assert.equal(page('.ss-archive-card').length, 2);
  for (const slug of [SAFI_SLUG, MLEIHA_SLUG]) assert.ok(page('.ss-archive-card a.ti').toArray().some(node => decodeURIComponent(page(node).attr('href')).includes(slug)));
  assert.equal(page('link[rel="canonical"]').attr('href'), 'https://shootsense.com/middle-east-travel/');
});

test('normal public navigation and article section metadata agree without restoring held pages', async () => {
  const collect = async directory => {
    const files = [];
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (['.git', '.github', '.wrangler', 'node_modules', 'scripts', 'content', 'wp-content', 'assets', 'cdn-cgi', 'playwright-artifacts', 'test-results'].includes(entry.name)) continue;
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await collect(file));
      else if (entry.name === 'index.html' || entry.name === '404.html') files.push(file);
    }
    return files;
  };
  let held = 0;
  for (const file of await collect('.')) {
    const page = await read(file);
    if (/noindex/.test(page('meta[name="robots"]').attr('content') || '') && page('.ss-post').length) held++;
    if (file === '404.html') continue;
    const links = page('#masthead a[href], .ss-site-footer a[href]').filter((_, node) => {
      const url = new URL(page(node).attr('href'), `https://shootsense.com/${file.replaceAll('\\', '/')}`);
      return url.origin === 'https://shootsense.com' && /\/middle-east-travel\/(index\.html)?$/.test(url.pathname);
    });
    assert.ok(links.length >= 3, file);
    assert.ok(links.toArray().every(node => page(node).text() === '중동·북아프리카'), file);
    assert.equal(page('meta[property="article:section"][content="중동"]').length, 0, file);
  }
  assert.equal(held, 7);
});

test('home and directory dates advance but source review and privacy dates remain independent', async () => {
  const home = await read('index.html');
  assert.equal(home('#ss-home-directory #ss-home-region-review a').length, 2);
  assert.equal(home('meta[property="og:updated_time"]').attr('content'), REGION_TAXONOMY_MODIFIED);
  for (const slug of [SAFI_SLUG, MLEIHA_SLUG]) {
    const page = await read(`${slug}/index.html`);
    assert.equal(page('meta[property="article:modified_time"]').attr('content'), SAFI_MLEIHA_MODIFIED);
    assert.equal(page('meta[property="article:section"]').attr('content'), '중동·북아프리카');
  }
  const privacy = await read('privacy-policy/index.html');
  assert.equal(privacy('meta[property="og:updated_time"]').attr('content'), '2026-11-24T13:06:00+09:00');
  const pageMap = load(await fs.readFile('page-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(pageMap('url').filter((_, node) => pageMap(node).find('loc').text() === 'https://shootsense.com/guides/').find('lastmod').text(), HUB_MODIFIED);
  const postMap = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(postMap('url').length, 18);
  assert.ok(postMap('lastmod').toArray().every(node => postMap(node).text() !== REGION_TAXONOMY_MODIFIED));
});
