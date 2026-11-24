import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';

export const PACKING_SLUG = 'honja-yeohaeng-junbimul-checklist';
export const PACKING_REVIEW_MODIFIED = '2026-11-24T22:08:00+09:00';
export const PACKING_REVIEW_GROUPS = [
  { title: '배터리의 종류와 자료 적용 범위', checked: 'IATA 일반 안내와 2026-03-31 여객 안내 PDF의 보조배터리·여분 배터리 구분, 손상·단락 방지, 운항사 확인 원칙을 읽었습니다.', limit: 'PDF는 단독 규정 준수 판정용이 아닙니다. 제품·노선별 반입 승인과 의료기기·이동보조기기의 별도 절차를 확인한 것은 아닙니다.', links: [['IATA 여행자 안내', 'https://www.iata.org/en/youandiata/travelers/batteries'], ['IATA 2026 여객 안내 PDF', 'https://www.iata.org/contentassets/6fea26dd84d24b26a7a1fd5788561d6e/passengers_travelling_with_lithium_batteries.pdf']] },
  { title: '오래된 개수와 새 적용일', checked: '대한항공 1월 26일 적용 공지의 5개와 4월 20일 적용 공지의 2개를 대조하고 현재 제한 표의 용량별 승인·배터리 구분·사용·보관 조건을 읽었습니다.', limit: '1월 수치를 현재 보조배터리 허용 개수로 쓰지 않습니다. 다른 항공사·해외 출발·경유 조건이나 본인 제품의 허용을 판정하지 않습니다.', links: [['대한항공 1월 공지 · 과거 수치', 'https://www.koreanair.com/contents/footer/customer-support/notice/2026/260123-lithium-batteries?pageNum=1'], ['대한항공 4월 20일 적용 공지', 'https://www.koreanair.com/contents/footer/customer-support/notice/2026/260410-powerbanks-guide'], ['대한항공 운송 제한 물품', 'https://www.koreanair.com/contents/plan-your-travel/baggage/restricted-item?openTabId=tab-restricted-items-3']] },
  { title: '다운로드한 지도의 기능', checked: 'Google 지도 Android 도움말에서 일부 지역 다운로드 제한과 오프라인 도보·자전거·대중교통 경로 제한을 읽었습니다.', limit: '다른 앱·운영체제로 일반화하지 않습니다. 개인 기기의 저장 파일·지도·로그인·현재 운행을 실제 시험한 기록은 아닙니다.', links: [['Google 지도 Android 오프라인 도움말', 'https://support.google.com/maps/answer/6291838?hl=ko']] },
  { title: '사본과 유효한 여행 문서', checked: '외교부 여권 사용 안내에서 국가별 유효기간·비자 확인과 여권 사본의 역할을 대조했습니다.', limit: '사본을 실제 여행 문서로 대체하지 않습니다. 개인의 입국·통과 허가를 판정하거나 여권 전체 정보를 보관하는 도구가 아닙니다.', links: [['외교부 여권 사용 안내', 'https://passport.go.kr/home/kor/contents.do?menuPos=50']] }
];
const serialize = page => page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';
const latest = (current, proposed) => Date.parse(current) > Date.parse(proposed) ? current : proposed;
function dates(page, proposed) {
  const modified = latest(page('meta[property="og:updated_time"]').attr('content'), proposed);
  for (const selector of ['meta[property="og:updated_time"]', 'meta[property="article:modified_time"]']) page(selector).attr('content', modified);
  page('script.rank-math-schema').each((_, script) => {
    const schema = JSON.parse(page(script).text());
    for (const node of schema['@graph'] || [schema]) if (['WebPage', 'BlogPosting', 'Article'].includes(node['@type'])) node.dateModified = modified;
    page(script).text(JSON.stringify(schema));
  });
}

export async function finalizePackingSourceReview(root = process.cwd()) {
  const file = path.join(root, PACKING_SLUG, 'index.html');
  const page = load((await fs.readFile(file, 'utf8')).trimEnd());
  if (!page('.ss-post-body').text().includes('비행기 모드만으로 인터넷이 끊겼다고 가정하지 않습니다')) throw new Error('Rebuild packing guide first');
  if (page('.ss-trust-box').length !== 1 || page('.ss-trust-note').length !== 1) throw new Error('Expected packing review metadata');
  page('#ss-packing-source-review').remove();
  page('.ss-trust-box').after(`<aside id="ss-packing-source-review" class="ss-packing-sources"><p><strong>2026-11-24 공개 자료 재대조</strong> · 항공사의 실제 반입 승인이나 개인 기기의 작동 시험을 완료한 기록은 아닙니다.</p><details><summary>확인한 출처와 남아 있는 조건</summary><ul>${PACKING_REVIEW_GROUPS.map(group => `<li><strong>${escapeHtml(group.title)}</strong><p>${escapeHtml(group.checked)} ${group.links.map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join(' · ')}</p><p><strong>미확인 범위</strong> ${escapeHtml(group.limit)}</p></li>`).join('')}</ul></details></aside>`);
  page('.ss-trust-note').html(page('.ss-trust-note').html().replace(/최종 검토일: \d{4}-\d{2}-\d{2}/, '최종 검토일: 2026-11-24'));
  page('.ss-post-meta span').filter((_, node) => page(node).text().startsWith('최종 수정 ')).text('최종 수정 2026-11-24');
  dates(page, PACKING_REVIEW_MODIFIED);
  await writeFileUtf8(file, serialize(page));
  const homeFile = path.join(root, 'index.html');
  const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd());
  home('#ss-home-packing-review').remove();
  if (home('#ss-home-source-review').length !== 1) throw new Error('Expected home review note');
  home('#ss-home-source-review').append(`<span id="ss-home-packing-review"> · <a href="/${PACKING_SLUG}/#ss-packing-source-review">배터리 근거·오프라인 점검 재대조</a></span>`);
  dates(home, PACKING_REVIEW_MODIFIED);
  await writeFileUtf8(homeFile, serialize(home));
  for (const name of ['post-sitemap.xml', 'page-sitemap.xml']) {
    const mapFile = path.join(root, name);
    const map = load(await fs.readFile(mapFile, 'utf8'), { xml: true });
    const url = name === 'post-sitemap.xml' ? `https://shootsense.com/${PACKING_SLUG}/` : 'https://shootsense.com/';
    const entry = map('url').filter((_, node) => map(node).find('loc').text() === url);
    if (entry.length !== 1) throw new Error(`Expected one sitemap entry: ${url}`);
    entry.find('lastmod').text(latest(entry.find('lastmod').text(), PACKING_REVIEW_MODIFIED));
    await writeFileUtf8(mapFile, map.xml().trimEnd() + '\n');
  }
  const indexFile = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(indexFile, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => /\/(post|page)-sitemap\.xml$/.test(index(node).find('loc').text())).find('lastmod').each((_, node) => index(node).text(latest(index(node).text(), PACKING_REVIEW_MODIFIED)));
  await writeFileUtf8(indexFile, index.xml().trimEnd() + '\n');
  return { revisedArticle: PACKING_SLUG, sourceLinks: 7, actualDeviceTestOrApprovalClaimed: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await finalizePackingSourceReview()));
