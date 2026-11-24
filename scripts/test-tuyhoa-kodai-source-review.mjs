import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { TUYHOA_KODAI_GUIDES, TUYHOA_KODAI_MODIFIED, TUYHOA_SLUG, KODAI_SLUG } from './tuyhoa-kodai-content.mjs';
import { TUYHOA_KODAI_SOURCE_REVIEWS } from './finalize-tuyhoa-kodai-source-review.mjs';
import { REGIONAL_GUIDES, REGIONAL_MODIFIED } from './regional-access-content.mjs';
const read = async file => load(await fs.readFile(file, 'utf8'));

test('both guides expose five scoped references with one TOC and no superseded partial notice', async () => {
  assert.equal(TUYHOA_KODAI_SOURCE_REVIEWS.length, 2);
  for (const review of TUYHOA_KODAI_SOURCE_REVIEWS) {
    const page = await read(`${review.slug}/index.html`);
    const panel = page(`#ss-${review.id}-source-review`);
    const sources = review.groups.flatMap(group => group.links.map(([, href]) => href));
    assert.equal(new Set(sources).size, 5);
    assert.equal(panel.length, 1);
    assert.equal(panel.find('a').length, 5);
    assert.equal(panel.find('details[open]').length, 0);
    assert.deepEqual(new Set(page('.ss-post-body a[href^="https:"]').toArray().map(node => page(node).attr('href'))), new Set(sources));
    assert.equal(page('#ss-november-recheck').length, 0);
    assert.equal(page('.ss-toc').length, 1);
    assert.equal(page('.ss-post-body h2').length, 6);
    assert.equal(page('meta[property="article:modified_time"]').attr('content'), TUYHOA_KODAI_MODIFIED);
  }
});

test('Tuy Hoa midnight arithmetic preserves arrival and lodging dates without inventing transfer times', async () => {
  const body = (await read(`${TUYHOA_SLUG}/index.html`))('.ss-post-body').text();
  const minutes = 22 * 60 + 50 + 35 + 45;
  assert.equal(minutes, 24 * 60 + 10);
  assert.match(body, /22:50 \+ 00:35 \+ 00:45 = 다음 날 00:10/);
  assert.match(body, /35분·45분·00:00은 공항·역의 실제 소요나 특정 숙소 규정이 아닙니다/);
  assert.match(body, /예약을 다음 날 체크인으로 바꾸지도 않습니다/);
  assert.match(body, /예약한 숙박일의 늦은 입실로 처리되는지/);
});

test('rail payment and old policy periods do not masquerade as issued tickets or applicable current refunds', async () => {
  const body = (await read(`${TUYHOA_SLUG}/index.html`))('.ss-post-body').text();
  assert.match(body, /카드 승인 알림만으로 발권 완료라고 판단하지 않습니다/);
  assert.match(body, /2025년 설·2023년 적용 기간의 변경·환불 규정/);
  assert.match(body, /예전 비율·마감을 새 방문일에 적용하지 않습니다/);
  assert.match(body, /여권번호·예약코드를 공개 확인표나 이 사이트로 보내지 않습니다/);
});

test('IIA primary text, failed form and e-pass access, lead time and Sunday window stay distinct', async () => {
  const page = await read(`${KODAI_SLUG}/index.html`);
  const body = page('.ss-post-body').text();
  assert.match(body, /이번에는 IIA 방문 안내 원문을 읽었습니다/);
  assert.match(body, /Google 양식은 이 조회 환경에서 열지 못했습니다/);
  assert.match(body, /현재 쿼터·면제·마감·수수료를 제시하지 않습니다/);
  assert.equal((Date.UTC(2026, 11, 20) - Date.UTC(2026, 11, 5)) / 86400000, 15);
  assert.match(body, /12월 20일 방문.*15일을 빼면 12월 5일/);
  assert.equal(13 * 60 - (12 * 60 + 20), 40);
  assert.match(body, /13:00까지 40분/);
  assert.match(body, /13:50까지 머물 수 있다고 읽지 않습니다/);
  assert.match(body, /40분도 실제 허용 관람시간은 아니며/);
  assert.match(page('#ss-kodai-source-review').text(), /포털 조회 실패가 의무 폐지나 진입 허가를 뜻하지 않습니다/);
});

test('updated worksheets and sitemaps agree while earlier regional revisions remain independent', async () => {
  for (const [file, marker] of [['tuyhoa-arrival-coast.txt', '신청·결제 알림·발권 완료 상태'], ['kodai-transfer-visit.txt', '개인·단체 중 해당 신청 유형']]) {
    const sheet = await fs.readFile(`assets/${file}`, 'utf8');
    assert.match(sheet, /자료 검토: 2026-11-24/);
    assert.ok(sheet.includes(marker));
    assert.match(sheet, /비공개/);
    assert.match(sheet, /인증번호|결제 비밀번호/);
  }
  const home = await read('index.html');
  assert.equal(home('#ss-home-source-review #ss-home-tuyhoa-kodai-review a').length, 2);
  const homeModified = home('meta[property="og:updated_time"]').attr('content');
  assert.ok(Date.parse(homeModified) >= Date.parse(TUYHOA_KODAI_MODIFIED));
  const graph = JSON.parse(home('script.rank-math-schema').text())['@graph'];
  assert.ok(graph.filter(node => node.dateModified).every(node => node.dateModified === homeModified));
  const posts = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(posts('url').length, 18);
  for (const guide of TUYHOA_KODAI_GUIDES) assert.equal(posts('url').filter((_, node) => posts(node).find('loc').text() === `https://shootsense.com/${guide.slug}/`).find('lastmod').text(), TUYHOA_KODAI_MODIFIED);
  const pages = load(await fs.readFile('page-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(pages('url').filter((_, node) => pages(node).find('loc').text() === 'https://shootsense.com/').find('lastmod').text(), homeModified);
  for (const guide of REGIONAL_GUIDES) assert.equal((await read(`${guide.slug}/index.html`))('meta[property="article:modified_time"]').attr('content'), REGIONAL_MODIFIED);
});
