import { DateTime } from './vendor/luxon.js';

export const PLANNER_ZONE = 'Asia/Tokyo';
export const PLANNER_FIELDS = {
  departure: '다음 교통편 출발 날짜·시각',
  pickupDeadline: '보관처의 회수 완료 마감',
  toStorage: '관광지에서 보관처까지 이동',
  pickupMinutes: '짐 회수 절차',
  toPlatform: '회수 후 승차 위치까지 이동',
  boardingBuffer: '승차 전 확보할 여유',
  reserve: '회수 전 별도 여유'
};
const minuteKeys = ['toStorage', 'pickupMinutes', 'toPlatform', 'boardingBuffer', 'reserve'];
const iso = time => time.toFormat("yyyy-MM-dd'T'HH:mm");

export function parsePlannerTime(value, label) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const time = DateTime.fromISO(raw, { zone: PLANNER_ZONE });
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw) || !time.isValid || iso(time) !== raw) throw new Error(`${label}: 올바른 날짜와 시각을 입력해 주세요.`);
  return time;
}

export function plannerMinutes(value, label) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (!/^\d+$/.test(raw) || Number(raw) > 1440) throw new Error(`${label}: 0~1,440분의 정수를 입력해 주세요.`);
  return Number(raw);
}

export function formatPlannerTime(value) {
  return DateTime.fromISO(value, { zone: PLANNER_ZONE }).toFormat('yyyy-MM-dd HH:mm');
}

export function calculateDeparture(input) {
  const departure = parsePlannerTime(input.departure, PLANNER_FIELDS.departure);
  const deadline = parsePlannerTime(input.pickupDeadline, PLANNER_FIELDS.pickupDeadline);
  const plannedLeave = parsePlannerTime(input.plannedLeave, '계획한 관광 종료 날짜·시각');
  const minutes = Object.fromEntries(minuteKeys.map(key => [key, plannerMinutes(input[key], PLANNER_FIELDS[key])]));
  const missing = Object.keys(PLANNER_FIELDS).filter(key => key === 'departure' ? !departure : key === 'pickupDeadline' ? !deadline : minutes[key] === null).map(key => PLANNER_FIELDS[key]);
  if (missing.length) return { complete: false, zone: PLANNER_ZONE, missing, times: null, scenarios: [], plannedLeaveMissing: !plannedLeave };

  const platformTarget = departure.minus({ minutes: minutes.boardingBuffer });
  const trainPickupLimit = platformTarget.minus({ minutes: minutes.toPlatform });
  const pickupLimit = deadline.toMillis() <= trainPickupLimit.toMillis() ? deadline : trainPickupLimit;
  const binding = deadline.toMillis() === trainPickupLimit.toMillis() ? 'both' : pickupLimit === deadline ? 'storage' : 'departure';
  const pickupStart = pickupLimit.minus({ minutes: minutes.pickupMinutes });
  const storageArrival = pickupStart.minus({ minutes: minutes.reserve });
  const leaveBy = storageArrival.minus({ minutes: minutes.toStorage });
  const platformArrival = pickupLimit.plus({ minutes: minutes.toPlatform });
  const diffMinutes = (a, b) => Math.round(a.diff(b, 'minutes').minutes);
  const scenarios = plannedLeave ? [0, 20, 40].map(delay => {
    const leave = plannedLeave.plus({ minutes: delay });
    const pickupComplete = leave.plus({ minutes: minutes.toStorage + minutes.reserve + minutes.pickupMinutes });
    const atPlatform = pickupComplete.plus({ minutes: minutes.toPlatform });
    return {
      delay, leave: iso(leave), pickupComplete: iso(pickupComplete), atPlatform: iso(atPlatform),
      slack: diffMinutes(leaveBy, leave),
      pickupOverrun: Math.max(0, diffMinutes(pickupComplete, deadline)),
      bufferShortfall: Math.max(0, diffMinutes(atPlatform, platformTarget)),
      departureOverrun: Math.max(0, diffMinutes(atPlatform, departure)),
      atOrAfterDeparture: atPlatform.toMillis() >= departure.toMillis()
    };
  }) : [];
  return {
    complete: true, zone: PLANNER_ZONE, missing: [], plannedLeaveMissing: !plannedLeave, binding,
    times: { leaveBy: iso(leaveBy), storageArrival: iso(storageArrival), pickupStart: iso(pickupStart), pickupComplete: iso(pickupLimit), platformArrival: iso(platformArrival), platformTarget: iso(platformTarget), departure: iso(departure), pickupDeadline: iso(deadline) },
    scenarios
  };
}

export const DEPARTURE_EXAMPLE = Object.freeze({
  departure: '2026-12-12T16:00', pickupDeadline: '2026-12-12T20:00', plannedLeave: '2026-12-12T14:00',
  toStorage: 30, pickupMinutes: 10, toPlatform: 35, boardingBuffer: 20, reserve: 15
});

export function departureText(input, result, example = false) {
  const lines = ['여행정보엑스퍼트 출발일 시간표', example ? '가상 사례의 값이 포함된 계산' : '직접 입력한 값의 계산', '일본 현지 시각 · Asia/Tokyo (UTC+09:00)', '실시간 운행·이동 측정·예약·안전 보증이 아닙니다.', ''];
  for (const [key, label] of Object.entries(PLANNER_FIELDS)) lines.push(`${label}: ${String(input[key] ?? '').trim() || '미확인'}${minuteKeys.includes(key) && String(input[key] ?? '').trim() ? '분' : ''}`);
  lines.push(`계획한 관광 종료: ${input.plannedLeave || '미확인'}`, '');
  if (!result.complete) lines.push('계산 보류: ' + result.missing.join(' · '));
  else {
    const labels = { leaveBy: '관광 종료 목표', storageArrival: '보관처 도착 목표', pickupStart: '회수 절차 시작 목표', pickupComplete: '짐 회수 완료 목표', platformArrival: '승차 위치 도착 목표', departure: '교통편 출발' };
    for (const [key, label] of Object.entries(labels)) lines.push(`${label}: ${formatPlannerTime(result.times[key])}`);
    for (const scenario of result.scenarios) lines.push(`관광 종료 ${scenario.delay}분 지연 가정: 회수 ${formatPlannerTime(scenario.pickupComplete)}, 승차 위치 ${formatPlannerTime(scenario.atPlatform)}, 역산 목표 대비 여유 ${scenario.slack}분, 회수 마감 초과 ${scenario.pickupOverrun}분, 입력한 승차 전 여유 부족 ${scenario.bufferShortfall}분`);
  }
  lines.push('', '빈칸은 0분이 아니라 미확인입니다.', 'https://shootsense.com/tools/departure-check/');
  return lines.join('\n');
}
