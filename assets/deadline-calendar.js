import { DateTime, Duration } from './vendor/luxon.js';
import { DEADLINE_ZONES, DEADLINE_KINDS, DEADLINE_PROGRESS, DEADLINE_REMINDERS, MAX_DEADLINE_RECORDS, MAX_DEADLINE_BYTES, emptyDeadlineBook, normalizeDeadline, normalizeDeadlineBook, parseDeadlineBook, resolveDeadline, deadlineViews, deadlineCalendar, deadlineText, exampleDeadlineBook } from './deadline-model.js';

let book = emptyDeadlineBook();
let editingId = null;
const form = document.getElementById('deadline-form');
const rows = document.getElementById('deadline-rows');
const error = document.getElementById('deadline-error');
const message = document.getElementById('deadline-message');
const fileInput = document.getElementById('deadline-file');
const displayZone = document.getElementById('deadline-display-zone');
const filter = document.getElementById('deadline-filter');
const field = name => form.elements.namedItem(name);
const make = (tag, text) => { const node = document.createElement(tag); node.textContent = text; return node; };
function clearDraft() {
  form.reset(); editingId = null; error.textContent = '';
  document.getElementById('deadline-form-title').textContent = '마감 기록 추가';
  document.getElementById('deadline-submit').textContent = '기록 추가';
  document.getElementById('deadline-cancel-edit').hidden = true;
  updateFold();
}
function updateFold(keep = '') {
  const resolved = resolveDeadline({ local: field('local').value, zone: field('zone').value, offset: '' });
  field('offset').replaceChildren(new Option('미확인', ''), ...resolved.choices.map(choice => new Option(choice.label, choice.offset)));
  field('offset').value = resolved.choices.some(choice => choice.offset === keep) ? keep : '';
  document.getElementById('deadline-fold').hidden = !resolved.choices.length;
  document.getElementById('deadline-time-note').textContent = field('local').value && field('zone').value && !resolved.valid ? resolved.issue : '';
}
function edit(record) {
  editingId = record.id; error.textContent = '';
  for (const key of ['label', 'kind', 'local', 'zone', 'progress', 'reminder', 'note']) field(key).value = record[key];
  field('verified').checked = record.verified;
  updateFold(record.offset);
  document.getElementById('deadline-form-title').textContent = record.example ? '가상 기록 편집 · 일정 파일 제외' : '마감 기록 편집';
  document.getElementById('deadline-submit').textContent = '기록 수정';
  document.getElementById('deadline-cancel-edit').hidden = false;
  field('label').focus({ preventScroll: true }); form.scrollIntoView({ block: 'start' });
}
function iconButton(icon, label, callback) {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'ss-deadline-icon'; button.title = label; button.setAttribute('aria-label', label);
  const image = document.createElement('img'); image.src = `/assets/icons/${icon}.svg`; image.alt = ''; image.width = 20; image.height = 20;
  button.append(image); button.addEventListener('click', callback); return button;
}
function render() {
  const now = DateTime.now();
  const views = deadlineViews(book, now);
  const eligible = views.filter(view => view.eligible).length;
  const visible = views.filter(view => filter.value === 'all' || filter.value === 'upcoming' && view.valid && !view.past && view.record.progress !== 'resolved' || filter.value === 'unverified' && (!view.valid || !view.record.verified) || filter.value === 'resolved' && view.record.progress === 'resolved');
  rows.replaceChildren();
  for (const view of visible) {
    const record = view.record;
    const row = document.createElement('tr'); row.dataset.recordId = record.id;
    function cell(label, ...nodes) { const td = document.createElement('td'); td.dataset.label = label; const content = document.createElement('div'); content.append(...nodes); td.append(content); row.append(td); }
    cell('예약·종류', make('strong', record.label), make('p', DEADLINE_KINDS[record.kind] + (record.example ? ' · 가상 사례' : '')), make('small', record.note || '확인 메모 없음'));
    function clock(time, fallback) {
      const p = make('p', time ? time.toFormat('yyyy-MM-dd HH:mm') : fallback);
      if (time) p.append(make('small', `UTC${time.toFormat('ZZ')}`));
      return p;
    }
    let remaining = !view.valid ? '시각 변환 보류' : view.past ? '기기 시계 기준 마감 도달·지남' : '1분 미만 남음 · 기기 시계 기준';
    if (view.valid && !view.past && view.remainingMinutes >= 1) {
      const duration = Duration.fromObject({ minutes: view.remainingMinutes }).shiftTo('days', 'hours', 'minutes');
      remaining = [[duration.days, '일'], [duration.hours, '시간'], [duration.minutes, '분']].filter(([value]) => value > 0).map(([value, unit]) => value.toLocaleString('ko-KR') + unit).join(' ') + ' 남음 · 기기 시계 기준';
    }
    cell('원문 마감', clock(view.time, view.original), make('small', record.zone || '시간대 미확인'));
    cell('함께 볼 시각', clock(view.time?.setZone(book.displayZone), view.converted), make('small', remaining));
    const included = make('p', view.eligible ? '일정 파일 포함 대상' : '일정 파일 제외: ' + view.excluded.join(' · '));
    if (!view.eligible) included.className = 'ss-deadline-exclusion';
    cell('확인·처리', make('p', record.verified ? '사용자가 원문 조건 확인' : '원문 조건 미확인'), make('p', DEADLINE_PROGRESS[record.progress]), make('small', `선택한 알림: ${DEADLINE_REMINDERS[record.reminder]}${view.alarmExpired ? ' · 알림 시각이 지나 파일 알림 제외' : ''}`), included);
    const actions = document.createElement('div'); actions.className = 'ss-deadline-row-actions';
    actions.append(iconButton('pencil', `${record.label} 기록 수정`, () => edit(record)), iconButton('trash', `${record.label} 기록 삭제`, () => {
      if (!window.confirm('이 마감 기록을 삭제할까요? 이미 가져온 캘린더 일정은 별도로 삭제해야 합니다.')) return;
      book.records = book.records.filter(item => item.id !== record.id);
      if (editingId === record.id) clearDraft();
      render(); message.textContent = '기록을 삭제했습니다. 이미 가져온 캘린더 일정은 자동 삭제되지 않습니다.';
    }));
    cell('관리', actions); rows.append(row);
  }
  document.querySelector('.ss-deadline-table').hidden = visible.length === 0;
  document.getElementById('deadline-empty').hidden = visible.length > 0;
  document.getElementById('deadline-empty').textContent = book.records.length ? '현재 보기 조건에 맞는 기록이 없습니다.' : '아직 기록한 마감이 없습니다.';
  document.getElementById('deadline-summary').textContent = `기록 ${views.length}개 · 표시 ${visible.length}개 · 일정 파일 포함 대상 ${eligible}개`;
  document.getElementById('deadline-print-zone').textContent = `함께 볼 시간대: ${DEADLINE_ZONES[book.displayZone]} · ${book.displayZone}. 기기 시계와 브라우저 시간대 정보 기준이며, 표의 필터와 무관하게 일정 파일은 포함 대상 전체를 사용합니다.`;
  document.getElementById('deadline-ics').disabled = eligible === 0;
}
form.addEventListener('submit', event => {
  event.preventDefault(); error.textContent = '';
  try {
    const previous = book.records.find(record => record.id === editingId);
    if (!previous && book.records.length >= MAX_DEADLINE_RECORDS) throw new Error('한 개인 파일에 최대 50개 기록을 보관합니다.');
    const record = normalizeDeadline({ id: previous?.id || crypto.randomUUID(), label: field('label').value, kind: field('kind').value, local: field('local').value, zone: field('zone').value, offset: field('offset').value, progress: field('progress').value, reminder: field('reminder').value, note: field('note').value, verified: field('verified').checked, example: previous?.example || false, revision: previous ? previous.revision + 1 : 0 });
    if (previous) book.records = book.records.map(item => item.id === previous.id ? record : item); else book.records.push(record);
    clearDraft(); render(); message.textContent = previous ? '기록을 수정했습니다. 이미 가져온 일정은 자동 갱신되지 않습니다.' : '마감 기록을 추가했습니다. 포함 대상과 미확인 조건을 확인하세요.';
  } catch (exception) { error.textContent = exception.message; error.focus(); }
});
form.addEventListener('input', event => {
  if (['label', 'kind', 'local', 'zone', 'offset', 'note'].includes(event.target.name)) field('verified').checked = false;
  if (['local', 'zone'].includes(event.target.name)) updateFold();
});
form.addEventListener('change', event => {
  if (['local', 'zone'].includes(event.target.name)) updateFold();
  if (['kind', 'zone', 'offset'].includes(event.target.name)) field('verified').checked = false;
});
document.getElementById('deadline-cancel-edit').addEventListener('click', clearDraft);
displayZone.value = book.displayZone;
displayZone.addEventListener('change', () => { book.displayZone = displayZone.value; render(); });
filter.addEventListener('change', render);
function download(contents, filename, type, bom = true) {
  const url = URL.createObjectURL(new Blob([bom ? '\uFEFF' : '', contents], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.getElementById('deadline-ics').addEventListener('click', () => {
  try { download(deadlineCalendar(book), 'shootsense-reservation-deadlines.ics', 'text/calendar;charset=utf-8', false); message.textContent = '일정 파일을 만들었습니다. 기존 일정과 자동 동기화되지 않으며 앱의 알림 설정을 확인해야 합니다.'; }
  catch (exception) { error.textContent = exception.message; render(); }
});
document.getElementById('deadline-text').addEventListener('click', () => download(deadlineText(book), 'shootsense-reservation-deadlines.txt', 'text/plain;charset=utf-8'));
document.getElementById('deadline-save').addEventListener('click', () => download(JSON.stringify(normalizeDeadlineBook(book), null, 2), 'shootsense-reservation-deadlines.json', 'application/json;charset=utf-8'));
document.getElementById('deadline-print').addEventListener('click', () => { render(); window.print(); });
document.getElementById('deadline-import').addEventListener('click', () => fileInput.click());
const hasInputs = () => book.records.length > 0 || Boolean(field('label').value || field('local').value || field('note').value);
function replaceBook(next) { book = next; clearDraft(); displayZone.value = book.displayZone; filter.value = 'all'; error.textContent = ''; render(); }
fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0]; if (!file) return;
  try {
    if (file.size > MAX_DEADLINE_BYTES) throw new Error('개인 파일은 128KB 이하여야 합니다.');
    const next = parseDeadlineBook(await file.text());
    if (hasInputs() && !window.confirm('개인 파일로 현재 기록과 편집 중인 입력을 바꿀까요? 저장하지 않은 내용은 복구할 수 없습니다.')) return;
    replaceBook(next); message.textContent = '개인 파일을 읽었습니다. 원문 확인 표시는 해제했으며 일정 출력 전 다시 대조해야 합니다.';
  } catch (exception) { error.textContent = exception.message; }
  finally { fileInput.value = ''; }
});
document.getElementById('deadline-example').addEventListener('click', () => {
  if (hasInputs() && !window.confirm('현재 기록과 편집 중인 입력을 가상 사례로 바꿀까요?')) return;
  replaceBook(exampleDeadlineBook()); message.textContent = '가상 사례는 일정 파일에서 제외합니다. 실제 원문의 조건이 아닙니다.';
});
document.getElementById('deadline-clear').addEventListener('click', () => {
  if (!window.confirm('현재 기록과 편집 입력을 모두 비울까요? 이미 가져온 캘린더 일정과 저장 파일은 삭제하지 않습니다.')) return;
  replaceBook(emptyDeadlineBook()); message.textContent = '현재 기록을 비웠습니다. 이전 파일·캘린더 일정은 별도 관리해야 합니다.';
});
for (const control of document.querySelectorAll('.ss-deadline-tool input, .ss-deadline-tool select, .ss-deadline-tool textarea, .ss-deadline-tool button')) control.disabled = false;
render();
setInterval(render, 60000);
