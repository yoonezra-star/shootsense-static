import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { PREPARATION_SAFETY_MODIFIED, PREPARATION_SAFETY_SLUGS } from './predeparture-content.mjs';
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

const serialize = page => page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';
const latest = (current, proposed) => Date.parse(current) > Date.parse(proposed) ? current : proposed;
const origin = 'https://shootsense.com';

export async function finalizePreparationSafetySourceReview(root = process.cwd()) {
  const modified = PREPARATION_SAFETY_MODIFIED;
  const day = modified.slice(0, 10);
  for (const review of PREPARATION_SAFETY_REVIEWS) {
    const file = path.join(root, review.slug, 'index.html');
    const page = load((await fs.readFile(file, 'utf8')).trimEnd());
    if (!page('.ss-post-body').text().includes(review.marker) || page('.ss-trust-note').length !== 1) throw new Error(`Rebuild revised ${review.id} guide first`);
    page(`#ss-${review.id}-source-review`).remove();
    const panel = `<aside id="ss-${review.id}-source-review" class="ss-source-review"><p><strong>${day} 공개 자료 재대조</strong> · ${escapeHtml(review.note)}</p><details><summary>확인한 출처와 남아 있는 조건</summary><ul>${review.groups.map(group => `<li><strong>${escapeHtml(group.title)}</strong><p>${escapeHtml(group.checked)} ${group.links.map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join(' · ')}</p><p><strong>미확인 범위</strong> ${escapeHtml(group.limit)}</p></li>`).join('')}</ul></details></aside>`;
    // Keep the room guide's immediate-danger warning ahead of reference details.
    page('.ss-post-body > p').eq(1).after(panel);
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
  if (home('#ss-home-source-review').length !== 1) throw new Error('Expected home source review');
  home('#ss-home-source-review').append(`<span id="ss-home-preparation-safety-review"> · ${PREPARATION_SAFETY_REVIEWS.map(review => `<a href="/${review.slug}/#ss-${review.id}-source-review">${escapeHtml(review.label)} 재대조</a>`).join(' · ')}</span>`);
  const homeModified = latest(home('meta[property="og:updated_time"]').attr('content'), modified);
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
    const targets = name === 'post-sitemap.xml' ? PREPARATION_SAFETY_SLUGS.map(slug => `${origin}/${slug}/`) : [`${origin}/`];
    for (const url of targets) {
      const entry = map('url').filter((_, node) => map(node).find('loc').text() === url);
      if (entry.length !== 1) throw new Error(`Expected one sitemap entry: ${url}`);
      entry.find('lastmod').text(latest(entry.find('lastmod').text(), modified));
    }
    await writeFileUtf8(file, map.xml().trimEnd() + '\n');
  }
  const file = path.join(root, 'sitemap_index.xml');
  const index = load(await fs.readFile(file, 'utf8'), { xml: true });
  index('sitemap').filter((_, node) => /\/(post|page)-sitemap\.xml$/.test(index(node).find('loc').text())).find('lastmod').each((_, node) => index(node).text(latest(index(node).text(), modified)));
  await writeFileUtf8(file, index.xml().trimEnd() + '\n');
  return { revisedArticles: PREPARATION_SAFETY_SLUGS, sourceLinks: 6, uniqueSourcePages: 4, emergencyGuideRedated: false };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await finalizePreparationSafetySourceReview()));
