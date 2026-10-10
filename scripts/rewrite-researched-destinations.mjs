import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const articles = {
  "관광-코스가-없어-자유로웠던-사피-여행": {
    title: "모로코 사피 혼자 여행: 도자기 거리·메디나·해안 동선 고르기",
    description: "모로코 사피의 공식 관광 자료를 바탕으로 도자기 거리, 메디나, 해안 방문을 분리하고 숙소와 이동을 판단하는 방법을 정리했습니다.",
    summary: "모로코 관광청 자료를 바탕으로 사피의 도자기 지구, 메디나, 해안을 각각 다른 방문 구간으로 보고 일정과 복귀 수단을 정리한다.",
    sections: [
      ["사피에 관광 코스가 없다는 전제부터 바로잡기", `<p>사피를 단순히 '볼거리 없는 도시'로 소개하는 것은 정확하지 않다. <a href="https://www.visitmorocco.com/en/travel/safi">모로코 국가관광청의 사피 안내</a>는 도자기 지구, 옛 메디나, 케슐라(Kechla), 해안, 포르투갈 시대 유산을 명시한다. 이 글은 직접 방문 후기가 아니다. 공개 자료에 있는 장소를 혼자 여행자의 이동 결정에 맞게 재배열한 준비 가이드다.</p><p>관광청의 목적지 소개는 장소의 존재를 확인해 주지만, 방문일의 개방 여부나 한 장소에서 다른 장소로 가는 실제 교통편까지 보증하지 않는다. 이 둘을 같은 정보로 취급하지 않는 것이 첫 단계다.</p>`],
      ["도자기 지구와 메디나는 같은 날 묶되 이동을 따로 확인", `<p>사피의 도자기 지구는 이 도시를 다른 해안 도시와 구분하는 핵심이다. 관광청은 장인이 테라코타와 점토 작업을 하는 지구와 상점들을 소개한다. <a href="https://www.visitmorocco.com/en/travel/safi/medina">메디나 상세 안내</a>에는 성벽과 케슐라, 시장이 별도의 탐색 대상으로 나온다. 따라서 '바다만 잠깐 보고 이동'하기보다 도자기와 구시가 중 무엇을 우선할지 정하는 편이 낫다.</p><p>지도에서 두 지점 사이의 경로와 고도를 확인하고, 짐을 들고 걷는 구간은 따로 계산한다. 상점이나 박물관을 꼭 보려면 방문일의 운영 정보가 확인될 때만 일정의 고정 지점으로 넣는다. 사진 촬영과 공방 출입 가능 여부는 현장에서 허락을 구해야 한다.</p>`],
      ["해안 방문은 날씨와 복귀 수단을 한 세트로 보기", `<p>공식 관광 자료는 사피의 대서양 해안과 서핑을 도시의 특징으로 소개한다. 그러나 이 문서만으로 해안의 특정 구간이 수영이나 야간 산책에 적합하다고 판단할 수는 없다. 파도, 바람, 일몰, 숙소까지 돌아오는 수단은 방문일에 다시 확인해야 한다.</p><p>해안이 여행의 주목적이라면 숙소를 해안과 가까운 곳에 무조건 잡기보다 식사·교통 접근성과 함께 비교한다. 반대로 도자기 지구와 메디나가 목적이라면 해안은 낮 시간의 선택 일정으로 두고, 귀가 시간을 먼저 정하는 편이 안정적이다.</p>`],
      ["사피를 경유지로 둘지 1박할지 결정하는 표", `<figure class="wp-block-table"><table><thead><tr><th>조건</th><th>당일 경유에 가까운 경우</th><th>1박을 검토할 경우</th></tr></thead><tbody><tr><td>도착 시간</td><td>낮에 도착하고 다음 이동편이 확인됨</td><td>늦게 도착해 구시가를 낮에 볼 시간이 부족함</td></tr><tr><td>관심 대상</td><td>한 구역만 짧게 확인</td><td>도자기·메디나·해안을 나눠 보고 싶음</td></tr><tr><td>짐과 복귀</td><td>짐 보관과 다음 교통 연결이 확실함</td><td>짐 이동이나 늦은 귀가가 부담됨</td></tr></tbody></table></figure><p>표는 여행 결정 예시이며 실제 운행표가 아니다. 1박을 선택했다면 숙소의 늦은 체크인, 다음 날 출발지까지의 교통, 현금·결제 조건을 예약 전에 확인한다.</p>`],
      ["확인하지 못한 정보와 출발 전 확인 순서", `<p>이 글은 현지 방문 경험, 영업시간, 입장료, 택시 요금을 확인했다고 주장하지 않는다. 먼저 <a href="https://www.visitmorocco.com/en/travel/safi">관광청의 사피 개요</a>에서 목적지를 고르고, 해당 시설의 공식 안내에서 운영 여부를 확인한다. 이어 실제 이용할 교통사업자와 숙소에서 도착·복귀 조건을 확인한다. 치안과 여행경보는 <a href="https://0404.go.kr/travelAlert/apntStatus/stepTravelAlert?index=1">외교부 해외안전여행</a>의 현재 안내를 따른다.</p><p>동선 확인이 끝나지 않았다면 구시가·해안·다음 도시 이동을 하루에 모두 넣지 않는다. 사피에서 중요한 것은 '천천히 걷기'라는 분위기보다 실제로 볼 장소와 돌아올 방법을 하나씩 확정하는 일이다.</p>`]
    ],
    related: [["혼자 여행 준비 기준", "/honja-yeohaeng-junbi-gijun/"], ["숙소 고르는 법", "/honja-yeohaeng-sukso-goreuneun-beop/"]]
  },
  "관광객이-적어-현지의-속도를-느낀-아르타": {
    title: "그리스 아르타 혼자 여행: 석교·구시가지·버스 연결 판단",
    description: "그리스 관광청의 아르타·아르타 석교 자료로 보행 구간과 도시 간 버스 연결을 구분해 혼자 여행 일정을 계획합니다.",
    summary: "그리스 관광청 자료에 근거해 아르타 석교와 시내 보행을 계획하고, 시외버스 연결은 실제 운행표로 다시 확인한다.",
    sections: [
      ["아르타를 '관광객이 적은 도시'로 단정하지 않기", `<p>관광객 수를 직접 조사한 자료가 없는 만큼 이 글은 '한적했다'는 개인 체험을 주장하지 않는다. <a href="https://www.visitgreece.gr/en/islands/Epiro/arta">그리스 관광청의 아르타 소개</a>에 따르면 이 도시는 에피루스 지역의 아라흐토스강 주변에 있고, 석교와 비잔틴 문화유산이 주요 방문 이유다. 먼저 무엇을 보려는지 분명히 한 뒤 숙박 여부를 정하는 편이 정확하다.</p><p>아르타를 그저 큰 도시 사이의 쉬는 장소로만 보면 핵심 유산을 놓칠 수 있다. 반대로 석교 하나만 보고 바로 떠날 예정이라면 늦은 버스 도착과 다음 교통편 사이에 충분한 여유가 있는지 계산해야 한다.</p>`],
      ["석교와 시내 보행을 분리해서 계획하기", `<p><a href="https://www.visitgreece.gr/en/experiences/leisure/shopping/the-bridge-of-arta">아르타 석교 공식 안내</a>는 석교가 시내 중심에서 약 500m 떨어져 있고 아라흐토스강을 가로지른다고 설명한다. 관광청은 석교를 도보로 방문할 수 있는 장소로 소개한다. 다만 이 거리는 시내 중심 기준이지, 모든 숙소나 버스정류장에서부터의 거리라는 뜻은 아니다.</p><p>실제 동선에는 자신이 이용할 버스 하차 지점, 짐 보관 장소, 석교, 식사 지점, 다음 버스 탑승 장소를 순서대로 넣는다. 걷는 데 걸리는 시간은 날씨·짐·개인 이동 속도에 따라 달라지므로 지도 앱 숫자만으로 다음 버스 예약을 촘촘히 연결하지 않는다.</p>`],
      ["당일 방문과 1박의 경계", `<figure class="wp-block-table"><table><thead><tr><th>판단 항목</th><th>당일 방문이 가능한 조건</th><th>1박이 유리한 조건</th></tr></thead><tbody><tr><td>교통</td><td>도착·출발 버스의 운영사가 확정되고 여유가 있음</td><td>마지막 연결편을 놓칠 위험이 큼</td></tr><tr><td>관심 장소</td><td>석교 중심의 짧은 시내 방문</td><td>비잔틴 교회와 시내를 나눠 보고 싶음</td></tr><tr><td>짐과 숙소</td><td>짐 보관을 확인함</td><td>짐을 끌고 이동하기 어렵거나 늦게 도착함</td></tr></tbody></table></figure><p>이는 선택 기준이지 보장된 교통 일정표가 아니다. 버스 시간·운임은 이용할 KTEL 사업자의 최신 안내에서 출발 직전에 확인해야 한다.</p>`],
      ["다음 도시 연결에서 놓치기 쉬운 점", `<p>그리스 관광청은 아르타가 아테네, 테살로니키, 이오아니나, 프레베자 등과 시외버스로 연결된다고 소개한다. 그렇다고 모든 노선이 원하는 시각에 있는 것은 아니다. 목적지 이름만 확인하지 말고 출발 정류장, 중간 환승 여부, 도착 터미널, 수하물 조건을 각각 확인해야 한다.</p><p>당일 이동이 두 번 이상이면 아르타 시내에서의 활동을 줄여야 한다. 석교를 못 보더라도 다음 교통편을 놓치지 않는 편이 손실이 작다. 짐 보관이 확인되지 않았다면 여행지 평가보다 이동 계획부터 다시 세운다.</p>`],
      ["자료 범위와 실제 예약 전 확인할 것", `<p>이 글은 현장 방문 후기나 특정 시기 교통편 리뷰가 아니다. <a href="https://www.visitgreece.gr/en/islands/Epiro/arta">그리스 관광청 아르타 안내</a>와 <a href="https://www.visitgreece.gr/en/experiences/leisure/shopping/the-bridge-of-arta">석교 안내</a>에서 확인한 지리·유산 정보를 토대로 일정 선택 방법을 제시한다. 석교 접근 제한, 시설 개방, 버스 운행, 숙소 체크인은 각 운영자의 최신 공지에서 다시 확인해야 한다.</p><p>아르타를 선택할 만한 사람은 '조용한 도시'라는 막연한 기대를 가진 사람이 아니라 석교와 도시 역사에 관심이 있고, 시외버스 연결을 확인할 여유가 있는 여행자다.</p>`]
    ],
    related: [["혼자 여행 준비 기준", "/honja-yeohaeng-junbi-gijun/"], ["위급 상황 대응", "/honja-yeohaeng-emergency-response/"]]
  },
  "구경-대신-산책이-전부였던-샤르자-외곽의-오후": {
    title: "샤르자 중부 믈레이하: 도심 산책과 사막 방문을 구분하는 법",
    description: "샤르자 관광청 자료로 믈레이하 유적 방문과 샤르자 도심 산책의 이동 조건을 구분합니다.",
    summary: "샤르자 도심과 믈레이하는 같은 산책권이 아니다. 공식 안내의 위치와 이동 수단을 먼저 확인하고 일정을 나눈다.",
    sections: [
      ["'샤르자 외곽을 걸었다'는 기록 대신 위치부터 확인", `<p>이 글은 실제 방문 기록이 없다. 샤르자의 도심과 중부 지역 믈레이하를 '한 오후의 외곽 산책'으로 묶었던 설명도 이동 거리를 충분히 보여주지 못했다. <a href="https://www.visitsharjah.com/activities/adventure/mleiha-national-park/">샤르자 관광청의 믈레이하 국립공원 안내</a>는 믈레이하 고고학 센터가 샤르자 시내에서 남동쪽으로 약 65km 떨어져 있다고 설명한다. 도심 보행과 사막 지역 방문은 별도 일정으로 계산해야 한다.</p><p>공식 안내는 고고학 유적과 가이드 활동을 소개한다. 이것은 자유롭게 아무 구간이나 혼자 걸어도 된다는 뜻이 아니다. 방문하려는 활동의 운영자, 이동 방법, 모임 장소, 귀환편을 각각 확인해야 한다.</p>`],
      ["믈레이하가 목적이라면 왕복 이동을 먼저 예약", `<p><a href="https://www.visitsharjah.com/en/regions/central-region/mleiha/">샤르자 관광청의 믈레이하 소개</a>에는 유적, 사막 체험, 천문 활동 등 성격이 다른 방문 방식이 나온다. 원하는 체험을 먼저 고른 뒤 예약 조건에 왕복 교통이 포함되는지 확인한다. 관광청은 차가 없는 방문자를 위한 샤르자 출발 왕복 이동 가능성을 언급하지만, 실제 제공 여부와 시간은 방문 상품마다 다를 수 있다.</p><p>숙소에서 목적지까지의 도로 이동만 계산하면 돌아오는 시간을 빠뜨리기 쉽다. 집결 장소, 활동 종료 시각, 귀환 하차 지점, 취소 기준을 한 번에 확보할 수 없으면 사막 체험은 그날 일정의 고정 항목으로 넣지 않는 편이 낫다.</p>`],
      ["도심 하루와 중부 지역 하루의 선택표", `<figure class="wp-block-table"><table><thead><tr><th>우선하고 싶은 일</th><th>일정 선택</th><th>예약 전 핵심 확인</th></tr></thead><tbody><tr><td>박물관·도시 보행</td><td>샤르자 도심 안에서 숙소와 방문 지점을 연결</td><td>시설 운영일·입장 조건·도보 환경</td></tr><tr><td>유적·사막 체험</td><td>믈레이하를 별도 왕복 일정으로 배치</td><td>운영자·이동 포함 여부·복귀 시각</td></tr><tr><td>두 지역 모두</td><td>같은 오후에 붙이지 않고 날짜 또는 주요 활동을 나눔</td><td>교통 지연 시 포기할 활동</td></tr></tbody></table></figure><p>표는 동선 설계를 위한 기준이다. 현지 기온, 행사, 운영 시간과 교통 조건은 출발 직전에 다시 확인한다.</p>`],
      ["더위와 안전 정보의 확인 범위", `<p>사막 방문은 계절과 시간대에 따라 체감 조건이 크게 달라질 수 있다. 그날의 기상청·활동 운영자 안내를 우선하고, 물과 통신 수단을 준비한다. 혼자 자유 이동이 적절한지는 이 글만으로 판단할 수 없다. 해외 안전 공지는 <a href="https://0404.go.kr/travelAlert/apntStatus/stepTravelAlert?index=1">외교부 여행경보</a>에서 목적지별로 확인한다.</p><p>이 글에서 확인된 사실은 믈레이하의 위치와 관광청이 안내하는 활동 종류다. 특정 날짜의 입장료, 운영 시간, 교통 운임은 확인하지 못했으므로 단정하지 않는다.</p>`]
    ],
    related: [["혼자 여행 준비 기준", "/honja-yeohaeng-junbi-gijun/"], ["동남아 안전 기준", "/honja-southeast-asia-safety/"]]
  },
  "심심함이-여행의-일부가-된-반퐁에서의-며칠": {
    title: "태국 반퐁 여행 준비: 랏차부리 시청 자료로 장소와 시간을 확인하기",
    description: "태국 랏차부리주 반퐁 시청 자료를 바탕으로 시장·문화 장소의 위치와 방문일 운영 조건을 확인하는 방법입니다.",
    summary: "반퐁을 막연한 조용한 도시로 묘사하지 않고, 시청 관광 자료에 나온 문화 장소와 방문일 조건을 확인한다.",
    sections: [
      ["이 글에서 말하는 반퐁을 먼저 한정", `<p>이 글의 반퐁은 태국 랏차부리주 반퐁시(Ban Pong Municipality)를 뜻한다. 직접 며칠 머물렀다는 기록은 없다. <a href="https://www.banpong.go.th/public/list/data/index/menu/1545">반퐁 시청 관광 목록</a>에는 문화 장소와 시장 관련 자료가 실려 있다. 따라서 '할 일이 없는 곳'이라는 식의 인상 평가보다, 실제로 찾아갈 장소와 방문일에 열리는 활동을 구분하는 편이 유용하다.</p><p>태국에는 이름이 비슷한 지명과 역이 있을 수 있다. 숙소 예약과 교통 검색에서 영문 Ban Pong뿐 아니라 행정구역 Ratchaburi까지 함께 확인한다. 이 글은 다른 지역의 비슷한 이름을 반퐁으로 합치지 않는다.</p>`],
      ["문화 장소와 정기 행사를 혼동하지 않기", `<p>시청 자료의 관광 목록에는 문화 명소 소개와 송끄란 행사, 시장 행사 등 서로 다른 성격의 게시물이 함께 있다. 과거 행사 안내는 그해 행사가 열렸다는 기록일 뿐, 방문하는 해에도 같은 날짜에 열린다는 보증이 아니다. 날짜가 적힌 게시물이라면 해당 연도의 최신 공지를 다시 확인해야 한다.</p><p>시장이나 거리 예술을 보고 싶다면 <a href="https://www.banpong.go.th/public/">반퐁 시청의 최신 공지</a>에서 운영일과 위치를 찾는다. 찾지 못한 행사는 일정의 필수 항목으로 두지 않는다. 짧은 경유라면 실제 운영 확인이 된 한 장소만 목표로 삼는 편이 낫다.</p>`],
      ["숙박과 경유를 가르는 확인표", `<figure class="wp-block-table"><table><thead><tr><th>확인할 조건</th><th>경유에 적합한 경우</th><th>숙박을 검토할 경우</th></tr></thead><tbody><tr><td>방문 목적</td><td>운영이 확인된 한 장소를 낮에 방문</td><td>여러 장소나 저녁 행사가 실제로 확인됨</td></tr><tr><td>다음 이동</td><td>출발 교통편과 탑승 위치를 확인</td><td>당일 마지막 연결편이 불확실함</td></tr><tr><td>숙소</td><td>짐 보관과 귀가가 단순함</td><td>늦은 도착 또는 짐 이동 부담이 큼</td></tr></tbody></table></figure><p>이 표는 실제 기차·버스 시간표가 아니다. 운영사 공지와 예약 화면에서 노선과 출발역을 확인하기 전에는 숙박일수를 확정하지 않는다.</p>`],
      ["자료의 한계와 방문 전 확인 순서", `<p>반퐁 시청 자료는 지역의 장소와 행사 기록을 확인하는 데 유용하지만, 숙소 품질이나 현재 교통 운행을 평가하지 않는다. 장소가 확정되면 시청 최신 공지, 실제 교통 운영사, 숙소 순서로 확인한다. 여행경보는 <a href="https://0404.go.kr/travelAlert/apntStatus/stepTravelAlert?index=1">외교부 해외안전여행</a>에서 현재 상태를 본다.</p><p>기존 글의 '심심함이 좋았다'는 표현은 방문 근거가 없어 여행지 평가로 사용할 수 없다. 반퐁이 자신의 목적에 맞는지는 행사 날짜와 연결 교통이 확인된 뒤 판단해야 한다.</p>`]
    ],
    related: [["혼자 여행 준비 기준", "/honja-yeohaeng-junbi-gijun/"], ["숙소 고르는 법", "/honja-yeohaeng-sukso-goreuneun-beop/"]]
  },
  "여행자보다-주민이-더-많았던-투이호아의-분위기": {
    title: "베트남 투이호아 혼자 여행: 해변 도심과 푸옌 광역 이동 구분",
    description: "베트남 관광청의 푸옌·투이호아 자료를 토대로 도심 해변과 광역 명소를 다른 일정으로 계획합니다.",
    summary: "투이호아 도심 해변과 푸옌의 먼 자연 명소를 분리하고, 첫날 공항·숙소 이동을 먼저 확인한다.",
    sections: [
      ["주민이 더 많았다는 체험담 대신 확인된 지리 정보", `<p>여행자와 주민의 수를 비교한 자료가 없으므로 '여행자보다 주민이 많았다'는 표현은 근거로 삼지 않는다. <a href="https://vietnam.travel/node/1475">베트남 관광청의 푸옌 안내</a>는 투이호아를 푸옌의 중심 도시로 소개하고, 도시 동쪽 해안에 투이호아 해변이 이어진다고 설명한다. 이 글은 그 공개 자료를 바탕으로 도시 내 체류와 푸옌 광역 이동을 구분한다.</p><p>해변 접근이 쉽다는 설명이 곧 모든 숙소에서 바다까지 안전하게 걸을 수 있다는 뜻은 아니다. 예약하려는 숙소 주소와 보행 경로를 별도로 확인해야 한다.</p>`],
      ["도심 해변과 푸옌 광역 명소를 다른 날에 배치", `<p>베트남 관광청은 푸옌의 만, 섬, 해안 절벽 등을 함께 소개하지만 이들은 투이호아 시내 산책과 같은 이동 단위가 아니다. 투이호아에 잠시 머문다면 먼저 도시 내 해변·식사·숙소를 한 생활권으로 묶는다. 먼 자연 명소를 추가할 때는 출발지와 왕복 교통, 현지 입장·운영 조건을 새로 확인한다.</p><p>도심 해변은 일몰 전후의 이동을 계획할 수 있지만, 광역 명소는 다른 교통수단과 더 긴 시간을 요구할 수 있다. 구글 지도상의 거리만 보고 하루에 여러 장소를 넣지 말고, 실제 이용할 운전기사·투어 운영사·버스의 출발 시간을 확인해야 한다.</p>`],
      ["공항 도착일에는 숙소 연결을 먼저 확정", `<p><a href="https://vietnam.travel/vi/places-to-go/central-vietnam/phu-yen">베트남 관광청의 푸옌 기본 안내</a>는 투이호아 공항과 도심의 거리를 약 10km로 소개한다. 이 수치는 공항에서 개별 숙소까지의 실제 거리나 도착 시간대의 이동비를 뜻하지 않는다. 첫날에는 숙소 주소, 체크인 마감, 공항 승차 지점, 현지 결제 방식을 먼저 확인한다.</p><p>공항 도착이 늦다면 먼 해변이나 명소를 첫날에 넣지 않는다. 숙소 도착과 식사까지 완료할 수 있는지 확인한 뒤, 다음 날 날씨와 이동 조건을 보고 추가한다.</p>`],
      ["체류일수 결정과 자료의 한계", `<figure class="wp-block-table"><table><thead><tr><th>여행 목적</th><th>먼저 정할 것</th></tr></thead><tbody><tr><td>도심에서 쉬기</td><td>해변·식사·숙소가 연결되는 보행 범위</td></tr><tr><td>푸옌 자연 명소 방문</td><td>광역 이동 수단과 복귀 시각</td></tr><tr><td>다음 도시로 이동</td><td>공항·역·버스 터미널의 실제 출발 장소</td></tr></tbody></table></figure><p>이 글은 현장 사진이나 방문 후기가 아니다. 베트남 관광청 자료에서 확인한 지리적 구분과 여행 계획 방법을 제공한다. 노선·요금·영업시간·기상은 예약 및 출발 직전에 다시 확인한다.</p>`]
    ],
    related: [["동남아 안전 기준", "/honja-southeast-asia-safety/"], ["숙소 고르는 법", "/honja-yeohaeng-sukso-goreuneun-beop/"]]
  },
  "이탈리아-치비타-디-반뇨레조-근처-마을": {
    title: "치비타 디 반뇨레조와 반뇨레조: 다리 접근과 체류 동선 비교",
    description: "이탈리아 관광청 자료로 치비타 디 반뇨레조와 본 마을 반뇨레조를 구분하고 보행·숙박 계획을 세웁니다.",
    summary: "치비타의 다리 보행과 반뇨레조 본 마을 체류를 분리해 판단한다. 요금과 이동편은 공식 운영 정보를 다시 확인한다.",
    sections: [
      ["치비타와 반뇨레조를 같은 장소로 취급하지 않기", `<p><a href="https://www.italia.it/en/lazio/viterbo/civita-di-bagnoregio">이탈리아 관광청의 치비타 안내</a>는 치비타 디 반뇨레조가 침식에 취약한 응회암 언덕 위 마을이며, 포르타 산타 마리아를 통해 들어간다고 설명한다. <a href="https://www.italia.it/it/lazio/bagnoregio/bagnoregio">반뇨레조 본 마을 안내</a>는 치비타가 본 마을에서 보행교를 건너 접근하는 별도 구역임을 보여준다. 두 곳을 한 이름으로 검색하면 숙소 위치와 도보 거리를 잘못 판단하기 쉽다.</p><p>이 글은 직접 숙박하거나 다리를 건넌 체험담이 아니다. 공식 관광 자료의 지리 관계를 토대로 짐과 체류 계획을 세우는 방법을 정리한다.</p>`],
      ["다리 접근은 짐과 이동 능력까지 함께 계산", `<p>이탈리아 관광청은 치비타에 보행교로 접근한다고 설명한다. 다리의 존재만 보고 도착역이나 주차 지점에서 마을까지 모두 평지라고 가정하면 안 된다. 자신이 이용할 교통편의 하차 위치, 짐 보관 가능 여부, 다리 접근 경로를 각각 지도와 운영자 안내로 확인한다.</p><p>작은 가방으로 낮에 둘러보는 사람과 큰 캐리어를 끌고 숙박하려는 사람의 난이도는 다르다. 이동 제약이 있다면 다리 보행 환경과 대체 접근 가능 여부를 시설 운영자에게 직접 확인한 뒤 예약한다. 입장료나 개방 시간은 바뀔 수 있으므로 이 글에서 고정 숫자로 쓰지 않는다.</p>`],
      ["당일 방문과 본 마을 숙박을 구분하는 기준", `<figure class="wp-block-table"><table><thead><tr><th>선택</th><th>맞는 조건</th><th>추가 확인</th></tr></thead><tbody><tr><td>치비타 당일 방문</td><td>돌아갈 교통편과 짐 보관이 확실함</td><td>다리 접근·입장 조건·마지막 출발</td></tr><tr><td>반뇨레조 본 마을 숙박</td><td>일정을 나누고 짐 이동을 줄이고 싶음</td><td>숙소에서 다리 시작점까지의 실제 경로</td></tr><tr><td>치비타 안쪽 숙박</td><td>숙소 진입·짐 운반 조건을 확인함</td><td>체크인 시간, 보행교 이용 조건</td></tr></tbody></table></figure><p>표는 특정 숙소의 적합성을 보증하지 않는다. 예약한 숙소가 어느 마을에 속하는지 주소를 다시 확인해야 한다.</p>`],
      ["방문 전 확인할 공식 정보의 역할", `<p>관광청 자료는 장소의 지형과 문화적 배경을 설명하지만 방문일의 교통 연결과 입장 조건을 대신하지 않는다. 먼저 <a href="https://www.italia.it/en/lazio/viterbo/civita-di-bagnoregio">치비타 안내</a>와 <a href="https://www.italia.it/it/lazio/bagnoregio/bagnoregio">반뇨레조 안내</a>로 두 장소를 구분하고, 실제 이용할 운송사·숙소·입장 운영처의 공지를 확인한다. 이 세 조건 중 하나라도 불분명하면 당일 연결을 촘촘히 잡지 않는다.</p><p>주변 마을이 더 '현지답다'거나 사람이 적다는 평가는 조사 없이 단정하지 않는다. 이 글의 결론은 인기 비교가 아니라 접근 방식과 짐 이동의 차이다.</p>`]
    ],
    related: [["혼자 여행 숙소 고르는 법", "/honja-yeohaeng-sukso-goreuneun-beop/"], ["혼자 여행 준비 기준", "/honja-yeohaeng-junbi-gijun/"]]
  },
  "추천은-못-해도-기억에서-지워지지-않는-코다이카날": {
    title: "인도 코다이카날 혼자 여행: 산악 숙소와 귀가 동선 점검",
    description: "인도 딘디굴 지구 정부의 코다이카날 관광 자료를 바탕으로 고지대 방문과 숙소·이동 조건을 점검합니다.",
    summary: "코다이카날의 산악 지형과 숙소 위치를 분리해 판단한다. 현장 경험을 주장하지 않고 공식 자료와 확인할 조건을 명시한다.",
    sections: [
      ["개인적인 기억 대신 확인 가능한 목적지 정보", `<p>이 글에는 직접 방문 기록이 없다. 따라서 '기억에서 지워지지 않는다'는 체험형 결론을 여행 판단 근거로 사용하지 않는다. <a href="https://dindigul.nic.in/tourist-places/">인도 타밀나두주 딘디굴 지구 정부의 관광 안내</a>는 코다이카날을 남인도의 인기 있는 산악 휴양지로 소개한다. 고지대라는 지리적 특성은 숙소 위치와 도착 교통을 따로 살펴봐야 하는 이유가 된다.</p><p>인기 여행지라는 사실이 초보 혼자 여행자에게 무조건 쉬운 곳이라는 뜻은 아니다. 출발 도시에서 산악 지역으로 올라오는 교통, 숙소의 체크인 시간, 숙소 주변 보행 조건을 각각 확인한다.</p>`],
      ["산 아래 도착과 산 위 숙소 도착을 나눠 계산", `<p>장거리 이동의 종료 지점이 실제 숙소와 다를 수 있다. 기차역·버스 정류장·공항 중 어디에 도착하는지 먼저 정하고, 거기서 코다이카날 숙소까지의 마지막 구간을 별도로 조회한다. 야간 도착이나 환승이 복잡한 일정이라면 산 위 관광을 같은 날에 넣지 않는다.</p><p>지도 앱의 예상 시간은 출발일 교통편, 짐 이동, 기상 변화와 숙소 위치를 모두 반영하지 못할 수 있다. 예약 전에는 교통 운영사의 현재 안내와 숙소가 제공하는 접근 설명을 비교하고, 연결이 불확실하면 중간 숙박 또는 더 이른 출발을 검토한다.</p>`],
      ["숙소 위치를 비교할 때 우선할 항목", `<figure class="wp-block-table"><table><thead><tr><th>확인할 항목</th><th>왜 필요한가</th></tr></thead><tbody><tr><td>도착 지점에서 숙소 입구까지</td><td>마지막 구간의 차량·도보 이동을 빠뜨리지 않기 위해</td></tr><tr><td>식사와 물 구매 가능 지점</td><td>늦은 체크인 뒤 다시 긴 이동을 하지 않기 위해</td></tr><tr><td>숙소의 연락·취소 조건</td><td>교통 지연 시 방 배정과 비용 손실을 파악하기 위해</td></tr><tr><td>다음 날 출발지</td><td>귀가 교통을 놓치지 않도록 숙소 위치를 역산하기 위해</td></tr></tbody></table></figure><p>최저가 숙소가 위 항목에서 불리하면 실제 총비용이 더 높아질 수 있다. 이는 특정 숙소를 추천하는 기준이 아니라 비교할 질문이다.</p>`],
      ["공식 자료로 확인할 수 없는 정보", `<p><a href="https://dindigul.nic.in/tourist-information/">딘디굴 지구 정부의 관광 안내</a>에는 코다이카날 관광안내소 정보가 있다. 목적지와 현지 문의 창구를 확인하는 데 쓸 수 있지만, 현재 모든 교통편·숙박료·기상 정보를 보장하지 않는다. 방문 날짜의 기상과 운영 조건은 별도 공식 공지에서 확인해야 한다.</p><p>고지대의 체감 기온, 도로 상태, 개인 건강상 적합성은 이 글만으로 판정할 수 없다. 무리한 이동이 예상되면 방문 장소 수를 줄이고, 필요한 경우 의료·교통 전문가의 최신 안내를 우선한다.</p>`]
    ],
    related: [["혼자 여행 준비 기준", "/honja-yeohaeng-junbi-gijun/"], ["숙소 고르는 법", "/honja-yeohaeng-sukso-goreuneun-beop/"]]
  }
};

for (const [slug, article] of Object.entries(articles)) {
  const filePath = path.join(process.cwd(), slug, "index.html");
  const $ = load(await fs.readFile(filePath, "utf8"), { decodeEntities: false });
  if (!$('.ss-post').length || !$('.ss-post-body').length || !$('.ss-toc').length) {
    throw new Error(`Unexpected article template: ${slug}`);
  }

  $('title').first().text(`${article.title} - 여행정보엑스퍼트`);
  $('meta[name="description"]').attr('content', article.description);
  $('meta[property="og:title"]').attr('content', article.title);
  $('meta[property="og:description"]').attr('content', article.description);
  $('meta[name="twitter:title"]').attr('content', article.title);
  $('meta[name="twitter:description"]').attr('content', article.description);
  $('.ss-post-hero h1').first().text(article.title);
  $('.ss-post-summary p').first().text(article.summary);
  $('.ss-post-cover').first().remove();
  $('meta[property^="og:image"], meta[name="twitter:image"]').remove();

  const parts = [
    `<p>이 글은 현장 체험담이 아니라 공식 관광 자료를 읽고 이동·숙박 결정을 돕기 위해 작성한 자료 조사형 가이드다. 확인 가능한 사실과 방문일에 재확인이 필요한 조건을 구분한다.</p>`
  ];
  const toc = [];
  article.sections.forEach(([heading, content], index) => {
    const id = `ss-h-${index + 1}`;
    toc.push(`<li><a href="#${id}">${heading}</a></li>`);
    parts.push(`<h2 id="${id}" class="wp-block-heading">${heading}</h2>${content}`);
  });
  parts.push(`<section id="editorial-application" class="ss-editorial-application"><h2>예약 전 최종 확인 순서</h2><ol><li>공식 관광 자료로 방문 지점의 존재와 위치를 확인한다.</li><li>실제로 이용할 교통·시설 운영자의 최신 공지로 시간과 조건을 확인한다.</li><li>확인이 안 되는 이동은 일정에서 빼거나 숙박을 추가한다.</li></ol><p>자료 검토: 2026-10-10. 개인 방문·현장 취재를 수행했다고 주장하지 않는다. 오류나 변경 사항은 <a href="/contact/">문의하기</a>로 알려줄 수 있다.</p></section>`);
  parts.push(`<h2 id="ss-related" class="wp-block-heading">함께 확인할 기준</h2><ul>${article.related.map(([label, href]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul>`);
  toc.push('<li><a href="#editorial-application">예약 전 최종 확인 순서</a></li>');
  toc.push('<li><a href="#ss-related">함께 확인할 기준</a></li>');
  $('.ss-toc').first().replaceWith(`<nav class="ss-toc" aria-label="글 목차"><div class="ss-toc-head">목차</div><ol>${toc.join('')}</ol></nav>`);
  $('.ss-post-body').first().html(parts.join('\n'));

  const schemaNode = $('script[type="application/ld+json"]').first();
  const schema = JSON.parse(schemaNode.html() || '{}');
  const primaryImageId = (schema['@graph'] || []).find((node) => node['@type'] === 'WebPage')?.primaryImageOfPage?.['@id'];
  schema['@graph'] = (schema['@graph'] || []).filter((node) => !(node['@type'] === 'ImageObject' && node['@id'] === primaryImageId));
  for (const node of schema['@graph'] || []) {
    if (node['@type'] === 'BlogPosting') {
      node.headline = article.title;
      node.name = article.title;
      node.description = article.description;
      delete node.image;
    }
    if (node['@type'] === 'WebPage') {
      node.name = article.title;
      delete node.primaryImageOfPage;
    }
    if (node['@type'] === 'BreadcrumbList') {
      const finalItem = node.itemListElement?.at(-1)?.item;
      if (finalItem) finalItem.name = article.title;
    }
  }
  schemaNode.text(JSON.stringify(schema));
  await fs.writeFile(filePath, $.html());
  console.log(`Rewrote ${slug}`);
}
