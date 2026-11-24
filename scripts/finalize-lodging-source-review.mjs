import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';
import { protectToolLinks } from './preserve-tool-navigation.mjs';

export const LODGING_REVIEW_MODIFIED = '2026-11-24T21:50:00+09:00';
export const LODGING_SLUG = 'honja-yeohaeng-sukso-goreuneun-beop';
export const LODGING_REVIEW_GROUPS = [
  { title: '최종 표시 가격과 과거 조사', checked: '2023-08-10 한국소비자원 카드뉴스의 세금·수수료 표시와 환불 불가 조건 조사 내용을 다시 읽었습니다.', limit: '2023년 조사이며 현재 모든 플랫폼의 운영이나 개인 예약의 환불 권리를 판정하는 자료가 아닙니다.', label: '한국소비자원 2023년 숙박 플랫폼 조사', href: 'https://www.kca.go.kr/home/sub.do?cate=00000051&menukey=4004&mode=view&no=1003550544' },
  { title: '체크인과 예약 채널의 적용 범위', checked: 'Super Hotel FAQ의 일반 체크인 안내·지점 예외와 공식 사이트 외 예약의 문의 채널 구분을 읽었습니다.', limit: '다른 숙소에 일반화하지 않습니다. 특정 지점·판매 상품의 도착 허용·취소·환급을 확인한 답변이 아닙니다.', label: 'Super Hotel 공식 FAQ', href: 'https://www.superhoteljapan.com/en/faq01.html' }
];
const serialize = page => page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';
const latest = (current, proposed) => Date.parse(current) > Date.parse(proposed) ? current : proposed;
function dates(page, modified) {
  for (const selector of ['meta[property="og:updated_time"]', 'meta[property="article:modified_time"]']) page(selector).attr('content', modified);
  page('script.rank-math-schema').each((_, script) => {
    const schema = JSON.parse(page(script).text());
    for (const node of schema['@graph'] || [schema]) if (['WebPage', 'BlogPosting', 'Article', 'WebApplication'].includes(node['@type'])) node.dateModified = modified;
    page(script).text(JSON.stringify(schema));
  });
}
function sourcePanel(id) {
  return `<aside id="${id}" class="ss-lodging-sources"><p><strong>2026-11-24 공개 자료·계산 재대조</strong> · 실제 숙소 견적·예약·취소·환급을 확인한 후기가 아닙니다.</p><details><summary>확인한 출처와 남아 있는 조건</summary><ul>${LODGING_REVIEW_GROUPS.map(group => `<li><strong>${escapeHtml(group.title)}</strong><p>${escapeHtml(group.checked)} <a href="${escapeHtml(group.href)}">${escapeHtml(group.label)}</a></p><p><strong>미확인 범위</strong> ${escapeHtml(group.limit)}</p></li>`).join('')}</ul></details></aside>`;
}

export async function finalizeLodgingSourceReview(root = process.cwd()) {
  const changed = [`${LODGING_SLUG}/index.html`, 'tools/stay-compare/index.html', 'tools/trip-board/index.html', 'index.html'];
  for (const relative of changed) {
    const file = path.join(root, relative);
    const page = load((await fs.readFile(file, 'utf8')).trimEnd());
    if (relative.startsWith(LODGING_SLUG)) {
      if (!page('.ss-post-body').text().includes('금액 차이와 저렴한 후보 판정을 보류')) throw new Error('Rebuild lodging guide first');
      page('#ss-lodging-source-review').remove();
      page('.ss-trust-box').after(sourcePanel('ss-lodging-source-review'));
      page('.ss-trust-note').html(page('.ss-trust-note').html().replace(/최종 검토일: \d{4}-\d{2}-\d{2}/, '최종 검토일: 2026-11-24'));
      page('.ss-post-meta span').filter((_, node) => page(node).text().startsWith('최종 수정 ')).text('최종 수정 2026-11-24');
    } else if (relative === 'tools/stay-compare/index.html') {
      page('#ss-lodging-tool-sources, #ss-cost-completeness').remove();
      page('.ss-tool-method h2').first().after('<p id="ss-cost-completeness">빈 비용은 0원이 아니라 미확인입니다. 입력된 금액 소계에는 미확인 항목을 포함하지 않으며, 비용 빈칸이 있으면 금액 차이·저렴한 후보 판정을 보류합니다. 아직 확인하지 못한 금액은 빈칸으로, 비용이 없다고 확인한 항목은 0원으로 구분합니다.</p>');
      page('.ss-tool-method').append(sourcePanel('ss-lodging-tool-sources'));
      protectToolLinks(page, '/tools/stay-compare/');
    } else if (relative === 'index.html') {
      page('#ss-home-lodging-review').remove();
      if (page('#ss-home-source-review').length !== 1) throw new Error('Expected home review note');
      page('#ss-home-source-review').append(`<span id="ss-home-lodging-review"> · <a href="/${LODGING_SLUG}/#ss-lodging-source-review">숙소 예약 근거·미확인 비용 재대조</a></span>`);
    }
    dates(page, latest(page('meta[property="og:updated_time"]').attr('content'), LODGING_REVIEW_MODIFIED));
    await writeFileUtf8(file, serialize(page));
  }
  for (const name of ['post-sitemap.xml', 'page-sitemap.xml']) {
    const file = path.join(root, name);
    const map = load(await fs.readFile(file, 'utf8'), { xml: true });
    const urls = name === 'post-sitemap.xml' ? [`https://shootsense.com/${LODGING_SLUG}/`] : ['https://shootsense.com/', 'https://shootsense.com/tools/stay-compare/', 'https://shootsense.com/tools/trip-board/'];
    for (const url of urls) {
      const entry = map('url').filter((_, node) => map(node).find('loc').text() === url);
      if (entry.length !== 1) throw new Error(`Expected one sitemap entry: ${url}`);
      entry.find('lastmod').text(latest(entry.find('lastmod').text(), LODGING_REVIEW_MODIFIED));
    }
    await writeFileUtf8(file, map.xml().trimEnd() + '\n');
  }
  const file = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(file, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => /\/(post|page)-sitemap\.xml$/.test(index(node).find('loc').text())).find('lastmod').each((_, node) => index(node).text(latest(index(node).text(), LODGING_REVIEW_MODIFIED)));
  await writeFileUtf8(file, index.xml().trimEnd() + '\n');
  return { updatedPages: changed.length, unknownCostsExcluded: true, missingCostsSuppressRanking: true };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await finalizeLodgingSourceReview()));
