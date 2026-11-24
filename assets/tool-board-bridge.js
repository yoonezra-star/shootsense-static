import { normalizeToolRecord } from './trip-board-model.js';

export function installToolBoardBridge({ tool, read, restore }) {
  const noop = { publish() {}, reset() {} };
  if (window.parent === window || new URLSearchParams(location.search).get('embed') !== 'trip-board') return noop;
  try { if (window.parent.location.origin !== location.origin) return noop; } catch { return noop; }
  let revision = 0;
  let state = 'empty';
  let example = false;
  let resetTimer = null;
  const send = payload => window.parent.postMessage({ ...payload, tool, version: 1 }, location.origin);
  function publish(nextState = state, nextExample = example) {
    clearTimeout(resetTimer);
    state = nextState; example = nextExample;
    send({ type: 'shootsense:tool-state', revision, record: normalizeToolRecord(tool, { state, example, inputs: read() }) });
  }
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent || event.data?.version !== 1 || event.data.tool !== tool) return;
    const data = event.data;
    if (data.type === 'shootsense:request-state') publish();
    if (data.type === 'shootsense:restore' && Number.isSafeInteger(data.revision) && data.revision >= revision) {
      try {
        const record = normalizeToolRecord(tool, data.record);
        revision = data.revision;
        restore(record);
        publish(record.state, record.example);
      } catch { publish('error', false); }
    }
  });
  document.documentElement.classList.add('ss-tool-embedded');
  for (const link of document.querySelectorAll('a[href]')) if (!link.hasAttribute('download')) { link.target = '_blank'; link.rel = 'noopener'; }
  const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = '/assets/tool-embed.css';
  let previousHeight = 0;
  let pendingFrame = false;
  const resize = () => {
    if (pendingFrame) return;
    pendingFrame = true;
    requestAnimationFrame(() => {
      pendingFrame = false;
      const height = Math.ceil(document.querySelector('.entry-content').getBoundingClientRect().height) + 20;
      if (height > 0 && Math.abs(previousHeight - height) > 2) { previousHeight = height; send({ type: 'shootsense:height', height }); }
    });
  };
  const ready = () => { new ResizeObserver(resize).observe(document.querySelector('.entry-content')); resize(); send({ type: 'shootsense:tool-ready' }); };
  style.addEventListener('load', ready, { once: true });
  style.addEventListener('error', ready, { once: true });
  document.head.append(style);
  return { publish, reset() { clearTimeout(resetTimer); resetTimer = setTimeout(() => publish('empty', false), 0); } };
}
