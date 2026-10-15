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
      fees: amount(input.fees),
      transport: amount(input.transport),
      other: amount(input.other)
    };
    const flags = [];
    if (!input.feesConfirmed) flags.push('추가비용 미확인');
    if (input.checkin === 'no') flags.push('도착 시각 체크인 불가');
    else if (input.checkin !== 'yes') flags.push('도착 시각 체크인 미확인');
    return {
      id: index === 0 ? 'a' : 'b',
      name: String(input.name || `숙소 ${index === 0 ? 'A' : 'B'}`).trim().slice(0, 40),
      costs,
      total: Object.values(costs).reduce((sum, cost) => sum + cost, 0),
      cancellation: String(input.cancellation ?? '').trim() ? amount(input.cancellation) : null,
      flags
    };
  });
  const difference = Math.abs(stays[0].total - stays[1].total);
  return { stays, difference, lowerCostId: difference === 0 ? null : stays[0].total < stays[1].total ? 'a' : 'b' };
}
