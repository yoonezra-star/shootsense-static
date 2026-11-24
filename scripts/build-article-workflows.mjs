import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { ARTICLE_WORKFLOWS } from '../assets/article-workflows.js';
import { escapeHtml, writeFileUtf8 } from './lib/static-site-utils.mjs';

export const WORKFLOW_CONTENT = {
  'offline-file': {
    steps: [
      ['계산을 모은 상태', '가상 준비판을 열면 계산 기록 3/3이 표시됩니다. 숙소 후보는 미선택이고 같은 여행 연결도 미확인입니다. 계산 개수는 준비 완료 점수가 아닙니다.'],
      ['읽을 준비표', '준비표 내려받기는 텍스트 파일입니다. 저장된 날짜·시각·미확인 조건을 읽는 용도이며, 이 파일로 입력을 복원하지 않습니다. 인쇄한 준비표도 복원 파일을 대신하지 않습니다.'],
      ['복원할 입력', '준비판 파일 저장은 JSON입니다. 페이지를 다시 열면 입력은 비어 있으며, 파일 불러오기에서 직접 저장한 JSON을 선택해야 합니다. 복원 후 같은 여행·숙소 연결은 다시 확인해야 합니다.'],
      ['기기 밖의 대안', '텍스트 파일도 같은 휴대폰 안에만 있으면 휴대폰 분실의 대안이 아닙니다. 주소·연락 경로는 별도 비공개 메모나 인쇄물에서도 확인합니다. 준비판은 주소·전화번호를 정리하는 전용 보관함이 아닙니다.']
    ],
    boundary: '이 도구의 일정 계산은 일본 현지 시각, 숙소 비용은 원화 기준입니다. 내려받은 텍스트를 인터넷 없이 열 수 있는지는 사용할 기기의 파일 앱에서 직접 시험해야 합니다. 준비판 웹페이지나 JSON 복원 기능이 오프라인으로 작동한다는 뜻은 아닙니다.',
    privacy: '개인 파일에는 입력한 여행 조건이 들어갑니다. 예약번호·여권·결제정보·출입 코드·건강정보를 넣거나 공개 링크로 공유하지 않습니다. 준비판에서 모두 비우기를 눌러도 이미 내려받은 파일은 지워지지 않습니다.'
  },
  'deadline-confirmation': {
    steps: [
      ['원문과 보기 시간대', '가상 사례의 도쿄 기록은 2026-12-10 12:00 Asia/Tokyo입니다. 서울로 볼 때도 12:00으로 나오지만, 숫자가 같다는 이유로 다른 예약의 원문 시간대를 생략하면 안 됩니다.'],
      ['같은 시각이 두 번인 경우', '뉴욕 가상 기록 2027-11-07 01:30은 도구의 시간대 정보에서 중복 시각으로 표시됩니다. 원문의 UTC 오프셋이 미확인이면 변환을 보류합니다. 편한 쪽의 시각을 임의로 선택하지 않습니다.'],
      ['요청과 완료', '뉴욕 가상 기록은 요청 전달·처리 미확인 상태입니다. 문의나 요청을 보낸 것만으로 완료 회신 확인으로 바꾸지 않습니다. 실제 완료 여부는 해당 예약처의 공식 처리 상태와 답변에서 확인합니다.'],
      ['개인 파일을 다시 연 뒤', 'JSON 개인 파일을 불러오면 기록은 복원되지만 원문 확인 표시는 해제됩니다. 원문 날짜·시각·시간대·조건을 다시 대조하기 전에는 일정 파일 포함 대상으로 삼지 않습니다. 가상 기록은 다시 확인해도 일정 파일에서 제외됩니다.'],
      ['일정 파일의 역할', 'ICS는 조건을 확인한 미래의 실제 미완료 기록만 대상으로 합니다. 가상·미확인·처리 완료·마감 도달 기록은 제외합니다. 파일을 만드는 것은 예약 취소 실행이나 알림 발송이 아닙니다. 가져온 일정은 자동 갱신되지 않으므로 기존 캘린더에서도 직접 관리해야 합니다.']
    ],
    boundary: '여기서는 기존 글의 환불 약관이나 개별 마감을 새로 판정하지 않습니다. 도움 요청이 필요한 상황이라면 기록 작성이나 예약 답변을 기다리느라 지원을 미루지 않습니다. 기기 시계와 시간대 정보에 따른 표시이며 실제 계약상 권리나 운용 결과를 보증하지 않습니다.',
    privacy: '메모에는 원문을 다시 찾을 수 있는 비민감한 표시만 남깁니다. 예약번호·여권·결제정보·건강정보는 넣지 않습니다. 파일과 외부 캘린더로 옮긴 이후의 보관·공유·알림 설정은 별도로 관리해야 합니다.'
  }
};

export async function buildArticleWorkflows(root = process.cwd()) {
  for (const [id, entry] of Object.entries(ARTICLE_WORKFLOWS)) {
    const file = path.join(root, entry.article, 'index.html');
    const page = load((await fs.readFile(file, 'utf8')).trimEnd());
    if (/noindex/.test(page('meta[name="robots"]').attr('content') || '')) throw new Error('Held article must not receive a workflow');
    page('#ss-workflow-walkthrough').remove();
    const content = WORKFLOW_CONTENT[id];
    const markup = `<aside id="ss-workflow-walkthrough" class="ss-case-walkthrough" aria-labelledby="ss-workflow-title"><p class="ss-case-date">도구 활용 연결 · 2026-11-24 · 본문의 자료 확인일과 별개</p><h2 id="ss-workflow-title">${escapeHtml(entry.title)}</h2><p>실제 여행·예약·운영자 회신이 아닌 기존 도구의 가상 사례로 확인하는 과정입니다. 도구를 열어도 기록을 자동으로 불러오지 않습니다.</p><dl>${content.steps.map(([label, text]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(text)}</dd></div>`).join('')}</dl><p>${escapeHtml(content.boundary)}</p><p>${escapeHtml(content.privacy)}</p><a class="ss-case-open" href="${entry.route}#workflow=${id}" target="_blank" rel="noopener" title="새 탭에서 도구 열기">이 과정의 도구 열기</a></aside>`;
    const anchor = page('#ss-related-tools').first();
    if (!anchor.length) throw new Error(`Missing tool links for ${entry.article}`);
    anchor.before(markup);
    if (!page('#ss-article-cases-style').length) page('head').append('<link id="ss-article-cases-style" rel="stylesheet" href="/assets/article-cases.css">');
    await writeFileUtf8(file, page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n');
  }
  return { linkedWorkflows: Object.keys(ARTICLE_WORKFLOWS).length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await buildArticleWorkflows()));
