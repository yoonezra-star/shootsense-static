import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { DINING_GUIDES, DINING_MODIFIED, DINING_SLUG, DINING_SOURCES } from './dining-content.mjs';
import { PREDEPARTURE_GUIDES, PREDEPARTURE_MODIFIED } from './predeparture-content.mjs';
import { BANPONG_LUSHAN_GUIDES, BANPONG_LUSHAN_MODIFIED } from './banpong-lushan-content.mjs';

const guide = DINING_GUIDES[0];
const read = async () => load(await fs.readFile(`${DINING_SLUG}/index.html`, 'utf8'));

test('dining article has six sections, one unnumbered-label TOC and a private worksheet', async () => {
  const $ = await read();
  assert.equal($('h1').length, 1);
  assert.equal($('h1').text(), guide.title);
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
  assert.ok(sheet.includes(`https://shootsense.com/${DINING_SLUG}/`));
  assert.match(sheet, /자료 검토: 2026-10-17/);
  assert.match(sheet, /비공개/);
  assert.match(sheet, /최종 청구액이나 입장 보장이 아닙니다/);
  assert.ok(!sheet.includes('\ufffd'));
});

test('people, portions and a branch-specific exception are not interchangeable', async () => {
  const $ = await read();
  const body = $('.ss-post-body').text();
  assert.match(body, /2名様以上 \/ 受付人数 2名様〜/);
  assert.match(body, /2人前より/);
  assert.match(body, /두 사람분 금액을 낸다고 인원·자격 조건이 자동 충족되는 것도 아닙니다/);
  assert.match(body, /해당 학생 행사에 대한 것입니다/);
  assert.match(body, /외국 학교의 증명서가 행사 자격으로 인정되는지도.*확인하지 않았습니다/);
  assert.match(body, /1인 주문 예외가 안내돼 있다는 사실과 해당 온라인 코스 예약이 1명으로 완료된다는 사실은 다릅니다/);
  assert.ok(!body.includes('혼밥 이용 난이도'));
});

test('Kozuki arithmetic is tax-inclusive, conditional and only a partial sum', async () => {
  const $ = await read();
  const body = $('.ss-post-body').text();
  assert.match(body, /1,848 × 2 \+ 550 × 1 = 4,246엔/);
  assert.match(body, /1,848 × 2 \+ 550 × 2 = 4,796엔/);
  assert.equal(1848 * 2 + 550, 4246);
  assert.equal(1848 * 2 + 550 * 2, 4796);
  assert.match(body, /게시된 두 항목만 합한 계산/);
  assert.match(body, /실제 1명 입장 허용·음료·추가 주문·다른 필수 비용/);
  assert.match(body, /이 글은 코즈키에 1명 입장이나 예외 주문을 문의하지 않았습니다/);
  assert.match(body, /이미 세금이 포함된 가격에 다시 세금을 더하지 않습니다/);
});

test('payment, last order, seating and ingredient information retain their limits', async () => {
  const $ = await read();
  const body = $('.ss-post-body').text();
  assert.match(body, /일부 예외 매장/);
  assert.match(body, /유니버설 시티워크 오사카점의 QR 결제를 PayPay로 한정/);
  assert.match(body, /일본어 결제 안내는 같은 지점에 PayPay·Alipay를 함께 표시/);
  assert.match(body, /자료의 갱신 순서와 당일 단말기 지원까지 검증한 것이 아니므로/);
  assert.match(body, /90분 이용에 마지막 주문 70분/);
  assert.match(body, /차이인 20분은 추가 주문이 가능한 시간이라는 뜻이 아니라/);
  assert.match(body, /착석 가능성도 보장하지 않는다고/);
  assert.match(body, /신청·결제를 진행하거나 당일 자리를 확보하지 않았습니다/);
  assert.match(body, /같은 시설에서 취급되는 항목을 다르게 표시/);
  assert.match(body, /알레르기 진단이나 섭취 가능 판정을 제공하지 않습니다/);
});

test('dining sources are official operator pages and metadata matches the visible article', async () => {
  const $ = await read();
  const external = $('.ss-post-body a[href^="https:"]').toArray().map(node => $(node).attr('href'));
  assert.deepEqual(new Set(external), new Set(Object.values(DINING_SOURCES)));
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) assert.equal($(selector).attr('content'), guide.title);
  assert.equal($('meta[property="article:modified_time"]').attr('content'), DINING_MODIFIED);
  const graph = JSON.parse($('script.rank-math-schema').text())['@graph'];
  assert.ok(!graph.some(node => node['@type'] === 'FAQPage'));
  for (const node of graph.filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) {
    assert.equal(node.name, guide.title);
    assert.equal(node.description, guide.summary);
    assert.equal(node.dateModified, DINING_MODIFIED);
    assert.ok(Date.parse(node.datePublished) < Date.parse(DINING_MODIFIED));
  }
  const last = graph.find(node => node['@type'] === 'BreadcrumbList').itemListElement.at(-1);
  assert.equal(last.item?.name || last.name, guide.title);
});

test('home, category alt text, related titles and sitemap agree without redating earlier guides', async () => {
  const home = load(await fs.readFile('index.html', 'utf8'));
  assert.equal(home('#dining-update').length, 1);
  assert.equal(home('.ss-home-updates').children().first().attr('id'), 'dining-update');
  const categoryHtml = await fs.readFile('travel-tips/index.html', 'utf8');
  const category = load(categoryHtml);
  assert.ok(categoryHtml.includes(guide.title));
  assert.ok(!categoryHtml.includes(guide.previousTitle));
  const cover = category('a[href]').filter((_, node) => category(node).attr('href').includes(DINING_SLUG)).find('img').first();
  assert.equal(cover.attr('alt'), guide.title);
  for (const slug of ['honja-yeohaeng-achim-routine', 'honja-yeohaeng-emergency-response', 'honja-yeohaeng-gamjeong-gwanri', 'honja-yeohaeng-junbi-gijun', 'honja-yeohaeng-junbimul-checklist']) {
    const html = await fs.readFile(`${slug}/index.html`, 'utf8');
    assert.ok(!html.includes(guide.previousTitle));
  }
  for (const [guides, modified] of [[PREDEPARTURE_GUIDES, PREDEPARTURE_MODIFIED], [BANPONG_LUSHAN_GUIDES, BANPONG_LUSHAN_MODIFIED]]) {
    for (const previous of guides) {
      const $ = load(await fs.readFile(`${previous.slug}/index.html`, 'utf8'));
      assert.equal($('meta[property="article:modified_time"]').attr('content'), modified);
    }
  }
  const xml = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(xml('url').length, 18);
  const item = xml('url').filter((_, node) => xml(node).find('loc').text() === `https://shootsense.com/${DINING_SLUG}/`);
  assert.equal(item.length, 1);
  assert.equal(item.find('lastmod').text(), DINING_MODIFIED);
  assert.ok(Date.parse(home('meta[property="og:updated_time"]').attr('content')) >= Date.parse(DINING_MODIFIED));
});
