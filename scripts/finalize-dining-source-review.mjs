import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { DINING_MODIFIED, DINING_SLUG, DINING_SOURCES } from './dining-content.mjs';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';

export const DINING_REVIEW_GROUPS = [
  { title: '메뉴·최소 주문·좌석료', keys: ['kozuki', 'ooyama'], labels: ['코즈키 본점 메뉴', '오오야마 나고야 지점'], checked: '게시 가격·최소 주문과 1인 예외를 재대조하고, 세트 포함 좌석료와 일반 좌석료를 나눴습니다.', limit: '당일 1명 입장·예약 완료·최종 청구액은 확인하지 않았습니다.' },
  { title: '학생 행사와 시간 단위', keys: ['gyukaku'], labels: ['규카쿠 학생 행사'], checked: '최소 인원·자격·제외 매장과 이용시간·주문 마감을 재대조했습니다.', limit: '내 방문일의 행사 실시와 외국 학교 증명의 인정 여부는 별도 확인이 필요합니다.' },
  { title: '주문·식권기·우선 안내', keys: ['ichiranSystem', 'ichiranFaq', 'ichiranPriority'], labels: ['이치란 주문 안내', '일반 FAQ', '우선 안내 조건'], checked: '일반 안내와 일부 매장의 별도 서비스를 구분하고 지각 시 우선 안내 제외 조건을 추가했습니다.', limit: '신청·결제·당일 착석을 시험하지 않았습니다. 우선 안내와 좌석 보장은 다릅니다.' },
  { title: '언어별 결제 안내', keys: ['sushiro', 'sushiroPaymentJapan'], labels: ['스시로 영어 안내', '일본어 결제 안내'], checked: '같은 지점의 QR 지원 표기에 차이가 남아 있음을 재대조했습니다.', limit: '어느 문서가 더 최근인지와 당일 단말기·사용자 결제 성공은 확인하지 못했습니다.' },
  { title: '식재료 정보의 한계', keys: ['ichiranAllergy'], labels: ['이치란 알레르기 정보'], checked: '재료 사용·같은 시설 취급의 구분과 운영자의 보장 한계를 재대조했습니다.', limit: '개인의 섭취 가능·의료적 안전을 판정하지 않습니다.' }
];
const serialize = page => page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';

export async function finalizeDiningSourceReview(root = process.cwd()) {
  const articleFile = path.join(root, DINING_SLUG, 'index.html');
  const page = load((await fs.readFile(articleFile, 'utf8')).trimEnd());
  if (!page('.ss-post-body').text().includes('5,100 + 385 = 5,485엔') || page('.ss-trust-box').length !== 1) throw new Error('Rebuild revised dining article before finalization');
  page('#ss-dining-source-review').remove();
  page('.ss-trust-box').after(`<aside id="ss-dining-source-review" class="ss-review-notice ss-source-review"><p><strong>2026-11-24 공식 자료 재대조</strong> · 최소 인원·세트 포함 비용·주문 마감·결제 예외를 구분했습니다. 직접 식사·예약·결제를 확인한 후기는 아닙니다.</p><details><summary>확인한 출처와 남아 있는 조건</summary><ul>${DINING_REVIEW_GROUPS.map(group => `<li><strong>${escapeHtml(group.title)}</strong><p>${escapeHtml(group.checked)} ${group.keys.map((key, i) => `<a href="${DINING_SOURCES[key]}">${escapeHtml(group.labels[i])}</a>`).join(' · ')}</p><p><strong>미확인 범위</strong> ${escapeHtml(group.limit)}</p></li>`).join('')}</ul></details></aside>`);
  await writeFileUtf8(articleFile, serialize(page));
  const homeFile = path.join(root, 'index.html');
  const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd());
  home('#ss-home-dining-review').remove();
  if (home('#ss-home-source-review').length !== 1) throw new Error('Expected source review home note');
  home('#ss-home-source-review').append(`<span id="ss-home-dining-review"> · <a href="/${DINING_SLUG}/#ss-dining-source-review">일본 식당 주문·포함 비용·마감 재대조</a></span>`);
  home('meta[property="og:updated_time"]').attr('content', DINING_MODIFIED);
  home('script.rank-math-schema').each((_, script) => {
    const schema = JSON.parse(home(script).text());
    for (const node of schema['@graph'] || [schema]) if (node.dateModified) node.dateModified = DINING_MODIFIED;
    home(script).text(JSON.stringify(schema));
  });
  await writeFileUtf8(homeFile, serialize(home));
  const mapFile = path.join(root, 'page-sitemap.xml');
  const map = load(await fs.readFile(mapFile, 'utf8'), { xml: true });
  const entry = map('url').filter((_, node) => map(node).find('loc').text() === 'https://shootsense.com/');
  if (entry.length !== 1) throw new Error('Unexpected homepage sitemap entry');
  entry.find('lastmod').text(DINING_MODIFIED);
  await writeFileUtf8(mapFile, map.xml().trimEnd() + '\n');
  const indexFile = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(indexFile, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => /\/(post|page)-sitemap\.xml$/.test(index(node).find('loc').text())).find('lastmod').text(DINING_MODIFIED);
  await writeFileUtf8(indexFile, index.xml().trimEnd() + '\n');
  return { revisedArticle: DINING_SLUG, officialPages: Object.keys(DINING_SOURCES).length, groups: DINING_REVIEW_GROUPS.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await finalizeDiningSourceReview()));
