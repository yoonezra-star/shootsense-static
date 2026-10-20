import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { load } from 'cheerio';
import { JEJU_GUIDES, JEJU_MODIFIED, JEJU_SLUG, JEJU_SOURCES, JEJU_POSTED_EXAMPLES } from './jeju-content.mjs';

const guide = JEJU_GUIDES[0];
const read = async () => load(await fs.readFile(`${JEJU_SLUG}/index.html`, 'utf8'));
const minutes = time => time.split(':').map(Number).reduce((h, m) => h * 60 + m);

test('Jeju has a single-city lodging assumption, five unique sections and one matching TOC', async () => {
  const $ = await read();
  assert.equal($('h1').length, 1);
  assert.equal($('h1').text(), guide.title);
  assert.equal($('.ss-post-summary p').text(), guide.summary);
  assert.equal($('.ss-post.ss-regional-guide').length, 1);
  assert.equal($('link#ss-regional-style').length, 1);
  const ids = $('.ss-post-body h2').toArray().map(node => $(node).attr('id'));
  assert.equal(ids.length, 5);
  assert.equal(new Set(ids).size, 5);
  assert.ok(ids.every(Boolean));
  assert.equal($('.ss-toc').length, 1);
  assert.deepEqual($('.ss-toc a').toArray().map(node => $(node).attr('href')), ids.map(id => `#${id}`));
  assert.match($('.ss-post-body').text(), /특정 객실·체크인·정류장 접근을 확인한 추천이 아닙니다/);
  assert.match($('.ss-post-body').text(), /실제 방문·승차·숙소 이용 후기나 당일 운행 확인이 아닙니다/);
});

test('direction and stop names do not collapse local and limited-stop services or equate Hamdeok with the terminus', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /325번 함덕 방향: 제주국제공항 → 용담사거리 → 관덕정 → 동문로터리/);
  assert.match(body, /한라수목원 방향: 함덕해수욕장 → 동문로터리 → 관덕정 → 제주국제공항/);
  assert.match(body, /관덕정과 동문로터리도 별개의 정류장/);
  assert.match(body, /신사동 종점을 모두 같은 위치로 합치지 않습니다/);
  assert.match(body, /303번.*관덕정은 나열하지 않습니다/);
  assert.match(body, /실제 이동 시간·요금·정차점을 추정하지 않고/);
  assert.match(body, /비용 계산은 325번만 대상으로/);
});

test('posted examples retain source rows, effective dates and elapsed-time arithmetic rather than live claims', async () => {
  assert.deepEqual(JEJU_POSTED_EXAMPLES.map(row => [row.scheduleId, row.row, row.effective]), [[2511, 9, '2026-06-24'], [2512, 15, '2026-06-24']]);
  const outbound = JEJU_POSTED_EXAMPLES[0].points;
  const inbound = JEJU_POSTED_EXAMPLES[1].points;
  assert.deepEqual(outbound, [['제주공항', '12:00'], ['동문로터리', '12:18'], ['함덕', '12:57']]);
  assert.deepEqual(inbound, [['함덕', '16:01'], ['동문로터리', '16:43'], ['제주공항', '16:57']]);
  assert.equal(minutes(outbound[2][1]) - minutes(outbound[1][1]), 39);
  assert.equal(minutes(inbound[1][1]) - minutes(inbound[0][1]), 42);
  assert.equal(minutes(inbound[0][1]) - minutes(outbound[2][1]), 184);
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /2026-06-24/);
  assert.match(body, /184분\(3시간 4분\)/);
  assert.match(body, /측정한 평균 소요시간이나 도착 보장이 아닙니다/);
  assert.match(body, /실제로 운행됐거나 예약 가능한 버스라는 뜻은 아닙니다/);
  assert.match(body, /공항 16:57은 항공 수속 완료 시각이 아님/);
});

test('conflicting last-service summary and table remain unresolved and origin times never become airport times', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /상단은 막차 21:20.*마지막 22회차는 신사동종점 21:05·함덕 21:11·공항 22:08/);
  assert.match(body, /어느 한 값을 확정 막차로 추천하지 않습니다/);
  assert.match(body, /21:05는 한라수목원 열이며 공항 열은 21:45/);
  assert.match(body, /기점 시각과 내가 탈 정류장 시각을 나눠 읽어야/);
  assert.match(body, /‘X’나 공란은 00:00.*임의 해석하지 않습니다/);
  assert.match(body, /담당자에게 이 차이를 문의하거나 답변을 받은 것은 아닙니다/);
});

test('four independent local-bus charges exclude lodging, cards, express fares and assumed discounts', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.equal(1150 * 4, 4600);
  assert.equal(1200 * 4, 4800);
  assert.equal(4800 - 4600, 200);
  assert.match(body, /일반 성인\(19세 이상\)/);
  assert.match(body, /1,150 × 4 = 4,600원/);
  assert.match(body, /1,200 × 4 = 4,800원/);
  assert.match(body, /공항리무진·택시·숙소 보관료와 교통카드 구입비는 포함하지 않았습니다/);
  assert.match(body, /짐이 시내 숙소에 남아 있다면.*바로 가는 것만 계산해서는 여행이 끝나지 않습니다/);
  assert.match(body, /모든 여행자의 요금을 0원으로 표시하지 않습니다/);
});

test('same-number return is not free solely because 39 minutes is less than the 40-minute window', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.equal(minutes('14:39') - minutes('14:00'), 39);
  assert.match(body, /하차 태그 후 40분 이내, 최대 2회/);
  assert.match(body, /같은 LED 노선번호는 왕복을 포함해/);
  assert.match(body, /두 번 모두 같은 325번이라면.*환승할인 대상이라고 볼 수 없습니다/);
  assert.match(body, /이 시각은 실제 운행표가 아니라/);
  assert.match(body, /다른 번호면 어떤 상황에서든 무료라는 뜻은 아닙니다/);
  assert.match(body, /할인 가능 여부를 단말기로 확인하거나 실제 요금 정산을 검증한 기록이 아닙니다/);
});

test('beach access is not swimming-season authorization and bus arrival is not flight check-in', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /조함해안로 525/);
  assert.match(body, /상시 개방.*2026년 해수욕장 개장기간 6월 24일~9월 6일/);
  assert.match(body, /10월 방문에 여름 물놀이 운영시간을 그대로 적용하지 않습니다/);
  assert.match(body, /수영·입수·야간 이용을 권하거나.*시설 운영을 보증하지 않습니다/);
  assert.match(body, /공항 정류장 도착 시각을 보안검색·수속 완료로 바꾸지 않습니다/);
  assert.match(body, /숙소에 맡겼다면 회수 경유와 다음 버스 대기를 다시 넣고/);
});

test('private worksheet, sources and metadata preserve original publication honestly', async () => {
  const $ = await read();
  const download = $('.ss-post-body a[download]');
  assert.equal(download.length, 1);
  const sheet = await fs.readFile(`.${download.attr('href')}`, 'utf8');
  assert.ok(sheet.includes(`https://shootsense.com/${JEJU_SLUG}/`));
  assert.match(sheet, /자료 검토: 2026-10-20/);
  assert.match(sheet, /비공개 개인용/);
  assert.match(sheet, /예약번호·객실번호·결제 인증정보를 적거나 제출하지 않습니다/);
  assert.match(sheet, /0이나 가능 대신 미확인/);
  assert.match(sheet, /공항 정류장 -> 수속 위치/);
  assert.ok(!sheet.includes('\ufffd'));
  assert.equal($('.ss-post-body form').length, 0);
  const external = $('.ss-post-body a[href^="https:"]').toArray().map(node => $(node).attr('href'));
  assert.deepEqual(new Set(external), new Set(Object.values(JEJU_SOURCES)));
  assert.equal($('link[rel="canonical"]').attr('href'), `https://shootsense.com/${JEJU_SLUG}/`);
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) assert.equal($(selector).attr('content'), guide.title);
  assert.equal($('meta[property="article:modified_time"]').attr('content'), JEJU_MODIFIED);
  const graph = JSON.parse($('script.rank-math-schema').text())['@graph'];
  assert.ok(!graph.some(node => node['@type'] === 'FAQPage'));
  for (const node of graph.filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) {
    assert.equal(node.name, guide.title);
    assert.equal(node.description, guide.summary);
    assert.equal(node.dateModified, JEJU_MODIFIED);
    assert.equal(node.datePublished, '2025-05-11T11:31:45+09:00');
  }
});

test('held Jeju reruns leave homepage, sitemaps, Busan and safety notices unchanged', async () => {
  const files = ['index.html', 'post-sitemap.xml', 'page-sitemap.xml', 'sitemap_index.xml', 'honja-busan-yeohaeng-course/index.html', '볼거리가-없어서-오래-머물-수-있었던-무스카트-외곽/index.html', '지도에-별표가-없는-곳에서-보낸-수르의-시간/index.html', '구경이-아니라-머무름에-가까웠던-시아누크빌-외곽/index.html'];
  const before = [];
  for (const file of files) before.push(await fs.readFile(file, 'utf8'));
  const articleBefore = await fs.readFile(`${JEJU_SLUG}/index.html`, 'utf8');
  const result = spawnSync(process.execPath, ['scripts/revise-predeparture-guides.mjs', '--jeju'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /"homepageLogUpdated": false/);
  assert.equal(await fs.readFile(`${JEJU_SLUG}/index.html`, 'utf8'), articleBefore);
  for (let i = 0; i < files.length; i++) assert.equal(await fs.readFile(files[i], 'utf8'), before[i], files[i]);
  const $ = await read();
  assert.equal($('meta[name="robots"]').attr('content'), 'noindex, nofollow, noarchive');
  assert.equal($('script[src*="googlesyndication"], ins.adsbygoogle').length, 0);
  const xml = load(before[1], { xml: true });
  assert.equal(xml('loc').length, 18);
  assert.ok(!xml('loc').toArray().some(node => xml(node).text().includes(JEJU_SLUG)));
});
