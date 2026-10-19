export const SOCIAL_ACTIVITY_SLUG = 'honja-yeohaeng-social-activity';
export const SOCIAL_ACTIVITY_MODIFIED = '2026-10-17T19:50:00+09:00';
export const SOCIAL_ACTIVITY_HOME_UPDATE = `<li id="social-activity-update"><time datetime="2026-10-17">2026.10.17</time> · <a href="/${SOCIAL_ACTIVITY_SLUG}/">혼자 여행 가이드·교류 선택</a>: 도쿄 운영자 2곳의 비용·배정 규정을 대조하고, 계절별 해산 지점과 귀환·개인정보 확인표를 추가했습니다.</li>`;
export const SOCIAL_ACTIVITY_SOURCES = {
  tokyo: 'https://www.gotokyo.org/en/guide-services/',
  asakusa: 'https://www.gotokyo.org/en/guide-services/asakusa-route/index.html',
  tfgPolicy: 'https://www.tokyofreeguide.org/guide-policy-2/',
  tfgService: 'https://www.tokyofreeguide.org/en/tour-guide-service/',
  tfgPrivacy: 'https://www.tokyofreeguide.org/en/privacy-policy/'
};

export const SOCIAL_ACTIVITY_GUIDES = [{
  slug: SOCIAL_ACTIVITY_SLUG,
  title: '혼자 여행 가이드·교류 선택: 도쿄 비용·배정·귀환 비교',
  previousTitle: '혼자 여행 중 사람들과 자연스럽게 어울리는 법',
  summary: '도쿄 자원봉사 가이드 2곳의 인원·비용·예약 확정 조건을 비교합니다. 아사쿠사 코스의 계절별 출발·해산 차이, 안내료와 실비, 개인정보 전달 범위를 구분하는 개인용 확인표를 제공합니다.',
  body: `
<p>혼자 여행 중 현지인과 대화하고 싶다는 목적과 다른 여행자를 만나고 싶다는 목적은 다릅니다. 가이드가 있는 관광을 신청해도 또래 동행이나 자유로운 친목 모임이 생긴다고 보장할 수는 없습니다. 이 글은 ‘투어나 클래스가 누구에게나 가장 쉽다’는 순위를 매기는 대신, <strong>내가 원하는 만남과 운영자가 실제로 제공하는 서비스를 맞추는 방법</strong>을 도쿄 사례로 설명합니다.</p>
<p><strong>자료 확인일: 2026-10-17.</strong> GO TOKYO의 Tokyo Volunteer Guides와 별도 단체인 TOKYO FREE GUIDE(TFG)의 공개 문서를 대조했습니다. 직접 참가·예약·운영자 회신을 받은 후기가 아니며, 현재 빈자리·한국어 배정·현장 안전을 확인한 자료도 아닙니다. 다른 나라의 모임에 이 두 서비스의 조건을 그대로 적용하지 않습니다.</p>
<h2 id="social-purpose">1. 가이드와의 교류인가, 다른 여행자와의 모임인가</h2>
<p><a href="${SOCIAL_ACTIVITY_SOURCES.tfgService}">TFG 서비스 소개</a>는 개인 맞춤 안내를 제공한다고 설명합니다. 혼자 신청할 수 있다는 말이 정해진 합류형 단체 투어가 있다는 뜻은 아닙니다. GO TOKYO의 코스형 안내도 최대 정원이 적혀 있다는 이유만으로 다른 신청자와 함께하는 친목 상품이라고 해석하지 않습니다.</p>
<figure class="wp-block-table"><table><caption>서비스 소개를 읽기 전에 정할 질문 · 특정 활동의 안전·친목 효과를 평가한 표가 아닙니다</caption><thead><tr><th>원하는 결과</th><th>신청 전에 물을 질문</th><th>설명만으로 가정하지 않을 것</th></tr></thead><tbody>
<tr><td>동네와 문화에 관해 대화하기</td><td>안내 언어, 관심 주제, 설명하며 걷는 범위는?</td><td>현지 거주·봉사 경력이 전문 자격을 뜻한다는 결론</td></tr>
<tr><td>다른 여행자 만나기</td><td>실제로 타인과 합류하는 형식인가? 최소 인원 미달 시 어떻게 되나?</td><td>최대 5명이라는 정원이 실제 5명 참가를 뜻한다는 결론</td></tr>
<tr><td>짧게 참여하고 예정대로 돌아오기</td><td>종료 장소·예상 시각, 중도 이탈 시 연락 방식은?</td><td>활동 종료가 숙소 도착이나 귀환 동행을 포함한다는 결론</td></tr>
</tbody></table></figure>
<p>원하는 형식이 다르면 유명한 프로그램이어도 후보에서 제외할 수 있습니다. 교류를 선택하지 않는 날을 실패로 취급하지 않습니다. 혼자 지내기 힘들어 지원이 필요한 상황은 <a href="/honja-yeohaeng-gamjeong-gwanri/">도움 요청과 일정 변경 가이드</a>에서 구분하며, 새로운 모임이 전문 지원을 대신한다고 설명하지 않습니다.</p>
<h2 id="social-operators">2. 이름이 비슷해도 인원·배정 규칙은 별개입니다</h2>
<p><a href="${SOCIAL_ACTIVITY_SOURCES.tokyo}">GO TOKYO 공통 안내</a>와 <a href="${SOCIAL_ACTIVITY_SOURCES.tfgPolicy}">TFG 신청 약관</a>을 함께 읽었습니다. 아래는 문서상 조건이지 오늘 신청 가능한 재고가 아닙니다. TFG 약관의 개정 표시는 2024-11-02이며, 일본의 일반적인 성년 기준을 추정해 운영자 신청 연령을 바꾸지 않았습니다.</p>
<figure class="wp-block-table"><table><caption>2026-10-17에 확인한 게시 조건 · 운영자가 다른 두 서비스</caption><thead><tr><th>확인 항목</th><th>Tokyo Volunteer Guides · GO TOKYO</th><th>TOKYO FREE GUIDE · TFG</th></tr></thead><tbody>
<tr><td>인원과 안내 형식</td><td>참가 최대 5명, 가이드 2명. 코스별 집합 장소 확인</td><td>일행 최대 6명, 일행당 가이드 1명. 맞춤 일정</td></tr>
<tr><td>연령 문구</td><td>일행 중 적어도 1명은 20세 초과(over 20)</td><td>신청자는 20세 이상(not younger than 20)</td></tr>
<tr><td>신청 시기</td><td>희망일 1개월 전부터 3일 전까지</td><td>최대 2개월 전. 적어도 2주 전 신청하지 않으면 배정이 어려운 사유에 해당</td></tr>
<tr><td>언어</td><td>한국어 포함 7개 언어 안내, 희망 날짜 배정은 별도</td><td>신청 안내는 영어 중심. 요청 언어·가이드 수급에 따라 배정 불가 가능</td></tr>
</tbody></table></figure>
<p>연령 경계에 해당한다면 번역 표현만 보고 통과를 단정하지 말고 해당 운영자에게 확인합니다. TFG는 가이드의 자격·경력을 보증하지 않으며 행사·표 예약을 대행하는 역할도 아니라고 명시합니다. 두 단체의 명칭이나 봉사 활동이라는 성격을 안전 인증·전문 통역·상업 여행사의 책임 범위로 확대하지 않습니다.</p>
<p><strong>접수 → 가이드 배정 → 집합·일정 합의</strong>를 따로 기록합니다. TFG의 자동 접수 메일은 신청 등록 단계입니다. 약관은 가이드가 배정되면 직접 이메일로 연락하고, 희망일 2일 전까지 연락이 없으면 배정되지 못한 것이며 별도 통지가 없다고 설명합니다. 신청서만 낸 상태에서 다른 유료 일정을 취소하거나 숙소까지 픽업이 확정됐다고 생각하지 않습니다.</p>
<h2 id="social-costs">3. 무료는 안내료와 실비를 나눠 읽기</h2>
<p>GO TOKYO는 안내 자체의 요금과 참가 실비를 구분합니다. 실비에는 참가자와 가이드 2명의 교통·입장 비용, 종료 후 가이드가 집합 장소로 돌아가는 비용이 포함됩니다. 게시 금액은 참가자 1명일 때 기준이고 정확한 금액은 인원에 따라 이메일로 안내합니다. 반면 TFG 약관의 부담 항목은 활동 중 가이드의 교통·입장·식사이며, 활동 전후 가이드가 집합 장소를 오가는 비용은 참가자 부담에서 제외합니다. <a href="${SOCIAL_ACTIVITY_SOURCES.tokyo}">GO TOKYO 비용 설명</a> · <a href="${SOCIAL_ACTIVITY_SOURCES.tfgPolicy}">TFG 약관 3항</a></p>
<div class="ss-worked-example"><p><strong>게시 요금과 편집부의 가정을 분리한 1인 예시</strong></p><p><a href="${SOCIAL_ACTIVITY_SOURCES.asakusa}">GO TOKYO 아사쿠사 Route 3</a>의 게시 금액은 <strong>1,620엔 = 참가자 280엔 + 가이드 2명분 1,340엔</strong>입니다. 이 글에서 개인의 해산 후 이동·추가 지출을 임의로 700엔이라고 가정하면 합계는 <strong>2,320엔</strong>입니다. 700엔은 실제 귀환 운임이 아니며, 1,620엔도 내 예약의 최종 견적이 아닙니다.</p></div>
<p>위 합계는 두 단체의 가격 순위가 아닙니다. TFG는 동선·식사·입장 장소가 정해져야 실비를 계산할 수 있어 동일 코스 총액을 알 수 없습니다. 본인과 가이드 비용을 각각 적고, 견적에 이미 포함된 가이드 귀환 비용을 다시 더하지 않습니다. ‘안내료 0’만 적거나 확인하지 않은 항목을 0으로 채우면 실제 지출을 비교할 수 없습니다.</p>
<p>GO TOKYO는 일본 엔으로 납부한다고 안내합니다. 현금 외 결제 가능 여부나 준비할 액면은 확인 답변에 맞춰 준비합니다. 별도로 결제한 교통권·입장권의 변경 조건이 가이드 신청 조건과 같다고 간주하지 않습니다.</p>
<h2 id="social-endpoint">4. 실제 아사쿠사 코스는 출발지로 돌아와 끝나지 않습니다</h2>
<p><a href="${SOCIAL_ACTIVITY_SOURCES.asakusa}">Route 3 운영 페이지</a>의 1~6월·10~12월 안내는 신주쿠 고속버스터미널의 관광안내소에서 13:00 출발, 약 3.5시간이며 다와라마치역에서 끝납니다. 7~9월은 10:00 출발·약 2.5시간의 축소 코스이고 종료 지점은 아사쿠사역입니다. 신주쿠 집합만 저장해 두면 해산 뒤 출발점으로 복귀한다고 오해할 수 있습니다.</p>
<p>10월의 13:00에 3.5시간을 더한 <strong>16:30은 설명상 소요시간을 더한 예상값</strong>이지 실제 해산·숙소 도착을 보증하는 시각이 아닙니다. 다와라마치역에서 다음 목적지로 가는 경로와 본인의 교통비를 따로 확인합니다. 계절이 바뀌면 시각뿐 아니라 종료 역도 다시 저장해야 합니다.</p>
<p>이처럼 확인표에는 ‘투어 종료’와 ‘개인 귀환’을 다른 줄에 씁니다. TFG의 맞춤 안내는 코스형 상품의 역 이름을 복사하지 않고 담당자와 합의한 집합·종료 장소를 적습니다. 중도에 그만두고 싶을 때 누구에게 알리는지, 이후 동행 없이 이동할 수 있는 경로가 있는지도 문의합니다. 공개 장소·낮 시간·고정 종료 시각이 있다는 사실만으로 누구에게나 안전하다고 판정하지 않습니다.</p>
<p>해산 후 짐을 찾는다면 <a href="/honja-yeohaeng-achim-routine/">짐 회수·출발 실행표</a>에 회수 마감을 연결합니다. 늦은 체크인이 예상되면 <a href="/honja-yeohaeng-sukso-goreuneun-beop/">숙소 출입 확인 기준</a>으로 다시 확인합니다. 이동이 해결되지 않았는데 분위기에 따라 저녁 식사나 다음 모임부터 추가하지 않습니다.</p>
<h2 id="social-cancel-privacy">5. 취소와 정보 전달은 공식 경로에서 확인하기</h2>
<p>Route 3는 취소 시 적어도 하루 전에 연락하라고 적습니다. 이를 ‘24시간 전이면 모든 지출 전액 환불’로 바꾸지 않습니다. <a href="${SOCIAL_ACTIVITY_SOURCES.tfgPolicy}">TFG 약관 6·7항</a>은 불가피한 사유·극한 상황에 가이드가 사전 통지 후 취소할 수 있고, 참가자의 통지 없는 갑작스러운 취소는 향후 이용 거절 사유가 될 수 있으나 불가피한 사유에는 예외를 둡니다. 한 운영자의 조건을 다른 운영자의 취소·환불 규칙으로 사용하지 않습니다.</p>
<p><a href="${SOCIAL_ACTIVITY_SOURCES.tfgService}">TFG 서비스 안내의 변경·취소 경로</a>는 공식 로그인 화면을 안내합니다. 배정 담당자가 있다면 변경 사항의 전달·반영도 확인합니다. 메일 발송과 취소 완료를 같은 상태로 표시하지 않습니다. 이 글은 두 단체에 실제 취소 문의를 보내지 않았고, 비용 청구·환불 결과를 확인하지 않았습니다.</p>
<p><a href="${SOCIAL_ACTIVITY_SOURCES.tfgPrivacy}">TFG 개인정보 처리 안내</a>는 마지막 갱신을 2016-01-25로 표시하고, 매칭에 쓰는 연락·여행 정보에 숙소도 포함한다고 설명합니다. 따라서 ‘숙소 이름은 누구에게도 알려주면 안 된다’는 일괄 규칙 대신, <strong>공식 신청에 필요한 정보인지와 공개 게시글인지</strong>를 구분합니다. 오래된 정책 문서로 현재 신청서의 모든 필수 항목이나 보안 수준까지 확인한 것은 아닙니다.</p>
<p>신청은 이 글에 연락처를 남기는 방식이 아니라 운영자 공식 사이트에서 시작합니다. 도메인과 공식 링크를 확인하고 필요한 항목·사용 목적이 불분명하면 운영자에게 문의합니다. 공개 모임 글에는 객실 번호·예약번호·여권 사본을 올리지 않습니다. 결제 비밀번호나 일회용 인증번호를 가이드에게 전달하지 않으며, 사진 공개·이후 개인 연락에 동의했는지도 별도로 정합니다. 현지 위험이나 긴급 상황은 예약 문의의 답변을 기다리지 말고 <a href="/honja-yeohaeng-emergency-response/">현지 긴급지원 경로</a>를 이용합니다.</p>
<h2 id="social-private-sheet">6. 참가 전에는 한 장에 ‘확정된 것’만 남기기</h2>
<p><a href="/assets/social-activity-check.txt" download>가이드·교류 참가 확인표 내려받기</a>는 개인 기기에 보관하는 빈 문서입니다. 이 사이트에 입력하거나 제출하지 않으며 작성 내용이 전송되지 않습니다. 운영자 이름, 접수·배정·합의 상태, 비용 포함 범위와 개인 귀환 경로를 한곳에 적습니다. 안전 점수나 참가 자격 판정표가 아닙니다.</p>
<blockquote><p><strong>운영자에게 보낼 확인 문안</strong><br>1인 참가를 검토하고 있습니다. 제 신청은 접수만 된 상태인가요, 가이드 배정까지 완료됐나요? [희망일·언어]의 집합·종료 장소와 예상 시간을 알려 주세요. 본인 및 가이드 실비·식사·귀환 비용 중 포함되지 않은 항목은 무엇인가요? 변경·취소와 당일 연락은 어느 공식 경로로 해야 하나요? 신청에 필요한 개인정보의 범위도 확인 부탁드립니다.</p></blockquote>
<p>담당자의 답변이 없으면 ‘가능’이나 ‘0엔’ 대신 ‘미확인’으로 남깁니다. 가이드가 배정돼도 귀환 교통·숙소 출입·별도 티켓이 자동으로 해결되지는 않습니다. 목적에 맞는 형식, 확인된 비용, 직접 돌아올 경로가 갖춰졌는지 대조하고 남은 질문을 해결하는 것이 이 글의 끝입니다. 실제 참가의 만족도나 안전을 보증하지 않습니다.</p>`
}];

export const SOCIAL_ACTIVITY_REVISION = {
  guides: SOCIAL_ACTIVITY_GUIDES, modified: SOCIAL_ACTIVITY_MODIFIED,
  homeUpdate: SOCIAL_ACTIVITY_HOME_UPDATE, updateId: 'social-activity-update',
  className: 'ss-regional-guide', stylesheet: '/assets/regional-guides.css', styleId: 'ss-regional-style',
  trustNote: '도쿄 운영자별 공개 규정 대조 및 참가 확인표 구성',
  limitation: '직접 참가 후기·예약 확정·안전 인증이 아닙니다.', worksheets: 1
};
