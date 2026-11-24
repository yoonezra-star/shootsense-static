import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { writeFileUtf8 } from './lib/static-site-utils.mjs';
import { ARRIVAL_ROUTE, ARRIVAL_MODIFIED, ARRIVAL_TITLE, ARRIVAL_DESCRIPTION, ARRIVAL_CONTENT } from './arrival-check-content.mjs';

const ORIGIN = 'https://shootsense.com';
const serialize = $ => $.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';
function dated($) {
  $('meta[property="og:updated_time"], meta[property="article:modified_time"]').attr('content', ARRIVAL_MODIFIED);
  $('script.rank-math-schema').each((_, script) => {
    const schema = JSON.parse($(script).text());
    for (const node of schema['@graph'] || [schema]) if (node.dateModified) node.dateModified = ARRIVAL_MODIFIED;
    $(script).text(JSON.stringify(schema));
  });
}
export async function buildArrivalCheck(root = process.cwd()) {
  const $ = load((await fs.readFile(path.join(root, 'tools/departure-check/index.html'), 'utf8')).trimEnd());
  $('.entry-content').html(ARRIVAL_CONTENT);
  $('#arrival-form input, #arrival-form select, #arrival-form button').attr('disabled', 'disabled');
  $('article').first().attr('id', 'page-arrival-check');
  $('.ss-breadcrumb .here').text(ARRIVAL_TITLE);
  $('title').text(`${ARRIVAL_TITLE} | 여행정보엑스퍼트`);
  $('meta[property="og:title"], meta[name="twitter:title"]').attr('content', ARRIVAL_TITLE);
  $('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').attr('content', ARRIVAL_DESCRIPTION);
  $('link[rel="canonical"]').attr('href', ORIGIN + ARRIVAL_ROUTE);
  $('meta[property="og:url"]').attr('content', ORIGIN + ARRIVAL_ROUTE);
  $('meta[property="og:updated_time"]').attr('content', ARRIVAL_MODIFIED);
  $('meta[property="og:type"]').attr('content', 'website');
  $('#ss-departure-check').remove();
  $('head').append('<link id="ss-arrival-style" rel="stylesheet" href="/assets/arrival-check.css"><script id="ss-arrival-check" type="module" src="/assets/arrival-check.js"></script>');
  const url = ORIGIN + ARRIVAL_ROUTE;
  $('script.rank-math-schema').text(JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': url + '#webpage', url, name: ARRIVAL_TITLE, description: ARRIVAL_DESCRIPTION, inLanguage: 'ko-KR', datePublished: ARRIVAL_MODIFIED, dateModified: ARRIVAL_MODIFIED },
    { '@type': 'WebApplication', '@id': url + '#application', url, name: ARRIVAL_TITLE, description: ARRIVAL_DESCRIPTION, applicationCategory: 'TravelApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript', inLanguage: 'ko-KR', isAccessibleForFree: true }
  ] }));
  await writeFileUtf8(path.join(root, ARRIVAL_ROUTE, 'index.html'), serialize($));

  const homeFile = path.join(root, 'index.html');
  const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd());
  home('#ss-home-arrival').remove();
  const lab = home('#ss-home-lab');
  lab.children('h2').first().text('도착부터 출발까지, 시간 조건을 맞춰보세요');
  lab.children('p').eq(1).text('공항에 내린 뒤 숙소 접수처까지, 마지막 날에는 짐 회수부터 승차 위치까지. 서로 다른 마감과 이동 조건을 나눠 계산합니다.');
  lab.find('.ss-home-lab-actions').prepend(`<a id="ss-home-arrival" class="ss-action" href="${ARRIVAL_ROUTE}"><img src="/assets/icons/calculator.svg" width="18" height="18" alt="">공항 도착·체크인 검토</a>`);
  dated(home);
  await writeFileUtf8(homeFile, serialize(home));
  for (const relative of ['analysis/tokyo-late-checkin/index.html', 'tools/departure-check/index.html']) {
    const file = path.join(root, relative);
    const page = load((await fs.readFile(file, 'utf8')).trimEnd());
    page('#ss-arrival-link').remove();
    const content = page('.ss-research').length ? page('.ss-research') : page('.ss-tool-links');
    content.append(`<p id="ss-arrival-link"><a href="${ARRIVAL_ROUTE}">${ARRIVAL_TITLE}</a>: 입국·짐 수령·이동과 지정 교통편을 나눠 도착 마감을 계산합니다. 연결 추가 2026-11-24이며 기존 자료 전체의 재검증 날짜를 바꾼 것은 아닙니다.</p>`);
    dated(page);
    await writeFileUtf8(file, serialize(page));
  }
  const privacyFile = path.join(root, 'privacy-policy/index.html');
  const privacy = load((await fs.readFile(privacyFile, 'utf8')).trimEnd());
  privacy('#arrival-input-privacy').remove();
  privacy('.ss-page').first().append('<section id="arrival-input-privacy"><h2>공항 도착·체크인 검토기 입력</h2><p>항공편 도착·교통편 출발·숙소 마감과 소요 시간은 브라우저 안에서 계산합니다. 이 기능은 입력값을 별도 API, 페이지 주소, 브라우저 저장소에 보내거나 저장하지 않습니다. 로컬 계산 코드가 준비되기 전이나 자바스크립트가 꺼진 경우 입력·제출은 비활성 상태로 유지됩니다. 내려받기를 선택하면 현재 입력과 결과가 담긴 내 기기의 파일이 생성되며, 인쇄본과 파일의 보관·공유는 이용자가 관리합니다. 예약번호·여권·결제정보·객실 출입 코드를 입력하지 마세요. 일반 호스팅 접속·성능 정보는 이 방침의 외부 서비스 항목에 따릅니다.</p></section>');
  dated(privacy);
  await writeFileUtf8(privacyFile, serialize(privacy));
  const mapFile = path.join(root, 'page-sitemap.xml');
  const map = load(await fs.readFile(mapFile, 'utf8'), { xml: true });
  for (const route of [ARRIVAL_ROUTE, '/', '/privacy-policy/', '/analysis/tokyo-late-checkin/', '/tools/departure-check/']) {
    const item = map('url').filter((_, node) => map(node).find('loc').text() === ORIGIN + route);
    if (!item.length) map('urlset').append(`<url><loc>${ORIGIN + route}</loc><lastmod>${ARRIVAL_MODIFIED}</lastmod></url>`);
    else if (item.length !== 1) throw new Error('Duplicate arrival sitemap route');
    else if (item.find('lastmod').length) item.find('lastmod').text(ARRIVAL_MODIFIED);
    else item.append(`<lastmod>${ARRIVAL_MODIFIED}</lastmod>`);
  }
  await writeFileUtf8(mapFile, map.xml().trimEnd() + '\n');
  return { route: ARRIVAL_ROUTE, modes: 2, scenarios: 3, personalDataPersistence: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await buildArrivalCheck()));
