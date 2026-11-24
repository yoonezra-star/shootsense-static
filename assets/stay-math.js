export const MAX_AMOUNT = 1_000_000_000;

export function amount(value, { required = false } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    if (required) throw new Error('숙박비 합계를 두 숙소 모두 입력해 주세요.');
    return 0;
  }
  if (!/^\d+$/.test(raw)) throw new Error('금액은 원 단위의 0 이상 정수로 입력해 주세요.');
  const number = Number(raw);
  if (!Number.isSafeInteger(number) || number > MAX_AMOUNT) throw new Error('항목별 금액은 10억 원 이하여야 합니다.');
  return number;
}

export function compareStays(inputs) {
  if (!Array.isArray(inputs) || inputs.length !== 2) throw new Error('두 숙소를 같은 예약 기간으로 비교해 주세요.');
  const stays = inputs.map((input, index) => {
    const costs = {
      room: amount(input.room, { required: true }),
      fees: String(input.fees ?? '').trim() ? amount(input.fees) : null,
      transport: String(input.transport ?? '').trim() ? amount(input.transport) : null,
      other: String(input.other ?? '').trim() ? amount(input.other) : null
    };
    const missingCosts = Object.keys(costs).filter(key => costs[key] === null);
    const flags = [];
    for (const key of missingCosts) flags.push(`${{ fees: '추가금', transport: '교통비', other: '기타 비용' }[key]} 금액 미확인`);
    if (!input.feesConfirmed) flags.push('추가비용 미확인');
    if (input.checkin === 'no') flags.push('도착 시각 체크인 불가');
    else if (input.checkin !== 'yes') flags.push('도착 시각 체크인 미확인');
    return {
      id: index === 0 ? 'a' : 'b',
      name: String(input.name || `숙소 ${index === 0 ? 'A' : 'B'}`).trim().slice(0, 40),
      costs,
      total: Object.values(costs).reduce((sum, cost) => sum + (cost ?? 0), 0),
      missingCosts,
      cancellation: String(input.cancellation ?? '').trim() ? amount(input.cancellation) : null,
      flags
    };
  });
  const completeCosts = stays.every(stay => stay.missingCosts.length === 0);
  const difference = completeCosts ? Math.abs(stays[0].total - stays[1].total) : null;
  return { stays, completeCosts, difference, lowerCostId: difference === null || difference === 0 ? null : stays[0].total < stays[1].total ? 'a' : 'b' };
}

export const stayTotalLabel = stay => stay.missingCosts.length ? '입력된 금액 소계 (미확인 비용 제외)' : '이용 시 입력 합계';

export function stayComparisonSummary(comparison) {
  if (!comparison.completeCosts) return '미확인 비용이 있어 금액 차이·저렴한 후보 판정을 보류합니다. 표시 금액은 입력된 항목의 소계입니다.';
  const lower = comparison.stays.find(stay => stay.id === comparison.lowerCostId);
  return lower ? `입력한 비용 합계는 ${lower.name}이 ${comparison.difference.toLocaleString('ko-KR')}원 적습니다.` : '두 숙소의 입력 비용 합계가 같습니다.';
}
