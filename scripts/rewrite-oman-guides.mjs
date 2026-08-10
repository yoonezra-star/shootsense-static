import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { writeFileUtf8 } from "./lib/static-site-utils.mjs";

const rootDir = process.cwd();
const sourceBase = "https://experienceoman.om/en/destinations";
const rewrites = [
  {
    slug: "지도에-별표가-없는-곳에서-보낸-수르의-시간",
    title: "오만 수르 혼자 여행: 항구 마을 1박과 와디 이동을 한 일정에 섞지 않는 법",
    description: "오만 수르에서 항구 마을 체류와 와디 샤브 등 주변 이동을 분리해, 혼자 여행자의 숙소 위치와 이동 여유를 판단하는 기준을 정리합니다.",
    summary: "수르는 볼거리 개수를 늘리는 곳보다 해안 마을의 체류와 주변 자연 이동을 분리할 때 일정이 안정되는 곳입니다. 이 글은 1박의 역할을 먼저 정하는 방법을 다룹니다.",
    toc: [["scope", "수르에서 먼저 정할 것은 명소가 아니라 1박의 역할"], ["arrival", "무스카트 출발일에는 도착 자체를 일정으로 본다"], ["harbour", "항구 마을 산책과 주변 명소를 다른 축으로 분리"], ["wadi", "와디 샤브 방문일에 수르 일정을 욕심내지 않는 이유"], ["stay", "숙소는 바다 전망보다 출발 동선으로 판단"], ["night", "혼자 걷는 저녁에는 되돌아오는 경로를 먼저 확인"], ["sources", "출발 전 다시 볼 공식 안내"]],
    body: `
      <section><h2 id="scope">수르에서 먼저 정할 것은 명소가 아니라 1박의 역할</h2><p>수르는 오만 남동부 해안의 항구 도시로, 전통 도우 제작과 해안 풍경이 함께 언급되는 곳입니다. 그러나 혼자 여행 일정에서는 ‘수르를 본다’는 표현만으로는 계획이 완성되지 않습니다. 항구와 시장을 천천히 걷는 날인지, 다음 날 와디나 라스 알 하드 방향으로 나가기 전 잠을 자는 날인지에 따라 숙소 위치와 저녁 동선의 기준이 달라집니다.</p><p>이 글은 수르의 모든 명소를 나열하지 않습니다. 혼자 이동하는 사람이 하루를 무리 없이 끝낼 수 있는지에 초점을 맞춥니다. 항구 마을 체류와 주변 자연 명소 이동을 같은 날의 필수 과제로 묶지 않는 것만으로도, 도착 지연이나 피로가 생겼을 때 일정 전체를 지킬 여지가 생깁니다.</p></section>
      <section><h2 id="arrival">무스카트 출발일에는 도착 자체를 일정으로 본다</h2><p>수르로 들어가는 날에는 출발지, 차량 확보 방식, 중간 정차, 체크인 시간을 각각 따로 확인해야 합니다. 오만 공식 관광 안내는 국가 진입과 주요 공항 정보를 제공하지만, 실제 도로 이동이나 버스 운행은 날짜와 운영사 조건에 따라 달라질 수 있습니다. 그래서 출발 전에는 운행사와 숙소가 제시하는 최신 안내를 다시 확인하는 편이 안전합니다.</p><p>첫날에 항구 산책, 박물관, 저녁 식사까지 모두 확정해 두면 이동이 밀리는 순간 선택지가 사라집니다. 첫날의 최소 목표를 ‘숙소 도착, 물과 식사 확보, 다음 날 출발 지점 확인’으로 두면 수르의 체류가 훨씬 편안해집니다. 여행지를 적게 본 것이 아니라, 이후 판단을 위한 여유를 확보한 것입니다.</p></section>
      <section><h2 id="harbour">항구 마을 산책과 주변 명소를 다른 축으로 분리</h2><p>Experience Oman은 수르를 전통 선박 제작으로 알려진 해안 도시로 소개하고, 알 아야자 다리, 등대, 시장과 같은 항구 주변의 지점을 함께 안내합니다. 이 정보는 수르 안에서 걸어 볼 범위와 차량이 필요한 이동을 구분하는 출발점이 됩니다. 다만 소개 페이지의 지점 목록이 곧 하루에 모두 들러야 한다는 뜻은 아닙니다.</p><p>혼자 여행자라면 숙소에 짐을 둔 뒤 항구 주변 한 구역만 걸어 보는 방식이 좋습니다. 같은 날에 멀리 떨어진 자연 명소까지 넣으려 하면 돌아오는 시간과 교통수단을 동시에 계산해야 합니다. 수르의 매력은 촘촘한 체크리스트보다, 해안 마을의 속도로 하루를 마칠 수 있는 데 있습니다.</p></section>
      <section><h2 id="wadi">와디 샤브 방문일에 수르 일정을 욕심내지 않는 이유</h2><p>와디 샤브는 수르 윌라야에 속한 자연 명소로 공식 관광 안내에서도 별도로 소개됩니다. 이처럼 수르와 가까운 권역에 있다는 사실과, 수르 시내 산책을 같은 날 여유 있게 할 수 있다는 판단은 다릅니다. 이동, 입장 조건, 도보 구간, 더위, 되돌아오는 교통을 모두 고려해야 하기 때문입니다.</p><p>자연 명소를 주목적으로 정했다면 그날의 수르 일정은 숙소 이동과 식사 정도만 남기는 편이 낫습니다. 반대로 항구 마을의 저녁을 경험하고 싶다면 주변 이동은 다른 날로 미루는 편이 맞습니다. 이 분리는 ‘무엇을 포기할지’가 아니라, 예상보다 오래 걸리는 구간이 생겼을 때 혼자 감당할 선택지를 남겨 두는 방법입니다.</p></section>
      <section><h2 id="stay">숙소는 바다 전망보다 출발 동선으로 판단</h2><p>숙소를 고를 때는 다음 날 어디로 나갈지를 먼저 적어 보세요. 시내에서 저녁을 보내고 항구 주변을 걸을 계획이라면 귀가 동선과 식사 선택지가 중요합니다. 반대로 이른 이동이 목적이라면 차량 탑승 지점이나 주차, 짐을 싣는 과정이 더 큰 기준이 됩니다. 사진 속 분위기만으로 판단하면 이 두 목적이 섞이기 쉽습니다.</p><p>예약 전에 체크인 마감, 늦은 도착 대응, 숙소에서 실제 출발 지점까지의 이동 방식을 확인하세요. 변동 가능한 교통 시간은 본문에 적힌 수치보다 운행사 또는 숙소의 최신 답변을 우선해야 합니다. 이 확인이 되어 있으면 혼자 도착한 첫날에도 일정이 단순해집니다.</p></section>
      <section><h2 id="night">혼자 걷는 저녁에는 되돌아오는 경로를 먼저 확인</h2><p>해안가의 저녁 산책은 목적지보다 복귀 경로가 선명해야 합니다. 숙소 주소를 오프라인에서도 볼 수 있게 저장하고, 택시 호출이나 현지 이동 수단을 쓸 수 있는지, 휴대전화 연결이 가능한지 확인한 뒤 나가세요. 이는 수르가 특별히 위험하다는 뜻이 아니라 낯선 도시에서 혼자 이동할 때 필요한 기본 준비입니다.</p><p>늦은 시간에 새 동네를 더 넓게 걷는 것보다, 밝고 익숙한 구간에서 식사를 마치고 다음 날의 출발을 준비하는 편이 나을 수 있습니다. 수르에서는 느긋한 체류 자체가 일정의 목적이 될 수 있으므로, 저녁의 선택을 ‘관광을 덜 했다’고 평가할 필요가 없습니다.</p></section>
      <section><h2 id="sources">출발 전 다시 볼 공식 안내</h2><p>수르의 성격과 주변 지점은 <a href="https://booking.experienceoman.om/en/destination/sr3-1" target="_blank" rel="noopener noreferrer">Experience Oman의 수르 안내</a>와 <a href="${sourceBase}" target="_blank" rel="noopener noreferrer">오만 공식 관광 목적지 안내</a>에서 다시 확인할 수 있습니다. 국가 진입과 공항 정보는 <a href="https://experienceoman.om/about-oman/ways-to-reach" target="_blank" rel="noopener noreferrer">오만 입국·이동 안내</a>를 참고하되, 실제 운행 시간과 예약 조건은 출발 직전에 이용할 운송사와 숙소의 공지를 확인하세요.</p></section>`,
  },
  {
    slug: "볼거리가-없어서-오래-머물-수-있었던-무스카트-외곽",
    title: "오만 무스카트 혼자 여행: 도시 중심 일정과 외곽 체류를 분리하는 기준",
    description: "오만 무스카트에서 올드 무스카트, 무트라, 해변과 외곽 숙소를 한 일정에 섞기 전 혼자 여행자가 확인할 이동·체류 기준을 정리합니다.",
    summary: "무스카트는 한 도시처럼 보이지만 방문 목적에 따라 이동 범위가 크게 달라집니다. 이 글은 명소를 많이 넣기보다 도시 중심 일정과 외곽 체류를 분리해 숙소와 시간을 정하는 기준을 제시합니다.",
    toc: [["scope", "무스카트는 한 점이 아니라 긴 이동 범위라는 전제"], ["districts", "올드 무스카트·무트라·해변 권역의 목적을 섞지 않는다"], ["arrival", "공항 도착일에 외곽 숙소를 고를 때 확인할 것"], ["stay", "숙소는 조용함과 시내 접근을 동시에 약속하지 않는다"], ["daytrip", "외곽 체류일과 시내 관광일을 분리하는 방법"], ["night", "저녁 이동은 명소보다 귀가 수단이 먼저"], ["sources", "출발 전 다시 볼 공식 안내"]],
    body: `
      <section><h2 id="scope">무스카트는 한 점이 아니라 긴 이동 범위라는 전제</h2><p>무스카트를 지도 위 한 동네처럼 생각하면 숙소 선택에서 가장 먼저 흔들립니다. 공식 관광 목적지 안내에는 무트라 수크, 국립박물관, 술탄 카부스 그랜드 모스크, 오페라하우스, 쿠룸 해변처럼 서로 다른 권역의 지점이 함께 소개됩니다. 이름은 모두 무스카트지만, 같은 날 걸어서 이어 볼 수 있는 장소라는 뜻은 아닙니다.</p><p>혼자 여행에서 먼저 정해야 할 질문은 ‘어디가 더 유명한가’가 아니라 ‘내 숙소에서 하루의 첫 이동과 마지막 이동을 감당할 수 있는가’입니다. 도시 중심의 문화 일정과 외곽의 조용한 체류를 한 숙소로 해결하려 하면 택시비, 더위, 귀가 피로 중 하나가 커질 수 있습니다.</p></section>
      <section><h2 id="districts">올드 무스카트·무트라·해변 권역의 목적을 섞지 않는다</h2><p>올드 무스카트는 박물관과 항구 주변의 역사적 맥락을 보고 싶은 날에, 무트라는 수크와 코르니시의 보행 경험을 중심으로 잡기 좋습니다. 해변이나 현대적 상업 권역은 또 다른 리듬을 가집니다. 공식 소개에 많은 지점이 함께 보인다고 해서 하루에 모두 넣으면, 실제로는 이동 대기와 더위 속에서 장소 이름만 확인하게 되기 쉽습니다.</p><p>하루마다 하나의 권역과 한 가지 목적을 정해 보세요. 예를 들어 ‘박물관과 올드 무스카트’, ‘무트라의 늦은 오후’, ‘해변 근처에서 쉬는 날’처럼 나누면 숙소를 바꾸지 않아도 이동 결정을 단순하게 만들 수 있습니다. 이 방식은 계획을 느슨하게 하는 것이 아니라, 예상 밖의 대기나 컨디션 저하를 흡수하는 구조입니다.</p></section>
      <section><h2 id="arrival">공항 도착일에 외곽 숙소를 고를 때 확인할 것</h2><p>오만 공식 안내는 무스카트 국제공항을 주요 관문 중 하나로 설명합니다. 그러나 항공편 도착 시간이 곧 숙소 문 앞 도착 시간을 뜻하지는 않습니다. 수하물, 현지 통신, 환전, 차량 호출, 체크인 조건이 더해지므로 첫날에는 숙소의 정확한 위치와 늦은 체크인 대응을 우선 확인해야 합니다.</p><p>외곽 숙소가 저렴하거나 조용하다는 이유만으로 첫날에 선택하면, 도착 후 식사와 이동 수단을 다시 찾아야 할 수 있습니다. 첫날의 목표가 휴식이라면 공항에서의 마지막 구간을 단순하게 만드는 편이 좋고, 시내 활동이 목적이라면 다음 날 시작 지점에 가까운지 확인하는 편이 맞습니다. 두 기준은 같은 숙소로 항상 해결되지 않습니다.</p></section>
      <section><h2 id="stay">숙소는 조용함과 시내 접근을 동시에 약속하지 않는다</h2><p>무스카트의 외곽 체류는 일정에 휴식을 넣고 싶은 사람에게 잘 맞을 수 있습니다. 다만 조용한 숙소를 선택하는 대가가 매일의 장거리 이동이 되는지 따로 계산해야 합니다. 숙소 예약 화면의 ‘무스카트’ 표기보다 실제 주소, 주요 방문 권역까지의 이동 수단, 밤에 돌아올 수 있는 방법을 확인하는 것이 더 중요합니다.</p><p>최소한 다음 세 가지를 메모해 두세요. 첫째, 가장 자주 갈 권역. 둘째, 그곳에서 숙소로 돌아오는 마지막 이동 수단. 셋째, 숙소 근처에서 늦게 도착해도 해결 가능한 식사와 물 구매입니다. 이 세 질문에 답이 없으면 외곽의 평온함은 혼자 여행자에게 불편함으로 바뀔 수 있습니다.</p></section>
      <section><h2 id="daytrip">외곽 체류일과 시내 관광일을 분리하는 방법</h2><p>무스카트에서 외곽 체류를 즐기고 싶다면, 시내 관광일과 휴식일의 목표를 섞지 않는 편이 좋습니다. 관광일에는 한 권역에 시간을 주고, 휴식일에는 숙소 주변에서 무리 없이 끝낼 수 있는 계획만 남기세요. 이 분리는 유적지나 해변을 덜 보겠다는 뜻이 아니라, 이동 자체가 일정의 일부라는 사실을 반영하는 방법입니다.</p><p>특히 자연 체험이나 해상 활동처럼 예약·날씨·운영 조건의 영향을 받는 일정은 별도 날짜로 잡는 것이 낫습니다. 시설 운영과 허용 조건은 변할 수 있으므로, 공식 관광 페이지와 운영사의 최신 공지를 출발 전에 함께 확인해야 합니다.</p></section>
      <section><h2 id="night">저녁 이동은 명소보다 귀가 수단이 먼저</h2><p>무트라처럼 저녁에 분위기가 살아나는 곳을 방문할 때도, 돌아오는 방법을 먼저 정해야 합니다. 호출 가능한 차량 서비스, 숙소까지의 예상 이동, 통신 상태를 확인한 뒤 걷는 범위를 정하세요. 혼자 여행에서는 한 번 더 머무는 선택보다, 낯선 곳에서 귀가 수단을 급히 찾지 않는 선택이 더 큰 만족을 줄 때가 많습니다.</p><p>도시 외곽이라고 해서 모두 피해야 한다는 뜻은 아닙니다. 다만 ‘조용함을 위한 거리’와 ‘계획을 무너뜨리는 거리’를 구분해야 합니다. 하루를 마칠 때 숙소로 돌아오는 과정이 불안하지 않다면, 외곽 체류는 무스카트의 다른 리듬을 경험하는 좋은 선택이 될 수 있습니다.</p></section>
      <section><h2 id="sources">출발 전 다시 볼 공식 안내</h2><p>무스카트의 주요 권역과 문화 지점은 <a href="${sourceBase}" target="_blank" rel="noopener noreferrer">Experience Oman 목적지 안내</a>에서 확인할 수 있습니다. 대표 시설의 관람 조건은 <a href="https://experienceoman.om/en/destinations/muscat/national-museum" target="_blank" rel="noopener noreferrer">국립박물관 안내</a>와 각 시설의 공식 채널을 함께 확인하세요. 공항과 국가 입국 정보는 <a href="https://experienceoman.om/about-oman/ways-to-reach" target="_blank" rel="noopener noreferrer">오만 공식 이동 안내</a>를 참고하되, 교통과 운영 시간은 출발 직전의 최신 공지를 우선해야 합니다.</p></section>`,
  },
];

for (const rewrite of rewrites) {
  const pagePath = path.join(rootDir, rewrite.slug, "index.html");
  const $ = load(await fs.readFile(pagePath, "utf8"), { decodeEntities: false });
  const modifiedAt = new Date().toISOString();
  $("title").text(`${rewrite.title} - 여행정보엑스퍼트`);
  $("h1").first().text(rewrite.title);
  $(".ss-post-summary p").first().text(rewrite.summary);
  $(".ss-post-body").first().html(rewrite.body);
  $(".ss-toc").first().html(`<div class="ss-toc-head">목차</div><ol>${rewrite.toc.map(([id, label]) => `<li><a href="#${id}">${label}</a></li>`).join("")}</ol>`);
  $("meta[name='description']").attr("content", rewrite.description);
  for (const property of ["og:title", "twitter:title"]) $(property === "twitter:title" ? "meta[name='twitter:title']" : `meta[property='${property}']`).attr("content", rewrite.title);
  for (const property of ["og:description", "twitter:description"]) $(property === "twitter:description" ? "meta[name='twitter:description']" : `meta[property='${property}']`).attr("content", rewrite.description);
  $("meta[property='article:modified_time']").attr("content", modifiedAt);
  updateArticleSchema($, rewrite, modifiedAt);
  await writeFileUtf8(pagePath, $.html());
}

function updateArticleSchema($, rewrite, modifiedAt) {
  const script = $("script.rank-math-schema").first();
  try {
    const schema = JSON.parse(script.html());
    for (const node of schema["@graph"] ?? []) {
      if (node["@type"] === "WebPage") { node.name = rewrite.title; node.dateModified = modifiedAt; }
      if (node["@type"] === "BlogPosting") { node.headline = rewrite.title; node.name = rewrite.title; node.description = rewrite.description; node.dateModified = modifiedAt; }
    }
    script.text(JSON.stringify(schema));
  } catch { /* Keep unexpected legacy schema untouched. */ }
}

console.log(`Rewrote ${rewrites.length} Oman destination guides.`);
