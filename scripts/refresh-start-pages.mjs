import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';
import { readHubEntries } from './build-guide-hub.mjs';

export const START_PAGES_MODIFIED = '2026-11-25T00:20:00+09:00';
export const TRAVEL_START_ROUTES = [
  { title: '숙소를 예약하기 전', scope: '공통 · 비용·계약', text: '같은 기간의 이용 비용과 취소 손실을 나누고, 미확인 추가금·체크인 답변을 남깁니다.', links: [['숙소 선택 기준', '/honja-yeohaeng-sukso-goreuneun-beop/'], ['숙소 비용 비교', '/tools/stay-compare/']] },
  { title: '출발 준비를 정리할 때', scope: '공통 · 준비·연락', text: '입국·교통·입실 조건을 확인하는 순서와 통신이 끊겼을 때 읽을 자료를 구분합니다.', links: [['출발 결정표', '/honja-yeohaeng-junbi-gijun/'], ['준비물·오프라인 점검', '/honja-yeohaeng-junbimul-checklist/']] },
  { title: '일본 도착·출발을 맞출 때', scope: '일본 현지 시각 · 일정', text: '공항 도착과 객실 입실, 짐 회수와 다음 교통편의 마감을 각각 대조합니다. 실제 운행은 별도 확인합니다.', links: [['도착·체크인 검토', '/tools/arrival-check/'], ['출발일 일정 검토', '/tools/departure-check/'], ['도쿄 짐 보관·회수 기준', '/honja-yeohaeng-achim-routine/']] },
  { title: '예약·일정을 바꿔야 할 때', scope: '공통 · 변경·마감', text: '바꿀 일정, 예약별 원문 시간대, 요청 전달과 완료 회신을 구분합니다. 취소·환불을 자동 처리하지 않습니다.', links: [['일정 변경·도움 요청', '/honja-yeohaeng-gamjeong-gwanri/'], ['예약 마감 달력', '/tools/reservation-deadlines/']] },
  { title: '현장 이용 조건을 확인할 때', scope: '객실 공통 · 식사·교류는 일본 사례', text: '객실의 미해결 문제, 주문·결제 조건, 가이드 배정과 귀환을 다른 확인 항목으로 봅니다.', links: [['객실 도착 점검', '/honja-sukso-anjeon-checklist/'], ['식당 주문·결제', '/honja-yeohaeng-sikdang-goreuneun-beop/'], ['도쿄 가이드·교류', '/honja-yeohaeng-social-activity/']] },
  { title: '위급 상황·분실이 생겼을 때', scope: '공통 · 현지 도움 우선', text: '즉각적인 위험에는 현지 긴급 도움이 먼저입니다. 영사 상담과 분실 처리는 구분하며 사이트 문의는 실시간 신고 창구가 아닙니다.', links: [['긴급 연락·분실 대응', '/honja-yeohaeng-emergency-response/']] }
];
const serialize = page => page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';

export function organizeHomeReviews(page) {
  const review = page('#ss-home-source-review');
  if (review.length !== 1) throw new Error('Expected one home source review');
  if (page('#ss-home-review-records').length) return;
  const time = review.find('time').first().clone();
  const groups = review.children('a, span').toArray();
  const list = page('<ul class="ss-review-index"></ul>');
  for (const node of groups) {
    const item = page(node).remove();
    if (item.is('span')) item.contents().filter((_, child) => child.type === 'text' && /^[\s·]*$/.test(page(child).text())).remove();
    item.find('a').addBack('a').each((_, link) => page(link).text(page(link).text().replace('조치 재확인 재대조', '조치 재확인')));
    list.append(page('<li></li>').append(item));
  }
  if (!groups.length) throw new Error('Expected home review links');
  const count = list.find('a').length;
  const content = page('<div id="ss-home-source-review"></div>');
  content.append(page('<p class="ss-review-date"></p>').append(time));
  content.append(list);
  const details = page(`<details id="ss-home-review-records"><summary>자료별 근거 대조 기록 · ${count}개 글</summary></details>`).append(content);
  review.replaceWith(details);
}

function updateDate(page, description) {
  if (!page('meta[property="og:updated_time"]').length) page('head').append('<meta property="og:updated_time">');
  page('meta[property="og:updated_time"]').attr('content', START_PAGES_MODIFIED);
  if (description) for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) page(selector).attr('content', description);
  page('script.rank-math-schema').each((_, script) => {
    const schema = JSON.parse(page(script).text());
    for (const node of schema['@graph'] || [schema]) if (['WebPage', 'CollectionPage'].includes(node['@type'])) {
      node.dateModified = START_PAGES_MODIFIED;
      if (description) node.description = description;
    }
    page(script).text(JSON.stringify(schema));
  });
}
function stylesheet(page) {
  if (!page('#ss-travel-start-style').length) page('head').append('<link id="ss-travel-start-style" rel="stylesheet" href="/assets/travel-start.css">');
}

export async function refreshStartPages(root = process.cwd()) {
  const entries = await readHubEntries(root);
  const homeFile = path.join(root, 'index.html');
  const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd());
  const firstGuides = home('.ss-home-band[aria-labelledby="home-guides-title"]');
  if (firstGuides.length !== 1 || home('.ss-home-intro').length !== 1) throw new Error('Expected home start sections');
  home('.ss-home-intro').after(firstGuides.remove());
  home('.ss-home-intro .ss-lead').text('공개 자료와 가상 계산으로 숙소·이동·출발 준비의 조건을 정리합니다. 도착·출발 도구는 일본 현지 시각 기준입니다.');
  home('#ss-home-method').remove();
  home('.ss-home-intro').append('<p id="ss-home-method">공식 자료의 적용일과 확인 범위, 가상 계산과 미확인 조건을 구분합니다. 현장 방문 후기나 실시간 예약·운행 확인 서비스는 아닙니다.</p>');
  organizeHomeReviews(home);
  home('#ss-home-directory > p').first().text(`여행 도구 ${entries.filter(entry => entry.type === 'tools').length}개 · 계산 분석 ${entries.filter(entry => entry.type === 'analysis').length}개 · 가이드 ${entries.filter(entry => entry.type === 'guides').length}개`);
  home('#ss-home-start-hub').remove();
  home('[aria-labelledby="home-guides-title"]').append('<p id="ss-home-start-hub"><a href="/travel-tips/">상황별 여행 팁 모아보기</a></p>');
  updateDate(home, '공개 자료 기반 여행 가이드와 가상 계산으로 숙소 비용·출발 준비·일정 변경을 검토합니다. 일본 전용 일정 도구와 공통 자료의 적용 범위를 구분합니다.'); stylesheet(home);
  await writeFileUtf8(homeFile, serialize(home));

  const file = path.join(root, 'travel-tips/index.html');
  const page = load((await fs.readFile(file, 'utf8')).trimEnd());
  if (page('.ss-category-guide').length !== 1 || page('.ss-archive-grid').length !== 1) throw new Error('Expected travel tips archive');
  page('body').addClass('ss-travel-start-page');
  const description = '예약 비용, 출발 준비, 일본 도착·출발, 일정 변경과 현장 대응을 상황별 글·도구로 연결합니다. 공개 자료와 가상 계산의 적용 범위를 구분합니다.';
  page('.ss-archive-hero > p').last().text(description);
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) page(selector).attr('content', description);
  page('.ss-category-guide').html(`<header class="ss-tips-start-head"><h2>지금 필요한 확인부터</h2><p>공식 자료에 근거한 가이드와 계산 도구를 상황별로 묶었습니다. 개별 글의 검토일과 적용 조건은 각 문서에 표시하며, 이 허브의 정리일이 모든 정보를 다시 검증한 날짜는 아닙니다.</p></header><ol class="ss-start-routes">${TRAVEL_START_ROUTES.map(route => `<li><p class="ss-route-scope">${escapeHtml(route.scope)}</p><h3>${escapeHtml(route.title)}</h3><p>${escapeHtml(route.text)}</p><ul class="ss-route-links">${route.links.map(([label, href]) => `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`).join('')}</ul></li>`).join('')}</ol><p id="ss-tips-directory"><a href="/guides/?type=tools">여행 도구 전체</a> · <a href="/guides/?type=guides&amp;topic=support">문제 대응 가이드</a> · <a href="/tools/trip-board/">일본 여행 준비판</a></p>`);
  page('#ss-tips-articles-title').remove();
  page('.ss-archive-grid').before('<h2 id="ss-tips-articles-title">여행 팁 전체 글</h2>');
  page('.ss-archive-grid').attr('aria-labelledby', 'ss-tips-articles-title');
  updateDate(page, description); stylesheet(page);
  await writeFileUtf8(file, serialize(page));
  const mapFile = path.join(root, 'page-sitemap.xml');
  const map = load(await fs.readFile(mapFile, 'utf8'), { xml: true });
  for (const url of ['https://shootsense.com/', 'https://shootsense.com/travel-tips/']) {
    const entry = map('url').filter((_, node) => map(node).find('loc').text() === url);
    if (entry.length !== 1) throw new Error(`Expected one sitemap entry: ${url}`);
    if (entry.find('lastmod').length) entry.find('lastmod').text(START_PAGES_MODIFIED); else entry.append(`<lastmod>${START_PAGES_MODIFIED}</lastmod>`);
  }
  await writeFileUtf8(mapFile, map.xml().trimEnd() + '\n');
  const indexFile = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(indexFile, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => index(node).find('loc').text() === 'https://shootsense.com/page-sitemap.xml').find('lastmod').text(START_PAGES_MODIFIED);
  await writeFileUtf8(indexFile, index.xml().trimEnd() + '\n');
  return { updatedPages: 2, routeGroups: TRAVEL_START_ROUTES.length, articleReviewDatesChanged: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await refreshStartPages()));
