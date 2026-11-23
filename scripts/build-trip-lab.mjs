import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { ensureMobileReadingLayout, escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';
import { LAB_MODIFIED, PLANNER_ROUTE, PLANNER_CONTENT, LATE_PAGE, STORAGE_PAGE, sourceNotes } from './trip-lab-content.mjs';

const ORIGIN = 'https://shootsense.com';
const serialize = $ => $.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';
const planner = { route: PLANNER_ROUTE, title: '출발일 일정 검토기', summary: '짐 회수 완료 마감과 교통편 출발에서 관광 종료 목표를 역산합니다. 일본 현지 날짜·시각과 미확인 항목을 구분하고, 지연 가정을 비교해 내 시간표를 내려받습니다.' };
function dated($) {
  $('meta[property="og:updated_time"], meta[property="article:modified_time"]').attr('content', LAB_MODIFIED);
  $('script.rank-math-schema').each((_, script) => {
    const schema = JSON.parse($(script).text());
    for (const node of schema['@graph'] || [schema]) if (node.dateModified) node.dateModified = LAB_MODIFIED;
    $(script).text(JSON.stringify(schema));
  });
}
function style($) {
  if (!$('link#ss-trip-lab-style').length) $('head').append('<link id="ss-trip-lab-style" rel="stylesheet" href="/assets/trip-lab.css">');
}
function articleContent(page) {
  const body = load(page.body);
  const toc = body('h2').toArray().map(node => `<li><a href="#${body(node).attr('id')}">${escapeHtml(body(node).text())}</a></li>`).join('');
  return `<div class="ss-research"><header class="ss-research-header"><p class="ss-eyebrow">일본 · 짧은 여행 분석</p><h1>${escapeHtml(page.title)}</h1><p>발행·자료 대조 2026-11-24 · 작성 <a href="/author/">여행엑스퍼트(필명)</a></p><p>${escapeHtml(page.summary)}</p></header><nav class="ss-toc" aria-label="본문 목차"><ol>${toc}</ol></nav>${page.body}<p><a href="/guides/?region=japan">일본 관련 자료 더 보기</a> · <a href="/editorial-policy/">편집 원칙</a> · <a href="/contact/">오류 제보</a></p></div>`;
}
async function createPage(root, page, tool = false) {
  const $ = load((await fs.readFile(path.join(root, 'contact/index.html'), 'utf8')).trimEnd());
  $('.entry-content').html(tool ? PLANNER_CONTENT : articleContent(page));
  if (tool) $('#departure-form input, #departure-form select, #departure-form button').attr('disabled', 'disabled');
  $('.entry-header').remove();
  $('article').first().attr('id', tool ? 'page-departure-check' : 'page-' + page.route.split('/').filter(Boolean).at(-1));
  $('body').addClass(tool ? 'ss-trip-tool-page' : 'ss-research-page');
  $('.current-menu-item, .current_page_item').removeClass('current-menu-item current_page_item');
  $('a[aria-current]').removeAttr('aria-current');
  $('.ss-breadcrumb').html(`<a href="/">홈</a><span class="sep">›</span><span class="here">${escapeHtml(page.title)}</span>`);
  $('[href], [src]').each((_, node) => {
    for (const attr of ['href', 'src']) {
      const value = $(node).attr(attr);
      if (!value || value.startsWith('/') || value.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(value)) continue;
      const url = new URL(value, `${ORIGIN}/contact/`);
      $(node).attr(attr, `${url.pathname}${url.search}${url.hash}`);
    }
  });
  $('title').text(`${page.title} | 여행정보엑스퍼트`);
  $('meta[property="og:title"], meta[name="twitter:title"]').attr('content', page.title);
  $('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').attr('content', page.summary);
  $('link[rel="canonical"]').attr('href', ORIGIN + page.route);
  $('meta[property="og:url"]').attr('content', ORIGIN + page.route);
  $('meta[property="og:type"]').attr('content', tool ? 'website' : 'article');
  $('meta[name="robots"]').attr('content', 'index, follow');
  $('meta[property="og:updated_time"]').attr('content', LAB_MODIFIED);
  $('meta[property^="article:"], meta[name^="twitter:label"], meta[name^="twitter:data"], script[src*="googlesyndication"], ins.adsbygoogle').remove();
  const url = ORIGIN + page.route;
  const graph = [{ '@type': 'WebPage', '@id': url + '#webpage', url, name: page.title, description: page.summary, datePublished: LAB_MODIFIED, dateModified: LAB_MODIFIED, inLanguage: 'ko-KR' }];
  graph.push(tool ? { '@type': 'WebApplication', '@id': url + '#application', name: page.title, url, applicationCategory: 'TravelApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript', description: page.summary, inLanguage: 'ko-KR', isAccessibleForFree: true } : { '@type': 'Article', '@id': url + '#article', headline: page.title, description: page.summary, datePublished: LAB_MODIFIED, dateModified: LAB_MODIFIED, inLanguage: 'ko-KR', mainEntityOfPage: { '@id': url + '#webpage' }, author: { '@type': 'Person', name: '여행엑스퍼트', url: ORIGIN + '/author/' } });
  $('script.rank-math-schema').text(JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }));
  style($);
  if (!$('link#ss-research-style').length) $('head').append('<link id="ss-research-style" rel="stylesheet" href="/assets/research.css">');
  if (tool) $('head').append('<script id="ss-departure-check" type="module" src="/assets/departure-check.js"></script>');
  ensureMobileReadingLayout($);
  await writeFileUtf8(path.join(root, page.route, 'index.html'), serialize($));
}

export async function buildTripLab(root = process.cwd()) {
  await createPage(root, planner, true);
  for (const page of [LATE_PAGE, STORAGE_PAGE]) await createPage(root, page);
  const connections = `<aside id="ss-trip-lab-links" class="ss-review-notice"><p><strong>이 계산 다음에 확인할 조건</strong> · <a href="${LATE_PAGE.route}">자정 체크인과 예약 날짜</a> · <a href="${STORAGE_PAGE.route}">객실 연장과 짐 보관 선택</a> · <a href="${PLANNER_ROUTE}">내 출발일 시간 역산</a></p><p>2026-11-24 연결 자료 추가. 아래 원래 요금·규정의 자료 대조일을 일괄 갱신한 것은 아닙니다.</p></aside>`;
  for (const relative of ['analysis/tokyo-stay-cost/index.html', 'honja-yeohaeng-achim-routine/index.html']) {
    const file = path.join(root, relative);
    const $ = load((await fs.readFile(file, 'utf8')).trimEnd());
    $('#ss-trip-lab-links, #ss-storage-recheck').remove();
    const anchor = $('.ss-post-body').length ? $('.ss-post-body') : $('.ss-research');
    anchor.after(connections);
    if (relative.startsWith('honja-')) {
      anchor.after(`<aside id="ss-storage-recheck" class="ss-review-notice"><p>2026-11-24 부분 대조: 역 소개의 시설 구분을 다시 읽었습니다. 기존 2026-10-17 표의 개별 요금·마감은 현재 조건으로 재검증하지 못했습니다. 창구 영업시간과 짐 회수 완료 마감은 따로 확인한 뒤 계산기에 입력하세요.</p>${sourceNotes(['station', 'operator'])}</aside>`);
      $('.ss-post-meta span').filter((_, node) => $(node).text().startsWith('최종 수정')).text('최종 수정 2026-11-24');
      if (!$('#ss-checkout-link-review').length) $('.ss-trust-note').append('<span id="ss-checkout-link-review"> · 2026-11-24 부분 대조 범위 표시·일정 검토기 연결 추가. 기존 요금표 전체를 재검증한 날짜는 아닙니다.</span>');
    }
    dated($); style($);
    await writeFileUtf8(file, serialize($));
  }
  const homeFile = path.join(root, 'index.html');
  const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd());
  home('#ss-home-lab').remove();
  home('.ss-home-intro .ss-lead').text('일본의 짧은 혼자 여행부터, 숙소 비용과 도착·출발의 시간 조건을 공개 자료와 계산으로 비교합니다.');
  home('.ss-home-intro').after(`<section id="ss-home-lab" class="ss-home-band"><p class="ss-eyebrow">일본 · 숙소부터 마지막 교통편까지</p><h2>짐을 찾고, 몇 시에 돌아와야 할까요?</h2><p>열차 출발보다 짐 회수 마감이 먼저일 수 있습니다. 두 마감에서 관광 종료 목표를 역산하고, 20분·40분 늦어질 때 달라지는 조건을 비교해 보세요.</p><div class="ss-home-lab-actions"><a class="ss-action" href="${PLANNER_ROUTE}"><img src="/assets/icons/calculator.svg" width="18" height="18" alt="">출발일 일정 검토</a><a href="/tools/stay-compare/">숙소 총비용 비교</a></div><ol class="ss-guide-list"><li><span class="number" aria-hidden="true">01</span><div><a href="/analysis/tokyo-stay-cost/">도쿄 2박 · 표시 가격이 뒤집히는 경계</a><p>숙박세·교통비와 미확인 비용을 분리합니다.</p></div></li><li><span class="number" aria-hidden="true">02</span><div><a href="${LATE_PAGE.route}">자정 도착 · 예약 날짜와 접수 마감</a><p>24:00·25:00을 실제 달력 날짜로 바꿉니다.</p></div></li><li><span class="number" aria-hidden="true">03</span><div><a href="${STORAGE_PAGE.route}">객실 연장과 짐 보관 · 필요한 서비스 선택</a><p>같지 않은 서비스를 가격만으로 비교하지 않습니다.</p></div></li><li><span class="number" aria-hidden="true">04</span><div><a href="/honja-yeohaeng-achim-routine/">체크아웃 뒤 · 도쿄역 짐 회수와 출발</a><p>개찰구 안팎, 회수 창구와 승차 위치를 연결합니다.</p></div></li></ol><p class="ss-home-note">공개 자료 기반 분석과 가상 계산입니다. 현장 방문 후기·실시간 운행·예약 승인을 뜻하지 않습니다.</p></section>`);
  const updates = home('.ss-home-updates');
  if (!updates.parent().is('details.ss-home-history')) updates.wrap('<details class="ss-home-history"></details>').before('<summary>지난 자료 수정 이력</summary>');
  home('#home-update-title').text('자료 관리 기록');
  style(home); dated(home);
  await writeFileUtf8(homeFile, serialize(home));
  const privacyFile = path.join(root, 'privacy-policy/index.html');
  const privacy = load((await fs.readFile(privacyFile, 'utf8')).trimEnd());
  privacy('#departure-input-privacy').remove();
  privacy('.ss-page').first().append('<section id="departure-input-privacy"><h2>출발일 일정 검토기 입력</h2><p>입력한 날짜·시각과 소요 시간은 브라우저 안에서 계산합니다. 이 기능은 입력값을 페이지 주소, 브라우저 저장소나 별도 API에 보내거나 저장하지 않습니다. 내려받기는 현재 입력과 계산 결과를 담은 내 기기의 텍스트 파일을 만들며 인쇄는 브라우저 인쇄 기능을 사용합니다. 파일 공유·보관과 인쇄본은 이용자가 관리합니다. 예약번호·여권·결제정보·보관 QR·출입 코드를 입력하지 마세요. 호스팅 서비스의 일반 접속·성능 정보 처리는 이 정책의 외부 서비스 항목에 따릅니다.</p></section>');
  dated(privacy);
  await writeFileUtf8(privacyFile, serialize(privacy));
  for (const [mapName, routes] of [['page-sitemap.xml', [PLANNER_ROUTE, LATE_PAGE.route, STORAGE_PAGE.route, '/analysis/tokyo-stay-cost/', '/', '/privacy-policy/']], ['post-sitemap.xml', ['/honja-yeohaeng-achim-routine/']]]) {
    const file = path.join(root, mapName);
    const map = load(await fs.readFile(file, 'utf8'), { xml: true });
    for (const route of routes) {
      let item = map('url').filter((_, node) => map(node).find('loc').text() === ORIGIN + route);
      if (!item.length) { map('urlset').append(`<url><loc>${ORIGIN + route}</loc><lastmod>${LAB_MODIFIED}</lastmod></url>`); continue; }
      if (item.length !== 1) throw new Error('Duplicate trip lab sitemap route');
      if (item.find('lastmod').length) item.find('lastmod').text(LAB_MODIFIED); else item.append(`<lastmod>${LAB_MODIFIED}</lastmod>`);
    }
    await writeFileUtf8(file, map.xml().trimEnd() + '\n');
  }
  const indexFile = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(indexFile, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => /\/(page|post)-sitemap\.xml$/.test(index(node).find('loc').text())).find('lastmod').text(LAB_MODIFIED);
  await writeFileUtf8(indexFile, index.xml().trimEnd() + '\n');
  return { newTool: PLANNER_ROUTE, newAnalyses: 2, connectedExistingArticles: 2 };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await buildTripLab()));
