import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const guides = new Map([
  ["honja-yeohaeng-junbi-gijun", `
<section data-ss-evidence="2026-10" aria-label="도착일 판단 예시">
  <h3>도착일 판단을 숫자로 해보는 예시</h3>
  <p>다음은 특정 도시의 실제 시간표가 아닌 <strong>가상의 예약 비교</strong>다. 비행기 도착 예정이 21:40이고 공항에서 숙소로 가는 마지막 대중교통이 22:10이라면, 30분이라는 차이만 보고 이동이 가능하다고 결론 내릴 수 없다. 입국 심사, 수하물, 출구 이동 시간이 아직 빠져 있기 때문이다.</p>
  <figure class="wp-block-table"><table><thead><tr><th>확인할 값</th><th>결정에 쓰는 방법</th></tr></thead><tbody><tr><td>실제 도착 시각</td><td>항공편 예정 시각과 지연 가능성을 따로 기록한다.</td></tr><tr><td>교통편 탑승 마감</td><td>운영사 시간표에서 마지막 출발지와 탑승 위치를 확인한다.</td></tr><tr><td>대체 이동 비용</td><td>막차를 놓쳤을 때 쓸 공식 택시·예약 차량과 예상 총비용을 확인한다.</td></tr><tr><td>체크인 마감</td><td>숙소에 늦은 도착 가능 여부를 직접 확인하고 답변을 보관한다.</td></tr></tbody></table></figure>
  <p>막차를 놓친 경우의 이동·체크인 방법을 확인할 수 없다면, 더 이른 항공편이나 공항 접근성이 좋은 첫날 숙소가 합리적이다. 해외 여행이라면 예약 전에 <a href="https://0404.go.kr/travelAlert/apntStatus/stepTravelAlert?index=1">외교부의 목적지별 여행경보와 행동요령</a>도 확인한다. 경보 단계와 운행 시각은 바뀔 수 있으므로 출발 직전에 다시 조회해야 한다.</p>
</section>`],
  ["honja-yeohaeng-sukso-goreuneun-beop", `
<section data-ss-evidence="2026-10" aria-label="숙소 총비용 비교 예시">
  <h3>최저가 대신 결제 총액과 취소 손실을 비교하는 예시</h3>
  <p>아래 금액은 계산법을 보여 주기 위한 <strong>가상 사례</strong>다. A 숙소의 표시가가 7만 5천 원이어도 세금·수수료 1만 5천 원과 야간 이동비 1만 8천 원이 더해지면 실제 첫날 비용은 10만 8천 원이다. B 숙소는 표시가 9만 1천 원에 추가 요금이 없고 이동비가 4천 원이라면 9만 5천 원이다. 따라서 표시가만으로 A가 저렴하다고 볼 수 없다.</p>
  <figure class="wp-block-table"><table><thead><tr><th>예약 전 저장할 화면</th><th>확인 이유</th></tr></thead><tbody><tr><td>결제 직전 최종 금액</td><td>세금·서비스 요금·현지 결제 항목을 합산한다.</td></tr><tr><td>무료 취소 마감과 시간대</td><td>숙소 현지 시각 기준인지 확인하고 일정표에 기록한다.</td></tr><tr><td>환불 불가·노쇼 조건</td><td>항공편 지연과 도착 변경 때 잃을 수 있는 금액을 따로 본다.</td></tr><tr><td>확정서와 숙소 연락처</td><td>플랫폼 화면과 실제 숙소의 체크인 조건이 같은지 확인한다.</td></tr></tbody></table></figure>
  <p><a href="https://www.kca.go.kr/kca/sub.do?menukey=5293&amp;mode=view&amp;no=1003550544&amp;page=46">한국소비자원의 글로벌 숙박 플랫폼 조사</a>도 처음 보이는 가격에 세금·수수료가 빠질 수 있고, 숙박업소의 환불 불가 조건 때문에 분쟁이 생길 수 있다고 설명한다. 이 자료는 개별 예약의 환불 가능 여부를 보장하지 않는다. 반드시 구매하려는 상품의 현재 약관을 확인해야 한다.</p>
</section>`],
  ["honja-yeohaeng-emergency-response", `
<section data-ss-evidence="2026-10" aria-label="해외 비상 연락 순서">
  <h3>해외에서 연락 대상을 혼동하지 않는 순서</h3>
  <p>생명·신체에 즉각적인 위험이 있으면 목적지의 현지 긴급서비스가 우선이다. 그 번호는 나라별로 다르므로 출발 전에 공식 안내에서 찾아 오프라인에 저장한다. 영사안전콜센터는 현지 응급서비스의 대체물이 아니라, 해외 사건·사고 상담과 재외공관 연결을 위한 별도 연락처다.</p>
  <figure class="wp-block-table"><table><thead><tr><th>상황</th><th>우선 연락</th><th>함께 남길 기록</th></tr></thead><tbody><tr><td>신체 안전에 즉각 위험</td><td>현지 긴급서비스, 이후 보험사·동행인·영사안전콜센터</td><td>현재 위치와 연락 가능한 번호</td></tr><tr><td>여권 분실</td><td>현지 신고 절차 확인, 관할 재외공관</td><td>여권 사본·신고 접수 정보</td></tr><tr><td>카드 분실</td><td>발급사 분실신고, 필요 시 현지 신고</td><td>정지 시각과 접수번호</td></tr><tr><td>숙소 예약 불일치</td><td>숙소·예약 플랫폼</td><td>확정서, 결제 내역, 현장 사진</td></tr></tbody></table></figure>
  <p>외교부의 <a href="https://www.0404.go.kr/bbs/contsPst/MST0000000000105/5/detail">영사안전콜센터 안내</a>에는 국내 02-3210-0404, 해외 +82-2-3210-0404 및 연결 방법이 나와 있다. 통화 요금·연결 가능 방식은 이용 환경에 따라 다를 수 있다. 출발 전 <a href="https://www.0404.go.kr/bbs/contsPst/MST0000000000103/3/detail">해외안전여행 앱 안내</a>에서 공관 연락처와 위치 공유 기능도 확인할 수 있다.</p>
</section>`],
  ["honja-southeast-asia-safety", `
<section data-ss-evidence="2026-10" aria-label="국가별 안전 확인 자료">
  <h3>동남아 전체를 하나의 안전 등급으로 보지 않는 방법</h3>
  <p>같은 나라에서도 도착 도시, 계절, 이동 구간에 따라 판단이 달라진다. 예약 전에는 국가 이름만 검색하지 말고 <strong>방문 도시와 이동 날짜</strong>를 적은 뒤 아래 세 자료를 각각 확인한다. 한 자료로 다른 자료를 대신할 수 없다.</p>
  <figure class="wp-block-table"><table><thead><tr><th>확인 자료</th><th>무엇을 결정하는가</th><th>한계</th></tr></thead><tbody><tr><td><a href="https://0404.go.kr/travelAlert/apntStatus/stepTravelAlert?index=1">외교부 여행경보</a></td><td>목적지의 경보 단계와 출국·체류 행동요령</td><td>숙소 주변의 실시간 상황을 대신하지 않는다.</td></tr><tr><td>현지 교통 운영사 공지</td><td>공항·역에서 숙소까지 첫 이동과 막차</td><td>예약 플랫폼의 예상 시간과 다를 수 있다.</td></tr><tr><td><a href="https://asmc.asean.org/asmc-haze-hotspot-daily/">ASEAN 기상센터의 연무·핫스팟 자료</a></td><td>일부 지역의 연무 상황을 추가 점검</td><td>위성 핫스팟은 지상 공기질 수치가 아니며 구름 등으로 탐지가 제한될 수 있다.</td></tr></tbody></table></figure>
  <p>예를 들어 늦은 항공편에 야간 환승이 필요한 일정이라면 국가의 일반적인 여행 난이도보다 첫날 이동을 먼저 바꿔야 한다. 연무 자료에 변화가 보이면 현지 기상·대기질 공지까지 확인하고 야외 일정을 줄일지 판단한다. 이 문서는 특정 국가 전체가 안전하거나 위험하다고 판정하지 않는다.</p>
</section>`],
  ["honja-lushan-yeohaeng", `
<section data-ss-evidence="2026-10" aria-label="루산 자료 검증 범위">
  <h3>루산의 확정된 사실과 예약 전에 다시 확인할 정보</h3>
  <p>이 절은 방문 체험담이 아니라 공개 자료를 교차 확인한 여행 준비 안내다. <a href="https://whc.unesco.org/en/list/778">UNESCO 세계유산센터</a>는 루산 국립공원이 중국 장시성 주장시에 있고, 문화유산과 자연경관이 함께 보존된 곳이라고 설명한다. 최고봉 한양봉의 높이는 1,474m다. 이 정보는 장소의 성격을 이해하는 데 도움이 되지만, 오늘의 케이블카 운행이나 산 위 숙소 체크인 가능 여부까지 알려주지는 않는다.</p>
  <figure class="wp-block-table"><table><thead><tr><th>확정해 둘 질문</th><th>예약 전 확인할 곳</th><th>확인이 안 되면</th></tr></thead><tbody><tr><td>주장 시내에서 산 위 숙소까지 어떻게 가는가</td><td>이용할 교통 운영사와 숙소의 최신 안내</td><td>도착일 산악 코스를 넣지 않는다.</td></tr><tr><td>구링 숙박 후 다음 날 어떻게 내려오는가</td><td>체크아웃 시간과 복귀 교통의 실제 운행 공지</td><td>당일 열차·항공편과 촘촘하게 연결하지 않는다.</td></tr><tr><td>전망 구간의 기상 악화 시 대안은 무엇인가</td><td>방문일의 현지 기상·관광구역 공지</td><td>먼 구간을 빼고 숙소 가까운 동선만 남긴다.</td></tr></tbody></table></figure>
  <p>UNESCO의 등재 정보는 운행표가 아니다. 이 글은 요금·소요 시간·운행 빈도를 검증하지 못한 상태에서 특정 숫자로 단정하지 않는다. 산 아래 도착과 산 위 이동을 한 단계로 합치지 않는 것이 일정 실패를 줄이는 핵심이다.</p>
</section>`]
]);

for (const [slug, addition] of guides) {
  const filePath = path.join(process.cwd(), slug, "index.html");
  const html = await fs.readFile(filePath, "utf8");
  if (html.includes('data-ss-evidence="2026-10"')) continue;

  const $ = load(html, { sourceCodeLocationInfo: true });
  const body = $(".ss-post-body").first();
  const secondHeading = body.find("h2").eq(1).get(0);
  const offset = secondHeading?.sourceCodeLocation?.startOffset;
  if (offset === undefined) throw new Error(`Could not locate insertion point: ${slug}`);

  await fs.writeFile(filePath, html.slice(0, offset) + addition + "\n" + html.slice(offset));
  console.log(`Strengthened ${slug}`);
}
