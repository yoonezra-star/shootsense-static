import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { BANGKOK_ARRIVAL_MODIFIED, BANGKOK_ARRIVAL_SLUG, BANGKOK_ARRIVAL_SOURCES } from './bangkok-arrival-content.mjs';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';

export const BANGKOK_REVIEW_GROUPS = [
  { title: '공항의 승차 위치·비용 항목', keys: ['transport', 'taxi'], labels: ['AOT 종합 교통 안내', '일반 택시 상세'], checked: '층·차선과 철도 운영시간, 일반 택시의 별도 비용 게시를 재대조했습니다.', limit: '당일 마지막 출발·대기·배차·최종 지출은 확인하지 않았습니다.' },
  { title: 'Grab의 발표와 도움말', keys: ['grab', 'grabHelp'], labels: ['2026-09-21 발표', '공식 도움말'], checked: 'PIN·일반 예약·항공편 연동 예약을 구분했습니다. 도움말은 브라우저에서 본문을 열어 확인했습니다.', limit: '앱 로그인·예약 시험은 하지 않았고 BKK의 항공편 연동 기능 제공 범위를 확정하지 못했습니다.' },
  { title: '철도 결제 도입 안내', keys: ['rail'], labels: ['태국 정부 홍보국 안내'], checked: '2025년 EMV 결제 도입 설명을 재대조했습니다.', limit: '개별 카드 결제 성공·운행 변경·이용일의 출발표를 보증하지 않습니다.' },
  { title: '과거 공지와 여행경보·연락', keys: ['airportAlert', 'rainAlert', 'advisory', 'consular'], labels: ['9월 공항 공지', '10월 호우 공지', '태국 국가정보', '앱·영사 연락 안내'], checked: '게시일·예보 대상 기간과 국가정보·연락 역할을 나눠 읽었습니다.', limit: '과거 공지를 현재 기상·공항 정상화·태국 전체의 위험도 판정으로 바꾸지 않습니다.' }
];
const serialize = page => page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';

export async function finalizeBangkokSourceReview(root = process.cwd()) {
  const articleFile = path.join(root, BANGKOK_ARRIVAL_SLUG, 'index.html');
  const page = load((await fs.readFile(articleFile, 'utf8')).trimEnd());
  if (!page('.ss-post-body').text().includes('Schedule regular pickup') || page('.ss-trust-box').length !== 1) throw new Error('Rebuild revised Bangkok article before source finalization');
  page('#ss-bangkok-source-review').remove();
  page('.ss-trust-box').after(`<aside id="ss-bangkok-source-review" class="ss-review-notice ss-source-review"><p><strong>2026-11-24 공식 자료 재대조</strong> · 승차 위치와 Grab 예약 방식, 과거 공지의 적용 기간을 구분했습니다. 현장 이용·앱 예약·실시간 운행을 확인한 후기는 아닙니다.</p><details><summary>확인한 출처와 아직 남은 조건</summary><ul>${BANGKOK_REVIEW_GROUPS.map(group => `<li><strong>${escapeHtml(group.title)}</strong><p>${escapeHtml(group.checked)} ${group.keys.map((key, i) => `<a href="${BANGKOK_ARRIVAL_SOURCES[key]}">${escapeHtml(group.labels[i])}</a>`).join(' · ')}</p><p><strong>미확인 범위</strong> ${escapeHtml(group.limit)}</p></li>`).join('')}</ul></details></aside>`);
  await writeFileUtf8(articleFile, serialize(page));
  const homeFile = path.join(root, 'index.html');
  const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd());
  home('#ss-home-bangkok-review').remove();
  if (home('#ss-home-source-review').length !== 1) throw new Error('Expected current source-review home note');
  home('#ss-home-source-review').append(`<span id="ss-home-bangkok-review"> · <a href="/${BANGKOK_ARRIVAL_SLUG}/#ss-bangkok-source-review">수완나품 승차·예약 방식 재대조</a></span>`);
  home('meta[property="og:updated_time"]').attr('content', BANGKOK_ARRIVAL_MODIFIED);
  home('script.rank-math-schema').each((_, script) => {
    const schema = JSON.parse(home(script).text());
    for (const node of schema['@graph'] || [schema]) if (node.dateModified) node.dateModified = BANGKOK_ARRIVAL_MODIFIED;
    home(script).text(JSON.stringify(schema));
  });
  await writeFileUtf8(homeFile, serialize(home));
  const mapFile = path.join(root, 'page-sitemap.xml');
  const map = load(await fs.readFile(mapFile, 'utf8'), { xml: true });
  const entry = map('url').filter((_, node) => map(node).find('loc').text() === 'https://shootsense.com/');
  if (entry.length !== 1) throw new Error('Unexpected homepage sitemap entry');
  entry.find('lastmod').text(BANGKOK_ARRIVAL_MODIFIED);
  await writeFileUtf8(mapFile, map.xml().trimEnd() + '\n');
  const indexFile = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(indexFile, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => /\/(post|page)-sitemap\.xml$/.test(index(node).find('loc').text())).find('lastmod').text(BANGKOK_ARRIVAL_MODIFIED);
  await writeFileUtf8(indexFile, index.xml().trimEnd() + '\n');
  return { revisedArticle: BANGKOK_ARRIVAL_SLUG, officialPages: Object.keys(BANGKOK_ARRIVAL_SOURCES).length, groups: BANGKOK_REVIEW_GROUPS.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await finalizeBangkokSourceReview()));
