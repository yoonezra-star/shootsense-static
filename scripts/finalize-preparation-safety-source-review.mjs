import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { PREPARATION_SAFETY_SLUGS, EMERGENCY_MODIFIED, PREDEPARTURE_REVIEW_DATES } from './predeparture-content.mjs';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';

export const PREPARATION_SAFETY_REVIEWS = [
  { slug: PREPARATION_SAFETY_SLUGS[0], id: 'preparation', label: '출발 조건·답변 상태', marker: '21:40 + 00:45 + 00:15 = 22:40',
    note: '여권·첫 숙소·연락 계획의 공개 원문과 가상 계산을 다시 대조했습니다. 개인의 입국 요건·예약 승인·실제 운행을 확인한 것은 아닙니다.',
    groups: [
      { title: '여권과 입국 조건', checked: '여권 사용 안내의 국가별 잔여 유효기간·비자 확인 원칙을 읽었습니다.', limit: '모든 목적지에 같은 잔여기간을 적용하지 않습니다. 본인의 국적·목적·경유·여행일 조건은 해당 당국과 운송사에서 확인해야 합니다.', links: [['외교부 여권 사용 안내', 'https://passport.go.kr/home/kor/contents.do?menuPos=50']] },
      { title: '첫 숙소와 연락 계획', checked: 'FCDO 원문의 일정 공유·연락 주기 합의·대체 숙소 준비 부분을 읽었습니다.', limit: '영국 국민 대상 안내의 일반 계획 원칙만 참고했습니다. 영사·보험 제도나 특정 숙소의 입실 허용 답변으로 적용하지 않습니다.', links: [['FCDO 혼자 여행 안내', 'https://www.gov.uk/guidance/solo-and-independent-travel']] },
      { title: '지역 경보의 확인 경로', checked: '해외안전여행 메인과 국가·지역 자료로 들어가는 경로를 확인했습니다.', limit: '개별 여행지의 경보를 이 일반 가이드에서 일괄 판정하지 않았습니다. 계산 예시는 일본 현지 시각의 편집 가정이며 공항 평균이나 탑승 마감 규정이 아닙니다.', links: [['외교부 해외안전여행', 'https://www.0404.go.kr/main/mainPage']] }
    ]
  },
  { slug: PREPARATION_SAFETY_SLUGS[1], id: 'room-safety', label: '객실 관찰·조치 재확인', marker: '문제 발견 · 조치 예정',
    note: '호텔 피난 안내와 숙소 이용 원칙을 다시 읽고, 관찰·운영자 회신·조치 후 재확인을 나눴습니다. 현장 검사나 숙소 안전 인증은 아닙니다.',
    groups: [
      { title: '피난 방향의 사전 확인', checked: 'USFA 원문의 피난도 읽기·가까운 출구 두 곳·층의 화재경보 위치 확인 권고를 대조했습니다.', limit: '미국 자료를 모든 나라의 법규로 적용하지 않습니다. 특정 건물의 설비 작동이나 비상 시 이동 경로를 검사한 것이 아닙니다.', links: [['USFA 호텔·휴가용 숙소 화재 안내', 'https://www.usfa.fema.gov/prevention/hotel-fires/']] },
      { title: '객실 이용과 대안', checked: 'FCDO 원문의 숙소 조사·대체 숙소·문과 창문 잠금 부분을 읽었습니다.', limit: '보조 잠금장치의 사용을 일괄 권하지 않습니다. 임의 개조·피난 방해 없이 정상 사용 범위에서 관찰하며, 가상 수리 기록은 체류 허용 판정이 아닙니다.', links: [['FCDO 혼자 여행 안내 · 숙소 항목', 'https://www.gov.uk/guidance/solo-and-independent-travel']] },
      { title: '시설 문제와 지역 위험은 별도', checked: '한국 여행자의 국가·지역 안내는 해외안전여행에서 별도로 확인하도록 연결했습니다.', limit: '운영자 답변·수리·환불·야간 지원을 직접 확인하지 않았습니다. 즉각 위험에는 점검이나 기록보다 현지 긴급 도움이 먼저입니다.', links: [['외교부 해외안전여행', 'https://www.0404.go.kr/main/mainPage']] }
    ]
  }
];

export const EMERGENCY_SOURCE_REVIEW = {
  slug: 'honja-yeohaeng-emergency-response', id: 'emergency', label: '긴급 연락·분실 신고 구분', marker: '연락 시도 · 접수 미확인',
  note: '콜센터 연락 방식·여권 분실·영사조력 원문을 다시 읽었습니다. 실제 통화·신고·출동·문서 발급을 확인한 기록이나 응급처치 지침은 아닙니다.',
  groups: [
    { title: '영사 상담 연락 방식', checked: '24시간 상담, 해외 +82-2-3210-0404 일반 유료 전화, 인터넷 환경의 무료전화앱과 상담·통역 업무를 대조했습니다.', limit: '실제 연결·대기시간·통신 요금은 시험하지 않았습니다. 현지 긴급기관 신고나 공관의 방문·발급 시간을 대신하지 않습니다.', links: [['외교부 콜센터 이용 안내', 'https://www.0404.go.kr/bbs/contsPst/MST0000000000105/5/detail'], ['외교부 콜센터 업무 소개', 'https://www.0404.go.kr/bbs/contsPst/MST0000000000104/4/detail']] },
    { title: '분실 신고와 되찾은 여권', checked: '분실 신고 뒤 즉시 무효화, 해외 공관 신고·새 여권 안내, 현지 경찰 신고 후 되찾은 문서의 출입국 불이익 주의를 읽었습니다.', limit: '개별 공관의 신청 서류·방문 예약·발급일과 다음 여정에서의 문서 인정을 확인한 것은 아닙니다.', links: [['외교부 여권 분실·습득 안내', 'https://passport.go.kr/home/kor/contents.do?menuPos=26']] },
    { title: '영사조력의 범위', checked: 'FAQ의 보충성·지역 특수성·비용 자기부담 등 지원 원칙을 읽었습니다.', limit: '개별 사건의 법적 권리·비용 지원·보험 보상·환불 여부를 판정하지 않습니다. 기관별 접수 상태 표는 편집 예시입니다.', links: [['외교부 영사조력 FAQ', 'https://www.0404.go.kr/bbs/bbsPst/MST0000000000071/BSC0501/faq/list']] }
  ]
};

const serialize = page => page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';
const latest = (current, proposed) => Date.parse(current) > Date.parse(proposed) ? current : proposed;
const origin = 'https://shootsense.com';

export async function finalizePreparationSafetySourceReview(root = process.cwd()) {
  const reviews = [...PREPARATION_SAFETY_REVIEWS, EMERGENCY_SOURCE_REVIEW];
  for (const review of reviews) {
    const modified = PREDEPARTURE_REVIEW_DATES[review.slug];
    const day = modified.slice(0, 10);
    const file = path.join(root, review.slug, 'index.html');
    const page = load((await fs.readFile(file, 'utf8')).trimEnd());
    if (!page('.ss-post-body').text().includes(review.marker) || page('.ss-trust-note').length !== 1) throw new Error(`Rebuild revised ${review.id} guide first`);
    page(`#ss-${review.id}-source-review`).remove();
    const panel = `<aside id="ss-${review.id}-source-review" class="ss-source-review"><p><strong>${day} 공개 자료 재대조</strong> · ${escapeHtml(review.note)}</p><details><summary>확인한 출처와 남아 있는 조건</summary><ul>${review.groups.map(group => `<li><strong>${escapeHtml(group.title)}</strong><p>${escapeHtml(group.checked)} ${group.links.map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join(' · ')}</p><p><strong>미확인 범위</strong> ${escapeHtml(group.limit)}</p></li>`).join('')}</ul></details></aside>`;
    if (review.id === 'emergency') {
      const bodyWarning = page('.ss-post-body > p').first();
      const urgent = bodyWarning.text().includes('지금 생명·신체에 즉각적인 위험') ? bodyWarning : page('#ss-emergency-priority > p').first();
      if (!urgent.text().includes('지금 생명·신체에 즉각적인 위험')) throw new Error('Expected immediate-danger warning');
      const warning = urgent.toString();
      urgent.remove();
      page('#ss-emergency-priority').remove();
      if (page('.ss-post-hero').length !== 1) throw new Error('Expected emergency article header');
      page('.ss-post-hero').after(`<aside id="ss-emergency-priority" class="ss-emergency-priority">${warning}<p>이 사이트의 문의메일은 실시간 구조·신고 접수 창구가 아닙니다.</p></aside>`);
      page('.ss-post-body > p').first().after(panel);
    } else {
      // Keep the room guide's immediate-danger warning ahead of reference details.
      page('.ss-post-body > p').eq(1).after(panel);
    }
    for (const selector of ['meta[property="article:modified_time"]', 'meta[property="og:updated_time"]']) page(selector).attr('content', modified);
    page('script.rank-math-schema').each((_, script) => {
      const schema = JSON.parse(page(script).text());
      for (const node of schema['@graph'] || [schema]) if (['WebPage', 'BlogPosting', 'Article'].includes(node['@type'])) node.dateModified = modified;
      page(script).text(JSON.stringify(schema));
    });
    page('.ss-post-meta span').filter((_, node) => page(node).text().startsWith('최종 수정 ')).text(`최종 수정 ${day}`);
    const note = page('.ss-trust-note').html();
    if (!/최종 검토일: \d{4}-\d{2}-\d{2}/.test(note)) throw new Error('Expected review date');
    page('.ss-trust-note').html(note.replace(/최종 검토일: \d{4}-\d{2}-\d{2}/, `최종 검토일: ${day}`));
    await writeFileUtf8(file, serialize(page));
  }
  const homeFile = path.join(root, 'index.html');
  const home = load((await fs.readFile(homeFile, 'utf8')).trimEnd());
  home('#ss-home-preparation-safety-review').remove();
  home('#ss-home-emergency-review').remove();
  if (home('#ss-home-source-review').length !== 1) throw new Error('Expected home source review');
  home('#ss-home-source-review').append(`<span id="ss-home-preparation-safety-review"> · ${PREPARATION_SAFETY_REVIEWS.map(review => `<a href="/${review.slug}/#ss-${review.id}-source-review">${escapeHtml(review.label)} 재대조</a>`).join(' · ')}</span>`);
  home('#ss-home-source-review').append(`<span id="ss-home-emergency-review"> · <a href="/${EMERGENCY_SOURCE_REVIEW.slug}/#ss-emergency-source-review">긴급 연락·분실 신고 재대조</a></span>`);
  const homeModified = latest(home('meta[property="og:updated_time"]').attr('content'), EMERGENCY_MODIFIED);
  home('meta[property="og:updated_time"]').attr('content', homeModified);
  home('script.rank-math-schema').each((_, script) => {
    const schema = JSON.parse(home(script).text());
    for (const node of schema['@graph'] || [schema]) if (node.dateModified) node.dateModified = homeModified;
    home(script).text(JSON.stringify(schema));
  });
  await writeFileUtf8(homeFile, serialize(home));
  for (const name of ['post-sitemap.xml', 'page-sitemap.xml']) {
    const file = path.join(root, name);
    const map = load(await fs.readFile(file, 'utf8'), { xml: true });
    const targets = name === 'post-sitemap.xml' ? reviews.map(review => [`${origin}/${review.slug}/`, PREDEPARTURE_REVIEW_DATES[review.slug]]) : [[`${origin}/`, homeModified]];
    for (const [url, modified] of targets) {
      const entry = map('url').filter((_, node) => map(node).find('loc').text() === url);
      if (entry.length !== 1) throw new Error(`Expected one sitemap entry: ${url}`);
      entry.find('lastmod').text(latest(entry.find('lastmod').text(), modified));
    }
    await writeFileUtf8(file, map.xml().trimEnd() + '\n');
  }
  const file = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(file, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => /\/(post|page)-sitemap\.xml$/.test(index(node).find('loc').text())).find('lastmod').each((_, node) => index(node).text(latest(index(node).text(), EMERGENCY_MODIFIED)));
  await writeFileUtf8(file, index.xml().trimEnd() + '\n');
  return { revisedArticles: reviews.map(review => review.slug), sourceLinks: 10, uniqueSourcePages: 8, separateArticleReviewDates: true };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await finalizePreparationSafetySourceReview()));
