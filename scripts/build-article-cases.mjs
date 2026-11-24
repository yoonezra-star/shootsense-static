import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { ARTICLE_CASES } from '../assets/article-cases.js';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';

export const CASE_LINKED_DATE = '2026-11-24';
export const CASE_EXPLANATIONS = {
  'stay-price': {
    rows: [['가상 숙소 A', '숙박비 75,000 + 별도 추가금 15,000 + 이동비 18,000 + 기타 0', '108,000원'], ['가상 숙소 B', '숙박비 91,000 + 별도 추가금 0 + 이동비 4,000 + 기타 0', '95,000원']],
    result: '표시 숙박비는 A가 16,000원 낮지만, 입력 합계는 B가 13,000원 낮습니다. A의 취소 손실 90,000원은 별도 상황이라 이용 합계에 더하지 않습니다.',
    decision: '이 예시의 B는 체크인 가능·추가금 확인, A는 체크인 미확인으로 설정한 가상 상태입니다. 계산 차이와 별개로 A의 실제 체크인 답변부터 받아야 하며, 가격 차이가 숙소 품질이나 안전성의 순위는 아닙니다.',
    change: '자신의 비교에서는 같은 예약 기간의 최종 결제액·별도 비용·같은 범위의 이동비로 바꿉니다. 미확인 금액을 0원 확정으로 읽지 말고 확인 상태를 해제합니다.'
  },
  'arrival-last-service': {
    rows: [['항공편·교통편', '2026-12-10 일본 현지 시각 21:40 도착 / 22:10 출발', '시각 차이 30분'], ['추가한 검산 가정', '입국·짐·세관 45분 + 승차 위치 이동·준비 15분', '승차 위치 22:40'], ['마감과 이후 이동', '숙소 마감 23:00 / 숙소 여유 20분 / 교통편 출발부터 숙소까지 40분 / 탑승 전 여유 10분', '해당편 이후 대안 미확인']],
    result: '이 가정에서는 승차 위치 도착 22:40이 교통편 출발 22:10보다 30분 늦습니다. 도구는 이 교통편으로 숙소에 도착하는 시각을 만들지 않고 계산을 보류합니다.',
    decision: '도구의 30분·60분 지연 시나리오도 같은 미확인 대안을 자동으로 채우지 않습니다. 더 빠른 도착편이나 대체 이동을 확보하더라도 숙소의 늦은 출입 확인은 별개입니다.',
    change: '본문의 장소 미지정 예시를 일본 현지 시각의 가상 검산으로 옮겼습니다. 45분·15분은 추가한 임의 가정이지 입국·역 이동의 표준 시간이 아닙니다. 다른 나라 현지 시각을 일본 전용 계산기에 그대로 넣지 않습니다.'
  },
  'departure-early-storage': {
    rows: [['출발 조건', '2026-12-12 일본 현지 시각 16:00 출발 / 승차 전 여유 20분 / 회수 후 이동 35분', '출발 기준 회수 한계 15:05'], ['회수 조건', '회수 완료 마감 14:30 / 회수 10분 / 관광지에서 보관처 30분 / 별도 여유 15분', '관광 종료 목표 13:35'], ['계획한 관광 종료', '14:00 + 이동 30분 + 별도 여유 15분 + 회수 10분', '회수 완료 14:55']],
    result: '14:00에 관광을 끝내면 회수 완료는 14:55로, 14:30 마감보다 25분 늦습니다. 승차 위치에 15:30 도착한다고 계산되더라도 보관처 회수 조건이 먼저 어긋납니다.',
    decision: '14:10이라는 출발 기준만 사용하지 않고 더 이른 보관 마감에 맞춰 13:35로 앞당기는 이유입니다. 13:35 역시 입력 가정에서의 경계이며 실제 이동·대기 변동까지 해결해 주는 출발 권장 시각은 아닙니다.',
    change: '실제 이용일의 회수 완료 마감과 정확한 승차 위치를 확인한 뒤 가정값을 교체합니다. 미확인 분 수를 비우면 계산을 보류하며, 0분은 확인된 경우에만 입력합니다.'
  }
};

export async function buildArticleCases(root = process.cwd()) {
  for (const [id, entry] of Object.entries(ARTICLE_CASES)) {
    const file = path.join(root, entry.article, 'index.html');
    const page = load((await fs.readFile(file, 'utf8')).trimEnd());
    if (/noindex/.test(page('meta[name="robots"]').attr('content') || '')) throw new Error('Cannot add examples to held articles');
    const content = CASE_EXPLANATIONS[id];
    page('#ss-case-walkthrough').remove();
    const markup = `<aside id="ss-case-walkthrough" class="ss-case-walkthrough" aria-labelledby="ss-case-title"><p class="ss-case-date">가상 검산 연결 · ${CASE_LINKED_DATE} · 본문의 자료 확인일과 별개</p><h2 id="ss-case-title">${escapeHtml(entry.title)}</h2><p>아래 값은 설명을 위한 가상 조건이며 실제 방문·가격 조사·예약·운영자 회신이 아닙니다.</p><dl>${content.rows.map(([label, value, outcome]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}<strong>${escapeHtml(outcome)}</strong></dd></div>`).join('')}</dl><p><strong>계산에서 보이는 것</strong> ${escapeHtml(content.result)}</p><p><strong>결정 전에 남는 질문</strong> ${escapeHtml(content.decision)}</p><p>${escapeHtml(content.change)}</p><a class="ss-case-open" href="${entry.route}#case=${id}" target="_blank" rel="noopener" title="새 탭에서 가상 사례 열기">이 조건의 가상 사례 열기</a></aside>`;
    const anchor = page('#ss-related-tools').first();
    if (!anchor.length) throw new Error(`Missing tool context: ${entry.article}`);
    anchor.before(markup);
    if (!page('#ss-article-cases-style').length) page('head').append('<link id="ss-article-cases-style" rel="stylesheet" href="/assets/article-cases.css">');
    await writeFileUtf8(file, page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n');
  }
  return { linkedExamples: Object.keys(ARTICLE_CASES).length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await buildArticleCases()));
