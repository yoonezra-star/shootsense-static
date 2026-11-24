import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { CHECKOUT_MORNING_MODIFIED, CHECKOUT_MORNING_SLUG, CHECKOUT_MORNING_SOURCES } from './checkout-morning-content.mjs';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';

export const REVIEW_MODIFIED = CHECKOUT_MORNING_MODIFIED;
const SOURCE_LABELS = { hotel: '호텔 객실 안내', station: '역 시설 안내', logistics: '보관 운영자 안내', entry: 'IC 입장 안내', sagawa: '도쿄 지점 안내', sagawaFaq: '영어 보관 FAQ', sagawaJapaneseFaq: '일본어 FAQ' };
export const SOURCE_REVIEW_ROWS = [
  { keys: ['hotel'], title: '가나자와 호텔', checked: '11:00 퇴실·당일 보관과 제외 물품 게시를 재대조했습니다.', limit: '도쿄의 호텔 규칙이나 내 예약의 보관 승인으로 옮기지 않습니다.' },
  { keys: ['station', 'logistics'], title: '도쿄역 시설·운영자', checked: '소개 페이지와 운영자 페이지의 다른 게시 시간, 두 창구의 요금 구간·반환 조건을 재대조했습니다.', limit: '게시 시간 차이의 이유와 당일 이용·빈자리·개별 회수 승인은 확인하지 못했습니다.' },
  { keys: ['entry'], title: 'JR동일본 IC 입장', checked: '일반 2시간과 도쿄역 3시간 예외를 구분해 수정했습니다.', limit: '신칸센 개찰구 이용과 모든 경로의 통과를 보장하지 않습니다.' },
  { keys: ['sagawa', 'sagawaFaq', 'sagawaJapaneseFaq'], title: '사가와 지점·언어판', checked: '새 지점 주소의 렌더링된 요금·영업시간·공항 배송 조건과 영어·일본어 FAQ를 대조했습니다.', limit: '크기 상한 설명의 범위가 다릅니다. 실제 지점의 허용·최종 금액은 별도 확인이 필요합니다.' }
];
const serialize = page => page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';
function dates(page) {
  page('meta[property="og:updated_time"], meta[property="article:modified_time"]').attr('content', REVIEW_MODIFIED);
  page('script.rank-math-schema').each((_, script) => {
    const schema = JSON.parse(page(script).text());
    for (const node of schema['@graph'] || [schema]) if (node.dateModified) node.dateModified = REVIEW_MODIFIED;
    page(script).text(JSON.stringify(schema));
  });
}

export async function finalizeCheckoutSourceReview(root = process.cwd()) {
  const articleFile = path.join(root, CHECKOUT_MORNING_SLUG, 'index.html');
  const page = load((await fs.readFile(articleFile, 'utf8')).trimEnd());
  if (!page('.ss-post-body').text().includes('도쿄역은 3시간 이내')) throw new Error('Rebuild revised checkout body before finalizing sources');
  if (page('#ss-storage-recheck').length !== 1) throw new Error('Expected one source review anchor');
  page('#ss-storage-recheck').replaceWith(`<aside id="ss-storage-recheck" class="ss-review-notice"><p><strong>2026-11-24 공식 자료 재대조</strong> · IC 입장 예외와 사가와 링크·크기 안내를 수정했습니다. 아래 확인 범위는 게시 원문의 대조이며 현장 접수·공간·교통 연결의 확인이 아닙니다.</p><details class="ss-source-note"><summary>이번에 확인한 출처와 남은 조건</summary>${SOURCE_REVIEW_ROWS.map(row => `<dl><div><dt>${escapeHtml(row.title)}</dt><dd>${escapeHtml(row.checked)} ${row.keys.map(key => `<a href="${CHECKOUT_MORNING_SOURCES[key]}">${SOURCE_LABELS[key]}</a>`).join(' · ')}</dd></div><div><dt>아직 확인하지 못한 것</dt><dd>${escapeHtml(row.limit)}</dd></div></dl>`).join('')}</details></aside>`);
  page('#ss-checkout-link-review').text(' · 2026-11-24 공식 게시 재대조: IC 입장 예외·지점 요금·사가와 언어판 차이 수정. 현장 접수·이용일 공간은 미확인.');
  page('#ss-trip-lab-links p').last().text('일정 검토기 연결은 실제 보관 승인·운행 확인이 아닙니다. 이번 원문 재대조 범위는 위 출처 설명에서 확인할 수 있습니다.');
  dates(page); await writeFileUtf8(articleFile, serialize(page));
  const departureFile = path.join(root, 'tools/departure-check/index.html');
  const departure = load((await fs.readFile(departureFile, 'utf8')).trimEnd());
  dates(departure); await writeFileUtf8(departureFile, serialize(departure));
  const homeFile = path.join(root, 'index.html');
  const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd());
  home('#ss-home-source-review').remove();
  home('#ss-home-directory').append(`<p id="ss-home-source-review"><time datetime="2026-11-24">2026.11.24 자료 재대조</time> · <a href="/${CHECKOUT_MORNING_SLUG}/#ss-storage-recheck">도쿄역 IC 입장 예외·보관 출처 수정</a></p>`);
  dates(home); await writeFileUtf8(homeFile, serialize(home));
  for (const [name, routes] of [
    ['post-sitemap.xml', [`/${CHECKOUT_MORNING_SLUG}/`]],
    ['page-sitemap.xml', ['/', '/tools/departure-check/']]
  ]) {
    const file = path.join(root, name);
    const map = load(await fs.readFile(file, 'utf8'), { xml: true });
    for (const route of routes) {
      const item = map('url').filter((_, node) => map(node).find('loc').text() === `https://shootsense.com${route}`);
      if (item.length !== 1) throw new Error(`Unexpected review sitemap entry: ${route}`);
      item.find('lastmod').text(REVIEW_MODIFIED);
    }
    await writeFileUtf8(file, map.xml().trimEnd() + '\n');
  }
  const indexFile = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(indexFile, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => /\/(post|page)-sitemap\.xml$/.test(index(node).find('loc').text())).find('lastmod').text(REVIEW_MODIFIED);
  await writeFileUtf8(indexFile, index.xml().trimEnd() + '\n');
  return { revisedArticle: CHECKOUT_MORNING_SLUG, officialPages: Object.keys(CHECKOUT_MORNING_SOURCES).length, sourceGroups: SOURCE_REVIEW_ROWS.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await finalizeCheckoutSourceReview()));
