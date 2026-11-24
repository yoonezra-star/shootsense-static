import { compareStays } from './stay-math.js';
import { calculateArrival, arrivalConditions, ARRIVAL_EXAMPLES } from './arrival-math.js';
import { calculateDeparture, formatPlannerTime, parsePlannerTime, DEPARTURE_EXAMPLE, PLANNER_FIELDS } from './departure-math.js';
import { TOKYO_COMPARE_INPUTS } from './tokyo-stay-case.js';

export const BOARD_TOOLS = ['stay', 'arrival', 'departure'];
export const BOARD_TITLES = { stay: '숙소 비교', arrival: '공항 도착', departure: '마지막 날 출발' };
export const BOARD_STATES = ['empty', 'dirty', 'calculated', 'error'];
export const MAX_BOARD_BYTES = 65536;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function scalar(value, max = 80) {
  if (value === undefined || value === null) return '';
  if (!['string', 'number'].includes(typeof value) || typeof value === 'number' && !Number.isFinite(value)) throw new Error('입력 값의 형식이 올바르지 않습니다.');
  const text = String(value).trim();
  if (text.length > max) throw new Error('입력 값이 허용 길이를 넘었습니다.');
  return text;
}
export function normalizeToolRecord(tool, value) {
  if (!BOARD_TOOLS.includes(tool)) throw new Error('알 수 없는 도구입니다.');
  if (value === undefined || value === null) value = { state: 'empty', inputs: tool === 'stay' ? [{}, {}] : {}, example: false };
  if (!object(value) || !BOARD_STATES.includes(value.state) || value.example !== undefined && typeof value.example !== 'boolean') throw new Error('도구 기록 형식이 올바르지 않습니다.');
  let inputs;
  if (tool === 'stay') {
    if (!Array.isArray(value.inputs) || value.inputs.length !== 2 || !value.inputs.every(object)) throw new Error('두 숙소의 입력 기록이 필요합니다.');
    inputs = value.inputs.map(item => {
      if (item.feesConfirmed !== undefined && typeof item.feesConfirmed !== 'boolean') throw new Error('추가비용 확인 상태가 올바르지 않습니다.');
      const checkin = item.checkin || 'unknown';
      if (!['yes', 'no', 'unknown'].includes(checkin)) throw new Error('체크인 확인 상태가 올바르지 않습니다.');
      return { name: scalar(item.name, 40), ...Object.fromEntries(['room', 'fees', 'transport', 'other', 'cancellation'].map(key => [key, scalar(item[key])])), checkin, feesConfirmed: item.feesConfirmed === true };
    });
  } else {
    if (!object(value.inputs)) throw new Error('일정 입력 기록이 올바르지 않습니다.');
    const keys = tool === 'arrival' ? ['arrival', 'deadline', 'airportMinutes', 'hotelBuffer', 'transferMinutes', 'serviceDeparture', 'platformMinutes', 'boardingBuffer', 'onwardMinutes'] : [...Object.keys(PLANNER_FIELDS), 'plannedLeave'];
    inputs = Object.fromEntries(keys.map(key => [key, scalar(value.inputs[key])]));
    if (tool === 'arrival') {
      const mode = value.inputs.mode || 'direct';
      if (!['direct', 'scheduled'].includes(mode)) throw new Error('도착일 이동 방식이 올바르지 않습니다.');
      inputs.mode = mode;
    }
  }
  return { state: value.state, inputs, example: value.example === true };
}
export function emptyBoard() {
  return { format: 'shootsense-trip-board', version: 1, context: { name: '', selectedStay: '', sameTrip: false }, records: Object.fromEntries(BOARD_TOOLS.map(tool => [tool, normalizeToolRecord(tool)])) };
}
export function normalizeBoard(value) {
  if (!object(value) || value.format !== 'shootsense-trip-board' || value.version !== 1 || !object(value.context) || !object(value.records)) throw new Error('지원하는 여행 준비판 파일이 아닙니다.');
  const selectedStay = value.context.selectedStay || '';
  if (!['', 'a', 'b'].includes(selectedStay) || typeof value.context.sameTrip !== 'boolean') throw new Error('여행 연결 조건이 올바르지 않습니다.');
  return { format: value.format, version: 1, context: { name: scalar(value.context.name, 60), selectedStay, sameTrip: value.context.sameTrip }, records: Object.fromEntries(BOARD_TOOLS.map(tool => [tool, normalizeToolRecord(tool, value.records[tool])])) };
}
export function parseBoardFile(text) {
  if (new TextEncoder().encode(text).length > MAX_BOARD_BYTES) throw new Error('준비판 파일은 64KB 이하여야 합니다.');
  let value;
  try { value = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { throw new Error('JSON 준비판 파일을 읽을 수 없습니다.'); }
  const board = normalizeBoard(value);
  board.context.sameTrip = false;
  return board;
}
export function reviewTool(tool, raw) {
  const record = normalizeToolRecord(tool, raw);
  if (record.state === 'empty') return { status: 'empty', label: '미계산', record, result: null, lines: ['아직 입력·계산한 기록이 없습니다.'] };
  if (record.state === 'dirty') return { status: 'dirty', label: '재계산 필요', record, result: null, lines: ['입력 변경 후 계산하지 않았습니다. 이전 결과를 제외했습니다.'] };
  try {
    const result = tool === 'stay' ? compareStays(record.inputs) : tool === 'arrival' ? calculateArrival(record.inputs) : calculateDeparture(record.inputs);
    if (record.state === 'error') return { status: 'error', label: '입력 재확인', record, result: null, lines: ['도구에서 입력을 확인하고 다시 계산해야 합니다.'] };
    if (result.complete === false) return { status: 'pending', label: '미확인 항목', record, result: null, lines: result.missing };
    let lines;
    if (tool === 'stay') lines = result.stays.map(stay => `${stay.name}: 입력 합계 ${stay.total.toLocaleString('ko-KR')}원 · 취소 손실 ${stay.cancellation === null ? '미확인' : stay.cancellation.toLocaleString('ko-KR') + '원'} · ${stay.flags.join(' · ') || '추가비용·체크인 확인함'}`);
    else if (tool === 'arrival') {
      const base = result.scenarios[0];
      lines = [`숙소 접수처 도착 가정: ${base.hotelArrival ? formatPlannerTime(base.hotelArrival) : '계산 보류 · 해당편 이후 대안 미확인'}`, `입력한 숙소 도착 마감: ${formatPlannerTime(result.deadline)}`, ...arrivalConditions(base)];
    } else lines = [`관광 종료 목표: ${formatPlannerTime(result.times.leaveBy)}`, `짐 회수 완료 목표: ${formatPlannerTime(result.times.pickupComplete)}`, `다음 교통편 출발: ${formatPlannerTime(result.times.departure)}`];
    return { status: 'ready', label: '계산 기록 있음', record, result, lines };
  } catch (error) { return { status: 'error', label: '입력 재확인', record, result: null, lines: [error.message] }; }
}
export function boardOverview(value) {
  const board = normalizeBoard(value);
  const reviews = Object.fromEntries(BOARD_TOOLS.map(tool => [tool, reviewTool(tool, board.records[tool])]));
  const tasks = [];
  for (const tool of BOARD_TOOLS) if (reviews[tool].status !== 'ready') tasks.push(`${BOARD_TITLES[tool]}: ${reviews[tool].lines.join(' · ')}`);
  const readyCount = BOARD_TOOLS.filter(tool => reviews[tool].status === 'ready').length;
  const chosen = reviews.stay.result?.stays.find(stay => stay.id === board.context.selectedStay);
  if (!board.context.selectedStay) tasks.push('이 일정에서 검토할 숙소 후보를 선택하지 않았습니다.');
  if (chosen) {
    for (const flag of chosen.flags) tasks.push(`${chosen.name}: ${flag}`);
    if (chosen.cancellation === null) tasks.push(`${chosen.name}: 취소 손실 미확인`);
    const raw = board.records.stay.inputs[chosen.id === 'a' ? 0 : 1];
    for (const [key, label] of Object.entries({ fees: '추가금', transport: '교통비', other: '기타 비용' })) if (raw[key] === '') tasks.push(`${chosen.name}: ${label} 미입력 · 입력 합계의 0원 반영을 확정 비용으로 보지 않습니다.`);
  }
  if (reviews.arrival.result) {
    for (const s of reviews.arrival.result.scenarios) if (s.atOrAfterService || s.atOrAfterDeadline || s.boardingMargin < 0 || s.hotelMargin < 0) tasks.push(`공항 도착 ${s.delay}분 지연 가정: ${arrivalConditions(s).join(' · ')}`);
  }
  if (reviews.departure.result) {
    const result = reviews.departure.result;
    if (result.plannedLeaveMissing) tasks.push('출발일의 계획한 관광 종료 시각 미확인 · 지연 비교 없음');
    for (const s of result.scenarios) if (s.pickupOverrun || s.bufferShortfall || s.atOrAfterDeparture) tasks.push(`관광 종료 ${s.delay}분 지연 가정: 회수 마감 초과 ${s.pickupOverrun}분 · 입력한 승차 전 여유 부족 ${s.bufferShortfall}분${s.atOrAfterDeparture ? ' · 승차 위치 도착이 출발과 같거나 늦음' : ''}`);
  }
  const canLink = readyCount === 3 && Boolean(chosen);
  let relation = 'not-linked';
  if (!canLink || !board.context.sameTrip) tasks.push('세 계산이 같은 여행·선택한 숙소의 조건인지 연결 확인이 필요합니다.');
  else {
    const arrival = reviews.arrival.result.scenarios[0].hotelArrival;
    if (!arrival) { relation = 'blocked'; tasks.push('도착일의 숙소 도착 계산이 보류되어 날짜 순서를 대조하지 않았습니다.'); }
    else if (parsePlannerTime(arrival).toMillis() >= parsePlannerTime(reviews.departure.result.times.leaveBy).toMillis()) { relation = 'conflict'; tasks.push('숙소 도착이 마지막 날 관광 종료 목표와 같거나 뒤입니다. 도착일·출발일과 마감 날짜를 다시 확인하세요.'); }
    else relation = 'ordered';
  }
  return { board, reviews, readyCount, canLink, chosen, relation, tasks: [...new Set(tasks)], hasExample: BOARD_TOOLS.some(tool => board.records[tool].example) };
}
export function boardText(value) {
  const overview = boardOverview(value);
  const { board, reviews } = overview;
  const lines = ['여행정보엑스퍼트 · 내 여행 준비표', board.context.name || '이름 없는 여행', '일정: 일본 현지 시각 Asia/Tokyo (UTC+09:00) · 숙소 비용: 원화(KRW)', overview.hasExample ? '가상 사례의 값이 포함되어 있습니다.' : '직접 입력한 기록입니다.', `계산 기록 ${overview.readyCount}/3 · 여행 가능 여부나 예약 확정 평가가 아닙니다.`, `검토할 숙소 후보: ${overview.chosen?.name || '미선택·계산 미확인'}`, `날짜 순서: ${overview.relation === 'ordered' ? '입력한 날짜 순서 대조됨 · 지리적 연결·예약은 별도 확인' : overview.relation === 'conflict' ? '충돌 확인' : '대조 보류·연결 미확인'}`, ''];
  for (const tool of BOARD_TOOLS) lines.push(`${BOARD_TITLES[tool]} · ${reviews[tool].label}${reviews[tool].record.example ? ' · 가상 사례 포함' : ''}`, ...reviews[tool].lines, '');
  lines.push('추가 확인할 조건', ...overview.tasks.map(task => '- ' + task), '', '미입력 비용은 확정 견적이 아닙니다. 취소 손실은 이용 비용에 더하지 않습니다.', '실시간 운행·좌석·숙소 접수·예약 승인·안전을 보증하지 않습니다.', 'https://shootsense.com/tools/trip-board/');
  return lines.join('\n');
}
export function exampleBoard() {
  return normalizeBoard({ format: 'shootsense-trip-board', version: 1, context: { name: '가상 도쿄 2박', selectedStay: '', sameTrip: false }, records: {
    stay: { state: 'calculated', inputs: TOKYO_COMPARE_INPUTS, example: true },
    arrival: { state: 'calculated', inputs: ARRIVAL_EXAMPLES.direct, example: true },
    departure: { state: 'calculated', inputs: DEPARTURE_EXAMPLE, example: true }
  } });
}
