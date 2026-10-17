export const CHECKOUT_MORNING_SLUG = 'honja-yeohaeng-achim-routine';
export const CHECKOUT_MORNING_MODIFIED = '2026-10-17T18:04:00+09:00';
export const CHECKOUT_MORNING_HOME_UPDATE = `<li id="checkout-morning-update"><time datetime="2026-10-17">2026.10.17</time> · <a href="/${CHECKOUT_MORNING_SLUG}/">체크아웃하는 날의 아침</a>: 일본 호텔·도쿄역의 실제 보관 조건, 개찰구 안팎, 가방별 요금과 짐 회수 역산표를 대조했습니다.</li>`;
export const CHECKOUT_MORNING_SOURCES = {
  hotel: 'https://www.gardenhotels.co.jp/kanazawa/eng/room/',
  station: 'https://www.tokyostationcity.com/en/information/',
  logistics: 'https://www.jrbutsuryu.jregroup.ne.jp/business/baggage.html',
  sagawa: 'https://www.sagawa-exp.co.jp/hands-freetravel/english/servicecenter/tokyo_station.html',
  sagawaFaq: 'https://www.sagawa-exp.co.jp/hands-freetravel/english/faq/',
  entry: 'https://www.jreast.co.jp/suica/ic/use/touchdeekinaka/'
};

export const CHECKOUT_MORNING_GUIDES = [{
  slug: CHECKOUT_MORNING_SLUG,
  title: '체크아웃하는 날의 아침: 짐 보관·회수·출발 시간표',
  previousTitle: '혼자 여행 아침 루틴: 하루를 덜 흔들리게 시작하는 방법',
  summary: '일본 호텔과 도쿄역의 공식 안내로 당일 보관·개찰구 안팎·가방별 요금을 구분합니다. 열차 출발과 짐 회수 마감을 함께 역산하고, 배송으로 바꿀 수 없는 경우를 대조하는 체크아웃 실행표입니다.',
  body: `
<p>체크아웃한 날에는 관광 뒤 돌아갈 객실이 없습니다. ‘짐은 호텔에 두고 오후에 찾으면 된다’고 생각하기 전에, 보관을 실제로 받는지와 언제까지 찾아야 하는지를 확인해야 합니다. 오늘 아침의 결과물은 물건 목록이 아니라 <strong>객실 퇴실 → 짐 보관 → 회수 → 다음 출발</strong>이 이어지는 시간표입니다.</p>
<p><strong>자료 확인일: 2026-10-17.</strong> 일본 호텔·보관 운영자의 공개 조건을 비교한 준비 가이드입니다. 가나자와 호텔과 도쿄역 사례는 서로 다른 장소의 규칙을 읽는 예시이지 한나절 이동 코스가 아닙니다. 현장 이용 후기·보관 예약 완료 사례가 아니며, 실제 날짜의 접수·공간·금액·교통 운행은 다시 확인해야 합니다.</p>
<h2 id="morning-three-deadlines">1. 퇴실·짐 회수·다음 출발은 서로 다른 마감입니다</h2>
<figure class="wp-block-table"><table><thead><tr><th>마감</th><th>아침에 확인할 자료</th><th>구분해야 할 것</th></tr></thead><tbody>
<tr><td>객실 퇴실</td><td>내 예약 상품의 체크아웃 시각·추가 이용 조건</td><td>객실을 더 쓰는 것과 짐만 맡기는 것은 별개</td></tr>
<tr><td>짐 회수</td><td>보관처의 당일 접수·반환 시간과 회수 절차</td><td>프런트 운영시간·건물 폐점·열차 막차와 같다고 가정하지 않음</td></tr>
<tr><td>다음 출발</td><td>내 열차·버스·항공편의 출발 지점과 필요한 사전 절차</td><td>역 건물 도착과 승차 위치 도착은 다름</td></tr>
</tbody></table></figure>
<p><a href="${CHECKOUT_MORNING_SOURCES.hotel}">미쓰이 가든 호텔 가나자와 객실 안내</a>는 체크아웃을 11:00으로 게시하고, 체크아웃 후 프런트 짐 보관은 당일만 가능하다고 적습니다. 귀중품·식품·위험물·냉장·냉동 물품은 받지 않는다고 안내합니다. ‘당일 보관’은 객실을 저녁까지 쓸 수 있다거나 다음 날 회수해도 된다는 뜻이 아닙니다.</p>
<p>이 조건을 다른 호텔이나 지점의 규칙으로 옮기지 않습니다. 내 예약의 퇴실 시각, 맡길 짐의 종류·크기·개수와 실제 회수 가능한 시각을 해당 숙소에 확인합니다. 무료라고 적힌 근거가 없다면 보관료를 0엔으로 확정하지 않고, 보관 불가라면 짐을 들고 갈 수 있는 이동 또는 확인된 다른 보관처를 먼저 정합니다.</p>
<h2 id="morning-station-side">2. ‘도쿄역에 보관’ 대신 층·개찰구·서비스를 적기</h2>
<p><a href="${CHECKOUT_MORNING_SOURCES.station}">Tokyo Station City 공식 안내</a>는 야에스 남쪽 개찰구 밖의 보관 서비스와 B1 GRANSTA TOKYO 개찰구 안의 보관소를 나눕니다. 지도에서 가까워 보여도 선로·개찰구를 가로질러 바로 회수할 수 있는 것은 아닙니다. 역 이름만 저장하지 말고 정확한 시설명·층·개찰구 안팎과 다시 들어가는 경로를 남깁니다.</p>
<figure class="wp-block-table"><table><caption>2026-10-17 열람한 도쿄역 게시 안내 · 서비스별 시간 차이를 확인할 사례</caption><thead><tr><th>게시처·서비스</th><th>위치·게시 시간</th><th>아침 계획에서의 확인</th></tr></thead><tbody>
<tr><td>Tokyo Station City의 Shinkansen Parcel Service &amp; Baggage Storage</td><td>야에스 남쪽 개찰구 밖, 05:30–23:00</td><td>운송과 보관을 함께 소개하는 시간인지, 실제 맡김·회수 시간이 같은지</td></tr>
<tr><td>JR동일본물류의 도쿄역 짐 서비스 카운터</td><td>야에스 남쪽 개찰구 밖, 접수 09:30–20:00</td><td>정확한 창구와 이용일의 보관 접수·반환을 운영자에게 확인</td></tr>
<tr><td>JR동일본물류의 BAGGAGE STORAGE＋</td><td>GRANSTA 지하 북쪽 개찰구 안, 접수 09:30–20:00</td><td>짐 회수에 필요한 입장·승차 경로와 추가 비용 확인</td></tr>
</tbody></table></figure>
<p>위 표의 첫 두 안내는 같은 야에스 남쪽 개찰구 밖 권역을 가리키지만 서비스 표기와 시간이 다릅니다. 이유나 갱신 순서를 이 조사에서 확정하지 않았습니다. 편리한 쪽인 23:00을 골라 반환 마감으로 쓰거나, 운송 접수시간을 임의로 보관 반환시간에 적용하지 않습니다. <a href="${CHECKOUT_MORNING_SOURCES.logistics}">보관 운영자 안내</a>는 영업시간 밖 반환이 불가능하다고 명시합니다. 08:30에 맡겨야 하는 일정도 위 09:30 접수 표기만으로는 성립하지 않습니다.</p>
<p><a href="${CHECKOUT_MORNING_SOURCES.entry}">JR동일본의 ‘터치로 에키나카’ 안내</a>는 대상 역에서 Suica로 같은 역에 들어갔다 2시간 안에 나올 때 적용되는 유료 입장 서비스를 설명합니다. 대상 제외 개찰구가 있고 신칸센 개찰구에는 이 서비스로 들어갈 수 없습니다. 교통카드를 갖고 있다는 사실을 무료 입장·모든 개찰구 통과 보장으로 읽지 않고, 내 승차권·보관 위치에 맞는 경로를 직원에게 확인합니다.</p>
<h2 id="morning-bag-cost">3. 가방 두 개의 비용과 크기 제한을 따로 계산하기</h2>
<p><a href="${CHECKOUT_MORNING_SOURCES.sagawa}">사가와 도쿄 서비스센터</a>는 도쿄역 니혼바시 출구 쪽 도쿄역 일번가 1층, 07:00–21:00으로 안내합니다. 웹 예약과 현장 접수를 소개하지만 실제 이용일의 공간이나 대기시간은 확인하지 않았습니다. 앞 절의 야에스 남쪽 창구와 같은 시설이 아닙니다.</p>
<figure class="wp-block-table"><table><caption>세 변 합 160cm 가방 1개 + 100cm 가방 1개를 같은 날 맡긴다고 가정한 게시 보관료만의 계산</caption><thead><tr><th>보관 후보</th><th>게시 구간에 넣은 계산</th><th>계산의 범위</th></tr></thead><tbody>
<tr><td>JR동일본물류 야에스 남쪽 창구</td><td>M 구간 1,000 + S 구간 500 = 1,500엔</td><td>두 물건을 개별 과금. 게시 세금 포함 금액</td></tr>
<tr><td>사가와 도쿄 서비스센터</td><td>160cm 이하 1,500 + 100cm 이하 1,000 = 2,500엔</td><td>각 1개·1일의 게시 세금 포함 금액</td></tr>
</tbody></table></figure>
<p>위 1,000엔 차이는 보관료 두 항목만의 차이입니다. 접수 허용·반환 가능·보상 범위가 같다는 확인도, 가장 싼 후보라는 순위도 아닙니다. 이동비·개찰구 입장료·추가 이용일·별도 필수 비용을 아직 더하지 않았습니다. JR동일본물류는 캐리어 위의 가방·종이봉투도 별도 과금한다고 적으므로 ‘캐리어 하나에 얹었다’는 이유로 한 개라고 계산하지 않습니다.</p>
<p><a href="${CHECKOUT_MORNING_SOURCES.sagawaFaq}">사가와 보관 FAQ</a>는 세 변 합 200cm 이하·무게 30kg 이하를 안내합니다. 지점 가격표의 ‘161cm 이상’ 구간은 무제한 크기를 받는다는 뜻이 아닙니다. 160cm 가방도 무게·내용물 조건을 확인해야 하며, 한 물건이 전체 제한을 넘으면 높은 요금만 내고 맡길 수 있다고 가정하지 않습니다. 냉장 보관 지원도 지점별 조건이며, 어느 보관소든 개인 약·식품을 무조건 받아 준다는 뜻은 아닙니다.</p>
<h2 id="morning-backward-clock">4. 관광 종료 시각을 짐 회수 완료부터 역산하기</h2>
<p>다음 교통편 출발에서 승차 전 준비, 짐 회수 후 이동, 실제 회수 절차를 거꾸로 뺍니다. 그 결과와 보관처가 확인한 회수 완료 마감 중 더 이른 조건을 적용합니다. 회수 줄·다른 층 이동·엘리베이터·개찰구 경로를 0분으로 채우지 않습니다.</p>
<figure class="wp-block-table"><table><caption>같은 날 현지 시각으로 계산한 가상 예시 · 실제 열차·이동 측정·권장 여유시간 아님</caption><thead><tr><th>역산 단계</th><th>가정과 계산</th><th>시각</th></tr></thead><tbody>
<tr><td>승차 위치 도착 목표</td><td>가상 열차 16:00 출발 − 준비 20분</td><td>15:40</td></tr>
<tr><td>호텔 짐 회수 완료 목표</td><td>15:40 − 호텔에서 승차 위치까지 35분</td><td>15:05</td></tr>
<tr><td>회수 절차 시작 목표</td><td>15:05 − 회수 절차 10분</td><td>14:55</td></tr>
<tr><td>관광 종료 기준</td><td>14:55 − 관광지에서 호텔까지 30분 − 별도 여유 15분</td><td>14:10</td></tr>
</tbody></table></figure>
<p>더 이른 마감도 대조해야 합니다. 보관처가 ‘14:30까지 회수 완료’를 확인했다는 별도 가정이라면 15:05가 아니라 14:30을 기준으로 삼아, 같은 회수 10분·이동 30분·여유 15분을 빼면 관광 종료 기준은 <strong>13:35</strong>가 됩니다. 16:00 열차만 보고 14:10까지 관광하면 보관 조건을 놓칠 수 있습니다.</p>
<p>모든 분 수와 열차는 방법을 설명하기 위한 가정입니다. 실제로 20분 전이면 충분하다거나 15분의 여유로 모든 지연을 해결한다는 뜻이 아닙니다. 현지 운영자 안내와 자신의 이동 조건으로 바꾸고, 마감 직전을 목표로 삼지 않도록 필요한 여유를 별도로 확인합니다. 돌아오는 이동이나 회수가 미확인이면 먼 관광부터 확정하지 말고 먼저 그 연결을 해결합니다.</p>
<h2 id="morning-storage-not-delivery">5. 보관을 ‘당일 배송’으로 바꾸면 회수 장소도 바뀝니다</h2>
<p>사가와 도쿄 서비스센터의 공항 배송 안내는 하네다·나리타 당일 배송을 <strong>11:00 접수 마감, 16:00 이후 도착 예상</strong>으로 게시합니다. 앞 절 보관료가 아니라 별도 배송 상품이며, 07:00–21:00의 창구 영업시간이 전부 당일 배송 접수시간인 것도 아닙니다.</p>
<p>‘당일’이라는 말만 보고 오전·이른 오후에 공항에서 찾을 수 있다고 판단하지 않습니다. 내 공항·터미널·수령 창구, 실제 도착 예상, 수령 마감, 항공사 탑승 수속·위탁수하물 마감을 연결해 확인해야 합니다. 16:00 이후라는 예상은 정확히 16:00 수령이나 내 비행편 탑승을 보장하지 않습니다. 이 글은 배송을 신청하거나 개별 수령 가능 답변을 받은 것이 아닙니다.</p>
<p>배송·보관한 가방을 당분간 열 수 없다면 이동 중 필요한 서류·연락·결제 수단과 개인에게 필요한 물품은 접근 가능한 곳에 둡니다. 모든 금지 물품과 개인의 보관·휴대 적합성을 이 글이 판정하지는 않습니다. 접수증을 잃었거나 회수가 늦어질 때는 맡긴 운영자에게 연락하고, 역무원이 영업시간 밖에 대신 꺼내 줄 것이라고 가정하지 않습니다.</p>
<h2 id="morning-exit-sheet">6. 방을 나서기 전에 실행표의 빈칸을 확인하기</h2>
<p><a href="/assets/checkout-morning-check.txt" download>체크아웃·짐 회수 실행표 내려받기</a>에 퇴실·보관·회수·다음 출발의 현지 날짜와 시각을 기록합니다. 각 후보에 무료·빈자리·반환 가능을 추측해 넣지 않고 미확인 상태를 남깁니다. 이 빈 표는 개인용이며 사이트로 전송되지 않습니다. 보관 QR·암호·카드번호·여권번호를 적거나 공개하지 않습니다.</p>
<blockquote><p><strong>호텔·보관처에 확인할 질문</strong><br>[이용일] 체크아웃 후 [가방 크기·무게·개수]를 맡기고 [회수 날짜·시각]까지 찾고 싶습니다. 접수가 가능한가요? 총 보관료, 정확한 창구·개찰구 안팎, 접수와 회수 마감, 회수에 필요한 증빙, 지연될 때 연락·처리 방법을 알려 주세요. 객실 연장이 아니라 짐 보관만 문의합니다.</p></blockquote>
<p>아침에는 예약 상품의 퇴실 조건과 교통 변경을 다시 보고, 실제 맡긴 뒤 접수증·개수·회수 장소를 대조합니다. 체크아웃을 마치기 전 객실의 충전기·보관함·서랍과 운영자가 요구하는 열쇠 반납도 확인합니다. 짐 문제로 도착이 늦어지면 다음 숙소에도 알립니다. 이 글은 위 질문을 운영자에게 실제로 보내거나 회신을 받은 기록이 아닙니다.</p>
<p>여행 전의 전체 준비는 <a href="/honja-yeohaeng-junbi-gijun/">출발 결정표</a>, 휴대폰을 사용할 수 없을 때의 주소·연락 대안은 <a href="/honja-yeohaeng-junbimul-checklist/">준비물 작동 점검표</a>에서 다룹니다. 식사 일정이 짐 회수와 겹친다면 <a href="/honja-yeohaeng-sikdang-goreuneun-beop/">식당의 이용·마지막 주문 조건</a>도 함께 대조합니다.</p>`
}];

export const CHECKOUT_MORNING_REVISION = {
  guides: CHECKOUT_MORNING_GUIDES, modified: CHECKOUT_MORNING_MODIFIED,
  homeUpdate: CHECKOUT_MORNING_HOME_UPDATE, updateId: 'checkout-morning-update',
  className: 'ss-regional-guide', stylesheet: '/assets/regional-guides.css', styleId: 'ss-regional-style',
  trustNote: '호텔·역·보관 운영자 공개 조건 대조 및 회수 역산표 구성',
  limitation: '현장 이용 후기·실제 보관 접수·교통 연결을 보증하지 않습니다.', worksheets: 1
};
