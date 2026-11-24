import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { SAFI_SLUG, MLEIHA_SLUG, SAFI_MLEIHA_MODIFIED, UAE_SAFETY_URL, UAE_ALERT_URL } from './safi-mleiha-content.mjs';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';

export const SAFI_MLEIHA_SOURCE_REVIEWS = [
  { slug: SAFI_SLUG, id: 'safi', label: '사피 전시·포장·귀환 조건', marker: '30 − 35 = −5분',
    note: '박물관·관광청 원문을 다시 읽고 공방 수령이 체류에 미치는 가상 계산을 추가했습니다. ONCF 안내·판매 본문은 조회하지 못했으며 실제 왕복편·공방 작업·구매를 확인한 후기는 아닙니다.',
    groups: [
      { title: '박물관과 공방의 다른 목적', checked: 'FNM 원문에서 주소·10:00~18:00·화요일 휴관·성인 20 DH를 대조하고 관광청의 지역 소개를 읽었습니다.', limit: '최종 입장·특별 휴관·공방 방문·포장 약속·배송은 확인하지 않았습니다.', links: [['FNM 국립 도자기 박물관', 'https://www.fnm.ma/museums/29'], ['모로코 관광청 사피', 'https://www.visitmorocco.com/en/travel/safi']] },
      { title: '왕복 판매와 도착 시각', checked: 'ONCF 여행자 안내와 판매 페이지의 조회를 시도했으나 지연으로 내용을 읽지 못했습니다.', limit: '페이지 조회 실패로 운휴를 판단하지 않으며 PDF 적용일·방문일 열차·환승·운임·결제를 확정하지 않았습니다.', links: [['ONCF 여행자 안내 · 조회 미확인', 'https://www.oncf.ma/fr/Voyageurs'], ['ONCF 판매 경로 · 판매 미확인', 'https://voyages.oncf.ma/']] },
      { title: '방문 시점의 안전 자료', checked: '외교부 해외안전여행 메인 접근 경로를 확인했습니다.', limit: '모로코 특정 지역의 경보·해안 기상·입수 가능을 이 글에서 새로 판정한 것은 아닙니다.', links: [['외교부 해외안전여행', 'https://www.0404.go.kr/main/mainPage']] }
    ]
  },
  { slug: MLEIHA_SLUG, id: 'mleiha', label: '믈레이하 경보·예약 보류 조건', marker: '2026-11-24는 다시 읽은 날짜이지 새 경보 발령일이 아닙니다',
    note: '2026-11-24 UAE 전 지역 출국권고 표시를 재확인했습니다. 기존 예약 변경·향후 재검토용 자료이며 현재 관광 예약이나 도심 대체 방문을 권하지 않습니다.',
    groups: [
      { title: '경보와 행동요령을 먼저', checked: '국가정보의 출국권고 표시와 2026-03-08 공지의 UAE 전역 3단계(철수권고)·취소/연기·철수 안내를 원문으로 읽었습니다.', limit: '오늘을 새 발령일로 쓰지 않습니다. 개인의 출국 경로·항공 정상 운항·자동 환불을 판정하지 않습니다.', links: [['외교부 UAE 국가정보', UAE_SAFETY_URL], ['2026-03-08 경보 조정', UAE_ALERT_URL], ['외교부 최신 공지 경로', 'https://www.0404.go.kr/main/mainPage']] },
      { title: '센터와 도심 박물관은 별도', checked: '관광청·국가 문화지도 원문에서 중부 지역 센터·약 65km 설명과 공식 연결 경로를 확인했습니다.', limit: '연결된 운영사 사이트는 열지 못했습니다. 현재 상품·취소 조건·픽업·시설 개방은 미확인입니다.', links: [['샤르자 관광청 믈레이하', 'https://www.visitsharjah.com/activities/adventure/mleiha-national-park/'], ['UAE 국가 문화지도', 'https://culturalmap.gov.ae/en/facilities/mleiha-archaeological-center']] },
      { title: '시간·요금의 향후 참고 범위', checked: '박물관 소개 원문은 열렸으나 후속 조회 지연으로 시간·요금은 공식 검색 색인을 대조했습니다. 일반 금요일·라마단, 기본권·공동권을 분리했습니다.', limit: '색인과 현재 원문은 다를 수 있습니다. 방문일 운영·최종 입장·표 구매·환불은 확인하지 않았으며 지금의 관광 대안이 아닙니다.', links: [['박물관청 고고학 박물관', 'https://www.sharjahmuseums.ae/en-US/Museums/Sharjah-Archaeology-Museum']] }
    ]
  }
];
const serialize = page => page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';

export async function finalizeSafiMleihaSourceReview(root = process.cwd()) {
  for (const review of SAFI_MLEIHA_SOURCE_REVIEWS) {
    const file = path.join(root, review.slug, 'index.html');
    const page = load((await fs.readFile(file, 'utf8')).trimEnd());
    if (!page('.ss-post-body').text().includes(review.marker) || page('.ss-trust-box').length !== 1) throw new Error(`Rebuild revised ${review.id} article before finalization`);
    page(`#ss-${review.id}-source-review, #ss-november-recheck`).remove();
    const panel = `<aside id="ss-${review.id}-source-review" class="ss-review-notice ss-source-review"><p><strong>2026-11-24 공개 자료 재대조</strong> · ${escapeHtml(review.note)}</p><details><summary>확인한 출처와 남아 있는 조건</summary><ul>${review.groups.map(group => `<li><strong>${escapeHtml(group.title)}</strong><p>${escapeHtml(group.checked)} ${group.links.map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join(' · ')}</p><p><strong>미확인 범위</strong> ${escapeHtml(group.limit)}</p></li>`).join('')}</ul></details></aside>`;
    if (review.id === 'mleiha') {
      const warning = page('.ss-post-body').children().first();
      if (!warning.is('.ss-review-notice') || !warning.text().includes('UAE 전 지역 출국권고')) throw new Error('Mleiha warning must remain first');
      warning.after(panel);
    } else page('.ss-trust-box').after(panel);
    await writeFileUtf8(file, serialize(page));
  }
  const homeFile = path.join(root, 'index.html');
  const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd());
  home('#ss-home-safi-mleiha-review').remove();
  if (home('#ss-home-source-review').length !== 1) throw new Error('Expected source review home note');
  home('#ss-home-source-review').append(`<span id="ss-home-safi-mleiha-review"> · ${SAFI_MLEIHA_SOURCE_REVIEWS.map(review => `<a href="/${review.slug}/#ss-${review.id}-source-review">${escapeHtml(review.label)} 재대조</a>`).join(' · ')}</span>`);
  home('meta[property="og:updated_time"]').attr('content', SAFI_MLEIHA_MODIFIED);
  home('script.rank-math-schema').each((_, script) => {
    const schema = JSON.parse(home(script).text());
    for (const node of schema['@graph'] || [schema]) if (node.dateModified) node.dateModified = SAFI_MLEIHA_MODIFIED;
    home(script).text(JSON.stringify(schema));
  });
  await writeFileUtf8(homeFile, serialize(home));
  const mapFile = path.join(root, 'page-sitemap.xml');
  const map = load(await fs.readFile(mapFile, 'utf8'), { xml: true });
  const entry = map('url').filter((_, node) => map(node).find('loc').text() === 'https://shootsense.com/');
  if (entry.length !== 1) throw new Error('Unexpected homepage sitemap entry');
  entry.find('lastmod').text(SAFI_MLEIHA_MODIFIED);
  await writeFileUtf8(mapFile, map.xml().trimEnd() + '\n');
  const indexFile = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(indexFile, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => /\/(post|page)-sitemap\.xml$/.test(index(node).find('loc').text())).find('lastmod').text(SAFI_MLEIHA_MODIFIED);
  await writeFileUtf8(indexFile, index.xml().trimEnd() + '\n');
  return { revisedArticles: SAFI_MLEIHA_SOURCE_REVIEWS.map(review => review.slug), referenceLinks: 11, uniquePages: 10, railPagesUnconfirmed: 2, museumHoursIndexChecked: true };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await finalizeSafiMleihaSourceReview()));
