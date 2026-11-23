import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { matchesGuide, normalizeQuery, readGuideFilters, TOPICS, REGIONS } from '../assets/guide-search.js';
import { readHubEntries, HUB_ROUTE, HUB_MODIFIED } from './build-guide-hub.mjs';

const read = async file => load(await fs.readFile(file, 'utf8'));

test('all indexed posts, one analysis and one tool appear exactly once and held articles never enter the directory', async () => {
  const entries = await readHubEntries();
  assert.equal(entries.length, 20);
  assert.equal(new Set(entries.map(entry => entry.href)).size, 20);
  assert.equal(entries.filter(entry => entry.kind === '가이드').length, 18);
  assert.equal(entries.filter(entry => entry.kind === '계산 분석').length, 1);
  assert.equal(entries.filter(entry => entry.kind === '비교 도구').length, 1);
  assert.ok(entries.every(entry => entry.title && entry.summary && TOPICS.includes(entry.topic) && REGIONS.includes(entry.region)));
  const $ = await read('guides/index.html');
  assert.equal($('[data-guide-row]').length, entries.length);
  assert.deepEqual($('.ss-directory-row h2 a').toArray().map(node => $(node).attr('href')), entries.map(entry => entry.href));
  assert.equal($('[data-guide-row][hidden]').length, 0);
  assert.ok(!$('.ss-directory-list').text().includes('재검토 대기'));
});

test('search normalizes unicode, case and whitespace and matches every token rather than any token', () => {
  assert.equal(normalizeQuery(' ＴＯＫＹＯ  도쿄\n 짐 '), 'tokyo 도쿄 짐');
  const guide = { text: '도쿄 Tokyo 짐 보관 출발', topic: 'prepare', region: 'japan' };
  assert.ok(matchesGuide(guide, { query: 'TOKYO 보관' }));
  assert.ok(!matchesGuide(guide, { query: '도쿄 환불' }));
  assert.ok(matchesGuide(guide, { query: ' ', topic: 'prepare', region: 'japan' }));
  assert.ok(!matchesGuide(guide, { topic: 'stay' }));
  assert.ok(!matchesGuide(guide, { region: 'europe' }));
});

test('filter URL allows only known options and bounds untrusted search text', () => {
  assert.deepEqual(readGuideFilters('?q=도쿄&topic=stay&region=japan'), { query: '도쿄', topic: 'stay', region: 'japan' });
  assert.deepEqual(readGuideFilters('?topic=wrong&region=wrong'), { query: '', topic: 'all', region: 'all' });
  assert.equal(readGuideFilters('?q=' + 'a'.repeat(150)).query.length, 80);
  assert.equal(readGuideFilters('?q=%3Cimg%20src=x%3E').query, '<img src=x>');
});

test('directory identity, canonical and structured list agree with its actual content', async () => {
  const $ = await read('guides/index.html');
  assert.equal($('h1').length, 1);
  assert.equal($('link[rel="canonical"]').attr('href'), `https://shootsense.com${HUB_ROUTE}`);
  assert.equal($('meta[name="robots"]').attr('content'), 'index, follow');
  assert.equal($('script#ss-guide-search[type="module"]').attr('src'), '/assets/guide-search.js');
  assert.equal($('link#ss-guide-hub-style').length, 1);
  assert.equal($('.ss-breadcrumb .here').text(), '가이드 찾기');
  assert.equal($('script[src*="googlesyndication"], ins.adsbygoogle').length, 0);
  const graph = JSON.parse($('script.rank-math-schema').text())['@graph'];
  const collection = graph.find(node => node['@type'] === 'CollectionPage');
  const list = graph.find(node => node['@type'] === 'ItemList');
  assert.equal(collection.datePublished, HUB_MODIFIED);
  assert.equal(list.numberOfItems, 20);
  assert.deepEqual(list.itemListElement.map(node => node.position), Array.from({ length: 20 }, (_, i) => i + 1));
});

test('controls retain native labels, status and complete fallback content without a search API', async () => {
  const $ = await read('guides/index.html');
  assert.equal($('form#guide-filter-form').attr('method'), 'get');
  assert.equal($('label[for="guide-query"]').length, 1);
  assert.equal($('#guide-query').attr('type'), 'search');
  assert.equal($('#guide-query').attr('maxlength'), '80');
  assert.equal($('#guide-topic').attr('aria-label'), '주제');
  assert.equal($('#guide-region').attr('aria-label'), '지역');
  assert.equal($('#guide-result-count').attr('aria-live'), 'polite');
  assert.equal($('button[type="reset"]').length, 1);
  assert.equal($('#guide-empty[hidden]').length, 1);
  const source = await fs.readFile('assets/guide-search.js', 'utf8');
  assert.ok(!/fetch\(|localStorage|sessionStorage|\.innerHTML\s*=/.test(source));
  const policy = await read('privacy-policy/index.html');
  assert.equal(policy('#guide-search-privacy').length, 1);
  assert.match(policy('#guide-search-privacy').text(), /페이지 주소에 포함/);
  assert.match(policy('#guide-search-privacy').text(), /호스팅 서비스의 접속 요청에 전달/);
  assert.match(policy('#guide-search-privacy').text(), /접속·성능 분석 기능/);
});

test('home, categories and footer expose the directory without duplicating the contact email', async () => {
  const home = await read('index.html');
  assert.equal(home('#ss-home-directory').length, 1);
  assert.equal(home('.ss-home-intro + #ss-home-directory').length, 1);
  assert.equal(home('.ss-site-footer a[href="/guides/"]').length, 1);
  assert.equal(home('a[href="mailto:replyleaders01@gmail.com"]').length, 1);
  for (const slug of ['travel-tips', 'asia-travel', 'europe-travel', 'southeast-asia-travel', 'middle-east-travel']) {
    const $ = await read(`${slug}/index.html`);
    assert.equal($('#ss-category-directory a[href="/guides/"]').length, 1);
    assert.equal($('.ss-site-footer a[href="/guides/"]').length, 1);
    if (slug === 'middle-east-travel') assert.equal($('.ss-archive-hero').next().attr('id'), 'ss-uae-review-note');
  }
});

test('directory sitemap entry is unique and no indexed post dates are churned', async () => {
  const page = load(await fs.readFile('page-sitemap.xml', 'utf8'), { xml: true });
  const item = page('url').filter((_, node) => page(node).find('loc').text() === `https://shootsense.com${HUB_ROUTE}`);
  assert.equal(item.length, 1);
  assert.equal(item.find('lastmod').text(), HUB_MODIFIED);
  const post = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(post('loc').length, 18);
  assert.equal(post('lastmod').toArray().filter(node => post(node).text().startsWith('2026-11-23')).length, 0);
});
