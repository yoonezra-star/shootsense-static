import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { CHECKOUT_MORNING_SOURCES, CHECKOUT_MORNING_SLUG } from './checkout-morning-content.mjs';
import { REVIEW_MODIFIED, SOURCE_REVIEW_ROWS } from './finalize-checkout-source-review.mjs';
import { BANGKOK_ARRIVAL_MODIFIED } from './bangkok-arrival-content.mjs';
const read = async file => load(await fs.readFile(file, 'utf8'));

test('seven official references use current addresses and both Sagawa language versions', async () => {
  const page = await read(`${CHECKOUT_MORNING_SLUG}/index.html`);
  const urls = page('.ss-post-body a[href^="https:"]').toArray().map(node => page(node).attr('href'));
  assert.equal(Object.keys(CHECKOUT_MORNING_SOURCES).length, 7);
  assert.deepEqual(new Set(urls), new Set(Object.values(CHECKOUT_MORNING_SOURCES)));
  assert.ok(!urls.some(url => url.includes('/english/faq/') || url.includes('/servicecenter/tokyo_station.html')));
  assert.match(page('.ss-post-body').text(), /도쿄역은 3시간 이내/);
  assert.match(page('.ss-post-body').text(), /크기 상한이 지점마다 다르므로/);
});

test('review provenance covers seven sources in four bounded groups without changing TOC', async () => {
  const page = await read(`${CHECKOUT_MORNING_SLUG}/index.html`);
  assert.equal(SOURCE_REVIEW_ROWS.length, 4);
  assert.equal(new Set(SOURCE_REVIEW_ROWS.flatMap(row => row.keys)).size, 7);
  assert.equal(page('#ss-storage-recheck').length, 1);
  assert.equal(page('#ss-storage-recheck details').length, 1);
  assert.equal(page('#ss-storage-recheck a').length, 7);
  assert.equal(page('.ss-toc').length, 1);
  assert.equal(page('.ss-post-body h2').length, 6);
  assert.match(page('#ss-storage-recheck').text(), /현장 접수·공간·교통 연결의 확인이 아닙니다/);
  assert.match(page('#ss-storage-recheck').text(), /당일 이용·빈자리·개별 회수 승인은 확인하지 못했습니다/);
});

test('article, tool, home and corresponding sitemaps agree on the scoped review timestamp', async () => {
  for (const file of [`${CHECKOUT_MORNING_SLUG}/index.html`, 'tools/departure-check/index.html', 'index.html']) {
    const page = await read(file);
    const expected = file === 'index.html' ? BANGKOK_ARRIVAL_MODIFIED : REVIEW_MODIFIED;
    assert.equal(page('meta[property="og:updated_time"]').attr('content'), expected);
    const graph = JSON.parse(page('script.rank-math-schema').text())['@graph'];
    assert.ok(graph.filter(node => node.dateModified).every(node => node.dateModified === expected));
  }
  for (const [file, routes] of [['post-sitemap.xml', [`/${CHECKOUT_MORNING_SLUG}/`]], ['page-sitemap.xml', ['/', '/tools/departure-check/']]]) {
    const map = load(await fs.readFile(file, 'utf8'), { xml: true });
    for (const route of routes) assert.equal(map('url').filter((_, node) => map(node).find('loc').text() === `https://shootsense.com${route}`).find('lastmod').text(), route === '/' ? BANGKOK_ARRIVAL_MODIFIED : REVIEW_MODIFIED);
  }
  const article = await read(`${CHECKOUT_MORNING_SLUG}/index.html`);
  assert.equal(JSON.parse(article('script.rank-math-schema').text())['@graph'].find(node => node['@type'] === 'BlogPosting').datePublished, '2025-06-16T23:14:36+09:00');
});

test('worksheet and current homepage note expose the review while other guides retain their dates', async () => {
  const sheet = await fs.readFile('assets/checkout-morning-check.txt', 'utf8');
  assert.match(sheet, /자료 검토: 2026-11-24/);
  assert.match(sheet, /언어·지점별 상한/);
  const home = await read('index.html');
  assert.equal(home('#ss-home-directory #ss-home-source-review').length, 1);
  assert.equal(home('.ss-home-updates > li').first().attr('id'), 'november-recovery-update');
  const departure = await read('tools/departure-check/index.html');
  assert.match(departure('.ss-source-note').text(), /14:10 게시 원문 재대조/);
  assert.ok(!departure('.ss-source-note').text().includes('현행 조건 미확인'));
  const arrival = await read('honja-southeast-asia-safety/index.html');
  assert.equal(arrival('meta[property="article:modified_time"]').attr('content'), BANGKOK_ARRIVAL_MODIFIED);
});
