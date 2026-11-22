import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';
import { syncEditorialReferences } from './lib/editorial-references.mjs';

export const HELD_SAFETY_MODIFIED = '2026-11-22T22:15:00+09:00';
export const HELD_SAFETY_GUIDES = [
  {
    slug: '볼거리가-없어서-오래-머물-수-있었던-무스카트-외곽',
    previousTitle: '오만 무스카트 혼자 여행: 도시 중심 일정과 외곽 체류를 분리하는 기준',
    title: '오만 무스카트 여행 보류: 출국권고와 기존 자료 확인',
    summary: '2026-11-22 외교부의 오만 전 지역 출국권고를 재대조했습니다. 기존 외곽 관광 원고의 일반적인 방문 조언은 공개를 중단하고, 경보 적용과 이미 예약한 교통·숙소의 확인 범위만 남깁니다.',
    source: 'https://www.0404.go.kr/ntnSafetyInfo/162/detail',
    warning: '오만 전 지역 출국권고',
    detail: '무스카트도 전 지역 경보에 포함됩니다. 외곽 숙박·시내 산책·자연 체험을 현재 진행할 일정으로 권하지 않습니다.'
  },
  {
    slug: '지도에-별표가-없는-곳에서-보낸-수르의-시간',
    previousTitle: '오만 수르 혼자 여행: 항구 마을 1박과 와디 이동을 한 일정에 섞지 않는 법',
    title: '오만 수르 여행 보류: 출국권고와 기존 자료 확인',
    summary: '2026-11-22 외교부의 오만 전 지역 출국권고를 재대조했습니다. 기존 항구·와디 관광 조언은 공개를 중단합니다. 신규 관광 취소·연기를 우선하고 기존 계약의 변경·환불 조건을 따로 확인합니다.',
    source: 'https://www.0404.go.kr/ntnSafetyInfo/162/detail',
    warning: '오만 전 지역 출국권고',
    detail: '수르도 전 지역 경보에 포함됩니다. 항구 마을 체류나 와디 이동을 현재 가능한 관광 일정으로 권하지 않습니다.'
  },
  {
    slug: '구경이-아니라-머무름에-가까웠던-시아누크빌-외곽',
    previousTitle: '시아누크빌 혼자 여행: 해변보다 입출항과 숙소 권역을 먼저 가르는 기준',
    title: '시아누크빌 여행 보류: 시·주 경보와 기존 자료 확인',
    summary: '2026-11-22 외교부의 시하누크빌 시 출국권고·주 여행자제를 재대조했습니다. 기존 해변·섬 관광 조언은 공개를 중단하고, 시·주 구분과 실제 주소·운송·예약 계약의 확인 범위만 남깁니다.',
    source: 'https://www.0404.go.kr/ntnSafetyInfo/259/detail',
    warning: '시하누크빌 시 출국권고 · 시하누크빌 주 여행자제',
    detail: '외곽이라는 표현만으로 시 경계 밖이거나 경보 적용 밖이라고 판단할 수 없습니다. 숙소·항구·실제 이동 경로의 주소를 공식 경보 범위와 대조해야 하며, 해변 체류나 섬 연결을 지금 예약하라고 권하지 않습니다.'
  }
];

export async function applyHeldSafetyNotices(root = process.cwd()) {
  const day = HELD_SAFETY_MODIFIED.slice(0, 10);
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
    $('.ss-toc').before(`<blockquote id="ss-held-safety-note"><p><strong>경보 재대조: ${day} · ${escapeHtml(guide.warning)}</strong></p><p>${escapeHtml(guide.detail)}</p><p><a href="${guide.source}">외교부 국가·지역별 현재 경보 확인</a>. 출국권고 지역의 여행 예정자는 취소·연기를 우선하고, 체류자는 긴급한 용무가 아닌 한 출국을 검토합니다. 실제 이동·항공·영사 안내는 최신 공식 공지에 따릅니다.</p><p>별도 결제한 교통·숙소의 변경·취소 조건은 예약처에서 확인합니다. 경보가 있다는 이유만으로 환불이 자동 확정되는 것은 아닙니다. 이 경보 대조는 현지 시설·교통·관광 운영을 검증했다는 뜻이 아닙니다.</p></blockquote>`);
    const locationCheck = guide.slug.includes('시아누크빌')
      ? '숙소 주소, 출항 항구, 배편 운영자와 실제 육상 이동 경로를 각각 적습니다. 주 이름만으로 시 경계 밖이라고 판단하지 않습니다. 배편이 있다는 소개만으로 운항·탑승·섬 이동을 확정하지 않습니다.'
      : guide.slug.includes('수르')
        ? '수르 숙소, 공항 연결, 와디 방문 계약을 서로 다른 예약으로 나눕니다. 항구 마을이라는 소개만으로 와디 접근·기상·가이드 운행을 보증하지 않습니다.'
        : '무스카트의 숙소, 도착 공항, 외곽 이동을 각각의 주소·계약으로 나눕니다. 외곽이라는 표현만으로 전 지역 경보 적용에서 벗어나지 않습니다.';
    $('.ss-post-body').html(`<p id="ss-held-archive-scope"><strong>기존 관광 원고의 일반적인 방문 조언은 공개를 중단했습니다.</strong> 확인되지 않은 숙박·산책·체류 추천을 현재 일정으로 제시하지 않습니다. 이 주소는 경보와 기존 계약 확인 범위를 안내하는 보관 페이지이며 검색 색인·광고 제외를 유지합니다.</p><h2 id="archive-scope">지금 이 자료로 판단할 수 있는 범위</h2><p>${escapeHtml(locationCheck)}</p><p>경보에 대한 판단과 이미 결제한 예약의 환불 결과는 별개입니다. 새 관광 예약의 권유가 아니라, 기존 계약을 어떤 순서로 확인할지에 한정합니다.</p><h2 id="archive-contract">이미 예약했다면 나눠 확인할 세 가지</h2><ol><li>예약 상품의 실제 취소 마감 날짜·현지 시각·노쇼 조건을 저장합니다. 항공, 숙소, 차량·배편을 같은 약관으로 처리하지 않습니다.</li><li>예약처에 경보와 실제 출발일을 알리고 변경·취소 선택지, 수수료, 답변 기한을 묻습니다. 문의 접수를 취소 완료나 환불 승인으로 표시하지 않습니다.</li><li>기존 결제, 운영자의 접수 답변, 취소 완료, 환불 예정·실제 입금을 구분해 기록합니다. 가능한 출국편·운항은 항공사·공관의 최신 안내로 확인합니다.</li></ol><p><a href="/honja-yeohaeng-gamjeong-gwanri/">일정 변경·취소 기록표</a>에서 연락처 역할과 비공개 확인표를 볼 수 있습니다. 예약번호·여권·카드·인증정보는 이 사이트에 제출하지 않습니다.</p><h2 id="archive-status">다시 공개할 때 필요한 근거</h2><p>경보 변경, 시설·교통 운영, 특정 방문 질문에 대한 고유한 조사 결과가 확보돼야 관광 가이드의 재공개를 검토할 수 있습니다. 지금 방문 경험·운영자 회신·확정 운행·빈방을 확보했다고 주장하지 않습니다. <a href="${guide.source}">해당 국가의 공식 경보와 안전공지</a> 또는 <a href="/contact/">오류 제보</a>로 연결하며, 기존 여행기의 제목이나 감상만 바꿔 재발행하지 않습니다.</p>`);
    const headings = $('.ss-post-body h2').toArray().map(node => ({ id: $(node).attr('id'), text: $(node).text() }));
    $('.ss-toc').html(`<div class="ss-toc-head">목차</div><ol>${headings.map(item => `<li><a href="#${item.id}">${escapeHtml(item.text)}</a></li>`).join('')}</ol>`);
    $('.ss-trust-box').first().html(`<span class="ss-trust-kicker">보관 상태</span><h2>기존 관광 원고 공개 중단</h2><p>현재 경보와 계약 확인 범위만 남겼습니다. 검색 색인·광고 제외는 유지하며 현지 운영·취재 완료로 표시하지 않습니다.</p><p class="ss-trust-note">경보 대조·공개 범위 정리: ${day} · 작성 <a href="/author/">여행엑스퍼트(필명)</a> · <a href="/editorial-policy/">편집 원칙</a> · <a href="/contact/">오류 제보</a></p>`);
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
    $('.ss-post-meta').first().html(`${published ? `<span>게시 ${escapeHtml(published)}</span>` : ''}<span>공개 범위 정리 ${day}</span><span>작성 · 여행엑스퍼트(필명)</span>`);
    await writeFileUtf8(file, $.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n');
  }
  const referencePagesUpdated = await syncEditorialReferences(root, HELD_SAFETY_GUIDES);
  return { heldNoticesUpdated: HELD_SAFETY_GUIDES.length, referencePagesUpdated, indexStatusChanged: false };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await applyHeldSafetyNotices()));
