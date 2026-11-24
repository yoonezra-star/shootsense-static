import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { organizeHomeReviews, START_PAGES_MODIFIED, TRAVEL_START_ROUTES } from './refresh-start-pages.mjs';
import { PACKING_REVIEW_MODIFIED } from './finalize-packing-source-review.mjs';
import { LODGING_REVIEW_MODIFIED } from './finalize-lodging-source-review.mjs';
const read = async file => load(await fs.readFile(file, 'utf8'));

test('review normalization preserves groups, dates and targets while becoming a closed native list exactly once', () => {
  const page = load('<section><p id="ss-home-source-review"><time datetime="2026-11-24">2026.11.24 자료 재대조</time> · <a href="/a/#source">A</a><span id="pair"> · <a href="/b/#source">B</a> · <a href="/c/#source">객실 관찰·조치 재확인 재대조</a></span></p></section>');
  organizeHomeReviews(page);
  assert.equal(page('#ss-home-review-records').length, 1);
  assert.equal(page('#ss-home-review-records[open]').length, 0);
  assert.equal(page('#ss-home-source-review .ss-review-index>li').length, 2);
  assert.equal(page('#ss-home-source-review #pair a').length, 2);
  assert.equal(page('#ss-home-source-review time').attr('datetime'), '2026-11-24');
  assert.deepEqual(page('#ss-home-source-review a').toArray().map(node => page(node).attr('href')), ['/a/#source', '/b/#source', '/c/#source']);
  assert.equal(page('#pair a').last().text(), '객실 관찰·조치 재확인');
  const before = page.html(); organizeHomeReviews(page); assert.equal(page.html(), before);
});

test('home prioritizes four core guides and retains every dated review behind a single disclosure', async () => {
  const page = await read('index.html');
  assert.equal(page('.ss-home-intro + [aria-labelledby="home-guides-title"]').length, 1);
  assert.equal(page('[aria-labelledby="home-guides-title"] .ss-guide-list>li').length, 4);
  assert.equal(page('#ss-home-start-hub a').attr('href'), '/travel-tips/');
  assert.equal(page('#ss-home-directory #ss-home-review-records').length, 1);
  assert.equal(page('#ss-home-review-records[open]').length, 0);
  assert.equal(page('#ss-home-source-review a').length, 17);
  assert.equal(new Set(page('#ss-home-source-review a').toArray().map(node => page(node).attr('href'))).size, 17);
  assert.match(page('#ss-home-source-review').text(), /2026.11.24 자료 재대조/);
  assert.match(page('#ss-home-method').text(), /현장 방문 후기나 실시간 예약·운행 확인 서비스는 아닙니다/);
  assert.match(page('.ss-home-intro .ss-lead').text(), /일본 현지 시각 기준/);
  assert.equal(page('#ss-home-directory>p').first().text(), '여행 도구 5개 · 계산 분석 3개 · 가이드 18개');
});

test('six task routes cover every existing tips article and five tools without including held pages', async () => {
  const page = await read('travel-tips/index.html');
  assert.equal(page('.ss-category-guide .ss-start-routes>li').length, 6);
  assert.equal(page('.ss-category-matrix').length, 0);
  assert.equal(page('#ss-tips-articles-title').length, 1);
  assert.equal(page('.ss-archive-grid>article').length, 9);
  const routeLinks = page('.ss-route-links a').toArray().map(node => page(node).attr('href'));
  assert.deepEqual(routeLinks, TRAVEL_START_ROUTES.flatMap(route => route.links.map(([, href]) => href)));
  const archiveLinks = new Set(page('.ss-archive-grid a').toArray().map(node => new URL(page(node).attr('href'), 'https://shootsense.com/travel-tips/').pathname.replace(/\/$/, '')));
  assert.ok([...archiveLinks].every(href => routeLinks.some(link => link.replace(/\/$/, '') === href)));
  const links = page('.ss-category-guide a').toArray().map(node => page(node).attr('href'));
  for (const route of ['stay-compare', 'trip-board', 'arrival-check', 'departure-check', 'reservation-deadlines']) assert.ok(links.includes(`/tools/${route}/`));
  for (const href of routeLinks) {
    const target = await read(href.slice(1) + 'index.html');
    assert.ok(!/noindex/.test(target('meta[name="robots"]').attr('content') || ''));
  }
});

test('scope distinguishes Japan-specific calculations and real help from a general information hub', async () => {
  const page = await read('travel-tips/index.html');
  assert.match(page('.ss-start-routes>li').eq(2).text(), /일본 현지 시각/);
  assert.match(page('.ss-start-routes>li').eq(4).text(), /식사·교류는 일본 사례/);
  assert.match(page('.ss-start-routes>li').last().text(), /사이트 문의는 실시간 신고 창구가 아닙니다/);
  assert.match(page('.ss-tips-start-head').text(), /모든 정보를 다시 검증한 날짜는 아닙니다/);
  assert.equal(page('#ss-tips-directory a[href="/guides/?type=guides&topic=support"]').length, 1);
});

test('only navigation pages advance and metadata matches visible scope without redating source articles', async () => {
  for (const file of ['index.html', 'travel-tips/index.html']) {
    const page = await read(file);
    assert.equal(page('meta[property="og:updated_time"]').attr('content'), START_PAGES_MODIFIED);
    assert.equal(page('#ss-travel-start-style').length, 1);
    const graph = JSON.parse(page('script.rank-math-schema').text())['@graph'];
    for (const node of graph.filter(node => ['WebPage', 'CollectionPage'].includes(node['@type']))) {
      assert.equal(node.dateModified, START_PAGES_MODIFIED);
      assert.equal(node.description, page('meta[name="description"]').attr('content'));
    }
  }
  assert.equal((await read('honja-yeohaeng-junbimul-checklist/index.html'))('meta[property="article:modified_time"]').attr('content'), PACKING_REVIEW_MODIFIED);
  assert.equal((await read('honja-yeohaeng-sukso-goreuneun-beop/index.html'))('meta[property="article:modified_time"]').attr('content'), LODGING_REVIEW_MODIFIED);
  assert.equal((await read('privacy-policy/index.html'))('meta[property="og:updated_time"]').attr('content'), '2026-11-24T13:06:00+09:00');
  const map = load(await fs.readFile('page-sitemap.xml', 'utf8'), { xml: true });
  for (const url of ['https://shootsense.com/', 'https://shootsense.com/travel-tips/']) assert.equal(map('url').filter((_, node) => map(node).find('loc').text() === url).find('lastmod').text(), START_PAGES_MODIFIED);
  assert.equal(load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true })('url').length, 18);
});
