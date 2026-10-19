import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { TRIP_RESET_GUIDES, TRIP_RESET_MODIFIED, TRIP_RESET_SLUG, TRIP_RESET_SOURCES } from './trip-reset-content.mjs';
import { CHECKOUT_MORNING_GUIDES, CHECKOUT_MORNING_MODIFIED } from './checkout-morning-content.mjs';

const guide = TRIP_RESET_GUIDES[0];
const read = async () => load(await fs.readFile(`${guide.slug}/index.html`, 'utf8'));

test('trip reset has five distinct sections, a single TOC and a private non-medical worksheet', async () => {
  const $ = await read();
  assert.equal($('h1').length, 1);
  assert.equal($('h1').text(), guide.title);
  assert.equal($('.ss-post.ss-regional-guide').length, 1);
  assert.equal($('link#ss-regional-style').length, 1);
  assert.equal($('.ss-post-summary p').text(), guide.summary);
  const ids = $('.ss-post-body h2').toArray().map(node => $(node).attr('id'));
  assert.equal(ids.length, 5);
  assert.equal(new Set(ids).size, 5);
  assert.ok(ids.every(Boolean));
  assert.equal($('.ss-toc').length, 1);
  assert.deepEqual($('.ss-toc a').toArray().map(node => $(node).attr('href')), ids.map(id => `#${id}`));
  assert.ok($('.ss-toc a').toArray().every(node => !/^\d+\./.test($(node).text())));
  const download = $('.ss-post-body a[download]');
  assert.equal(download.length, 1);
  const sheet = await fs.readFile(`.${download.attr('href')}`, 'utf8');
  assert.match(sheet, /자료 검토: 2026-10-17/);
  assert.ok(sheet.includes(`https://shootsense.com/${TRIP_RESET_SLUG}/`));
  assert.match(sheet, /비공개 개인용/);
  assert.match(sheet, /진단명·상세 증상·치료 기록·예약번호/);
  assert.match(sheet, /이 문서는 감정의 원인·질환·긴급성·회복 시간을 판정하지 않습니다/);
  assert.match(sheet, /이 표나 환불 확인을 기다리지 말고/);
  assert.ok(sheet.indexOf('먼저 연결할 도움') < sheet.indexOf('지출 비교'));
  assert.ok(!sheet.includes('\ufffd'));
});

test('help is not delayed by diagnosis, fixed recovery periods, booking fees or a checklist', async () => {
  const $ = await read();
  const body = $('.ss-post-body').text();
  assert.equal($('.ss-post-body h2').first().attr('id'), 'reset-help-first');
  assert.match(body, /의료진이 작성·감수한 진료 지침이 아닙니다/);
  assert.match(body, /자신이나 다른 사람의 안전을 지키기 어렵거나 즉각적인 도움이 필요하다면/);
  assert.match(body, /예약·비용 표를 작성하느라 도움 요청을 미루지 마세요/);
  assert.match(body, /정해진 기간을 채우거나 특정 점수를 넘을 때까지 기다릴 필요가 없습니다/);
  assert.match(body, /이 글의 표로 긴급성이나 질환 유무를 판정하지 않습니다/);
  assert.match(body, /NHS의 전화·진료 이용 체계는 영국/);
  assert.match(body, /지역 번호나 무료 진료 설명을 다른 여행지에 그대로 적용하지 않습니다/);
  for (const removed of ['외로움은 일정 실패가 아니라 피로 신호일 수 있습니다', '감정이 흔들릴 때 5분 체크리스트', '밝고 익숙한 장소에 앉아 10분 쉽니다']) assert.ok(!body.includes(removed));
  assert.match(body, /치료 안내가 아니라/);
});

test('travel observations are separated from causes and require an actual place to stay', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /원인 추정입니다/);
  assert.match(body, /의료진에게 설명할 수 있지만.*진료를 대신하지 않습니다/);
  assert.match(body, /오늘 이미 체크아웃함/);
  assert.match(body, /숙소의 체류 공간·추가 객실 이용 허용, 짐 회수 조건/);
  assert.match(body, /메시지를 보내기만 하면 의료·현장 지원이 연결됐다는 결론/);
  assert.match(body, /모든 카페·공원·밝은 장소를 누구에게나 안전하거나 회복을 보장하는 장소로 추천하지 않습니다/);
});

test('actual cancellation terms retain exceptions, supplier timezone and received-confirmed status', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /활동 설명·공급자 약관·바우처에 다른 조건이 없을 때/);
  assert.match(body, /24시간을 초과해 앞선 취소/);
  assert.match(body, /16.3.4는 시간·마감 계산에 공급자의 시간대를 사용/);
  assert.match(body, /GetYourGuide가 통지를 받은 시점/);
  assert.match(body, /문의 중이라면 완료라고 표시하지 말고/);
  assert.match(body, /정확히 24시간인 경계의 처리나 예외 환불을 판정하지 않습니다/);
  assert.match(body, /이 마감이나 환불 확인을 기다리라는 뜻은 아닙니다/);
  assert.match(body, /개별 환불 분쟁을 판단하지 않습니다/);
});

test('hypothetical hours and future spending do not imply medical recovery or double-counted losses', async () => {
  const body = (await read())('.ss-post-body').text();
  const start = Date.parse('2026-10-19T14:00:00+09:00');
  assert.equal((start - Date.parse('2026-10-18T13:00:00+09:00')) / 3600000, 25);
  assert.equal((start - Date.parse('2026-10-18T15:00:00+09:00')) / 3600000, 23);
  assert.match(body, /25시간 전/);
  assert.match(body, /23시간 전/);
  assert.equal(20000 - 8000, 12000);
  assert.match(body, /이미 낸 활동비 60,000원.*돌려받지 못한다고 가정/);
  assert.match(body, /이후 지출 차이는 12,000원/);
  assert.match(body, /취소 손실 60,000원을 이미 낸 금액 위에 다시 더하지 않습니다/);
  assert.match(body, /다음 날 여행이 가능한지는 이 계산으로 알 수 없습니다/);
});

test('contact roles, source geography, privacy and original publication remain explicit', async () => {
  const $ = await read();
  const body = $('.ss-post-body').text();
  assert.match(body, /일상 진료와 교통·숙박 예약 변경·취소 같은 사적 업무는 통역 지원 불가능/);
  assert.match(body, /영국 국민 대상 자료/);
  assert.match(body, /한국 여행자의 권리나 내 보험의 보장으로 옮기지 않습니다/);
  assert.match(body, /상세 진단·치료 기록을 일반 채팅이나 공개 후기란에 올리지 않습니다/);
  assert.match(body, /이 사이트에는 개인 건강 정보나 예약번호를 보내지 않습니다/);
  const external = $('.ss-post-body a[href^="https:"]').toArray().map(node => $(node).attr('href'));
  assert.deepEqual(new Set(external), new Set(Object.values(TRIP_RESET_SOURCES)));
  assert.equal($('link[rel="canonical"]').attr('href'), `https://shootsense.com/${guide.slug}/`);
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) assert.equal($(selector).attr('content'), guide.title);
  assert.equal($('meta[property="article:modified_time"]').attr('content'), TRIP_RESET_MODIFIED);
  const graph = JSON.parse($('script.rank-math-schema').text())['@graph'];
  assert.ok(!graph.some(node => node['@type'] === 'FAQPage'));
  for (const node of graph.filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) {
    assert.equal(node.name, guide.title);
    assert.equal(node.description, guide.summary);
    assert.equal(node.dateModified, TRIP_RESET_MODIFIED);
    assert.equal(node.datePublished, '2025-06-08T11:57:24+09:00');
  }
  const last = graph.find(node => node['@type'] === 'BreadcrumbList').itemListElement.at(-1);
  assert.equal(last.item?.name || last.name, guide.title);
});

test('home, category and sitemap references match without redating the checkout guide', async () => {
  const home = load(await fs.readFile('index.html', 'utf8'));
  assert.equal(home('#trip-reset-update').length, 1);
  assert.equal(home('#trip-reset-update a').attr('href'), `/${TRIP_RESET_SLUG}/`);
  assert.ok(Date.parse(home('meta[property="og:updated_time"]').attr('content')) >= Date.parse(TRIP_RESET_MODIFIED));
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
  assert.equal(item.find('lastmod').text(), TRIP_RESET_MODIFIED);
  for (const previous of CHECKOUT_MORNING_GUIDES) {
    const prior = load(await fs.readFile(`${previous.slug}/index.html`, 'utf8'));
    assert.equal(prior('meta[property="article:modified_time"]').attr('content'), CHECKOUT_MORNING_MODIFIED);
  }
});
