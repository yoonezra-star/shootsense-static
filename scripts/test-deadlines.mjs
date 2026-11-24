import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { load } from 'cheerio';
import ICAL from '../assets/vendor/ical.js';
import { DateTime } from '../assets/vendor/luxon.js';
import { emptyDeadlineBook, normalizeDeadline, normalizeDeadlineBook, parseDeadlineBook, inspectDeadline, resolveDeadline, deadlineCalendar, deadlineText, exampleDeadlineBook, MAX_DEADLINE_BYTES } from '../assets/deadline-model.js';
import { DEADLINE_ROUTE, DEADLINE_MODIFIED } from './deadline-content.mjs';
import { updateSitemaps } from './lib/static-site-utils.mjs';
const now = DateTime.fromISO('2026-11-24T00:00:00Z');
const record = changes => normalizeDeadline({ id: 'test-reservation', label: '테스트 숙소', kind: 'cancellation', local: '2026-12-10T12:00', zone: 'Asia/Tokyo', offset: '', verified: true, progress: 'open', reminder: 0, note: '', example: false, revision: 0, ...changes });
const book = records => ({ ...emptyDeadlineBook(), records });
const read = async route => load(await fs.readFile(`.${route}index.html`, 'utf8'));

test('unknown source time, timezone and verification never become calendar-ready defaults', () => {
  for (const change of [{ local: '' }, { zone: '' }, { verified: false }]) assert.equal(inspectDeadline(record(change), 'Asia/Seoul', now).eligible, false);
  assert.equal(inspectDeadline(record({ zone: '' }), 'Asia/Seoul', now).converted, '변환 보류');
});
test('conversion crosses calendar dates while preserving the original local time and UTC offset', () => {
  const view = inspectDeadline(record(), 'America/New_York', now);
  assert.equal(view.original, '2026-12-10 12:00 UTC+09:00');
  assert.equal(view.converted, '2026-12-09 22:00 UTC-05:00');
  assert.equal(view.time.toUTC().toISO(), '2026-12-10T03:00:00.000Z');
});
test('half-hour and quarter-hour source zones are not rounded to whole-hour offsets', () => {
  assert.equal(inspectDeadline(record({ zone: 'Asia/Kolkata' }), 'Asia/Seoul', now).time.toUTC().toISO(), '2026-12-10T06:30:00.000Z');
  assert.equal(inspectDeadline(record({ zone: 'Asia/Kathmandu' }), 'Asia/Seoul', now).time.toUTC().toISO(), '2026-12-10T06:15:00.000Z');
});
test('fall-back ambiguous local time requires an explicit matching offset', () => {
  const ambiguous = record({ local: '2027-11-07T01:30', zone: 'America/New_York' });
  const pending = resolveDeadline(ambiguous);
  assert.equal(pending.valid, false);
  assert.deepEqual(pending.choices.map(choice => choice.offset), ['-240', '-300']);
  assert.equal(inspectDeadline(ambiguous, 'Asia/Seoul', now).eligible, false);
  const first = resolveDeadline({ ...ambiguous, offset: '-240' });
  const second = resolveDeadline({ ...ambiguous, offset: '-300' });
  assert.equal(first.time.toUTC().toISO(), '2027-11-07T05:30:00.000Z');
  assert.equal(second.time.toUTC().toISO(), '2027-11-07T06:30:00.000Z');
  assert.equal(resolveDeadline({ ...ambiguous, offset: '540' }).valid, false);
});
test('spring-forward missing local time is not silently shifted by the date library', () => {
  const missing = inspectDeadline(record({ local: '2027-03-14T02:30', zone: 'America/New_York' }), 'Asia/Seoul', now);
  assert.equal(missing.valid, false);
  assert.equal(missing.time, null);
  assert.match(missing.issue, /존재하지 않는/);
  assert.equal(missing.eligible, false);
});
test('malformed dates, unknown zones, invalid flags and unsafe record identities are rejected', () => {
  for (const local of ['2026-02-29T12:00', '2026-12-10T24:00', '2026-12-10T12:00Z']) assert.throws(() => record({ local }));
  for (const change of [{ id: '../x' }, { label: '' }, { zone: 'unknown' }, { verified: 'true' }, { progress: 'accepted' }, { kind: 'refund-guarantee' }, { reminder: 5 }, { offset: '-999' }, { revision: -1 }, { label: 'a'.repeat(61) }]) assert.throws(() => record(change));
});
test('requested is not resolved; examples, completed, unconfirmed and reached deadlines are excluded', () => {
  assert.ok(inspectDeadline(record({ progress: 'requested' }), 'Asia/Seoul', now).eligible);
  for (const change of [{ example: true }, { progress: 'resolved' }, { verified: false }, { local: '2026-11-23T12:00' }]) assert.equal(inspectDeadline(record(change), 'Asia/Seoul', now).eligible, false);
  const equal = inspectDeadline(record({ local: '2026-11-24T09:00' }), 'Asia/Seoul', now);
  assert.ok(equal.past); assert.equal(equal.eligible, false);
});
test('personal file round trip preserves raw records but resets all source confirmations', () => {
  const source = book([record({ progress: 'requested', reminder: 60, revision: 2 })]);
  source.records[0].calculatedUtc = 'fake';
  const restored = parseDeadlineBook('\uFEFF' + JSON.stringify(source));
  assert.equal(restored.records[0].id, source.records[0].id);
  assert.equal(restored.records[0].progress, 'requested');
  assert.equal(restored.records[0].verified, false);
  assert.equal(restored.records[0].reminder, 60);
  assert.equal(restored.records[0].calculatedUtc, undefined);
});
test('personal file schema, byte bound, record count and unique ids are enforced', () => {
  for (const raw of ['{', '[]', '{}', JSON.stringify({ format: 'shootsense-trip-board', version: 1 }), ' '.repeat(MAX_DEADLINE_BYTES + 1)]) assert.throws(() => parseDeadlineBook(raw));
  assert.throws(() => normalizeDeadlineBook(book([record(), record()])));
  assert.throws(() => normalizeDeadlineBook(book(Array.from({ length: 51 }, (_, i) => record({ id: 'id-' + i })))));
  assert.equal(normalizeDeadlineBook(book(Array.from({ length: 50 }, (_, i) => record({ id: 'id-' + i })))).records.length, 50);
});
test('ICS uses exact UTC instants, private events and stable ids without inventing a grace interval', () => {
  const records = [record({ progress: 'requested', revision: 3 }), record({ id: 'excluded-example', example: true }), record({ id: 'excluded-done', progress: 'resolved' })];
  const serialized = deadlineCalendar(book(records), now);
  const component = new ICAL.Component(ICAL.parse(serialized));
  const events = component.getAllSubcomponents('vevent');
  assert.equal(events.length, 1);
  const event = events[0];
  assert.equal(event.getFirstPropertyValue('uid'), 'test-reservation@shootsense.com');
  assert.equal(event.getFirstPropertyValue('sequence'), 3);
  assert.equal(event.getFirstPropertyValue('dtstart').toICALString(), '20261210T030000Z');
  assert.equal(event.getFirstPropertyValue('class'), 'PRIVATE');
  assert.equal(event.getFirstPropertyValue('transp'), 'TRANSPARENT');
  assert.equal(event.getFirstPropertyValue('dtend'), null);
  assert.equal(event.getAllSubcomponents('valarm').length, 0);
  assert.match(event.getFirstPropertyValue('description'), /요청 전달 · 처리 미확인/);
});
test('explicit reminders use standard DISPLAY alarms with negative offsets, not site notifications', () => {
  const component = new ICAL.Component(ICAL.parse(deadlineCalendar(book([record({ reminder: 60 })]), now)));
  const alarm = component.getFirstSubcomponent('vevent').getFirstSubcomponent('valarm');
  assert.equal(alarm.getFirstPropertyValue('action'), 'DISPLAY');
  assert.equal(alarm.getFirstPropertyValue('trigger').toSeconds(), -3600);
});
test('already-passed reminder time is omitted without dropping a still-future deadline', () => {
  const item = record({ local: '2026-11-24T09:30', reminder: 60 });
  const view = inspectDeadline(item, 'Asia/Seoul', now);
  assert.ok(view.eligible); assert.ok(view.alarmExpired); assert.equal(view.alarmEligible, false);
  const component = new ICAL.Component(ICAL.parse(deadlineCalendar(book([item]), now)));
  assert.equal(component.getFirstSubcomponent('vevent').getAllSubcomponents('valarm').length, 0);
});
test('Unicode and ICS-looking note text remain a single property rather than injected events', () => {
  const note = '공개 조건\nBEGIN:VEVENT\nSUMMARY:가짜 일정\nEND:VEVENT\n쉼표, 세미콜론; 역슬래시\\';
  const component = new ICAL.Component(ICAL.parse(deadlineCalendar(book([record({ note, label: '서울·도쿄 숙소' })]), now)));
  assert.equal(component.getAllSubcomponents('vevent').length, 1);
  assert.match(component.getFirstSubcomponent('vevent').getFirstPropertyValue('description'), /BEGIN:VEVENT\nSUMMARY:가짜 일정/);
  assert.equal(component.getFirstSubcomponent('vevent').getFirstPropertyValue('summary'), '서울·도쿄 숙소 · 취소 마감');
  const carriage = deadlineCalendar(book([record({ note: 'x\rBEGIN:VEVENT\r\nSUMMARY:injected\rEND:VEVENT' })]), now);
  assert.equal(new ICAL.Component(ICAL.parse(carriage)).getAllSubcomponents('vevent').length, 1);
  assert.equal(record({ note: 'a\rb\r\nc' }).note, 'a\nb\nc');
});
test('empty and example books cannot generate operational calendar events and text preserves unknowns', () => {
  assert.throws(() => deadlineCalendar(emptyDeadlineBook(), now));
  assert.throws(() => deadlineCalendar(exampleDeadlineBook(), now));
  assert.match(deadlineText(book([record({ zone: '', verified: false })]), now), /시간대 미확인/);
  assert.match(deadlineText(book([record({ local: '2026-11-23T12:00' })]), now), /실제 취소·환불 가능 여부의 판정이 아닙니다/);
});
test('new calendar page has one identity, inert blank fallback and a real standard-file module', async () => {
  const $ = await read(DEADLINE_ROUTE);
  assert.equal($('h1').length, 1);
  assert.equal($('link[rel="canonical"]').attr('href'), 'https://shootsense.com' + DEADLINE_ROUTE);
  assert.equal($('meta[name="robots"]').attr('content'), 'index, follow');
  assert.equal($('#deadline-form input:not([disabled]), #deadline-form select:not([disabled])').length, 0);
  assert.equal($('#deadline-rows tr').length, 0);
  assert.equal($('#deadline-zone option[selected]').length, 0);
  assert.equal($('#ss-deadline-calendar[type="module"]').attr('src'), '/assets/deadline-calendar.js');
  assert.equal($('#ss-trip-board').length, 0);
  assert.equal($('script[src*="googlesyndication"], ins.adsbygoogle').length, 0);
  const graph = JSON.parse($('script.rank-math-schema').text())['@graph'];
  assert.equal(graph[0].datePublished, DEADLINE_MODIFIED);
  assert.equal(graph[1]['@type'], 'WebApplication');
});
test('main, trip board, privacy and sitemap link the tool without collecting data remotely', async () => {
  assert.equal((await read('/'))('#ss-home-deadlines a').attr('href'), DEADLINE_ROUTE);
  const board = await read('/tools/trip-board/');
  assert.equal(board('#ss-deadline-link a').attr('href'), DEADLINE_ROUTE);
  assert.equal(board('#ss-deadline-link a').attr('target'), '_blank');
  assert.equal((await read('/privacy-policy/'))('#deadline-input-privacy').length, 1);
  const map = load(await fs.readFile('page-sitemap.xml', 'utf8'), { xml: true });
  const item = map('url').filter((_, node) => map(node).find('loc').text() === 'https://shootsense.com' + DEADLINE_ROUTE);
  assert.equal(item.length, 1); assert.equal(item.find('lastmod').text(), DEADLINE_MODIFIED);
  const source = await fs.readFile('assets/deadline-calendar.js', 'utf8');
  assert.ok(!/fetch\(|XMLHttpRequest|localStorage|sessionStorage|history\.|\.innerHTML\s*=|Notification\./.test(source));
});
test('scheduled publisher sitemap generation retains every public tool, analysis and directory route', async () => {
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'shootsense-sitemap-test-'));
  try {
    await updateSitemaps(scratch, []);
    const map = load(await fs.readFile(path.join(scratch, 'page-sitemap.xml'), 'utf8'), { xml: true });
    const urls = map('loc').toArray().map(node => map(node).text());
    assert.equal(new Set(urls).size, urls.length);
    for (const route of ['guides', 'analysis/tokyo-stay-cost', 'analysis/tokyo-late-checkin', 'analysis/room-extension-or-baggage', 'tools/stay-compare', 'tools/departure-check', 'tools/arrival-check', 'tools/trip-board', 'tools/reservation-deadlines']) assert.ok(urls.includes(`https://shootsense.com/${route}/`), route);
  } finally {
    for (const filename of ['post-sitemap.xml', 'page-sitemap.xml', 'sitemap_index.xml']) await fs.unlink(path.join(scratch, filename));
    await fs.rmdir(scratch);
  }
});
