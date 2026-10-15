import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { ARTA_SLUG, CIVITA_SLUG, ARTA_BUS_ROWS, REGIONAL_GUIDES, REGIONAL_MODIFIED } from './regional-access-content.mjs';
import { PREDEPARTURE_GUIDES, PREDEPARTURE_MODIFIED } from './predeparture-content.mjs';

for (const guide of REGIONAL_GUIDES) {
  test(`${guide.slug}: one readable article, one TOC, source links and local worksheet`, async () => {
    const $ = load(await fs.readFile(`${guide.slug}/index.html`, 'utf8'));
    assert.equal($('.ss-post.ss-regional-guide').length, 1);
    assert.equal($('h1').length, 1);
    assert.equal($('.ss-toc').length, 1);
    assert.equal($('link#ss-regional-style[href="/assets/regional-guides.css"]').length, 1);
    const headings = $('.ss-post-body h2').toArray().map(node => $(node).attr('id'));
    assert.ok(headings.every(Boolean));
    assert.equal(new Set(headings).size, headings.length);
    assert.deepEqual($('.ss-toc a').toArray().map(node => $(node).attr('href')), headings.map(id => `#${id}`));
    assert.ok($('.ss-toc a').toArray().every(node => !/^\d+\./.test($(node).text())));
    assert.equal($('.ss-post-summary p').text(), guide.summary);
    assert.equal($('.ss-post-body .ss-faq, .ss-post-body .ss-deepening').length, 0);
    const downloads = [...new Set($('.ss-post-body a[download]').toArray().map(node => $(node).attr('href')))];
    assert.equal(downloads.length, 1);
    const worksheet = await fs.readFile(`.${downloads[0]}`, 'utf8');
    assert.ok(worksheet.includes(`https://shootsense.com/${guide.slug}/`));
    assert.match(worksheet, /자료 검토: 2026-10-15/);
    assert.match(worksheet, /비공개/);
    assert.ok(!worksheet.includes('\ufffd'));
    const sources = $('.ss-post-body a[href^="https:"]').toArray().map(node => new URL($(node).attr('href')));
    assert.ok(sources.length >= 3);
    const allowed = ['www.ktelartas.gr', 'efaart.gr', 'archaeologicalmuseums.culture.gov.gr', 'www.comune.bagnoregio.vt.it', 'www.italia.it', 'www.casacivitabagnoregio.it', 'cotralspa.it'];
    assert.ok(sources.every(url => allowed.includes(url.hostname)));
    assert.equal($('meta[property="article:modified_time"]').attr('content'), REGIONAL_MODIFIED);
    const schema = JSON.parse($('script.rank-math-schema').text());
    for (const node of schema['@graph'].filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) {
      assert.equal(node.dateModified, REGIONAL_MODIFIED);
      assert.equal(node.description, guide.summary);
      assert.ok(Date.parse(node.datePublished) < Date.parse(REGIONAL_MODIFIED));
    }
  });
}

test('Arta departure table preserves direction and weekday distinctions', async () => {
  const $ = load(await fs.readFile(`${ARTA_SLUG}/index.html`, 'utf8'));
  const table = $('#arta-weekday-buses').nextAll('figure').first().find('table');
  assert.deepEqual(table.find('tbody tr').toArray().map(row => $(row).find('td').toArray().map(cell => $(cell).text())), ARTA_BUS_ROWS);
  assert.deepEqual(table.find('th').toArray().map(node => $(node).text()), ['요일', '이오아니나 → 아르타 출발', '아르타 → 이오아니나 출발']);
  assert.match($('.ss-post-body').text(), /도착 시각이 미확인이면 관람시간도 미확정/);
  assert.ok($('#arta-window-example').nextAll('blockquote').first().text().includes('실제 아르타 도착 시각'));
});

test('Arta closure notice is separate from seasonal museum information', async () => {
  const $ = load(await fs.readFile(`${ARTA_SLUG}/index.html`, 'utf8'));
  assert.ok($('.ss-post-body a[href="https://efaart.gr/conference-event/parigoritissa_2026_2/"]').length);
  assert.match($('.ss-post-body').text(), /2026-02-02/);
  assert.match($('.ss-post-body').text(), /실제 재개관을 확인하지 못했으므로/);
  assert.equal($('.ss-post-body a[href="tel:+302681024636"]').text(), '+30 26810 24636');
  assert.ok(!$('.ss-post-body').text().includes('28610 28692'));
});

test('Civita separates paid entry, accommodation exemption and assisted access', async () => {
  const $ = load(await fs.readFile(`${CIVITA_SLUG}/index.html`, 'utf8'));
  assert.match($('.ss-post-body').text(), /기본 입장료를 5유로/);
  assert.match($('.ss-post-body').text(), /금~일 10:00~16:00/);
  assert.match($('.ss-post-body').text(), /겨울 08:00~19:00 \/ 여름 08:00~20:00/);
  assert.match($('.ss-post-body').text(), /내부 B&B·휴가용 숙소 고객/);
  assert.ok($('.ss-post-body a[href*="disabilita-motoria"]').length);
  assert.ok($('.ss-post-body a[href="https://cotralspa.it/ricerca-orari/"]').length);
  assert.match($('.ss-post-body').text(), /특정 방문일의 정류장별 왕복편을 확정하지 않았습니다/);
});

test('homepage and sitemap keep both batches and only update the revised regional posts', async () => {
  const $ = load(await fs.readFile('index.html', 'utf8'));
  assert.equal($('#regional-access-update').length, 1);
  assert.equal($('#predeparture-update').length, 1);
  assert.equal($('meta[property="og:updated_time"]').attr('content'), REGIONAL_MODIFIED);
  const xml = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(xml('url').length, 18);
  for (const guide of REGIONAL_GUIDES) {
    const url = xml('url').filter((_, node) => xml(node).find('loc').text() === `https://shootsense.com/${guide.slug}/`);
    assert.equal(url.length, 1);
    assert.equal(url.find('lastmod').text(), REGIONAL_MODIFIED);
  }
  for (const guide of PREDEPARTURE_GUIDES) {
    const article = load(await fs.readFile(`${guide.slug}/index.html`, 'utf8'));
    assert.equal(article('meta[property="article:modified_time"]').attr('content'), PREDEPARTURE_MODIFIED);
  }
});
