export const BANGKOK_ARRIVAL_SLUG = 'honja-southeast-asia-safety';
export const BANGKOK_ARRIVAL_MODIFIED = '2026-10-17T11:22:00+09:00';
export const BANGKOK_ARRIVAL_HOME_UPDATE = `<li id="bangkok-arrival-update"><time datetime="2026-10-17">2026.10.17</time> · <a href="/${BANGKOK_ARRIVAL_SLUG}/">수완나품 도착 이동</a>: 철도·택시 승차 위치, Grab PIN과 예약 기능의 차이, 자정 지연 계산과 숙소 연결표를 대조했습니다.</li>`;
export const BANGKOK_ARRIVAL_SOURCES = {
  transport: 'https://suvarnabhumi.airportthai.co.th/service/airport-guide/detail/Transportation_BKK',
  taxi: 'https://suvarnabhumi.airportthai.co.th/service/transportation/detail/304',
  grab: 'https://www.grab.com/th/en/press/others/grabairport2026/',
  rail: 'https://thailand.prd.go.th/en/content/category/detail/id/2078/iid/439307',
  advisory: 'https://www.0404.go.kr/ntnSafetyInfo/260/detail',
  airportAlert: 'https://www.0404.go.kr/bbs/safetyNtc/1280571/detail2?ntnCd=260',
  rainAlert: 'https://www.0404.go.kr/bbs/safetyNtc/1280573/detail2?ntnCd=260',
  consular: 'https://www.0404.go.kr/bbs/contsPst/MST0000000000103/3/detail'
};

export const BANGKOK_ARRIVAL_GUIDES = [{
  slug: BANGKOK_ARRIVAL_SLUG,
  title: '방콕 수완나품 공항 도착: 철도·택시·Grab 연결 점검',
  previousTitle: '혼자 동남아 여행 안전 기준: 숙소, 교통, 현금 관리까지',
  summary: '수완나품 공항의 철도·일반 택시·Grab 승차 위치를 구분하고, Grab PIN과 출시 예정 예약 기능을 대조합니다. 자정을 넘는 도착 계산, 택시 추가 비용과 숙소 출입을 한 장에 연결합니다.',
  body: `
<p>공항에서 시내로 가는 방법을 알아도 숙소 입구까지 도착할 수 있는지는 별개의 문제입니다. 항공편이 늦어졌을 때 철도에 탈 수 있는지, 차량을 어디서 만나는지, 숙소가 자정 이후에도 문을 열어 주는지까지 이어져야 첫 이동 계획이 됩니다.</p>
<p><strong>자료 확인일: 2026-10-17.</strong> 기존의 넓은 ‘동남아 안전’ 주제를 방콕 수완나품 공항(BKK) 도착 상황으로 좁혔습니다. 돈므앙(DMK)이나 다른 나라 공항에 아래 층·출구·요금을 적용하지 않습니다. 공항·운영자·정부의 공개 자료를 대조한 준비 가이드이며, 현장 방문 후기나 특정 교통수단의 안전 인증이 아닙니다.</p>
<p><strong>최근 공지를 읽는 방법:</strong> <a href="${BANGKOK_ARRIVAL_SOURCES.airportAlert}">주태국대사관의 2026-09-29 공항 공지</a>는 당시 호우에 따른 수하물·항공편 지연을 알렸습니다. <a href="${BANGKOK_ARRIVAL_SOURCES.rainAlert}">2026-10-05 호우 공지</a>의 예보 대상 기간은 10월 5–14일입니다. 이 과거 공지만으로 10월 17일 현재 공항이 중단됐거나 반대로 정상화됐다고 판정하지 않습니다. 이용일의 항공편·수하물 처리·도로 상황은 항공사와 공항 공식 채널에서 다시 확인하고, 지연되면 아래 도착 계산을 갱신합니다.</p>
<h2 id="arrival-airport-hotel">1. 항공편보다 먼저 맞출 두 주소: 공항과 숙소 입구</h2>
<p>항공권의 도착 공항 코드가 BKK인지 확인하고 숙소 이름·정확한 지점·실제 입구 주소를 저장합니다. 같은 체인 이름이나 지도 검색 결과만으로 목적지를 정하지 않습니다. 차량 호출의 목적지와 예약 확인서 주소가 같은지 대조하고, 철도를 쓴다면 내릴 역에서 숙소 입구까지의 마지막 구간도 따로 적습니다.</p>
<p>모든 시각은 방콕 현지 시각과 날짜로 적습니다. 17일 밤 착륙 뒤 숙소 도착이 18일 새벽이 된다면 숙박 예약의 이용일·노쇼 처리·늦은 체크인 허용을 숙소에 확인합니다. 새벽 도착이라는 이유만으로 예약 날짜를 임의로 다음 날로 바꾸지 않습니다. 출발 전에 확인할 질문은 이 글 마지막에 모았습니다.</p>
<h2 id="arrival-boarding-points">2. 같은 1층·Gate 4라도 승차 차선이 다릅니다</h2>
<p><a href="${BANGKOK_ARRIVAL_SOURCES.transport}">AOT 수완나품 교통 안내</a>에서 확인한 위치입니다. 층·출구뿐 아니라 차선과 이용 절차를 함께 봅니다. 아래는 게시 안내이며 공사·대기·당일 변경까지 확인한 현장 안내는 아닙니다.</p>
<figure class="wp-block-table"><table><caption>수완나품 메인 터미널의 게시 승차 위치 · 2026-10-17 열람</caption><thead><tr><th>수단</th><th>위치·절차</th><th>선택 전에 확인할 연결</th></tr></thead><tbody>
<tr><td>Airport Rail Link</td><td>B1층. 공항 안내의 운영시간은 05:30–24:00</td><td>해당 날짜·출발역의 마지막 출발편, 하차 뒤 숙소 이동</td></tr>
<tr><td>일반 공항 택시</td><td>1층 Gate 4–7 안쪽 차선(Inner curb). 먼저 대기표 발급</td><td>목적지·차종·요금 방식·짐 적재와 추가 비용</td></tr>
<tr><td>Grab</td><td>1층 Gate 4 바깥쪽 차선(Outer curb)</td><td>앱에서 선택한 상품·승차 방식·실제 배정 정보</td></tr>
</tbody></table></figure>
<p>일반 택시와 Grab은 공항 안내상 24시간이지만 즉시 배차나 대기시간 0분을 뜻하지 않습니다. 같은 층의 VIP 택시는 일반 택시와 상품·요금 구조가 다르므로 ‘택시’라는 이름만 보고 비교하지 않습니다. 표지나 앱 지시가 저장한 자료와 다르면 현장 공식 안내 창구에 확인하고 승차 지점을 갱신합니다.</p>
<p><a href="${BANGKOK_ARRIVAL_SOURCES.rail}">태국 정부 홍보국의 2025-11-07 철도 안내</a>는 공항에서 Phaya Thai까지의 노선과 8개 역, 비접촉 결제 도입을 설명합니다. 이는 목적지 연결과 결제 방식을 알아보는 자료이지, 내 카드의 현재 결제 성공이나 숙소까지 직통 이동의 증거는 아닙니다. 교통카드·승차권 구입이 필요한 경우와 최종 하차 뒤 이동을 함께 확인합니다.</p>
<h2 id="arrival-grab-pin">3. Grab PIN과 ‘출시 예정’ 예약 기능을 구분하기</h2>
<p><a href="${BANGKOK_ARRIVAL_SOURCES.grab}">Grab의 2026-09-21 발표</a>는 수완나품의 PIN 방식과 Airport Pickup 예약 기능을 별도로 설명합니다. 두 방식을 섞어 ‘예약했으니 차량이 이미 지정돼 있다’고 생각하면 현장에서 승차 절차를 잘못 이해할 수 있습니다.</p>
<figure class="wp-block-table"><table><thead><tr><th>공식 발표의 구분</th><th>읽어야 할 조건</th><th>이번 여행에서 남길 확인</th></tr></thead><tbody>
<tr><td>Grab Pick-up Point의 PIN</td><td>예약 확인 뒤 4자리 승차 PIN을 받고, 처음에는 특정 기사·차량을 즉시 지정하지 않는 방식. 지정 대기 구역 A–D 안내</td><td>내 앱이 이 방식을 제공하는지, 현장에서 매칭된 운행 정보와 차량이 일치하는지</td></tr>
<tr><td>Airport Pickup</td><td>발표 당시 수완나품에 4분기 출시 예정으로 소개. 별도 예약·항공편 추적 기능이며 승차 구역 E 안내</td><td>실제 이용일에 출시·예약이 가능한지, 선택 상품의 지연·대기·취소 조건</td></tr>
</tbody></table></figure>
<p>10월이 4분기에 들어간다는 사실만으로 두 번째 기능이 내 계정에 이미 출시됐다고 결론 내리지 않습니다. 발표의 픽업 보장·대기·취소 설명도 모든 Grab 호출에 적용하지 않습니다. 실제 앱의 상품명과 약관을 확인하고, PIN 방식이라면 현장 직원의 지정 대기열 안내를 따릅니다. 운행 확인이 되지 않은 차량으로 이동하지 않고 공식 승차 지원에 문의합니다.</p>
<p>이 글은 Grab을 예약하거나 앱 기능을 실제 시험하지 않았습니다. 여기서 말하는 PIN은 해당 공항 승차용 코드입니다. 계정 로그인·은행·카드의 문자 인증번호를 대신 요구하는 절차로 이해하지 않습니다. 실제 배정 뒤에는 운행 정보를 대조하고 이용 내역을 보관하되, 공개 게시물에 예약 화면이나 개인 정보를 올리지 않습니다.</p>
<h2 id="arrival-midnight-math">4. 24:00 운영 표기를 내 막차 시각으로 쓰지 않기</h2>
<p>AOT가 게시한 철도 운영시간의 끝인 24:00은 ‘23:59에 착륙해도 탈 수 있다’는 뜻이 아닙니다. 입국·수하물·세관을 마치고 역에 도착할 시각과 해당 역의 실제 출발표를 대조해야 합니다. 표 구입·개찰 마감, 운행 변경, 하차 뒤 환승편도 확인 대상입니다. 공항 안내는 철도 문의 번호를 <a href="tel:+6620911595">+66 2 091 1595</a>로 게시합니다.</p>
<figure class="wp-block-table"><table><caption>날짜가 바뀌는 가상 계산 · 실제 수속 평균·열차 시각표·탑승 보장 아님</caption><thead><tr><th>가정한 실제 착륙</th><th>가정한 수속·역 이동</th><th>역 도착 계산과 판단</th></tr></thead><tbody>
<tr><td>10월 17일 22:00</td><td>수속·수하물 55분 + 역 이동 15분</td><td>17일 23:10. 게시 운영시간 안이지만 실제 막차·탑승 가능은 미확인</td></tr>
<tr><td>10월 17일 23:00</td><td>같은 가정: 55분 + 15분</td><td>18일 00:10. 위 게시 운영시간에 기대어 철도를 확정할 수 없음</td></tr>
</tbody></table></figure>
<p>55분과 15분은 계산 방법을 보여 주기 위해 넣은 가정이며 보통 걸리는 시간이나 권장 여유시간이 아닙니다. 실제 지연·수속 상황으로 다시 계산합니다. 철도 운행을 확인하지 못했다면 공항의 차량 서비스 창구에서 이용 가능한 수단·요금·목적지 연결을 확인하고, 숙소에도 도착 지연을 알립니다. 막차를 놓칠까 봐 급히 승차하거나 미확인 외부 장소로 나가 차를 찾는 것을 대안으로 삼지 않습니다.</p>
<h2 id="arrival-fare-components">5. 미터 숫자와 앱 견적을 같은 ‘최종액’으로 비교하지 않기</h2>
<p><a href="${BANGKOK_ARRIVAL_SOURCES.taxi}">AOT 일반 택시 상세 안내</a>는 공항 추가금 50바트와 승객 부담 통행료를 구분합니다. 공항의 종합 안내에는 적용 조건에 따른 수하물 요금도 나옵니다. 일반 택시의 항목을 VIP·Grab·숙소 픽업에 그대로 더하지 않고, 선택한 상품에서 이미 포함됐는지부터 확인합니다.</p>
<div class="ss-worked-example"><p><strong>일반 공항 택시를 가정한 부분 합계. 실제 견적이 아닙니다.</strong></p><p>미터 운임을 320바트, 별도 통행료를 60바트로 가정하고 공항 추가금 50바트를 더하면 320 + 60 + 50 = <strong>430바트</strong>입니다. 320·60은 가정한 값이고, 수하물 등 다른 비용은 계산하지 않았습니다. 430바트가 실제 최종액이라는 뜻이 아닙니다.</p></div>
<p>앱 견적을 비교할 때도 선택한 차량 상품, 목적지, 통행료·공항 비용·짐·대기 비용의 포함 여부와 결제 수단을 봅니다. 불명확한 항목을 0바트로 채우거나 같은 비용을 두 번 더하지 않습니다. 현장에서 금액이나 요금 방식이 다르게 설명되면 출발 전에 서비스 창구에서 확인하고 이용 내역을 남깁니다. 가격 합의의 적용 범위도 있으므로 이 글은 모든 공항 택시에 단 하나의 법적 요금 방식만 있다고 단정하지 않습니다.</p>
<p>일반 택시 서비스 문의는 공항이 게시한 <a href="tel:+6621320360">+66 2 132 0360</a>입니다. 문의 번호와 운행 기록은 요금·승차 확인용이며 긴급 구조 번호가 아닙니다. 즉각적인 신체 위험에서는 자료 정리보다 공항 직원·보안 인력에게 도움을 요청하고 현지 긴급서비스를 이용하는 것이 먼저입니다. 연락 역할은 <a href="/honja-yeohaeng-emergency-response/">위급 상황 대응 가이드</a>에 구분했습니다.</p>
<h2 id="arrival-connection-sheet">6. 도착표의 마지막 칸은 숙소 출입 확인입니다</h2>
<p><a href="/assets/bangkok-arrival-check.txt" download>수완나품 도착·숙소 연결표 내려받기</a>에 공항 코드, 현지 날짜·시각, 역 또는 승차 차선, 상품·비용, 하차 뒤 이동과 숙소의 답변을 적습니다. 이 파일은 비공개로 보관할 빈 기록표이며 사이트에 전송되는 입력 양식이 아닙니다. 여권·카드번호·PIN·출입 비밀번호는 적지 않습니다.</p>
<blockquote><p><strong>숙소에 확인할 질문</strong><br>[예약 이용일]의 예약으로 BKK에 [현지 날짜·시각] 도착 예정입니다. 수속·이동으로 [날짜·시각]에 숙소에 도착하거나 더 늦어질 수 있습니다. 이 예약으로 체크인이 가능한가요? 실제 입구, 지연 연락 수단, 프런트가 닫힌 뒤의 출입 절차를 알려 주세요. 픽업을 신청한다면 상품 총액·만남 장소·비행기 지연 때 대기와 취소 조건도 확인하고 싶습니다.</p></blockquote>
<p>답변이 없으면 ‘늦은 체크인 가능’으로 표시하지 않습니다. 철도는 가능하지만 숙소 출입이 미확인인 상태와, 차량은 확인했지만 결제 조건이 미확인인 상태를 따로 남깁니다. 출입이나 마지막 이동을 해결하지 못했다면 숙소·교통 제공자와 다른 연결을 확인해야 합니다. 종이 또는 기기 밖에도 숙소 주소와 연락 경로를 준비하는 방법은 <a href="/honja-yeohaeng-junbimul-checklist/">준비물 작동 점검표</a>에서 이어집니다.</p>
<p>공항 교통이 운행한다는 사실은 국가·지역의 여행경보 해제를 뜻하지 않습니다. 출발 전과 일정 변경 시 <a href="${BANGKOK_ARRIVAL_SOURCES.advisory}">외교부 해외안전여행 태국 국가정보</a>에서 실제 방문 지역의 최신 경보·안전 공지를 확인합니다. 이 글은 태국 전체의 현재 위험도를 한 등급으로 판정하지 않습니다. <a href="${BANGKOK_ARRIVAL_SOURCES.consular}">외교부 앱·영사안전콜센터 안내</a>에는 재외공관 연락처 확인과 해외 전화 <a href="tel:+82232100404">+82-2-3210-0404</a>가 게시돼 있습니다. 앱의 통신·위치 기능에는 한계가 있으므로 이것만을 유일한 연락 대안으로 두지 않습니다.</p>`
}];

export const BANGKOK_ARRIVAL_REVISION = {
  guides: BANGKOK_ARRIVAL_GUIDES, modified: BANGKOK_ARRIVAL_MODIFIED,
  homeUpdate: BANGKOK_ARRIVAL_HOME_UPDATE, updateId: 'bangkok-arrival-update',
  className: 'ss-regional-guide', stylesheet: '/assets/regional-guides.css', styleId: 'ss-regional-style',
  trustNote: '공항·운영자·정부 공개 자료 대조 및 도착 연결표 구성',
  limitation: '현장 확인·실시간 배차·개별 이동의 안전을 보증하지 않습니다.', worksheets: 1
};
