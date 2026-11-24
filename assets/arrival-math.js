import { parsePlannerTime, plannerMinutes, formatPlannerTime, PLANNER_ZONE } from './departure-math.js';

export const ARRIVAL_LABELS = {
  arrival: '항공편 도착 예정 날짜·시각',
  deadline: '숙소에서 확인한 도착 마감',
  airportMinutes: '항공편 도착부터 입국·짐 수령·세관 통과까지',
  hotelBuffer: '숙소 마감 전 확보할 여유',
  transferMinutes: '입국 후 숙소 접수처까지 이동',
  serviceDeparture: '이용할 교통편 출발 날짜·시각',
  platformMinutes: '입국 후 승차 위치까지 이동·승차 준비',
  boardingBuffer: '교통편 출발 전 확보할 여유',
  onwardMinutes: '교통편 출발부터 숙소 접수처까지'
};
const iso = value => value.toFormat("yyyy-MM-dd'T'HH:mm");
const diff = (a, b) => Math.round(a.diff(b, 'minutes').minutes);
export function arrivalMode(input) {
  const mode = input.mode || 'direct';
  if (!['direct', 'scheduled'].includes(mode)) throw new Error('이동 방식이 올바르지 않습니다.');
  return mode;
}
export function arrivalFields(mode) {
  return ['arrival', 'deadline', 'airportMinutes', 'hotelBuffer', ...(mode === 'scheduled' ? ['serviceDeparture', 'platformMinutes', 'boardingBuffer', 'onwardMinutes'] : ['transferMinutes'])];
}
export function calculateArrival(input) {
  const mode = arrivalMode(input);
  const fields = arrivalFields(mode);
  const parsed = Object.fromEntries(fields.map(key => [key, ['arrival', 'deadline', 'serviceDeparture'].includes(key) ? parsePlannerTime(input[key], ARRIVAL_LABELS[key]) : plannerMinutes(input[key], ARRIVAL_LABELS[key])]));
  const missing = fields.filter(key => parsed[key] === null).map(key => ARRIVAL_LABELS[key]);
  if (missing.length) return { complete: false, mode, zone: PLANNER_ZONE, missing, scenarios: [], latestArrivalTarget: null };
  const { arrival, deadline, airportMinutes, hotelBuffer } = parsed;
  const hotelTarget = deadline.minus({ minutes: hotelBuffer });
  const serviceTarget = mode === 'scheduled' ? parsed.serviceDeparture.minus({ minutes: parsed.boardingBuffer }) : null;
  const latestArrival = mode === 'direct' ? hotelTarget.minus({ minutes: airportMinutes + parsed.transferMinutes }) : serviceTarget.minus({ minutes: airportMinutes + parsed.platformMinutes });
  const fixedHotelArrival = mode === 'scheduled' ? parsed.serviceDeparture.plus({ minutes: parsed.onwardMinutes }) : null;
  const scenarios = [0, 30, 60].map(delay => {
    const shiftedArrival = arrival.plus({ minutes: delay });
    const airportReady = shiftedArrival.plus({ minutes: airportMinutes });
    const boardingArrival = mode === 'scheduled' ? airportReady.plus({ minutes: parsed.platformMinutes }) : null;
    const atOrAfterService = boardingArrival ? boardingArrival.toMillis() >= parsed.serviceDeparture.toMillis() : false;
    // A missed scheduled service is not silently replaced by another train or a taxi.
    const hotelArrival = mode === 'direct' ? airportReady.plus({ minutes: parsed.transferMinutes }) : atOrAfterService ? null : fixedHotelArrival;
    return {
      delay, arrival: iso(shiftedArrival), airportReady: iso(airportReady),
      boardingArrival: boardingArrival ? iso(boardingArrival) : null,
      serviceDeparture: mode === 'scheduled' ? iso(parsed.serviceDeparture) : null,
      boardingMargin: boardingArrival ? diff(serviceTarget, boardingArrival) : null,
      atOrAfterService,
      hotelArrival: hotelArrival ? iso(hotelArrival) : null,
      hotelMargin: hotelArrival ? diff(hotelTarget, hotelArrival) : null,
      hotelDeadlineOverrun: hotelArrival ? Math.max(0, diff(hotelArrival, deadline)) : null,
      atOrAfterDeadline: hotelArrival ? hotelArrival.toMillis() >= deadline.toMillis() : null
    };
  });
  return { complete: true, mode, zone: PLANNER_ZONE, missing: [], latestArrivalTarget: iso(latestArrival), hotelTarget: iso(hotelTarget), deadline: iso(deadline), scheduleHotelConflict: fixedHotelArrival ? fixedHotelArrival.toMillis() > hotelTarget.toMillis() || fixedHotelArrival.toMillis() >= deadline.toMillis() : false, scenarios };
}
export function arrivalConditions(scenario) {
  const conditions = [];
  if (scenario.atOrAfterService) conditions.push('승차 위치 도착이 해당 교통편 출발과 같거나 늦음 · 숙소 도착 계산 보류');
  else if (scenario.boardingMargin !== null && scenario.boardingMargin < 0) conditions.push(`입력한 탑승 전 여유 ${-scenario.boardingMargin}분 부족 · 해당편 탑승 여부 미확정`);
  if (scenario.atOrAfterDeadline) conditions.push(scenario.hotelDeadlineOverrun ? `숙소 도착 마감 ${scenario.hotelDeadlineOverrun}분 초과` : '숙소 도착이 마감 시각과 같음 · 추가 여유 0분');
  else if (scenario.hotelMargin !== null && scenario.hotelMargin < 0) conditions.push(`입력한 숙소 도착 여유 ${-scenario.hotelMargin}분 부족`);
  if (!conditions.length) conditions.push(`입력한 숙소 도착 여유 외 ${scenario.hotelMargin}분 남음`);
  return conditions;
}
export const ARRIVAL_EXAMPLES = Object.freeze({
  direct: { mode: 'direct', arrival: '2026-12-10T21:00', deadline: '2026-12-11T00:00', airportMinutes: 60, hotelBuffer: 20, transferMinutes: 70 },
  scheduled: { mode: 'scheduled', arrival: '2026-12-10T22:00', deadline: '2026-12-11T00:30', airportMinutes: 45, hotelBuffer: 20, serviceDeparture: '2026-12-10T23:30', platformMinutes: 15, boardingBuffer: 10, onwardMinutes: 40 }
});
export function arrivalText(input, result, example = false) {
  const lines = ['여행정보엑스퍼트 공항 도착·체크인 검토표', example ? '가상 사례의 값이 포함된 계산' : '직접 입력한 값의 계산', '일본 현지 시각 · Asia/Tokyo (UTC+09:00)', result.mode === 'scheduled' ? '이동 방식: 출발 시각이 정해진 교통편' : '이동 방식: 이동시간 합산', '실시간 운항·교통·예약 승인·체크인 가능 보증이 아닙니다.', ''];
  for (const key of arrivalFields(result.mode)) lines.push(`${ARRIVAL_LABELS[key]}: ${String(input[key] ?? '').trim().replace('T', ' ') || '미확인'}${!['arrival', 'deadline', 'serviceDeparture'].includes(key) && String(input[key] ?? '').trim() ? '분' : ''}`);
  if (!result.complete) lines.push('', '계산 보류: ' + result.missing.join(' · '));
  else {
    lines.push('', `항공편 도착 역산 목표: ${formatPlannerTime(result.latestArrivalTarget)}`, result.mode === 'scheduled' ? '위 목표는 해당 교통편의 탑승 전 여유 기준이며 숙소 마감 충족까지 의미하지 않습니다.' : '위 목표는 입력한 숙소 마감 전 여유 기준입니다.');
    for (const scenario of result.scenarios) lines.push('', `항공편 도착 ${scenario.delay}분 지연 가정`, `입국·짐 수령·세관 통과: ${formatPlannerTime(scenario.airportReady)}`, ...(scenario.boardingArrival ? [`승차 위치: ${formatPlannerTime(scenario.boardingArrival)}`] : []), `숙소 접수처: ${scenario.hotelArrival ? formatPlannerTime(scenario.hotelArrival) : '계산 보류 · 해당편 이후 대안 미확인'}`, ...arrivalConditions(scenario));
  }
  lines.push('', '지연 시나리오는 예측이 아니며 같은 소요 시간을 유지한 가정입니다.', 'https://shootsense.com/tools/arrival-check/');
  return lines.join('\n');
}
