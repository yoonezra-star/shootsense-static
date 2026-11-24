import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { REGIONAL_GUIDES, REGIONAL_MODIFIED, ARTA_SLUG, CIVITA_SLUG } from './regional-access-content.mjs';
import { REGIONAL_SOURCE_REVIEWS } from './finalize-regional-source-review.mjs';
import { SOCIAL_ACTIVITY_MODIFIED, SOCIAL_ACTIVITY_SLUG } from './social-activity-content.mjs';
const read = async file => load(await fs.readFile(file, 'utf8'));

test('both articles retain one TOC, six sections and six traceable sources with bounded verification', async () => {
  assert.equal(REGIONAL_SOURCE_REVIEWS.length, 2);
  for (const review of REGIONAL_SOURCE_REVIEWS) {
    const page = await read(`${review.slug}/index.html`);
    const panel = page(`#ss-${review.id}-source-review`);
    const sources = review.groups.flatMap(group => group.links.map(([, href]) => href));
    assert.equal(new Set(sources).size, 6);
    assert.equal(panel.length, 1);
    assert.equal(panel.find('a').length, 6);
    assert.deepEqual(panel.find('a').toArray().map(node => page(node).attr('href')), sources);
    assert.deepEqual(new Set(page('.ss-post-body a[href^="https:"]').toArray().map(node => page(node).attr('href'))), new Set(sources));
    assert.equal(panel.find('details[open]').length, 0);
    assert.equal(page('#ss-november-recheck').length, 0);
    assert.equal(page('.ss-toc').length, 1);
    assert.equal(page('.ss-post-body h2').length, 6);
    assert.equal(page('meta[property="article:modified_time"]').attr('content'), REGIONAL_MODIFIED);
  }
  const arta = await read(`${ARTA_SLUG}/index.html`);
  assert.match(arta('#ss-arta-source-review').text(), /공식 검색 색인/);
  assert.match(arta('.ss-post-body').text(), /색인 수집 시점과 현재 원문은 다를 수 있습니다/);
});

test('Arta hypothetical visit window subtracts travel preparation without inventing arrival data', async () => {
  const body = (await read(`${ARTA_SLUG}/index.html`))('.ss-post-body').text();
  assert.equal(14 * 60 - (10 * 60 + 20) - 40, 180);
  assert.equal(14 * 60 - (10 * 60 + 50) - 40, 150);
  assert.match(body, /14:00 − 10:20 − 00:40 = 3시간/);
  assert.match(body, /30분 늦어지는 같은 가정에서는 2시간 30분/);
  assert.match(body, /버스 소요시간·현지 보행 실측이 아니며/);
  assert.match(body, /박물관 안에서 보낼 수 있는 시간만을 뜻하지도 않습니다/);
});

test('Arta posted fees and general admission guidance cannot override closure or site-specific confirmation', async () => {
  const body = (await read(`${ARTA_SLUG}/index.html`))('.ss-post-body').text();
  assert.match(body, /계절별 입장료를 모두 10유로/);
  assert.match(body, /5유로는 성당 방문도 포함/);
  assert.match(body, /요금이 남아 있다는 사실은 공사 휴관이 끝났거나 표를 살 수 있다는 증거가 아닙니다/);
  assert.equal(15 * 60 + 30 - 20, 15 * 60 + 10);
  assert.match(body, /공통 방문 안내는 최종 입장을 폐관 20분 전/);
  assert.match(body, /15:10은 참고 계산이지 아르타의 방문일 확정 마감이 아닙니다/);
  assert.match(body, /실제 재개관을 확인하지 못했으므로/);
});

test('Civita keeps three ticket offices, distinct walking segments and dated support conditions separate', async () => {
  const page = await read(`${CIVITA_SLUG}/index.html`);
  const body = page('.ss-post-body').text();
  const offices = page('#civita-ticket-offices').nextAll('figure').first().find('tbody tr');
  assert.equal(offices.length, 3);
  assert.match(offices.last().text(), /Palazzo Alemanni.*겨울 09:00~17:00 \/ 여름 09:00~18:00/);
  assert.match(body, /도보 약 15분은 Battaglini에서 다리 입구까지의 접근 안내/);
  assert.match(body, /전체 왕복 소요시간으로 바꾸지 않습니다/);
  assert.match(body, /5유로 입장권이 원하는 모든 유료 관람을 포함하는지도.*따로 묻습니다/);
  assert.match(body, /이동 지원 글의 게시일은 2020-06-10/);
  assert.match(body, /임의로 24시간·3일 같은 마감을 만들지 않습니다/);
  assert.match(body, /날짜별 버스 검색·표 구매·지원 예약은 실행하지 않았으며/);
});

test('worksheets, homepage and sitemap match the batch while earlier article timestamps survive', async () => {
  for (const [file, marker] of [['arta-visit-check.txt', '15:10은 공통 안내를 적용한 참고 계산'], ['civita-access-check.txt', '이동 지원 안내 게시일 2020-06-10']]) {
    const sheet = await fs.readFile(`assets/${file}`, 'utf8');
    assert.match(sheet, /자료 검토: 2026-11-24/);
    assert.ok(sheet.includes(marker));
    assert.match(sheet, /비공개/);
  }
  const home = await read('index.html');
  assert.equal(home('#ss-home-source-review #ss-home-regional-review').length, 1);
  assert.equal(home('#ss-home-regional-review a').length, 2);
  assert.equal(home('meta[property="og:updated_time"]').attr('content'), REGIONAL_MODIFIED);
  const graph = JSON.parse(home('script.rank-math-schema').text())['@graph'];
  assert.ok(graph.filter(node => node.dateModified).every(node => node.dateModified === REGIONAL_MODIFIED));
  const map = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(map('url').length, 18);
  for (const guide of REGIONAL_GUIDES) assert.equal(map('url').filter((_, node) => map(node).find('loc').text() === `https://shootsense.com/${guide.slug}/`).find('lastmod').text(), REGIONAL_MODIFIED);
  const pageMap = load(await fs.readFile('page-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(pageMap('url').filter((_, node) => pageMap(node).find('loc').text() === 'https://shootsense.com/').find('lastmod').text(), REGIONAL_MODIFIED);
  assert.equal((await read(`${SOCIAL_ACTIVITY_SLUG}/index.html`))('meta[property="article:modified_time"]').attr('content'), SOCIAL_ACTIVITY_MODIFIED);
});
