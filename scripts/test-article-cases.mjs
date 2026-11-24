import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { ARTICLE_CASES, readArticleCase, STAY_PRICE_EXAMPLE } from '../assets/article-cases.js';
import { compareStays } from '../assets/stay-math.js';
import { calculateDeparture } from '../assets/departure-math.js';
import { calculateArrival } from '../assets/arrival-math.js';
import { CASE_EXPLANATIONS, CASE_LINKED_DATE } from './build-article-cases.mjs';

test('article cases accept only known case ids for the matching tool', () => {
  assert.equal(Object.keys(ARTICLE_CASES).length, 3);
  for (const [id, entry] of Object.entries(ARTICLE_CASES)) {
    assert.equal(readArticleCase(`#case=${id}`, entry.tool), entry);
    assert.equal(readArticleCase(`#case=${id}`, 'wrong-tool'), null);
  }
  for (const hash of ['', '#case=__proto__', '#case=constructor', '#case=<script>', '#case=unknown']) assert.equal(readArticleCase(hash, 'stay'), null);
});

test('stay article reproduces price reversal without adding cancellation loss', () => {
  const result = compareStays(STAY_PRICE_EXAMPLE);
  assert.deepEqual(result.stays.map(stay => stay.total), [108000, 95000]);
  assert.equal(result.difference, 13000);
  assert.equal(result.lowerCostId, 'b');
  assert.equal(result.stays[0].cancellation, 90000);
  assert.deepEqual(result.stays[0].flags, ['도착 시각 체크인 미확인']);
  assert.match(CASE_EXPLANATIONS['stay-price'].result, /13,000원/);
});

test('arrival article cannot invent a hotel arrival after the specified service is missed', () => {
  const result = calculateArrival(ARTICLE_CASES['arrival-last-service'].inputs);
  assert.equal(result.complete, true);
  assert.equal(result.latestArrivalTarget, '2026-12-10T21:00');
  assert.equal(result.scenarios[0].boardingArrival, '2026-12-10T22:40');
  for (const scenario of result.scenarios) {
    assert.equal(scenario.atOrAfterService, true);
    assert.equal(scenario.hotelArrival, null);
  }
  assert.match(CASE_EXPLANATIONS['arrival-last-service'].change, /표준 시간이 아닙니다/);
});

test('departure article separates storage cutoff failure from train boarding margin', () => {
  const result = calculateDeparture(ARTICLE_CASES['departure-early-storage'].inputs);
  assert.equal(result.complete, true);
  assert.equal(result.binding, 'storage');
  assert.equal(result.times.leaveBy, '2026-12-12T13:35');
  assert.equal(result.scenarios[0].pickupComplete, '2026-12-12T14:55');
  assert.equal(result.scenarios[0].atPlatform, '2026-12-12T15:30');
  assert.equal(result.scenarios[0].pickupOverrun, 25);
  assert.equal(result.scenarios[0].bufferShortfall, 0);
});

test('article examples preserve single source TOC and use isolated fixed-id links', async () => {
  for (const [id, entry] of Object.entries(ARTICLE_CASES)) {
    const page = load(await fs.readFile(`.${entry.article}index.html`, 'utf8'));
    const example = page('#ss-case-walkthrough');
    assert.equal(example.length, 1);
    assert.equal(page('.ss-post-body #ss-case-walkthrough, .ss-toc #ss-case-walkthrough').length, 0);
    assert.equal(page('.ss-post-body h2').length, 6);
    assert.equal(page('.ss-toc').length, 1);
    assert.equal(example.next().attr('id'), 'ss-related-tools');
    assert.equal(page('#ss-case-title').length, 1);
    assert.match(example.text(), /실제 방문·가격 조사·예약·운영자 회신이 아닙니다/);
    assert.ok(example.text().includes(CASE_LINKED_DATE));
    assert.match(example.text(), /본문의 자료 확인일과 별개/);
    assert.equal(example.find('a').attr('href'), `${entry.route}#case=${id}`);
    assert.equal(example.find('a').attr('target'), '_blank');
    assert.equal(example.find('a').attr('rel'), 'noopener');
    assert.equal(page('link#ss-article-cases-style').length, 1);
  }
});

test('case selection carries no private input, network or persistent browser storage', async () => {
  const source = await fs.readFile('assets/article-cases.js', 'utf8');
  assert.ok(!/fetch\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon|location\.search/.test(source));
  assert.match(source, /location\.hash/);
  assert.match(source, /눌렀을 때만 적용/);
  for (const file of ['stay-compare', 'arrival-check', 'departure-check']) {
    const script = await fs.readFile(`assets/${file}.js`, 'utf8');
    assert.match(script, /mountArticleCase/);
    assert.ok(!script.includes("dispatchEvent(new Event('submit'"));
  }
});
