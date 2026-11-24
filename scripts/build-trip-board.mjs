import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { writeFileUtf8 } from './lib/static-site-utils.mjs';
import { BOARD_ROUTE, BOARD_MODIFIED, BOARD_TITLE, BOARD_DESCRIPTION, BOARD_CONTENT } from './trip-board-content.mjs';
const ORIGIN = 'https://shootsense.com';
const serialize = $ => $.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';
function dated($) {
  $('meta[property="og:updated_time"], meta[property="article:modified_time"]').attr('content', BOARD_MODIFIED);
  $('script.rank-math-schema').each((_, script) => {
    const schema = JSON.parse($(script).text());
    for (const node of schema['@graph'] || [schema]) if (node.dateModified) node.dateModified = BOARD_MODIFIED;
    $(script).text(JSON.stringify(schema));
  });
}
export async function buildTripBoard(root = process.cwd()) {
  const $ = load((await fs.readFile(path.join(root, 'tools/arrival-check/index.html'), 'utf8')).trimEnd());
  $('.entry-content').html(BOARD_CONTENT);
  $('#board-report-title').after('<p id="board-units">일정: 일본 현지 시각 Asia/Tokyo (UTC+09:00) · 숙소 비용: 원화(KRW), 입력한 예약 기간 전체</p>');
  $('article').first().attr('id', 'page-trip-board');
  $('.ss-breadcrumb .here').text(BOARD_TITLE);
  $('title').text(`${BOARD_TITLE} | 여행정보엑스퍼트`);
  $('meta[property="og:title"], meta[name="twitter:title"]').attr('content', BOARD_TITLE);
  $('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').attr('content', BOARD_DESCRIPTION);
  $('meta[property="og:url"]').attr('content', ORIGIN + BOARD_ROUTE);
  $('link[rel="canonical"]').attr('href', ORIGIN + BOARD_ROUTE);
  $('meta[property="og:updated_time"]').attr('content', BOARD_MODIFIED);
  $('#ss-arrival-check, #ss-arrival-style').remove();
  $('head').append('<link id="ss-trip-board-style" rel="stylesheet" href="/assets/trip-board.css"><script id="ss-trip-board" type="module" src="/assets/trip-board.js"></script>');
  const url = ORIGIN + BOARD_ROUTE;
  $('script.rank-math-schema').text(JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': url + '#webpage', url, name: BOARD_TITLE, description: BOARD_DESCRIPTION, inLanguage: 'ko-KR', datePublished: BOARD_MODIFIED, dateModified: BOARD_MODIFIED },
    { '@type': 'WebApplication', '@id': url + '#application', url, name: BOARD_TITLE, description: BOARD_DESCRIPTION, applicationCategory: 'TravelApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript', inLanguage: 'ko-KR', isAccessibleForFree: true }
  ] }));
  await writeFileUtf8(path.join(root, BOARD_ROUTE, 'index.html'), serialize($));
  const homeFile = path.join(root, 'index.html');
  const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd());
  home('#ss-home-board').remove();
  home('#ss-home-lab .ss-home-lab-actions').before(`<p id="ss-home-board"><a class="ss-action" href="${BOARD_ROUTE}"><img src="/assets/icons/calculator.svg" width="18" height="18" alt="">내 여행 준비판</a> 숙소·도착·출발을 검토하고 미확인 조건을 한곳에 정리합니다.</p>`);
  dated(home);
  await writeFileUtf8(homeFile, serialize(home));
  for (const route of ['stay-compare', 'arrival-check', 'departure-check']) {
    const file = path.join(root, 'tools', route, 'index.html');
    const page = load((await fs.readFile(file, 'utf8')).trimEnd());
    page('#ss-board-link').remove();
    (page('.ss-tool header').length ? page('.ss-tool header') : page('.ss-trip-tool header')).append(`<p id="ss-board-link"><a href="${BOARD_ROUTE}">내 여행 준비판에서 세 도구 함께 검토하기</a></p>`);
    dated(page);
    await writeFileUtf8(file, serialize(page));
  }
  const privacyFile = path.join(root, 'privacy-policy/index.html');
  const privacy = load((await fs.readFile(privacyFile, 'utf8')).trimEnd());
  privacy('#trip-board-privacy').remove();
  privacy('.ss-page').first().append('<section id="trip-board-privacy"><h2>내 여행 준비판과 개인 파일</h2><p>준비판 안의 숙소·도착·출발 도구는 같은 사이트의 화면 사이에서 브라우저 메시지로 입력을 전달하고 계산합니다. 이 기능은 입력을 서버 API·페이지 주소·브라우저 저장소에 저장하거나 전송하지 않습니다. 자동 저장·다른 탭의 기록 수집은 하지 않으며, 페이지를 닫거나 새로고침하면 저장하지 않은 입력은 사라집니다. 사용자가 저장 버튼을 선택하면 입력과 가상 사례 여부를 담은 개인 JSON 파일이 내 기기에 생성됩니다. 준비표 텍스트·인쇄본과 복원 파일의 보관·공유는 이용자가 관리합니다. 선택한 복원 파일은 브라우저에서만 읽고 결과를 다시 계산합니다. 복원 시 같은 여행·숙소의 연결 확인은 해제합니다. 예약번호·여권·결제정보·객실 출입 코드는 입력하지 마세요. 일반 호스팅 접속·성능 정보 처리는 외부 서비스 항목에 따릅니다.</p></section>');
  dated(privacy);
  await writeFileUtf8(privacyFile, serialize(privacy));
  const mapFile = path.join(root, 'page-sitemap.xml');
  const map = load(await fs.readFile(mapFile, 'utf8'), { xml: true });
  for (const route of [BOARD_ROUTE, '/', '/privacy-policy/', '/tools/stay-compare/', '/tools/arrival-check/', '/tools/departure-check/']) {
    const item = map('url').filter((_, node) => map(node).find('loc').text() === ORIGIN + route);
    if (!item.length) map('urlset').append(`<url><loc>${ORIGIN + route}</loc><lastmod>${BOARD_MODIFIED}</lastmod></url>`);
    else if (item.length !== 1) throw new Error('Duplicate board sitemap route');
    else if (item.find('lastmod').length) item.find('lastmod').text(BOARD_MODIFIED);
    else item.append(`<lastmod>${BOARD_MODIFIED}</lastmod>`);
  }
  await writeFileUtf8(mapFile, map.xml().trimEnd() + '\n');
  return { route: BOARD_ROUTE, linkedTools: 3, automaticStorage: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await buildTripBoard()));
