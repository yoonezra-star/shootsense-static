import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const rootDir = process.cwd();
const modifiedAt = "2026-08-24T09:00:00+09:00";

const core = {
  "honja-yeohaeng-junbi-gijun": {
    focus: "예약·이동·통신·비상 대응을 출발일 역산표로 바꾸는 방법",
    case: "출발 7일 전에는 변경 비용이 큰 예약과 입국 조건을 고정하고, 72시간 전에는 날씨와 운행 변동, 전날에는 휴대전화 오프라인 자료만 확인한다. 이렇게 층을 나누면 준비물 목록을 계속 늘리지 않고도 빠뜨린 항목을 찾을 수 있다.",
    method: ["7일 전: 여권·입국 조건·숙소 취소 조건을 원문으로 확인한다.", "72시간 전: 첫 이동편과 막차, 날씨, 통신 개통 방법을 화면 저장한다.", "전날: 비상 연락처와 숙소 주소를 오프라인에서 열어 보고 새 예약은 만들지 않는다."],
    limits: ["입국·비자 조건은 국적과 체류 목적에 따라 달라 이 글만으로 확정할 수 없다.", "건강·의약품·보험 판단은 개인 조건과 약관 원문을 우선해야 한다."],
    sources: [["외교부 해외안전여행", "https://www.0404.go.kr/"], ["대한민국 외교부", "https://www.mofa.go.kr/"]],
    related: ["honja-yeohaeng-junbimul-checklist", "honja-sukso-anjeon-checklist", "honja-yeohaeng-emergency-response"]
  },
  "honja-yeohaeng-sukso-goreuneun-beop": {
    focus: "별점보다 귀가 동선과 체크인 실패 비용으로 숙소를 비교하는 방법",
    case: "가격이 싼 숙소가 역에서 15분 더 멀고 심야 체크인이 불확실하다면, 택시비와 연락 실패 위험까지 숙박비에 더해야 한다. 반대로 낮 도착이고 짐이 가벼우면 중심가에서 한 블록 벗어난 숙소가 더 조용한 선택이 될 수 있다.",
    method: ["지도에서 역·정류장부터 숙소 입구까지 실제 보행 경로를 확인한다.", "도착 예정 시각을 기준으로 프런트 운영과 셀프 체크인 실패 시 연락 수단을 확인한다.", "숙박비에 야간 이동비, 수하물 보관비, 취소 가능성까지 더해 비교한다."],
    limits: ["후기는 시점과 객실에 따라 다르므로 최근 반복되는 문제만 판단 근거로 쓴다.", "지도상의 짧은 거리는 경사·계단·횡단 환경을 반영하지 않을 수 있다."],
    sources: [["한국소비자원", "https://www.kca.go.kr/"], ["외교부 해외안전여행", "https://www.0404.go.kr/"]],
    related: ["honja-sukso-anjeon-checklist", "honja-yeohaeng-junbi-gijun", "honja-yeohaeng-emergency-response"]
  },
  "honja-yeohaeng-sikdang-goreuneun-beop": {
    focus: "혼자 먹기 쉬운지를 회전·주문·위생·귀가 네 기준으로 판별하는 방법",
    case: "메뉴가 유명해도 주문 방식이 복잡하고 합석 대기가 길면 첫날 식사로는 부담이 크다. 첫 끼는 숙소 복귀 동선 안에서 가격과 재료를 읽을 수 있고, 주문 후 오래 기다리지 않는 곳을 택하는 편이 일정 회복에 유리하다.",
    method: ["입구에서 1인 좌석과 주문·결제 순서를 먼저 확인한다.", "알레르기나 피해야 할 재료는 번역 문장과 원문 재료명을 함께 준비한다.", "늦은 식사는 맛집 점수보다 숙소까지 밝은 길로 돌아갈 수 있는지를 먼저 본다."],
    limits: ["현지 위생 상태는 한 번의 방문이나 온라인 후기만으로 단정할 수 없다.", "알레르기와 질환 관련 식사는 전문 의료 조언과 개인 대응 계획이 우선이다."],
    sources: [["식품안전나라", "https://www.foodsafetykorea.go.kr/"], ["외교부 해외안전여행", "https://www.0404.go.kr/"]],
    related: ["honja-yeohaeng-junbi-gijun", "honja-yeohaeng-achim-routine", "honja-yeohaeng-sukso-goreuneun-beop"]
  },
  "honja-sukso-anjeon-checklist": {
    focus: "체크인 직후 10분 안에 출입·대피·연락 위험을 점검하는 방법",
    case: "객실이 마음에 들어도 비상구 방향을 모르고 현관 잠금이 불안하면 휴식 전에 해결해야 한다. 문과 창문, 비상구, 프런트 연락, 귀중품 위치를 한 번에 확인하면 밤중에 문제가 생겼을 때 판단 단계를 줄일 수 있다.",
    method: ["객실 문 잠금과 창문, 연결문 여부를 직접 작동해 본다.", "객실에서 가장 가까운 비상구까지 걸어 보고 엘리베이터 외 경로를 기억한다.", "숙소 주소와 프런트 연락처를 동행자가 아닌 신뢰할 연락처 한 곳에 남긴다."],
    limits: ["체크리스트는 숙소의 법적·기술적 안전 인증을 대신하지 않는다.", "즉각적인 위협이 있으면 숙소 내부 해결보다 현지 긴급기관과 안전한 장소 이동이 우선이다."],
    sources: [["외교부 해외안전여행", "https://www.0404.go.kr/"], ["국민재난안전포털", "https://www.safekorea.go.kr/"]],
    related: ["honja-yeohaeng-sukso-goreuneun-beop", "honja-yeohaeng-emergency-response", "honja-yeohaeng-junbi-gijun"]
  },
  "honja-yeohaeng-emergency-response": {
    focus: "분실·부상·이동 중단 상황에서 신고와 기록 순서를 정하는 방법",
    case: "휴대전화를 잃어버린 직후 모든 계정을 동시에 처리하려 하면 위치와 시간 기록을 놓치기 쉽다. 먼저 몸의 안전과 현재 위치를 확보하고, 현지 신고 번호와 결제 수단 차단, 영사 지원 필요 여부를 순서대로 판단해야 한다.",
    method: ["현재 위험에서 벗어나 시간·장소·상황을 종이나 다른 기기에 기록한다.", "현지 긴급 신고와 카드·통신 차단을 구분해 필요한 기관에 각각 연락한다.", "보험 청구나 재발급에 필요한 접수 번호와 원본 서류를 사진과 문서로 함께 보관한다."],
    limits: ["국가별 신고 번호와 영사 지원 범위는 출발 직전 공식 안내에서 다시 확인해야 한다.", "생명·신체 위험이 있는 상황에서는 문서 기록보다 현지 긴급 구조 요청이 먼저다."],
    sources: [["외교부 해외안전여행", "https://www.0404.go.kr/"], ["영사콜센터", "https://www.0404.go.kr/callcenter/main.jsp"]],
    related: ["honja-sukso-anjeon-checklist", "honja-yeohaeng-junbi-gijun", "honja-southeast-asia-safety"]
  },
  "honja-yeohaeng-gamjeong-gwanri": {
    focus: "피로·불안·외로움을 일정 실패로 오해하지 않고 회복 시간을 정하는 방법",
    case: "낯선 도시에서 의욕이 떨어졌을 때 명소를 하나 더 넣으면 이동 피로가 감정 문제처럼 커질 수 있다. 식사·수면·통신·숙소 불편을 먼저 분리하고, 해결되지 않으면 반나절을 비워 다음 결정을 미루는 편이 낫다.",
    method: ["수면, 식사, 수분, 통증, 연결 상태를 먼저 점검해 신체 원인을 분리한다.", "오늘 꼭 해야 하는 이동 한 가지와 취소해도 되는 일정을 나눈다.", "감정이 오래 지속되거나 안전 판단이 흐려지면 신뢰할 연락처와 전문 지원을 이용한다."],
    limits: ["이 글은 정신건강 진단이나 치료 지침이 아니다.", "자신이나 타인의 안전이 우려되면 여행 일정 조정보다 현지 긴급·전문 지원을 우선한다."],
    sources: [["국가정신건강정보포털", "https://www.mentalhealth.go.kr/"], ["외교부 해외안전여행", "https://www.0404.go.kr/"]],
    related: ["honja-yeohaeng-achim-routine", "honja-yeohaeng-social-activity", "honja-yeohaeng-junbi-gijun"]
  },
  "honja-yeohaeng-junbimul-checklist": {
    focus: "물건 이름이 아니라 기능 중복과 현지 대체 가능성으로 짐을 줄이는 방법",
    case: "충전기가 두 개여도 같은 어댑터가 없으면 기능 중복이 아니다. 반대로 비슷한 겉옷 세 벌은 세탁과 기온 대응 역할이 겹칠 수 있다. 분실 시 여행이 멈추는 물건부터 백업하고, 현지에서 쉽게 살 수 있는 소모품은 줄인다.",
    method: ["신분·결제·통신·건강처럼 잃으면 일정이 멈추는 기능을 먼저 적는다.", "같은 기능을 하는 물건은 하나를 빼고, 핵심 문서와 결제 수단만 분산한다.", "가방을 닫은 뒤 하루 동선을 가정해 필요한 물건이 한 번에 꺼내지는지 확인한다."],
    limits: ["의약품과 보조기기는 단순 감량 대상이 아니며 반입 규정을 따로 확인해야 한다.", "기후와 여행 방식이 다르면 같은 기간이라도 필요한 장비가 달라진다."],
    sources: [["관세청 해외여행자 정보", "https://www.customs.go.kr/"], ["외교부 해외안전여행", "https://www.0404.go.kr/"]],
    related: ["honja-yeohaeng-junbi-gijun", "honja-sukso-anjeon-checklist", "honja-yeohaeng-emergency-response"]
  },
  "honja-southeast-asia-safety": {
    focus: "더위·우기·이륜차 교통·야간 이동을 하루 동선에 반영하는 방법",
    case: "지도상 1km가 짧아 보여도 보도 단절, 강한 비, 차량 흐름이 겹치면 체감 위험이 달라진다. 낮에 확인한 길을 밤에도 그대로 걸을 수 있다고 가정하지 말고, 복귀 수단과 승하차 지점을 미리 정해야 한다.",
    method: ["숙소 주변을 낮에 걸어 보며 보도·횡단·조명·침수 흔적을 확인한다.", "차량 호출 시 번호판과 승하차 위치를 확인하고 도로 한가운데서 기다리지 않는다.", "폭우·고온 예보가 있으면 방문 장소 수를 줄이고 실내 대기 지점을 먼저 고른다."],
    limits: ["동남아를 하나의 안전 수준으로 일반화할 수 없으며 도시·계절·시간대 차이가 크다.", "시위·재난·입국 제한은 출발 직전 국가별 공식 안전 공지를 우선해야 한다."],
    sources: [["외교부 해외안전여행", "https://www.0404.go.kr/"], ["ASEAN 기상 정보", "https://asmc.asean.org/"]],
    related: ["honja-yeohaeng-emergency-response", "honja-sukso-anjeon-checklist", "여행자보다-주민이-더-많았던-투이호아의-분위기"]
  },
  "honja-yeohaeng-achim-routine": {
    focus: "아침 30분을 날씨·이동·식사·복귀 판단에 배분하는 방법",
    case: "아침마다 검색을 처음부터 하면 사소한 선택에 시간을 다 쓸 수 있다. 날씨와 첫 이동편, 물과 식사, 저녁 복귀 수단만 같은 순서로 확인하고 나머지는 현장에서 결정하면 일정이 흔들려도 기준은 유지된다.",
    method: ["날씨 경보와 첫 이동편의 운행 여부를 공식 채널에서 확인한다.", "물·간단한 식사·배터리 상태를 확인한 뒤 출발 시간을 정한다.", "해가 지기 전 돌아올지, 야간 교통을 쓸지 결정하고 숙소 주소를 다시 열어 본다."],
    limits: ["고정 루틴은 돌발 상황을 무시하는 규칙이 아니라 확인 순서를 줄이는 도구다.", "질병·극한 기상·교통 중단이 있으면 계획 유지보다 일정 축소가 우선이다."],
    sources: [["기상청 세계날씨", "https://www.weather.go.kr/"], ["외교부 해외안전여행", "https://www.0404.go.kr/"]],
    related: ["honja-yeohaeng-junbi-gijun", "honja-yeohaeng-gamjeong-gwanri", "honja-yeohaeng-sikdang-goreuneun-beop"]
  },
  "honja-yeohaeng-social-activity": {
    focus: "혼자 있는 편안함과 타인과 연결할 필요를 안전하게 구분하는 방법",
    case: "무료함을 없애려고 즉흥 모임을 잡으면 귀가 시간과 신원 확인을 놓칠 수 있다. 낮 시간의 공개 프로그램처럼 종료 시각과 장소가 분명한 활동부터 선택하고, 언제든 혼자 빠져나올 수 있는 이동 수단을 남겨 두는 편이 안전하다.",
    method: ["주최자·장소·비용·종료 시각이 공개된 활동인지 확인한다.", "첫 만남은 낮의 공공장소에서 하고 숙소 상세 위치와 여권 정보를 공유하지 않는다.", "별도 귀가 수단과 연락 시간을 정해 활동 참여와 안전 결정을 분리한다."],
    limits: ["후기와 팔로워 수만으로 주최자나 참가자의 신뢰를 보증할 수 없다.", "불편한 요구가 있으면 예의를 지키기 위해 머물 필요 없이 즉시 자리를 떠난다."],
    sources: [["외교부 해외안전여행", "https://www.0404.go.kr/"], ["한국관광공사", "https://knto.or.kr/"]],
    related: ["honja-yeohaeng-gamjeong-gwanri", "honja-yeohaeng-achim-routine", "honja-yeohaeng-emergency-response"]
  },
  "구경-대신-산책이-전부였던-샤르자-외곽의-오후": {
    focus: "샤르자 외곽 산책을 한낮 더위와 복귀 교통 기준으로 나누는 방법",
    case: "박물관과 해안 산책을 같은 오후에 넣을 때 거리는 짧아 보여도 더위와 도로 횡단이 이동 시간을 늘린다. 한낮에는 실내 거점을 두고, 해가 기울 때 짧은 산책을 배치한 뒤 차량 승차 위치를 미리 저장하는 편이 현실적이다.",
    method: ["공식 관광 안내에서 방문 장소의 운영일과 복장·촬영 안내를 확인한다.", "실내 거점과 산책 구간을 분리하고 물을 구할 지점을 지도에 표시한다.", "숙소 복귀 차량을 부를 수 있는 밝고 설명하기 쉬운 승차 지점을 정한다."],
    limits: ["종교 행사와 계절에 따라 운영 시간과 생활 리듬이 크게 달라질 수 있다.", "도보 가능 여부는 기온·건강·도로 공사 상태에 따라 현장에서 다시 판단해야 한다."],
    sources: [["Visit Sharjah", "https://www.visitsharjah.com/"], ["UAE Government Portal", "https://u.ae/"]],
    related: ["관광-코스가-없어-자유로웠던-사피-여행", "honja-yeohaeng-junbi-gijun", "honja-yeohaeng-emergency-response"]
  },
  "관광-코스가-없어-자유로웠던-사피-여행": {
    focus: "모로코 사피를 도자기·해안·구시가 이동 단위로 나누는 방법",
    case: "사피에서는 명소 수보다 서로 다른 권역을 한 번에 잇지 않는 것이 중요하다. 도자기 지구와 구시가를 걷는 날, 해안 쪽을 보는 시간을 나누고 해가 지기 전에 숙소로 돌아가는 교통을 정하면 즉흥성이 안전을 해치지 않는다.",
    method: ["공식 관광 자료로 방문 지점의 위치와 운영 여부를 먼저 확인한다.", "도보 구간은 낮에 확인하고 권역 사이 이동은 현지 교통 수단을 별도로 잡는다.", "시장 촬영과 상점 방문에서는 먼저 허락을 구하고 가격 협상과 구매 결정을 분리한다."],
    limits: ["현지 교통과 영업시간은 온라인 정보와 다를 수 있어 숙소에서 당일 재확인이 필요하다.", "한적함을 안전의 증거로 해석하지 말고 야간 단독 이동은 별도로 판단해야 한다."],
    sources: [["Morocco National Tourist Office", "https://www.visitmorocco.com/"], ["외교부 해외안전여행", "https://www.0404.go.kr/"]],
    related: ["구경-대신-산책이-전부였던-샤르자-외곽의-오후", "honja-yeohaeng-junbi-gijun", "honja-yeohaeng-emergency-response"]
  },
  "여행자보다-주민이-더-많았던-투이호아의-분위기": {
    focus: "베트남 투이호아에서 해변과 생활권 이동을 분리하는 방법",
    case: "해변과 시내가 가깝게 보여도 큰 도로와 더위 때문에 걷는 체감은 다를 수 있다. 오전 해변, 한낮 휴식, 저녁 생활권 식사처럼 시간대를 나누고 차량 호출이 쉬운 지점을 기준으로 숙소를 잡는 편이 낫다.",
    method: ["공식 관광 정보와 지도에서 해변·시장·역 사이의 실제 도로를 비교한다.", "낮에 숙소 주변 식당과 편의시설, 차량 승하차 지점을 확인한다.", "비 예보와 강한 햇빛을 고려해 도보 구간마다 실내 대기 장소를 둔다."],
    limits: ["해변 상태와 해상 활동 가능 여부는 계절·기상에 따라 달라진다.", "조용한 생활권이라는 인상은 개인 경험이며 모든 골목의 야간 안전을 뜻하지 않는다."],
    sources: [["Vietnam Tourism", "https://vietnam.travel/"], ["외교부 해외안전여행", "https://www.0404.go.kr/"]],
    related: ["심심함이-여행의-일부가-된-반퐁에서의-며칠", "honja-southeast-asia-safety", "honja-yeohaeng-sukso-goreuneun-beop"]
  },
  "심심함이-여행의-일부가-된-반퐁에서의-며칠": {
    focus: "반퐁만 권역을 이동일과 체류일로 분리하는 방법",
    case: "해안 권역은 지도상 가까워 보여도 연결 교통이 일정하지 않으면 하루 대부분이 이동으로 바뀐다. 도착일에는 숙소 주변만 확인하고, 해안 이동은 왕복 수단과 복귀 마감 시간을 확보한 날에만 넣는 편이 체류 목적에 맞다.",
    method: ["숙소에 당일 교통 수단과 왕복 가능 시간을 구체적으로 묻는다.", "통신이 약할 상황을 가정해 숙소 주소와 주요 지점을 오프라인 저장한다.", "해가 지기 전 복귀를 기본값으로 두고 이동 수단이 불명확하면 범위를 줄인다."],
    limits: ["교통편과 해상 활동은 현지 날씨와 운영자 사정에 따라 갑자기 바뀔 수 있다.", "한적한 지역의 의료·통신 접근성은 도시와 같다고 가정할 수 없다."],
    sources: [["Vietnam Tourism", "https://vietnam.travel/"], ["외교부 해외안전여행", "https://www.0404.go.kr/"]],
    related: ["여행자보다-주민이-더-많았던-투이호아의-분위기", "honja-southeast-asia-safety", "honja-yeohaeng-emergency-response"]
  },
  "추천은-못-해도-기억에서-지워지지-않는-코다이카날": {
    focus: "인도 코다이카날의 고도·날씨·귀환 교통을 먼저 고정하는 방법",
    case: "호수 주변 산책은 단순해 보여도 안개와 비, 고도 적응, 버스 이동 시간이 겹치면 도착일 피로가 커진다. 첫날은 숙소와 식사 동선을 확인하고, 외곽 전망지는 날씨와 돌아올 교통이 확보된 다음 날로 미룬다.",
    method: ["공식 관광 안내와 기상 정보를 함께 보고 고도와 계절 조건을 확인한다.", "도착 버스 정류장부터 숙소까지 짐을 들고 이동할 방법을 미리 정한다.", "외곽 이동은 출발편보다 돌아오는 시간과 통신 가능 여부를 먼저 확인한다."],
    limits: ["고도와 건강 반응은 개인차가 커서 일반 일정표로 안전을 보장할 수 없다.", "산악 도로 운행과 관광지 접근은 비·안개·공사에 따라 달라질 수 있다."],
    sources: [["Tamil Nadu Tourism", "https://www.tamilnadutourism.tn.gov.in/"], ["India Meteorological Department", "https://mausam.imd.gov.in/"]],
    related: ["honja-yeohaeng-junbi-gijun", "honja-yeohaeng-emergency-response", "honja-yeohaeng-sukso-goreuneun-beop"]
  },
  "honja-lushan-yeohaeng": {
    focus: "중국 루산에서 산악 날씨와 구링 체류, 케이블카 변수를 분리하는 방법",
    case: "루산은 정상권에 도착한 뒤에도 안개와 경사 때문에 계획한 거리만큼 걷지 못할 수 있다. 도착일에는 구링 생활권과 숙소 위치를 확인하고, 긴 산책은 시야와 하산 교통을 확인한 다음 선택하는 편이 안정적이다.",
    method: ["세계유산 공식 설명으로 보호 구역의 성격과 방문 예절을 확인한다.", "산 아래 환승부터 숙소까지 표고차와 짐 이동 방식을 따로 계산한다.", "케이블카·셔틀 중단을 가정해 도보 범위와 숙소 복귀 마감 시간을 정한다."],
    limits: ["현지 교통표와 입장 운영은 공식 중국어 안내를 출발 직전 다시 확인해야 한다.", "안개·호우·저온 상황에서는 전망 일정 자체를 포기하는 판단이 필요하다."],
    sources: [["UNESCO Mount Lushan", "https://whc.unesco.org/en/list/778/"], ["외교부 해외안전여행", "https://www.0404.go.kr/"]],
    related: ["추천은-못-해도-기억에서-지워지지-않는-코다이카날", "honja-yeohaeng-junbi-gijun", "honja-yeohaeng-emergency-response"]
  },
  "이탈리아-치비타-디-반뇨레조-근처-마을": {
    focus: "치비타 디 반뇨레조를 환승·다리 보행·주변 숙박 기준으로 판단하는 방법",
    case: "마을 사진만 보고 당일치기를 정하면 버스 환승과 마지막 도보 구간이 일정의 대부분을 차지할 수 있다. 오르비에토 등 환승 거점에서 왕복 시간을 먼저 계산하고, 짐이 있거나 늦게 도착한다면 주변 숙박을 별도 선택지로 둔다.",
    method: ["라치오 공식 관광 안내에서 접근 거점과 방문 정보를 확인한다.", "환승 대기와 다리 보행 시간을 포함해 귀환편보다 한 편 빠른 마감 시간을 잡는다.", "강풍·비·더위가 있으면 노출된 보행 구간과 계단 이동 가능성을 다시 판단한다."],
    limits: ["지역 버스 시간과 입장 방식은 계절·행사에 따라 변동될 수 있다.", "사진 촬영 목적의 짧은 방문이 모든 여행자에게 이동 비용을 정당화하는 것은 아니다."],
    sources: [["Visit Lazio", "https://www.visitlazio.com/"], ["이탈리아 관광청", "https://www.italia.it/"]],
    related: ["관광객이-적어-현지의-속도를-느낀-아르타", "honja-yeohaeng-junbi-gijun", "honja-yeohaeng-sukso-goreuneun-beop"]
  },
  "관광객이-적어-현지의-속도를-느낀-아르타": {
    focus: "그리스 아르타를 교통 거점·강변 산책·주변 유적 기준으로 나누는 방법",
    case: "아르타는 큰 관광 도시처럼 수시로 이동편을 고르기 어렵기 때문에 도착과 출발 시각이 체류 범위를 결정한다. 첫날은 버스 정류장과 숙소, 식사 동선을 확인하고 외곽 방문은 왕복 교통이 명확한 날에만 넣는다.",
    method: ["그리스 공식 관광 정보에서 지역의 핵심 지점과 계절 정보를 확인한다.", "도착 터미널부터 숙소까지 보행과 택시 선택지를 모두 기록한다.", "외곽 유적은 입장 시간보다 돌아오는 버스와 통신 가능 여부를 먼저 확인한다."],
    limits: ["지역 버스는 계절과 요일에 따라 운행 간격이 크게 달라질 수 있다.", "관광객이 적다는 사실은 야간 보행이나 외곽 이동의 안전을 보증하지 않는다."],
    sources: [["Visit Greece", "https://www.visitgreece.gr/"], ["외교부 해외안전여행", "https://www.0404.go.kr/"]],
    related: ["이탈리아-치비타-디-반뇨레조-근처-마을", "honja-yeohaeng-junbi-gijun", "honja-yeohaeng-emergency-response"]
  }
};

const coreSlugs = new Set(Object.keys(core));
const skipDirs = new Set([".git", "node_modules", "scripts", "content", "cdn-cgi", "wp-content"]);

async function collectIndexFiles(dir) {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectIndexFiles(full));
    if (entry.isFile() && entry.name === "index.html") files.push(full);
  }
  return files;
}

function escapeHtml(text) {
  return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function applicationHtml(config) {
  const decisions = config.method.map((item, index) => `<tr><th>${index + 1}단계</th><td>${escapeHtml(item)}</td></tr>`).join("");
  const limits = config.limits.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const sources = config.sources.map(([label, href]) => `<li><a href="${href}" rel="noopener noreferrer">${escapeHtml(label)}</a><span>운영·안전·변동 정보는 출발 직전 원문 재확인</span></li>`).join("");
  const related = config.related.map((slug) => `<li><a href="/${slug}/">${escapeHtml(slug.replaceAll("-", " "))}</a></li>`).join("");
  return `<section class="ss-editorial-application" id="editorial-application">
    <h2>${escapeHtml(config.focus)}</h2>
    <p class="ss-application-lead">이 절은 본문의 정보를 실제 일정 결정으로 바꾸기 위한 편집부 적용 노트다. 장소나 준비 항목을 많이 나열하는 대신, 실패 비용이 큰 선택을 먼저 확인하도록 순서를 고정했다.</p>
    <h3>상황을 이렇게 해석한다</h3><p>${escapeHtml(config.case)}</p>
    <h3>실행 순서</h3><table><tbody>${decisions}</tbody></table>
    <h3>이 기준의 한계와 예외</h3><ul>${limits}</ul>
    <h3>공식 확인 경로</h3><ul class="ss-source-list">${sources}</ul>
    <h3>함께 읽을 판단 문서</h3><ul class="ss-related-list">${related}</ul>
    <p class="ss-method-note"><strong>검토 메모:</strong> 이 적용 노트는 2026년 8월 24일에 본문과 분리해 재검토했다. 요금·시간표·입국 조건처럼 변동되는 값은 고정 수치로 단정하지 않았으며, 독자가 출발 직전 확인할 공식 경로를 함께 남겼다.</p>
  </section>`;
}

const files = await collectIndexFiles(rootDir);
let indexed = 0;
let held = 0;
const titles = new Map();
const heldSlugs = new Set();

for (const filePath of files) {
  const html = await fs.readFile(filePath, "utf8");
  const $ = load(html, { decodeEntities: false });
  if (!$('.ss-post').length) continue;
  const slug = path.relative(rootDir, path.dirname(filePath)).replaceAll('\\', '/');
  const robots = $('meta[name="robots"]').first();

  if (!coreSlugs.has(slug)) {
    heldSlugs.add(slug);
    robots.attr('content', 'noindex, nofollow, noarchive');
    $('script[src*="pagead2.googlesyndication.com"], script[src*="googlesyndication.com"], ins.adsbygoogle').remove();
    held += 1;
    await fs.writeFile(filePath, $.html().replace(/[ \t]+$/gm, ''), 'utf8');
    continue;
  }

  robots.attr('content', 'index, follow, max-snippet:-1, max-video-preview:-1, max-image-preview:large');
  $('meta[property="article:modified_time"]').attr('content', modifiedAt);
  $('.ss-post-meta span').filter((_, node) => $(node).text().includes('최종 수정')).remove();
  $('.ss-post-meta').append('<span>최종 수정 2026-08-24</span>');
  $('.ss-editorial-application').remove();
  $('.ss-post-body').append(applicationHtml(core[slug]));
  $('.ss-toc a[href="#editorial-application"]').closest('li').remove();
  $('.ss-toc > ol').append(`<li><a href="#editorial-application">${escapeHtml(core[slug].focus)}</a></li>`);
  titles.set(slug, $('.ss-post h1').first().text().trim());
  indexed += 1;
  await fs.writeFile(filePath, $.html().replace(/[ \t]+$/gm, ''), 'utf8');
}

for (const filePath of files) {
  const html = await fs.readFile(filePath, 'utf8');
  const $ = load(html, { decodeEntities: false });
  if ($('.ss-post').length) continue;
  const relativePage = path.relative(rootDir, filePath).replaceAll('\\', '/');
  if (/\/page\/\d+\/index\.html$/.test(relativePage)) {
    $('meta[name="robots"]').attr('content', 'noindex, nofollow, noarchive');
    $('script[src*="pagead2.googlesyndication.com"], script[src*="googlesyndication.com"], ins.adsbygoogle').remove();
  }
  $('.ss-archive-card').each((_, node) => {
    const card = $(node);
    const href = card.find('a.ti').attr('href') || card.find('a.cover').attr('href') || '';
    const slug = decodeURI(href).replace(/^https:\/\/shootsense\.com\//, '').replace(/^\.\.\//, '').replace(/^\.\//, '').replace(/^\//, '').replace(/\/$/, '');
    if (slug && !coreSlugs.has(slug)) card.remove();
  });
  await fs.writeFile(filePath, $.html().replace(/[ \t]+$/gm, ''), 'utf8');
}

for (const [slug, config] of Object.entries(core)) {
  const filePath = path.join(rootDir, slug, 'index.html');
  const $ = load(await fs.readFile(filePath, 'utf8'), { decodeEntities: false });
  $('.ss-related-list a').each((_, node) => {
    const relatedSlug = ($(node).attr('href') || '').replace(/^\//, '').replace(/\/$/, '');
    $(node).text(titles.get(relatedSlug) || relatedSlug.replaceAll('-', ' '));
  });
  if (!$('#ss-adsense-core-style').length) {
    $('head').append(`<style id="ss-adsense-core-style">
.ss-editorial-application{margin-top:42px;padding-top:34px;border-top:3px solid #0f766e}.ss-editorial-application h2{font-size:27px;line-height:1.4}.ss-editorial-application h3{margin-top:28px;font-size:19px}.ss-editorial-application table{width:100%;border-collapse:collapse;margin:14px 0 22px}.ss-editorial-application th,.ss-editorial-application td{padding:13px 14px;border:1px solid #dbe4e8;text-align:left;vertical-align:top}.ss-editorial-application th{width:88px;background:#f0fdfa;color:#115e59}.ss-application-lead,.ss-method-note{padding:18px 20px;background:#f8fafc;border-left:4px solid #0f766e}.ss-source-list li,.ss-related-list li{margin:8px 0}.ss-source-list span{display:block;color:#64748b;font-size:13px}.ss-method-note{margin-top:28px;font-size:14px;color:#334155}@media(max-width:640px){.ss-editorial-application h2{font-size:23px}.ss-editorial-application th{width:68px}.ss-editorial-application th,.ss-editorial-application td{padding:10px}}
    </style>`);
  }
  await fs.writeFile(filePath, $.html().replace(/[ \t]+$/gm, ''), 'utf8');
}

for (const filePath of files) {
  const html = await fs.readFile(filePath, 'utf8');
  const $ = load(html, { decodeEntities: false });
  if (/noindex/i.test($('meta[name="robots"]').attr('content') || '')) continue;

  $('a[href]').each((_, node) => {
    const anchor = $(node);
    let href = anchor.attr('href') || '';
    if (/^https?:\/\//i.test(href)) {
      if (!href.startsWith('https://shootsense.com')) return;
      href = new URL(href).pathname;
    }
    if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) return;
    href = href.split('#')[0].split('?')[0];
    try { href = decodeURI(href); } catch { /* Keep the original path. */ }
    const absolute = href.startsWith('/')
      ? path.join(rootDir, href.replace(/^\/+/, ''))
      : path.resolve(path.dirname(filePath), href);
    const targetSlug = path.relative(rootDir, absolute).replaceAll('\\', '/').replace(/\/$/, '').replace(/\/index\.html$/, '');
    if (!heldSlugs.has(targetSlug)) return;

    if (anchor.closest('.ss-archive-card').length) {
      anchor.closest('.ss-archive-card').remove();
    } else if (anchor.closest('.ss-category-start li').length) {
      anchor.closest('.ss-category-start li').remove();
    } else {
      anchor.replaceWith(`<span class="ss-withheld-link-text">${escapeHtml(anchor.text().trim())}</span>`);
    }
  });
  $('.ss-category-start').filter((_, node) => $(node).find('a').length === 0).remove();
  await fs.writeFile(filePath, $.html().replace(/[ \t]+$/gm, ''), 'utf8');
}

const sitemapEntries = [...coreSlugs].map((slug) => `  <url>\n    <loc>https://shootsense.com/${slug}/</loc>\n    <lastmod>${modifiedAt}</lastmod>\n  </url>`).join('\n');
await fs.writeFile(path.join(rootDir, 'post-sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`, 'utf8');

console.log(JSON.stringify({ indexedCorePosts: indexed, heldFromIndex: held }, null, 2));
