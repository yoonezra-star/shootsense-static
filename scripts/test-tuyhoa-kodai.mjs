import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { TUYHOA_KODAI_GUIDES, TUYHOA_KODAI_MODIFIED, TUYHOA_SLUG, KODAI_SLUG } from './tuyhoa-kodai-content.mjs';
import { SAFI_MLEIHA_GUIDES, SAFI_MLEIHA_MODIFIED } from './safi-mleiha-content.mjs';

for (const guide of TUYHOA_KODAI_GUIDES) {
  test(`${guide.slug}: six distinct sections, aligned title, source limits and private download`, async () => {
    const $ = load(await fs.readFile(`${guide.slug}/index.html`, 'utf8'));
    assert.equal($('h1').length, 1);
    assert.equal($('h1').text(), guide.title);
    assert.equal($('meta[property="og:title"]').attr('content'), guide.title);
    assert.equal($('.ss-post.ss-regional-guide').length, 1);
    assert.equal($('link#ss-regional-style').length, 1);
    assert.equal($('.ss-post-summary p').text(), guide.summary);
    const ids = $('.ss-post-body h2').toArray().map(node => $(node).attr('id'));
    assert.equal(ids.length, 6);
    assert.equal(new Set(ids).size, 6);
    assert.ok(ids.every(Boolean));
    assert.equal($('.ss-toc').length, 1);
    assert.deepEqual($('.ss-toc a').toArray().map(node => $(node).attr('href')), ids.map(id => `#${id}`));
    assert.ok($('.ss-toc a').toArray().every(node => !/^\d+\./.test($(node).text())));
    const downloads = $('.ss-post-body a[download]');
    assert.equal(downloads.length, 1);
    const worksheet = await fs.readFile(`.${downloads.attr('href')}`, 'utf8');
    assert.ok(worksheet.includes(`https://shootsense.com/${guide.slug}/`));
    assert.match(worksheet, /자료 검토: 2026-10-16/);
    assert.match(worksheet, /비공개/);
    assert.ok(!worksheet.includes('\ufffd'));
    const allowed = new Set(['daklak.gov.vn', 'vietnam.travel', 'giavere.dsvn.vn', 'dsvn.vn', 'nchmf.gov.vn', 'dindigul.nic.in', 'www.iiap.res.in', 'kso.iiap.res.in', 'tnepass.tn.gov.in']);
    const external = $('.ss-post-body a[href^="https:"]').toArray().map(node => new URL($(node).attr('href')));
    assert.ok(external.length >= 4);
    assert.ok(external.every(url => allowed.has(url.hostname)));
    assert.equal($('meta[property="article:modified_time"]').attr('content'), TUYHOA_KODAI_MODIFIED);
    const schema = JSON.parse($('script.rank-math-schema').text());
    for (const node of schema['@graph'].filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) {
      assert.equal(node.dateModified, TUYHOA_KODAI_MODIFIED);
      assert.equal(node.description, guide.summary);
      assert.equal(node.name, guide.title);
      assert.ok(Date.parse(node.datePublished) < Date.parse(TUYHOA_KODAI_MODIFIED));
    }
    const breadcrumb = schema['@graph'].find(node => node['@type'] === 'BreadcrumbList').itemListElement.at(-1);
    assert.equal(breadcrumb.item?.name || breadcrumb.name, guide.title);
  });
}

test('Tuy Hoa distinguishes province labels, arrival facilities and a hypothetical stay', async () => {
  const $ = load(await fs.readFile(`${TUYHOA_SLUG}/index.html`, 'utf8'));
  const text = $('.ss-post-body').text();
  assert.match(text, /URL에는 phu-yen을 남긴 채 제목은 Dak Lak/);
  assert.match(text, /내륙의 Dak Lak 기온 하나를 투이호아 해안/);
  assert.match($('#tuyhoa-two-night-case').next().text(), /실제 예약이 아닌 편집상 비교 사례/);
  assert.match(text, /편도 요금만 받고 현장에서 귀환을 다시 구한다면/);
  assert.match(text, /특정 요일의 운항, 공항 셔틀, 역의 짐 보관이나 고정 택시비/);
});

test('Kodaikanal exposes old-source conflict and does not equate application with approval', async () => {
  const $ = load(await fs.readFile(`${KODAI_SLUG}/index.html`, 'utf8'));
  const text = $('.ss-post-body').text();
  assert.match(text, /2018년 7월 3일/);
  assert.match(text, /2024-11-20 갱신 표기/);
  assert.match(text, /공식 도메인의 검색 수집 본문/);
  assert.match(text, /직접 원문 요청은 실패/);
  assert.match(text, /적어도 15일 전/);
  assert.match(text, /Rs. 50/);
  assert.match(text, /최대 90분/);
  assert.match(text, /현재 쿼터·면제·마감·수수료를 제시하지 않습니다/);
  assert.match($('#kodai-late-arrival-case').next().text(), /실제 운행표가 아닌/);
  assert.ok(!text.includes('입장 보장'));
});

test('main and both region lists use revised titles without stale link labels', async () => {
  const home = load(await fs.readFile('index.html', 'utf8'));
  assert.equal(home('#tuyhoa-kodai-update').length, 1);
  assert.equal(home('.ss-home-updates').children().first().attr('id'), 'tuyhoa-kodai-update');
  for (const [guide, category] of [[TUYHOA_KODAI_GUIDES[0], 'southeast-asia-travel'], [TUYHOA_KODAI_GUIDES[1], 'asia-travel']]) {
    assert.equal(home(`.ss-region-list a[href="/${guide.slug}/"]`).closest('li').find('span').last().text(), guide.homeTeaser);
    const html = await fs.readFile(`${category}/index.html`, 'utf8');
    assert.ok(html.includes(guide.title));
    assert.ok(!html.includes(guide.previousTitle));
  }
});

test('image-backed related links and previous-next navigation retain images but use current labels', async () => {
  for (const file of ['honja-lushan-yeohaeng/index.html', '관광객이-적어-현지의-속도를-느낀-아르타/index.html', '심심함이-여행의-일부가-된-반퐁에서의-며칠/index.html', '여행의-목적이-보기가-아니었을-때-선택한-마쓰다이/index.html']) {
    const html = await fs.readFile(file, 'utf8');
    const $ = load(html);
    const imageLinks = $('a[href]').toArray().filter(node => $(node).find('img').length && TUYHOA_KODAI_GUIDES.some(guide => $(node).attr('href').includes(guide.slug)));
    assert.equal(imageLinks.length, 1, file);
    const anchor = $(imageLinks[0]);
    const target = TUYHOA_KODAI_GUIDES.find(guide => anchor.attr('href').includes(guide.slug));
    assert.equal(anchor.find('.ti').text(), target.title);
    assert.equal(anchor.find('img').length, 1);
    for (const guide of TUYHOA_KODAI_GUIDES) assert.ok(!html.includes(guide.previousTitle), file);
  }
});

test('sitemaps change this batch while the previous batch retains its review date', async () => {
  const xml = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(xml('url').length, 18);
  for (const guide of TUYHOA_KODAI_GUIDES) {
    const item = xml('url').filter((_, node) => xml(node).find('loc').text() === `https://shootsense.com/${guide.slug}/`);
    assert.equal(item.length, 1);
    assert.equal(item.find('lastmod').text(), TUYHOA_KODAI_MODIFIED);
  }
  for (const guide of SAFI_MLEIHA_GUIDES) {
    const $ = load(await fs.readFile(`${guide.slug}/index.html`, 'utf8'));
    assert.equal($('meta[property="article:modified_time"]').attr('content'), SAFI_MLEIHA_MODIFIED);
  }
  const home = load(await fs.readFile('index.html', 'utf8'));
  assert.ok(Date.parse(home('meta[property="og:updated_time"]').attr('content')) >= Date.parse(TUYHOA_KODAI_MODIFIED));
});
