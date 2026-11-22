export const TOKYO_CASE = Object.freeze({
  nights: 2, people: 1, assumedWonPerYen: 10,
  a: { name: '도쿄 가상 A', taxBasePerNight: 9800, lodgingPayment: 21560, accommodationTax: 0, transport: 1800 },
  b: { name: '도쿄 가상 B', taxBasePerNight: 10300, lodgingPayment: 22660, accommodationTax: 200, transport: 400 }
});

export const TOKYO_COMPARE_INPUTS = [TOKYO_CASE.a, TOKYO_CASE.b].map(stay => ({
  name: stay.name, room: stay.lodgingPayment * TOKYO_CASE.assumedWonPerYen,
  fees: stay.accommodationTax * TOKYO_CASE.assumedWonPerYen,
  transport: stay.transport * TOKYO_CASE.assumedWonPerYen,
  other: 0, cancellation: '', checkin: 'unknown', feesConfirmed: false
}));

export function tokyoCaseTotal(stay, { transport = stay.transport, other = 0, tax = stay.accommodationTax } = {}) {
  return stay.lodgingPayment + tax + transport + other;
}

export const TOKYO_SENSITIVITY = [
  { label: 'A의 교통 1,600엔', a: tokyoCaseTotal(TOKYO_CASE.a, { transport: 1600 }), b: tokyoCaseTotal(TOKYO_CASE.b) },
  { label: 'A의 교통 1,700엔', a: tokyoCaseTotal(TOKYO_CASE.a, { transport: 1700 }), b: tokyoCaseTotal(TOKYO_CASE.b) },
  { label: '기본 가정: A의 교통 1,800엔', a: tokyoCaseTotal(TOKYO_CASE.a), b: tokyoCaseTotal(TOKYO_CASE.b) },
  { label: 'B에 별도 비용 1,000엔 발생', a: tokyoCaseTotal(TOKYO_CASE.a), b: tokyoCaseTotal(TOKYO_CASE.b, { other: 1000 }) }
];
