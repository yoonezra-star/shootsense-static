import { calculateDeparture, formatPlannerTime, departureText, DEPARTURE_EXAMPLE, PLANNER_FIELDS } from './departure-math.js';

const form = document.getElementById('departure-form');
const resultBlock = document.getElementById('departure-results');
const error = document.getElementById('departure-error');
const inputRecord = document.createElement('details');
inputRecord.className = 'ss-trip-input-record';
const inputSummary = document.createElement('summary');
inputSummary.textContent = '입력 조건과 시간대';
const inputValues = document.createElement('p');
inputRecord.append(inputSummary, inputValues);
document.getElementById('departure-timeline').after(inputRecord);
let recordWasOpen = false;
window.addEventListener('beforeprint', () => { recordWasOpen = inputRecord.open; inputRecord.open = true; });
window.addEventListener('afterprint', () => { inputRecord.open = recordWasOpen; });
let result = null;
let example = false;
const read = () => Object.fromEntries([...form.elements].filter(node => node.name).map(node => [node.name, node.value]));
function textNode(tag, text) { const node = document.createElement(tag); node.textContent = text; return node; }

function render() {
  error.textContent = '';
  try {
    const input = read();
    result = calculateDeparture(input);
    inputValues.textContent = '입력 기준 · 일본 현지 시각 Asia/Tokyo (UTC+09:00). ' + Object.entries(PLANNER_FIELDS).map(([key, label]) => `${label}: ${input[key]?.replace('T', ' ') || '미확인'}${input[key] && !['departure', 'pickupDeadline'].includes(key) ? '분' : ''}`).join(' · ') + ` · 계획한 관광 종료: ${input.plannedLeave?.replace('T', ' ') || '미확인'}`;
    const heading = document.getElementById('departure-result-title');
    heading.textContent = result.complete ? '입력한 조건의 역산 결과' : '확인이 더 필요한 항목';
    document.getElementById('departure-kind').textContent = (example ? '가상 사례의 값이 포함된 계산' : '직접 입력한 값의 계산') + ' · 일본 현지 시각';
    const timeline = document.getElementById('departure-timeline');
    const scenarios = document.getElementById('departure-scenarios');
    timeline.replaceChildren();
    scenarios.replaceChildren();
    document.getElementById('departure-missing').textContent = result.complete ? '' : result.missing.join(' · ');
    document.getElementById('departure-binding').textContent = !result.complete ? '미확인 항목은 0분으로 계산하지 않았습니다.' : result.binding === 'storage' ? '보관처 회수 완료 마감이 더 이릅니다.' : result.binding === 'both' ? '회수 마감과 출발에서 역산한 회수 한계가 같습니다.' : '출발에서 역산한 회수 한계가 더 이릅니다.';
    if (result.complete) {
      for (const [key, label] of Object.entries({ leaveBy: '관광 종료 목표', storageArrival: '보관처 도착 목표', pickupStart: '회수 절차 시작 목표', pickupComplete: '짐 회수 완료 목표', platformArrival: '승차 위치 도착 목표', departure: '교통편 출발' })) {
        const row = document.createElement('li');
        row.append(textNode('span', label), textNode('strong', formatPlannerTime(result.times[key])));
        timeline.append(row);
      }
      if (result.plannedLeaveMissing) scenarios.append(textNode('p', '계획한 관광 종료 시각이 미확인이라 지연 비교는 만들지 않았습니다.'));
      for (const scenario of result.scenarios) {
        const section = document.createElement('section');
        section.append(textNode('h3', scenario.delay ? `관광 종료 ${scenario.delay}분 지연 가정` : '입력한 관광 종료 시각'));
        section.append(textNode('p', `회수 완료 ${formatPlannerTime(scenario.pickupComplete)} · 승차 위치 ${formatPlannerTime(scenario.atPlatform)}`));
        const conditions = [];
        if (scenario.pickupOverrun) conditions.push(`회수 완료 마감 ${scenario.pickupOverrun}분 초과`);
        if (scenario.bufferShortfall) conditions.push(`입력한 승차 전 여유 ${scenario.bufferShortfall}분 부족`);
        if (scenario.atOrAfterDeparture) conditions.push('승차 위치 도착이 출발 시각과 같거나 늦음');
        if (!conditions.length) conditions.push(scenario.slack === 0 ? '역산한 관광 종료 목표와 같음 · 추가 여유 0분' : `역산한 관광 종료 목표 대비 ${scenario.slack}분 여유`);
        section.append(textNode('p', conditions.join(' · ')));
        section.className = conditions.some(value => /초과|부족|늦음/.test(value)) ? 'ss-scenario ss-scenario--conflict' : 'ss-scenario';
        scenarios.append(section);
      }
    }
    resultBlock.hidden = false;
    heading.focus({ preventScroll: true });
    resultBlock.scrollIntoView({ block: 'start', behavior: 'auto' });
  } catch (exception) { result = null; resultBlock.hidden = true; error.textContent = exception.message; }
}
form.addEventListener('submit', event => { event.preventDefault(); render(); });
for (const event of ['input', 'change']) form.addEventListener(event, () => { result = null; resultBlock.hidden = true; error.textContent = ''; });
form.addEventListener('reset', () => { result = null; example = false; resultBlock.hidden = true; error.textContent = ''; });
document.getElementById('departure-example').addEventListener('click', () => {
  const data = { ...DEPARTURE_EXAMPLE, ...(document.getElementById('departure-preset').value === 'early' ? { pickupDeadline: '2026-12-12T14:30' } : {}) };
  for (const [name, value] of Object.entries(data)) form.elements.namedItem(name).value = value;
  example = true;
  render();
});
document.getElementById('departure-download').addEventListener('click', () => {
  if (!result) return;
  const url = URL.createObjectURL(new Blob(['\uFEFF' + departureText(read(), result, example)], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'shootsense-departure-check.txt'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.getElementById('departure-print').addEventListener('click', () => { if (result) window.print(); });
// Keep the static form inert until its local submit handler is attached.
for (const control of form.elements) control.disabled = false;
