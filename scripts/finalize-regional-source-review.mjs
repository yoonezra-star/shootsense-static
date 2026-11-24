import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { ARTA_SLUG, CIVITA_SLUG, ARTA_BUS_SOURCE, REGIONAL_MODIFIED } from './regional-access-content.mjs';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';

export const REGIONAL_SOURCE_REVIEWS = [
  {
    slug: ARTA_SLUG, id: 'arta', label: '아르타 교통·관람 조건', marker: '14:00 − 10:20 − 00:40 = 3시간',
    note: '버스 출발·실제 도착·최종 입장을 구분했습니다. 버스표·문의처·휴관 공지는 직접 조회 제한으로 공식 검색 색인을 대조했으며 현재 운행·재개관을 확인한 것은 아닙니다.',
    groups: [
      { title: '이오아니나 왕복', checked: '공식 검색 색인의 양방향 평일·주말 시각이 이전 확인 기록과 일치합니다.', limit: '방문일 운행·정확한 정류장·도착 시각·예약을 확인하지 않았습니다. 색인과 현재 원문은 다를 수 있습니다.', links: [['KTEL 게시표', ARTA_BUS_SOURCE], ['KTEL 문의처', 'https://www.ktelartas.gr/%CE%B5%CF%80%CE%B9%CE%BA%CE%BF%CE%B9%CE%BD%CF%89%CE%BD%CE%AF%CE%B1/']] },
      { title: '고고학 박물관과 방문 목적', checked: '문화부·관리기관 원문에서 전시 주제·계절별 10유로·휴관과 공통 입장 안내를 읽었습니다.', limit: '공통 20분 전 입장 안내를 아르타의 당일 확정 마감으로 바꾸지 않습니다.', links: [['문화부 박물관 안내', 'https://archaeologicalmuseums.culture.gov.gr/en/museum/5df34af3deca5e2d79e8c123/archaeological-museum-of-arta'], ['관리기관 영문 소개', 'https://efaart.gr/en/home-en/']] },
      { title: '파리고리티사 공사·조각 전시', checked: '휴관 공지는 공식 검색 색인, 문화부 계절표는 원문으로 대조했습니다. 5유로 표의 성당 포함 안내와 재개관 여부를 분리했습니다.', limit: '재개관·요청 방문 승인·판매 가능을 확인하지 않았습니다. 계절표나 게시 요금이 휴관을 해제하는 것은 아닙니다.', links: [['2026-02-02 휴관 연장', 'https://efaart.gr/conference-event/parigoritissa_2026_2/'], ['문화부 조각 전시 안내', 'https://archaeologicalmuseums.culture.gov.gr/en/museum/5f9001b032dc212c48701683/sculpture-collection-of-the-parigoritissa-church-arta']] }
    ]
  },
  {
    slug: CIVITA_SLUG, id: 'civita', label: '치비타 접근·입장 조건', marker: '이동 지원 글의 게시일은 2020-06-10',
    note: '공식 안내 6개를 재검토했습니다. 창구별 시간·보행 구간·오래된 이동 지원 안내를 구분했으며 버스 검색·표 구매·지원 예약을 실행한 후기는 아닙니다.',
    groups: [
      { title: '매표소·입장권·숙박객 조건', checked: '운영사 원문에서 3개 창구의 시간·5유로 입장·내부 숙박객 면제 안내를 대조했습니다.', limit: '당일 입장·박물관 포함 범위·면제 승인·숙소 체크인은 확인하지 않았습니다.', links: [['입장권 안내', 'https://www.casacivitabagnoregio.it/ticket-dingresso/'], ['매표소별 안내', 'https://www.casacivitabagnoregio.it/biglietteria/']] },
      { title: '안내 창구와 보행교', checked: '시청·관광청 원문에서 Battaglini 주소와 약 300m 보행교·경사를 읽었습니다. 운영사의 도보 약 15분은 다리 입구까지의 별도 구간입니다.', limit: '안내 창구의 접근성을 마을 전체 인증으로 확대하지 않으며 짐을 든 보행을 실측하지 않았습니다.', links: [['시청 인포포인트', 'https://www.comune.bagnoregio.vt.it/it/vivere/infopoint'], ['관광청 보행교 설명', 'https://www.italia.it/en/lazio/bagnoregio/bridge-of-civita-di-bagnoregio']] },
      { title: '왕복 교통과 예약형 지원', checked: 'Cotral 검색의 직행·환승 구분과 운영사 지원 안내의 2020-06-10 게시일·사전 예약 문구를 확인했습니다.', limit: '날짜별 버스·지원 인력·왕복 배정·구체적 예약 기한은 확인하지 않았습니다.', links: [['Cotral 공식 검색', 'https://cotralspa.it/ricerca-orari/'], ['운영사 이동 지원 안내', 'https://www.casacivitabagnoregio.it/visita-a-civita-anche-per-chi-ha-disabilita-motoria-grazie-alla-croce-rossa-di-bagnoregio/']] }
    ]
  }
];
const serialize = page => page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';

export async function finalizeRegionalSourceReview(root = process.cwd()) {
  for (const review of REGIONAL_SOURCE_REVIEWS) {
    const file = path.join(root, review.slug, 'index.html');
    const page = load((await fs.readFile(file, 'utf8')).trimEnd());
    if (!page('.ss-post-body').text().includes(review.marker) || page('.ss-trust-box').length !== 1) throw new Error(`Rebuild revised ${review.id} article before finalization`);
    page(`#ss-${review.id}-source-review, #ss-november-recheck`).remove();
    page('.ss-trust-box').after(`<aside id="ss-${review.id}-source-review" class="ss-review-notice ss-source-review"><p><strong>2026-11-24 공개 자료 재대조</strong> · ${escapeHtml(review.note)}</p><details><summary>확인한 출처와 남아 있는 조건</summary><ul>${review.groups.map(group => `<li><strong>${escapeHtml(group.title)}</strong><p>${escapeHtml(group.checked)} ${group.links.map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join(' · ')}</p><p><strong>미확인 범위</strong> ${escapeHtml(group.limit)}</p></li>`).join('')}</ul></details></aside>`);
    await writeFileUtf8(file, serialize(page));
  }
  const homeFile = path.join(root, 'index.html');
  const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd());
  home('#ss-home-regional-review').remove();
  if (home('#ss-home-source-review').length !== 1) throw new Error('Expected source review home note');
  home('#ss-home-source-review').append(`<span id="ss-home-regional-review"> · ${REGIONAL_SOURCE_REVIEWS.map(review => `<a href="/${review.slug}/#ss-${review.id}-source-review">${escapeHtml(review.label)} 재대조</a>`).join(' · ')}</span>`);
  home('meta[property="og:updated_time"]').attr('content', REGIONAL_MODIFIED);
  home('script.rank-math-schema').each((_, script) => {
    const schema = JSON.parse(home(script).text());
    for (const node of schema['@graph'] || [schema]) if (node.dateModified) node.dateModified = REGIONAL_MODIFIED;
    home(script).text(JSON.stringify(schema));
  });
  await writeFileUtf8(homeFile, serialize(home));
  const mapFile = path.join(root, 'page-sitemap.xml');
  const map = load(await fs.readFile(mapFile, 'utf8'), { xml: true });
  const entry = map('url').filter((_, node) => map(node).find('loc').text() === 'https://shootsense.com/');
  if (entry.length !== 1) throw new Error('Unexpected homepage sitemap entry');
  entry.find('lastmod').text(REGIONAL_MODIFIED);
  await writeFileUtf8(mapFile, map.xml().trimEnd() + '\n');
  const indexFile = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(indexFile, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => /\/(post|page)-sitemap\.xml$/.test(index(node).find('loc').text())).find('lastmod').text(REGIONAL_MODIFIED);
  await writeFileUtf8(indexFile, index.xml().trimEnd() + '\n');
  return { revisedArticles: REGIONAL_SOURCE_REVIEWS.map(review => review.slug), references: 12, directPages: 9, indexedPages: 3 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await finalizeRegionalSourceReview()));
