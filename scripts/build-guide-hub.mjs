import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';

export const HUB_ROUTE = '/guides/';
export const HUB_PUBLISHED = '2026-11-23T23:26:00+09:00';
export const HUB_MODIFIED = '2026-11-24T19:25:00+09:00';
// Keep the unchanged privacy notice on its own review date.
const DIRECTORY_PRIVACY_MODIFIED = '2026-11-24T13:06:00+09:00';
export const TOOL_DIRECTORY_ROUTE = '/guides/?type=tools';
export const RELATED_TOOL_LINKS = {
  'honja-yeohaeng-sukso-goreuneun-beop': ['/tools/stay-compare/', '/tools/trip-board/'],
  'honja-yeohaeng-junbi-gijun': ['/tools/arrival-check/', '/tools/trip-board/'],
  'honja-yeohaeng-junbimul-checklist': ['/tools/trip-board/'],
  'honja-yeohaeng-achim-routine': ['/tools/departure-check/', '/tools/trip-board/'],
  'honja-yeohaeng-gamjeong-gwanri': ['/tools/reservation-deadlines/', '/tools/stay-compare/']
};
export const TOPIC_LABELS = { stay: '숙소·예약', prepare: '준비·이동', life: '식사·교류', support: '문제 대응', regional: '지역별 이동' };
export const REGION_LABELS = { general: '공통', japan: '일본', thailand: '태국', vietnam: '베트남', china: '중국', india: '인도', europe: '유럽', mena: '중동·북아프리카', morocco: '모로코', uae: '아랍에미리트(UAE)' };
const META = [
  ['honja-yeohaeng-sukso-goreuneun-beop', 'stay', 'general', '호텔 예약 체크인 취소 환불 추가금'],
  ['honja-yeohaeng-junbi-gijun', 'prepare', 'general', '초보 출발 준비 일정'],
  ['honja-yeohaeng-junbimul-checklist', 'prepare', 'general', '짐 체크리스트 휴대폰 방전 오프라인'],
  ['honja-yeohaeng-sikdang-goreuneun-beop', 'life', 'japan', '일본 혼밥 식당 주문 결제'],
  ['honja-sukso-anjeon-checklist', 'support', 'general', '객실 잠금 대피 체크인'],
  ['honja-yeohaeng-emergency-response', 'support', 'general', '분실 부상 사고 연락'],
  ['honja-yeohaeng-gamjeong-gwanri', 'support', 'general', '일정 변경 취소 연락 외로움'],
  ['honja-southeast-asia-safety', 'prepare', 'thailand', '방콕 수완나품 공항 택시 철도 Grab'],
  ['honja-yeohaeng-achim-routine', 'prepare', 'japan', '도쿄 짐 보관 체크아웃 출발'],
  ['honja-yeohaeng-social-activity', 'life', 'japan', '도쿄 자원봉사 가이드 투어 교류'],
  ['구경-대신-산책이-전부였던-샤르자-외곽의-오후', 'regional', 'uae', '아랍에미리트 United Arab Emirates 샤르자 믈레이하 UAE 중동 경보 예약 보류'],
  ['관광-코스가-없어-자유로웠던-사피-여행', 'regional', 'morocco', '모로코 Morocco 사피 Safi 북아프리카 도자기 박물관 공방'],
  ['여행자보다-주민이-더-많았던-투이호아의-분위기', 'regional', 'vietnam', '투이호아 닥락 푸옌 공항 역'],
  ['심심함이-여행의-일부가-된-반퐁에서의-며칠', 'regional', 'thailand', '반퐁 시장 기록 귀환'],
  ['추천은-못-해도-기억에서-지워지지-않는-코다이카날', 'regional', 'india', '코다이카날 Kodai Road 관측소 신청'],
  ['honja-lushan-yeohaeng', 'regional', 'china', '루산 庐山 구링 케이블카 교통권'],
  ['이탈리아-치비타-디-반뇨레조-근처-마을', 'regional', 'europe', '이탈리아 치비타 반뇨레조 다리 입장'],
  ['관광객이-적어-현지의-속도를-느낀-아르타', 'regional', 'europe', '그리스 아르타 이오아니나 버스 휴관']
];
const serialize = $ => $.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';
const origin = 'https://shootsense.com';

export async function readHubEntries(root = process.cwd()) {
  const sitemap = load(await fs.readFile(path.join(root, 'post-sitemap.xml'), 'utf8'), { xml: true });
  const indexed = new Set(sitemap('loc').toArray().map(node => decodeURI(new URL(sitemap(node).text()).pathname)));
  const definitions = [
    ['tools/reservation-deadlines', 'stay', 'general', '예약 변경 취소 마감 캘린더 시간대 서머타임 일정 ICS 확인 알림', '마감 도구'],
    ['tools/trip-board', 'prepare', 'japan', '일본 도쿄 Tokyo 여행 준비판 숙소 도착 출발 통합 준비표 파일', '준비 도구'],
    ['tools/arrival-check', 'prepare', 'japan', '일본 도쿄 Tokyo 공항 도착 체크인 입국 짐 수령 심야 교통 지연 시간 계산', '일정 도구'],
    ['tools/departure-check', 'prepare', 'japan', '도쿄 Tokyo 출발일 일정 짐 보관 회수 시간 계산 지연', '일정 도구'],
    ['tools/stay-compare', 'stay', 'general', '숙소 총비용 계산기 비교 도구', '비교 도구'],
    ['analysis/tokyo-late-checkin', 'stay', 'japan', '도쿄 Tokyo 자정 늦은 체크인 24시 25시 날짜', '계산 분석'],
    ['analysis/room-extension-or-baggage', 'stay', 'japan', '도쿄 Tokyo 객실 연장 짐 보관 체크아웃 비용', '계산 분석'],
    ['analysis/tokyo-stay-cost', 'stay', 'japan', '도쿄 東京 Tokyo 숙박세 2박 가격 역전 분석', '계산 분석'],
    ...META.map(item => [...item, '가이드'])
  ];
  const entries = [];
  for (const [slug, topic, region, keywords, kind] of definitions) {
    if (kind === '가이드' && !indexed.has(`/${slug}/`)) throw new Error(`Guide missing from indexed sitemap: ${slug}`);
    const $ = load(await fs.readFile(path.join(root, slug, 'index.html'), 'utf8'));
    if (/noindex/.test($('meta[name="robots"]').attr('content') || '')) throw new Error(`Held page must not enter directory: ${slug}`);
    entries.push({ href: `/${slug}/`, title: $('h1').first().text(), summary: $('.ss-post-summary p').first().text() || $('meta[name="description"]').attr('content'), topic, region, keywords, kind, type: kind.endsWith('도구') ? 'tools' : kind === '계산 분석' ? 'analysis' : 'guides' });
  }
  if (META.length !== indexed.size) throw new Error('Classify every indexed guide before publishing the directory');
  return entries;
}

function hubContent(entries) {
  const options = labels => `<option value="all">전체</option>${Object.entries(labels).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}`;
  return `<div class="ss-guide-hub"><header><p class="ss-eyebrow">여행정보엑스퍼트 자료실</p><h1>혼자 여행 가이드</h1><p>숙소 예약, 출발 준비, 현지 이동과 일정 변경에 필요한 자료를 모았습니다. 지역 글은 직접 방문 후기가 아닌 공개 자료 기반 안내입니다.</p></header><form id="guide-filter-form" class="ss-guide-filter" action="/guides/" method="get" role="search"><label for="guide-query">키워드<input id="guide-query" type="search" name="q" maxlength="80" placeholder="예: 도쿄, 취소, 짐 보관" autocomplete="off"></label><label for="guide-topic">주제<select id="guide-topic" name="topic">${options(TOPIC_LABELS)}</select></label><label for="guide-region">지역<select id="guide-region" name="region">${options(REGION_LABELS)}</select></label><button type="reset">초기화</button></form><p id="guide-result-count" class="ss-guide-status" role="status" aria-live="polite" aria-atomic="true">${entries.length}개 자료</p><div id="guide-empty" class="ss-directory-empty" hidden><p>조건에 맞는 가이드가 없습니다.</p></div><ul class="ss-directory-list">${entries.map(entry => `<li class="ss-directory-row" data-guide-row data-topic="${entry.topic}" data-region="${entry.region}" data-keywords="${escapeHtml(entry.keywords)}"><div class="ss-directory-label"><strong>${entry.kind}</strong><span>${REGION_LABELS[entry.region]} · ${TOPIC_LABELS[entry.topic]}</span></div><div><h2><a href="${escapeHtml(entry.href)}">${escapeHtml(entry.title)}</a></h2><p>${escapeHtml(entry.summary)}</p></div></li>`).join('')}</ul><section class="ss-directory-footnote"><h2>자료의 확인 범위</h2><p>원문마다 자료 확인일과 적용 조건을 구분합니다. 이 목록의 추가일이 모든 글의 요금·운행을 새로 검증한 날짜는 아닙니다. <a href="/editorial-policy/">편집 원칙</a> · <a href="/contact/">오류 제보</a></p></section></div>`;
}

async function collect(directory) {
  const ignored = new Set(['.git', 'node_modules', 'scripts', 'content', 'wp-content', 'cdn-cgi', 'playwright-artifacts', 'test-results']);
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(file));
    else if (entry.name === 'index.html' || entry.name === '404.html') files.push(file);
  }
  return files;
}

export async function buildGuideHub(root = process.cwd()) {
  const entries = await readHubEntries(root);
  const $ = load((await fs.readFile(path.join(root, 'contact/index.html'), 'utf8')).trimEnd());
  $('.entry-content').html(hubContent(entries));
  $('#guide-query').closest('label').after('<label for="guide-type">자료 종류<select id="guide-type" name="type" aria-label="자료 종류"><option value="all">전체 자료</option><option value="tools">여행 도구</option><option value="analysis">계산 분석</option><option value="guides">여행 가이드</option></select></label>');
  $('[data-guide-row]').each((index, node) => $(node).attr('data-type', entries[index].type));
  $('#guide-topic').attr('aria-label', '주제');
  $('#guide-region').attr('aria-label', '지역');
  $('.entry-header').remove();
  $('article').first().attr('id', 'page-guide-hub');
  $('body').addClass('ss-guide-hub-page');
  $('.current-menu-item, .current_page_item').removeClass('current-menu-item current_page_item');
  $('a[aria-current]').removeAttr('aria-current');
  $('.ss-breadcrumb').html('<a href="/">홈</a><span class="sep">›</span><span class="here">가이드 찾기</span>');
  $('[href], [src]').each((_, node) => {
    for (const attribute of ['href', 'src']) {
      const value = $(node).attr(attribute);
      if (!value || value.startsWith('/') || value.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(value)) continue;
      const url = new URL(value, `${origin}/contact/`);
      $(node).attr(attribute, `${url.pathname}${url.search}${url.hash}`);
    }
  });
  const title = '혼자 여행 가이드 찾기 | 여행정보엑스퍼트';
  const description = '숙소 비교·출발 준비·식사·문제 대응·지역 이동 가이드를 주제와 지역으로 찾아보세요. 공개 자료의 범위와 개별 확인 조건을 함께 제공합니다.';
  $('title').text(title);
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) $(selector).attr('content', title);
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) $(selector).attr('content', description);
  $('meta[property="og:url"]').attr('content', `${origin}${HUB_ROUTE}`);
  $('link[rel="canonical"]').attr('href', `${origin}${HUB_ROUTE}`);
  $('meta[name="robots"]').attr('content', 'index, follow');
  $('meta[property="og:type"]').attr('content', 'website');
  $('meta[property="og:updated_time"]').attr('content', HUB_MODIFIED);
  $('meta[property^="article:"], meta[name^="twitter:label"], meta[name^="twitter:data"], script[src*="googlesyndication"], ins.adsbygoogle').remove();
  $('script.rank-math-schema').text(JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': `${origin}${HUB_ROUTE}#webpage`, url: `${origin}${HUB_ROUTE}`, name: title, description, datePublished: HUB_PUBLISHED, dateModified: HUB_MODIFIED, inLanguage: 'ko-KR', mainEntity: { '@id': `${origin}${HUB_ROUTE}#list` } },
    { '@type': 'ItemList', '@id': `${origin}${HUB_ROUTE}#list`, numberOfItems: entries.length, itemListElement: entries.map((entry, index) => ({ '@type': 'ListItem', position: index + 1, name: entry.title, url: `${origin}${entry.href}` })) }
  ] }));
  $('head').append('<link id="ss-guide-hub-style" rel="stylesheet" href="/assets/guide-hub.css"><script id="ss-guide-search" type="module" src="/assets/guide-search.js"></script>');
  await writeFileUtf8(path.join(root, 'guides/index.html'), serialize($));

  for (const file of await collect(root)) {
    const html = await fs.readFile(file, 'utf8');
    const page = load(html.trimEnd());
    const relative = path.relative(root, file).replaceAll('\\', '/');
    const isTool = relative.startsWith('tools/');
    if (relative === '404.html') {
      page('.ss-404-tools').remove();
      page('header nav').prepend(`<a class="ss-404-tools" href="${TOOL_DIRECTORY_ROUTE}">여행 도구</a>`);
      page('main .links a[href="/travel-tips/"]').attr('href', '/guides/').text('가이드 모아보기');
      page('main .links').append(`<a class="ss-404-tools" href="${TOOL_DIRECTORY_ROUTE}">여행 도구 찾기</a>`);
    }
    if (isTool) {
      page('#masthead .menu-item').removeClass('current-menu-item current_page_item');
      page('#masthead .menu-item a[aria-current]').removeAttr('aria-current');
    }
    for (const selector of ['#ast-hf-menu-1', '#ast-hf-mobile-menu']) {
      page(selector).find('.ss-tools-link').slice(1).remove();
    }
    page('#masthead .ss-tools-link a').each((_, node) => {
      const link = page(node);
      link.attr('href', TOOL_DIRECTORY_ROUTE).text('여행 도구');
      link.closest('.menu-item').toggleClass('current-menu-item', isTool);
      if (isTool) link.attr({ target: '_blank', rel: 'noopener', title: '새 탭에서 여행 도구 목록 열기', 'aria-current': 'location' });
      else link.removeAttr('target rel title aria-current');
    });
    if (relative === 'index.html') {
      page('#ss-home-directory').remove();
      (page('#ss-home-lab').length ? page('#ss-home-lab') : page('.ss-home-intro')).after(`<section id="ss-home-directory" class="ss-home-band"><h2><a href="/guides/">가이드 모아보기</a></h2><p>예약·준비·식사·문제 대응·지역 이동 자료 ${entries.length}개</p><a class="ss-action ss-action--secondary" href="/guides/">전체 가이드 찾기</a></section>`);
      page('#ss-home-directory').append(`<p><a id="ss-home-tools-directory" href="${TOOL_DIRECTORY_ROUTE}">여행 도구 ${entries.filter(entry => entry.type === 'tools').length}개 모아보기</a></p>`);
      page('meta[property="og:updated_time"]').attr('content', HUB_MODIFIED);
      page('script.rank-math-schema').each((_, script) => {
        const schema = JSON.parse(page(script).text());
        for (const node of schema['@graph'] || []) if (node['@type'] === 'WebPage') node.dateModified = HUB_MODIFIED;
        page(script).text(JSON.stringify(schema));
      });
    }
    if (relative === 'privacy-policy/index.html') {
      const privacyText = '<section id="guide-search-privacy"><h2>가이드 검색과 주소 정보</h2><p>가이드 목록의 검색·분류는 브라우저에서 처리하며 별도 검색 API나 브라우저 저장소로 보내거나 보관하지 않습니다. 검색어·자료 종류·주제·지역의 선택 조건은 페이지 주소에 포함됩니다. 사이트에 적용된 호스팅 서비스의 접속·성능 분석 기능이 해당 주소를 받을 수 있으며, 주소를 다시 열거나 공유할 때도 호스팅 서비스의 접속 요청에 전달될 수 있습니다. 검색어에 이름·연락처·예약번호 등 개인정보를 넣지 마세요. 호스팅 서비스의 접속 정보 처리는 이 정책의 외부 서비스 항목에 따릅니다.</p></section>';
      if (page('#guide-search-privacy').length) page('#guide-search-privacy').replaceWith(privacyText);
      else page('.ss-page').first().append(privacyText);
      for (const selector of ['meta[property="og:updated_time"]', 'meta[property="article:modified_time"]']) page(selector).attr('content', DIRECTORY_PRIVACY_MODIFIED);
      page('script.rank-math-schema').each((_, script) => {
        const schema = JSON.parse(page(script).text());
        for (const node of schema['@graph'] || []) if (node.dateModified) node.dateModified = DIRECTORY_PRIVACY_MODIFIED;
        page(script).text(JSON.stringify(schema));
      });
    }
    if (['travel-tips', 'asia-travel', 'europe-travel', 'southeast-asia-travel', 'middle-east-travel'].some(slug => relative === `${slug}/index.html`)) {
      page('#ss-category-directory').remove();
      const anchor = page('#ss-uae-review-note').length ? page('#ss-uae-review-note') : page('.ss-archive-hero');
      anchor.after('<p id="ss-category-directory"><a href="/guides/">전체 가이드에서 주제·지역별로 찾기</a></p>');
    }
    page('.ss-site-footer h4').filter((_, node) => page(node).text() === '사이트 안내').next('ul').each((_, node) => {
      if (!page(node).find('a[href="/guides/"]').length) page(node).prepend('<li><a href="/guides/">가이드 찾기</a></li>');
      if (!page(node).find('a.ss-footer-tools').length) page(node).prepend(`<li><a class="ss-footer-tools" href="${TOOL_DIRECTORY_ROUTE}">여행 도구</a></li>`);
      const link = page(node).find('a.ss-footer-tools');
      if (isTool) link.attr({ target: '_blank', rel: 'noopener', title: '새 탭에서 여행 도구 목록 열기' }); else link.removeAttr('target rel title');
    });
    const related = RELATED_TOOL_LINKS[relative.replace(/\/index\.html$/, '')];
    if (related && !/noindex/.test(page('meta[name="robots"]').attr('content') || '')) {
      page('#ss-related-tools').remove();
      const links = related.map(route => {
        const entry = entries.find(item => item.href === route && item.type === 'tools');
        if (!entry) throw new Error(`Missing contextual tool: ${route}`);
        return `<li><a href="${route}" target="_blank" rel="noopener" title="새 탭에서 열기">${escapeHtml(entry.title)}</a></li>`;
      }).join('');
      const nav = `<nav id="ss-related-tools" class="ss-related-tools" aria-label="관련 여행 도구"><p>함께 검토할 여행 도구</p><ul>${links}</ul></nav>`;
      const anchor = page('.ss-post > .ss-related').first();
      if (anchor.length) anchor.before(nav); else page('.ss-post').first().append(nav);
      if (!page('link#ss-tool-discovery-style').length) page('head').append('<link id="ss-tool-discovery-style" rel="stylesheet" href="/assets/tool-discovery.css">');
    }
    const updated = serialize(page);
    if (updated !== html) await writeFileUtf8(file, updated);
  }

  const mapFile = path.join(root, 'page-sitemap.xml');
  const map = load(await fs.readFile(mapFile, 'utf8'), { xml: true });
  for (const url of [`${origin}${HUB_ROUTE}`, `${origin}/`, `${origin}/privacy-policy/`]) {
    const modified = url.endsWith('/privacy-policy/') ? DIRECTORY_PRIVACY_MODIFIED : HUB_MODIFIED;
    let item = map('url').filter((_, node) => map(node).find('loc').text() === url);
    if (!item.length) { map('urlset').append(`<url><loc>${url}</loc><lastmod>${modified}</lastmod></url>`); continue; }
    if (item.length !== 1) throw new Error('Duplicate directory/home sitemap entry');
    if (item.find('lastmod').length) item.find('lastmod').text(modified); else item.append(`<lastmod>${modified}</lastmod>`);
  }
  await writeFileUtf8(mapFile, map.xml().trimEnd() + '\n');
  const indexFile = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(indexFile, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => index(node).find('loc').text() === `${origin}/page-sitemap.xml`).find('lastmod').text(HUB_MODIFIED);
  await writeFileUtf8(indexFile, index.xml().trimEnd() + '\n');
  return { route: HUB_ROUTE, entries: entries.length, heldEntries: 0 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await buildGuideHub()));
