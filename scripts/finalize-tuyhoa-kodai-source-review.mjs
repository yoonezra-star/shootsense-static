import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { TUYHOA_SLUG, KODAI_SLUG, TUYHOA_KODAI_MODIFIED } from './tuyhoa-kodai-content.mjs';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';

export const TUYHOA_KODAI_SOURCE_REVIEWS = [
  { slug: TUYHOA_SLUG, id: 'tuyhoa', label: '투이호아 도착·입실 조건', marker: '22:50 + 00:35 + 00:45 = 다음 날 00:10',
    note: '공식 안내 5개를 재검토했습니다. 주소·도착 시설·발권·자정 이후 입실을 나눴으며 실제 운항·판매·픽업·입장을 확인한 후기는 아닙니다.',
    groups: [
      { title: '지명과 도착 시설', checked: '성 정부·관광청 원문에서 통합 발표와 Dak Lak·Phu Yen 표기, 공항·역 소개를 대조했습니다.', limit: '개별 숙소 주소·방문일 항공과 열차·차량 배정을 확인하지 않았습니다.', links: [['닥락성 통합 발표', 'https://daklak.gov.vn/web/english/-/announcement-of-resolutions-and-decisions-on-the-reorganization-of-administrative-units-in-dak-lak-province-new-'], ['국가관광청 지역 소개', 'https://vietnam.travel/places-to-go/south-central-coast-central-highlands/phu-yen']] },
      { title: '철도 구매와 적용 기간', checked: '철도 구매 안내와 판매 페이지를 읽었습니다. 읽힌 2025년 설·2023년 규정을 본인 표의 현재 규정으로 바꾸지 않습니다.', limit: '표 조회·결제·발권·변경·환급을 시험하지 않았습니다. 카드 알림과 실제 탑승표는 별도로 확인해야 합니다.', links: [['철도 구매 안내', 'https://giavere.dsvn.vn/dsvn/huong-dan-mua-ve'], ['철도 공식 판매 경로', 'https://dsvn.vn/']] },
      { title: '기상 자료의 유효 범위', checked: '국가 예보센터의 육상·해상 자료 접근 경로를 확인했습니다.', limit: '지정 해안의 현재 통제·출항·입수 가능을 확인하지 않았습니다. 기상 자료는 방문 위치·발표와 적용 시각을 다시 맞춰야 합니다.', links: [['국가 수문기상예보센터', 'https://nchmf.gov.vn/Kttv/vi-VN/1/index.html?cul=vi-VN&tabid=1']] }
    ]
  },
  { slug: KODAI_SLUG, id: 'kodai', label: '코다이카날 신청·집결 조건', marker: '12:20에 90분을 더한 13:50',
    note: 'IIA 방문 안내 원문을 읽어 이전 조회 한계를 갱신했습니다. 연결 양식 내용·e-pass 조건은 조회하지 못했으며 신청·발급·개인 방문 승인을 확인하지 않았습니다.',
    groups: [
      { title: '지역 소개와 운영기관 방문 안내', checked: '2018년 관광 소개와 2024-11-20 갱신 표시의 IIA 원문을 대조했습니다. 신청 선행 기간·단체 집결·일요일 시간·최대 체류를 나눴습니다.', limit: '신청 링크는 확인했지만 연결된 Google 양식 내용은 열지 못했습니다. 개인 방문 가능 시간·최종 입장·승인은 미확인입니다.', links: [['딘디굴 관광 소개', 'https://dindigul.nic.in/tourist-place/kodaikanal/'], ['IIA KSO 방문 안내', 'https://www.iiap.res.in/outreach/visit-us/visiting-kso/']] },
      { title: '도로 진입 조건의 별도 확인', checked: '지구 정부 홈페이지를 읽었고 e-pass 포털 접근은 시도했으나 지연으로 내용을 확인하지 못했습니다.', limit: '현재 쿼터·면제·마감·수수료·차량별 적용을 제시하지 않습니다. 포털 조회 실패가 의무 폐지나 진입 허가를 뜻하지 않습니다.', links: [['딘디굴 지구 정부', 'https://dindigul.nic.in/'], ['타밀나두 e-pass 포털 · 조건 미확인', 'https://tnepass.tn.gov.in/']] },
      { title: '연구 자료와 현장 방문의 차이', checked: 'KSO 공식 디지털 아카이브 소개를 읽었습니다.', limit: '온라인 데이터 접근은 현장 전시·관측 참여·망원경 체험 승인이 아닙니다.', links: [['KSO 연구 아카이브', 'https://kso.iiap.res.in/new']] }
    ]
  }
];
const serialize = page => page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';

export async function finalizeTuyhoaKodaiSourceReview(root = process.cwd()) {
  for (const review of TUYHOA_KODAI_SOURCE_REVIEWS) {
    const file = path.join(root, review.slug, 'index.html');
    const page = load((await fs.readFile(file, 'utf8')).trimEnd());
    if (!page('.ss-post-body').text().includes(review.marker) || page('.ss-trust-box').length !== 1) throw new Error(`Rebuild revised ${review.id} article before finalization`);
    page(`#ss-${review.id}-source-review, #ss-november-recheck`).remove();
    page('.ss-trust-box').after(`<aside id="ss-${review.id}-source-review" class="ss-review-notice ss-source-review"><p><strong>2026-11-24 공개 자료 재대조</strong> · ${escapeHtml(review.note)}</p><details><summary>확인한 출처와 남아 있는 조건</summary><ul>${review.groups.map(group => `<li><strong>${escapeHtml(group.title)}</strong><p>${escapeHtml(group.checked)} ${group.links.map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join(' · ')}</p><p><strong>미확인 범위</strong> ${escapeHtml(group.limit)}</p></li>`).join('')}</ul></details></aside>`);
    await writeFileUtf8(file, serialize(page));
  }
  const homeFile = path.join(root, 'index.html');
  const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd());
  home('#ss-home-tuyhoa-kodai-review').remove();
  if (home('#ss-home-source-review').length !== 1) throw new Error('Expected source review home note');
  home('#ss-home-source-review').append(`<span id="ss-home-tuyhoa-kodai-review"> · ${TUYHOA_KODAI_SOURCE_REVIEWS.map(review => `<a href="/${review.slug}/#ss-${review.id}-source-review">${escapeHtml(review.label)} 재대조</a>`).join(' · ')}</span>`);
  home('meta[property="og:updated_time"]').attr('content', TUYHOA_KODAI_MODIFIED);
  home('script.rank-math-schema').each((_, script) => {
    const schema = JSON.parse(home(script).text());
    for (const node of schema['@graph'] || [schema]) if (node.dateModified) node.dateModified = TUYHOA_KODAI_MODIFIED;
    home(script).text(JSON.stringify(schema));
  });
  await writeFileUtf8(homeFile, serialize(home));
  const mapFile = path.join(root, 'page-sitemap.xml');
  const map = load(await fs.readFile(mapFile, 'utf8'), { xml: true });
  const entry = map('url').filter((_, node) => map(node).find('loc').text() === 'https://shootsense.com/');
  if (entry.length !== 1) throw new Error('Unexpected homepage sitemap entry');
  entry.find('lastmod').text(TUYHOA_KODAI_MODIFIED);
  await writeFileUtf8(mapFile, map.xml().trimEnd() + '\n');
  const indexFile = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(indexFile, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => /\/(post|page)-sitemap\.xml$/.test(index(node).find('loc').text())).find('lastmod').text(TUYHOA_KODAI_MODIFIED);
  await writeFileUtf8(indexFile, index.xml().trimEnd() + '\n');
  return { revisedArticles: TUYHOA_KODAI_SOURCE_REVIEWS.map(review => review.slug), references: 10, readablePages: 9, unavailablePortal: 1, applicationFormUntested: true };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await finalizeTuyhoaKodaiSourceReview()));
