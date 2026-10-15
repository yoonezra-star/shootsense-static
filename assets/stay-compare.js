import { compareStays } from './stay-math.js';

const form = document.getElementById('stay-compare-form');
const results = document.getElementById('comparison-results');
const error = document.getElementById('comparison-error');
const format = new Intl.NumberFormat('ko-KR');
const won = value => `${format.format(value)}원`;
let comparison = null;
let example = false;

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

function calculate() {
  error.textContent = '';
  try {
    comparison = compareStays(read());
    const largest = Math.max(1, ...comparison.stays.map(stay => stay.total));
    for (const stay of comparison.stays) {
      const block = results.querySelector(`[data-result="${stay.id}"]`);
      block.querySelector('[data-output="name"]').textContent = stay.name;
      block.querySelector('[data-output="total"]').textContent = won(stay.total);
      for (const key of ['room', 'fees', 'transport', 'other']) block.querySelector(`[data-output="${key}"]`).textContent = won(stay.costs[key]);
      block.querySelector('[data-output="cancellation"]').textContent = stay.cancellation === null ? '미확인' : won(stay.cancellation);
      block.querySelector('[data-output="flags"]').textContent = stay.flags.length ? stay.flags.join(' · ') : '추가비용·도착 시각 체크인: 확인함';
      const meter = block.querySelector('meter');
      meter.max = largest;
      meter.value = stay.total;
      meter.setAttribute('aria-label', `${stay.name} 입력 합계 ${won(stay.total)}`);
    }
    const lower = comparison.stays.find(stay => stay.id === comparison.lowerCostId);
    const summary = lower ? `입력한 비용 합계는 ${lower.name}이 ${won(comparison.difference)} 적습니다.` : '두 숙소의 입력 비용 합계가 같습니다.';
    document.getElementById('comparison-summary').textContent = summary;
    document.getElementById('comparison-kind').textContent = example ? '가상 사례의 값이 포함된 비교' : '직접 입력한 값의 비교';
    results.hidden = false;
    document.getElementById('comparison-result-title').focus({ preventScroll: true });
    results.scrollIntoView({ behavior: 'auto', block: 'start' });
  } catch (exception) {
    comparison = null;
    results.hidden = true;
    error.textContent = exception.message;
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  calculate();
});
form.addEventListener('input', () => { comparison = null; results.hidden = true; error.textContent = ''; });
form.addEventListener('change', () => { comparison = null; results.hidden = true; });
form.addEventListener('reset', () => {
  comparison = null;
  example = false;
  results.hidden = true;
  error.textContent = '';
});

document.getElementById('load-example').addEventListener('click', () => {
  const data = [
    { name: '가상 숙소 A', room: 75000, fees: 15000, transport: 18000, other: 0, cancellation: 90000, checkin: 'unknown' },
    { name: '가상 숙소 B', room: 91000, fees: 0, transport: 4000, other: 0, cancellation: 0, checkin: 'yes' }
  ];
  data.forEach((stay, index) => {
    const group = form.querySelector(`[data-stay="${index === 0 ? 'a' : 'b'}"]`);
    for (const [key, value] of Object.entries(stay)) group.querySelector(`[data-field="${key}"]`).value = value;
    group.querySelector('[data-field="feesConfirmed"]').checked = true;
  });
  example = true;
  calculate();
});

document.getElementById('print-comparison').addEventListener('click', () => { if (comparison) window.print(); });
document.getElementById('download-comparison').addEventListener('click', () => {
  if (!comparison) return;
  const lines = ['여행정보엑스퍼트 · 숙소 총비용 비교표', example ? '가상 사례의 값이 포함된 비교' : '직접 입력한 값의 비교', '모든 금액: 원화(KRW), 입력한 예약 기간 전체 기준', ''];
  for (const stay of comparison.stays) {
    lines.push(stay.name, `숙박비: ${won(stay.costs.room)}`, `별도 추가금: ${won(stay.costs.fees)}`, `교통비: ${won(stay.costs.transport)}`, `기타 비용: ${won(stay.costs.other)}`, `이용 시 입력 합계: ${won(stay.total)}`, `취소 시 손실: ${stay.cancellation === null ? '미확인' : won(stay.cancellation)}`, `확인 상태: ${stay.flags.join(' · ') || '추가비용·체크인 확인함'}`, '');
  }
  lines.push('취소 손실은 이용 시 합계에 더하지 않습니다.', '금액 차이는 안전성·숙소 품질·예약 가능 여부의 평가가 아닙니다.', 'https://shootsense.com/tools/stay-compare/');
  const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'shootsense-stay-comparison.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
