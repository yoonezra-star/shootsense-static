import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { BANGKOK_ARRIVAL_MODIFIED, BANGKOK_ARRIVAL_SLUG, BANGKOK_ARRIVAL_SOURCES } from './bangkok-arrival-content.mjs';
import { BANGKOK_REVIEW_GROUPS } from './finalize-bangkok-source-review.mjs';
import { CHECKOUT_MORNING_MODIFIED } from './checkout-morning-content.mjs';
const read = async file => load(await fs.readFile(file, 'utf8'));

test('nine official pages form four source groups with an explicit untested app boundary', async () => {
  assert.equal(Object.keys(BANGKOK_ARRIVAL_SOURCES).length, 9);
  assert.equal(BANGKOK_REVIEW_GROUPS.length, 4);
  assert.equal(new Set(BANGKOK_REVIEW_GROUPS.flatMap(group => group.keys)).size, 9);
  const page = await read(`${BANGKOK_ARRIVAL_SLUG}/index.html`);
  const aside = page('#ss-bangkok-source-review');
  assert.equal(aside.length, 1);
  assert.equal(aside.find('a').length, 9);
  assert.equal(aside.find('details[open]').length, 0);
  assert.match(aside.text(), /앱 로그인·예약 시험은 하지 않았고/);
  assert.match(aside.text(), /당일 마지막 출발·대기·배차·최종 지출은 확인하지 않았습니다/);
});

test('three Grab modes never turn a release quarter or an omitted airport into verified availability', async () => {
  const page = await read(`${BANGKOK_ARRIVAL_SLUG}/index.html`);
  const table = page('#arrival-grab-pin').nextAll('figure').first();
  assert.equal(table.find('tbody tr').length, 3);
  assert.match(table.text(), /Schedule regular pickup/);
  assert.match(table.text(), /Schedule airport pickup/);
  const body = page('.ss-post-body').text();
  assert.match(body, /미출시를 확정하지도 않습니다/);
  assert.match(body, /현재 제공 범위는 확정하지 못했으므로/);
  assert.match(body, /두 공지는 과거 상황의 기록/);
  assert.ok(!body.includes('10월 17일 현재 공항'));
  assert.equal(page('.ss-toc').length, 1);
  assert.equal(page('.ss-post-body h2').length, 6);
});

test('article and home modification dates advance while checkout remains independently reviewed', async () => {
  const page = await read(`${BANGKOK_ARRIVAL_SLUG}/index.html`);
  assert.equal(page('meta[property="article:modified_time"]').attr('content'), BANGKOK_ARRIVAL_MODIFIED);
  const graph = JSON.parse(page('script.rank-math-schema').text())['@graph'];
  assert.equal(graph.find(node => node['@type'] === 'BlogPosting').datePublished, '2025-05-17T10:07:38+09:00');
  const home = await read('index.html');
  assert.equal(home('#ss-home-source-review #ss-home-bangkok-review').length, 1);
  assert.ok(Date.parse(home('meta[property="og:updated_time"]').attr('content')) >= Date.parse(BANGKOK_ARRIVAL_MODIFIED));
  assert.equal(home('.ss-home-updates > li').first().attr('id'), 'november-recovery-update');
  const checkout = await read('honja-yeohaeng-achim-routine/index.html');
  assert.equal(checkout('meta[property="article:modified_time"]').attr('content'), CHECKOUT_MORNING_MODIFIED);
  const map = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(map('url').length, 18);
  assert.equal(map('url').filter((_, node) => map(node).find('loc').text().endsWith(`/${BANGKOK_ARRIVAL_SLUG}/`)).find('lastmod').text(), BANGKOK_ARRIVAL_MODIFIED);
});

test('worksheet separates original product names, flight linkage and notice validity without storing secrets', async () => {
  const sheet = await fs.readFile('assets/bangkok-arrival-check.txt', 'utf8');
  assert.match(sheet, /자료 검토: 2026-11-24/);
  assert.match(sheet, /공지 발표일·대상 기간/);
  assert.match(sheet, /Schedule regular pickup \/ Schedule airport pickup/);
  assert.match(sheet, /항공편 연동 여부/);
  assert.match(sheet, /승차 PIN·객실 출입 비밀번호는 적지 마세요/);
  const page = await read(`${BANGKOK_ARRIVAL_SLUG}/index.html`);
  assert.equal(page('script.rank-math-schema').text().includes('FAQPage'), false);
  assert.equal(page('.ss-post-body a[download]').length, 1);
});
