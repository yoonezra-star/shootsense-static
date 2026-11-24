import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { emptyBoard, exampleBoard, boardOverview, boardText, normalizeToolRecord, normalizeBoard, parseBoardFile, MAX_BOARD_BYTES } from '../assets/trip-board-model.js';
import { BOARD_ROUTE, BOARD_MODIFIED } from './trip-board-content.mjs';
const read = async route => load(await fs.readFile(`.${route}index.html`, 'utf8'));

test('new board has no invented inputs, selected hotel, completion or linkage', () => {
  const view = boardOverview(emptyBoard());
  assert.equal(view.readyCount, 0);
  assert.equal(view.chosen, undefined);
  assert.equal(view.relation, 'not-linked');
  assert.equal(view.hasExample, false);
  assert.ok(Object.values(view.reviews).every(review => review.result === null));
  assert.match(boardText(emptyBoard()), /미계산/);
});
test('three demo calculations reuse existing engines without becoming reservations or selecting the cheaper hotel', () => {
  const board = exampleBoard();
  const view = boardOverview(board);
  assert.equal(view.readyCount, 3);
  assert.equal(view.hasExample, true);
  assert.equal(view.chosen, undefined);
  assert.deepEqual(view.reviews.stay.result.stays.map(s => s.total), [233600, 232600]);
  assert.equal(view.reviews.arrival.result.scenarios[0].hotelArrival, '2026-12-10T23:10');
  assert.equal(view.reviews.departure.result.times.leaveBy, '2026-12-12T14:10');
  assert.match(boardText(board), /실제|예약 확정 평가가 아닙니다/);
});
test('dirty and errored records cannot keep their previous computed results in the summary', () => {
  const board = exampleBoard();
  board.records.arrival.state = 'dirty';
  const view = boardOverview(board);
  assert.equal(view.readyCount, 2);
  assert.equal(view.reviews.arrival.result, null);
  assert.equal(view.reviews.arrival.status, 'dirty');
  board.records.departure.state = 'error';
  assert.equal(boardOverview(board).reviews.departure.result, null);
});
test('unknown input, invalid values and missing optional costs remain distinct from a confirmed zero', () => {
  const board = exampleBoard();
  board.context.selectedStay = 'a';
  board.records.stay.inputs[0].transport = '';
  board.records.arrival.inputs.airportMinutes = '';
  let view = boardOverview(board);
  assert.equal(view.reviews.arrival.status, 'pending');
  assert.ok(view.tasks.some(task => task.includes('교통비 미입력')));
  assert.ok(view.tasks.some(task => task.includes('취소 손실 미확인')));
  board.records.arrival.inputs.airportMinutes = '0';
  assert.equal(boardOverview(board).reviews.arrival.status, 'ready');
  board.records.arrival.inputs.airportMinutes = '-1';
  assert.equal(boardOverview(board).reviews.arrival.status, 'error');
});
test('linkage requires all three current calculations, a chosen candidate and explicit same-trip context', () => {
  const board = exampleBoard();
  board.context.selectedStay = 'a';
  assert.equal(boardOverview(board).relation, 'not-linked');
  board.context.sameTrip = true;
  assert.equal(boardOverview(board).relation, 'ordered');
  board.records.departure.state = 'dirty';
  assert.equal(boardOverview(board).relation, 'not-linked');
});
test('reversed Japan dates are flagged only after the user links the same journey', () => {
  const board = exampleBoard();
  board.context.selectedStay = 'b';
  board.records.departure.inputs.departure = '2026-12-10T16:00';
  board.records.departure.inputs.pickupDeadline = '2026-12-10T20:00';
  assert.equal(boardOverview(board).relation, 'not-linked');
  board.context.sameTrip = true;
  assert.equal(boardOverview(board).relation, 'conflict');
  assert.match(boardText(board), /날짜 순서: 충돌/);
});
test('a missed arrival service blocks date comparison rather than creating a replacement arrival', () => {
  const board = exampleBoard();
  board.context.selectedStay = 'a'; board.context.sameTrip = true;
  board.records.arrival.inputs = { mode: 'scheduled', arrival: '2026-12-10T23:00', deadline: '2026-12-11T02:00', airportMinutes: 60, hotelBuffer: 20, platformMinutes: 20, boardingBuffer: 10, serviceDeparture: '2026-12-10T23:30', onwardMinutes: 40 };
  const view = boardOverview(board);
  assert.equal(view.relation, 'blocked');
  assert.equal(view.reviews.arrival.result.scenarios[0].hotelArrival, null);
});
test('file restores raw inputs, preserves example labels and recalculates instead of trusting supplied totals', () => {
  const board = exampleBoard();
  board.context.selectedStay = 'b'; board.context.sameTrip = true;
  board.records.stay.result = { total: 1 };
  const restored = parseBoardFile('\uFEFF' + JSON.stringify(board));
  assert.equal(restored.context.sameTrip, false);
  assert.equal(restored.records.stay.example, true);
  assert.equal(restored.records.stay.result, undefined);
  assert.equal(boardOverview(restored).reviews.stay.result.stays[1].total, 232600);
});
test('file schema, byte limit, field types, status and confirmation flags are validated', () => {
  for (const value of ['{', '[]', '{}', JSON.stringify({ format: 'shootsense-trip-board', version: 2 }), ' '.repeat(MAX_BOARD_BYTES + 1)]) assert.throws(() => parseBoardFile(value));
  assert.throws(() => normalizeToolRecord('stay', false));
  assert.throws(() => normalizeToolRecord('other'));
  assert.throws(() => normalizeToolRecord('stay', { state: 'calculated', inputs: [{ feesConfirmed: 'true' }, {}] }));
  assert.throws(() => normalizeToolRecord('arrival', { state: 'unknown', inputs: {} }));
  assert.throws(() => normalizeToolRecord('arrival', { state: 'dirty', inputs: { mode: 'auto' } }));
  assert.throws(() => normalizeToolRecord('departure', { state: 'dirty', inputs: { departure: { url: 'bad' } } }));
  const board = emptyBoard(); board.context.name = 'a'.repeat(61);
  assert.throws(() => normalizeBoard(board));
});
test('unrecognized JSON keys cannot pollute prototypes or add URLs and calculated results', () => {
  const raw = JSON.parse(JSON.stringify(exampleBoard()));
  raw.records.arrival.inputs.__proto__ = { polluted: true };
  raw.records.arrival.inputs.destinationUrl = 'https://example.com';
  raw.records.arrival.result = { hotelArrival: 'fake' };
  const clean = normalizeBoard(raw);
  assert.equal(clean.records.arrival.inputs.destinationUrl, undefined);
  assert.equal(clean.records.arrival.result, undefined);
  assert.equal({}.polluted, undefined);
});
test('board is indexed once with native fallback links, disabled controls and no automatic frame navigation', async () => {
  const $ = await read(BOARD_ROUTE);
  assert.equal($('h1').length, 1);
  assert.equal($('link[rel="canonical"]').attr('href'), 'https://shootsense.com' + BOARD_ROUTE);
  assert.equal($('meta[name="robots"]').attr('content'), 'index, follow');
  assert.equal($('[role="tab"]').length, 4);
  assert.equal($('[role="tab"][aria-selected="true"]').attr('id'), 'board-tab-summary');
  assert.equal($('iframe[data-board-tool]').length, 3);
  assert.equal($('iframe[src]').length, 0);
  assert.equal($('iframe[data-src$="?embed=trip-board"]').length, 3);
  assert.equal($('.ss-trip-board button:not([disabled])').length, 0);
  assert.match($('noscript').html(), /개별 도구/);
  assert.equal($('script[src*="googlesyndication"], ins.adsbygoogle').length, 0);
  const graph = JSON.parse($('script.rank-math-schema').text())['@graph'];
  assert.equal(graph[0].datePublished, BOARD_MODIFIED);
  assert.equal(graph[1]['@type'], 'WebApplication');
});
test('main, three tools, privacy and sitemap expose board once without changing publication dates', async () => {
  assert.equal((await read('/'))('#ss-home-board a').attr('href'), BOARD_ROUTE);
  for (const route of ['/tools/stay-compare/', '/tools/arrival-check/', '/tools/departure-check/']) assert.equal((await read(route))('#ss-board-link a').attr('href'), BOARD_ROUTE);
  assert.equal((await read('/privacy-policy/'))('#trip-board-privacy').length, 1);
  const map = load(await fs.readFile('page-sitemap.xml', 'utf8'), { xml: true });
  const item = map('url').filter((_, node) => map(node).find('loc').text() === 'https://shootsense.com' + BOARD_ROUTE);
  assert.equal(item.length, 1);
  assert.equal(item.find('lastmod').text(), BOARD_MODIFIED);
});
test('board uses no upload API, URL inputs or browser storage and message bridge checks both sender and origin', async () => {
  const source = await fs.readFile('assets/trip-board.js', 'utf8');
  const bridge = await fs.readFile('assets/tool-board-bridge.js', 'utf8');
  assert.ok(!/fetch\(|XMLHttpRequest|localStorage|sessionStorage|history\.|\.innerHTML\s*=/.test(source + bridge));
  assert.match(source, /event\.origin !== location\.origin/);
  assert.match(source, /event\.source !== frames\[data\.tool\]\.contentWindow/);
  assert.match(bridge, /event\.source !== window\.parent/);
  assert.ok(!/postMessage\([^;]+['"]\*['"]/.test(source + bridge));
});
