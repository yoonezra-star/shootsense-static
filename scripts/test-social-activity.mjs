import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { SOCIAL_ACTIVITY_GUIDES, SOCIAL_ACTIVITY_MODIFIED, SOCIAL_ACTIVITY_SLUG, SOCIAL_ACTIVITY_SOURCES } from './social-activity-content.mjs';
import { TRIP_RESET_MODIFIED, TRIP_RESET_SLUG } from './trip-reset-content.mjs';

const guide = SOCIAL_ACTIVITY_GUIDES[0];
const read = async () => load(await fs.readFile(`${guide.slug}/index.html`, 'utf8'));

test('social guide has six distinct sections, a single TOC and a private UTF-8 worksheet', async () => {
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
  assert.ok(sheet.includes(`https://shootsense.com/${SOCIAL_ACTIVITY_SLUG}/`));
  assert.match(sheet, /비공개 개인용/);
  assert.match(sheet, /접수: 확인됨 \/ 요청 중 \/ 미확인/);
  assert.match(sheet, /활동 종료 장소·예상 시각/);
  assert.match(sheet, /해산 후 개인 귀환 경로/);
  assert.match(sheet, /인증번호를 이 문서에 적지 않습니다/);
  assert.ok(!sheet.includes('\ufffd'));
});

test('private guiding is not presented as a guaranteed group meetup or beginner safety ranking', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /별도 단체인 TOKYO FREE GUIDE/);
  assert.match(body, /정해진 합류형 단체 투어가 있다는 뜻은 아닙니다/);
  assert.match(body, /최대 정원이 적혀 있다는 이유만으로.*친목 상품이라고 해석하지 않습니다/);
  assert.match(body, /직접 참가·예약·운영자 회신을 받은 후기가 아니며/);
  assert.match(body, /다른 나라의 모임에.*그대로 적용하지 않습니다/);
  assert.match(body, /교류를 선택하지 않는 날을 실패로 취급하지 않습니다/);
  for (const old of ['초보자에게는 투어와 클래스가 가장 부담이 낮습니다', '교류는 공개된 장소와 낮 시간대가 기준입니다', '부담 낮음']) assert.ok(!body.includes(old));
});

test('operator-specific counts, age wording, booking windows and confirmation stages stay separate', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /참가 최대 5명, 가이드 2명/);
  assert.match(body, /일행 최대 6명, 일행당 가이드 1명/);
  assert.match(body, /20세 초과\(over 20\)/);
  assert.match(body, /20세 이상\(not younger than 20\)/);
  assert.match(body, /2024-11-02/);
  assert.match(body, /1개월 전부터 3일 전까지/);
  assert.match(body, /최대 2개월 전.*적어도 2주 전/);
  assert.match(body, /자동 접수 메일은 신청 등록 단계/);
  assert.match(body, /희망일 2일 전까지 연락이 없으면 배정되지 못한 것/);
  assert.match(body, /별도 통지가 없다고/);
  assert.match(body, /가이드의 자격·경력을 보증하지 않으며/);
});

test('free guiding keeps guide return and meal costs distinct without invented comparative totals', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /종료 후 가이드가 집합 장소로 돌아가는 비용이 포함/);
  assert.match(body, /활동 전후 가이드가 집합 장소를 오가는 비용은 참가자 부담에서 제외/);
  assert.match(body, /활동 중 가이드의 교통·입장·식사/);
  assert.match(body, /정확한 금액은 인원에 따라 이메일로/);
  assert.equal(280 + 1340, 1620);
  assert.equal(1620 + 700, 2320);
  assert.match(body, /1,620엔 = 참가자 280엔 \+ 가이드 2명분 1,340엔/);
  assert.match(body, /합계는 2,320엔/);
  assert.match(body, /700엔은 실제 귀환 운임이 아니며/);
  assert.match(body, /1,620엔도 내 예약의 최종 견적이 아닙니다/);
  assert.match(body, /두 단체의 가격 순위가 아닙니다/);
  assert.match(body, /가이드 귀환 비용을 다시 더하지 않습니다/);
});

test('seasonal route end and approximate duration never imply a return transfer or safety certification', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /1~6월·10~12월.*13:00 출발, 약 3.5시간.*다와라마치역/);
  assert.match(body, /7~9월은 10:00 출발·약 2.5시간.*아사쿠사역/);
  assert.equal(13 * 60 + 3.5 * 60, 16 * 60 + 30);
  assert.match(body, /16:30은 설명상 소요시간을 더한 예상값/);
  assert.match(body, /숙소 도착을 보증하는 시각이 아닙니다/);
  assert.match(body, /‘투어 종료’와 ‘개인 귀환’을 다른 줄/);
  assert.match(body, /공개 장소·낮 시간·고정 종료 시각.*안전하다고 판정하지 않습니다/);
});

test('cancellation exceptions and historical privacy policy retain their limits', async () => {
  const body = (await read())('.ss-post-body').text();
  assert.match(body, /적어도 하루 전에 연락/);
  assert.match(body, /24시간 전이면 모든 지출 전액 환불.*바꾸지 않습니다/);
  assert.match(body, /불가피한 사유에는 예외/);
  assert.match(body, /메일 발송과 취소 완료를 같은 상태로 표시하지 않습니다/);
  assert.match(body, /2016-01-25/);
  assert.match(body, /공식 신청에 필요한 정보인지와 공개 게시글인지/);
  assert.match(body, /현재 신청서의 모든 필수 항목이나 보안 수준까지 확인한 것은 아닙니다/);
  assert.match(body, /객실 번호·예약번호·여권 사본을 올리지 않습니다/);
  assert.match(body, /일회용 인증번호를 가이드에게 전달하지 않으며/);
  assert.match(body, /현재 빈자리·한국어 배정·현장 안전을 확인한 자료도 아닙니다/);
});

test('sources, canonical and metadata preserve original publication with honest revision time', async () => {
  const $ = await read();
  const external = $('.ss-post-body a[href^="https:"]').toArray().map(node => $(node).attr('href'));
  assert.deepEqual(new Set(external), new Set(Object.values(SOCIAL_ACTIVITY_SOURCES)));
  assert.equal($('link[rel="canonical"]').attr('href'), `https://shootsense.com/${guide.slug}/`);
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) assert.equal($(selector).attr('content'), guide.title);
  assert.equal($('meta[property="article:modified_time"]').attr('content'), SOCIAL_ACTIVITY_MODIFIED);
  const graph = JSON.parse($('script.rank-math-schema').text())['@graph'];
  assert.ok(!graph.some(node => node['@type'] === 'FAQPage'));
  for (const node of graph.filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) {
    assert.equal(node.name, guide.title);
    assert.equal(node.description, guide.summary);
    assert.equal(node.dateModified, SOCIAL_ACTIVITY_MODIFIED);
    assert.equal(node.datePublished, '2025-06-10T16:45:58+09:00');
  }
  const last = graph.find(node => node['@type'] === 'BreadcrumbList').itemListElement.at(-1);
  assert.equal(last.item?.name || last.name, guide.title);
});

test('home, category and sitemap references match without redating the previous article', async () => {
  const home = load(await fs.readFile('index.html', 'utf8'));
  assert.equal(home('#social-activity-update').length, 1);
  assert.equal(home('.ss-home-updates').children().first().attr('id'), 'social-activity-update');
  assert.equal(home('#social-activity-update a').attr('href'), `/${SOCIAL_ACTIVITY_SLUG}/`);
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
  assert.equal(item.find('lastmod').text(), SOCIAL_ACTIVITY_MODIFIED);
  const prior = load(await fs.readFile(`${TRIP_RESET_SLUG}/index.html`, 'utf8'));
  assert.equal(prior('meta[property="article:modified_time"]').attr('content'), TRIP_RESET_MODIFIED);
});
