import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { PREDEPARTURE_GUIDES, PREDEPARTURE_MODIFIED } from './predeparture-content.mjs';

for (const guide of PREDEPARTURE_GUIDES) {
  test(`${guide.slug}: source, headings, worksheet and dates match the revision`, async () => {
    const $ = load(await fs.readFile(`${guide.slug}/index.html`, 'utf8'));
    assert.equal($('.ss-post-body').length, 1);
    assert.equal($('.ss-toc').length, 1);
    assert.equal($('h1').length, 1);
    assert.equal($('.ss-post.ss-predeparture-guide').length, 1);
    assert.equal($('link#ss-predeparture-style[href="/assets/predeparture-guides.css"]').length, 1);
    const headings = $('.ss-post-body h2').toArray().map(node => $(node).attr('id'));
    assert.equal(headings.length, new Set(headings).size);
    assert.ok(headings.every(Boolean));
    assert.deepEqual($('.ss-toc a').toArray().map(node => $(node).attr('href')), headings.map(id => `#${id}`));
    assert.ok($('.ss-toc a').toArray().every(node => !/^\d+\./.test($(node).text())));
    assert.equal($('.ss-post-body .ss-deepening, .ss-post-body .ss-faq').length, 0);
    const links = $('.ss-post-body a[href^="https:"]').toArray().map(node => new URL($(node).attr('href')));
    assert.ok(links.length >= 2);
    assert.ok(links.every(url => ['www.0404.go.kr', 'passport.go.kr', 'www.gov.uk', 'www.usfa.fema.gov'].includes(url.hostname)));
    const downloads = [...new Set($('.ss-post-body a[download]').toArray().map(node => $(node).attr('href')))];
    assert.equal(downloads.length, 1);
    const worksheet = await fs.readFile(`.${downloads[0]}`, 'utf8');
    assert.ok(worksheet.includes(`https://shootsense.com/${guide.slug}/`));
    assert.ok(worksheet.includes('2026-10-15'));
    assert.ok(!worksheet.includes('\ufffd'));
    assert.match(worksheet, /비공개|필요한 사람에게만/);
    assert.equal($('meta[property="article:modified_time"]').attr('content'), PREDEPARTURE_MODIFIED);
    const schema = JSON.parse($('script.rank-math-schema').text());
    for (const node of schema['@graph'].filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) {
      assert.equal(node.dateModified, PREDEPARTURE_MODIFIED);
      assert.equal(node.description, guide.summary);
      assert.ok(node.datePublished < PREDEPARTURE_MODIFIED);
    }
    assert.equal($('.ss-post-summary p').text(), guide.summary);
  });
}

test('urgent help precedes record-keeping and country-specific numbers stay distinct', async () => {
  const $ = load(await fs.readFile('honja-yeohaeng-emergency-response/index.html', 'utf8'));
  assert.match($('.ss-post-summary p').text(), /즉각적인 생명·신체 위험에는 현지 긴급서비스 요청이 먼저/);
  assert.match($('.ss-post-body > p').first().text(), /현지 긴급서비스/);
  assert.equal($('.ss-post-body a[href="tel:+82232100404"]').text(), '+82-2-3210-0404');
  assert.ok($('.ss-post-body a[href="https://passport.go.kr/home/kor/contents.do?menuPos=26"]').length);
  assert.match($('.ss-post-body').text(), /나중에 찾아도 사용할 수 없습니다/);
});

test('home log and post sitemap reflect exactly this batch without duplicate entries', async () => {
  const $ = load(await fs.readFile('index.html', 'utf8'));
  assert.equal($('#predeparture-update').length, 1);
  for (const guide of PREDEPARTURE_GUIDES) assert.ok($(`#predeparture-update a[href="/${guide.slug}/"]`).length);
  const xml = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  for (const guide of PREDEPARTURE_GUIDES) {
    const url = xml('url').filter((_, node) => xml(node).find('loc').text() === `https://shootsense.com/${guide.slug}/`);
    assert.equal(url.length, 1);
    assert.equal(url.find('lastmod').text(), PREDEPARTURE_MODIFIED);
  }
  assert.equal(xml('url').length, 18);
});
