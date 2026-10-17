import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { BANPONG_LUSHAN_GUIDES, BANPONG_LUSHAN_MODIFIED, BANPONG_SLUG, LUSHAN_SLUG, BANPONG_EVENT_URL, LUSHAN_ACCESS_URL, LUSHAN_TICKET_URL } from './banpong-lushan-content.mjs';
import { TUYHOA_KODAI_GUIDES, TUYHOA_KODAI_MODIFIED } from './tuyhoa-kodai-content.mjs';

for (const guide of BANPONG_LUSHAN_GUIDES) {
  test(`${guide.slug}: single TOC, six sections, aligned title and private worksheet`, async () => {
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
    const sheet = await fs.readFile(`.${downloads.attr('href')}`, 'utf8');
    assert.ok(sheet.includes(`https://shootsense.com/${guide.slug}/`));
    assert.match(sheet, /자료 검토: 2026-10-16/);
    assert.match(sheet, /비공개/);
    assert.ok(!sheet.includes('\ufffd'));
    const allowed = new Set(['www.banpong.go.th', 'petfriendly.tourismthailand.org', 'www.tourismthailand.org', 'dticket.railway.co.th', 'ttsview.railway.co.th', 'whc.unesco.org', 'www.lushan.gov.cn']);
    const sources = $('.ss-post-body a[href^="https:"]').toArray().map(node => new URL($(node).attr('href')));
    assert.ok(sources.length >= 3);
    assert.ok(sources.every(url => allowed.has(url.hostname)));
    assert.equal($('meta[property="article:modified_time"]').attr('content'), BANPONG_LUSHAN_MODIFIED);
    const graph = JSON.parse($('script.rank-math-schema').text())['@graph'];
    for (const node of graph.filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) {
      assert.equal(node.dateModified, BANPONG_LUSHAN_MODIFIED);
      assert.equal(node.name, guide.title);
      assert.equal(node.description, guide.summary);
      assert.ok(Date.parse(node.datePublished) < Date.parse(BANPONG_LUSHAN_MODIFIED));
    }
    const last = graph.find(node => node['@type'] === 'BreadcrumbList').itemListElement.at(-1);
    assert.equal(last.item?.name || last.name, guide.title);
  });
}

test('Ban Pong dates the Saturday claim and never upgrades the archive into current confirmation', async () => {
  const $ = load(await fs.readFile(`${BANPONG_SLUG}/index.html`, 'utf8'));
  const body = $('.ss-post-body').text();
  assert.equal($('#banpong-event-date').next().find('a').attr('href'), BANPONG_EVENT_URL);
  assert.match(body, /25 ก.พ.66/);
  assert.match(body, /2023년 2월 25일/);
  assert.match(body, /현재의 취소|오늘의 취소/);
  assert.match(body, /방문 주 개최 미확인/);
  assert.match(body, /영구 폐쇄됐다고 단정하지도 않습니다/);
  assert.match(body, /동적 시간표의 실제 열차 행과 특정 날짜 판매 결과를 확정하지 못했습니다/);
  assert.match(body, /이 사이트는 이 연락처에 문의를 발송하지 않았습니다/);
  assert.ok(!body.includes('매주 열립니다'));
});

test('Lushan separates stations, transport products, illustrative arithmetic and passport limits', async () => {
  const $ = load(await fs.readFile(`${LUSHAN_SLUG}/index.html`, 'utf8'));
  const body = $('.ss-post-body').text();
  const urls = $('.ss-post-body a').toArray().map(node => $(node).attr('href'));
  assert.ok(urls.includes(LUSHAN_ACCESS_URL));
  assert.ok(urls.includes(LUSHAN_TICKET_URL));
  assert.match(body, /庐山站 · 루산역/);
  assert.match(body, /九江站 · 주장역/);
  assert.match(body, /160 \+ 차량 90 = 250위안/);
  assert.match(body, /160 \+ 내부 차량 70 \+ 케이블카 120 = 350위안/);
  assert.equal(160 + 70 + 120 - (160 + 90), 100);
  assert.match(body, /현재 구매 가능한 패키지 견적이 아닙니다/);
  assert.match(body, /正街站.*동선 방향/);
  assert.match(body, /慧远路口站.*서선 방향/);
  assert.match(body, /한국 여권 이용자의 입력·발권·현장 확인 절차를 검증하지 못했습니다/);
  assert.match(body, /도로 차량이 자동으로 운영된다고 보장할 수도 없습니다/);
  assert.ok(!body.includes('리스크는 치안보다'));
  assert.ok(!body.includes('방식이 안전하다'));
});

test('homepage and existing navigation use new titles without changing images', async () => {
  const home = load(await fs.readFile('index.html', 'utf8'));
  assert.equal(home('#banpong-lushan-update').length, 1);
  assert.ok(home('.ss-home-updates').children().first().find('time').attr('datetime') >= '2026-10-16');
  for (const [guide, category] of [[BANPONG_LUSHAN_GUIDES[0], 'southeast-asia-travel'], [BANPONG_LUSHAN_GUIDES[1], 'asia-travel']]) {
    assert.equal(home(`.ss-region-list a[href="/${guide.slug}/"]`).closest('li').find('span').last().text(), guide.homeTeaser);
    const html = await fs.readFile(`${category}/index.html`, 'utf8');
    assert.ok(html.includes(guide.title));
    assert.ok(!html.includes(guide.previousTitle));
  }
  for (const guide of TUYHOA_KODAI_GUIDES) {
    const html = await fs.readFile(`${guide.slug}/index.html`, 'utf8');
    const $ = load(html);
    assert.equal($('meta[property="article:modified_time"]').attr('content'), TUYHOA_KODAI_MODIFIED);
  }
  const references = [
    [TUYHOA_KODAI_GUIDES[0].slug, BANPONG_LUSHAN_GUIDES[0]],
    ['honja-southeast-asia-safety', BANPONG_LUSHAN_GUIDES[0]],
    ['구경이-아니라-머무름에-가까웠던-시아누크빌-외곽', BANPONG_LUSHAN_GUIDES[0]],
    ['유명-관광지에서-느끼지-못한-편안함을-준-자이살메', BANPONG_LUSHAN_GUIDES[1]]
  ];
  for (const [slug, target] of references) {
    const html = await fs.readFile(`${slug}/index.html`, 'utf8');
    const $ = load(html);
    const linked = $('a[href]').filter((_, node) => $(node).attr('href').includes(target.slug) && $(node).find('.ti').length);
    assert.equal(linked.length, 1, slug);
    assert.equal(linked.find('.ti').text(), target.title);
    assert.equal(linked.find('img').length, 1);
    assert.ok(!html.includes(target.previousTitle));
  }
});

test('sitemaps use this batch date and preserve the prior batch date', async () => {
  const xml = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(xml('url').length, 18);
  for (const [guides, modified] of [[BANPONG_LUSHAN_GUIDES, BANPONG_LUSHAN_MODIFIED], [TUYHOA_KODAI_GUIDES, TUYHOA_KODAI_MODIFIED]]) {
    for (const guide of guides) {
      const item = xml('url').filter((_, node) => xml(node).find('loc').text() === `https://shootsense.com/${guide.slug}/`);
      assert.equal(item.length, 1);
      assert.equal(item.find('lastmod').text(), modified);
    }
  }
  const home = load(await fs.readFile('index.html', 'utf8'));
  assert.ok(Date.parse(home('meta[property="og:updated_time"]').attr('content')) >= Date.parse(BANPONG_LUSHAN_MODIFIED));
});
