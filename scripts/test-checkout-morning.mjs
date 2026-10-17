import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { CHECKOUT_MORNING_GUIDES, CHECKOUT_MORNING_MODIFIED, CHECKOUT_MORNING_SLUG, CHECKOUT_MORNING_SOURCES } from './checkout-morning-content.mjs';
import { BANGKOK_ARRIVAL_GUIDES, BANGKOK_ARRIVAL_MODIFIED } from './bangkok-arrival-content.mjs';

const guide = CHECKOUT_MORNING_GUIDES[0];
const read = async () => load(await fs.readFile(`${guide.slug}/index.html`, 'utf8'));

test('checkout morning has six unique sections, one TOC and a private UTF-8 worksheet', async () => {
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
  const download = $('.ss-post-body a[download]');
  assert.equal(download.length, 1);
  const sheet = await fs.readFile(`.${download.attr('href')}`, 'utf8');
  assert.match(sheet, /자료 검토: 2026-10-17/);
  assert.ok(sheet.includes(`https://shootsense.com/${CHECKOUT_MORNING_SLUG}/`));
  assert.match(sheet, /비공개 개인용/);
  assert.match(sheet, /보관 QR·보관 암호/);
  assert.match(sheet, /빈칸은 미확인/);
  assert.match(sheet, /13:35 관광 종료 기준/);
  assert.ok(!sheet.includes('\ufffd'));
});

test('hotel checkout, same-day storage and onward departure remain distinct', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /가나자와 호텔과 도쿄역 사례는.*한나절 이동 코스가 아닙니다/);
  assert.match(body, /체크아웃을 11:00/);
  assert.match(body, /프런트 짐 보관은 당일만 가능/);
  assert.match(body, /귀중품·식품·위험물·냉장·냉동 물품/);
  assert.match(body, /객실을 저녁까지 쓸 수 있다거나 다음 날 회수해도 된다는 뜻이 아닙니다/);
  assert.match(body, /다른 호텔이나 지점의 규칙으로 옮기지 않습니다/);
  assert.match(body, /보관료를 0엔으로 확정하지 않고/);
  assert.ok(!body.includes('첫 식사는 하루 판단력을 좌우합니다'));
  assert.ok(!body.includes('아침 루틴이 특히 중요한 여행자'));
});

test('station geography, differing service hours and paid entry retain their scope', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /05:30–23:00/);
  assert.match(body, /야에스 남쪽 개찰구 밖, 접수 09:30–20:00/);
  assert.match(body, /GRANSTA 지하 북쪽 개찰구 안/);
  assert.match(body, /이유나 갱신 순서를.*확정하지 않았습니다/);
  assert.match(body, /23:00을 골라 반환 마감으로 쓰거나/);
  assert.match(body, /영업시간 밖 반환이 불가능/);
  assert.match(body, /Suica로 같은 역에 들어갔다 2시간 안에 나올 때.*유료 입장/);
  assert.match(body, /신칸센 개찰구에는 이 서비스로 들어갈 수 없습니다/);
  assert.match(body, /무료 입장·모든 개찰구 통과 보장으로 읽지 않고/);
});

test('per-piece prices and overall baggage restrictions do not become unlimited acceptance', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.equal(1000 + 500, 1500);
  assert.equal(1500 + 1000, 2500);
  assert.equal(2500 - 1500, 1000);
  assert.match(body, /1,000 \+ S 구간 500 = 1,500엔/);
  assert.match(body, /1,500 \+ 100cm 이하 1,000 = 2,500엔/);
  assert.match(body, /이동비·개찰구 입장료·추가 이용일·별도 필수 비용을 아직 더하지 않았습니다/);
  assert.match(body, /캐리어 위의 가방·종이봉투도 별도 과금/);
  assert.match(body, /세 변 합 200cm 이하·무게 30kg 이하/);
  assert.match(body, /‘161cm 이상’ 구간은 무제한 크기를 받는다는 뜻이 아닙니다/);
  assert.match(body, /야에스 남쪽 창구와 같은 시설이 아닙니다/);
});

test('backward clock uses the earlier collection limit and explicitly fictional durations', async () => {
  const body = (await read())('.ss-post-body').text();
  const departure = 16 * 60;
  const collection = departure - 20 - 35;
  assert.equal(collection, 15 * 60 + 5);
  assert.equal(collection - 10 - 30 - 15, 14 * 60 + 10);
  assert.equal(Math.min(collection, 14 * 60 + 30) - 10 - 30 - 15, 13 * 60 + 35);
  assert.match(body, /14:10/);
  assert.match(body, /14:30까지 회수 완료.*별도 가정/);
  assert.match(body, /15:05가 아니라 14:30/);
  assert.match(body, /관광 종료 기준은 13:35/);
  assert.match(body, /모든 분 수와 열차는 방법을 설명하기 위한 가정/);
  assert.match(body, /실제로 20분 전이면 충분하다거나/);
  assert.match(body, /마감 직전을 목표로 삼지 않도록/);
});

test('delivery cutoff, expected arrival and a booked flight are not interchangeable', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /11:00 접수 마감, 16:00 이후 도착 예상/);
  assert.match(body, /07:00–21:00의 창구 영업시간이 전부 당일 배송 접수시간인 것도 아닙니다/);
  assert.match(body, /16:00 이후라는 예상은 정확히 16:00 수령이나 내 비행편 탑승을 보장하지 않습니다/);
  assert.match(body, /배송을 신청하거나 개별 수령 가능 답변을 받은 것이 아닙니다/);
  assert.match(body, /역무원이 영업시간 밖에 대신 꺼내 줄 것이라고 가정하지 않습니다/);
  assert.match(body, /위 질문을 운영자에게 실제로 보내거나 회신을 받은 기록이 아닙니다/);
});

test('sources and metadata agree with the article without changing original publication', async () => {
  const $ = await read();
  const external = $('.ss-post-body a[href^="https:"]').toArray().map(node => $(node).attr('href'));
  assert.deepEqual(new Set(external), new Set(Object.values(CHECKOUT_MORNING_SOURCES)));
  assert.equal($('link[rel="canonical"]').attr('href'), `https://shootsense.com/${guide.slug}/`);
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) assert.equal($(selector).attr('content'), guide.title);
  assert.equal($('meta[property="article:modified_time"]').attr('content'), CHECKOUT_MORNING_MODIFIED);
  const graph = JSON.parse($('script.rank-math-schema').text())['@graph'];
  assert.ok(!graph.some(node => node['@type'] === 'FAQPage'));
  for (const node of graph.filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) {
    assert.equal(node.name, guide.title);
    assert.equal(node.description, guide.summary);
    assert.equal(node.dateModified, CHECKOUT_MORNING_MODIFIED);
    assert.equal(node.datePublished, '2025-06-16T23:14:36+09:00');
  }
  const last = graph.find(node => node['@type'] === 'BreadcrumbList').itemListElement.at(-1);
  assert.equal(last.item?.name || last.name, guide.title);
});

test('home and category references match while earlier Bangkok review date survives', async () => {
  const home = load(await fs.readFile('index.html', 'utf8'));
  assert.equal(home('#checkout-morning-update').length, 1);
  assert.equal(home('#checkout-morning-update a').attr('href'), `/${CHECKOUT_MORNING_SLUG}/`);
  assert.ok(Date.parse(home('meta[property="og:updated_time"]').attr('content')) >= Date.parse(CHECKOUT_MORNING_MODIFIED));
  const categoryHtml = await fs.readFile('travel-tips/index.html', 'utf8');
  const category = load(categoryHtml);
  assert.ok(categoryHtml.includes(guide.title));
  assert.ok(!categoryHtml.includes(guide.previousTitle));
  const cover = category('a[href]').filter((_, node) => category(node).attr('href').includes(guide.slug)).find('img').first();
  assert.equal(cover.attr('alt'), guide.title);
  const xml = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(xml('url').length, 18);
  const item = xml('url').filter((_, node) => xml(node).find('loc').text() === `https://shootsense.com/${guide.slug}/`);
  assert.equal(item.length, 1);
  assert.equal(item.find('lastmod').text(), CHECKOUT_MORNING_MODIFIED);
  for (const previous of BANGKOK_ARRIVAL_GUIDES) {
    const prior = load(await fs.readFile(`${previous.slug}/index.html`, 'utf8'));
    assert.equal(prior('meta[property="article:modified_time"]').attr('content'), BANGKOK_ARRIVAL_MODIFIED);
  }
});
