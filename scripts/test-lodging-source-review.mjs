import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { LODGING_SLUG, LODGING_REVIEW_MODIFIED } from './finalize-lodging-source-review.mjs';
import { PREDEPARTURE_REVIEW_DATES } from './predeparture-content.mjs';
const read = async file => load(await fs.readFile(file, 'utf8'));

test('lodging guide retains six sections, one TOC and separates missing costs from zero and cancellation loss', async () => {
  const page = await read(`${LODGING_SLUG}/index.html`);
  assert.equal(page('.ss-post-body h2').length, 6);
  assert.equal(page('.ss-toc').length, 1);
  const body = page('.ss-post-body').text();
  for (const term of ['빈칸·미확인', '금액 차이와 저렴한 후보 판정을 보류', '손실액에는 취소를 가정한 시점', '지점·판매 채널 범위', '예약 유지가 승인됐다고 보지 않습니다', '일본 현지 날짜·시각']) assert.ok(body.includes(term), term);
  assert.equal(page('.ss-post-body a[href="/tools/reservation-deadlines/"]').length, 1);
  assert.equal(page('.ss-post-body a[href="/tools/arrival-check/"]').length, 1);
  assert.equal(page('.ss-post-body a[download]').attr('href'), '/assets/lodging-decision-sheet.txt');
  assert.equal(page('.ss-toc a').length, 6);
});

test('article and tool expose dated official sources without presenting a historical survey as current booking terms', async () => {
  for (const [file, id] of [[`${LODGING_SLUG}/index.html`, 'ss-lodging-source-review'], ['tools/stay-compare/index.html', 'ss-lodging-tool-sources']]) {
    const page = await read(file); const panel = page(`#${id}`);
    assert.equal(panel.length, 1);
    assert.equal(panel.find('a').length, 2);
    assert.equal(panel.find('li').length, 2);
    assert.equal(panel.find('details[open]').length, 0);
    assert.match(panel.text(), /2023-08-10/);
    assert.match(panel.text(), /현재 모든 플랫폼/);
    assert.match(panel.text(), /다른 숙소에 일반화하지 않습니다/);
  }
});

test('all ten cost inputs start blank and the method states partial-sum limitations', async () => {
  const page = await read('tools/stay-compare/index.html');
  const money = page('#stay-compare-form input[type="number"]');
  assert.equal(money.length, 10);
  for (const node of money.toArray()) assert.equal(page(node).attr('value'), undefined);
  assert.equal(page('#ss-cost-completeness').length, 1);
  assert.match(page('#ss-cost-completeness').text(), /금액 차이·저렴한 후보 판정을 보류/);
  assert.equal(page('[data-field="feesConfirmed"][checked]').length, 0);
  assert.equal(page('[data-field="checkin"] option[selected]').length, 0);
});

test('private worksheet records units, source scope, cancellation moment and actual arrival date without requesting secrets', async () => {
  const sheet = await fs.readFile('assets/lodging-decision-sheet.txt', 'utf8');
  for (const term of ['양식 검토: 2026-11-24', '예약번호·카드정보·출입 코드를 적거나', '인당·박당·전체', '취소를 가정한 날짜·시각·시간대', '예약한 숙박일 / 실제 도착 현지 날짜', '단순 문의·취소 접수·취소 완료·환급 완료', '소계만 표시']) assert.ok(sheet.includes(term), term);
  assert.ok(!sheet.includes('\ufffd'));
});

test('only the lodging article, affected tools and home advance review dates while earlier reviews remain independent', async () => {
  for (const file of [`${LODGING_SLUG}/index.html`, 'tools/stay-compare/index.html', 'tools/trip-board/index.html']) {
    const page = await read(file);
    assert.equal(page('meta[property="og:updated_time"]').attr('content'), LODGING_REVIEW_MODIFIED);
    const graph = JSON.parse(page('script.rank-math-schema').text())['@graph'];
    for (const node of graph.filter(node => ['WebPage', 'BlogPosting', 'WebApplication'].includes(node['@type']))) assert.equal(node.dateModified, LODGING_REVIEW_MODIFIED);
  }
  for (const [slug, date] of Object.entries(PREDEPARTURE_REVIEW_DATES)) assert.equal((await read(`${slug}/index.html`))('meta[property="article:modified_time"]').attr('content'), date);
  assert.equal((await read('privacy-policy/index.html'))('meta[property="og:updated_time"]').attr('content'), '2026-11-24T13:06:00+09:00');
  const home = await read('index.html');
  assert.ok(Date.parse(home('meta[property="og:updated_time"]').attr('content')) >= Date.parse(LODGING_REVIEW_MODIFIED));
  assert.equal(home('#ss-home-lodging-review').length, 1);
  assert.equal(home('.ss-home-updates > li').first().attr('id'), 'november-recovery-update');
  const map = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(map('url').length, 18);
  assert.equal(map('url').filter((_, node) => map(node).find('loc').text() === `https://shootsense.com/${LODGING_SLUG}/`).find('lastmod').text(), LODGING_REVIEW_MODIFIED);
});
