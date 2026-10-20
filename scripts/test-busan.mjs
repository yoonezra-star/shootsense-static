import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { load } from 'cheerio';
import { BUSAN_GUIDES, BUSAN_MODIFIED, BUSAN_SLUG, BUSAN_SOURCES } from './busan-content.mjs';

const guide = BUSAN_GUIDES[0];
const read = async () => load(await fs.readFile(`${BUSAN_SLUG}/index.html`, 'utf8'));

test('Busan has a bounded rail-arrival scope, six unique sections and one usable TOC', async () => {
  const $ = await read();
  assert.equal($('h1').length, 1);
  assert.equal($('h1').text(), guide.title);
  assert.equal($('.ss-post-summary p').text(), guide.summary);
  assert.equal($('.ss-post.ss-regional-guide').length, 1);
  assert.equal($('link#ss-regional-style').length, 1);
  const ids = $('.ss-post-body h2').toArray().map(node => $(node).attr('id'));
  assert.equal(ids.length, 6);
  assert.equal(new Set(ids).size, 6);
  assert.ok(ids.every(Boolean));
  assert.equal($('.ss-toc').length, 1);
  assert.deepEqual($('.ss-toc a').toArray().map(node => $(node).attr('href')), ids.map(id => `#${id}`));
  assert.match($('.ss-post-body').text(), /철도로 부산역에 도착해 도시철도 1·2호선을 이용하는 성인 1명/);
  assert.match($('.ss-post-body').text(), /직접 방문·승차·보관함 사용 후기가 아니며/);
  assert.match($('.ss-trust-box').text(), /공개 자료 대조 · 보관 원고 개편/);
  assert.ok(!$('.ss-trust-box').text().includes('숙소 위치, 이동 동선, 식사 난이도, 야간 도착 가능성을 우선 확인했습니다'));
});

test('directions separate the two arrival stations, Seomyeon internal transfer and Sinhaeundae', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /모든 장거리 버스가 철도 부산역에 도착한다고 가정하지 않습니다/);
  assert.match(body, /1호선 ‘부산’을 철도역 대합실의 보관소로 옮겨 읽지 않습니다/);
  assert.match(body, /다대포해수욕장 방향.*중앙을 지나 남포/);
  assert.match(body, /노포 방향 → 서면 → 2호선 장산 방향 → 해운대/);
  assert.match(body, /2호선 양산 방향 → 서면 → 1호선 다대포해수욕장 방향/);
  assert.match(body, /개찰구 밖으로 나가지 않고.*이용 횟수를 자동으로 두 번으로 세지 않습니다/);
  assert.match(body, /해운대역과 동해선 신해운대역은 같은 역이 아닙니다/);
  assert.match(body, /최단시간 검색 결과나 당일 운행 보증이 아닙니다/);
});

test('three-ride upper bound and four-ride lower bound do not depend on invented route fares', async () => {
  const body = (await read())('.ss-post-body').text();
  for (const a of [1600, 1800]) for (const b of [1600, 1800]) for (const c of [1600, 1800]) assert.ok(a + b + c <= 5400 && a + b + c < 6000);
  assert.equal(1600 * 2, 3200);
  assert.equal(6000 - 3200, 2800);
  assert.equal(1800 * 3, 5400);
  assert.equal(6000 - 5400, 600);
  assert.equal(1600 * 4 - 6000, 400);
  assert.match(body, /서면 환승이 있다고 다섯 번으로 부풀리지 않습니다/);
  assert.match(body, /이 세 번의 특정 구간 운임을 확정한 것은 아니지만/);
  assert.match(body, /할인·우대·시간초과 부가금·타 교통수단 환승 없이/);
  assert.match(body, /QR승차권만 이용할 사람에게는 QR 운임으로 계산/);
  assert.match(body, /교통카드가 없다면 카드 구입비·충전 잔액도 별도/);
});

test('validity conflict and excluded modes remain unresolved rather than silently chosen', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /최초 개표일 당일/);
  assert.match(body, /발매당일 무제한 사용/);
  assert.match(body, /두 페이지의 표현이 달라/);
  assert.match(body, /미리 구매한 표의 이용일.*유효성을 확정하지 않습니다/);
  assert.match(body, /1일권을 개표 후 24시간권이라고 설명하지 않습니다/);
  assert.match(body, /버스·동해선·부산김해경전철을 이용할 수 없다/);
  assert.match(body, /직접 문의하거나 답변을 받은 것은 아닙니다/);
});

test('multimodal transfer eligibility is not confused with internal metro transfer or unlimited re-entry', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /선불·후불 교통카드 이용 조건/);
  assert.match(body, /하차 후 30분 이내 승차·2회까지/);
  assert.match(body, /같은 교통수단을 다시 이용하면 적용하지 않으며/);
  assert.match(body, /버스를 사이에 넣으면 도시철도 재승차도 무조건 무료.*해석하지 않습니다/);
  assert.match(body, /무료 재입장 제도로 확대하지 않습니다/);
});

test('locker base fees stay line-specific, three-hour and separate from live capacity and rail station storage', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /기본요금을 3시간 기준/);
  assert.match(body, /37×27×55cm에 2,000원/);
  assert.match(body, /42×30×55cm에 평일 2,500원·주말 2,700원/);
  assert.equal(2500 - 2000, 500);
  assert.equal(2700 - 2000, 700);
  assert.match(body, /3시간을 넘기면 추가요금이 호선별로 달라/);
  assert.match(body, /설치 수량은 현재 남은 빈칸.*보증이 아닙니다/);
  assert.match(body, /철도 부산역의 보관소·숙소 수하물 보관에 도시철도 보관함 요금을 적용하지 않습니다/);
  const $ = await read();
  const download = $('.ss-post-body a[download]');
  assert.equal(download.length, 1);
  const sheet = await fs.readFile(`.${download.attr('href')}`, 'utf8');
  assert.match(sheet, /자료 검토: 2026-10-20/);
  assert.ok(sheet.includes(`https://shootsense.com/${BUSAN_SLUG}/`));
  assert.match(sheet, /비공개 개인용/);
  assert.match(sheet, /0 대신 미확인/);
  assert.match(sheet, /보관함 비밀번호·인증번호를 적거나 제출하지 않습니다/);
  assert.ok(!sheet.includes('\ufffd'));
});

test('original publication survives and source links match the visible claims', async () => {
  const $ = await read();
  const external = $('.ss-post-body a[href^="https:"]').toArray().map(node => $(node).attr('href'));
  assert.deepEqual(new Set(external), new Set(Object.values(BUSAN_SOURCES)));
  assert.equal($('link[rel="canonical"]').attr('href'), `https://shootsense.com/${BUSAN_SLUG}/`);
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) assert.equal($(selector).attr('content'), guide.title);
  assert.equal($('meta[property="article:modified_time"]').attr('content'), BUSAN_MODIFIED);
  const graph = JSON.parse($('script.rank-math-schema').text())['@graph'];
  assert.ok(!graph.some(node => node['@type'] === 'FAQPage'));
  for (const node of graph.filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) {
    assert.equal(node.name, guide.title);
    assert.equal(node.description, guide.summary);
    assert.equal(node.dateModified, BUSAN_MODIFIED);
    assert.equal(node.datePublished, '2025-05-09T14:29:16+09:00');
  }
});

test('held revision preserves noindex, no ads, homepage and sitemaps on repeated standalone runs', async () => {
  const untouched = ['index.html', 'post-sitemap.xml', 'page-sitemap.xml', 'sitemap_index.xml', 'honja-yeohaeng-social-activity/index.html'];
  const before = [];
  for (const file of untouched) before.push(await fs.readFile(file, 'utf8'));
  const articleBefore = await fs.readFile(`${BUSAN_SLUG}/index.html`, 'utf8');
  const result = spawnSync(process.execPath, ['scripts/revise-predeparture-guides.mjs', '--busan'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /"homepageLogUpdated": false/);
  assert.equal(await fs.readFile(`${BUSAN_SLUG}/index.html`, 'utf8'), articleBefore);
  for (let i = 0; i < untouched.length; i++) assert.equal(await fs.readFile(untouched[i], 'utf8'), before[i], untouched[i]);
  const $ = await read();
  assert.equal($('meta[name="robots"]').attr('content'), 'noindex, nofollow, noarchive');
  assert.equal($('script[src*="googlesyndication"], ins.adsbygoogle').length, 0);
  const sitemap = load(before[1], { xml: true });
  assert.equal(sitemap('loc').length, 18);
  assert.ok(!sitemap('loc').toArray().some(node => sitemap(node).text().includes(BUSAN_SLUG)));
});
