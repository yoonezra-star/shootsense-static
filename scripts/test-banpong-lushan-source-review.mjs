import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { BANPONG_LUSHAN_GUIDES, BANPONG_LUSHAN_MODIFIED, BANPONG_SLUG, LUSHAN_SLUG, LUSHAN_MULTIDAY_URL } from './banpong-lushan-content.mjs';
import { BANPONG_LUSHAN_SOURCE_REVIEWS } from './finalize-banpong-lushan-source-review.mjs';
import { TUYHOA_KODAI_GUIDES, TUYHOA_KODAI_MODIFIED } from './tuyhoa-kodai-content.mjs';
const read = async file => load(await fs.readFile(file, 'utf8'));

test('both guides expose exact scoped references without duplicate TOC or invented verification', async () => {
  assert.equal(BANPONG_LUSHAN_SOURCE_REVIEWS.length, 2);
  for (const review of BANPONG_LUSHAN_SOURCE_REVIEWS) {
    const page = await read(`${review.slug}/index.html`);
    const panel = page(`#ss-${review.id}-source-review`);
    const sources = review.groups.flatMap(group => group.links.map(([, href]) => href));
    assert.equal(new Set(sources).size, review.id === 'banpong' ? 8 : 4);
    assert.equal(panel.length, 1);
    assert.equal(panel.find('a').length, sources.length);
    assert.equal(panel.find('details[open]').length, 0);
    assert.deepEqual(new Set(page('.ss-post-body a[href^="https:"]').toArray().map(node => page(node).attr('href'))), new Set(sources));
    assert.equal(page('.ss-toc').length, 1);
    assert.equal(page('.ss-post-body h2').length, 6);
    assert.equal(page('meta[property="article:modified_time"]').attr('content'), BANPONG_LUSHAN_MODIFIED);
    assert.match(panel.text(), /검색 색인/);
  }
});

test('Ban Pong separates archived event dates, reservation numbers and issued tickets', async () => {
  const body = (await read(`${BANPONG_SLUG}/index.html`))('.ss-post-body').text();
  assert.equal(2566 - 543, 2023);
  assert.equal(new Date(Date.UTC(2023, 1, 25)).getUTCDay(), 6);
  assert.match(body, /행사 날짜·문서 게시일·색인 수집일/);
  assert.match(body, /2566에서 543을 빼면 서력 2023/);
  assert.match(body, /예산연도 표기가 보여도 그것이 시장의 새 행사 날짜라는 뜻은 아닙니다/);
  assert.match(body, /역 결제용 예약번호와 발행된 표는 다릅니다/);
  assert.match(body, /예약번호만 받은 상태를 귀환편 발권 완료로 표시하지 않습니다/);
  assert.match(body, /방문 주의 개최·운행·개별 시설 개방은 미확인/);
});

test('fictional return arithmetic excludes actual train, walking and event-time claims', async () => {
  const body = (await read(`${BANPONG_SLUG}/index.html`))('.ss-post-body').text();
  assert.equal(20 * 60 + 10 - 25 - 15, 19 * 60 + 30);
  assert.equal(20 * 60 + 10 - 25 - 15 - 15, 19 * 60 + 15);
  assert.match(body, /20:10 − 00:25 − 00:15 = 19:30 행사장 출발/);
  assert.match(body, /15분이 더 필요하면 19:15/);
  assert.match(body, /실제 판매 열차·시장 종료·보행 실측이 아닙니다/);
  assert.match(body, /동적 시간표의 실제 열차 행과 특정 날짜 판매 결과를 확정하지 못했습니다/);
});

test('Lushan distinguishes multiday admission from transport validity and service-specific schedules', async () => {
  const page = await read(`${LUSHAN_SLUG}/index.html`);
  const body = page('.ss-post-body').text();
  assert.equal(page(`.ss-post-body a[href="${LUSHAN_MULTIDAY_URL}"]`).length, 1);
  assert.match(body, /본문 게시일이 2025-05-06이며 URL에는 202506/);
  assert.match(body, /구매일부터 7일 안에 핵심구역과 주변 10개 관광구역/);
  assert.match(body, /주변 입장료가 모두 별도라고 단정하지도 않습니다/);
  assert.match(body, /주변으로 가는 차량·케이블카까지 무료라는 뜻은 아닙니다/);
  assert.match(body, /입장권과 차량권의 만료가 같다고 가정하지 않습니다/);
  assert.match(body, /07:30~18:00.*07:45~19:00/);
  assert.match(body, /19:00을 모든 노선·하행의 막차로 고르지 않습니다/);
  assert.match(body, /한국 여권 이용자의 입력·발권·현장 확인 절차를 검증하지 못했습니다/);
});

test('worksheets, home and sitemaps match while preceding reviews retain their dates', async () => {
  for (const [file, marker] of [['banpong-event-return.txt', '역 결제용 예약번호를 발권 완료로 표시하지 않기'], ['lushan-route-tickets.txt', '입장권과 같은 7일로 추정하지 않기']]) {
    const sheet = await fs.readFile(`assets/${file}`, 'utf8');
    assert.match(sheet, /자료 검토: 2026-11-24/);
    assert.match(sheet, /비공개/);
    assert.match(sheet, /인증번호/);
    assert.ok(sheet.includes(marker));
  }
  const home = await read('index.html');
  assert.equal(home('#ss-home-source-review #ss-home-banpong-lushan-review a').length, 2);
  const homeModified = home('meta[property="og:updated_time"]').attr('content');
  assert.ok(Date.parse(homeModified) >= Date.parse(BANPONG_LUSHAN_MODIFIED));
  const graph = JSON.parse(home('script.rank-math-schema').text())['@graph'];
  assert.ok(graph.filter(node => node.dateModified).every(node => node.dateModified === homeModified));
  const posts = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(posts('url').length, 18);
  for (const guide of BANPONG_LUSHAN_GUIDES) assert.equal(posts('url').filter((_, node) => posts(node).find('loc').text() === `https://shootsense.com/${guide.slug}/`).find('lastmod').text(), BANPONG_LUSHAN_MODIFIED);
  const pages = load(await fs.readFile('page-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(pages('url').filter((_, node) => pages(node).find('loc').text() === 'https://shootsense.com/').find('lastmod').text(), homeModified);
  for (const guide of TUYHOA_KODAI_GUIDES) assert.equal((await read(`${guide.slug}/index.html`))('meta[property="article:modified_time"]').attr('content'), TUYHOA_KODAI_MODIFIED);
});
