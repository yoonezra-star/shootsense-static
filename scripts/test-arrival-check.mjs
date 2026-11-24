import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { calculateArrival, arrivalConditions, arrivalText, ARRIVAL_EXAMPLES } from '../assets/arrival-math.js';
import { ARRIVAL_ROUTE, ARRIVAL_TITLE, ARRIVAL_MODIFIED } from './arrival-check-content.mjs';
import { BOARD_MODIFIED } from './trip-board-content.mjs';
const direct = changes => ({ ...ARRIVAL_EXAMPLES.direct, ...changes });
const scheduled = changes => ({ ...ARRIVAL_EXAMPLES.scheduled, ...changes });
const read = async route => load(await fs.readFile(`.${route}index.html`, 'utf8'));

test('direct arrival adds airport and full transfer time, crossing midnight under delay', () => {
  const result = calculateArrival(direct());
  assert.ok(result.complete);
  assert.equal(result.latestArrivalTarget, '2026-12-10T21:30');
  assert.equal(result.hotelTarget, '2026-12-10T23:40');
  assert.deepEqual(result.scenarios.map(s => s.hotelArrival), ['2026-12-10T23:10', '2026-12-10T23:40', '2026-12-11T00:10']);
  assert.deepEqual(result.scenarios.map(s => s.hotelMargin), [30, 0, -30]);
  assert.equal(result.scenarios[2].hotelDeadlineOverrun, 10);
  assert.match(arrivalConditions(result.scenarios[2]).join(' '), /숙소 도착 마감 10분 초과/);
});
test('direct hotel buffer shortfall is different from reaching or exceeding the actual deadline', () => {
  const r = calculateArrival(direct({ arrival: '2026-12-10T21:40' })).scenarios[0];
  assert.equal(r.hotelMargin, -10);
  assert.equal(r.atOrAfterDeadline, false);
  assert.match(arrivalConditions(r).join(' '), /여유 10분 부족/);
  const edge = calculateArrival(direct({ arrival: '2026-12-10T21:50' })).scenarios[0];
  assert.equal(edge.hotelDeadlineOverrun, 0);
  assert.ok(edge.atOrAfterDeadline);
  assert.match(arrivalConditions(edge).join(' '), /마감 시각과 같음/);
});
test('scheduled arrival includes waiting once and never invents a replacement after missing the service', () => {
  const result = calculateArrival(scheduled());
  assert.equal(result.latestArrivalTarget, '2026-12-10T22:20');
  assert.equal(result.scenarios[0].boardingArrival, '2026-12-10T23:00');
  assert.equal(result.scenarios[0].hotelArrival, '2026-12-11T00:10');
  assert.equal(result.scenarios[0].boardingMargin, 20);
  assert.equal(result.scenarios[0].hotelMargin, 0);
  assert.equal(result.scenarios[1].boardingArrival, '2026-12-10T23:30');
  assert.equal(result.scenarios[1].hotelArrival, null);
  assert.equal(result.scenarios[2].hotelArrival, null);
  assert.equal(result.scenarios[1].hotelMargin, null);
  assert.match(arrivalConditions(result.scenarios[1]).join(' '), /숙소 도착 계산 보류/);
});
test('lost boarding buffer before service departure remains conditional, not a guaranteed missed train', () => {
  const result = calculateArrival(scheduled({ arrival: '2026-12-10T22:25' }));
  const s = result.scenarios[0];
  assert.equal(s.boardingMargin, -5);
  assert.equal(s.atOrAfterService, false);
  assert.equal(s.hotelArrival, '2026-12-11T00:10');
  assert.match(arrivalConditions(s).join(' '), /해당편 탑승 여부 미확정/);
});
test('a service arriving too late at the hotel cannot be fixed by arriving at the airport earlier', () => {
  const result = calculateArrival(scheduled({ arrival: '2026-12-10T20:00', deadline: '2026-12-11T00:00' }));
  assert.ok(result.scheduleHotelConflict);
  assert.equal(result.scenarios[0].hotelDeadlineOverrun, 10);
  assert.match(arrivalText(scheduled({ deadline: '2026-12-11T00:00' }), result), /숙소 도착 마감 10분 초과/);
});
test('required blanks stay unknown; explicit zero works; inactive mode fields do not corrupt results', () => {
  assert.equal(calculateArrival({}).complete, false);
  for (const key of ['arrival', 'deadline', 'airportMinutes', 'hotelBuffer', 'transferMinutes']) {
    const r = calculateArrival(direct({ [key]: '' }));
    assert.equal(r.complete, false, key);
    assert.equal(r.missing.length, 1);
    assert.deepEqual(r.scenarios, []);
  }
  for (const key of ['serviceDeparture', 'platformMinutes', 'boardingBuffer', 'onwardMinutes']) assert.equal(calculateArrival(scheduled({ [key]: '' })).complete, false, key);
  assert.ok(calculateArrival(direct({ airportMinutes: 0, transferMinutes: 0, hotelBuffer: 0 })).complete);
  assert.ok(calculateArrival(direct({ serviceDeparture: 'bad', platformMinutes: -1 })).complete);
  assert.ok(calculateArrival(scheduled({ transferMinutes: -1 })).complete);
});
test('invalid modes, numbers and calendar values are rejected instead of rounded or defaulted', () => {
  assert.throws(() => calculateArrival(direct({ mode: 'guess' })));
  for (const value of [-1, 1.5, 1441, Infinity, NaN, '1e2']) assert.throws(() => calculateArrival(direct({ airportMinutes: value })));
  for (const value of ['2026-02-29T10:00', '2026-12-10T24:00', '2026-12-10T10:00Z']) assert.throws(() => calculateArrival(direct({ arrival: value })));
});
test('year and leap-day boundaries remain Japan dates independently of host timezone', () => {
  const r = calculateArrival(direct({ arrival: '2026-12-31T23:00', deadline: '2027-01-01T03:00' }));
  assert.equal(r.scenarios[0].hotelArrival, '2027-01-01T01:10');
  assert.equal(r.zone, 'Asia/Tokyo');
  assert.equal(calculateArrival(direct({ arrival: '2028-02-29T23:00', deadline: '2028-03-01T03:00' })).scenarios[0].hotelArrival, '2028-03-01T01:10');
});
test('download contains active inputs and filled or explicitly pending results', () => {
  const a = direct();
  assert.match(arrivalText(a, calculateArrival(a), true), /가상 사례/);
  assert.match(arrivalText(a, calculateArrival(a)), /2026-12-11 00:10/);
  assert.match(arrivalText(a, calculateArrival(a)), /숙소 마감 전 확보할 여유: 20분/);
  assert.doesNotMatch(arrivalText(a, calculateArrival(a)), /승차 위치까지 이동·승차 준비/);
  assert.match(arrivalText({}, calculateArrival({})), /계산 보류/);
  assert.match(arrivalText(scheduled(), calculateArrival(scheduled())), /해당편 이후 대안 미확인/);
});
test('new tool has a truthful identity, blank inert fallback, local module and source scope', async () => {
  const $ = await read(ARRIVAL_ROUTE);
  assert.equal($('h1').length, 1);
  assert.equal($('h1').text(), ARRIVAL_TITLE);
  assert.equal($('link[rel="canonical"]').attr('href'), 'https://shootsense.com' + ARRIVAL_ROUTE);
  assert.equal($('meta[name="robots"]').attr('content'), 'index, follow');
  assert.equal($('#arrival-form input:not([type="radio"])[value]').length, 0);
  assert.equal($('#arrival-form input:not([disabled]), #arrival-form button:not([disabled])').length, 0);
  assert.equal($('#arrival-results[hidden], #arrival-scheduled-fields[hidden]').length, 2);
  assert.equal($('#ss-departure-check').length, 0);
  assert.equal($('#ss-arrival-check[type="module"]').attr('src'), '/assets/arrival-check.js');
  assert.equal($('.ss-source-note a[href^="https://"]').length, 3);
  assert.match($('noscript').html(), /tokyo-late-checkin/);
  assert.equal($('script[src*="googlesyndication"], ins.adsbygoogle').length, 0);
  const graph = JSON.parse($('script.rank-math-schema').text())['@graph'];
  assert.equal(graph[0].datePublished, ARRIVAL_MODIFIED);
  assert.equal(graph[0].dateModified, BOARD_MODIFIED);
  assert.equal(graph[1]['@type'], 'WebApplication');
});
test('home, existing tools, analysis, privacy and sitemap expose the new route without duplicates', async () => {
  const home = await read('/');
  assert.equal(home('#ss-home-arrival').attr('href'), ARRIVAL_ROUTE);
  for (const route of ['/analysis/tokyo-late-checkin/', '/tools/departure-check/']) {
    const $ = await read(route);
    assert.equal($('#ss-arrival-link').length, 1);
    assert.equal($('#ss-arrival-link a').attr('href'), ARRIVAL_ROUTE);
  }
  assert.equal((await read('/privacy-policy/'))('#arrival-input-privacy').length, 1);
  const map = load(await fs.readFile('page-sitemap.xml', 'utf8'), { xml: true });
  const item = map('url').filter((_, n) => map(n).find('loc').text() === 'https://shootsense.com' + ARRIVAL_ROUTE);
  assert.equal(item.length, 1);
  assert.equal(item.find('lastmod').text(), BOARD_MODIFIED);
  const source = await fs.readFile('assets/arrival-check.js', 'utf8');
  assert.ok(!/fetch\(|XMLHttpRequest|localStorage|sessionStorage|history\.|\.innerHTML\s*=/.test(source));
});
