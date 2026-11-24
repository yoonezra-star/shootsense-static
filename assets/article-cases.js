export const STAY_PRICE_EXAMPLE = [
  { name: '가상 숙소 A', room: 75000, fees: 15000, transport: 18000, other: 0, cancellation: 90000, checkin: 'unknown', feesConfirmed: true },
  { name: '가상 숙소 B', room: 91000, fees: 0, transport: 4000, other: 0, cancellation: 0, checkin: 'yes', feesConfirmed: true }
];

export const ARTICLE_CASES = Object.freeze({
  'stay-price': {
    tool: 'stay', route: '/tools/stay-compare/', article: '/honja-yeohaeng-sukso-goreuneun-beop/',
    title: '표시 숙박비가 낮아도 합계는 높아지는 경우', button: '글의 숙소 가상 사례',
    inputs: STAY_PRICE_EXAMPLE
  },
  'arrival-last-service': {
    tool: 'arrival', route: '/tools/arrival-check/', article: '/honja-yeohaeng-junbi-gijun/',
    title: '21:40 항공편 도착과 22:10 교통편의 연결', button: '글의 막차 가상 사례',
    inputs: { mode: 'scheduled', arrival: '2026-12-10T21:40', deadline: '2026-12-10T23:00', airportMinutes: 45, hotelBuffer: 20, serviceDeparture: '2026-12-10T22:10', platformMinutes: 15, boardingBuffer: 10, onwardMinutes: 40 }
  },
  'departure-early-storage': {
    tool: 'departure', route: '/tools/departure-check/', article: '/honja-yeohaeng-achim-routine/',
    title: '짐 회수 완료 마감이 14:30으로 더 이른 경우', button: '글의 이른 회수 가상 사례',
    inputs: { departure: '2026-12-12T16:00', pickupDeadline: '2026-12-12T14:30', plannedLeave: '2026-12-12T14:00', toStorage: 30, pickupMinutes: 10, toPlatform: 35, boardingBuffer: 20, reserve: 15 }
  }
});

export function readArticleCase(hash, tool) {
  const id = new URLSearchParams(String(hash).replace(/^#/, '')).get('case');
  return Object.hasOwn(ARTICLE_CASES, id) && ARTICLE_CASES[id].tool === tool ? ARTICLE_CASES[id] : null;
}

export function mountArticleCase(tool, form) {
  const selected = readArticleCase(location.hash, tool);
  if (!selected) return null;
  const note = document.createElement('aside');
  note.id = 'article-case-note';
  note.className = 'ss-tool-note';
  const heading = document.createElement('p');
  heading.textContent = `글에서 연결한 가상 검산: ${selected.title}`;
  const scope = document.createElement('p');
  scope.textContent = '실제 견적·운행·소요 시간·운영자 회신이 아닙니다. 사례는 아래 가상 사례 버튼을 눌렀을 때만 적용됩니다.';
  const back = document.createElement('a');
  back.href = `${selected.article}#ss-case-walkthrough`;
  back.textContent = '글의 조건과 해석 다시 보기';
  back.target = '_blank';
  back.rel = 'noopener';
  back.title = '새 탭에서 열기';
  note.append(heading, scope, back);
  form.before(note);
  return selected;
}
