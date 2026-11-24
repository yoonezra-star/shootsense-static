import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { CONTENT_TYPES, readGuideFilters, matchesGuide } from '../assets/guide-search.js';
import { readHubEntries, TOOL_DIRECTORY_ROUTE, RELATED_TOOL_LINKS } from './build-guide-hub.mjs';

const read = async file => load(await fs.readFile(file, 'utf8'));
async function publicPages(dir = '.') {
  const ignored = new Set(['.git', 'node_modules', 'scripts', 'content', 'wp-content', 'cdn-cgi', 'playwright-artifacts', 'test-results']);
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await publicPages(file));
    else if (entry.name === 'index.html' || entry.name === '404.html') files.push(file);
  }
  return files;
}

test('directory separates five tools, three analyses and eighteen guides without creating duplicate pages', async () => {
  const entries = await readHubEntries();
  assert.equal(entries.filter(entry => entry.type === 'tools').length, 5);
  assert.equal(entries.filter(entry => entry.type === 'analysis').length, 3);
  assert.equal(entries.filter(entry => entry.type === 'guides').length, 18);
  const $ = await read('guides/index.html');
  assert.equal($('#guide-type').attr('name'), 'type');
  assert.equal($('#guide-type').attr('aria-label'), '자료 종류');
  assert.deepEqual($('#guide-type option').toArray().map(node => $(node).attr('value')), CONTENT_TYPES);
  assert.deepEqual($('[data-guide-row]').toArray().map(node => $(node).attr('data-type')), entries.map(entry => entry.type));
  assert.equal($('[data-guide-row]').length, 26);
  assert.equal($('link[rel=canonical]').attr('href'), 'https://shootsense.com/guides/');
});
test('type is allowlisted in URL and composes with search, region and topic', async () => {
  assert.deepEqual(readGuideFilters('?type=tools&topic=stay&region=general&q=취소'), { type: 'tools', topic: 'stay', region: 'general', query: '취소' });
  assert.equal(readGuideFilters('?type=%3Cscript%3E').type, 'all');
  const entries = (await readHubEntries()).map(entry => ({ ...entry, text: `${entry.title} ${entry.summary} ${entry.keywords}` }));
  assert.equal(entries.filter(entry => matchesGuide(entry, { type: 'tools' })).length, 5);
  assert.equal(entries.filter(entry => matchesGuide(entry, { type: 'tools', region: 'japan' })).length, 3);
  assert.equal(entries.filter(entry => matchesGuide(entry, { type: 'tools', region: 'general', topic: 'stay' })).length, 2);
  assert.equal(entries.filter(entry => matchesGuide(entry, { type: 'analysis', region: 'japan' })).length, 3);
  assert.equal(entries.filter(entry => matchesGuide(entry, { type: 'tools', query: '취소 시간대' })).length, 1);
});
test('public pages have consistent desktop/mobile navigation and 404 has matching recovery links', async () => {
  const files = await publicPages();
  assert.equal(files.length, 50);
  for (const file of files) {
    const $ = await read(file);
    if (file === '404.html') {
      assert.equal($('header nav a.ss-404-tools').attr('href'), TOOL_DIRECTORY_ROUTE);
      assert.equal($('main .links a.ss-404-tools').attr('href'), TOOL_DIRECTORY_ROUTE);
      assert.equal($('main .links a[href="/guides/"]').length, 1);
      assert.match($('meta[name=robots]').attr('content'), /noindex/);
      continue;
    }
    const isTool = file.replaceAll('\\', '/').startsWith('tools/');
    const nav = $('#masthead .ss-tools-link a');
    assert.equal(nav.length, 2, file);
    for (const node of nav.toArray()) {
      assert.equal($(node).text(), '여행 도구', file);
      assert.equal($(node).attr('href'), TOOL_DIRECTORY_ROUTE, file);
      assert.equal($(node).attr('target'), isTool ? '_blank' : undefined, file);
      assert.equal($(node).attr('aria-current'), isTool ? 'location' : undefined, file);
      if (isTool) assert.equal($(node).attr('rel'), 'noopener', file);
    }
    const footer = $('.ss-site-footer a.ss-footer-tools');
    assert.equal(footer.length, 1, file);
    assert.equal(footer.attr('href'), TOOL_DIRECTORY_ROUTE, file);
    assert.equal($('.ss-site-footer a[href="/guides/"]').length, 1, file);
    assert.equal($('.ss-site-footer a[href="mailto:replyleaders01@gmail.com"]').length, 1, file);
  }
});
test('contextual tool links cover the five relevant articles outside source body and TOC', async () => {
  const all = [];
  for (const [slug, routes] of Object.entries(RELATED_TOOL_LINKS)) {
    const $ = await read(`${slug}/index.html`);
    assert.equal($('#ss-related-tools').length, 1);
    assert.equal($('.ss-post-body #ss-related-tools, .ss-toc #ss-related-tools').length, 0);
    assert.equal($('#ss-related-tools').attr('aria-label'), '관련 여행 도구');
    assert.deepEqual($('#ss-related-tools a').toArray().map(node => $(node).attr('href')), routes);
    assert.equal($('link#ss-tool-discovery-style').length, 1);
    for (const node of $('#ss-related-tools a').toArray()) {
      assert.equal($(node).attr('target'), '_blank');
      assert.equal($(node).attr('rel'), 'noopener');
      all.push($(node).attr('href'));
    }
  }
  assert.equal(new Set(all).size, 5);
  const home = await read('index.html');
  assert.equal(home('#ss-home-tools-directory').attr('href'), TOOL_DIRECTORY_ROUTE);
  assert.match(home('#ss-home-tools-directory').text(), /5개/);
});
test('navigation additions do not reindex held pages or claim new source verification dates', async () => {
  let held = 0;
  for (const file of await publicPages()) {
    const $ = await read(file);
    if (!$('.ss-post').length) continue;
    if (/noindex/.test($('meta[name=robots]').attr('content') || '')) {
      held++;
      assert.equal($('#ss-related-tools').length, 0, file);
      assert.equal($('script[src*="googlesyndication"], ins.adsbygoogle').length, 0, file);
    }
  }
  assert.equal(held, 7);
  const map = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(map('loc').length, 18);
  assert.equal(map('lastmod').toArray().filter(node => map(node).text().startsWith('2026-11-24T13:06')).length, 0);
  const privacy = await read('privacy-policy/index.html');
  assert.match(privacy('#guide-search-privacy').text(), /자료 종류/);
});
