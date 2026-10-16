import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { SAFI_MLEIHA_GUIDES, SAFI_MLEIHA_MODIFIED, SAFI_SLUG, MLEIHA_SLUG, MLEIHA_TITLE, UAE_SAFETY_URL } from './safi-mleiha-content.mjs';
import { REGIONAL_GUIDES, REGIONAL_MODIFIED } from './regional-access-content.mjs';

for (const guide of SAFI_MLEIHA_GUIDES) {
  test(`${guide.slug}: revised article, primary sources, single TOC and private worksheet`, async () => {
    const $ = load(await fs.readFile(`${guide.slug}/index.html`, 'utf8'));
    assert.equal($('h1').length, 1);
    assert.equal($('.ss-post.ss-regional-guide').length, 1);
    assert.equal($('link#ss-regional-style').length, 1);
    const headings = $('.ss-post-body h2').toArray().map(node => $(node).attr('id'));
    assert.ok(headings.every(Boolean));
    assert.equal(new Set(headings).size, headings.length);
    assert.equal($('.ss-toc').length, 1);
    assert.deepEqual($('.ss-toc a').toArray().map(node => $(node).attr('href')), headings.map(id => `#${id}`));
    assert.ok($('.ss-toc a').toArray().every(node => !/^\d+\./.test($(node).text())));
    assert.equal($('.ss-post-summary p').text(), guide.summary);
    const files = [...new Set($('.ss-post-body a[download]').toArray().map(node => $(node).attr('href')))];
    assert.equal(files.length, 1);
    const worksheet = await fs.readFile(`.${files[0]}`, 'utf8');
    assert.ok(worksheet.includes(`https://shootsense.com/${guide.slug}/`));
    assert.match(worksheet, /자료 검토: 2026-10-15/);
    assert.match(worksheet, /비공개/);
    assert.ok(!worksheet.includes('\ufffd'));
    const domains = ['www.fnm.ma', 'www.visitmorocco.com', 'www.oncf.ma', 'voyages.oncf.ma', 'www.0404.go.kr', 'culturalmap.gov.ae', 'www.visitsharjah.com', 'www.sharjahmuseums.ae'];
    const sources = $('.ss-post-body a[href^="https:"]').toArray().map(node => new URL($(node).attr('href')));
    assert.ok(sources.length >= 3);
    assert.ok(sources.every(url => domains.includes(url.hostname)));
    assert.equal($('meta[property="article:modified_time"]').attr('content'), SAFI_MLEIHA_MODIFIED);
    const schema = JSON.parse($('script.rank-math-schema').text());
    for (const node of schema['@graph'].filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) {
      assert.equal(node.dateModified, SAFI_MLEIHA_MODIFIED);
      assert.equal(node.description, guide.summary);
      assert.ok(Date.parse(node.datePublished) < Date.parse(SAFI_MLEIHA_MODIFIED));
      if (guide.title) assert.equal(node.name, guide.title);
    }
  });
}

test('Safi separates museum facts from fictional travel-time arithmetic and unverified trains', async () => {
  const $ = load(await fs.readFile(`${SAFI_SLUG}/index.html`, 'utf8'));
  const facts = $('#safi-museum-facts').nextAll('figure').first().text();
  assert.match(facts, /10:00~18:00, 화요일 휴관/);
  assert.match(facts, /20 DH/);
  assert.match(facts, /Cité des arts/);
  assert.match($('.ss-post-body').text(), /PDF 원문과 적용일을 충분히 검증하지 못했고/);
  assert.match($('#safi-short-stay-example').next().text(), /전부 계산을 위한 가정/);
  assert.match($('#safi-short-stay-example').nextAll('blockquote').first().text(), /110 − 25 − 25 − 20 − 10 = 30분/);
});

test('Mleiha leads with travel caution and keeps city museum references conditional', async () => {
  const $ = load(await fs.readFile(`${MLEIHA_SLUG}/index.html`, 'utf8'));
  assert.equal($('h1').text(), MLEIHA_TITLE);
  assert.match($('title').text(), /여행경보와 예약 보류/);
  assert.match($('.ss-post-summary p').text(), /UAE 전 지역 출국권고/);
  assert.equal($('.ss-post-body').children().first().attr('class'), 'ss-review-notice');
  assert.equal($('.ss-review-notice a').first().attr('href'), UAE_SAFETY_URL);
  assert.match($('.ss-review-notice').text(), /도심 박물관으로 바꾸는 것도 현재 관광을 권하는 대안이 아닙니다/);
  assert.match($('.ss-post-body').text(), /일반 금요일16:00~20:00/);
  assert.match($('.ss-post-body').text(), /라마단토~목 09:00~14:00, 금요일 휴관/);
  assert.match($('.ss-post-body').text(), /고고학 박물관 기본권13세 이상 게시요금 10 AED/);
  assert.ok(!$('.ss-post-body').text().includes('지금 예약하세요'));
});

test('home teaser and regional listing show the warning and no stale invitation title', async () => {
  const home = load(await fs.readFile('index.html', 'utf8'));
  assert.equal(home('#safi-mleiha-update').length, 1);
  const teaser = home(`.ss-region-list a[href="/${MLEIHA_SLUG}/"]`).closest('li').text();
  assert.match(teaser, /UAE 전 지역 출국권고/);
  const html = await fs.readFile('middle-east-travel/index.html', 'utf8');
  const category = load(html);
  assert.equal(category('.ss-archive-hero').next().attr('id'), 'ss-uae-review-note');
  assert.equal(category('#ss-uae-review-note a').attr('href'), UAE_SAFETY_URL);
  assert.match(category('.ss-guide-cover').first().text(), /여행경보 우선/);
  assert.ok(!html.includes(SAFI_MLEIHA_GUIDES[1].previousTitle));
});

test('new sitemap dates and title agree while the prior regional revision remains dated as reviewed', async () => {
  const xml = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(xml('url').length, 18);
  for (const guide of SAFI_MLEIHA_GUIDES) {
    const item = xml('url').filter((_, node) => xml(node).find('loc').text() === `https://shootsense.com/${guide.slug}/`);
    assert.equal(item.length, 1);
    assert.equal(item.find('lastmod').text(), SAFI_MLEIHA_MODIFIED);
  }
  for (const guide of REGIONAL_GUIDES) {
    const $ = load(await fs.readFile(`${guide.slug}/index.html`, 'utf8'));
    assert.equal($('meta[property="article:modified_time"]').attr('content'), REGIONAL_MODIFIED);
  }
  const home = load(await fs.readFile('index.html', 'utf8'));
  assert.ok(Date.parse(home('meta[property="og:updated_time"]').attr('content')) >= Date.parse(SAFI_MLEIHA_MODIFIED));
});

test('legacy image-backed Mleiha recommendations use the current caution title', async () => {
  for (const slug of [SAFI_SLUG, '볼거리가-없어서-오래-머물-수-있었던-무스카트-외곽', '지도에-별표가-없는-곳에서-보낸-수르의-시간']) {
    const html = await fs.readFile(`${slug}/index.html`, 'utf8');
    const $ = load(html);
    assert.ok(!html.includes(SAFI_MLEIHA_GUIDES[1].previousTitle));
    const links = $('a[href]').filter((_, node) => $(node).attr('href').includes(MLEIHA_SLUG) && $(node).find('img').length);
    assert.ok(links.length >= 1);
    links.each((_, node) => assert.equal($(node).find('.ti').text(), MLEIHA_TITLE));
  }
});
