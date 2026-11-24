export const ARTICLE_WORKFLOWS = Object.freeze({
  'offline-file': {
    tool: 'board', route: '/tools/trip-board/', article: '/honja-yeohaeng-junbimul-checklist/',
    title: '준비표와 복원 파일의 차이',
    scope: '가상 준비판으로 파일 저장·복원을 시험하는 연결입니다. 이 페이지 자체의 오프라인 실행이나 예약 정보 보관을 보장하지 않습니다.'
  },
  'deadline-confirmation': {
    tool: 'deadlines', route: '/tools/reservation-deadlines/', article: '/honja-yeohaeng-gamjeong-gwanri/',
    title: '원문 시간대·요청 전달·처리 완료를 나눠 보기',
    scope: '기존 가상 사례로 기록의 구분을 시험합니다. 가상 기록은 일정 파일에 넣지 않으며 변경·취소 요청이나 환불 판단을 실행하지 않습니다.'
  }
});

export function readArticleWorkflow(hash, tool) {
  const id = new URLSearchParams(String(hash).replace(/^#/, '')).get('workflow');
  return Object.hasOwn(ARTICLE_WORKFLOWS, id) && ARTICLE_WORKFLOWS[id].tool === tool ? ARTICLE_WORKFLOWS[id] : null;
}

export function mountArticleWorkflow(tool, container) {
  const workflow = readArticleWorkflow(location.hash, tool);
  if (!workflow) return;
  const note = document.createElement('aside');
  note.id = 'article-workflow-note';
  note.className = 'ss-tool-note';
  const title = document.createElement('p');
  title.textContent = `글에서 이어 보는 가상 사례: ${workflow.title}`;
  const scope = document.createElement('p');
  scope.textContent = workflow.scope + ' 사례는 기존 가상 사례 버튼을 직접 눌렀을 때만 불러옵니다.';
  const back = document.createElement('a');
  back.href = `${workflow.article}#ss-workflow-walkthrough`;
  back.textContent = '글의 준비·확인 과정 다시 보기';
  back.target = '_blank';
  back.rel = 'noopener';
  back.title = '새 탭에서 열기';
  note.append(title, scope, back);
  container.after(note);
}
