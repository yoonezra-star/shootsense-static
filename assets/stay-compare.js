import { compareStays, stayTotalLabel, stayComparisonSummary } from './stay-math.js';
import { TOKYO_COMPARE_INPUTS } from './tokyo-stay-case.js';
import { installToolBoardBridge } from './tool-board-bridge.js';
import { STAY_PRICE_EXAMPLE, mountArticleCase } from './article-cases.js';

const form = document.getElementById('stay-compare-form');
const results = document.getElementById('comparison-results');
const error = document.getElementById('comparison-error');
const format = new Intl.NumberFormat('ko-KR');
const won = value => `${format.format(value)}원`;
let comparison = null;
let example = false;
const tokyoExample = new URLSearchParams(location.search).get('example') === 'tokyo-2026';
const articleCase = tokyoExample ? null : mountArticleCase('stay', form);
if (articleCase) document.getElementById('load-example').textContent = articleCase.button;
if (tokyoExample) {
  document.getElementById('load-example').textContent = '도쿄 2박 가상 사례';
  const note = document.createElement('p');
  note.className = 'ss-tool-note';
  note.textContent = '도쿄 분석의 설명용 환산 가정: 1엔=10원. 실제 환율·객실 견적이 아니며 취소·체크인·추가비용 확인 상태는 미확인입니다.';
  form.before(note);
}

function read() {
  return ['a', 'b'].map(id => {
    const group = form.querySelector(`[data-stay="${id}"]`);
    const value = key => group.querySelector(`[data-field="${key}"]`).value;
    return {
      name: value('name'), room: value('room'), fees: value('fees'), transport: value('transport'),
      other: value('other'), cancellation: value('cancellation'), checkin: value('checkin'),
      feesConfirmed: group.querySelector('[data-field="feesConfirmed"]').checked
    };
  });
}

const boardBridge = installToolBoardBridge({ tool: 'stay', read, restore(record) {
  form.reset();
  record.inputs.forEach((stay, index) => {
    const group = form.querySelector(`[data-stay="${index === 0 ? 'a' : 'b'}"]`);
    for (const [key, value] of Object.entries(stay)) {
      const field = group.querySelector(`[data-field="${key}"]`);
      if (key === 'feesConfirmed') field.checked = value; else field.value = value;
    }
  });
  example = record.example;
  if (record.state === 'calculated') calculate();
} });

function calculate() {
  error.textContent = '';
  try {
    comparison = compareStays(read());
    const largest = Math.max(1, ...comparison.stays.map(stay => stay.total));
    for (const stay of comparison.stays) {
      const block = results.querySelector(`[data-result="${stay.id}"]`);
      block.querySelector('[data-output="name"]').textContent = stay.name;
      block.querySelector('[data-output="total"]').textContent = won(stay.total);
      block.querySelector('.ss-home-note').textContent = stayTotalLabel(stay);
      for (const key of ['room', 'fees', 'transport', 'other']) block.querySelector(`[data-output="${key}"]`).textContent = stay.costs[key] === null ? '미확인' : won(stay.costs[key]);
      block.querySelector('[data-output="cancellation"]').textContent = stay.cancellation === null ? '미확인' : won(stay.cancellation);
      block.querySelector('[data-output="flags"]').textContent = stay.flags.length ? stay.flags.join(' · ') : '추가비용·도착 시각 체크인: 확인함';
      const meter = block.querySelector('meter');
      meter.hidden = !comparison.completeCosts;
      meter.max = largest;
      meter.value = stay.total;
      meter.setAttribute('aria-label', `${stay.name} 입력 합계 ${won(stay.total)}`);
    }
    document.getElementById('comparison-summary').textContent = stayComparisonSummary(comparison);
    document.getElementById('comparison-kind').textContent = example ? '가상 사례의 값이 포함된 비교' : '직접 입력한 값의 비교';
    results.hidden = false;
    document.getElementById('comparison-result-title').focus({ preventScroll: true });
    results.scrollIntoView({ behavior: 'auto', block: 'start' });
    boardBridge.publish('calculated', example);
  } catch (exception) {
    comparison = null;
    results.hidden = true;
    error.textContent = exception.message;
    boardBridge.publish('error', example);
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  calculate();
});
form.addEventListener('input', () => { comparison = null; results.hidden = true; error.textContent = ''; boardBridge.publish('dirty', example); });
form.addEventListener('change', () => { comparison = null; results.hidden = true; boardBridge.publish('dirty', example); });
form.addEventListener('reset', () => {
  comparison = null;
  example = false;
  results.hidden = true;
  error.textContent = '';
  boardBridge.reset();
});

document.getElementById('load-example').addEventListener('click', () => {
  const data = tokyoExample ? TOKYO_COMPARE_INPUTS : articleCase?.inputs || STAY_PRICE_EXAMPLE;
  data.forEach((stay, index) => {
    const group = form.querySelector(`[data-stay="${index === 0 ? 'a' : 'b'}"]`);
    for (const [key, value] of Object.entries(stay)) group.querySelector(`[data-field="${key}"]`).value = value;
    group.querySelector('[data-field="feesConfirmed"]').checked = stay.feesConfirmed ?? true;
  });
  example = true;
  calculate();
});

document.getElementById('print-comparison').addEventListener('click', () => { if (comparison) window.print(); });
document.getElementById('download-comparison').addEventListener('click', () => {
  if (!comparison) return;
  const lines = ['여행정보엑스퍼트 · 숙소 총비용 비교표', example ? '가상 사례의 값이 포함된 비교' : '직접 입력한 값의 비교', '모든 금액: 원화(KRW), 입력한 예약 기간 전체 기준', ''];
  for (const stay of comparison.stays) {
    const cost = key => stay.costs[key] === null ? '미확인' : won(stay.costs[key]);
    lines.push(stay.name, `숙박비: ${cost('room')}`, `별도 추가금: ${cost('fees')}`, `교통비: ${cost('transport')}`, `기타 비용: ${cost('other')}`, `${stayTotalLabel(stay)}: ${won(stay.total)}`, `취소 시 손실: ${stay.cancellation === null ? '미확인' : won(stay.cancellation)}`, `확인 상태: ${stay.flags.join(' · ') || '추가비용·체크인 확인함'}`, '');
  }
  lines.push(stayComparisonSummary(comparison));
  lines.push('취소 손실은 이용 시 합계에 더하지 않습니다.', '금액 차이는 안전성·숙소 품질·예약 가능 여부의 평가가 아닙니다.', 'https://shootsense.com/tools/stay-compare/');
  const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'shootsense-stay-comparison.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
