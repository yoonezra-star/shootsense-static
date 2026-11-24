import { DateTime } from './vendor/luxon.js';
import ICAL from './vendor/ical.js';

export const DEADLINE_ZONES = {
  'Asia/Seoul': '서울', 'Asia/Tokyo': '도쿄', 'Asia/Bangkok': '방콕', 'Asia/Ho_Chi_Minh': '호찌민', 'Asia/Singapore': '싱가포르', 'Asia/Shanghai': '상하이', 'Asia/Hong_Kong': '홍콩', 'Asia/Taipei': '타이베이', 'Asia/Kolkata': '콜카타', 'Asia/Kathmandu': '카트만두', 'Asia/Dubai': '두바이',
  'Europe/London': '런던', 'Europe/Paris': '파리', 'Europe/Rome': '로마', 'Europe/Berlin': '베를린', 'America/New_York': '뉴욕', 'America/Chicago': '시카고', 'America/Los_Angeles': '로스앤젤레스', 'Pacific/Honolulu': '호놀룰루', 'Australia/Sydney': '시드니', 'Pacific/Auckland': '오클랜드', UTC: 'UTC'
};
export const DEADLINE_KINDS = { cancellation: '취소 마감', change: '변경 마감' };
export const DEADLINE_PROGRESS = { open: '미처리', requested: '요청 전달 · 처리 미확인', resolved: '처리 완료 회신 확인' };
export const DEADLINE_REMINDERS = { 0: '없음', 60: '1시간 전', 360: '6시간 전', 1440: '24시간 전' };
export const MAX_DEADLINE_RECORDS = 50;
export const MAX_DEADLINE_BYTES = 131072;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const localString = time => time.toFormat("yyyy-MM-dd'T'HH:mm");
function text(value, max, required = false, multiline = false) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string' || value.length > max || (multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/ : /[\u0000-\u001F\u007F]/).test(value)) throw new Error('이름·메모의 형식이나 길이를 확인해 주세요.');
  if (required && !value.trim()) throw new Error('예약을 구분할 이름을 입력해 주세요.');
  return (multiline ? value.replace(/\r\n?/g, '\n') : value).trim();
}
export function normalizeDeadline(value) {
  if (!isObject(value) || typeof value.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(value.id)) throw new Error('기록 식별자가 올바르지 않습니다.');
  if (!Object.hasOwn(DEADLINE_KINDS, value.kind) || !Object.hasOwn(DEADLINE_PROGRESS, value.progress)) throw new Error('마감 종류·처리 상태를 확인해 주세요.');
  if (typeof value.verified !== 'boolean' || typeof value.example !== 'boolean') throw new Error('확인 상태가 올바르지 않습니다.');
  const zone = text(value.zone, 64);
  if (zone && !Object.hasOwn(DEADLINE_ZONES, zone)) throw new Error('지원하는 원문 시간대를 선택해 주세요.');
  const local = text(value.local, 16);
  if (local) {
    const calendar = DateTime.fromISO(local, { zone: 'UTC' });
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) || !calendar.isValid || localString(calendar) !== local) throw new Error('올바른 날짜·시각을 입력해 주세요. 24시는 다음 날짜 00:00으로 입력합니다.');
  }
  const offset = value.offset === undefined || value.offset === null ? '' : String(value.offset);
  if (offset && (!/^-?\d{1,3}$/.test(offset) || Number(offset) < -840 || Number(offset) > 840)) throw new Error('UTC 오프셋 선택이 올바르지 않습니다.');
  const reminder = Number(value.reminder);
  if (!Object.hasOwn(DEADLINE_REMINDERS, reminder)) throw new Error('일정 알림 간격을 선택해 주세요.');
  const revision = value.revision ?? 0;
  if (!Number.isSafeInteger(revision) || revision < 0 || revision > 1000000) throw new Error('기록 버전이 올바르지 않습니다.');
  return { id: value.id, label: text(value.label, 60, true), kind: value.kind, local, zone, offset, verified: value.verified, progress: value.progress, reminder, note: text(value.note, 400, false, true), example: value.example, revision };
}
export function normalizeDeadlineBook(value) {
  if (!isObject(value) || value.format !== 'shootsense-reservation-deadlines' || value.version !== 1 || !Array.isArray(value.records) || value.records.length > MAX_DEADLINE_RECORDS || !Object.hasOwn(DEADLINE_ZONES, value.displayZone)) throw new Error('지원하는 예약 마감 파일이 아닙니다. 최대 50개 기록을 보관합니다.');
  const records = value.records.map(normalizeDeadline);
  if (new Set(records.map(record => record.id)).size !== records.length) throw new Error('파일의 기록 식별자가 중복되었습니다.');
  return { format: value.format, version: 1, displayZone: value.displayZone, records };
}
export const emptyDeadlineBook = () => ({ format: 'shootsense-reservation-deadlines', version: 1, displayZone: 'Asia/Seoul', records: [] });
export function parseDeadlineBook(raw) {
  if (new TextEncoder().encode(raw).length > MAX_DEADLINE_BYTES) throw new Error('개인 파일은 128KB 이하여야 합니다.');
  let value;
  try { value = JSON.parse(raw.replace(/^\uFEFF/, '')); } catch { throw new Error('JSON 개인 파일을 읽을 수 없습니다.'); }
  const book = normalizeDeadlineBook(value);
  for (const record of book.records) record.verified = false;
  return book;
}
export function resolveDeadline(record) {
  if (!record.local || !record.zone) return { valid: false, issue: '원문 날짜·시각 또는 시간대 미확인', choices: [], time: null };
  const local = DateTime.fromISO(record.local, { zone: record.zone });
  if (!local.isValid || localString(local) !== record.local) return { valid: false, issue: '해당 시간대에 존재하지 않는 시각입니다. 원문을 다시 확인하세요.', choices: [], time: null };
  const possible = local.getPossibleOffsets();
  const choices = possible.map(time => ({ offset: String(time.offset), label: `UTC${time.toFormat('ZZ')} · ${time.offsetNameShort}`, utc: time.toUTC().toISO() }));
  if (possible.length > 1 && record.offset === '') return { valid: false, issue: '서머타임 종료로 같은 시각이 두 번 나타납니다. 원문의 UTC 오프셋을 확인하세요.', choices, time: null };
  const selected = record.offset === '' ? local : possible.find(time => String(time.offset) === record.offset);
  if (!selected) return { valid: false, issue: '선택한 UTC 오프셋이 날짜·시간대와 다릅니다. 다시 확인하세요.', choices, time: null };
  return { valid: true, issue: '', choices: possible.length > 1 ? choices : [], time: selected };
}
export function inspectDeadline(raw, displayZone = 'Asia/Seoul', now = DateTime.now()) {
  const record = normalizeDeadline(raw);
  if (!Object.hasOwn(DEADLINE_ZONES, displayZone) || !DateTime.isDateTime(now) || !now.isValid) throw new Error('보기 시간대·기기 시각을 확인해 주세요.');
  const resolved = resolveDeadline(record);
  const past = resolved.valid && resolved.time.toMillis() <= now.toMillis();
  const excluded = [];
  if (!resolved.valid) excluded.push(resolved.issue);
  if (!record.verified) excluded.push('원문 마감 조건 미확인');
  if (record.example) excluded.push('가상 사례');
  if (record.progress === 'resolved') excluded.push('처리 완료 기록');
  if (past) excluded.push('기기 시각 기준 마감 도달·지남');
  const formatted = time => `${time.toFormat('yyyy-MM-dd HH:mm')} UTC${time.toFormat('ZZ')}`;
  const alarmTime = resolved.valid && record.reminder > 0 ? resolved.time.minus({ minutes: record.reminder }) : null;
  const alarmExpired = Boolean(alarmTime && alarmTime.toMillis() <= now.toMillis());
  return { record, ...resolved, past, eligible: excluded.length === 0, excluded, alarmExpired, alarmEligible: excluded.length === 0 && Boolean(alarmTime) && !alarmExpired, original: resolved.valid ? formatted(resolved.time) : record.local.replace('T', ' ') || '미확인', converted: resolved.valid ? formatted(resolved.time.setZone(displayZone)) : '변환 보류', remainingMinutes: resolved.valid ? Math.floor(resolved.time.diff(now, 'minutes').minutes) : null };
}
export function deadlineViews(book, now = DateTime.now()) {
  const clean = normalizeDeadlineBook(book);
  return clean.records.map(record => inspectDeadline(record, clean.displayZone, now)).sort((a, b) => (a.time?.toMillis() ?? Infinity) - (b.time?.toMillis() ?? Infinity));
}
export function deadlineCalendar(book, now = DateTime.now()) {
  const views = deadlineViews(book, now).filter(view => view.eligible);
  if (!views.length) throw new Error('확인된 미래 마감 중 처리 미완료인 실제 기록이 없습니다.');
  const calendar = new ICAL.Component('vcalendar');
  calendar.updatePropertyWithValue('prodid', '-//ShootSense//Reservation Deadlines//KO');
  calendar.updatePropertyWithValue('version', '2.0');
  calendar.updatePropertyWithValue('calscale', 'GREGORIAN');
  const utcTime = time => ICAL.Time.fromDateTimeString(time.toUTC().toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'"));
  for (const view of views) {
    const { record } = view;
    const event = new ICAL.Component('vevent');
    event.updatePropertyWithValue('uid', record.id + '@shootsense.com');
    event.updatePropertyWithValue('sequence', record.revision);
    event.updatePropertyWithValue('dtstamp', utcTime(now));
    event.updatePropertyWithValue('dtstart', utcTime(view.time));
    event.updatePropertyWithValue('summary', `${record.label} · ${DEADLINE_KINDS[record.kind]}`);
    event.updatePropertyWithValue('description', `사용자가 입력·확인한 마감 기록입니다. 예약 변경·취소 요청을 실행하지 않습니다.\n원문: ${view.original} (${record.zone})\n보기: ${view.converted} (${book.displayZone})\n처리: ${DEADLINE_PROGRESS[record.progress]}\n파일 알림: ${view.alarmEligible ? DEADLINE_REMINDERS[record.reminder] : view.alarmExpired ? '선택한 알림 시각이 지나 제외' : '없음'}\n확인 메모: ${record.note || '없음'}\n가져온 일정은 이 사이트와 자동 동기화되지 않습니다. 일정 화면의 표시 길이는 유예시간이 아닙니다.`);
    event.updatePropertyWithValue('class', 'PRIVATE');
    event.updatePropertyWithValue('transp', 'TRANSPARENT');
    if (view.alarmEligible) {
      const alarm = new ICAL.Component('valarm');
      alarm.updatePropertyWithValue('action', 'DISPLAY');
      alarm.updatePropertyWithValue('description', `${record.label} · 원문 조건과 처리 여부 확인`);
      alarm.updatePropertyWithValue('trigger', ICAL.Duration.fromSeconds(-record.reminder * 60));
      event.addSubcomponent(alarm);
    }
    calendar.addSubcomponent(event);
  }
  return calendar.toString() + '\r\n';
}
export function deadlineText(book, now = DateTime.now()) {
  const views = deadlineViews(book, now);
  const lines = ['여행정보엑스퍼트 · 예약 변경·취소 마감표', `함께 보는 시간대: ${book.displayZone}`, '기기 시계 기준 표시 · 실제 변경·취소 실행이나 권리 판단이 아닙니다.', ''];
  for (const view of views) lines.push(`${view.record.label} · ${DEADLINE_KINDS[view.record.kind]}${view.record.example ? ' · 가상 사례' : ''}`, `원문: ${view.original} (${view.record.zone || '시간대 미확인'})`, `보기: ${view.converted}`, `확인: ${view.record.verified ? '사용자가 원문 조건 확인' : '미확인'} · 처리: ${DEADLINE_PROGRESS[view.record.progress]}`, `일정 파일: ${view.eligible ? '포함 대상' : '제외 · ' + view.excluded.join(' · ')}`, `확인 메모: ${view.record.note || '없음'}`, '');
  lines.push('마감이 지났다는 표시는 실제 취소·환불 가능 여부의 판정이 아닙니다.', '가져온 캘린더 일정은 자동 갱신되지 않습니다. 알림 동작은 캘린더 앱 설정에 따릅니다.', 'https://shootsense.com/tools/reservation-deadlines/');
  return lines.join('\n');
}
export function exampleDeadlineBook() {
  return normalizeDeadlineBook({ ...emptyDeadlineBook(), records: [
    { id: 'example-tokyo', label: '도쿄 숙소 가상 A', kind: 'cancellation', local: '2026-12-10T12:00', zone: 'Asia/Tokyo', offset: '', verified: true, progress: 'open', reminder: 0, note: '실제 상품의 취소 조건이 아닌 입력 사례', example: true, revision: 0 },
    { id: 'example-newyork', label: '뉴욕 숙소 가상 B', kind: 'change', local: '2027-11-07T01:30', zone: 'America/New_York', offset: '', verified: false, progress: 'requested', reminder: 0, note: '서머타임 중복 시각과 요청 전달 상태를 구분하는 사례', example: true, revision: 0 }
  ] });
}
