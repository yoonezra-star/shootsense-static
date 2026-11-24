import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { SOCIAL_ACTIVITY_MODIFIED, SOCIAL_ACTIVITY_SLUG, SOCIAL_ACTIVITY_SOURCES } from './social-activity-content.mjs';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';

export const SOCIAL_REVIEW_GROUPS = [
  { title: 'GO TOKYO 공통 조건과 Route 3', keys: ['tokyo', 'asakusa'], labels: ['공통 안내', '아사쿠사 Route 3'], checked: '원문에서 신청 기간·회신 안내·실비·계절별 종료 역을 재대조했습니다.', limit: '당일 참가 가능·확정 견적·한국어 배정·정확한 마감 시각은 확인하지 않았습니다.' },
  { title: 'TFG 신청·배정·변경 경로', keys: ['tfgPolicy', 'tfgService'], labels: ['2024년 개정 약관·내장 FAQ', '서비스 안내'], checked: '직접 조회 지연으로 공식 검색 색인을 대조했습니다. 자동 접수·배정 메시지·담당자 연락과 미배정/배정 후 취소를 구분했습니다.', limit: '현재 원문과 색인은 다를 수 있으며 신청·로그인·취소 화면을 시험하지 않았습니다.' },
  { title: 'TFG 별도 FAQ와의 불일치', keys: ['tfgSeparateFaq'], labels: ['별도 Guide Policy FAQ'], checked: '원문에 3개월 전 신청·6명 일행 복수 가이드 안내가 있어, 개정 약관의 2개월·일행당 1명과 나란히 표시했습니다.', limit: '현재 적용 문서를 운영자에게 확인하지 못했습니다. 더 유리한 조건을 임의로 선택하지 않습니다.' },
  { title: '개인정보 문서의 범위', keys: ['tfgPrivacy'], labels: ['TFG 개인정보 안내'], checked: '공식 검색 색인의 2016년 갱신 표시와 연락·여행·숙소 정보의 매칭 목적을 대조했습니다.', limit: '현재 필수 입력 항목·보안 수준·실제 정보 처리를 확인한 것은 아닙니다.' }
];
const serialize = page => page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';

export async function finalizeSocialSourceReview(root = process.cwd()) {
  const articleFile = path.join(root, SOCIAL_ACTIVITY_SLUG, 'index.html');
  const page = load((await fs.readFile(articleFile, 'utf8')).trimEnd());
  if (!page('.ss-post-body').text().includes('TFG 문서 간 불일치') || page('.ss-trust-box').length !== 1) throw new Error('Rebuild revised social guide before finalization');
  page('#ss-social-source-review').remove();
  page('.ss-trust-box').after(`<aside id="ss-social-source-review" class="ss-review-notice ss-source-review"><p><strong>2026-11-24 공개 자료 재대조</strong> · 신청·배정·회신 기준을 분리했습니다. TFG 일부 문서는 직접 조회 지연으로 공식 검색 색인을 대조했으며, 직접 참가·예약 후기가 아닙니다.</p><details><summary>확인한 출처와 문서 간 차이</summary><ul>${SOCIAL_REVIEW_GROUPS.map(group => `<li><strong>${escapeHtml(group.title)}</strong><p>${escapeHtml(group.checked)} ${group.keys.map((key, i) => `<a href="${SOCIAL_ACTIVITY_SOURCES[key]}">${escapeHtml(group.labels[i])}</a>`).join(' · ')}</p><p><strong>미확인 범위</strong> ${escapeHtml(group.limit)}</p></li>`).join('')}</ul></details></aside>`);
  await writeFileUtf8(articleFile, serialize(page));
  const homeFile = path.join(root, 'index.html');
  const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd());
  home('#ss-home-social-review').remove();
  if (home('#ss-home-source-review').length !== 1) throw new Error('Expected source review home note');
  home('#ss-home-source-review').append(`<span id="ss-home-social-review"> · <a href="/${SOCIAL_ACTIVITY_SLUG}/#ss-social-source-review">도쿄 가이드 신청·배정·문서 차이 재대조</a></span>`);
  home('meta[property="og:updated_time"]').attr('content', SOCIAL_ACTIVITY_MODIFIED);
  home('script.rank-math-schema').each((_, script) => {
    const schema = JSON.parse(home(script).text());
    for (const node of schema['@graph'] || [schema]) if (node.dateModified) node.dateModified = SOCIAL_ACTIVITY_MODIFIED;
    home(script).text(JSON.stringify(schema));
  });
  await writeFileUtf8(homeFile, serialize(home));
  const mapFile = path.join(root, 'page-sitemap.xml');
  const map = load(await fs.readFile(mapFile, 'utf8'), { xml: true });
  const entry = map('url').filter((_, node) => map(node).find('loc').text() === 'https://shootsense.com/');
  if (entry.length !== 1) throw new Error('Unexpected homepage sitemap entry');
  entry.find('lastmod').text(SOCIAL_ACTIVITY_MODIFIED);
  await writeFileUtf8(mapFile, map.xml().trimEnd() + '\n');
  const indexFile = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(indexFile, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => /\/(post|page)-sitemap\.xml$/.test(index(node).find('loc').text())).find('lastmod').text(SOCIAL_ACTIVITY_MODIFIED);
  await writeFileUtf8(indexFile, index.xml().trimEnd() + '\n');
  return { revisedArticle: SOCIAL_ACTIVITY_SLUG, references: Object.keys(SOCIAL_ACTIVITY_SOURCES).length, groups: SOCIAL_REVIEW_GROUPS.length, directPages: 3, indexedPages: 3 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await finalizeSocialSourceReview()));
