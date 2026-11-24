import { BOARD_TOOLS, BOARD_TITLES, MAX_BOARD_BYTES, normalizeToolRecord, normalizeBoard, emptyBoard, boardOverview, boardText, parseBoardFile, exampleBoard } from './trip-board-model.js';

let board = emptyBoard();
const frames = Object.fromEntries(BOARD_TOOLS.map(tool => [tool, document.getElementById(`board-frame-${tool}`)]));
const revisions = Object.fromEntries(BOARD_TOOLS.map(tool => [tool, 0]));
const ready = new Set();
const contextName = document.getElementById('board-name');
const contextStay = document.getElementById('board-stay');
const contextSameTrip = document.getElementById('board-same-trip');
const message = document.getElementById('board-message');
const error = document.getElementById('board-error');
const fileInput = document.getElementById('board-file');
const tabs = [...document.querySelectorAll('.ss-board-tabs [role=tab]')];
const textNode = (tag, text) => { const node = document.createElement(tag); node.textContent = text; return node; };
function openPanel(key, focus = true) {
  for (const tab of tabs) {
    const active = tab.id === `board-tab-${key}`;
    tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    if (active && focus) tab.focus();
  }
}
for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => openPanel(tab.id.replace('board-tab-', '')));
  tab.addEventListener('keydown', event => {
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
    if (next !== null) { event.preventDefault(); openPanel(tabs[next].id.replace('board-tab-', '')); }
  });
}
for (const button of document.querySelectorAll('[data-open-tool]')) button.addEventListener('click', () => openPanel(button.dataset.openTool));
function render() {
  const overview = boardOverview(board);
  contextName.value = board.context.name; contextStay.value = board.context.selectedStay;
  if (!overview.canLink) board.context.sameTrip = false;
  contextSameTrip.checked = board.context.sameTrip; contextSameTrip.disabled = !overview.canLink;
  document.getElementById('board-count').textContent = `계산 기록 ${overview.readyCount}/3 · 여행 가능 점수가 아닙니다.`;
  document.getElementById('board-report-title').textContent = board.context.name || '이번 여행 준비표';
  document.getElementById('board-example-note').textContent = overview.hasExample ? '가상 사례의 값이 포함된 준비표 · 실제 예약·환율·운행 확인 기록이 아닙니다.' : '직접 입력한 기록 · 실제 운행·예약·접수는 별도 확인';
  document.getElementById('board-selection').textContent = `검토할 숙소 후보: ${overview.chosen?.name || '미선택·계산 미확인'}`;
  for (const tool of BOARD_TOOLS) {
    const stage = document.querySelector(`[data-board-stage=${tool}]`);
    const review = overview.reviews[tool];
    stage.querySelector('[data-stage-status]').textContent = review.label + (review.record.example ? ' · 가상 사례 포함' : '');
    stage.querySelector('[data-stage-lines]').replaceChildren(...review.lines.map(line => textNode('p', line)));
  }
  document.getElementById('board-relation').textContent = overview.relation === 'ordered' ? '입력한 날짜 순서를 대조했습니다. 지리적 연결·예약·실제 운행을 확인한 것은 아닙니다.' : overview.relation === 'conflict' ? '입력한 도착일·출발일 순서에 충돌이 있습니다.' : '같은 여행·숙소의 연결이 미확인되었거나 날짜 대조가 보류되었습니다.';
  document.getElementById('board-tasks').replaceChildren(...overview.tasks.map(task => textNode('li', task)));
}
function post(tool, payload) { frames[tool].contentWindow.postMessage({ ...payload, tool, version: 1 }, location.origin); }
function restore(tool) { revisions[tool]++; post(tool, { type: 'shootsense:restore', revision: revisions[tool], record: board.records[tool] }); }
window.addEventListener('message', event => {
  const data = event.data;
  if (event.origin !== location.origin || !data || data.version !== 1 || !BOARD_TOOLS.includes(data.tool) || event.source !== frames[data.tool].contentWindow) return;
  const tool = data.tool;
  if (data.type === 'shootsense:tool-ready') {
    ready.add(tool); frames[tool].dataset.ready = 'true';
    document.querySelector(`[data-loading=${tool}]`).hidden = true;
    restore(tool);
  }
  if (data.type === 'shootsense:height' && Number.isFinite(data.height)) frames[tool].style.height = `${Math.max(320, Math.min(12000, data.height))}px`;
  if (data.type === 'shootsense:tool-state' && data.revision === revisions[tool]) {
    try {
      const record = normalizeToolRecord(tool, data.record);
      if (JSON.stringify(record.inputs) !== JSON.stringify(board.records[tool].inputs)) board.context.sameTrip = false;
      board.records[tool] = record; render();
    } catch { error.textContent = `${BOARD_TITLES[tool]} 기록을 읽지 못했습니다. 입력을 확인해 주세요.`; }
  }
});
contextName.addEventListener('input', () => { board.context.name = contextName.value; render(); });
contextStay.addEventListener('change', () => { board.context.selectedStay = contextStay.value; board.context.sameTrip = false; render(); });
contextSameTrip.addEventListener('change', () => { board.context.sameTrip = contextSameTrip.checked; render(); });
function download(contents, filename, type) {
  const url = URL.createObjectURL(new Blob(['\uFEFF' + contents], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.getElementById('board-download').addEventListener('click', () => download(boardText(board), 'shootsense-trip-summary.txt', 'text/plain;charset=utf-8'));
document.getElementById('board-save').addEventListener('click', () => download(JSON.stringify(normalizeBoard(board), null, 2), 'shootsense-trip-board.json', 'application/json;charset=utf-8'));
document.getElementById('board-print').addEventListener('click', () => { render(); window.print(); });
document.getElementById('board-import').addEventListener('click', () => fileInput.click());
const hasData = () => JSON.stringify(board) !== JSON.stringify(emptyBoard());
function replaceBoard(next) {
  board = next; error.textContent = ''; render();
  for (const tool of ready) restore(tool);
  openPanel('summary');
}
fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;
  try {
    if (file.size > MAX_BOARD_BYTES) throw new Error('준비판 파일은 64KB 이하여야 합니다.');
    const next = parseBoardFile(await file.text());
    if (hasData() && !window.confirm('파일의 내용으로 현재 준비판을 바꿀까요? 저장하지 않은 현재 내용은 복구할 수 없습니다.')) return;
    replaceBoard(next); message.textContent = '개인 준비판 파일을 읽었습니다. 같은 여행·숙소의 연결은 다시 확인해야 합니다.';
  } catch (exception) { error.textContent = exception.message; }
  finally { fileInput.value = ''; }
});
document.getElementById('board-example').addEventListener('click', () => {
  if (hasData() && !window.confirm('현재 입력을 가상 준비판으로 바꿀까요? 저장하지 않은 내용은 복구할 수 없습니다.')) return;
  replaceBoard(exampleBoard()); message.textContent = '가상 준비판을 불러왔습니다. 금액·날짜·소요 시간은 설명용 가정입니다.';
});
document.getElementById('board-clear').addEventListener('click', () => {
  if (!window.confirm('세 도구와 준비판의 입력을 모두 비울까요? 저장하지 않은 내용은 복구할 수 없습니다.')) return;
  replaceBoard(emptyBoard()); message.textContent = '준비판의 입력을 비웠습니다. 이미 내려받은 파일은 삭제하지 않습니다.';
});
for (const control of document.querySelectorAll('.ss-trip-board button, #board-name, #board-stay, #board-file')) control.disabled = false;
render();
for (const frame of Object.values(frames)) frame.src = frame.dataset.src;
