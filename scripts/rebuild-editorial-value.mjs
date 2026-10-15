import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { ensureMobileReadingLayout, writeFileUtf8 } from './lib/static-site-utils.mjs';
import { HOME_CONTENT, LODGING_CONTENT, PACKING_CONTENT, toolContent } from './recovery-content.mjs';

const root = process.cwd();
const modified = '2026-10-15T15:20:00+09:00';
const origin = 'https://shootsense.com';
const logo = `${origin}/wp-content/uploads/2025/05/cropped-ChatGPT-Image-2025년-5월-5일-오후-01_56_24-192x192.png`;
const toolRoute = '/tools/stay-compare/';
const ignored = new Set(['.git', '.github', '.wrangler', 'node_modules', 'scripts', 'content', 'wp-content', 'cdn-cgi', 'playwright-artifacts', 'test-results']);
const posts = new Map([
  ['honja-yeohaeng-sukso-goreuneun-beop/index.html', { body: LODGING_CONTENT, summary: '같은 예약 기간의 숙박비·추가금·이동비를 합산하고, 취소 손실과 늦은 체크인 조건을 별도로 비교합니다. 가상 계산 사례와 예약 전 문의 문안을 제공합니다.' }],
  ['honja-yeohaeng-junbimul-checklist/index.html', { body: PACKING_CONTENT, summary: '휴대폰 방전·데이터 중단·지갑 분실을 가정해 준비물을 직접 점검합니다. 오프라인 주소 확인, 충전 연결 테스트와 내려받는 출발 준비표를 제공합니다.' }]
]);

async function collect(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory() && !ignored.has(entry.name)) files.push(...await collect(file));
    else if (entry.isFile() && entry.name === 'index.html') files.push(file);
  }
  return files;
}

function setMeta($, selector, attribute, value) {
  const node = $(selector).first();
  if (node.length) node.attr(attribute, value);
}

function updateDates($, description) {
  setMeta($, 'meta[property="og:updated_time"]', 'content', modified);
  setMeta($, 'meta[property="article:modified_time"]', 'content', modified);
  $('script[type="application/ld+json"]').each((_, script) => {
    const schema = JSON.parse($(script).text());
    for (const node of schema['@graph'] || []) {
      if (node.dateModified) node.dateModified = modified;
      if (description && node['@type'] === 'BlogPosting') node.description = description;
    }
    $(script).text(JSON.stringify(schema));
  });
}

function describe($, description) {
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) setMeta($, selector, 'content', description);
}

function assets($) {
  if (!$('link#ss-decision-tools').length) $('head').append('<link id="ss-decision-tools" rel="stylesheet" href="/assets/decision-tools.css">');
}

async function common($, relative) {
  $('.ss-site-footer .meta').filter((_, node) => $(node).text().trim().startsWith('운영 시작')).remove();
  for (const selector of ['#ast-hf-menu-1', '#ast-hf-mobile-menu']) {
    const menu = $(selector);
    if (menu.length && !menu.find(`a[href="${toolRoute}"]`).length) {
      const entry = `<li class="menu-item ss-tools-link"><a href="${toolRoute}" class="menu-link">숙소 비교</a></li>`;
      const about = menu.children('li').filter((_, node) => $(node).find('a').attr('href') === '/about/').first();
      if (about.length) about.before(entry); else menu.append(entry);
    }
  }
  $('script[type="application/ld+json"]').each((_, script) => {
    const schema = JSON.parse($(script).text());
    const visit = value => {
      if (!value || typeof value !== 'object') return;
      if (String(value.url || '').includes('ChatGPT-Image-2025') && String(value.url).includes('01_33_00')) {
        value.url = logo;
        if (value.contentUrl) value.contentUrl = logo;
        if (value.width) value.width = 192;
        if (value.height) value.height = 192;
      }
      if (value['@type'] === 'WebSite' && value.potentialAction?.['@type'] === 'SearchAction') delete value.potentialAction;
      Object.values(value).forEach(visit);
    };
    visit(schema);
    $(script).text(JSON.stringify(schema));
  });
  for (const anchor of $('.ss-related a[href], .ss-post-nav a[href]').toArray()) {
    const url = new URL($(anchor).attr('href'), new URL(relative.replace(/index\.html$/, ''), `${origin}/`));
    if (url.origin !== origin) continue;
    let target = decodeURIComponent(url.pathname).replace(/^\//, '');
    if (!path.extname(target)) target = path.join(target, 'index.html');
    try { await fs.access(path.join(root, target)); }
    catch {
      const item = $(anchor).closest('.ss-related li');
      if (item.length) item.remove(); else $(anchor).remove();
    }
  }
  $('.ss-related, .ss-post-nav').filter((_, node) => !$(node).find('a').length).remove();
}

function pageSchema(url, name, application = false) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Person', '@id': `${origin}/author/#operator`, name: '여행엑스퍼트', url: `${origin}/author/` },
      { '@type': 'WebSite', '@id': `${origin}/#website`, name: '여행정보엑스퍼트', url: `${origin}/`, publisher: { '@id': `${origin}/author/#operator` }, inLanguage: 'ko-KR' },
      { '@type': 'WebPage', '@id': `${url}#webpage`, url, name, dateModified: modified, inLanguage: 'ko-KR', isPartOf: { '@id': `${origin}/#website` } },
      ...(application ? [{ '@type': 'WebApplication', '@id': `${url}#application`, name, url, applicationCategory: 'TravelApplication', operatingSystem: 'Any', inLanguage: 'ko-KR', offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' }, datePublished: modified, dateModified: modified }] : [])
    ]
  };
}

const output = new Map();
for (const file of await collect(root)) {
  const html = await fs.readFile(file, 'utf8');
  const $ = load(html.trimEnd(), { decodeEntities: false });
  if (!$('#masthead').length) continue;
  const relative = path.relative(root, file).replaceAll('\\', '/');
  await common($, relative);
  if (relative === 'index.html') {
    $('.entry-content').first().html(HOME_CONTENT);
    const title = '여행정보엑스퍼트 | 혼자 여행 숙소 비교와 출발 준비';
    $('title').text(title);
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) setMeta($, selector, 'content', title);
    describe($, '숙소 총비용과 취소 손실을 직접 비교하고, 혼자 여행 준비물·오프라인 점검표·지역별 이동 가이드를 확인하세요.');
    $('script.rank-math-schema').first().text(JSON.stringify(pageSchema(`${origin}/`, title)));
    $('meta[property^="article:"], meta[name^="twitter:label"], meta[name^="twitter:data"]').remove();
    setMeta($, 'meta[property="og:updated_time"]', 'content', modified);
    assets($);
  }
  if (posts.has(relative)) {
    const post = posts.get(relative);
    $('.ss-post-body').first().html(post.body);
    const headings = $('.ss-post-body h2').map((_, heading) => ({ id: $(heading).attr('id'), text: $(heading).text() })).get();
    $('.ss-toc').first().html(`<div class="ss-toc-head">목차</div><ol>${headings.map(heading => `<li><a href="#${heading.id}">${heading.text}</a></li>`).join('')}</ol>`);
    $('.ss-post-summary p').first().text(post.summary);
    $('.ss-post-meta').first().html(`<span>최종 수정 ${modified.slice(0, 10)}</span><span>작성 · 여행엑스퍼트(필명)</span>`);
    $('.ss-trust-note').first().html(`최종 검토일: ${modified.slice(0, 10)} · 공개 자료 확인·계산 사례 작성: <a href="/author/">여행엑스퍼트(필명)</a> · <a href="/editorial-policy/">편집 원칙</a> · <a href="/contact/">오류 제보</a>`);
    describe($, post.summary);
    updateDates($, post.summary);
    $('meta[name="twitter:label2"], meta[name="twitter:data2"]').remove();
    assets($);
  }
  if (relative === 'privacy-policy/index.html') {
    if (!$('#tool-input-privacy').length) $('.ss-page').first().append('<section id="tool-input-privacy"><h2>비교 도구의 입력 정보</h2><p>숙소 총비용 비교기의 숙소명·금액·확인 상태는 브라우저 안에서 계산하며, 운영자 서버로 전송하거나 기본 저장하지 않습니다. 내려받기를 선택하면 사용자의 기기에 텍스트 파일이 만들어집니다. 광고·호스팅 서비스의 접속 정보 처리는 위의 외부 서비스 항목에 따릅니다.</p></section>');
    updateDates($);
  }
  ensureMobileReadingLayout($);
  output.set(relative, $.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n');
}

const tool = load(output.get('contact/index.html'), { decodeEntities: false });
tool('.entry-content').first().html(toolContent());
const exampleAction = tool('<div class="ss-tool-actions"></div>');
exampleAction.append(tool('#load-example'));
tool('#stay-compare-form').prepend(exampleAction);
tool('.entry-header').remove();
tool('body').addClass('ss-tool-page');
tool('article').first().attr('id', 'page-stay-compare');
tool('.ss-breadcrumb').first().html('<a href="/">홈</a><span class="sep">›</span><span class="here">숙소 총비용 비교기</span>');
tool('a[aria-current]').removeAttr('aria-current');
tool('.current-menu-item, .current_page_item').removeClass('current-menu-item current_page_item');
tool(`.ss-tools-link a[href="${toolRoute}"]`).attr('aria-current', 'page').parent().addClass('current-menu-item');
tool('[href], [src]').each((_, node) => {
  for (const attribute of ['href', 'src']) {
    const value = tool(node).attr(attribute);
    if (!value || value.startsWith('/') || value.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(value)) continue;
    const url = new URL(value, `${origin}/contact/`);
    tool(node).attr(attribute, `${url.pathname}${url.search}${url.hash}`);
  }
});
const toolTitle = '숙소 총비용 비교기 | 여행정보엑스퍼트';
tool('title').text(toolTitle);
for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) setMeta(tool, selector, 'content', toolTitle);
for (const selector of ['meta[property="og:url"]', 'link[rel="canonical"]']) setMeta(tool, selector, selector.startsWith('link') ? 'href' : 'content', `${origin}${toolRoute}`);
setMeta(tool, 'meta[property="og:type"]', 'content', 'website');
setMeta(tool, 'meta[name="robots"]', 'content', 'index, follow');
setMeta(tool, 'meta[property="og:updated_time"]', 'content', modified);
describe(tool, '숙박비·추가금·교통비의 합계와 취소 손실을 두 숙소별로 비교합니다. 체크인과 추가금의 미확인 상태를 함께 표시하고 비교표를 내려받을 수 있습니다.');
tool('script.rank-math-schema').first().text(JSON.stringify(pageSchema(`${origin}${toolRoute}`, '숙소 총비용 비교기', true)));
tool('meta[property^="article:"], meta[name^="twitter:label"], meta[name^="twitter:data"]').remove();
tool('script[src*="pagead2.googlesyndication.com"]').remove();
assets(tool);
tool('head').append('<script id="ss-stay-compare" type="module" src="/assets/stay-compare.js"></script>');
ensureMobileReadingLayout(tool);
output.set('tools/stay-compare/index.html', tool.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n');

for (const [relative, html] of output) await writeFileUtf8(path.join(root, relative), html);

for (const name of ['post-sitemap.xml', 'page-sitemap.xml']) {
  const $ = load(await fs.readFile(path.join(root, name), 'utf8'), { xmlMode: true });
  const changed = name === 'post-sitemap.xml' ? [...posts.keys()].map(file => `${origin}/${file.replace(/index\.html$/, '')}`) : [`${origin}/`, `${origin}/privacy-policy/`, `${origin}${toolRoute}`];
  for (const url of changed) {
    let item = $('url').filter((_, node) => $(node).find('loc').text() === url).first();
    if (!item.length) { $('urlset').append(`<url><loc>${url}</loc></url>`); item = $('url').last(); }
    if (item.find('lastmod').length) item.find('lastmod').text(modified); else item.append(`<lastmod>${modified}</lastmod>`);
  }
  await writeFileUtf8(path.join(root, name), $.xml().trimEnd() + '\n');
}
const sitemapIndex = load(await fs.readFile(path.join(root, 'sitemap_index.xml'), 'utf8'), { xmlMode: true });
sitemapIndex('sitemap lastmod').text(modified);
await writeFileUtf8(path.join(root, 'sitemap_index.xml'), sitemapIndex.xml().trimEnd() + '\n');
console.log(JSON.stringify({ htmlPages: output.size, rewrittenPosts: posts.size, addedTool: toolRoute }, null, 2));
