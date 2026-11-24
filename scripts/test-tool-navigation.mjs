import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { TOOL_NAV_ROUTES, leavesToolPage, protectToolLinks } from './preserve-tool-navigation.mjs';

test('navigation distinguishes other documents from local anchors, files and non-web actions', () => {
  const route = '/tools/trip-board/';
  for (const href of ['/', '/guides/?type=tools', '/privacy-policy/#trip-board-privacy', '../stay-compare/', 'https://example.com/source', route]) assert.equal(leavesToolPage(href, route), true, href);
  for (const href of ['', '#board-panel-summary', route + '#board-context', 'mailto:replyleaders01@gmail.com', 'tel:+8200000000', 'blob:https://shootsense.com/id', 'javascript:void(0)']) assert.equal(leavesToolPage(href, route), false, href);
  assert.equal(leavesToolPage('/assets/worksheet.txt', route, true), false);
});

test('all five tools protect content, source, breadcrumb, header and footer navigation', async () => {
  let total = 0;
  for (const route of TOOL_NAV_ROUTES) {
    const page = load(await fs.readFile(`.${route}index.html`, 'utf8'));
    const links = page('a[href]').filter((_, node) => leavesToolPage(page(node).attr('href'), route, page(node).attr('download') !== undefined));
    assert.ok(links.length > 10);
    for (const node of links.toArray()) {
      const link = page(node);
      assert.equal(link.attr('target'), '_blank', `${route} ${link.attr('href')}`);
      assert.ok(link.attr('rel').split(/\s+/).includes('noopener'));
      assert.equal(link.attr('data-tool-navigation'), 'new-tab');
      assert.match(link.attr('title'), /새 탭/);
      assert.match(link.attr('aria-description'), /현재 도구 입력/);
    }
    total += links.length;
  }
  assert.ok(total > 100);
});

test('protection is idempotent and preserves source URL, relation flags and in-page links', () => {
  const page = load('<a href="/contact/" rel="nofollow" title="문의">문의</a><a href="#section">본문</a><a href="/sheet.txt" download>파일</a><a href="mailto:a@example.com">메일</a>');
  assert.equal(protectToolLinks(page, '/tools/trip-board/'), 1);
  const once = page.html();
  protectToolLinks(page, '/tools/trip-board/');
  assert.equal(page.html(), once);
  assert.equal(page('a').first().attr('href'), '/contact/');
  assert.equal(page('a').first().attr('rel'), 'nofollow noopener');
  assert.equal(page('a[href="#section"]').attr('target'), undefined);
  assert.equal(page('a[download]').attr('target'), undefined);
  assert.equal(page('a[href^=mailto]').attr('target'), undefined);
});

test('non-tool pages retain ordinary same-tab navigation', async () => {
  for (const file of ['index.html', 'guides/index.html', 'contact/index.html', 'honja-yeohaeng-junbimul-checklist/index.html']) {
    const page = load(await fs.readFile(file, 'utf8'));
    assert.equal(page('[data-tool-navigation]').length, 0);
    assert.notEqual(page('#masthead .site-title a').attr('target'), '_blank');
  }
});
