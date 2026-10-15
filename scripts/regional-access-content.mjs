export const ARTA_SLUG = '관광객이-적어-현지의-속도를-느낀-아르타';
export const CIVITA_SLUG = '이탈리아-치비타-디-반뇨레조-근처-마을';
export const REGIONAL_MODIFIED = '2026-10-15T18:57:43+09:00';
export const ARTA_BUS_SOURCE = 'https://www.ktelartas.gr/%CE%B4%CF%81%CE%BF%CE%BC%CE%BF%CE%BB%CF%8C%CE%B3%CE%B9%CE%B1/';
export const ARTA_BUS_ROWS = [
  ['월~금', '06:30 · 08:15 · 15:15 · 20:15', '06:00 · 09:30 · 15:15 · 20:30'],
  ['토요일', '09:00 · 14:00', '09:00 · 14:00'],
  ['일요일', '14:00 · 18:45', '14:00 · 18:30']
];
export const REGIONAL_HOME_UPDATE = `<li id="regional-access-update"><time datetime="2026-10-15">2026.10.15</time> · <a href="/${ARTA_SLUG}/">아르타</a>: 요일별 버스와 유적 휴관 공지를 대조했습니다. <a href="/${CIVITA_SLUG}/">치비타·반뇨레조</a>: 매표소·보행교·입장 조건을 분리했습니다.</li>`;

export const REGIONAL_GUIDES = [
  {
    slug: ARTA_SLUG,
    summary: '이오아니나 왕복 버스의 평일·주말 출발표와 유적 휴관 공지를 대조합니다. 재개관 미확인 상태, 고고학 박물관 화요일 휴관, 실제 체류시간 계산의 빠진 항목을 구분합니다.',
    body: `
<p>아르타를 석교만 잠깐 보고 떠날 도시로 볼지, 박물관까지 보는 도시로 볼지는 방문 요일과 실내 유산의 운영 상태에 따라 달라집니다. 이 글은 이오아니나(Ioannina)에서 버스로 들어와 돌아가는 경우를 중심으로 공식 자료를 교차 확인한 준비 가이드입니다. 직접 방문 후기나 현장 보행시간 측정 기록이 아닙니다.</p>
<p><strong>자료 확인일: 2026-10-15.</strong> 아래 버스 시각은 운영사 게시표의 확인 기록이며 예약 확정표가 아닙니다. 공휴일·임시 운행과 정확한 정류장, 방문일 운행은 결제 전에 운영사에 재확인해야 합니다.</p>
<h2 id="arta-three-places">1. 석교·고고학 박물관·파리고리티사는 다른 방문 목적입니다</h2>
<figure class="wp-block-table"><table><thead><tr><th>장소</th><th>방문 목적</th><th>이번에 확인한 조건</th></tr></thead><tbody>
<tr><td>아르타 석교</td><td>아라흐토스강의 역사 유산과 외부 경관</td><td>야외 목적지. 실제 접근 제한과 보행 경로는 당일 확인</td></tr>
<tr><td>아르타 고고학 박물관</td><td>고대 암브라키아의 역사·유물</td><td>문화부 안내: 08:30~15:30, 화요일 휴관</td></tr>
<tr><td>파리고리티사·조각 전시</td><td>비잔틴 유산과 건축 조각</td><td>유적 휴관 연장 공지와 별도 계절 운영표가 병존. 재개관 확인 필요</td></tr>
</tbody></table></figure>
<p><a href="https://efaart.gr/en/home-en/">아르타 유적 관리기관의 소개</a>는 고고학 박물관을 고대 암브라키아, 파리고리티사 조각 전시를 비잔틴 아르타의 자료로 구분합니다. 박물관은 강 동쪽, 역사적 석교 가까이에 있다고 소개하지만, 이것이 자신이 내리는 버스정류장에서부터의 거리나 보행시간을 알려 주는 것은 아닙니다. 두 전시를 같은 종류의 대체 관람으로 묶지 않습니다.</p>
<h2 id="arta-weekday-buses">2. 이오아니나 왕복은 같은 요일의 두 방향을 읽기</h2>
<p><a href="${ARTA_BUS_SOURCE}">KTEL 아르타 시간표</a>의 이오아니나 구간입니다. 모두 현지 출발 시각이며, 좌우의 같은 행이 연결된 왕복편이나 도착 시각을 뜻하지 않습니다.</p>
<figure class="wp-block-table"><table><caption>2026-10-15 확인한 게시표 · ΙΩΑΝΝΙΝΑ = 이오아니나, ΑΡΤΑ = 아르타</caption><thead><tr><th>요일</th><th>이오아니나 → 아르타 출발</th><th>아르타 → 이오아니나 출발</th></tr></thead><tbody>${ARTA_BUS_ROWS.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></figure>
<p>일요일은 이오아니나의 첫 게시 출발이 14:00입니다. 귀환이 늦다고 오전 관람이 가능한 것은 아닙니다. 도착 시각·정류장·짐 보관은 별도 미확인 항목입니다. <a href="https://www.ktelartas.gr/%CE%B5%CF%80%CE%B9%CE%BA%CE%BF%CE%B9%CE%BD%CF%89%CE%BD%CE%AF%CE%B1/">운영사</a>에 날짜와 편을 지정해 재확인합니다.</p>
<h2 id="arta-window-example">3. 토요일의 5시간은 관광 가능한 5시간이 아닙니다</h2>
<p><strong>게시표가 방문일에도 적용된다는 가정의 계산이며 예약 확정이 아닙니다.</strong> 토요일 이오아니나 09:00 출발과 아르타 14:00 귀환 출발의 차이는 5시간입니다. 여기에 가는 버스 탑승 시간이 포함됩니다.</p>
<blockquote><p>관람에 쓸 수 있는 시간 = 14:00 − 실제 아르타 도착 시각 − 짐 처리·정류장 이동·탑승 준비 시간</p></blockquote>
<p>도착 시각이 미확인이면 관람시간도 미확정입니다. 토요일 두 도시의 14:00 출발편을 왕복으로 연결할 수도 없습니다. 일요일 14:00 출발·18:30 귀환의 차이는 4시간 30분이지만, 박물관 게시 폐관은 15:30입니다. 실제 도착·박물관 이동·최종 입장을 확인해야 관람 여부를 정할 수 있습니다.</p>
<h2 id="arta-closure-conflict">4. 파리고리티사의 겨울 표를 재개관 공지로 읽지 않기</h2>
<p><a href="https://efaart.gr/conference-event/parigoritissa_2026_2/">현지 유적 관리기관의 2026-02-02 공지</a>는 공사에 따른 파리고리티사 휴관을 연장하며, 재개관일은 새 공지로 알린다고 설명합니다. 한편 <a href="https://archaeologicalmuseums.culture.gov.gr/en/museum/5f9001b032dc212c48701683/sculpture-collection-of-the-parigoritissa-church-arta">문화부 조각 전시 안내</a>에는 2026-04-08 갱신 표시와 함께 여름 공사 휴관, 겨울 요청 방문 표기가 있습니다.</p>
<p>여기서 11월이 되면 자동으로 다시 열린다고 결론 내릴 수 없습니다. 두 자료의 대상·공지 성격이 다르고, 겨울 계절표 자체는 유적 재개관을 확인하는 답변이 아닙니다. 이번 조사에서 실제 재개관을 확인하지 못했으므로 성당 내부나 조각 전시만을 위해 취소 불가 숙박을 확정하는 계획은 보류 항목으로 남깁니다.</p>
<p>관리기관의 공지에 있는 문의처는 <a href="tel:+302681024636">+30 26810 24636</a>, <a href="mailto:efaart@culture.gr">efaart@culture.gr</a>입니다. 연락은 이번 작업에서 대신 보내지 않았습니다. 문의할 때는 방문 날짜와 함께 성당 내부·조각 전시 각각의 개방 여부, 요청 방문 가능 여부, 입장 절차를 구분해 묻습니다. 답을 받기 전에는 둘 다 관람 가능하다고 표시하지 않습니다.</p>
<h2 id="arta-alternatives">5. 고고학 박물관을 대안으로 넣을 수 있는 날</h2>
<p><a href="https://archaeologicalmuseums.culture.gov.gr/en/museum/5df34af3deca5e2d79e8c123/archaeological-museum-of-arta">문화부 고고학 박물관 안내</a>는 겨울·여름 모두 08:30~15:30, 화요일 휴관을 게시하고 있습니다. 페이지의 마지막 갱신 표시는 2025-09-29입니다. 이 게시 조건과 방문일의 특별 휴관·최종 입장은 별도 확인 대상입니다.</p>
<figure class="wp-block-table"><table><thead><tr><th>방문 조건</th><th>남길 수 있는 목적</th><th>계획에서 바꿀 것</th></tr></thead><tbody>
<tr><td>화요일이며 박물관이 주목적</td><td>박물관 개관이 확인된 다른 날짜</td><td>방문일 변경 검토. 석교를 같은 전시 경험으로 대체하지 않음</td></tr>
<tr><td>파리고리티사 내부가 주목적, 재개관 미확인</td><td>운영자의 확인을 기다릴 목적</td><td>내부 관람을 확정 일정·숙박 이유에서 제외</td></tr>
<tr><td>석교와 고대사 전시 모두 관심</td><td>개관 확인 뒤 석교·박물관을 묶는 방문</td><td>실제 하차 지점과 마지막 탑승 지점, 짐 처리를 먼저 연결</td></tr>
<tr><td>늦게 도착하고 다음 날 떠날 계획</td><td>다음 날 가능한 관람</td><td>다음 날의 휴관·귀환편까지 맞는지 확인한 뒤 1박 비교</td></tr>
</tbody></table></figure>
<p>휴관을 피하려고 1박해도 다음 날이 화요일이면 박물관 문제는 해결되지 않습니다. 반대로 석교 외부가 목적이라면 실내 전시 휴관이 곧 아르타 방문 불가를 뜻하지는 않습니다. 주목적과 날짜를 먼저 맞춘 뒤 숙박비·이동비를 비교하는 것이 이곳 일정의 핵심입니다.</p>
<h2 id="arta-booking-sheet">6. 아르타 방문 확정표에 남길 여섯 항목</h2>
<p><a href="/assets/arta-visit-check.txt" download>아르타 방문 확정표 내려받기</a>에는 방문일·요일, 양방향의 출발과 실제 도착 확인, 하차·탑승 주소, 전시별 개관 답변, 짐 처리, 다음 행동을 적습니다. 빈칸을 임의 시간으로 채우거나 위의 게시표를 예약 확정서로 쓰지 않습니다.</p>
<p>석교 → 박물관 순서도 고정 추천하지 않습니다. 실제 도착 위치와 최종 입장에 따라 박물관을 먼저 보는 편이 맞을 수 있습니다. 전시를 뺄지 날짜를 바꿀지는 개관 여부와 귀환편을 모두 맞춘 뒤 정합니다. 숙박 후보가 남았다면 <a href="/tools/stay-compare/">숙소 총비용 비교기</a>, 도착·체크인 연결은 <a href="/honja-yeohaeng-junbi-gijun/">출발 결정표</a>에서 이어서 비교할 수 있습니다.</p>`
  },
  {
    slug: CIVITA_SLUG,
    summary: '반뇨레조 매표소와 치비타 보행교를 분리해 비교합니다. 운영사 게시 입장료·매표소별 시간·내부 숙박객 면제 안내와 이동 지원 예약 조건을 대조하고 확인할 구간을 남깁니다.',
    body: `
<p>치비타 디 반뇨레조(Civita di Bagnoregio)에 간다는 계획은 반뇨레조 본 마을 도착으로 끝나지 않습니다. 실제 하차 지점에서 안내 창구·보행교 입구·마을 안 목적지까지 이어져야 합니다. 입장권을 샀다는 사실도 시외버스나 야간 체크인을 확보했다는 뜻은 아닙니다.</p>
<p>이 글은 현장 방문·숙박 후기가 아니라, 관광청·시청·운영사 자료를 대조한 접근 가이드입니다. <strong>자료 확인일은 2026-10-15</strong>이며 게시 가격·시간을 이후 방문일의 확정 조건으로 보장하지 않습니다.</p>
<h2 id="civita-four-points">1. 지도에는 이름 하나 대신 네 지점을 표시하기</h2>
<figure class="wp-block-table"><table><thead><tr><th>지점</th><th>그곳에서 끝나는 일</th><th>아직 남은 구간</th></tr></thead><tbody>
<tr><td>실제 버스 하차·주차 지점</td><td>반뇨레조까지의 차량 이동</td><td>안내 창구·다리 접근·마을 안 보행</td></tr>
<tr><td>Piazzale Battaglini 인포포인트</td><td>해당 창구의 안내·매표</td><td>보행 또는 셔틀 뒤 보행교 접근</td></tr>
<tr><td>Mercatello·보행교 입구</td><td>다리 쪽 매표·입장 확인</td><td>다리 횡단과 목적지까지 이동</td></tr>
<tr><td>치비타 내부의 숙소·관람지</td><td>예약한 실제 목적지 도착</td><td>돌아갈 때 같은 접근 구간과 귀가 교통</td></tr>
</tbody></table></figure>
<p><a href="https://www.comune.bagnoregio.vt.it/it/vivere/infopoint">시청 인포포인트 안내</a>는 Piazzale Battaglini의 주소와 안내 창구를 설명합니다. 이 페이지의 접근 장벽 없음이라는 설명은 그 창구에 관한 것이며 보행교와 치비타 전 구역의 접근성을 인증하지 않습니다. 버스에 적힌 하차 지점이 그 광장과 같은지도 별도로 대조해야 합니다.</p>
<p><a href="https://www.italia.it/en/lazio/bagnoregio/bridge-of-civita-di-bagnoregio">이탈리아 관광청의 보행교 설명</a>은 다리 약 300m와 마을 문 쪽의 오르막을 소개합니다. 300m는 역·버스정류장부터의 전체 이동거리가 아닙니다. 이 글은 각 지점 사이를 실측하지 않았으므로 짐을 든 사람의 전체 보행시간을 하나의 숫자로 제시하지 않습니다.</p>
<h2 id="civita-ticket-offices">2. 입장료 5유로와 매표소 시간은 다른 정보입니다</h2>
<p><a href="https://www.casacivitabagnoregio.it/ticket-dingresso/">Casa Civita 입장권 안내</a>는 기본 입장료를 5유로로 게시하며 온라인 또는 현장 매표를 안내합니다. 이 페이지의 갱신 표시는 2026-09-07입니다. 표를 온라인으로 샀다면 종이 사본이나 휴대폰의 표를 다리 입구 직원에게 제시하는 방식이 안내돼 있습니다. 모바일 데이터가 없어도 표를 열 수 있는지 출발 전에 확인합니다.</p>
<figure class="wp-block-table"><table><caption>Casa Civita 매표소 안내의 게시 조건 · 페이지 갱신 2026-04-20</caption><thead><tr><th>매표소</th><th>게시 운영</th><th>방문 결정에 쓰는 방법</th></tr></thead><tbody>
<tr><td>Piazzale Battaglini</td><td>금~일 10:00~16:00, 변동 가능</td><td>월~목에도 이 창구가 열린다고 전제하지 않음</td></tr>
<tr><td>Mercatello, 보행교 아래</td><td>매일, 겨울 08:00~19:00 / 여름 08:00~20:00</td><td>방문일 계절 적용·변경 공지를 재확인</td></tr>
</tbody></table></figure>
<p>근거는 <a href="https://www.casacivitabagnoregio.it/biglietteria/">운영사의 매표소별 안내</a>입니다. 매표소 운영시간이 마을·숙소의 출입 가능 시간이나 시외버스 막차와 같다는 뜻은 아닙니다. 표 구매 창구가 닫혔다는 이유만으로 치비타 전체가 닫혔다고 결론 내리지도 않습니다. 당일 입장 방식과 귀가편은 각각 확인합니다.</p>
<h2 id="civita-accommodation-exemption">3. 치비타 안 숙박이라면 표를 사기 전에 면제 절차 묻기</h2>
<p>운영사의 같은 매표소 안내에는 <strong>치비타 내부 B&amp;B·휴가용 숙소 고객</strong>이 무료입장 대상 목록에 포함돼 있습니다. 반뇨레조라는 이름의 모든 숙소 예약이 면제된다는 뜻으로 확대하지 않습니다. 본 마을 숙소와 보행교 건너 내부 숙소는 주소부터 구분해야 합니다.</p>
<blockquote><p><strong>숙소에 보낼 확인 문안</strong><br>[방문 날짜] 예약한 숙소가 치비타 내부에 있나요? 운영사 안내의 숙박객 입장 면제 대상인지, 인정받을 증빙과 사전 등록 절차가 무엇인지 알려 주세요. 짐은 어느 지점에서부터 직접 옮겨야 하며, 늦은 도착 시 입장과 체크인은 어떻게 연결되나요?</p></blockquote>
<p>이 질문은 실제 면제를 보장하거나 숙소가 짐 운반을 제공한다고 가정하는 것이 아닙니다. 예약 메시지로 해당 상품의 조건을 확인하기 위한 문안입니다. 숙소·입장 운영자의 확인 전에는 면제를 확정하거나 같은 표를 중복 구매하지 않도록 구매 시점을 조정합니다. 여행을 취소할 때 입장권·숙박·교통의 환불 조건도 각각 다릅니다.</p>
<h2 id="civita-bus-shuttle-walk">4. 시외버스·셔틀·보행교는 하나의 교통편이 아닙니다</h2>
<p>오르비에토나 비테르보를 출발지로 검토한다면 <a href="https://cotralspa.it/ricerca-orari/">Cotral 공식 검색</a>에서 실제 출발·도착 정류장과 여행 날짜를 지정합니다. 해당 검색은 직접 연결 정류장을 보여 주고, 환승이 필요한 검색은 별도 경로 검색으로 안내합니다. 검색 결과가 비었다고 바로 운행이 없다고 단정하거나, 도시 이름이 보인다는 이유로 원하는 날짜의 직행이 확정됐다고 읽지 않습니다.</p>
<p>이번 조사에서는 특정 방문일의 정류장별 왕복편을 확정하지 않았습니다. 따라서 비공식 블로그의 막차·운행 횟수·운임을 복사해 넣지 않았습니다. 이 구간이 필요한 독자는 왕복 정류장·날짜별 결과를 확보한 뒤 다리 방문 시간을 정해야 합니다.</p>
<p>Casa Civita의 입장권 페이지는 Battaglini에서 다리 입구까지 보행 또는 셔틀로 접근하는 방법을 안내하지만, 그 설명만으로 방문일의 셔틀 시간·요금·수용 가능 짐이 확정되지는 않습니다. 셔틀을 탔다고 300m 보행교와 내부 이동까지 생략되는 것으로 보지도 않습니다. 시외버스 정류장 → 접근 이동 → 다리 → 내부 목적지라는 연결을 왕복으로 적습니다.</p>
<h2 id="civita-assisted-access">5. 긴 경사 보행이 어렵다면 일반 셔틀과 이동 지원을 구분하기</h2>
<p>시청은 홈페이지에서 <a href="https://www.casacivitabagnoregio.it/visita-a-civita-anche-per-chi-ha-disabilita-motoria-grazie-alla-croce-rossa-di-bagnoregio/">Casa Civita의 이동장애 방문자 지원 안내</a>로 연결합니다. 운영사는 현지 적십자와 특수 차량을 이용한 방문 지원, 사전 예약을 안내합니다. 이 서비스를 일반 셔틀과 같은 것으로 보거나 모든 방문자가 당일 즉시 이용할 수 있다고 단정하지 않습니다.</p>
<p>사용할 이동 보조기구, 동행 여부, 원하는 방문일을 밝히고 이용 가능 여부·예약 확정·승하차 지점·반환 이동·비용과 필요한 조건을 운영자에게 확인합니다. 숙소 안까지 지원되는지도 별개의 질문입니다. 지원 안내가 있다는 사실만으로 개인의 이동 가능성을 판정하거나 시설 전체를 무장애로 인증하지 않습니다.</p>
<p>답을 받지 못했다면 취소 불가 상품을 먼저 확정하지 않습니다. 동시에 다리를 건널 수 없을 것이라고 미리 단정해 모든 방문을 포기할 필요도 없습니다. 원하는 관람 목적과 실제 지원 조건을 확인한 뒤 치비타 내부 방문, 본 마을 체류, 날짜 변경 중에서 고릅니다.</p>
<h2 id="civita-two-cases">6. 당일 방문과 내부 숙박의 결정표</h2>
<figure class="wp-block-table"><table><thead><tr><th>상황</th><th>먼저 필요한 확인</th><th>확인 전 확정하지 않을 것</th></tr></thead><tbody>
<tr><td>평일 버스 당일치기</td><td>왕복 정류장·날짜, 현장 또는 온라인 입장, 다리까지 접근</td><td>Battaglini 창구가 평일 내내 열린다는 가정과 고정 관람시간</td></tr>
<tr><td>반뇨레조 본 마을 1박</td><td>숙소부터 다리 접근, 짐 보관, 다음 날 귀가</td><td>본 마을 예약만으로 입장 면제·차량 진입이 된다는 가정</td></tr>
<tr><td>치비타 내부 1박</td><td>면제 증빙·짐 운반·늦은 입장·숙소 체크인</td><td>입장과 체크인이 같은 마감이라는 가정</td></tr>
<tr><td>이동 지원 필요</td><td>지원 예약·기구·동행·승하차와 왕복 조건</td><td>일반 셔틀이나 안내 창구의 접근성으로 전체 방문 가능 판단</td></tr>
</tbody></table></figure>
<p><a href="/assets/civita-access-check.txt" download>치비타 접근·입장 확인표 내려받기</a>에서 교통·입장·짐·지원의 미확인 조건을 각각 남길 수 있습니다. 총액에는 실제 확인한 입장료, 왕복 교통, 셔틀·주차·짐 관련 비용을 넣되 모르는 비용을 무료로 처리하지 않습니다. 숙소까지 비교한다면 <a href="/tools/stay-compare/">숙소 총비용 비교기</a>의 입력 범위를 같은 기간으로 맞춥니다.</p>
<p>마지막 귀가편에서 역산할 때는 다리 왕복뿐 아니라 내부 목적지에서 다리 입구로 돌아오는 이동, 짐 찾기, 셔틀 대기, 실제 정류장까지의 연결을 포함합니다. 각 구간의 소요가 확인되지 않았다면 더 많은 관람지를 채우기 전에 왕복 연결부터 확정합니다. 전체 준비 순서는 <a href="/honja-yeohaeng-junbi-gijun/">출발 결정표</a>에서 이어서 확인할 수 있습니다.</p>`
  }
];

export const REGIONAL_REVISION = {
  guides: REGIONAL_GUIDES,
  modified: REGIONAL_MODIFIED,
  homeUpdate: REGIONAL_HOME_UPDATE,
  updateId: 'regional-access-update',
  className: 'ss-regional-guide',
  stylesheet: '/assets/regional-guides.css',
  styleId: 'ss-regional-style',
  trustNote: '공식 자료 조사·교통과 방문 조건 비교',
  limitation: '직접 방문·숙박 후기나 접근성 인증이 아닙니다.',
  worksheets: 2
};
