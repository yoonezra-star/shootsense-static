import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { calculateDeparture, DEPARTURE_EXAMPLE, departureText, parsePlannerTime, plannerMinutes } from '../assets/departure-math.js';
import { LAB_MODIFIED, PLANNER_ROUTE, LATE_PAGE, STORAGE_PAGE } from './trip-lab-content.mjs';
import { ARRIVAL_MODIFIED } from './arrival-check-content.mjs';
const example = changes => ({ ...DEPARTURE_EXAMPLE, ...changes });
const read = async route => load(await fs.readFile(`.${route}index.html`, 'utf8'));

test('reverse calculation respects every duration and distinguishes buffer loss from departure overrun', () => {
  const result = calculateDeparture(example());
  assert.equal(result.binding, 'departure');
  assert.equal(result.times.leaveBy, '2026-12-12T14:10');
  assert.equal(result.times.pickupComplete, '2026-12-12T15:05');
  assert.equal(result.times.platformArrival, '2026-12-12T15:40');
  assert.deepEqual(result.scenarios.map(s => s.slack), [10, -10, -30]);
  assert.deepEqual(result.scenarios.map(s => s.bufferShortfall), [0, 10, 30]);
  assert.deepEqual(result.scenarios.map(s => s.departureOverrun), [0, 0, 10]);
  assert.deepEqual(result.scenarios.map(s => s.atOrAfterDeparture), [false, false, true]);
});
test('early storage deadline binds even when the train buffer remains intact', () => {
  const result = calculateDeparture(example({ pickupDeadline: '2026-12-12T14:30' }));
  assert.equal(result.binding, 'storage');
  assert.equal(result.times.leaveBy, '2026-12-12T13:35');
  assert.equal(result.scenarios[0].pickupOverrun, 25);
  assert.equal(result.scenarios[0].bufferShortfall, 0);
  assert.equal(calculateDeparture(example({ pickupDeadline: '2026-12-12T15:05' })).binding, 'both');
});
test('blank required values remain unknown while explicit zero is a real input', () => {
  assert.equal(calculateDeparture({}).complete, false);
  for (const field of ['departure', 'pickupDeadline', 'toStorage', 'pickupMinutes', 'toPlatform', 'boardingBuffer', 'reserve']) {
    const result = calculateDeparture(example({ [field]: '' }));
    assert.equal(result.complete, false, field);
    assert.equal(result.missing.length, 1, field);
    assert.equal(result.times, null);
  }
  assert.equal(plannerMinutes('', 'test'), null);
  assert.equal(plannerMinutes(0, 'test'), 0);
  const zero = calculateDeparture(example({ toStorage: 0, pickupMinutes: 0, toPlatform: 0, boardingBuffer: 0, reserve: 0 }));
  assert.equal(zero.times.leaveBy, DEPARTURE_EXAMPLE.departure);
  const missingPlan = calculateDeparture(example({ plannedLeave: '' }));
  assert.ok(missingPlan.complete);
  assert.ok(missingPlan.plannedLeaveMissing);
  assert.deepEqual(missingPlan.scenarios, []);
});
test('Japan dates cross midnight, year boundaries and leap days without host timezone dependence', () => {
  const r = calculateDeparture(example({ departure: '2027-01-01T00:15', pickupDeadline: '2027-01-01T01:00', plannedLeave: '' }));
  assert.equal(r.times.leaveBy, '2026-12-31T22:25');
  assert.equal(r.zone, 'Asia/Tokyo');
  assert.equal(parsePlannerTime('2028-02-29T00:00', 'test').zoneName, 'Asia/Tokyo');
  for (const value of ['2026-02-29T00:00', '2026-12-12T24:00', '2026-11-31T10:00', '2026-12-12T10:00Z', 'bad']) assert.throws(() => parsePlannerTime(value, 'test'));
});
test('invalid numeric values never silently clamp, round or become zero', () => {
  for (const value of [-1, 1.5, 1441, Infinity, NaN, '1e2', '1<script>']) assert.throws(() => plannerMinutes(value, 'test'));
  assert.equal(plannerMinutes(1440, 'test'), 1440);
});
test('exports contain filled values and pending confirmations rather than a blank worksheet', () => {
  const input = example();
  const text = departureText(input, calculateDeparture(input), true);
  assert.match(text, /가상 사례/);
  assert.match(text, /2026-12-12 14:10/);
  assert.match(text, /관광 종료 40분 지연/);
  assert.match(text, /승차 전 확보할 여유: 20분/);
  assert.match(departureText({}, calculateDeparture({})), /계산 보류/);
});
test('three new pages have unique identity, complete fallback content, sources and an honest schema', async () => {
  for (const page of [{ route: PLANNER_ROUTE, title: '출발일 일정 검토기' }, LATE_PAGE, STORAGE_PAGE]) {
    const $ = await read(page.route);
    assert.equal($('h1').length, 1);
    assert.equal($('h1').text(), page.title);
    assert.equal($('link[rel="canonical"]').attr('href'), 'https://shootsense.com' + page.route);
    assert.equal($('meta[name="robots"]').attr('content'), 'index, follow');
    assert.equal($('script[src*="googlesyndication"], ins.adsbygoogle').length, 0);
    assert.equal($('link#ss-trip-lab-style').length, 1);
    assert.ok($('.ss-source-note a[href^="https://"]').length);
    assert.ok(!$('.entry-content').text().includes('현장 방문 확인 완료'));
    for (const link of $('.ss-toc a').toArray()) assert.equal($('[id]').filter((_, n) => $(n).attr('id') === $(link).attr('href').slice(1)).length, 1);
    const graph = JSON.parse($('script.rank-math-schema').text())['@graph'];
    assert.equal(graph[0].datePublished, LAB_MODIFIED);
    assert.equal(graph[0].dateModified, page.route === STORAGE_PAGE.route ? LAB_MODIFIED : ARRIVAL_MODIFIED);
  }
});
test('calculator starts blank and input values are not stored or sent by application code', async () => {
  const $ = await read(PLANNER_ROUTE);
  assert.equal($('#departure-form input[value]').length, 0);
  assert.equal($('#departure-results[hidden]').length, 1);
  assert.equal($('#departure-form input[type="datetime-local"]').length, 3);
  assert.equal($('#departure-form input[type="number"]').length, 5);
  assert.equal($('#departure-form input:not([disabled]), #departure-form button:not([disabled])').length, 0);
  assert.match($('noscript').html(), /morning-backward-clock/);
  const source = await fs.readFile('assets/departure-check.js', 'utf8');
  assert.ok(!/fetch\(|XMLHttpRequest|localStorage|sessionStorage|history\.|\.innerHTML\s*=/.test(source));
  assert.equal((await read('/privacy-policy/'))('#departure-input-privacy').length, 1);
});
test('main flow exposes four roles, local tool and collapsed history once', async () => {
  const $ = await read('/');
  assert.equal($('.ss-home-intro + #ss-home-lab').length, 1);
  assert.equal($('#ss-home-lab .ss-guide-list > li').length, 4);
  assert.equal($('details.ss-home-history:not([open]) .ss-home-updates').length, 1);
  for (const route of ['/analysis/tokyo-stay-cost/', '/honja-yeohaeng-achim-routine/']) assert.equal((await read(route))('#ss-trip-lab-links').length, 1);
});
