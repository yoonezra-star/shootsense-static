import { calculateArrival, arrivalConditions, arrivalText, arrivalFields, ARRIVAL_LABELS, ARRIVAL_EXAMPLES } from './arrival-math.js';
import { formatPlannerTime } from './departure-math.js';
import { installToolBoardBridge } from './tool-board-bridge.js';
import { mountArticleCase } from './article-cases.js';

const form = document.getElementById('arrival-form');
const resultBlock = document.getElementById('arrival-results');
const error = document.getElementById('arrival-error');
const record = document.getElementById('arrival-input-record');
const articleCase = mountArticleCase('arrival', form);
if (articleCase) {
  const option = new Option(articleCase.button, 'article');
  document.getElementById('arrival-preset').append(option);
  document.getElementById('arrival-preset').value = 'article';
}
let result = null;
let example = false;
let recordWasOpen = false;
const read = () => Object.fromEntries(new FormData(form));
const node = (tag, text) => { const element = document.createElement(tag); element.textContent = text; return element; };
function syncMode(mode = form.elements.namedItem('mode').value) {
  for (const [id, active] of [['arrival-direct-fields', mode === 'direct'], ['arrival-scheduled-fields', mode === 'scheduled']]) {
    const fieldset = document.getElementById(id);
    fieldset.hidden = !active;
    fieldset.disabled = !active;
  }
}
function stale() { result = null; resultBlock.hidden = true; error.textContent = ''; }
const boardBridge = installToolBoardBridge({ tool: 'arrival', read, restore(record) {
  form.reset();
  for (const [key, value] of Object.entries(record.inputs)) form.elements.namedItem(key).value = value;
  example = record.example; syncMode();
  if (record.state === 'calculated') render();
} });
function render() {
  error.textContent = '';
  try {
    const input = read();
    result = calculateArrival(input);
    const title = document.getElementById('arrival-result-title');
    title.textContent = result.complete ? '입력한 도착 조건의 계산' : '확인이 더 필요한 항목';
    document.getElementById('arrival-kind').textContent = (example ? '가상 사례의 값이 포함된 계산' : '직접 입력한 값의 계산') + ' · 일본 현지 시각';
    document.getElementById('arrival-missing').textContent = result.missing.join(' · ');
    const timeline = document.getElementById('arrival-timeline');
    const scenarios = document.getElementById('arrival-scenarios');
    timeline.replaceChildren(); scenarios.replaceChildren();
    document.getElementById('arrival-input-values').textContent = '일본 현지 시각 · Asia/Tokyo (UTC+09:00). ' + (result.mode === 'scheduled' ? '출발 시각 지정. ' : '이동시간 합산. ') + arrivalFields(result.mode).map(key => `${ARRIVAL_LABELS[key]}: ${input[key]?.replace('T', ' ') || '미확인'}${input[key] && !['arrival', 'deadline', 'serviceDeparture'].includes(key) ? '분' : ''}`).join(' · ');
    document.getElementById('arrival-verdict').textContent = !result.complete ? '미확인 항목은 0분으로 계산하지 않았습니다.' : result.mode === 'direct' ? `입력한 숙소 여유 기준 항공편 도착 역산 목표: ${formatPlannerTime(result.latestArrivalTarget)}. 교통편 출발·운행 조건은 별도 미확인입니다.` : `해당편 탑승 전 여유 기준 항공편 도착 역산 목표: ${formatPlannerTime(result.latestArrivalTarget)}. ${result.scheduleHotelConflict ? '해당편을 타더라도 입력한 숙소 도착 여유 조건과 맞지 않습니다.' : '숙소 도착은 해당편 탑승과 입력한 이후 이동시간을 가정합니다.'}`;
    document.getElementById('arrival-scenario-title').hidden = !result.complete;
    if (result.complete) {
      const base = result.scenarios[0];
      const times = [['항공편 도착 가정', base.arrival], ['입국·짐 수령·세관 통과 가정', base.airportReady], ...(base.boardingArrival ? [['승차 위치 도착 가정', base.boardingArrival], ['지정 교통편 출발', base.serviceDeparture]] : []), ['숙소 접수처 도착 가정', base.hotelArrival], ['숙소 마감 전 여유를 뺀 목표', result.hotelTarget], ['입력한 숙소 도착 마감', result.deadline]];
      for (const [label, time] of times) { const row = document.createElement('li'); row.append(node('span', label), node('strong', time ? formatPlannerTime(time) : '계산 보류')); timeline.append(row); }
      for (const scenario of result.scenarios) {
        const section = document.createElement('section');
        section.className = 'ss-scenario' + (scenario.atOrAfterService || scenario.atOrAfterDeadline || scenario.boardingMargin < 0 || scenario.hotelMargin < 0 ? ' ss-scenario--conflict' : '');
        section.append(node('h3', scenario.delay ? `항공편 도착 ${scenario.delay}분 지연 가정` : '입력한 항공편 도착 시각'));
        section.append(node('p', `입국·짐·세관 통과 ${formatPlannerTime(scenario.airportReady)}`));
        if (scenario.boardingArrival) section.append(node('p', `승차 위치 ${formatPlannerTime(scenario.boardingArrival)}`));
        section.append(node('p', scenario.hotelArrival ? `숙소 접수처 ${formatPlannerTime(scenario.hotelArrival)}${result.mode === 'scheduled' ? ' · 해당편 탑승 가정' : ''}` : '숙소 도착 계산 보류 · 해당편 이후 대안 미확인'));
        section.append(node('p', arrivalConditions(scenario).join(' · ')));
        scenarios.append(section);
      }
    }
    resultBlock.hidden = false;
    title.focus({ preventScroll: true });
    resultBlock.scrollIntoView({ block: 'start', behavior: 'auto' });
    boardBridge.publish('calculated', example);
  } catch (exception) { stale(); error.textContent = exception.message; boardBridge.publish('error', example); }
}
form.addEventListener('submit', event => { event.preventDefault(); render(); });
for (const event of ['input', 'change']) form.addEventListener(event, () => { stale(); syncMode(); boardBridge.publish('dirty', example); });
// Reset fires before the native radio defaults are restored.
form.addEventListener('reset', () => { stale(); example = false; record.open = false; syncMode('direct'); boardBridge.reset(); });
document.getElementById('arrival-example').addEventListener('click', () => {
  const preset = document.getElementById('arrival-preset').value;
  const data = preset === 'article' ? articleCase.inputs : ARRIVAL_EXAMPLES[preset];
  form.reset();
  for (const [key, value] of Object.entries(data)) form.elements.namedItem(key).value = value;
  example = true; syncMode(); render();
});
document.getElementById('arrival-download').addEventListener('click', () => {
  if (!result) return;
  const url = URL.createObjectURL(new Blob(['\uFEFF' + arrivalText(read(), result, example)], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'shootsense-arrival-check.txt'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.getElementById('arrival-print').addEventListener('click', () => { if (result) window.print(); });
window.addEventListener('beforeprint', () => { recordWasOpen = record.open; record.open = true; });
window.addEventListener('afterprint', () => { record.open = recordWasOpen; });
// The static form cannot submit private dates before local handlers are ready.
for (const control of form.elements) control.disabled = false;
syncMode();
