import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { writeFileUtf8 } from "./lib/static-site-utils.mjs";

const rootDir = process.cwd();

const rewrites = [
  {
    slug: "구경이-아니라-머무름에-가까웠던-시아누크빌-외곽",
    title: "시아누크빌 혼자 여행: 해변보다 입출항과 숙소 권역을 먼저 가르는 기준",
    description:
      "시아누크빌 혼자 여행에서 공항, 항구, 해변 체류를 한 일정으로 뭉치지 않고 이동 목적과 숙소 권역을 나눠 판단하는 방법을 정리했습니다.",
    summary:
      "시아누크빌은 해변 이름을 많이 넣는 여행보다, 공항이나 항구를 쓰는 날과 해변에 머무는 날을 분리할 때 혼자 여행 일정이 안정적입니다.",
    toc: [
      ["scope", "시아누크빌을 한 덩어리 목적지로 보지 않는 이유"],
      ["arrival", "공항과 도시간 진입을 먼저 확정하는 법"],
      ["port", "항구 연결이 있는 날의 일정 원칙"],
      ["stay", "숙소 권역은 해변 이름보다 다음 이동으로 고른다"],
      ["night", "야간 도착은 일정이 아니라 안전 여유를 산다"],
      ["fit", "이 방식이 맞는 사람과 맞지 않는 사람"],
      ["sources", "출발 직전 다시 볼 공식 정보"],
    ],
    body: `
      <section><h2 id="scope">시아누크빌을 한 덩어리 목적지로 보지 않는 이유</h2>
      <p>시아누크빌을 '해변 도시'라는 한 문장으로 계획하면 도착, 숙소, 항구 이동이 서로 다른 문제라는 점을 놓치기 쉽습니다. 혼자 이동할 때는 유명한 해변을 많이 넣는 것보다 이번 체류가 도착 후 휴식인지, 다른 섬이나 지역으로 넘어가기 전 연결인지부터 구분하는 편이 낫습니다.</p>
      <p>이 글은 특정 숙소나 식당을 추천하지 않습니다. 대신 한 사람이 짐을 들고 이동하는 상황에서 일정이 끊기는 지점을 줄이는 판단 기준을 다룹니다.</p></section>
      <section><h2 id="arrival">공항과 도시간 진입을 먼저 확정하는 법</h2>
      <p>항공편이나 장거리 버스의 실제 운항 여부와 도착 시각은 매번 달라집니다. 예약 전에 '시아누크빌에 간다'는 결정과 '몇 시에 숙소 문 앞에 도착할 수 있는가'를 별도 질문으로 나누세요. 항공편으로 들어가는 날은 공항에서 숙소까지의 마지막 구간을, 육로로 들어가는 날은 하차 지점과 숙소 권역의 관계를 먼저 확인합니다.</p>
      <p>이 확인이 끝나지 않았다면 첫날에는 해변 이동이나 항구 출발을 넣지 않는 편이 좋습니다. 도착일은 풍경을 보는 날이 아니라 낯선 도시에서 방향을 잃지 않도록 기준점을 만드는 날로 두는 것이 혼자 여행에 더 맞습니다.</p></section>
      <section><h2 id="port">항구 연결이 있는 날의 일정 원칙</h2>
      <p>다른 섬으로 이동할 계획이 있다면 항구 이동일과 해변 산책일을 섞지 않는 편이 안전합니다. 숙소 체크아웃, 짐 보관, 항구까지의 이동, 승선 확인은 각각 시간이 밀릴 수 있는 단계입니다. 한 단계라도 불확실하면 그날의 해변 일정은 과감히 비워 두는 쪽이 낫습니다.</p>
      <p>예약 화면의 출발 시각만 믿기보다, 출발 당일에 운항사 또는 판매처의 안내를 다시 확인해야 합니다. 이 글에서는 특정 배편의 시간이나 요금을 적지 않습니다. 그런 정보는 계절과 운영 상황에 따라 달라질 수 있기 때문입니다.</p></section>
      <section><h2 id="stay">숙소 권역은 해변 이름보다 다음 이동으로 고른다</h2>
      <p>숙소를 고를 때 '바다가 보이는가'보다 다음 날의 첫 이동이 무엇인지가 더 중요할 수 있습니다. 항구를 이용하는 날, 이른 출발이 있는 날, 늦게 도착하는 날은 각각 필요한 숙소의 조건이 다릅니다. 지도에서 숙소와 다음 이동 지점 사이의 실제 도로 연결을 보고, 도보만으로 해결할 수 없는 구간이 있는지 확인하세요.</p>
      <p>혼자라면 첫날과 마지막 날만 이동이 단순한 권역에 두고, 중간 날에만 해변 체류를 배치하는 방식도 좋습니다. 숙소를 자주 바꾸는 것보다 짐을 맡기고 같은 권역에서 하루를 끝내는 편이 변수에 강합니다.</p></section>
      <section><h2 id="night">야간 도착은 일정이 아니라 안전 여유를 산다</h2>
      <p>야간 도착에는 '도착 뒤 무엇을 더 볼까'보다 '도착이 늦어져도 어디까지가 확정인가'가 우선입니다. 숙소의 체크인 가능 시간, 숙소와 도착 지점 사이의 이동 수단, 비상시 연락할 수 있는 채널을 예약 전에 확인하세요. 마지막 이동을 현장에서 처음 찾는 계획은 혼자 여행에서 불안과 비용을 함께 키웁니다.</p>
      <p>체크인 뒤에는 식사나 관광을 추가하기보다 물, 통신, 다음 날 이동만 확인하고 쉬는 편이 낫습니다. 이 선택은 일정을 포기하는 것이 아니라 다음 날의 판단력을 남기는 방법입니다.</p></section>
      <section><h2 id="fit">이 방식이 맞는 사람과 맞지 않는 사람</h2>
      <p>이 기준은 한 권역에서 천천히 쉬되, 이동 연결을 놓치고 싶지 않은 혼자 여행자에게 맞습니다. 반대로 리조트 안에서만 머물 계획이거나 여러 섬을 짧은 기간에 모두 돌고 싶은 경우에는 이 글의 방식이 답답하게 느껴질 수 있습니다. 그 경우에는 숙소를 중심으로 계획하기보다 이동편의 연속성을 먼저 비교하는 편이 맞습니다.</p></section>
      <section><h2 id="sources">출발 직전 다시 볼 공식 정보</h2>
      <p>공항, 국경, 교통수단의 운행 정보는 본문보다 최신 안내가 우선입니다. 캄보디아 관광부의 <a href="https://tourism.gov.kh/" rel="noopener noreferrer" target="_blank">관광 정보</a>, 캄보디아 여행 정보의 <a href="https://visitcambodia.travel/plan/getting-here/" rel="noopener noreferrer" target="_blank">입국 및 이동 안내</a>, 이용하려는 항공사·버스·선박 운영사의 당일 공지를 함께 확인하세요.</p></section>`,
  },
  {
    slug: "유명-관광지에서-느끼지-못한-편안함을-준-자이살메",
    title: "인도 자이살메르 혼자 여행: 성 안 체류와 사막 이동을 분리하는 일정 기준",
    description:
      "자이살메르 혼자 여행에서 성 내부 체류, 도시 이동, 사막 방향 일정의 성격을 구분하고 출발과 복귀 기준을 세우는 방법을 정리했습니다.",
    summary:
      "자이살메르는 성 안에서 걷는 날과 사막 방향으로 이동하는 날을 한 덩어리로 잡지 않을 때, 혼자 여행의 체력과 복귀 계획이 훨씬 선명해집니다.",
    toc: [
      ["living-fort", "자이살메르의 성은 단순한 전망대가 아니다"],
      ["entry", "도시 진입과 출발 수단을 먼저 고정하는 법"],
      ["two-days", "성 안 산책일과 사막 방향 이동일을 나누는 이유"],
      ["stay", "숙소는 풍경보다 짐과 귀가 동선으로 판단한다"],
      ["heat", "사막 지역 일정에서 시간을 비워야 하는 구간"],
      ["fit", "자이살메르를 짧게 볼 사람과 길게 머물 사람"],
      ["sources", "출발 전 확인할 공식 안내"],
    ],
    body: `
      <section><h2 id="living-fort">자이살메르의 성은 단순한 전망대가 아니다</h2>
      <p>라자스탄 관광청은 자이살메르 성을 상점, 숙소, 오래된 주택이 함께 있는 '살아 있는 성'으로 소개합니다. 그래서 성을 한 번 보고 나오는 명소로만 다루면, 골목을 걷는 속도와 숙소·식사·짐 이동의 문제를 놓치기 쉽습니다.</p>
      <p>혼자 여행에서는 성 내부에 오래 머무는 선택과 성 밖에서 숙소를 두고 낮에만 들어가는 선택이 서로 다른 일정이라는 점부터 인정하는 편이 좋습니다. 어느 쪽이 더 좋다고 단정하기보다, 짐을 든 상태에서 마지막 이동을 어떻게 끝낼지가 판단 기준입니다.</p></section>
      <section><h2 id="entry">도시 진입과 출발 수단을 먼저 고정하는 법</h2>
      <p>자이살메르의 항공, 철도, 도로 연결은 일정의 출발점이지만 운항·운행 여부와 시간은 고정값이 아닙니다. 라자스탄 관광청은 항공 연결, 버스·택시 연결, 델리와의 직행 열차 가능성을 안내하지만, 실제 예약 전에는 선택한 운송사의 최신 시간표를 다시 봐야 합니다.</p>
      <p>도착일에는 성 안 산책과 사막 방향 이동을 함께 넣지 마세요. 교통이 늦어졌을 때 첫날 계획 전체가 무너지기 때문입니다. 도착일에는 숙소 체크인, 현금·통신·다음 날 출발 지점만 확인하고, 걷는 일정은 다음 날로 넘기는 편이 현실적입니다.</p></section>
      <section><h2 id="two-days">성 안 산책일과 사막 방향 이동일을 나누는 이유</h2>
      <p>성 안과 도심을 보는 날은 도보 피로와 영업 시간을 관리하는 날입니다. 반면 사막 방향 일정은 왕복 차량, 귀환 시각, 날씨 변화가 중심인 날입니다. 두 종류의 이동을 한 날짜에 겹치면 혼자 여행자는 복귀 지점을 놓치기 쉬워집니다.</p>
      <p>짧은 일정이라면 하나를 포기하는 기준이 필요합니다. 도시의 결을 보고 싶은 사람은 성 안과 가디사르 호수처럼 도보 축을 택하고, 사막 풍경이 목적이라면 도시 안의 세부 일정을 줄이는 편이 낫습니다. 둘을 모두 '짧게' 넣는 방식은 만족도보다 이동 피로를 남길 가능성이 큽니다.</p></section>
      <section><h2 id="stay">숙소는 풍경보다 짐과 귀가 동선으로 판단한다</h2>
      <p>성 내부 숙소는 분위기만으로 결정할 문제가 아닙니다. 차량이 바로 닿는지, 늦은 체크인이나 이른 출발 때 짐을 어떻게 옮길지, 식사와 물을 구할 수 있는 시간이 어떤지 확인하세요. 성 밖 숙소도 마찬가지로 다음 날의 집결지나 역·버스 이동과의 관계를 먼저 봐야 합니다.</p>
      <p>혼자 여행에서 좋은 숙소는 사진이 가장 멋진 곳이 아니라, 도착과 출발의 불확실성을 줄여주는 곳입니다. 이 기준을 세우면 숙소 선택이 훨씬 구체적이 됩니다.</p></section>
      <section><h2 id="heat">사막 지역 일정에서 시간을 비워야 하는 구간</h2>
      <p>사막 지역은 한낮의 체력 소모와 이동 거리를 별개로 보지 않아야 합니다. '갈 수 있다'와 '도착 뒤에도 판단할 힘이 남는다'는 다릅니다. 물, 휴식, 귀환 수단 확인을 일정의 빈칸으로 남기고, 첫 방문이라면 야간에 새로운 이동을 추가하지 않는 쪽이 좋습니다.</p>
      <p>이는 위험을 과장하려는 조언이 아니라, 현지 운영시간과 교통 상황이 바뀌었을 때 일정 전체가 밀리는 것을 막기 위한 여유입니다.</p></section>
      <section><h2 id="fit">자이살메르를 짧게 볼 사람과 길게 머물 사람</h2>
      <p>도시의 골목과 성 내부 생활권을 천천히 보고 싶은 사람은 최소 한 번의 온전한 도보 시간을 남겨야 합니다. 반면 라자스탄 내 다른 도시로 빠르게 이동해야 한다면, 자이살메르에서 하고 싶은 일이 성 안 산책인지 사막 방향 체험인지 하나를 명확히 고르는 편이 낫습니다.</p>
      <p>여러 명소를 체크하는 일정에는 맞지 않을 수 있습니다. 대신 한 장소에서 이동과 체류의 성격을 구분해 보고 싶은 혼자 여행자에게는 더 잘 맞는 기준입니다.</p></section>
      <section><h2 id="sources">출발 전 확인할 공식 안내</h2>
      <p><a href="https://www.tourism.rajasthan.gov.in/jaisalmer.html" rel="noopener noreferrer" target="_blank">라자스탄 관광청의 자이살메르 안내</a>에서 도시의 성격과 교통 연결 정보를 확인할 수 있습니다. 항공·열차·버스의 실제 운행 시간과 사막 방향 프로그램은 예약 전 각 운영사의 최신 공지를 다시 확인하세요.</p></section>`,
  },
];

for (const rewrite of rewrites) {
  const pagePath = path.join(rootDir, rewrite.slug, "index.html");
  const html = await fs.readFile(pagePath, "utf8");
  const $ = load(html, { decodeEntities: false });
  const modifiedAt = new Date().toISOString();

  $("title").text(`${rewrite.title} - 여행정보엑스퍼트`);
  $("h1").first().text(rewrite.title);
  $(".ss-post-summary p").first().text(rewrite.summary);
  $(".ss-post-body").first().html(rewrite.body);
  $(".ss-toc").first().html(`<div class="ss-toc-head">목차</div><ol>${rewrite.toc
    .map(([id, label]) => `<li><a href="#${id}">${label}</a></li>`)
    .join("")}</ol>`);
  $("meta[name='description']").attr("content", rewrite.description);
  $("meta[property='og:title']").attr("content", rewrite.title);
  $("meta[property='og:description']").attr("content", rewrite.description);
  $("meta[name='twitter:title']").attr("content", rewrite.title);
  $("meta[name='twitter:description']").attr("content", rewrite.description);
  $("meta[property='article:modified_time']").attr("content", modifiedAt);

  const schemaScript = $("script.rank-math-schema").first();
  if (schemaScript.length) {
    try {
      const schema = JSON.parse(schemaScript.html());
      for (const node of schema["@graph"] ?? []) {
        if (node["@type"] === "WebPage") {
          node.name = rewrite.title;
          node.dateModified = modifiedAt;
        }
        if (node["@type"] === "BlogPosting") {
          node.headline = rewrite.title;
          node.name = rewrite.title;
          node.description = rewrite.description;
          node.dateModified = modifiedAt;
        }
      }
      schemaScript.text(JSON.stringify(schema));
    } catch {
      // Leave an unexpected legacy schema untouched rather than breaking the page.
    }
  }

  await writeFileUtf8(pagePath, $.html());
}

console.log(JSON.stringify({ ok: true, rewrites: rewrites.map((rewrite) => rewrite.slug) }, null, 2));
