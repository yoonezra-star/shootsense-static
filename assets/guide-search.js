export const TOPICS = ['all', 'stay', 'prepare', 'life', 'support', 'regional'];
export const REGIONS = ['all', 'general', 'japan', 'thailand', 'vietnam', 'china', 'india', 'europe', 'mena'];
export const CONTENT_TYPES = ['all', 'tools', 'analysis', 'guides'];

export function normalizeQuery(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ').trim();
}

export function matchesGuide(guide, { query = '', topic = 'all', region = 'all', type = 'all' } = {}) {
  if (type !== 'all' && guide.type !== type) return false;
  if (topic !== 'all' && guide.topic !== topic) return false;
  if (region !== 'all' && guide.region !== region) return false;
  const haystack = normalizeQuery(guide.text);
  return normalizeQuery(query).split(' ').filter(Boolean).every(term => haystack.includes(term));
}

export function readGuideFilters(search) {
  const params = new URLSearchParams(search);
  const topic = params.get('topic');
  const region = params.get('region');
  const type = params.get('type');
  return {
    query: (params.get('q') || '').slice(0, 80),
    topic: TOPICS.includes(topic) ? topic : 'all',
    region: REGIONS.includes(region) ? region : 'all',
    type: CONTENT_TYPES.includes(type) ? type : 'all'
  };
}

if (typeof document !== 'undefined') {
  const form = document.getElementById('guide-filter-form');
  if (form) {
    const query = form.elements.namedItem('q');
    const topic = form.elements.namedItem('topic');
    const region = form.elements.namedItem('region');
    const type = form.elements.namedItem('type');
    const rows = [...document.querySelectorAll('[data-guide-row]')];
    const records = rows.map(row => ({ text: `${row.textContent} ${row.dataset.keywords || ''}`, topic: row.dataset.topic, region: row.dataset.region, type: row.dataset.type }));
    const status = document.getElementById('guide-result-count');
    const empty = document.getElementById('guide-empty');
    const heading = document.querySelector('.ss-guide-hub h1');
    const originalHeading = heading.textContent;
    const originalTitle = document.title;
    const introduction = document.querySelector('.ss-guide-hub header > p:last-child');
    const originalIntroduction = introduction.textContent;
    const breadcrumb = document.querySelector('.ss-breadcrumb .here');
    const originalBreadcrumb = breadcrumb.textContent;
    function fillFromUrl() {
      const filters = readGuideFilters(location.search);
      query.value = filters.query;
      topic.value = filters.topic;
      region.value = filters.region;
      type.value = filters.type;
    }
    function render(updateUrl) {
      const filters = { query: query.value.slice(0, 80), topic: topic.value, region: region.value, type: type.value };
      let count = 0;
      rows.forEach((row, index) => { row.hidden = !matchesGuide(records[index], filters); if (!row.hidden) count++; });
      status.textContent = `${rows.length}개 중 ${count}개 자료`;
      empty.hidden = count !== 0;
      const viewTitle = { tools: '여행 도구', analysis: '계산 분석', guides: '여행 가이드' }[filters.type];
      heading.textContent = viewTitle || originalHeading;
      document.title = viewTitle ? `${viewTitle} | 여행정보엑스퍼트` : originalTitle;
      breadcrumb.textContent = viewTitle || originalBreadcrumb;
      introduction.textContent = filters.type === 'tools' ? '도착·출발 계산은 일본 현지 시각, 숙소 비용은 원화 입력 기준입니다. 예약 마감은 해당 원문의 시간대를 따로 확인해야 합니다.' : filters.type === 'analysis' ? '공개 자료와 가상 입력을 구분한 계산 분석입니다. 실제 객실 견적이나 현장 방문 후기가 아닙니다.' : originalIntroduction;
      for (const link of document.querySelectorAll('#masthead .ss-tools-link a')) {
        link.closest('.menu-item').classList.toggle('current-menu-item', filters.type === 'tools');
        if (filters.type === 'tools') link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
      }
      if (updateUrl) {
        const url = new URL(location.href);
        for (const name of ['q', 'topic', 'region', 'type']) url.searchParams.delete(name);
        if (filters.query.trim()) url.searchParams.set('q', filters.query.trim());
        if (filters.topic !== 'all') url.searchParams.set('topic', filters.topic);
        if (filters.region !== 'all') url.searchParams.set('region', filters.region);
        if (filters.type !== 'all') url.searchParams.set('type', filters.type);
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
      type.value = 'all';
      render(true);
      query.focus();
    });
    window.addEventListener('popstate', () => { fillFromUrl(); render(false); });
    fillFromUrl();
    render(false);
  }
}
