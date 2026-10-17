import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { BANGKOK_ARRIVAL_GUIDES, BANGKOK_ARRIVAL_MODIFIED, BANGKOK_ARRIVAL_SLUG, BANGKOK_ARRIVAL_SOURCES } from './bangkok-arrival-content.mjs';
import { DINING_GUIDES, DINING_MODIFIED } from './dining-content.mjs';

const guide = BANGKOK_ARRIVAL_GUIDES[0];
const read = async () => load(await fs.readFile(`${guide.slug}/index.html`, 'utf8'));

test('arrival guide has a bounded scope, six unique sections and one matching TOC', async () => {
  const $ = await read();
  assert.equal($('h1').length, 1);
  assert.equal($('h1').text(), guide.title);
  assert.equal($('.ss-post.ss-regional-guide').length, 1);
  assert.equal($('link#ss-regional-style').length, 1);
  assert.equal($('.ss-post-summary p').text(), guide.summary);
  const ids = $('.ss-post-body h2').toArray().map(node => $(node).attr('id'));
  assert.equal(ids.length, 6);
  assert.equal(new Set(ids).size, 6);
  assert.ok(ids.every(Boolean));
  assert.equal($('.ss-toc').length, 1);
  assert.deepEqual($('.ss-toc a').toArray().map(node => $(node).attr('href')), ids.map(id => `#${id}`));
  assert.ok($('.ss-toc a').toArray().every(node => !/^\d+\./.test($(node).text())));
  assert.match($('.ss-post-body').text(), /돈므앙\(DMK\)이나 다른 나라 공항에.*적용하지 않습니다/);
  assert.match($('.ss-post-body').text(), /현장 방문 후기나 특정 교통수단의 안전 인증이 아닙니다/);
});

test('boarding locations and posted service hours do not imply dispatch or a last departure', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /B1층.*05:30–24:00/);
  assert.match(body, /Gate 4–7 안쪽 차선\(Inner curb\).*대기표/);
  assert.match(body, /Gate 4 바깥쪽 차선\(Outer curb\)/);
  assert.match(body, /즉시 배차나 대기시간 0분을 뜻하지 않습니다/);
  assert.match(body, /해당 역의 실제 출발표/);
  assert.match(body, /하차 뒤 환승편도 확인 대상/);
  assert.match(body, /내 카드의 현재 결제 성공이나 숙소까지 직통 이동의 증거는 아닙니다/);
});

test('PIN matching and announced future Airport Pickup remain separate', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /2026-09-21 발표/);
  assert.match(body, /처음에는 특정 기사·차량을 즉시 지정하지 않는 방식/);
  assert.match(body, /대기 구역 A–D/);
  assert.match(body, /4분기 출시 예정.*구역 E/);
  assert.match(body, /내 계정에 이미 출시됐다고 결론 내리지 않습니다/);
  assert.match(body, /발표의 픽업 보장·대기·취소 설명도 모든 Grab 호출에 적용하지 않습니다/);
  assert.match(body, /예약하거나 앱 기능을 실제 시험하지 않았습니다/);
  assert.match(body, /계정 로그인·은행·카드의 문자 인증번호를 대신 요구하는 절차로 이해하지 않습니다/);
});

test('worked examples cross midnight and do not masquerade as measured times or final fares', async () => {
  const body = (await read())('.ss-post-body').text();
  const minutes = 23 * 60 + 55 + 15;
  assert.equal(Math.floor(minutes / 1440), 1);
  assert.equal(minutes % 1440, 10);
  assert.equal(22 * 60 + 55 + 15, 23 * 60 + 10);
  assert.match(body, /17일 23:10.*실제 막차·탑승 가능은 미확인/);
  assert.match(body, /18일 00:10.*철도를 확정할 수 없음/);
  assert.match(body, /보통 걸리는 시간이나 권장 여유시간이 아닙니다/);
  assert.equal(320 + 60 + 50, 430);
  assert.match(body, /320 \+ 60 \+ 50 = 430바트/);
  assert.match(body, /수하물 등 다른 비용은 계산하지 않았습니다/);
  assert.match(body, /일반 택시의 항목을 VIP·Grab·숙소 픽업에 그대로 더하지 않고/);
  assert.match(body, /모든 공항 택시에 단 하나의 법적 요금 방식만 있다고 단정하지 않습니다/);
});

test('private worksheet retains sources, dates, unknowns and sensitive-data exclusions', async () => {
  const $ = await read();
  const download = $('.ss-post-body a[download]');
  assert.equal(download.length, 1);
  const sheet = await fs.readFile(`.${download.attr('href')}`, 'utf8');
  assert.match(sheet, /자료 검토: 2026-10-17/);
  assert.ok(sheet.includes(`https://shootsense.com/${BANGKOK_ARRIVAL_SLUG}/`));
  assert.match(sheet, /비공개/);
  assert.match(sheet, /승차 PIN·객실 출입 비밀번호는 적지 마세요/);
  assert.match(sheet, /빈칸은.*미확인/);
  assert.match(sheet, /18일 00:10/);
  assert.ok(!sheet.includes('\ufffd'));
  const external = $('.ss-post-body a[href^="https:"]').toArray().map(node => $(node).attr('href'));
  assert.deepEqual(new Set(external), new Set(Object.values(BANGKOK_ARRIVAL_SOURCES)));
  const body = $('.ss-post-body').text();
  assert.match(body, /교통이 운행한다는 사실은 국가·지역의 여행경보 해제를 뜻하지 않습니다/);
  assert.match(body, /태국 국가정보에서 실제 방문 지역/);
  assert.match(body, /2026-09-29 공항 공지.*당시 호우/);
  assert.match(body, /예보 대상 기간은 10월 5–14일/);
  assert.match(body, /현재 공항이 중단됐거나 반대로 정상화됐다고 판정하지 않습니다/);
  assert.match(body, /사이트에 전송되는 입력 양식이 아닙니다/);
  assert.match(body, /숙소·교통 제공자와 다른 연결을 확인해야 합니다/);
});

test('original URL and publication date survive with matching metadata and fresh sitemap date', async () => {
  const $ = await read();
  assert.equal($('link[rel="canonical"]').attr('href'), `https://shootsense.com/${guide.slug}/`);
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) assert.equal($(selector).attr('content'), guide.title);
  assert.equal($('meta[property="article:modified_time"]').attr('content'), BANGKOK_ARRIVAL_MODIFIED);
  const graph = JSON.parse($('script.rank-math-schema').text())['@graph'];
  assert.ok(!graph.some(node => node['@type'] === 'FAQPage'));
  for (const node of graph.filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) {
    assert.equal(node.name, guide.title);
    assert.equal(node.description, guide.summary);
    assert.equal(node.dateModified, BANGKOK_ARRIVAL_MODIFIED);
    assert.equal(node.datePublished, '2025-05-17T10:07:38+09:00');
  }
  const last = graph.find(node => node['@type'] === 'BreadcrumbList').itemListElement.at(-1);
  assert.equal(last.item?.name || last.name, guide.title);
  const xml = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(xml('url').length, 18);
  const item = xml('url').filter((_, node) => xml(node).find('loc').text() === `https://shootsense.com/${guide.slug}/`);
  assert.equal(item.length, 1);
  assert.equal(item.find('lastmod').text(), BANGKOK_ARRIVAL_MODIFIED);
});

test('home and category references agree and earlier dining revision is not redated', async () => {
  const home = load(await fs.readFile('index.html', 'utf8'));
  assert.equal(home('#bangkok-arrival-update').length, 1);
  assert.equal(home('.ss-home-updates').children().first().attr('id'), 'bangkok-arrival-update');
  const categoryHtml = await fs.readFile('southeast-asia-travel/index.html', 'utf8');
  const category = load(categoryHtml);
  assert.ok(categoryHtml.includes(guide.title));
  assert.ok(!categoryHtml.includes(guide.previousTitle));
  const cover = category('a[href]').filter((_, node) => category(node).attr('href').includes(guide.slug)).find('img').first();
  assert.equal(cover.attr('alt'), guide.title);
  assert.ok(Date.parse(home('meta[property="og:updated_time"]').attr('content')) >= Date.parse(BANGKOK_ARRIVAL_MODIFIED));
  for (const previous of DINING_GUIDES) {
    const prior = load(await fs.readFile(`${previous.slug}/index.html`, 'utf8'));
    assert.equal(prior('meta[property="article:modified_time"]').attr('content'), DINING_MODIFIED);
  }
});
