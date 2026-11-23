export const TOPICS = ['all', 'stay', 'prepare', 'life', 'support', 'regional'];
export const REGIONS = ['all', 'general', 'japan', 'thailand', 'vietnam', 'china', 'india', 'europe', 'mena'];

export function normalizeQuery(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ').trim();
}

export function matchesGuide(guide, { query = '', topic = 'all', region = 'all' } = {}) {
  if (topic !== 'all' && guide.topic !== topic) return false;
  if (region !== 'all' && guide.region !== region) return false;
  const haystack = normalizeQuery(guide.text);
  return normalizeQuery(query).split(' ').filter(Boolean).every(term => haystack.includes(term));
}

export function readGuideFilters(search) {
  const params = new URLSearchParams(search);
  const topic = params.get('topic');
  const region = params.get('region');
  return {
    query: (params.get('q') || '').slice(0, 80),
    topic: TOPICS.includes(topic) ? topic : 'all',
    region: REGIONS.includes(region) ? region : 'all'
  };
}

if (typeof document !== 'undefined') {
  const form = document.getElementById('guide-filter-form');
  if (form) {
    const query = form.elements.namedItem('q');
    const topic = form.elements.namedItem('topic');
    const region = form.elements.namedItem('region');
    const rows = [...document.querySelectorAll('[data-guide-row]')];
    const records = rows.map(row => ({ text: `${row.textContent} ${row.dataset.keywords || ''}`, topic: row.dataset.topic, region: row.dataset.region }));
    const status = document.getElementById('guide-result-count');
    const empty = document.getElementById('guide-empty');
    function fillFromUrl() {
      const filters = readGuideFilters(location.search);
      query.value = filters.query;
      topic.value = filters.topic;
      region.value = filters.region;
    }
    function render(updateUrl) {
      const filters = { query: query.value.slice(0, 80), topic: topic.value, region: region.value };
      let count = 0;
      rows.forEach((row, index) => { row.hidden = !matchesGuide(records[index], filters); if (!row.hidden) count++; });
      status.textContent = `${rows.length}개 중 ${count}개 자료`;
      empty.hidden = count !== 0;
      if (updateUrl) {
        const url = new URL(location.href);
        for (const name of ['q', 'topic', 'region']) url.searchParams.delete(name);
        if (filters.query.trim()) url.searchParams.set('q', filters.query.trim());
        if (filters.topic !== 'all') url.searchParams.set('topic', filters.topic);
        if (filters.region !== 'all') url.searchParams.set('region', filters.region);
        history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
      }
    }
    form.addEventListener('submit', event => { event.preventDefault(); render(true); });
    form.addEventListener('input', () => render(true));
    form.addEventListener('change', () => render(true));
    form.addEventListener('reset', event => {
      event.preventDefault();
      query.value = '';
      topic.value = 'all';
      region.value = 'all';
      render(true);
      query.focus();
    });
    window.addEventListener('popstate', () => { fillFromUrl(); render(false); });
    fillFromUrl();
    render(false);
  }
}
