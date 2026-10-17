export const DINING_SLUG = 'honja-yeohaeng-sikdang-goreuneun-beop';
export const DINING_MODIFIED = '2026-10-17T11:05:47+09:00';
export const DINING_HOME_UPDATE = `<li id="dining-update"><time datetime="2026-10-17">2026.10.17</time> · <a href="/${DINING_SLUG}/">혼자 여행 식당 선택</a>: 일본 식당의 실제 공식 안내로 인원·주문량·별도 이용료·결제·마지막 주문을 대조했습니다.</li>`;
export const DINING_SOURCES = {
  kozuki: 'https://www.hakata-kozuki.com/menu_honten/',
  ooyama: 'https://www.motu-ooyama.com/shop/nagoya_jrgt/',
  gyukaku: 'https://www.gyukaku.ne.jp/lp/202507_student/',
  ichiranSystem: 'https://en.ichiran.com/en/system.html',
  ichiranFaq: 'https://en.ichiran.com/contact/inquiry-faqlist.php',
  ichiranPriority: 'https://en.ichiran.com/yusen-service.html',
  ichiranAllergy: 'https://en.ichiran.com/ramen/allergie.html',
  sushiro: 'https://www.akindo-sushiro.co.jp/en/',
  sushiroPaymentJapan: 'https://www.akindo-sushiro.co.jp/campaign/detail.php?id=1456'
};

export const DINING_GUIDES = [{
  slug: DINING_SLUG,
  title: '혼자 여행 식당 선택: 1인 주문·메뉴 가격·결제 조건 비교',
  previousTitle: '혼자 여행 중 식당 고르는 법: 혼밥이 편한 곳을 판단하는 기준',
  summary: '일본 식당의 공식 메뉴로 2명 이상 이용과 2인분 이상 주문을 구분합니다. 세금 포함 가격·별도 이용료 계산, 1인 예외와 예약 인원의 차이, 결제·마지막 주문을 실제 사례로 대조합니다.',
  body: `
<p>메뉴에 ‘1인분 가격’이 있어도 혼자 그 양을 주문할 수 있다는 뜻은 아닙니다. 좌석이 하나 비어 있다는 사실도 최소 인원·주문 조건을 대신하지 않습니다. 이 글은 가격표와 이용 조건을 읽어 혼자 식사를 마칠 수 있는지 판단하는 가이드입니다.</p>
<p><strong>자료 확인일: 2026-10-17.</strong> 아래 사례는 일본 식당 운영자가 공개한 메뉴·도움말을 대조한 것입니다. 직접 먹어 본 후기나 맛집 순위가 아니며, 다른 나라·모든 지점에 동일한 규칙을 적용하지 않습니다. 방문 날짜의 가격·좌석·이용 허용과 결제 성공은 매장에 다시 확인해야 합니다.</p>
<h2 id="dining-people-portions">1. ‘2명부터’와 ‘2인분부터’를 먼저 구분하기</h2>
<figure class="wp-block-table"><table><thead><tr><th>원문 표현</th><th>확인하는 단위</th><th>혼자 갈 때의 질문</th></tr></thead><tbody>
<tr><td>1人前 / お一人様</td><td>1인분 또는 1인당 표시 가격</td><td>표시 단위와 실제 최소 주문량이 같은가?</td></tr>
<tr><td>2人前より</td><td>음식을 최소 2인분 주문하는 조건</td><td>1명 입장은 가능한가? 1인분 예외가 있는가?</td></tr>
<tr><td>2名様以上 / 受付人数 2名様〜</td><td>이용·접수 인원 조건</td><td>해당 메뉴·예약 경로가 1명도 받는가?</td></tr>
</tbody></table></figure>
<p><a href="${DINING_SOURCES.gyukaku}">규카쿠의 학생 그룹 한정 행사</a>는 1인당 세금 포함 2,500엔을 표시하지만, 이용 조건은 2명 이상이며 그룹 전원의 학생 신분 확인을 요구합니다. 평일 한정과 제외 매장도 있습니다. 이 가격을 ‘혼자 이용 가능한 2,500엔 식사’로 읽으면 안 됩니다. 두 사람분 금액을 낸다고 인원·자격 조건이 자동 충족되는 것도 아닙니다.</p>
<p>이 제한은 해당 학생 행사에 대한 것입니다. 규카쿠 전체가 1인 손님을 받지 않는다고 확대하지 않고, 다른 단품·점심·지점의 조건은 별도로 확인합니다. 외국 학교의 증명서가 행사 자격으로 인정되는지도 이 조사에서 확인하지 않았습니다.</p>
<h2 id="dining-menu-cost">2. 실제 메뉴 두 곳: 주문량·별도 이용료·1인 예외</h2>
<p><a href="${DINING_SOURCES.kozuki}">후쿠오카 ‘こうづき(코즈키) 본점’ 공식 메뉴</a>는 모츠나베를 1인분 세금 포함 1,848엔, 주문은 2인분부터로 안내하며 1인당 별도 이용료는 세금 포함 550엔으로 게시합니다. 세금 별도 가격 1,680엔을 결제 기준으로 쓰거나, 이미 세금이 포함된 가격에 다시 세금을 더하지 않습니다.</p>
<figure class="wp-block-table"><table><caption>2026-10-17 열람한 게시 가격의 부분 합계 · 실제 최종 청구액·1인 입장 허용 확인 아님</caption><thead><tr><th>가정한 이용</th><th>음식·이용료 계산</th><th>계산에 없는 것</th></tr></thead><tbody>
<tr><td>1명에게 2인분 주문이 허용된다고 가정</td><td>1,848 × 2 + 550 × 1 = 4,246엔</td><td>실제 1명 입장 허용·음료·추가 주문·다른 필수 비용</td></tr>
<tr><td>2명이 2인분을 함께 주문한다고 가정</td><td>1,848 × 2 + 550 × 2 = 4,796엔</td><td>음료·추가 주문·다른 필수 비용</td></tr>
</tbody></table></figure>
<p>이는 게시된 두 항목만 합한 계산입니다. 이 글은 코즈키에 1명 입장이나 예외 주문을 문의하지 않았습니다. 4,246엔을 준비하면 혼자 반드시 입장할 수 있다거나 이것이 최종 결제액이라고 보장하지 않습니다. 최소 인원, 음료 등 추가 필수 주문, 실제 당일 가격을 확인한 뒤 예산으로 사용합니다.</p>
<p>반대로 <a href="${DINING_SOURCES.ooyama}">‘모츠나베 오오야마 나고야 JR 게이트타워점’ 공식 안내</a>의 ‘元祖おおやまセット’ 설명은 1명 방문객은 1인분부터 주문 가능하다고 적고, 해당 세트는 좌석 이용료 포함으로 표시합니다. 그러나 같은 세트의 접수 인원에는 ‘2名様〜’도 함께 나옵니다. <strong>1인 주문 예외가 안내돼 있다는 사실과 해당 온라인 코스 예약이 1명으로 완료된다는 사실은 다릅니다.</strong></p>
<p>이 경우 ‘2명부터’만 보고 식당 전체가 혼밥 불가라고 단정하거나, 반대로 1인 예외 문구만 보고 온라인 예약까지 된다고 단정하지 않습니다. 원하는 날짜·지점·세트·현장 또는 예약 이용을 지정해 직원에게 묻습니다. 다른 지점에 이 예외를 옮기지 않으며, 음식 구성이 다른 두 식당을 단순 가격 순위로 비교하지 않습니다.</p>
<h2 id="dining-order-payment">3. 주문 방식과 결제 수단은 다른 확인입니다</h2>
<p><a href="${DINING_SOURCES.ichiranSystem}">이치란 공식 이용 안내</a>는 빈 좌석 표시, 취향을 적는 주문서, 식권 전달과 호출 버튼의 흐름을 설명합니다. 주문 과정을 미리 이해하는 데 유용하지만 대기가 짧다거나 모든 매장 구조가 같다는 보증은 아닙니다. 메뉴를 사진으로 골랐더라도 결제 가능한 수단과 추가 주문의 비용은 따로 확인합니다.</p>
<figure class="wp-block-table"><table><thead><tr><th>공식 안내에서 읽은 것</th><th>확인된 범위</th><th>자동으로 따라오지 않는 결론</th></tr></thead><tbody>
<tr><td>이치란 FAQ의 캐시리스 대응</td><td>일부 예외 매장이 있으며 각 매장 안내 확인 필요</td><td>내 카드·내 지점에서 반드시 결제 성공</td></tr>
<tr><td>스시로 다국어 터치패널</td><td>영어·중국어·한국어 주문 안내</td><td>그 언어로 모든 특별 요청·식재료 확인 가능</td></tr>
<tr><td>스시로 영문·일본어 결제 안내</td><td>같은 지점도 언어별 지원 서비스 표기에 차이</td><td>한 언어의 소개만으로 당일 지원 앱을 확정</td></tr>
</tbody></table></figure>
<p><a href="${DINING_SOURCES.ichiranFaq}">이치란 공식 FAQ</a>는 캐시리스 식권기 도입에 예외가 있으므로 각 매장을 확인하라고 안내합니다. <a href="${DINING_SOURCES.sushiro}">스시로 공식 영문 안내</a>는 유니버설 시티워크 오사카점의 QR 결제를 PayPay로 한정해 적지만, <a href="${DINING_SOURCES.sushiroPaymentJapan}">일본어 결제 안내</a>는 같은 지점에 PayPay·Alipay를 함께 표시합니다. 이 차이를 무시하고 ‘지금은 PayPay만 가능’ 또는 ‘모든 QR 앱이 가능’이라고 결론 내리지 않습니다. 자료의 갱신 순서와 당일 단말기 지원까지 검증한 것이 아니므로 해당 지점에 실제 사용할 앱을 지정해 확인합니다.</p>
<p>방문할 정확한 지점의 결제 브랜드·기기 방식·현금 가능 여부를 확인하고, 결제 실패 때 사용할 수단도 준비합니다. 이 사이트에서 카드번호를 받거나 결제 호환성을 시험한 것은 아닙니다. 매장 화면에 표시되지 않은 수수료나 환율을 임의의 0원으로 넣지 않습니다.</p>
<h2 id="dining-order-deadlines">4. 마지막 주문과 우선 안내를 착석 보장으로 읽지 않기</h2>
<p>위 규카쿠 학생 행사 안내는 90분 이용에 마지막 주문 70분이라고 표시합니다. 차이인 20분은 추가 주문이 가능한 시간이라는 뜻이 아니라, 게시 조건상 주문 마감 뒤 남는 이용시간입니다. 이 숫자를 해당 지점의 폐점 시각이나 줄을 서기 시작해도 되는 시각으로 바꾸지 않습니다. 실제 방문일의 행사 시행과 입장 마감은 따로 확인해야 합니다.</p>
<p>이치란의 일반 FAQ에는 예약을 받지 않는다는 안내가 있지만, <a href="${DINING_SOURCES.ichiranPriority}">별도의 우선 안내 서비스 페이지</a>는 일부 참여 매장의 사전 시간 지정·카드 결제를 설명합니다. 해당 페이지는 좌석만 예약할 수 없고 착석 가능성도 보장하지 않는다고 적습니다. 일반 안내와 특정 서비스의 적용 범위가 다르므로, 원하는 지점·상품의 현재 신청 화면을 읽어야 합니다. 이 글은 신청·결제를 진행하거나 당일 자리를 확보하지 않았습니다.</p>
<p>귀환 교통이 있다면 마지막 주문뿐 아니라 대기·식사·계산·식당에서 역까지의 이동을 함께 봅니다. 대기 예상이 확인되지 않으면 무조건 0분이나 임의의 평균으로 채우지 않습니다. 출발편을 지키기 어려워지는 대기라면 다른 후보로 바꿀 시점을 정하고, 예약된 서비스는 변경·취소 조건을 먼저 확인합니다.</p>
<h2 id="dining-ingredient-limits">5. 재료표·메뉴 사진으로 개인의 섭취 안전을 판정하지 않기</h2>
<p><a href="${DINING_SOURCES.ichiranAllergy}">이치란 공식 알레르기 정보</a>는 음식에 재료로 들어 있는 항목과, 해당 요리에 쓰지 않아도 같은 시설에서 취급되는 항목을 다르게 표시합니다. 지점별 메뉴 구분도 있습니다. 표의 공란이나 주재료 이름만으로 ‘나에게 안전하다’고 결론 내리거나 다른 지점·조리 변경에 그대로 적용하지 않습니다.</p>
<p>식이 제한이 있다면 정확한 메뉴·지점을 지정해 직원에게 확인하고 개인의 의료적 대응 계획을 따릅니다. 이 글은 알레르기 진단이나 섭취 가능 판정을 제공하지 않습니다. 온라인 평점·사진·회전이 빠르다는 인상만으로 특정 식당의 위생도 인증하지 않습니다. 즉각적인 신체 위험이 생겼다면 문의표 작성보다 현지 긴급서비스 요청이 먼저이며, 연락 구분은 <a href="/honja-yeohaeng-emergency-response/">위급 상황 대응</a>에서 확인할 수 있습니다.</p>
<h2 id="dining-candidate-sheet">6. 두 후보를 비교할 때 남길 한 장</h2>
<p><a href="/assets/dining-order-check.txt" download>혼자 식사 메뉴·이용 조건 대조표 내려받기</a>에 지점·날짜·메뉴, 최소 인원과 최소 주문량, 세금 포함 가격·별도 이용료, 실제 결제 수단과 마지막 주문을 적습니다. 빈 항목은 ‘제한 없음’이나 ‘추가금 없음’이 아니라 미확인입니다. 단체 행사만 불가능한 후보를 식당 전체의 이용 불가로 표시하지 않습니다.</p>
<blockquote><p><strong>매장에 확인할 질문</strong><br>1명으로 [날짜·시간]에 [지점·메뉴]를 이용하려 합니다. 최소 2명 조건인가요, 2인분 주문 조건인가요? 1인 주문 예외와 이용 가능한 예약 방법이 있나요? 세금·좌석 이용료·필수 주문을 포함한 비용, 가능한 결제 수단, 입장과 마지막 주문 마감을 알려 주세요.</p></blockquote>
<p>비교의 첫 단계는 싸고 비싼 순위를 매기는 것이 아니라 내가 이용할 수 있는 후보인지 구분하는 것입니다. 인원·주문·예산·시간·결제가 확인된 뒤 귀환 동선을 연결합니다. 첫날 도착과 식사 준비를 함께 정리하려면 <a href="/honja-yeohaeng-junbi-gijun/">출발 결정표</a>에서 도착 교통과 체크인 조건도 확인합니다. 이 글의 질문을 매장에 실제로 보내거나 답변을 받은 것은 아닙니다.</p>`
}];

export const DINING_REVISION = {
  guides: DINING_GUIDES, modified: DINING_MODIFIED,
  homeUpdate: DINING_HOME_UPDATE, updateId: 'dining-update',
  className: 'ss-regional-guide', stylesheet: '/assets/regional-guides.css', styleId: 'ss-regional-style',
  trustNote: '운영자 공식 메뉴·주문 조건 대조 및 계산 사례 구성',
  limitation: '직접 이용 후기·현재 입장 허용·개인별 식품 안전을 보증하지 않습니다.', worksheets: 1
};
