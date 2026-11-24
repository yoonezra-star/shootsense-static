import test from 'node:test';
import assert from 'node:assert/strict';
import { amount, compareStays, MAX_AMOUNT, stayTotalLabel, stayComparisonSummary } from '../assets/stay-math.js';

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
  assert.equal(result.difference, null);
  assert.equal(result.completeCosts, false);
  assert.equal(result.lowerCostId, null);
  assert.deepEqual(result.stays[0].missingCosts, ['fees', 'transport', 'other']);
  assert.equal(result.stays[0].costs.fees, null);
  assert.equal(result.stays[0].total, 0);
  assert.ok(result.stays[1].flags.includes('도착 시각 체크인 불가'));
});

test('an unknown cost on either candidate suppresses cost ranking even if the known subtotal is lower', () => {
  for (const index of [0, 1]) for (const field of ['fees', 'transport', 'other']) {
    const inputs = [stay({ feesConfirmed: true, checkin: 'yes' }), stay({ room: '200000', feesConfirmed: true, checkin: 'yes' })];
    inputs[index][field] = '';
    const result = compareStays(inputs);
    assert.equal(result.difference, null);
    assert.equal(result.lowerCostId, null);
    assert.equal(result.stays[index].costs[field], null);
    assert.match(stayTotalLabel(result.stays[index]), /미확인 비용 제외/);
    assert.match(stayComparisonSummary(result), /판정을 보류/);
  }
});

test('explicit zero restores arithmetic comparison without granting check-in or fee certainty', () => {
  const result = compareStays([stay({ fees: '0', transport: '0', other: '0', checkin: 'no' }), stay({ room: '80000', fees: '0', transport: '0', other: '0' })]);
  assert.equal(result.completeCosts, true);
  assert.equal(result.lowerCostId, 'a');
  assert.equal(result.difference, 5000);
  assert.ok(result.stays[0].flags.includes('추가비용 미확인'));
  assert.ok(result.stays[0].flags.includes('도착 시각 체크인 불가'));
  assert.match(stayComparisonSummary(result), /5,000원 적습니다/);
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
