import { PREDEPARTURE_HOME_UPDATE } from './predeparture-content.mjs';
import { REGIONAL_HOME_UPDATE } from './regional-access-content.mjs';

export const HOME_CONTENT = `
<div class="ss-home">
  <header class="ss-home-intro">
    <div class="ss-home-brand"><img src="/wp-content/uploads/2025/05/cropped-ChatGPT-Image-2025년-5월-5일-오후-01_56_24-192x192.png" width="64" height="64" alt=""><div><p class="ss-eyebrow">혼자 여행의 예약·이동 준비</p><h1>여행정보엑스퍼트</h1></div></div>
    <p class="ss-lead">숙소 두 곳의 실제 지출을 비교하고, 예약부터 귀가까지 빠뜨린 조건을 정리합니다.</p>
  </header>
  <section class="ss-home-tool" aria-labelledby="home-tool-title">
    <div><p class="ss-eyebrow">예약 전에 계산할 것</p><h2 id="home-tool-title">숙박비가 싼 곳이<br>총비용도 쌀까요?</h2><p>현장 추가금과 이동비를 합치고, 취소 손실·체크인 확인 상태를 나란히 보세요.</p><a class="ss-action" href="/tools/stay-compare/"><img src="/assets/icons/calculator.svg" alt="" width="18" height="18">숙소 총비용 비교</a></div>
    <div class="ss-home-example"><p class="ss-home-note">1박 가상 사례 · 실제 판매가 아님</p><p>A: 숙박 75,000 + 추가금 15,000 + 이동 18,000<br><strong>108,000원</strong></p><p>B: 숙박 91,000 + 이동 4,000<br><strong>95,000원</strong></p><p>표시 숙박비가 더 비싼 B의 입력 합계가 13,000원 적습니다. 취소 조건은 별도로 비교해야 합니다.</p></div>
  </section>
  <section class="ss-home-band" aria-labelledby="home-guides-title">
    <h2 id="home-guides-title">지금 결정할 일부터</h2>
    <ol class="ss-guide-list">
      <li><span class="number" aria-hidden="true">01</span><div><a href="/honja-yeohaeng-sukso-goreuneun-beop/">숙소 후보 두 곳 중 어디를 예약할까?</a><p>이용 시 총액과 취소 시 손실을 분리하는 계산 사례, 늦은 체크인 문의 문안, 예약 화면에서 저장할 항목을 정리했습니다.</p></div></li>
      <li><span class="number" aria-hidden="true">02</span><div><a href="/honja-yeohaeng-junbimul-checklist/">휴대폰이 꺼져도 숙소에 도착할 수 있을까?</a><p>통신·결제·주소를 분리해 준비하고, 출발 전에 직접 해볼 방전·오프라인 점검 순서를 확인합니다.</p></div></li>
      <li><span class="number" aria-hidden="true">03</span><div><a href="/honja-yeohaeng-junbi-gijun/">목적지는 정했는데 무엇부터 준비할까?</a><p>도착 교통, 숙소, 식사와 비상 연락을 예약 전·출발 전 순서로 정리하는 기본 문서입니다.</p></div></li>
      <li><span class="number" aria-hidden="true">04</span><div><a href="/honja-yeohaeng-emergency-response/">분실·부상·길 잃음이 생겼다면?</a><p>긴급 구조 요청과 일반 분실 처리를 구분하고, 위치·연락·기록의 우선순위를 확인합니다.</p></div></li>
    </ol>
  </section>
  <section class="ss-home-band" aria-labelledby="home-regions-title">
    <h2 id="home-regions-title">지역별로 달라지는 이동 조건</h2>
    <p class="ss-home-note">정부·관광청·운영자의 공개 자료를 바탕으로 정리한 준비 가이드입니다. 현장 방문 후기는 아닙니다.</p>
    <ul class="ss-region-list">
      <li><a href="/구경-대신-산책이-전부였던-샤르자-외곽의-오후/">아랍에미리트 · 샤르자 믈레이하</a><span>시내에서 약 65km 떨어진 방문지. 도심 산책과 사막 왕복 이동을 나눕니다.</span></li>
      <li><a href="/관광-코스가-없어-자유로웠던-사피-여행/">모로코 · 사피</a><span>도자기 공방과 국립 도자기 박물관은 목적과 위치가 다릅니다. 열차 경유와 1박을 비교합니다.</span></li>
      <li><a href="/여행자보다-주민이-더-많았던-투이호아의-분위기/">베트남 · 투이호아</a><span>해변 도심과 옛 푸옌 광역 명소를 구분하고, 행정구역 변경 뒤 예약 주소를 대조합니다.</span></li>
      <li><a href="/심심함이-여행의-일부가-된-반퐁에서의-며칠/">태국 · 반퐁</a><span>과거 문화시장 기록과 현재 행사 일정을 구분합니다. 시장이 없을 때의 방문 조건도 봅니다.</span></li>
      <li><a href="/추천은-못-해도-기억에서-지워지지-않는-코다이카날/">인도 · 코다이카날</a><span>산 아래 교통 도착과 산 위 숙소 도착은 별개입니다. 관측소 방문 신청도 따로 확인합니다.</span></li>
      <li><a href="/honja-lushan-yeohaeng/">중국 · 루산</a><span>산악 날씨, 구링 체류, 케이블카와 마지막 복귀 수단을 분리해 계획합니다.</span></li>
      <li><a href="/이탈리아-치비타-디-반뇨레조-근처-마을/">이탈리아 · 치비타 디 반뇨레조</a><span>보행교 구간과 숙소·정류장에서 다리까지의 접근 구간을 따로 계산합니다.</span></li>
      <li><a href="/관광객이-적어-현지의-속도를-느낀-아르타/">그리스 · 아르타</a><span>석교 보행, 실내 유산의 개방 여부, 요일별 버스 연결을 나눠 당일 방문과 1박을 판단합니다.</span></li>
    </ul>
  </section>
  <section class="ss-home-band" aria-labelledby="home-sheet-title">
    <h2 id="home-sheet-title">출발 준비를 한 장으로</h2><p>첫 교통편, 숙소 주소, 늦은 도착 연락처, 통신·결제의 대안을 적는 빈 양식입니다. 여권번호와 카드번호를 적는 항목은 없습니다.</p>
    <a class="ss-action ss-action--secondary" href="/assets/trip-prep-sheet.txt" download><img src="/assets/icons/download.svg" alt="" width="18" height="18">출발 준비표 내려받기</a>
  </section>
  <section class="ss-home-band" aria-labelledby="home-update-title">
    <h2 id="home-update-title">이번에 바뀐 자료</h2><ul class="ss-home-updates">${REGIONAL_HOME_UPDATE}${PREDEPARTURE_HOME_UPDATE}<li><time datetime="2026-10-15">2026.10.15</time> · <a href="/tools/stay-compare/">숙소 총비용 비교기</a>: 이용 비용·취소 손실·미확인 조건을 함께 표시합니다.</li><li><time datetime="2026-10-15">2026.10.15</time> · <a href="/honja-yeohaeng-sukso-goreuneun-beop/">숙소 비교 가이드</a>: 계산 사례와 체크인 문의 문안을 재구성했습니다.</li><li><time datetime="2026-10-15">2026.10.15</time> · <a href="/honja-yeohaeng-junbimul-checklist/">준비물 가이드</a>: 물건 목록을 출발 전 작동 점검표로 바꿨습니다.</li></ul>
  </section>
  <section class="ss-home-band"><h2>자료의 범위와 오류 제보</h2><p>글마다 공식 자료에서 확인한 사실과 편집자의 계산·판단 예시를 구분합니다. 가상 사례는 실제 상품이나 이용 후기가 아닙니다. <a href="/author/">작성자 소개</a> · <a href="/editorial-policy/">편집 원칙</a> · <a href="/contact/">오류 제보</a></p></section>
</div>`;

export const LODGING_CONTENT = `
<p>숙소 후보가 두 곳으로 좁혀졌다면 세 가지를 따로 비교합니다. 실제로 이용할 때 지출할 총액, 예약을 취소할 때 잃는 금액, 도착 시각에 방에 들어갈 수 있는지입니다. 금액이 싸다는 이유로 나머지 조건까지 유리해지는 것은 아닙니다.</p>
<p><a class="ss-inline-link" href="/tools/stay-compare/"><img src="/assets/icons/calculator.svg" width="18" height="18" alt="">숙소 두 곳의 총비용 비교표 열기</a></p>
<h2 id="same-basis">1. 같은 예약 기간과 결제 단위부터 맞추기</h2>
<p>한쪽은 1박 가격이고 다른 쪽은 2박 합계라면 비교가 성립하지 않습니다. 같은 날짜, 숙박 일수, 인원, 객실 조건을 선택하고 마지막 결제 단계의 금액을 적습니다. 외화 예약이라면 두 후보를 같은 기준으로 원화 환산한 뒤 비교하되 카드사의 실제 환율과 수수료는 별도 변수로 남겨 둡니다.</p>
<p>예약 화면에 세금과 청소비가 이미 들어 있다면 다시 더하지 않습니다. 현장에서 별도로 내는 비용이 있다면 인당인지, 박당인지, 숙박 전체당인지 확인합니다. 2박 동안 박당 5,000원을 내는 조건은 추가금 10,000원으로 적고, 별도 비용이 불명확하면 0원으로 확정하지 않습니다.</p>
<h2 id="worked-cost">2. 표시 가격과 실제 지출이 뒤집히는 계산</h2>
<div class="ss-worked-example"><p><strong>1박 가상 사례. 실제 숙소·판매가가 아닙니다.</strong></p><p>A: 숙박비 75,000원 + 별도 추가금 15,000원 + 이동비 18,000원 = <strong>108,000원</strong></p><p>B: 숙박비 91,000원 + 별도 추가금 0원 + 이동비 4,000원 = <strong>95,000원</strong></p><p>표시 숙박비는 A가 16,000원 낮지만, 위 항목의 합계는 B가 13,000원 낮습니다.</p></div>
<p>이동비에는 해당 숙소를 선택해서 실제로 발생하는 비용을 같은 범위로 넣습니다. A에는 공항 왕복을 넣고 B에는 편도만 넣으면 결과가 왜곡됩니다. 두 곳에 공통인 교통비를 모두 빼거나 모두 포함하는 것은 가능하지만, 서로 다른 기준을 섞지 않습니다. 수하물 보관비도 이용이 필요한 후보에만 추가합니다.</p>
<p>이 예시는 B를 무조건 예약하라는 뜻이 아닙니다. A의 체크인이 불명확하다면 확인할 질문이 더 생기고, B의 취소 조건이 더 불리하다면 변경 가능성이 큰 여행에서는 별도의 비교가 필요합니다. <a href="/tools/stay-compare/">비교기</a>는 이런 미확인 조건을 금액 차이와 함께 표시합니다.</p>
<h2 id="cancel-loss">3. 취소 손실을 숙박비에 중복해서 더하지 않기</h2>
<p>실제 이용 시 총액과 취소 시 손실은 서로 다른 상황입니다. 위 사례에서 A를 이용할 때 108,000원을 내고, 특정 시점에 취소할 때 이미 낸 금액 중 90,000원을 돌려받지 못한다면 두 숫자를 나란히 비교합니다. 108,000원에 90,000원을 더한 198,000원을 이용 비용으로 쓰면 같은 비용을 중복 계산할 수 있습니다.</p>
<p>무료 취소라고 적혀 있어도 마감 날짜, 시각, 기준 시간대를 저장해야 합니다. 환불 대상에서 제외되는 항목, 노쇼 조건, 항공편 지연에 대한 처리도 상품마다 다릅니다. “방문 전날까지”라는 요약만 보지 말고 예약 상품의 실제 약관을 읽습니다. 개별 예약의 환불 권리는 계약과 적용 규정에 따라 달라지므로 이 계산 예시가 환불 가능 여부를 판정하지는 않습니다.</p>
<p><a href="https://www.kca.go.kr/home/sub.do?cate=00000051&amp;menukey=4004&amp;mode=view&amp;no=1003550544">한국소비자원의 2023년 숙박 플랫폼 조사</a>는 당시 가격 표시와 환불 불가 조건에 관한 문제 사례를 설명합니다. 과거 조사 결과를 현재 모든 플랫폼의 상태로 일반화하지 않고, 구매할 상품의 결제 화면과 약관을 근거로 기록합니다.</p>
<h2 id="arrival-check">4. 늦은 도착은 체크인 문의로 확인하기</h2>
<p>항공기 착륙 시각은 숙소 도착 시각이 아닙니다. 입국·짐 찾기·공항 이동 뒤 숙소에 도착할 예상 시각을 따로 적고, 프런트 마감과 무인 출입 조건을 대조합니다. 지도에서 역과 가깝다는 것만으로 늦은 체크인이 해결되지는 않습니다.</p>
<blockquote><p><strong>예약 전 문의 문안</strong><br>○월 ○일 현지 시각 ○시쯤 도착할 예정입니다. 이 시각에 체크인할 수 있나요? 지연될 경우 연락할 번호와 출입 방법을 알려 주세요. 열쇠나 출입 코드를 받기 위해 인터넷 연결이 반드시 필요한지도 확인하고 싶습니다.</p></blockquote>
<p>숙소가 답했다면 답변 날짜와 연락 수단을 예약 확인서와 함께 저장합니다. 답변을 받지 못한 경우에는 “가능할 것”으로 처리하지 않습니다. 도착 가능한 시각으로 교통편을 바꾸거나, 늦은 도착을 수용한다고 확인한 다른 후보를 검토합니다. 밝은 길·프런트 유무 같은 단일 특징만으로 숙소의 안전성을 보장할 수는 없습니다.</p>
<h2 id="booking-record">5. 비교 결과 옆에 남길 네 가지 증거</h2>
<figure class="wp-block-table"><table><thead><tr><th>기록</th><th>어디서 확인하나</th><th>미확인일 때 남길 상태</th></tr></thead><tbody><tr><td>이용 시 총액</td><td>마지막 결제 화면, 현장 추가금 안내</td><td>추가비용 미확인</td></tr><tr><td>취소 손실</td><td>해당 예약 상품의 취소·노쇼 약관</td><td>손실액 미확인</td></tr><tr><td>도착 시각 출입</td><td>숙소의 체크인 안내와 개별 답변</td><td>체크인 미확인</td></tr><tr><td>마지막 이동</td><td>이용할 교통 운영자의 해당 날짜 안내</td><td>도착 연결 미확정</td></tr></tbody></table></figure>
<p>예약을 마치기 전에는 금액 표를 저장하는 것에 더해 주소, 객실 조건, 취소 마감, 늦은 도착 답변이 같은 예약을 가리키는지 대조합니다. 후기는 최근 반복되는 문제를 찾는 보조 자료로 쓰되, 다른 객실·다른 시기의 후기를 이번 예약에 대한 확정 정보로 삼지 않습니다.</p>
<h2 id="after-booking">6. 예약 뒤에는 비교표를 도착 준비로 바꾸기</h2>
<p>후보를 정했다면 더 많은 숙소를 계속 비교하기보다 첫 이동과 출입 방법을 정리합니다. <a href="/honja-yeohaeng-junbimul-checklist/">준비물 작동 점검표</a>로 휴대폰이 꺼져도 주소와 연락처를 확인할 수 있게 준비하고, 방에 도착한 뒤에는 <a href="/honja-sukso-anjeon-checklist/">체크인 직후 점검</a>에서 잠금·대피 경로·연락 수단을 확인합니다. 국가·지역의 현재 안전 공지는 <a href="https://www.0404.go.kr/ntnSafetyInfo/list">외교부 해외안전여행</a>에서 별도로 조회합니다.</p>`;

export const PACKING_CONTENT = `
<p>준비물을 다 넣었는지보다, 물건이 연결돼 작동하는지 확인해야 합니다. 보조배터리가 있어도 케이블이 맞지 않으면 충전할 수 없고, 주소를 휴대폰 안에만 저장하면 휴대폰을 잃었을 때 함께 사라집니다. 다음 표는 혼자 도착·결제·연락을 이어갈 수 있는지 점검하는 출발 준비표입니다.</p>
<p><a class="ss-inline-link" href="/assets/trip-prep-sheet.txt" download><img src="/assets/icons/download.svg" width="18" height="18" alt="">빈 출발 준비표 내려받기</a></p>
<h2 id="failure-table">1. 물건 목록을 세 가지 고장 상황으로 바꾸기</h2>
<figure class="wp-block-table"><table><thead><tr><th>가정한 상황</th><th>함께 막히는 일</th><th>출발 전에 직접 해볼 점검</th></tr></thead><tbody><tr><td>휴대폰 배터리 방전</td><td>지도·숙소 연락·모바일 결제</td><td>실제 케이블로 충전하고, 휴대폰 밖의 주소·연락처 확인</td></tr><tr><td>모바일 데이터 중단</td><td>예약 화면·지도 검색·메신저</td><td>비행기 모드에서 저장한 주소와 체크인 안내 열기</td></tr><tr><td>지갑 분실</td><td>현금·카드·신분증 동시 손실</td><td>예비 결제 수단과 카드 정지 연락 경로를 따로 보관</td></tr></tbody></table></figure>
<p>휴대폰 분실은 데이터 중단보다 범위가 큽니다. 같은 휴대폰의 다른 앱에 저장한 주소는 분실 대안이 되지 않습니다. 종이 메모나 별도로 접근할 수 있는 연락 경로를 남기되, 여권번호와 카드 전체 번호를 불필요하게 복제하지 않습니다.</p>
<h2 id="offline-test">2. 비행기 모드로 해보는 오프라인 점검</h2>
<ol><li>숙소 이름, 실제 입구 주소, 체크인 안내를 저장합니다. 예약 앱의 목록 화면만 저장하지 말고 필요한 내용이 보이는지 확인합니다.</li><li>휴대폰을 비행기 모드로 바꾼 뒤 저장한 내용을 직접 엽니다. 인터넷 연결을 다시 요구한다면 다른 방식으로 저장합니다.</li><li>공항·역에서 숙소로 가는 첫 이동의 하차 지점과, 늦어졌을 때 연락할 번호를 확인합니다.</li><li>휴대폰을 사용할 수 없는 상황을 따로 가정해, 기기 밖의 메모에서도 숙소 주소와 연락 경로를 찾을 수 있는지 봅니다.</li></ol>
<p>내려받은 지도도 모든 검색·안내 기능을 오프라인으로 제공하는 것은 아닙니다. 평소 쓰는 앱에서 실제로 열어 확인한 범위만 대안으로 잡습니다. 늦은 도착에 인터넷이 있어야 출입 코드를 받을 수 있다면 숙소에 다른 출입·연락 방법을 문의합니다.</p>
<h2 id="charging-chain">3. 충전은 네 부품을 연결해 점검하기</h2>
<p>휴대폰 단자, 케이블, 전원 어댑터, 현지 콘센트 호환을 하나의 연결로 봅니다. 실제로 가져갈 케이블과 보조배터리를 연결해 충전 표시가 뜨는지 확인합니다. 변환 플러그는 모양을 맞추는 도구이며, 기기의 허용 전압까지 바꿔 주는 것으로 가정하면 안 됩니다. 기기 표기와 목적지 전원 조건을 함께 봅니다.</p>
<p>보조배터리와 배터리 장비는 이용 항공사·노선의 반입 안내에서 용량, 개수, 포장, 기내·위탁 조건을 확인합니다. <a href="https://www.iata.org/en/youandiata/travelers/batteries">IATA의 여행자 배터리 안내</a>도 항공사별 정책 확인을 안내합니다. 이 목록은 항공 운송 허가표가 아닙니다. 개인 의약품도 단순히 짐을 줄이기 위해 빼지 말고 목적지의 반입 조건과 본인에게 필요한 준비를 별도로 확인합니다.</p>
<h2 id="separate-backups">4. 예비 수단은 다른 장소에 두기</h2>
<p>카드 두 장을 같은 지갑에 넣으면 지갑 분실에는 대비하지 못합니다. 예비 결제 수단은 주 결제 수단과 따로 보관하고, 본인이 사용할 수 있는 결제 방식인지 확인합니다. 사용할 수 없는 카드나 본인 확인에 필요한 휴대폰이 없으면 접근할 수 없는 계정은 즉시 쓸 수 있는 대안과 구분합니다.</p>
<p>여권 사본과 실제 여권도 역할이 다릅니다. 사본은 정보 확인에 도움이 될 수 있지만 여행 서류를 대체한다고 보지 않습니다. 여권의 유효기간과 목적지 입국 요건 확인 경로는 <a href="https://passport.go.kr/home/kor/contents.do?menuPos=50">외교부 여권 사용 안내</a>에서 확인하고, 국가별 조건은 해당 당국의 안내를 따릅니다.</p>
<h2 id="worked-packing">5. 가방을 줄이는 가상 사례</h2>
<div class="ss-worked-example"><p><strong>2박, 한 숙소, 낮 도착을 가정한 편집 예시입니다.</strong></p><p>입을 외투와 예비 외투의 역할이 겹친다면 하나를 줄일 수 있습니다. 반면 주 카드와 따로 둔 예비 카드는 지갑 분실 때의 역할이 달라 개수만 보고 줄이지 않습니다. 세면용품은 숙소 제공 품목을 확인한 뒤 줄이되, 개인 처방약은 이 예시의 감량 대상이 아닙니다.</p></div>
<p>여행 길이만으로 옷과 장비 수를 정하지 않습니다. 숙소 이동 횟수, 세탁 가능 여부, 기온, 계단과 대중교통 구간을 적은 뒤 역할이 겹치는 품목을 찾습니다. 마지막에는 짐을 닫고 들어 올려, 혼자 이동할 때 감당할 수 있는지 직접 확인합니다.</p>
<h2 id="departure-sheet">6. 출발표에는 물건보다 확인 결과를 남기기</h2>
<p><a href="/assets/trip-prep-sheet.txt" download>출발 준비표</a>에는 첫 이동, 숙소 입구, 지연 연락처, 통신과 결제의 대안을 적을 수 있습니다. “준비함”에 표시만 하기보다 실제로 열어 본 날짜나 아직 답을 받지 못한 항목을 남깁니다. 여권번호·카드번호를 입력하는 칸은 없습니다.</p>
<p>숙소가 아직 미정이라면 <a href="/tools/stay-compare/">숙소 총비용 비교기</a>에서 금액과 미확인 조건을 나란히 확인하고, 출발 순서 전체가 필요하면 <a href="/honja-yeohaeng-junbi-gijun/">혼자 여행 준비 기준</a>을 봅니다. 실제 분실이 생겼을 때의 연락·기록 순서는 <a href="/honja-yeohaeng-emergency-response/">위급 상황 대응</a>에 따로 정리했습니다. 국가·지역의 안전 정보는 <a href="https://www.0404.go.kr/ntnSafetyInfo/list">외교부 해외안전여행</a>에서 확인합니다.</p>`;

export function toolContent() {
  const fields = [
    ['room', '숙박비 합계', '선택한 날짜·인원·객실의 예약 기간 전체 금액', true],
    ['fees', '별도 현장 추가금', '숙박비에 이미 포함된 세금·청소비는 중복 합산하지 않습니다.'],
    ['transport', '교통비 합계', '두 후보의 이동비를 같은 왕복·기간 기준으로 비교합니다.'],
    ['other', '기타 비용 합계', '해당 숙소 때문에 필요한 수하물 보관비 등'],
    ['cancellation', '취소 시 손실액', '같은 취소 시점 기준. 미확인이면 빈칸으로 둡니다.']
  ];
  const options = ['a', 'b'].map((id, index) => `<fieldset data-stay="${id}"><legend>숙소 ${index === 0 ? 'A' : 'B'}</legend><label for="${id}-name">숙소 이름<input id="${id}-name" data-field="name" type="text" maxlength="40" value="숙소 ${index === 0 ? 'A' : 'B'}" autocomplete="off"></label>${fields.map(([key, label, note, required]) => `<label for="${id}-${key}">${label} (원)<small id="${id}-${key}-note">${note}</small><input id="${id}-${key}" data-field="${key}" type="number" inputmode="numeric" min="0" max="1000000000" step="1" ${required ? 'required' : ''} ${!required && key !== 'cancellation' ? 'value="0"' : ''} aria-describedby="${id}-${key}-note"></label>`).join('')}<label for="${id}-checkin">도착 예정 시각의 체크인<select id="${id}-checkin" data-field="checkin"><option value="unknown">미확인</option><option value="yes">가능하다고 확인함</option><option value="no">불가능하다고 확인함</option></select></label><label class="ss-check" for="${id}-fees-confirmed"><input id="${id}-fees-confirmed" data-field="feesConfirmed" type="checkbox">현장 추가비용 유무를 확인했습니다.</label></fieldset>`).join('');
  const outputs = ['a', 'b'].map(id => `<article class="ss-result-option" data-result="${id}"><h3 data-output="name"></h3><p class="ss-result-total" data-output="total"></p><p class="ss-home-note">이용 시 입력 합계</p><meter min="0" max="1" value="0"></meter><dl>${[['room', '숙박비'], ['fees', '별도 추가금'], ['transport', '교통비'], ['other', '기타 비용'], ['cancellation', '취소 시 손실']].map(([key, label]) => `<div><dt>${label}</dt><dd data-output="${key}"></dd></div>`).join('')}</dl><p class="ss-result-flags" data-output="flags"></p></article>`).join('');
  return `<div class="ss-tool"><header><p class="ss-eyebrow"><a href="/">여행정보엑스퍼트</a> / 예약 준비</p><h1>숙소 총비용 비교기</h1><p>같은 예약 기간의 두 후보를 원화(KRW)로 비교합니다. 이용할 때의 지출과 취소할 때의 손실을 나눠 봅니다.</p><p class="ss-tool-note">실시간 숙소 요금이나 환율을 조회하지 않습니다. 입력한 숙소명·금액은 운영자 서버로 전송하거나 기본 저장하지 않습니다.</p></header><noscript><p>계산에는 자바스크립트가 필요합니다. 아래 계산 기준과 <a href="/honja-yeohaeng-sukso-goreuneun-beop/">숙소 비교 가이드</a>는 그대로 읽을 수 있습니다.</p></noscript><form id="stay-compare-form"><div class="ss-stay-fields">${options}</div><div class="ss-tool-actions"><button class="ss-action" type="submit"><img src="/assets/icons/calculator.svg" width="18" height="18" alt="">비교하기</button><button class="ss-action ss-action--secondary" type="button" id="load-example"><img src="/assets/icons/flask-conical.svg" width="18" height="18" alt="">가상 사례</button><button class="ss-action ss-action--secondary" type="reset"><img src="/assets/icons/rotate-ccw.svg" width="18" height="18" alt="">초기화</button></div><p id="comparison-error" role="alert"></p></form><section id="comparison-results" hidden aria-labelledby="comparison-result-title"><p id="comparison-kind" class="ss-eyebrow"></p><h2 id="comparison-result-title" tabindex="-1">두 숙소의 입력 결과</h2><p id="comparison-summary" aria-live="polite"></p><div class="ss-result-grid">${outputs}</div><p>합계가 적다는 것은 안전성·숙소 품질·체크인 가능 여부가 더 좋다는 뜻이 아닙니다. 취소 손실은 이용 시 합계에 더하지 않습니다. 미확인 비용은 최종 결제 전에 확인해야 합니다.</p><div class="ss-tool-actions"><button class="ss-action ss-action--secondary" id="download-comparison" type="button"><img src="/assets/icons/download.svg" width="18" height="18" alt="">비교표 내려받기</button><button class="ss-action ss-action--secondary" id="print-comparison" type="button"><img src="/assets/icons/printer.svg" width="18" height="18" alt="">인쇄</button></div></section><section class="ss-tool-method"><h2>비교 금액을 읽는 기준</h2><h3>이용 시 합계</h3><p>예약 기간 전체 숙박비 + 숙박비에 포함되지 않은 현장 추가금 + 같은 범위로 계산한 교통비 + 기타 비용입니다. 이미 포함된 세금을 다시 더하거나 한쪽에만 공항 왕복을 넣으면 비교가 달라집니다.</p><h3>취소 시 손실</h3><p>두 후보를 같은 시점에 취소한다고 가정하고, 돌려받지 못하는 금액을 따로 기록합니다. 무료 취소 마감과 기준 시간대는 예약 상품의 실제 약관을 확인합니다. 빈칸은 0원이 아니라 미확인으로 표시합니다.</p><h3>금액 밖의 조건</h3><p>추가금과 도착 시각 체크인이 확인되지 않아도 입력 합계는 계산할 수 있지만, 그 결과를 확정된 예약 비용이나 예약 추천으로 읽으면 안 됩니다. 숙소의 운영·출입·안전 상태는 금액 계산으로 검증되지 않습니다.</p><p>2023년 <a href="https://www.kca.go.kr/home/sub.do?cate=00000051&amp;menukey=4004&amp;mode=view&amp;no=1003550544">한국소비자원의 숙박 플랫폼 조사</a>는 당시 가격 표시·취소 조건의 문제 사례를 다룹니다. 현재 예약 조건은 해당 상품에서 따로 확인합니다.</p><p><a href="/honja-yeohaeng-sukso-goreuneun-beop/">계산 사례와 체크인 문의 문안</a> · <a href="/honja-yeohaeng-junbimul-checklist/">출발 준비 점검표</a> · <a href="/privacy-policy/">개인정보 처리방침</a></p></section></div>`;
}
