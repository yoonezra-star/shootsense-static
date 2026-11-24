import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { TOKYO_CASE, TOKYO_COMPARE_INPUTS, TOKYO_SENSITIVITY, tokyoCaseTotal } from '../assets/tokyo-stay-case.js';
import { compareStays } from '../assets/stay-math.js';
import { ANALYSIS_ROUTE, ANALYSIS_MODIFIED, ANALYSIS_TITLE, ANALYSIS_SOURCES } from './tokyo-analysis-content.mjs';
import { LAB_MODIFIED } from './trip-lab-content.mjs';
import { RECHECKS } from './november-recovery.mjs';
import { HELD_SAFETY_GUIDES } from './held-safety.mjs';
import { REGIONAL_GUIDES, REGIONAL_MODIFIED } from './regional-access-content.mjs';
import { TUYHOA_KODAI_GUIDES, TUYHOA_KODAI_MODIFIED } from './tuyhoa-kodai-content.mjs';
import { SAFI_MLEIHA_GUIDES, SAFI_MLEIHA_MODIFIED } from './safi-mleiha-content.mjs';

const read = async relative => load(await fs.readFile(relative, 'utf8'));

test('Tokyo assumptions separate payment, tax basis and the 1300-yen break-even', () => {
  assert.equal(TOKYO_CASE.nights, 2);
  assert.equal(TOKYO_CASE.people, 1);
  assert.equal(tokyoCaseTotal(TOKYO_CASE.a), 23360);
  assert.equal(tokyoCaseTotal(TOKYO_CASE.b), 23260);
  const roomDifference = TOKYO_CASE.b.lodgingPayment + TOKYO_CASE.b.accommodationTax - TOKYO_CASE.a.lodgingPayment;
  assert.equal(roomDifference, 1300);
  assert.equal(TOKYO_CASE.b.transport + roomDifference, 1700);
  assert.equal(tokyoCaseTotal(TOKYO_CASE.a, { transport: 1700 }), tokyoCaseTotal(TOKYO_CASE.b));
  assert.deepEqual(TOKYO_SENSITIVITY.map(row => [row.a, row.b]), [[23160, 23260], [23260, 23260], [23360, 23260], [23360, 24260]]);
});

test('explanatory KRW conversion never invents confirmed fees, cancellation or check-in', () => {
  const result = compareStays(TOKYO_COMPARE_INPUTS);
  assert.deepEqual(result.stays.map(stay => stay.total), [233600, 232600]);
  assert.equal(result.difference, 1000);
  assert.equal(result.lowerCostId, 'b');
  assert.ok(result.stays.every(stay => stay.cancellation === null && stay.flags.includes('추가비용 미확인') && stay.flags.includes('도착 시각 체크인 미확인')));
});

test('all downloadable CSV totals can be reproduced and 2027 is a distinct fictional scenario', async () => {
  const csv = await fs.readFile('assets/tokyo-stay-case.csv', 'utf8');
  const [headers, ...rows] = csv.trim().split(/\r?\n/).map(line => line.split(','));
  assert.equal(new Set(headers).size, headers.length);
  assert.equal(rows.length, 5);
  for (const row of rows) {
    assert.equal(row[1], 'JPY');
    assert.equal(row[2], '2');
    assert.equal(row[3], '1');
    assert.equal(row.slice(4, 8).map(Number).reduce((a, b) => a + b, 0), Number(row[8]));
  }
  assert.equal(tokyoCaseTotal(TOKYO_CASE.b, { tax: 0 }), 23060);
});

test('analysis has one title, one complete TOC, primary sources and explicit hypothetical scope', async () => {
  const $ = await read(`.${ANALYSIS_ROUTE}index.html`);
  assert.equal($('h1').length, 1);
  assert.equal($('h1').text(), ANALYSIS_TITLE);
  assert.equal($('.ss-toc').length, 1);
  const ids = $('.ss-post-body h2').toArray().map(node => $(node).attr('id'));
  assert.equal(ids.length, 6);
  assert.equal(new Set(ids).size, 6);
  assert.deepEqual($('.ss-toc a').toArray().map(node => $(node).attr('href')), ids.map(id => `#${id}`));
  assert.equal($('.ss-post').length, 0);
  assert.equal($('link#ss-research-style').length, 1);
  assert.equal($('link#ss-regional-style').length, 1);
  const text = $('.ss-research').text();
  assert.match(text, /판매 중인 객실·실제 숙소 두 곳의 견적·이용 후기가 아닙니다/);
  assert.match(text, /후보 A\/B는 아래 출처의 호텔 브랜드를 뜻하지 않습니다/);
  assert.match(text, /1엔 = 10원이라는 설명용 환산 가정/);
  assert.match(text, /현재 환율이 아닙니다/);
  const sources = new Set($('.ss-post-body a').toArray().map(node => $(node).attr('href')).filter(href => href.startsWith('https:')));
  assert.deepEqual(sources, new Set(Object.values(ANALYSIS_SOURCES)));
});

test('lodging tax date, billing base and midnight example stay explicit', async () => {
  const text = (await read(`.${ANALYSIS_ROUTE}index.html`))('.ss-research').text();
  assert.match(text, /2027년 4월 1일 숙박분부터/);
  assert.match(text, /실제 숙박일이 기준/);
  assert.match(text, /실제 2027년 객실 가격이 같다는 예측은 아닙니다/);
  assert.match(text, /숙박세가 이미 포함된 총액이라면.*다시 더하지 않습니다/);
  assert.match(text, /일본 현지 시각/);
  assert.match(text, /다음 날 00:20/);
  assert.match(text, /개별.*|특정 예약/);
  assert.match(text, /이용할 때 합계에 그 금액을 또 더하지 않습니다/);
  assert.equal(23 * 60 + 35 + 45, 24 * 60 + 20);
});

test('canonical, article identity and publication match a genuinely new analysis page', async () => {
  const $ = await read(`.${ANALYSIS_ROUTE}index.html`);
  const url = `https://shootsense.com${ANALYSIS_ROUTE}`;
  assert.equal($('link[rel="canonical"]').attr('href'), url);
  assert.equal($('meta[property="og:url"]').attr('content'), url);
  assert.equal($('meta[name="robots"]').attr('content'), 'index, follow');
  assert.equal($('script[src*="googlesyndication"], ins.adsbygoogle').length, 0);
  const graph = JSON.parse($('script.rank-math-schema').text())['@graph'];
  assert.equal(graph.filter(node => node['@type'] === 'Article').length, 1);
  for (const node of graph.filter(node => ['Article', 'WebPage'].includes(node['@type']))) {
    assert.equal(node.datePublished, ANALYSIS_MODIFIED);
    assert.equal(node.dateModified, LAB_MODIFIED);
  }
  assert.ok(!graph.some(node => node.url?.includes('/contact/')));
  assert.equal($('a[aria-current="page"]').length, 0);
  assert.equal($('.ss-breadcrumb .here').text(), '도쿄 숙소 비용 분석');
});

test('home, existing tool and lodging guide expose the analysis without replacing their purposes', async () => {
  const home = await read('index.html');
  assert.equal(home('#ss-home-research').length, 1);
  assert.equal(home('#november-recovery-update').length, 1);
  assert.equal(home('.ss-home-tool + #ss-home-research').length, 1);
  assert.match(home('#ss-home-research').text(), /1,300엔/);
  assert.equal(home('.ss-home-updates').children().first().attr('id'), 'november-recovery-update');
  for (const file of ['tools/stay-compare/index.html', 'honja-yeohaeng-sukso-goreuneun-beop/index.html']) {
    const $ = await read(file);
    assert.equal($('#ss-tokyo-analysis-link').length, 1);
    assert.equal($('#ss-tokyo-analysis-link a').attr('href'), ANALYSIS_ROUTE);
  }
  assert.equal((await read('tools/stay-compare/index.html'))('#stay-compare-form').length, 1);
});

test('partial rechecks remain scoped and do not claim whole-article new verification dates', async () => {
  for (const check of RECHECKS) {
    const $ = await read(`${check.slug}/index.html`);
    const revised = [[REGIONAL_GUIDES, REGIONAL_MODIFIED], [TUYHOA_KODAI_GUIDES, TUYHOA_KODAI_MODIFIED], [SAFI_MLEIHA_GUIDES, SAFI_MLEIHA_MODIFIED]].find(([guides]) => guides.some(guide => guide.slug === check.slug));
    if (revised) {
      assert.equal($('#ss-november-recheck').length, 0);
      assert.equal($('.ss-source-review').length, 1);
      assert.equal($('meta[property="article:modified_time"]').attr('content'), revised[1]);
      assert.ok($('.ss-source-review a').toArray().some(node => $(node).attr('href') === check.href));
      continue;
    }
    assert.equal($('#ss-november-recheck').length, 1);
    assert.equal($('#ss-november-recheck a').attr('href'), check.href);
    assert.ok($('#ss-november-recheck').text().includes(check.text));
    assert.ok($('meta[property="article:modified_time"]').attr('content').startsWith('2026-10-'));
  }
  const matsudai = await read('여행의-목적이-보기가-아니었을-때-선택한-마쓰다이/index.html');
  assert.match(matsudai('#matsudai-season-ended').text(), /11월 8일에 끝났습니다/);
  assert.match(matsudai('#matsudai-season-ended').text(), /실제 운행을 확인했다는 뜻이 아닙니다/);
});

test('four unfinished tourist drafts become scoped archives without returning to ads or sitemaps', async () => {
  const slugs = [...HELD_SAFETY_GUIDES.map(guide => guide.slug), '유명-관광지에서-느끼지-못한-편안함을-준-자이살메'];
  const map = await fs.readFile('post-sitemap.xml', 'utf8');
  for (const slug of slugs) {
    const $ = await read(`${slug}/index.html`);
    assert.match($('meta[name="robots"]').attr('content'), /noindex/);
    assert.equal($('script[src*="googlesyndication"], ins.adsbygoogle').length, 0);
    assert.equal($('.ss-post-cover').length, 0);
    assert.equal($('.ss-post-body h2').length, 3);
    assert.match($('.ss-post-body').text(), /공개를 중단/);
    assert.ok(!decodeURI(map).includes(`/${slug}/`));
  }
  const jaisalmer = await read(`${slugs.at(-1)}/index.html`);
  assert.match(jaisalmer('.ss-post-body').text(), /확인하지 않은 국경 10km 규칙/);
  assert.match(jaisalmer('.ss-post-body').text(), /카슈미르·카르길 시/);
});

test('new analysis is listed once as a page while held navigation remains excluded', async () => {
  const pageMap = load(await fs.readFile('page-sitemap.xml', 'utf8'), { xml: true });
  const item = pageMap('url').filter((_, node) => pageMap(node).find('loc').text() === `https://shootsense.com${ANALYSIS_ROUTE}`);
  assert.equal(item.length, 1);
  assert.equal(item.find('lastmod').text(), LAB_MODIFIED);
  const postMap = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(postMap('url').length, 18);
  assert.equal(postMap('loc').filter((_, node) => postMap(node).text().includes(ANALYSIS_ROUTE)).length, 0);
  const sheet = await fs.readFile('assets/tokyo-stay-review.txt', 'utf8');
  assert.match(sheet, /자료 검토: 2026-11-22/);
  assert.match(sheet, /비공개 개인용/);
  assert.match(sheet, /작성 내용을 이 사이트로 제출하지 않습니다/);
  assert.ok(!sheet.includes('\ufffd'));
});
