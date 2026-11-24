import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { load } from 'cheerio';
import { SAFI_SLUG, MLEIHA_SLUG, SAFI_MLEIHA_GUIDES, SAFI_MLEIHA_MODIFIED, UAE_CAUTION, UAE_SAFETY_URL, UAE_ALERT_URL } from './safi-mleiha-content.mjs';
import { SAFI_MLEIHA_SOURCE_REVIEWS } from './finalize-safi-mleiha-source-review.mjs';
import { BANPONG_LUSHAN_GUIDES, BANPONG_LUSHAN_MODIFIED } from './banpong-lushan-content.mjs';
import { syncEditorialReferences } from './lib/editorial-references.mjs';
const read = async file => load(await fs.readFile(file, 'utf8'));

test('category warning refresh replaces stale text, URL, position or duplicates and is then idempotent', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'shootsense-warning-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const guide = SAFI_MLEIHA_GUIDES[1];
  const warning = guide.categoryWarning;
  const file = path.join(root, warning.path);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const note = (text, url) => `<p id="${warning.id}" class="ss-category-safety-note"><strong>${text}</strong> <a href="${url}">외교부 최신 안내</a></p>`;
  const hero = '<header class="ss-archive-hero">지역 목록</header>';
  const stale = note('2026-10-15 이전 확인', UAE_SAFETY_URL);
  const fresh = note(UAE_CAUTION, UAE_SAFETY_URL);
  for (const markup of [hero, hero + stale, hero + note(UAE_CAUTION, 'https://example.com/old'), fresh + hero, hero + fresh + fresh]) {
    await fs.writeFile(file, `<html><head><meta property="og:updated_time" content="2026-01-01"><link id="ss-regional-style" rel="stylesheet" href="/assets/regional-guides.css"></head><body>${markup}<p id="unrelated">보존</p></body></html>`);
    assert.equal(await syncEditorialReferences(root, [guide]), 1);
    const page = await read(file);
    assert.equal(page(`#${warning.id}`).length, 1);
    assert.equal(page('.ss-archive-hero').next().attr('id'), warning.id);
    assert.equal(page(`#${warning.id} strong`).text(), UAE_CAUTION);
    assert.equal(page(`#${warning.id} a`).attr('href'), UAE_SAFETY_URL);
    assert.equal(page('#unrelated').text(), '보존');
    assert.equal(page('meta[property="og:updated_time"]').attr('content'), '2026-01-01');
    const before = await fs.readFile(file, 'utf8');
    assert.equal(await syncEditorialReferences(root, [guide]), 0);
    assert.equal(await fs.readFile(file, 'utf8'), before);
  }
});

test('eleven reference links disclose unavailable rail pages and partially indexed museum details', async () => {
  const all = SAFI_MLEIHA_SOURCE_REVIEWS.flatMap(review => review.groups.flatMap(group => group.links.map(([, href]) => href)));
  assert.equal(all.length, 11); assert.equal(new Set(all).size, 10);
  for (const review of SAFI_MLEIHA_SOURCE_REVIEWS) {
    const page = await read(`${review.slug}/index.html`);
    const panel = page(`#ss-${review.id}-source-review`);
    const sources = review.groups.flatMap(group => group.links.map(([, href]) => href));
    assert.equal(panel.length, 1);
    assert.equal(panel.find('a').length, review.id === 'safi' ? 5 : 6);
    assert.equal(panel.find('details[open]').length, 0);
    assert.deepEqual(new Set(page('.ss-post-body a[href^="https:"]').toArray().map(node => page(node).attr('href'))), new Set(sources));
    assert.equal(page('#ss-november-recheck').length, 0);
    assert.equal(page('.ss-toc').length, 1);
    assert.equal(page('.ss-post-body h2').length, 6);
  }
  assert.match((await read(`${SAFI_SLUG}/index.html`))('#ss-safi-source-review').text(), /지연으로 내용을 읽지 못했습니다/);
  assert.match((await read(`${MLEIHA_SLUG}/index.html`))('#ss-mleiha-source-review').text(), /시간·요금은 공식 검색 색인/);
});

test('Safi collection and packaging consume the fictional visit window without manufacturing real transfer times', async () => {
  const body = (await read(`${SAFI_SLUG}/index.html`))('.ss-post-body').text();
  assert.equal(110 - 25 - 25 - 20 - 10, 30);
  assert.equal(30 - 20, 10); assert.equal(30 - 35, -5);
  assert.match(body, /30 − 20 = 10분/);
  assert.match(body, /30 − 35 = −5분/);
  assert.match(body, /음수는 관람 가능 시간이 아니라 조건을 다시 짜야 한다는 뜻/);
  assert.match(body, /특정 공방의 약속이나 포장 실측이 아니며/);
  assert.match(body, /최종 입장·체류 허용의 별도 시각은 확인하지 못했습니다/);
  assert.match(body, /ONCF 여행자·판매 페이지는 조회 지연/);
});

test('Mleiha keeps the warning ahead of source details and distinguishes verification from issuance dates', async () => {
  const page = await read(`${MLEIHA_SLUG}/index.html`);
  const first = page('.ss-post-body').children().first();
  assert.ok(first.is('.ss-review-notice:not(.ss-source-review)'));
  assert.ok(first.text().includes(UAE_CAUTION));
  assert.equal(first.find('a').first().attr('href'), UAE_SAFETY_URL);
  assert.equal(first.next().attr('id'), 'ss-mleiha-source-review');
  const body = page('.ss-post-body').text();
  assert.match(body, /2026-11-24는 다시 읽은 날짜이지 새 경보 발령일이 아닙니다/);
  assert.match(body, /3단계\(철수권고\)/);
  assert.ok(page('.ss-post-body a').toArray().some(node => page(node).attr('href') === UAE_ALERT_URL));
  assert.match(body, /도심 박물관으로 바꾸는 것도 현재 관광을 권하는 대안이 아닙니다/);
  assert.match(body, /연결된 사이트 본문을 열지 못했습니다/);
});

test('alternative museum tickets and separate cancellation states are never mandatory sums or automatic refunds', async () => {
  const body = (await read(`${MLEIHA_SLUG}/index.html`))('.ss-post-body').text();
  assert.equal(25 + 10, 35);
  assert.match(body, /25 \+ 10 = 35 AED.*필수 총액으로 제시하지 않습니다/);
  assert.match(body, /믈레이하 센터·사막 체험·차량에는 이 공동권을 적용하지 않습니다/);
  assert.match(body, /체험의 ‘접수’와 별도 차량의 ‘미회신’/);
  assert.match(body, /두 건 모두 취소 완료로 묶지 않습니다/);
  assert.match(body, /전액 환불을 만들어 내지 않습니다/);
});

test('current warning, worksheets, metadata and sitemaps agree without redating previous batches', async () => {
  for (const [file, marker] of [['safi-visit-check.txt', '30-35=-5분은 5분 부족'], ['mleiha-booking-hold.txt', '공지 등록·발령 날짜와 내가 다시 확인한 날짜']]) {
    const sheet = await fs.readFile(`assets/${file}`, 'utf8');
    assert.match(sheet, /자료 검토: 2026-11-24/);
    assert.match(sheet, /비공개/); assert.match(sheet, /인증번호/);
    assert.ok(sheet.includes(marker));
  }
  const home = await read('index.html');
  assert.equal(home('#ss-home-source-review #ss-home-safi-mleiha-review a').length, 2);
  const homeModified = home('meta[property="og:updated_time"]').attr('content');
  assert.ok(Date.parse(homeModified) >= Date.parse(SAFI_MLEIHA_MODIFIED));
  const category = await read('middle-east-travel/index.html');
  assert.ok(category('#ss-uae-review-note').text().includes(UAE_CAUTION));
  const posts = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(posts('url').length, 18);
  for (const guide of SAFI_MLEIHA_GUIDES) {
    const page = await read(`${guide.slug}/index.html`);
    assert.equal(page('meta[property="article:modified_time"]').attr('content'), SAFI_MLEIHA_MODIFIED);
    assert.equal(posts('url').filter((_, node) => posts(node).find('loc').text() === `https://shootsense.com/${guide.slug}/`).find('lastmod').text(), SAFI_MLEIHA_MODIFIED);
  }
  const pages = load(await fs.readFile('page-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(pages('url').filter((_, node) => pages(node).find('loc').text() === 'https://shootsense.com/').find('lastmod').text(), homeModified);
  for (const guide of BANPONG_LUSHAN_GUIDES) assert.equal((await read(`${guide.slug}/index.html`))('meta[property="article:modified_time"]').attr('content'), BANPONG_LUSHAN_MODIFIED);
});
