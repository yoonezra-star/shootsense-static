import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { PREPARATION_SAFETY_MODIFIED } from './predeparture-content.mjs';
import { PREPARATION_SAFETY_REVIEWS } from './finalize-preparation-safety-source-review.mjs';
import { ARTICLE_CASES } from '../assets/article-cases.js';
import { calculateArrival } from '../assets/arrival-math.js';

const read = async file => load(await fs.readFile(file, 'utf8'));

for (const review of PREPARATION_SAFETY_REVIEWS) {
  test(`${review.id}: sources distinguish checked facts from unconfirmed personal conditions`, async () => {
    const page = await read(`${review.slug}/index.html`);
    const panel = page(`#ss-${review.id}-source-review`);
    assert.equal(panel.length, 1);
    assert.equal(panel.find('details[open]').length, 0);
    assert.equal(panel.find('summary').text(), '확인한 출처와 남아 있는 조건');
    assert.equal(panel.find('li').length, 3);
    assert.equal(panel.find('a').length, 3);
    assert.equal(panel.find('li p strong').filter((_, node) => page(node).text() === '미확인 범위').length, 3);
    assert.equal(page('.ss-post-body > p').eq(1).next().attr('id'), `ss-${review.id}-source-review`);
    assert.equal(page('meta[property="article:modified_time"]').attr('content'), PREPARATION_SAFETY_MODIFIED);
    assert.match(page('.ss-trust-note').text(), /최종 검토일: 2026-11-24/);
    assert.equal(page('.ss-post-body h2').length, 6);
    assert.equal(page('.ss-toc').length, 1);
    const graph = JSON.parse(page('script.rank-math-schema').text())['@graph'];
    for (const node of graph.filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) assert.equal(node.dateModified, PREPARATION_SAFETY_MODIFIED);
  });
}

test('departure article calculation agrees with the Japan-only explicit-load case and stops after a missed service', async () => {
  const page = await read('honja-yeohaeng-junbi-gijun/index.html');
  const example = ARTICLE_CASES['arrival-last-service'];
  const result = calculateArrival(example.inputs);
  assert.equal(result.zone, 'Asia/Tokyo');
  assert.equal(result.scenarios[0].boardingArrival, '2026-12-10T22:40');
  assert.equal(result.scenarios[0].boardingMargin, -40);
  assert.equal(result.scenarios[0].hotelArrival, null);
  const body = page('.ss-post-body').text();
  assert.match(body, /21:40 \+ 00:45 \+ 00:15 = 22:40/);
  assert.match(body, /22:00 목표보다 40분 늦습니다/);
  assert.match(body, /일본 현지 날짜·시각\(Asia\/Tokyo\) 전용/);
  assert.match(body, /출발 시각과 탑승 마감도 분리/);
  assert.match(body, /답변 대기는 완료가 아닙니다/);
  assert.equal(page('.ss-post-body a[href="/tools/arrival-check/#case=arrival-last-service"]').length, 1);
  assert.equal(page('.ss-post-body a[href="/tools/reservation-deadlines/"]').length, 1);
});

test('room guide puts urgent help before sources and never turns a repair reply or price into a safety score', async () => {
  const page = await read('honja-sukso-anjeon-checklist/index.html');
  assert.match(page('.ss-post-body > p').eq(1).text(), /점검이나 사진 촬영을 계속하지 말고 현지 긴급기관/);
  const body = page('.ss-post-body').text();
  assert.match(body, /문제 발견 · 조치 예정/);
  assert.match(body, /회신만으로 완료 처리하지 않음/);
  assert.match(body, /그 항목만 조치 후 재확인/);
  assert.match(body, /이 도구에는 객실의 안전을 검증하는 기능이 없습니다/);
  assert.match(body, /피난 방해 없이 정상 사용 범위/);
  assert.equal(page('.ss-post-body a[href="/tools/stay-compare/"]').length, 1);
});

test('preparation and room worksheets include usable evidence and unresolved-state fields', async () => {
  const departure = await fs.readFile('assets/departure-decision-sheet.txt', 'utf8');
  const room = await fs.readFile('assets/room-arrival-check.txt', 'utf8');
  for (const sheet of [departure, room]) assert.match(sheet, /양식 검토: 2026-11-24/);
  assert.match(departure, /검색 요약 \/ 운영사 일반 안내 \/ 해당 예약에 대한 답변/);
  assert.match(departure, /별도의 발권·수하물·탑승 마감/);
  assert.match(departure, /그 시한까지 답이 없을 때 변경·보류할 예약/);
  assert.match(room, /수리 예정 회신 -> 문제 발견·조치 예정 \(완료 아님\)/);
  assert.match(room, /객실 번호·출입 코드를 공개/);
});

test('home and sitemaps reflect only the two refreshed guides without changing historical logs or privacy review', async () => {
  const home = await read('index.html');
  assert.equal(home('#ss-home-preparation-safety-review').length, 1);
  assert.equal(home('#ss-home-preparation-safety-review a').length, 2);
  assert.equal(home('.ss-home-updates > li').first().attr('id'), 'november-recovery-update');
  assert.ok(Date.parse(home('meta[property="og:updated_time"]').attr('content')) >= Date.parse(PREPARATION_SAFETY_MODIFIED));
  const map = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(map('url').length, 18);
  for (const review of PREPARATION_SAFETY_REVIEWS) assert.equal(map('url').filter((_, node) => map(node).find('loc').text() === `https://shootsense.com/${review.slug}/`).find('lastmod').text(), PREPARATION_SAFETY_MODIFIED);
  const privacy = await read('privacy-policy/index.html');
  assert.equal(privacy('meta[property="og:updated_time"]').attr('content'), '2026-11-24T13:06:00+09:00');
});
