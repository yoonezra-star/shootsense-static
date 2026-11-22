import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { ensureMobileReadingLayout, escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';
import { ANALYSIS_CONTENT, ANALYSIS_DESCRIPTION, ANALYSIS_MODIFIED, ANALYSIS_ROUTE, ANALYSIS_TITLE } from './tokyo-analysis-content.mjs';

const ORIGIN = 'https://shootsense.com';
const serialize = $ => $.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';
export const RECHECKS = [
  { slug: '관광객이-적어-현지의-속도를-느낀-아르타', text: '2026-11-22 부분 대조: KTEL의 이오아니나 왕복 요일별 게시 시각은 아래 표와 같습니다. 유적의 휴관 연장 공지도 남아 있어 해당 공지로 재개관을 확정하지 않습니다. 당일 운행·좌석·박물관 전체 운영을 새로 확인한 것은 아닙니다.', href: 'https://www.ktelartas.gr/%CE%B4%CF%81%CE%BF%CE%BC%CE%BF%CE%BB%CF%8C%CE%B3%CE%B9%CE%B1/' },
  { slug: '이탈리아-치비타-디-반뇨레조-근처-마을', text: '2026-11-22 부분 대조: Casa Civita는 입장료 5유로와 종이·휴대전화 티켓 제시 방법을 계속 안내합니다. 온라인 구매는 대기 줄을 피하는 선택지이며 방문일 판매·보행 지원·연결 버스 확보까지 확인했다는 뜻은 아닙니다.', href: 'https://www.casacivitabagnoregio.it/ticket-dingresso/' },
  { slug: '관광-코스가-없어-자유로웠던-사피-여행', text: '2026-11-22 부분 대조: FNM의 주소, 10:00~18:00·화요일 휴관, 성인 20 DH 게시 내용은 아래 기록과 같습니다. 방문일 특별 휴관·철도 판매·공방 출입은 이 재대조의 범위가 아닙니다.', href: 'https://www.fnm.ma/museums/29' },
  { slug: '추천은-못-해도-기억에서-지워지지-않는-코다이카날', text: '2026-11-22 부분 대조: IIA의 방문 신청 최소 15일 전, 일요일 09:00~13:00, 1인 50루피·최대 90분 안내를 다시 읽었습니다. 원문 하단 갱신일은 2024-11-20입니다. 새 신청이나 승인 회신·당일 입장을 확보한 것은 아닙니다.', href: 'https://www.iiap.res.in/outreach/visit-us/visiting-kso/' },
  { slug: '구경-대신-산책이-전부였던-샤르자-외곽의-오후', text: '2026-11-22 경보 재대조: 외교부 국가별 페이지는 UAE 전 지역 출국권고를 표시합니다. 기존 관광 예약 보류·취소·연기 우선 기준을 유지합니다. 아래 시설 소개는 현재 관광 운영을 확인한 자료로 바꾸지 않았습니다.', href: 'https://www.0404.go.kr/ntnSafetyInfo/135/detail' }
];

function meta($, selector, value, attr = 'content') { $(selector).attr(attr, value); }
function setPageSitemap($, url, modified) {
  let item = $('url').filter((_, node) => $(node).find('loc').text() === url);
  if (!item.length) { $('urlset').append(`<url><loc>${url}</loc><lastmod>${modified}</lastmod></url>`); return; }
  if (item.length !== 1) throw new Error(`Duplicate sitemap entry: ${url}`);
  if (item.find('lastmod').length) item.find('lastmod').text(modified);
  else item.append(`<lastmod>${modified}</lastmod>`);
}

export async function applyNovemberRecovery(root = process.cwd()) {
  const template = load((await fs.readFile(path.join(root, 'contact/index.html'), 'utf8')).trimEnd());
  template('.entry-content').first().html(ANALYSIS_CONTENT);
  template('.entry-header').remove();
  template('article').first().attr('id', 'page-tokyo-stay-analysis');
  template('.ss-breadcrumb').html('<a href="/">홈</a><span class="sep">›</span><span class="here">도쿄 숙소 비용 분석</span>');
  template('body').addClass('ss-research-page');
  template('.current-menu-item, .current_page_item').removeClass('current-menu-item current_page_item');
  template('a[aria-current]').removeAttr('aria-current');
  template('[href], [src]').each((_, node) => {
    for (const attr of ['href', 'src']) {
      const value = template(node).attr(attr);
      if (!value || value.startsWith('/') || value.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(value)) continue;
      const url = new URL(value, `${ORIGIN}/contact/`);
      template(node).attr(attr, `${url.pathname}${url.search}${url.hash}`);
    }
  });
  template('title').text(`${ANALYSIS_TITLE} | 여행정보엑스퍼트`);
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) meta(template, selector, ANALYSIS_TITLE);
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) meta(template, selector, ANALYSIS_DESCRIPTION);
  meta(template, 'meta[property="og:url"]', `${ORIGIN}${ANALYSIS_ROUTE}`);
  meta(template, 'link[rel="canonical"]', `${ORIGIN}${ANALYSIS_ROUTE}`, 'href');
  meta(template, 'meta[property="og:updated_time"]', ANALYSIS_MODIFIED);
  meta(template, 'meta[property="og:type"]', 'article');
  meta(template, 'meta[name="robots"]', 'index, follow');
  template('meta[property^="article:"], meta[name^="twitter:label"], meta[name^="twitter:data"]').remove();
  template('script[src*="googlesyndication"], ins.adsbygoogle').remove();
  template('script.rank-math-schema').text(JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'Person', '@id': `${ORIGIN}/author/#operator`, name: '여행엑스퍼트', url: `${ORIGIN}/author/` },
    { '@type': 'WebPage', '@id': `${ORIGIN}${ANALYSIS_ROUTE}#webpage`, url: `${ORIGIN}${ANALYSIS_ROUTE}`, name: ANALYSIS_TITLE, description: ANALYSIS_DESCRIPTION, datePublished: ANALYSIS_MODIFIED, dateModified: ANALYSIS_MODIFIED, inLanguage: 'ko-KR' },
    { '@type': 'Article', '@id': `${ORIGIN}${ANALYSIS_ROUTE}#article`, headline: ANALYSIS_TITLE, description: ANALYSIS_DESCRIPTION, datePublished: ANALYSIS_MODIFIED, dateModified: ANALYSIS_MODIFIED, author: { '@id': `${ORIGIN}/author/#operator` }, mainEntityOfPage: { '@id': `${ORIGIN}${ANALYSIS_ROUTE}#webpage` }, inLanguage: 'ko-KR' }
  ] }));
  template('head').append('<link id="ss-research-style" rel="stylesheet" href="/assets/research.css"><link id="ss-regional-style" rel="stylesheet" href="/assets/regional-guides.css">');
  ensureMobileReadingLayout(template);
  await writeFileUtf8(path.join(root, ANALYSIS_ROUTE, 'index.html'), serialize(template));

  const jaisalmer = '유명-관광지에서-느끼지-못한-편안함을-준-자이살메';
  const archiveFile = path.join(root, jaisalmer, 'index.html');
  const archive = load((await fs.readFile(archiveFile, 'utf8')).trimEnd());
  if (!/noindex/.test(archive('meta[name="robots"]').attr('content') || '')) throw new Error('Jaisalmer must remain held');
  const archiveTitle = '자이살메르 자료 보관: 도심·사막 상품의 확인 범위';
  const archiveSummary = '2026-11-22 외교부 인도 경보의 적용 범위를 대조했습니다. 기존 도심·사막 관광 추천은 공개를 중단하고, 개별 프로그램의 집합·복귀·변경 조건을 확인하지 못한 범위를 명시합니다.';
  archive('h1').text(archiveTitle);
  archive('title').text(`${archiveTitle} - 여행정보엑스퍼트`);
  archive('.ss-breadcrumb .here').text(archiveTitle);
  archive('.ss-post-summary p').text(archiveSummary);
  archive('.ss-post').addClass('ss-regional-guide');
  if (!archive('link#ss-regional-style').length) archive('head').append('<link id="ss-regional-style" rel="stylesheet" href="/assets/regional-guides.css">');
  archive('.ss-post-cover').remove();
  archive('script[src*="googlesyndication"], ins.adsbygoogle').remove();
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) meta(archive, selector, archiveTitle);
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) meta(archive, selector, archiveSummary);
  for (const selector of ['meta[property="og:updated_time"]', 'meta[property="article:modified_time"]']) meta(archive, selector, ANALYSIS_MODIFIED);
  archive('.ss-post-body').html('<p><strong>기존 일반 관광 원고의 공개를 중단한 보관 페이지입니다.</strong> 실제 방문·사막 투어 운행·집합과 귀환을 확인한 가이드가 아니며 검색·광고 제외를 유지합니다.</p><h2 id="jaisalmer-warning">도시 이름과 경보 적용 범위</h2><p>2026-11-22 <a href="https://www.0404.go.kr/ntnSafetyInfo/285/detail">외교부 인도 국가 정보</a>의 표는 카슈미르·카르길 시를 출국권고, 해당 3단계 지역 외를 여행유의로 표시합니다. 이 자료에서 확인하지 않은 국경 10km 규칙을 자이살메르 전체에 덧붙이지 않습니다. 이 표가 개별 사막 상품·숙소·차량 경로의 안전성과 운행을 인증하는 것은 아닙니다.</p><h2 id="jaisalmer-program">사막 상품을 도심 관람처럼 다루지 않기</h2><p>도심의 성·박물관 입장과 사막 캠프·차량·숙박 상품은 별도입니다. 기존 원고는 특정 운영자, 정확한 집합 주소, 복귀 시각, 취소 약관을 검증하지 못했습니다. 따라서 예상 이동 시간·가격·캠프 숙박을 추천값으로 남기지 않습니다.</p><p>프로그램을 비교하려면 실제 운영자와 상품 URL, 방문일, 집합·종료 주소, 차량·식사·숙박 포함 범위, 종료 후 숙소까지의 교통, 기상·운영 취소 조건이 필요합니다. 홍보 페이지의 ‘픽업 포함’만으로 귀환까지 포함됐다고 보지 않습니다. 이 정보가 확보되기 전에는 예약 후보를 확정하지 않습니다.</p><h2 id="jaisalmer-record">이미 가진 예약과 새 원고의 처리</h2><p>기존 예약은 계약별 마감과 변경·취소 답변을 <a href="/honja-yeohaeng-gamjeong-gwanri/">일정 변경 확인표</a>에 분리해 기록합니다. 이 사이트로 예약번호·여권·결제정보를 제출하지 않습니다. 근거가 부족한 옛 문장을 늘려 재공개하지 않으며, 독자에게 고유한 판단 결과를 제공할 자료를 확보한 뒤 재공개·통합 여부를 판단합니다. <a href="/contact/">오류 제보</a>에는 공개 원문 주소와 수정할 문장만 보내주세요.</p>');
  const archiveHeadings = archive('.ss-post-body h2').toArray().map(node => ({ id: archive(node).attr('id'), text: archive(node).text() }));
  archive('.ss-toc').html(`<div class="ss-toc-head">목차</div><ol>${archiveHeadings.map(item => `<li><a href="#${item.id}">${escapeHtml(item.text)}</a></li>`).join('')}</ol>`);
  archive('.ss-trust-box').html('<p class="ss-trust-note">공개 범위 정리 2026-11-22 · 공식 경보 대조와 기존 관광 추천 중단. 현장 취재·투어 검증 기록이 아닙니다. <a href="/author/">작성자 소개</a> · <a href="/editorial-policy/">편집 원칙</a></p>');
  let originalPublished;
  archive('script[type="application/ld+json"]').each((_, script) => {
    const schema = JSON.parse(archive(script).text());
    for (const node of schema['@graph'] || [schema]) {
      if (node['@type'] === 'BreadcrumbList') {
        const last = node.itemListElement?.at(-1);
        if (last?.item && typeof last.item === 'object') last.item.name = archiveTitle;
        else if (last) last.name = archiveTitle;
      }
      if (!['Article', 'BlogPosting', 'WebPage'].includes(node['@type'])) continue;
      originalPublished ||= node.datePublished;
      node.name = archiveTitle; if (node.headline) node.headline = archiveTitle;
      node.description = archiveSummary; node.dateModified = ANALYSIS_MODIFIED;
    }
    archive(script).text(JSON.stringify(schema));
  });
  archive('.ss-post-meta').html(`${originalPublished ? `<span>게시 ${originalPublished.slice(0, 10)}</span>` : ''}<span>공개 범위 정리 2026-11-22</span><span>작성 · 여행엑스퍼트(필명)</span>`);
  ensureMobileReadingLayout(archive);
  await writeFileUtf8(archiveFile, serialize(archive));

  for (const check of RECHECKS) {
    const file = path.join(root, check.slug, 'index.html');
    const $ = load((await fs.readFile(file, 'utf8')).trimEnd());
    $('#ss-november-recheck').remove();
    $('.ss-trust-box').after(`<aside id="ss-november-recheck" class="ss-review-notice"><p>${escapeHtml(check.text)} <a href="${escapeHtml(check.href)}">대조한 공식 안내</a></p></aside>`);
    await writeFileUtf8(file, serialize($));
  }

  const homeFile = path.join(root, 'index.html');
  const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd());
  home('#ss-home-research, #november-recovery-update').remove();
  home('.ss-home-tool').after(`<section id="ss-home-research" class="ss-home-band ss-home-research"><p class="ss-eyebrow">공개 규정으로 계산한 사례</p><h2><a href="${ANALYSIS_ROUTE}">도쿄 2박, 숙소 가격이 뒤집히는 경계</a></h2><p class="ss-research-result">교통비 차이 1,300엔에서 동률</p><p>가상 후보 A/B의 객실 대금·숙박세·이동비를 합치고, 2027년 세금 변경과 자정 체크인·취소 마감을 따로 비교했습니다. 실제 객실 견적이 아닌 계산 사례입니다.</p><a href="${ANALYSIS_ROUTE}#break-even">입력값과 네 가지 비교 결과 보기</a></section>`);
  home('.ss-home-updates').prepend(`<li id="november-recovery-update"><time datetime="2026-11-22">2026.11.22</time> · <a href="${ANALYSIS_ROUTE}">도쿄 숙소 2박 분석</a>: 이동비 손익분기점·숙박일별 세금·취소 마감 비교를 추가했습니다. 기존 지역 글은 확인한 경보·입장·신청 조건의 부분 대조 범위를 구분했습니다.</li>`);
  if (!home('link#ss-research-style').length) home('head').append('<link id="ss-research-style" rel="stylesheet" href="/assets/research.css">');
  meta(home, 'meta[property="og:updated_time"]', ANALYSIS_MODIFIED);
  home('script.rank-math-schema').each((_, script) => {
    const graph = JSON.parse(home(script).text());
    for (const node of graph['@graph'] || []) if (node['@type'] === 'WebPage') node.dateModified = ANALYSIS_MODIFIED;
    home(script).text(JSON.stringify(graph));
  });
  await writeFileUtf8(homeFile, serialize(home));

  for (const relative of ['honja-yeohaeng-sukso-goreuneun-beop/index.html', 'tools/stay-compare/index.html']) {
    const file = path.join(root, relative);
    const $ = load((await fs.readFile(file, 'utf8')).trimEnd());
    $('#ss-tokyo-analysis-link').remove();
    const paragraph = `<p id="ss-tokyo-analysis-link"><a href="${ANALYSIS_ROUTE}">도쿄 2박의 실제 규정 기반 가상 분석</a>: 교통비 차이 1,300엔에서 동률이 되는 이유와 숙박세·취소 마감의 예외를 봅니다.</p>`;
    if ($('.ss-post-body').length) $('.ss-post-body').children().first().after(paragraph);
    else $('.ss-tool header').append(paragraph);
    await writeFileUtf8(file, serialize($));
  }

  const mapFile = path.join(root, 'page-sitemap.xml');
  const xml = load(await fs.readFile(mapFile, 'utf8'), { xml: true });
  setPageSitemap(xml, `${ORIGIN}${ANALYSIS_ROUTE}`, ANALYSIS_MODIFIED);
  setPageSitemap(xml, `${ORIGIN}/`, ANALYSIS_MODIFIED);
  await writeFileUtf8(mapFile, xml.xml().trimEnd() + '\n');
  const indexFile = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(indexFile, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => index(node).find('loc').text() === `${ORIGIN}/page-sitemap.xml`).find('lastmod').text(ANALYSIS_MODIFIED);
  await writeFileUtf8(indexFile, index.xml().trimEnd() + '\n');
  return { analysis: ANALYSIS_ROUTE, partialRechecks: RECHECKS.length, restoredHeldPosts: 0 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await applyNovemberRecovery()));
