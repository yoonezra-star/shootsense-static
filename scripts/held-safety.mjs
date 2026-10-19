import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';
import { syncEditorialReferences } from './lib/editorial-references.mjs';

export const HELD_SAFETY_MODIFIED = '2026-10-19T23:38:00+09:00';
export const HELD_SAFETY_GUIDES = [
  {
    slug: '볼거리가-없어서-오래-머물-수-있었던-무스카트-외곽',
    previousTitle: '오만 무스카트 혼자 여행: 도시 중심 일정과 외곽 체류를 분리하는 기준',
    title: '오만 무스카트 여행 보류: 출국권고와 기존 자료 확인',
    summary: '2026-10-19 외교부 안내에서 오만 전 지역 출국권고를 확인했습니다. 신규 관광은 취소·연기를 우선하며, 아래 기존 원고는 현재 방문을 권하는 안내가 아닌 재검토 대기 자료입니다.',
    source: 'https://www.0404.go.kr/ntnSafetyInfo/162/detail',
    warning: '오만 전 지역 출국권고',
    detail: '무스카트도 전 지역 경보에 포함됩니다. 외곽 숙박·시내 산책·자연 체험을 현재 진행할 일정으로 권하지 않습니다.'
  },
  {
    slug: '지도에-별표가-없는-곳에서-보낸-수르의-시간',
    previousTitle: '오만 수르 혼자 여행: 항구 마을 1박과 와디 이동을 한 일정에 섞지 않는 법',
    title: '오만 수르 여행 보류: 출국권고와 기존 자료 확인',
    summary: '2026-10-19 외교부 안내에서 오만 전 지역 출국권고를 확인했습니다. 수르·와디 방문을 새로 계획하기보다 취소·연기와 기존 예약 조건을 확인하며, 아래 원고는 재검토 대기 자료로 보관합니다.',
    source: 'https://www.0404.go.kr/ntnSafetyInfo/162/detail',
    warning: '오만 전 지역 출국권고',
    detail: '수르도 전 지역 경보에 포함됩니다. 항구 마을 체류나 와디 이동을 현재 가능한 관광 일정으로 권하지 않습니다.'
  },
  {
    slug: '구경이-아니라-머무름에-가까웠던-시아누크빌-외곽',
    previousTitle: '시아누크빌 혼자 여행: 해변보다 입출항과 숙소 권역을 먼저 가르는 기준',
    title: '시아누크빌 여행 보류: 시·주 경보와 기존 자료 확인',
    summary: '2026-10-19 외교부 안내에서 시하누크빌 시 출국권고, 시하누크빌 주 여행자제를 확인했습니다. 시와 주를 같은 경보로 묶지 않고 신규 관광 보류·예약 조건 확인을 우선하며, 기존 원고는 재검토 대기 자료로 보관합니다.',
    source: 'https://www.0404.go.kr/ntnSafetyInfo/259/detail',
    warning: '시하누크빌 시 출국권고 · 시하누크빌 주 여행자제',
    detail: '외곽이라는 표현만으로 시 경계 밖이거나 경보 적용 밖이라고 판단할 수 없습니다. 숙소·항구·실제 이동 경로의 주소를 공식 경보 범위와 대조해야 하며, 해변 체류나 섬 연결을 지금 예약하라고 권하지 않습니다.'
  }
];

export async function applyHeldSafetyNotices(root = process.cwd()) {
  const sitemap = load(await fs.readFile(path.join(root, 'post-sitemap.xml'), 'utf8'), { xml: true });
  for (const guide of HELD_SAFETY_GUIDES) {
    const file = path.join(root, guide.slug, 'index.html');
    const $ = load((await fs.readFile(file, 'utf8')).trimEnd());
    if ($('.ss-post-body').length !== 1 || $('.ss-toc').length !== 1 || !/noindex/.test($('meta[name="robots"]').attr('content') || '')) throw new Error(`Expected a held article: ${guide.slug}`);
    const route = `/${guide.slug}/`;
    if (sitemap('loc').toArray().some(node => decodeURIComponent(sitemap(node).text()).endsWith(route))) throw new Error(`Held article in indexed post sitemap: ${guide.slug}`);
    if ($('script[src*="googlesyndication"]').length || $('ins.adsbygoogle').length) throw new Error(`Unexpected ad placement on held article: ${guide.slug}`);
    $('.ss-post').addClass('ss-regional-guide');
    if (!$('link#ss-regional-style').length) $('head').append('<link id="ss-regional-style" rel="stylesheet" href="/assets/regional-guides.css">');
    $('.ss-post-cover').remove();
    $('h1').first().text(guide.title);
    $('title').text(`${guide.title} - 여행정보엑스퍼트`);
    $('.ss-breadcrumb .here').text(guide.title);
    $('.ss-post-summary p').first().text(guide.summary);
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) $(selector).attr('content', guide.title);
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) $(selector).attr('content', guide.summary);
    for (const selector of ['meta[property="og:updated_time"]', 'meta[property="article:modified_time"]']) $(selector).attr('content', HELD_SAFETY_MODIFIED);
    $('#ss-held-safety-note, #ss-held-archive-scope').remove();
    $('.ss-toc').before(`<blockquote id="ss-held-safety-note"><p><strong>경보 확인: 2026-10-19 · ${escapeHtml(guide.warning)}</strong></p><p>${escapeHtml(guide.detail)}</p><p><a href="${guide.source}">외교부 국가·지역별 현재 경보 확인</a>. 출국권고 지역의 여행 예정자는 취소·연기를 우선하고, 체류자는 긴급한 용무가 아닌 한 출국을 검토합니다. 실제 이동·항공·영사 안내는 최신 공식 공지에 따릅니다.</p><p>별도 결제한 교통·숙소의 변경·취소 조건은 예약처에서 확인합니다. 경보가 있다는 이유만으로 환불이 자동 확정되는 것은 아닙니다. 이 경보 대조는 아래 원고 전체의 운영·교통·관광 정보를 다시 검증했다는 뜻이 아닙니다.</p></blockquote>`);
    $('.ss-post-body').prepend('<p id="ss-held-archive-scope"><strong>이하 기존 원고는 재검토 대기 자료입니다.</strong> 장소·동선에 관한 과거 설명을 보관하며 현재 방문·숙박·투어의 권유로 사용하지 않습니다. 실제 방문 기록이 아니고, 지금 시설·교통·예약 가능 여부를 확인한 정보도 아닙니다.</p>');
    $('.ss-trust-box').first().html('<span class="ss-trust-kicker">보관 상태</span><h2>경보 정정 · 원고 재검토 대기</h2><p>이번에는 외교부 경보를 대조했습니다. 아래 기존 원고의 시설·교통·요금·예약 가능 여부는 전체 재검토를 마치지 않았습니다.</p><p class="ss-trust-note">경보 대조일: 2026-10-19 · 확인: <a href="/author/">여행엑스퍼트(필명)</a> · 기존 원고 전체 검토는 미완료입니다. <a href="/editorial-policy/">편집 원칙</a> · <a href="/contact/">오류 제보</a></p>');
    let published;
    $('script[type="application/ld+json"]').each((_, script) => {
      const schema = JSON.parse($(script).text());
      for (const node of schema['@graph'] || [schema]) {
        const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
        if (types.includes('BreadcrumbList')) {
          const last = node.itemListElement?.at(-1);
          if (last?.item && typeof last.item === 'object') last.item.name = guide.title;
          else if (last) last.name = guide.title;
        }
        if (!types.some(type => ['WebPage', 'BlogPosting', 'Article'].includes(type))) continue;
        if (types.includes('BlogPosting')) published = node.datePublished?.slice(0, 10);
        node.name = guide.title;
        if (node.headline) node.headline = guide.title;
        node.description = guide.summary;
        node.dateModified = HELD_SAFETY_MODIFIED;
      }
      $(script).text(JSON.stringify(schema));
    });
    $('.ss-post-meta').first().html(`${published ? `<span>게시 ${escapeHtml(published)}</span>` : ''}<span>경보 안내 수정 2026-10-19</span><span>작성 · 여행엑스퍼트(필명)</span>`);
    await writeFileUtf8(file, $.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n');
  }
  const referencePagesUpdated = await syncEditorialReferences(root, HELD_SAFETY_GUIDES);
  return { heldNoticesUpdated: HELD_SAFETY_GUIDES.length, referencePagesUpdated, indexStatusChanged: false };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await applyHeldSafetyNotices()));
