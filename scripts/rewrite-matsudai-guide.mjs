import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { writeFileUtf8 } from "./lib/static-site-utils.mjs";

const rootDir = process.cwd();
const slug = "여행의-목적이-보기가-아니었을-때-선택한-마쓰다이";
const title = "일본 마쓰다이 혼자 여행: 에치고쓰마리 예술 권역을 숙박으로 볼지 판단하는 기준";
const description = "일본 마쓰다이에서 에치고쓰마리 예술 권역을 둘러볼 때, 당일치기와 숙박을 구분하고 계절별 운영 정보를 확인하는 혼자 여행 기준을 정리합니다.";
const summary = "마쓰다이는 작품 수를 채우기보다 이동 가능한 범위와 운영 시즌을 먼저 정해야 하는 곳입니다. 이 글은 예술 권역 방문을 숙박 여부와 교통 여유의 문제로 바꾸어 판단하는 방법을 다룹니다.";
const toc = [["scope", "마쓰다이는 작은 동네가 아니라 넓은 예술 권역의 출발점"], ["season", "계절 운영 정보를 일정의 첫 조건으로 두는 이유"], ["arrival", "도착일에는 작품보다 환승과 숙소를 먼저 확인"], ["daytrip", "당일치기와 1박을 가르는 질문"], ["route", "보고 싶은 작품보다 돌아올 수 있는 경로를 먼저 고른다"], ["stay", "숙박은 감상이 아니라 다음 날의 선택지를 늘린다"], ["sources", "출발 전 다시 볼 공식 안내"]];
const body = `
  <section><h2 id="scope">마쓰다이는 작은 동네가 아니라 넓은 예술 권역의 출발점</h2><p>마쓰다이를 한적한 소도시로만 생각하면 일정이 단순해 보입니다. 그러나 에치고쓰마리 권역의 안내를 보면 마쓰다이 노부타이와 주변 작품, 정보 거점, 여러 지역의 전시가 서로 연결되어 있습니다. 혼자 여행자에게 중요한 것은 한 장소를 오래 볼 수 있느냐보다, 작품이 흩어진 권역에서 어느 범위까지 이동할 수 있느냐입니다.</p><p>그래서 이 글은 ‘조용해서 좋았다’는 감상보다 계획의 단위를 바꿉니다. 마쓰다이에서 무엇을 볼지보다, 어떤 작품은 이번 일정에서 제외해도 되는지와 마지막 환승 전에 어디에 있어야 하는지를 먼저 정하는 것이 여행을 안정시킵니다.</p></section>
  <section><h2 id="season">계절 운영 정보를 일정의 첫 조건으로 두는 이유</h2><p>에치고쓰마리의 전시와 투어, 시설 개방은 계절과 행사에 따라 달라질 수 있습니다. 공식 안내에는 시즌별 프로그램과 방문자 정보가 별도로 제공되므로, 블로그의 오래된 운영시간을 따라가기보다 여행 날짜에 맞는 공식 페이지를 먼저 확인해야 합니다. 특히 눈, 기상, 지역 교통의 영향이 있는 시기에는 ‘갈 수 있다’는 정보와 ‘오늘 실제로 열려 있다’는 정보가 다릅니다.</p><p>출발 전에는 방문 희망일, 원하는 시설의 개방 여부, 현지 이동 수단, 마지막 귀가 조건을 한 묶음으로 확인하세요. 이 네 가지 중 하나라도 불확실하면 작품 수를 줄이고 정보 거점에 가까운 계획으로 되돌리는 편이 낫습니다.</p></section>
  <section><h2 id="arrival">도착일에는 작품보다 환승과 숙소를 먼저 확인</h2><p>마쓰다이에 도착하는 날은 환승과 짐, 체크인 때문에 생각보다 여유가 적을 수 있습니다. 첫날에 전시 여러 곳을 넣으면 막차나 숙소 도착 시간이 불확실해질 때 전체 일정이 흔들립니다. 도착일의 목표는 숙소에 짐을 두고, 다음 날 출발 지점과 식사·물 구매가 가능한 위치를 확인하는 정도로 잡는 편이 좋습니다.</p><p>예술 권역의 작품은 계획표의 체크 항목이 아니라 이동 조건이 맞을 때 선택하는 방문지로 두세요. 이런 순서는 감상 시간을 줄이자는 뜻이 아니라, 혼자 낯선 지역에서 되돌아오는 경로를 잃지 않기 위한 우선순위입니다.</p></section>
  <section><h2 id="daytrip">당일치기와 1박을 가르는 질문</h2><p>당일치기가 맞는 경우는 보고 싶은 곳이 한 권역에 모여 있고, 도착과 귀가의 시간대가 확실할 때입니다. 반대로 작품 사이 이동, 기상, 현지 교통, 마지막 연결편 중 하나라도 변수라면 1박이 더 나은 판단일 수 있습니다. 1박은 ‘더 오래 머물기 위한 사치’가 아니라 다음 날의 선택지를 남기는 장치입니다.</p><p>혼자 여행자라면 첫 질문을 ‘몇 곳을 볼 수 있나’가 아니라 ‘한 곳을 놓쳐도 숙소와 귀가에 문제가 없는가’로 바꿔 보세요. 대답이 아니오라면 하루에 넣은 지점을 줄여야 합니다. 그 결정이 오히려 남은 작품을 더 집중해서 보게 합니다.</p></section>
  <section><h2 id="route">보고 싶은 작품보다 돌아올 수 있는 경로를 먼저 고른다</h2><p>작품 목록에서 가장 눈에 띄는 장소를 먼저 고르면 이동 경로가 뒤늦게 붙습니다. 반대로 출발 지점, 중간 이동, 마지막 도착 지점을 먼저 정하면 그 경로 위의 작품만 남길 수 있습니다. 지도상 가까워 보여도 도보, 차량, 버스의 연결 방식은 다를 수 있으므로 실제 이동 시간은 공식 안내와 현지 교통 정보로 다시 확인해야 합니다.</p><p>하루에 한 번은 계획을 멈출 수 있는 기준을 정해 두세요. 비가 오거나 환승이 늦어지면 다음 장소를 포기하고 숙소 방향으로 돌아간다는 식입니다. 이것은 실패 대응이 아니라, 혼자 여행을 끝까지 자기 리듬으로 유지하는 방법입니다.</p></section>
  <section><h2 id="stay">숙박은 감상이 아니라 다음 날의 선택지를 늘린다</h2><p>마쓰다이에서 숙박을 고려한다면 객실의 분위기보다 다음 날 첫 이동을 단순하게 만드는지 보세요. 이른 출발이 필요한 장소가 있다면 전날 늦게 도착하는 숙소는 부담이 될 수 있습니다. 체크인 시간, 식사 가능 시간, 주변 편의시설, 정보 거점과의 거리도 함께 확인해야 합니다.</p><p>반대로 당일치기로 충분한 일정이라면 숙박을 억지로 추가할 필요는 없습니다. 이 글의 기준은 숙박을 권하는 것이 아니라, 이동이 불확실한 상태에서 작품 욕심 때문에 귀가를 어렵게 만들지 않는 것입니다.</p></section>
  <section><h2 id="sources">출발 전 다시 볼 공식 안내</h2><p>에치고쓰마리의 시즌별 안내와 작품·시설 정보는 <a href="https://www.echigo-tsumari.jp/en/" target="_blank" rel="noopener noreferrer">에치고쓰마리 공식 웹사이트</a>에서 확인하세요. 방문 시기에 맞는 프로그램과 투어 자료는 <a href="https://www.echigo-tsumari.jp/assets/uploads/2026/01/0426%E3%80%8AEN%E3%80%8B2026%E6%98%A5%E5%A4%8F%E3%83%91%E3%83%B3%E3%83%95%E3%83%AC%E3%83%83%E3%83%88.pdf" target="_blank" rel="noopener noreferrer">공식 방문 안내 자료</a>를 참고할 수 있습니다. 다만 운영일과 교통 연결은 변동될 수 있으므로 출발 직전에 최신 공지를 우선하세요.</p></section>`;

const pagePath = path.join(rootDir, slug, "index.html");
const $ = load(await fs.readFile(pagePath, "utf8"), { decodeEntities: false });
const modifiedAt = new Date().toISOString();
$("title").text(`${title} - 여행정보엑스퍼트`);
$("h1").first().text(title);
$(".ss-post-summary p").first().text(summary);
$(".ss-post-body").first().html(body);
$(".ss-toc").first().html(`<div class="ss-toc-head">목차</div><ol>${toc.map(([id, label]) => `<li><a href="#${id}">${label}</a></li>`).join("")}</ol>`);
$("meta[name='description']").attr("content", description);
$("meta[property='og:title'],meta[name='twitter:title']").attr("content", title);
$("meta[property='og:description'],meta[name='twitter:description']").attr("content", description);
$("meta[property='article:modified_time']").attr("content", modifiedAt);
const script = $("script.rank-math-schema").first();
try { const schema = JSON.parse(script.html()); for (const node of schema["@graph"] ?? []) { if (node["@type"] === "WebPage") { node.name = title; node.dateModified = modifiedAt; } if (node["@type"] === "BlogPosting") { node.headline = title; node.name = title; node.description = description; node.dateModified = modifiedAt; } } script.text(JSON.stringify(schema)); } catch { /* Keep unexpected legacy schema untouched. */ }
await writeFileUtf8(pagePath, $.html());
console.log("Rewrote Matsudai destination guide.");
