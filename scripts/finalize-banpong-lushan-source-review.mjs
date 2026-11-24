import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { BANPONG_SLUG, LUSHAN_SLUG, BANPONG_EVENT_URL, LUSHAN_ACCESS_URL, LUSHAN_TICKET_URL, LUSHAN_MULTIDAY_URL, BANPONG_LUSHAN_MODIFIED } from './banpong-lushan-content.mjs';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';

export const BANPONG_LUSHAN_SOURCE_REVIEWS = [
  { slug: BANPONG_SLUG, id: 'banpong', label: '반퐁 행사·귀환 조건', marker: '20:10 − 00:25 − 00:15 = 19:30',
    note: '과거 행사·현재 개최·발권·귀환 여유를 구분했습니다. 시청 자료는 공식 검색 색인, 관광청·국철 도움말은 원문 대조이며 실제 개최·왕복 판매를 확인한 후기는 아닙니다.',
    groups: [
      { title: '과거 행사와 현재 답변', checked: '시청 행사 기록과 관광 목록의 공식 검색 색인을 대조했습니다. 2566년의 행사 날짜와 최근 수집 시점은 다릅니다.', limit: '직접 원문 조회가 지연됐으며 색인과 현재 원문은 다를 수 있습니다. 방문 주 개최는 미확인입니다.', links: [['2023년 시장 기록', BANPONG_EVENT_URL], ['시청 관광 목록', 'https://www.banpong.go.th/public/list/data/index/menu/1545']] },
      { title: '낮 방문 후보와 대표 문의 창구', checked: '관광청 거리미술 원문과 시청 대표 창구의 공식 검색 색인을 대조했습니다.', limit: '현재 작품·보행 환경·현 행사장과 대표 창구의 회신을 확인하지 않았습니다.', links: [['관광청 랏차부리 동선', 'https://petfriendly.tourismthailand.org/en/%E0%B9%80%E0%B8%AA%E0%B9%89%E0%B8%99%E0%B8%97%E0%B8%B2%E0%B8%87%E0%B8%97%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%A2%E0%B8%A7-%E0%B8%88%E0%B8%B1%E0%B8%87%E0%B8%AB%E0%B8%A7/'], ['시청 대표 창구', 'https://www.banpong.go.th/public/']] },
      { title: '다른 장소와 표 발행 상태', checked: '관광청 사원 소개와 국철 도움말 원문을 읽었습니다. 역 결제용 예약번호와 결제 후 발행되는 표를 구분했습니다.', limit: '사원 방문일 개방·반퐁 정차·결제·발권을 시험하지 않았습니다.', links: [['관광청 사원 소개', 'https://www.tourismthailand.org/Articles/temple-nearby-bangkok'], ['D-Ticket 도움말', 'https://dticket.railway.co.th/DTicketPublicWeb/help/']] },
      { title: '동적 운행·판매 결과의 한계', checked: '시간표는 로딩 화면, 판매 페이지는 읽을 수 있는 본문 없는 상태까지 확인했습니다.', limit: '페이지 접근과 실제 열차 행·잔여 좌석·판매 성공은 다릅니다. 막차·요금을 제시하지 않습니다.', links: [['국철 남부선 시간표', 'https://ttsview.railway.co.th/timetable_modern.php?line=4&ln=en&trip=1'], ['국철 판매 경로', 'https://dticket.railway.co.th/']] }
    ]
  },
  { slug: LUSHAN_SLUG, id: 'lushan', label: '루산 입장·교통권 범위', marker: '두 종류의 ‘7일’도 따로 확인합니다',
    note: 'UNESCO 원문과 정부 자료 3개의 공식 검색 색인을 대조했습니다. 입장권의 다일·주변 관광구역 범위와 별도 차량·케이블카를 구분하며 현재 운행·여권 예약은 미확인입니다.',
    groups: [
      { title: '유산 소개와 다일 입장 범위', checked: 'UNESCO 원문과 정부 다일 이용 안내의 검색 색인을 읽었습니다. URL의 월과 본문 게시일, 입장권의 주변 구역 포함을 구분했습니다.', limit: '주변 모든 시설·교통 포함이나 본인 여권의 현재 재입장 조건을 확인한 것은 아닙니다.', links: [['UNESCO 루산', 'https://whc.unesco.org/en/list/778/'], ['정부 다일 이용 안내', LUSHAN_MULTIDAY_URL]] },
      { title: '역·방향·운영표 적용 구간', checked: '2024년 정부 교통 안내의 검색 색인에서 역·환승센터·단방향 정류장과 여러 운영표를 대조했습니다.', limit: '직접 원문 조회는 실패했습니다. 18:00·19:00을 내 노선의 확정 막차로 고르지 않습니다.', links: [['정부 관광차량 안내', LUSHAN_ACCESS_URL]] },
      { title: '게시 가격·교통권 유효기간', checked: '2025년 핵심구역 소개의 검색 색인에서 기존 게시 가격과 차량권 7일 문구를 재대조했습니다.', limit: '차량권 기산·횟수·현재 판매·할인·한국 여권 발권은 미확인입니다. 색인과 현재 원문은 다를 수 있습니다.', links: [['정부 핵심구역 안내', LUSHAN_TICKET_URL]] }
    ]
  }
];
const serialize = page => page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';

export async function finalizeBanpongLushanSourceReview(root = process.cwd()) {
  for (const review of BANPONG_LUSHAN_SOURCE_REVIEWS) {
    const file = path.join(root, review.slug, 'index.html');
    const page = load((await fs.readFile(file, 'utf8')).trimEnd());
    if (!page('.ss-post-body').text().includes(review.marker) || page('.ss-trust-box').length !== 1) throw new Error(`Rebuild revised ${review.id} article before finalization`);
    page(`#ss-${review.id}-source-review`).remove();
    page('.ss-trust-box').after(`<aside id="ss-${review.id}-source-review" class="ss-review-notice ss-source-review"><p><strong>2026-11-24 공개 자료 재대조</strong> · ${escapeHtml(review.note)}</p><details><summary>확인한 출처와 남아 있는 조건</summary><ul>${review.groups.map(group => `<li><strong>${escapeHtml(group.title)}</strong><p>${escapeHtml(group.checked)} ${group.links.map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join(' · ')}</p><p><strong>미확인 범위</strong> ${escapeHtml(group.limit)}</p></li>`).join('')}</ul></details></aside>`);
    await writeFileUtf8(file, serialize(page));
  }
  const homeFile = path.join(root, 'index.html');
  const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd());
  home('#ss-home-banpong-lushan-review').remove();
  if (home('#ss-home-source-review').length !== 1) throw new Error('Expected source review home note');
  home('#ss-home-source-review').append(`<span id="ss-home-banpong-lushan-review"> · ${BANPONG_LUSHAN_SOURCE_REVIEWS.map(review => `<a href="/${review.slug}/#ss-${review.id}-source-review">${escapeHtml(review.label)} 재대조</a>`).join(' · ')}</span>`);
  home('meta[property="og:updated_time"]').attr('content', BANPONG_LUSHAN_MODIFIED);
  home('script.rank-math-schema').each((_, script) => {
    const schema = JSON.parse(home(script).text());
    for (const node of schema['@graph'] || [schema]) if (node.dateModified) node.dateModified = BANPONG_LUSHAN_MODIFIED;
    home(script).text(JSON.stringify(schema));
  });
  await writeFileUtf8(homeFile, serialize(home));
  const mapFile = path.join(root, 'page-sitemap.xml');
  const map = load(await fs.readFile(mapFile, 'utf8'), { xml: true });
  const entry = map('url').filter((_, node) => map(node).find('loc').text() === 'https://shootsense.com/');
  if (entry.length !== 1) throw new Error('Unexpected homepage sitemap entry');
  entry.find('lastmod').text(BANPONG_LUSHAN_MODIFIED);
  await writeFileUtf8(mapFile, map.xml().trimEnd() + '\n');
  const indexFile = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(indexFile, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => /\/(post|page)-sitemap\.xml$/.test(index(node).find('loc').text())).find('lastmod').text(BANPONG_LUSHAN_MODIFIED);
  await writeFileUtf8(indexFile, index.xml().trimEnd() + '\n');
  return { revisedArticles: BANPONG_LUSHAN_SOURCE_REVIEWS.map(review => review.slug), references: 12, readablePages: 4, indexedPages: 6, dynamicPagesUnconfirmed: 2 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await finalizeBanpongLushanSourceReview()));
