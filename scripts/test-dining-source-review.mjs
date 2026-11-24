import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { DINING_MODIFIED, DINING_SLUG, DINING_SOURCES } from './dining-content.mjs';
import { DINING_REVIEW_GROUPS } from './finalize-dining-source-review.mjs';
import { CHECKOUT_MORNING_MODIFIED } from './checkout-morning-content.mjs';
import { BANGKOK_ARRIVAL_MODIFIED } from './bangkok-arrival-content.mjs';
const read = async file => load(await fs.readFile(file, 'utf8'));

test('nine official references are grouped by scope with no invented visits or payment tests', async () => {
  assert.equal(Object.keys(DINING_SOURCES).length, 9);
  assert.equal(DINING_REVIEW_GROUPS.length, 5);
  assert.equal(new Set(DINING_REVIEW_GROUPS.flatMap(group => group.keys)).size, 9);
  const page = await read(`${DINING_SLUG}/index.html`);
  assert.equal(page('#ss-dining-source-review').length, 1);
  assert.equal(page('#ss-dining-source-review a').length, 9);
  assert.equal(page('#ss-dining-source-review details[open]').length, 0);
  assert.match(page('#ss-dining-source-review').text(), /직접 식사·예약·결제를 확인한 후기는 아닙니다/);
  assert.equal(page('.ss-toc').length, 1);
  assert.equal(page('.ss-post-body h2').length, 6);
});

test('included seat fee and a general branch charge are not silently added together', async () => {
  const page = await read(`${DINING_SLUG}/index.html`);
  const body = page('.ss-post-body').text();
  assert.equal(5100 + 385, 5485);
  assert.match(body, /16:00부터 1인당 좌석료 385엔/);
  assert.match(body, /5,100엔이며 좌석료 포함/);
  assert.match(body, /5,100 \+ 385 = 5,485엔.*중복할 수 있습니다/);
  assert.match(body, /최종 결제액을 보장하지 않습니다/);
});

test('clock deadlines, elapsed service limits and late priority loss retain their boundaries', async () => {
  const page = await read(`${DINING_SLUG}/index.html`);
  const body = page('.ss-post-body').text();
  assert.match(body, /음식 마지막 주문 22:00, 음료 22:30, 폐점 23:00/);
  assert.match(body, /22:15.*음식 주문 가능을 뜻하지 않습니다/);
  assert.equal(19 * 60 + 31 - 19 * 60, 31);
  assert.match(body, /19:31.*우선 대상에서 벗어나는 경우/);
  assert.match(body, /정확히 19:30인 경계.*판정하지 않으며/);
  assert.match(body, /예약 취소·환불 결과가 같다고 보지도 않습니다/);
  assert.match(body, /알레르겐과의 접촉 방지를 보장하지 않는다고/);
});

test('worksheet, home and sitemaps agree while earlier reviews and original publication survive', async () => {
  const page = await read(`${DINING_SLUG}/index.html`);
  assert.equal(page('meta[property="article:modified_time"]').attr('content'), DINING_MODIFIED);
  const graph = JSON.parse(page('script.rank-math-schema').text())['@graph'];
  assert.equal(graph.find(node => node['@type'] === 'BlogPosting').datePublished, '2025-06-04T16:49:56+09:00');
  const home = await read('index.html');
  assert.equal(home('#ss-home-source-review #ss-home-dining-review').length, 1);
  assert.ok(Date.parse(home('meta[property="og:updated_time"]').attr('content')) >= Date.parse(DINING_MODIFIED));
  for (const [slug, modified] of [['honja-yeohaeng-achim-routine', CHECKOUT_MORNING_MODIFIED], ['honja-southeast-asia-safety', BANGKOK_ARRIVAL_MODIFIED]]) {
    assert.equal((await read(`${slug}/index.html`))('meta[property="article:modified_time"]').attr('content'), modified);
  }
  const map = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(map('url').length, 18);
  assert.equal(map('url').filter((_, node) => map(node).find('loc').text().endsWith(`/${DINING_SLUG}/`)).find('lastmod').text(), DINING_MODIFIED);
  const sheet = await fs.readFile('assets/dining-order-check.txt', 'utf8');
  assert.match(sheet, /자료 검토: 2026-11-24/);
  assert.match(sheet, /음식 마지막 주문 \/ 음료 마지막 주문 \/ 폐점/);
  assert.match(sheet, /일반 좌석료와 선택 세트의 포함 조건/);
  assert.match(sheet, /카드번호·여권번호·의료정보를 적거나 사이트에 보내지 마세요/);
});
