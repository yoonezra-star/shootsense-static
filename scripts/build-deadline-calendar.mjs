import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { writeFileUtf8 } from './lib/static-site-utils.mjs';
import { DEADLINE_ROUTE, DEADLINE_MODIFIED, DEADLINE_TITLE, DEADLINE_DESCRIPTION, DEADLINE_CONTENT } from './deadline-content.mjs';
const ORIGIN = 'https://shootsense.com';
const serialize = $ => $.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';
function dated($) {
  $('meta[property="og:updated_time"], meta[property="article:modified_time"]').attr('content', DEADLINE_MODIFIED);
  $('script.rank-math-schema').each((_, script) => {
    const schema = JSON.parse($(script).text());
    for (const node of schema['@graph'] || [schema]) if (node.dateModified) node.dateModified = DEADLINE_MODIFIED;
    $(script).text(JSON.stringify(schema));
  });
}
export async function buildDeadlineCalendar(root = process.cwd()) {
  const $ = load((await fs.readFile(path.join(root, 'tools/trip-board/index.html'), 'utf8')).trimEnd());
  $('.entry-content').html(DEADLINE_CONTENT);
  $('article').first().attr('id', 'page-reservation-deadlines');
  $('.ss-breadcrumb .here').text(DEADLINE_TITLE);
  $('title').text(`${DEADLINE_TITLE} | 여행정보엑스퍼트`);
  $('meta[property="og:title"], meta[name="twitter:title"]').attr('content', DEADLINE_TITLE);
  $('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').attr('content', DEADLINE_DESCRIPTION);
  $('meta[property="og:url"]').attr('content', ORIGIN + DEADLINE_ROUTE);
  $('link[rel="canonical"]').attr('href', ORIGIN + DEADLINE_ROUTE);
  $('meta[property="og:updated_time"]').attr('content', DEADLINE_MODIFIED);
  $('#ss-trip-board, #ss-trip-board-style').remove();
  $('head').append('<link id="ss-deadline-style" rel="stylesheet" href="/assets/deadline-calendar.css"><script id="ss-deadline-calendar" type="module" src="/assets/deadline-calendar.js"></script>');
  const url = ORIGIN + DEADLINE_ROUTE;
  $('script.rank-math-schema').text(JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': url + '#webpage', url, name: DEADLINE_TITLE, description: DEADLINE_DESCRIPTION, inLanguage: 'ko-KR', datePublished: DEADLINE_MODIFIED, dateModified: DEADLINE_MODIFIED },
    { '@type': 'WebApplication', '@id': url + '#application', url, name: DEADLINE_TITLE, description: DEADLINE_DESCRIPTION, applicationCategory: 'TravelApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript', inLanguage: 'ko-KR', isAccessibleForFree: true }
  ] }));
  await writeFileUtf8(path.join(root, DEADLINE_ROUTE, 'index.html'), serialize($));
  const homeFile = path.join(root, 'index.html');
  const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd());
  home('#ss-home-deadlines').remove();
  home('#ss-home-board').after(`<p id="ss-home-deadlines"><a href="${DEADLINE_ROUTE}">예약 변경·취소 마감 캘린더</a> · 원문 시간대와 확인·처리 상태를 나눠 기록합니다.</p>`);
  dated(home); await writeFileUtf8(homeFile, serialize(home));
  const boardFile = path.join(root, 'tools/trip-board/index.html');
  const board = load((await fs.readFile(boardFile, 'utf8')).trimEnd());
  board('#ss-deadline-link').remove();
  board('.ss-tool-links ul').first().append(`<li id="ss-deadline-link"><a href="${DEADLINE_ROUTE}" target="_blank" rel="noopener">예약 변경·취소 마감 캘린더</a> · 별도 개인 파일로 관리하며 준비판 입력은 그대로 유지합니다.</li>`);
  dated(board); await writeFileUtf8(boardFile, serialize(board));
  const privacyFile = path.join(root, 'privacy-policy/index.html');
  const privacy = load((await fs.readFile(privacyFile, 'utf8')).trimEnd());
  privacy('#deadline-input-privacy').remove();
  privacy('.ss-page').first().append('<section id="deadline-input-privacy"><h2>예약 마감 기록·일정 파일</h2><p>예약을 구분할 이름·마감 시각·시간대·메모·확인 및 처리 상태는 현재 페이지 메모리에서만 처리합니다. 이 기능은 서버 API·페이지 주소·브라우저 저장소에 입력을 기록하거나 전송하지 않으며 자동 저장·알림 발송·외부 계정 등록을 하지 않습니다. 새로고침·페이지 종료 전 직접 저장하지 않은 기록은 사라집니다. 사용자가 선택하면 마감표·복원용 JSON·캘린더용 ICS 파일이 내 기기에 만들어집니다. 파일에는 입력 내용이 포함되므로 보관·공유와 캘린더 앱으로 가져온 이후의 정보 처리·알림 설정은 이용자와 해당 앱의 관리 대상입니다. 복원 파일은 브라우저에서만 읽고 원문 확인 표시는 해제합니다. 가져온 일정과 이 사이트는 자동 동기화되지 않습니다. 예약번호·여권·결제정보·개인 예약 링크는 입력하지 마세요. 일반 호스팅 접속·성능 정보는 외부 서비스 항목에 따릅니다.</p></section>');
  dated(privacy); await writeFileUtf8(privacyFile, serialize(privacy));
  const mapFile = path.join(root, 'page-sitemap.xml');
  const map = load(await fs.readFile(mapFile, 'utf8'), { xml: true });
  for (const route of [DEADLINE_ROUTE, '/', '/privacy-policy/', '/tools/trip-board/']) {
    const item = map('url').filter((_, node) => map(node).find('loc').text() === ORIGIN + route);
    if (!item.length) map('urlset').append(`<url><loc>${ORIGIN + route}</loc><lastmod>${DEADLINE_MODIFIED}</lastmod></url>`);
    else if (item.length !== 1) throw new Error('Duplicate deadline sitemap route');
    else if (item.find('lastmod').length) item.find('lastmod').text(DEADLINE_MODIFIED);
    else item.append(`<lastmod>${DEADLINE_MODIFIED}</lastmod>`);
  }
  await writeFileUtf8(mapFile, map.xml().trimEnd() + '\n');
  return { route: DEADLINE_ROUTE, recordLimit: 50, calendarExport: true, serverNotifications: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await buildDeadlineCalendar()));
