import test from 'node:test';
import assert from 'node:assert/strict';
import { amount, compareStays, MAX_AMOUNT } from '../assets/stay-math.js';

const stay = changes => ({ name: '숙소', room: '75000', fees: '15000', transport: '18000', other: '0', cancellation: '', checkin: 'unknown', feesConfirmed: false, ...changes });

test('the worked example totals and cancellation scenarios remain separate', () => {
  const result = compareStays([stay({ cancellation: '90000' }), stay({ room: '91000', fees: '0', transport: '4000', cancellation: '0', checkin: 'yes', feesConfirmed: true })]);
  assert.deepEqual(result.stays.map(item => item.total), [108000, 95000]);
  assert.equal(result.difference, 13000);
  assert.equal(result.lowerCostId, 'b');
  assert.deepEqual(result.stays.map(item => item.cancellation), [90000, 0]);
  assert.ok(result.stays[0].flags.includes('추가비용 미확인'));
  assert.deepEqual(result.stays[1].flags, []);
});

test('unknown cancellation is different from a confirmed zero loss', () => {
  const result = compareStays([stay({ cancellation: '' }), stay({ cancellation: '0' })]);
  assert.equal(result.stays[0].cancellation, null);
  assert.equal(result.stays[1].cancellation, 0);
  assert.equal(result.lowerCostId, null);
});

test('empty optional fees and zero-priced stays are accepted without inventing certainty', () => {
  const result = compareStays([stay({ room: '0', fees: '', transport: '', other: '' }), stay({ room: '0', fees: '', transport: '', other: '', checkin: 'no' })]);
  assert.equal(result.difference, 0);
  assert.equal(result.stays[0].total, 0);
  assert.ok(result.stays[1].flags.includes('도착 시각 체크인 불가'));
});

test('missing, negative, fractional and unsafe amounts cannot produce a comparison', () => {
  for (const value of ['-1', '1.5', 'NaN', 'Infinity', '0x10', String(MAX_AMOUNT + 1)]) assert.throws(() => amount(value));
  assert.throws(() => compareStays([stay({ room: '' }), stay()]));
  assert.throws(() => compareStays([stay()]));
});

test('every accepted sum remains a safe integer', () => {
  const result = compareStays([stay({ room: MAX_AMOUNT, fees: MAX_AMOUNT, transport: MAX_AMOUNT, other: MAX_AMOUNT }), stay()]);
  assert.equal(result.stays[0].total, MAX_AMOUNT * 4);
  assert.ok(Number.isSafeInteger(result.stays[0].total));
});
