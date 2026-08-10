import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { writeFileUtf8 } from "./lib/static-site-utils.mjs";

const rootDir = process.cwd();
const slug = "honja-jeju-yeohaeng-no-car";
const title = "혼자 제주도 여행: 자차 없이 움직일 때 숙소와 하루 권역을 정하는 기준";
const description = "자차 없이 제주를 혼자 여행할 때 공항, 숙소, 버스 환승, 동부·서부·서귀포 권역을 무리 없이 나누는 현실적인 판단 기준을 정리합니다.";
const summary = "제주에서 차가 없다는 것은 불편함 하나가 아니라 일정의 단위가 달라진다는 뜻입니다. 이 글은 명소 개수보다 숙소 위치와 하루 권역을 먼저 정하는 방법을 다룹니다.";
const toc = [["scope", "자차 없는 제주는 하루 권역이 일정의 뼈대가 된다"], ["arrival", "공항 도착일에는 멀리 가지 않는 이유"], ["stay", "숙소는 최저가보다 첫날과 마지막 날의 이동으로 고른다"], ["route", "동부·서부·서귀포를 같은 날에 섞지 않는다"], ["bus", "버스는 시간표보다 환승 실패를 줄이는 방식으로 쓴다"], ["weather", "날씨와 짐이 계획을 바꿀 때 남겨 둘 선택지"], ["sources", "출발 전 다시 볼 공식 안내"]];
const body = `
<section><h2 id="scope">자차 없는 제주는 하루 권역이 일정의 뼈대가 된다</h2><p>제주를 차 없이 여행할 때 가장 흔한 실수는 지도에서 가까워 보이는 장소를 같은 날에 묶는 것입니다. 섬 전체를 한 도시처럼 보면 공항, 숙소, 환승 정류장, 관광지 사이의 실제 이동 시간이 빠집니다. 혼자 여행에서는 이동이 길어질수록 식사와 귀가, 날씨 대응까지 한꺼번에 어려워집니다.</p><p>그래서 일정의 첫 단위는 명소가 아니라 권역입니다. 오늘은 제주시와 공항 주변, 내일은 동부, 그다음은 서귀포처럼 하루에 한 방향만 남기면 버스를 놓치거나 비가 와도 대안을 고르기 쉬워집니다. 적게 보는 방식이 아니라 스스로 조정할 수 있는 여행을 만드는 방식입니다.</p></section>
<section><h2 id="arrival">공항 도착일에는 멀리 가지 않는 이유</h2><p>비행기 도착 시간만 보고 첫날의 관광을 확정하면 수하물, 통신, 식사, 숙소 체크인, 버스 대기 시간이 빠지기 쉽습니다. 특히 처음 제주를 혼자 찾는다면 첫날의 목표를 숙소 도착과 다음 날 출발 지점 확인 정도로 두는 편이 안정적입니다.</p><p>늦게 도착한다면 공항에서 숙소까지의 마지막 이동 방법과 편의시설을 먼저 확인하세요. 첫날에 서귀포나 반대쪽 해안까지 무리하게 들어가면, 일정의 시작이 피로와 불안으로 바뀔 수 있습니다. 풍경은 다음 날에도 볼 수 있지만 늦은 도착의 선택지는 줄어듭니다.</p></section>
<section><h2 id="stay">숙소는 최저가보다 첫날과 마지막 날의 이동으로 고른다</h2><p>자차 없는 제주에서 숙소는 잠만 자는 장소가 아닙니다. 공항 도착일에 들어가기 쉬운지, 아침에 버스나 택시를 탈 지점이 분명한지, 늦게 돌아왔을 때 식사와 물을 해결할 수 있는지가 더 큰 기준입니다. 저렴한 숙소라도 매일 긴 환승을 강요하면 실제 여행 비용과 체력 부담이 커질 수 있습니다.</p><p>한 곳에 연박할지 권역별로 옮길지도 목적에 따라 다릅니다. 이동 자체를 줄이고 싶다면 한 권역 중심의 연박이 맞고, 동부와 서귀포를 모두 깊게 보고 싶다면 숙소 이동일을 관광일과 분리해야 합니다. 체크아웃 날에 장거리 관광을 겹치면 짐이 일정의 중심이 됩니다.</p></section>
<section><h2 id="route">동부·서부·서귀포를 같은 날에 섞지 않는다</h2><p>동부의 자연 명소, 서부의 중산간과 해안, 서귀포의 폭포와 시내는 각각 다른 방향과 이동 리듬을 가집니다. 자차가 없을 때는 ‘하루에 세 곳’보다 ‘한 방향에서 두 곳’이 더 현실적일 수 있습니다. 방문할 장소 사이의 버스 연결이 약하면, 지도상 거리보다 대기 시간이 훨씬 길어집니다.</p><p>일정을 만들 때 각 날의 마지막 장소를 먼저 정하세요. 그곳에서 숙소로 돌아오는 길이 단순하다면 중간 장소를 하나 더 넣을 수 있지만, 마지막 귀가가 불확실하다면 그날은 한 곳을 덜 보는 편이 낫습니다. 이 순서가 혼자 여행에서 일정 붕괴를 가장 많이 줄입니다.</p></section>
<section><h2 id="bus">버스는 시간표보다 환승 실패를 줄이는 방식으로 쓴다</h2><p>비짓제주는 제주 버스 체계와 관광지 순환버스 정보를 별도로 안내합니다. 노선과 운행 조건은 바뀔 수 있으므로 본문에 적힌 특정 시간보다 출발 당일의 공식 안내와 지도 앱 정보를 함께 확인해야 합니다. 중요한 것은 가장 짧은 경로를 찾는 일보다, 한 번 놓쳐도 다음 선택을 할 수 있는 경로를 고르는 일입니다.</p><p>환승이 두 번 이상 필요한 장소는 첫 방문일의 핵심 일정으로 두지 않는 편이 좋습니다. 버스에서 내려 다음 정류장까지 걷는 구간, 배차 간격, 비 오는 날 대기 장소를 미리 확인하고, 어려우면 택시를 일부 구간에만 쓰는 대안도 남겨 두세요. 모든 이동을 버스로 해결해야 한다는 규칙은 없습니다.</p></section>
<section><h2 id="weather">날씨와 짐이 계획을 바꿀 때 남겨 둘 선택지</h2><p>제주는 날씨가 바뀌면 야외 일정의 우선순위도 달라집니다. 비가 오거나 바람이 강한 날에는 원래의 긴 도보 구간을 고집하지 말고, 숙소 근처나 실내·시내 활동으로 바꿀 수 있어야 합니다. 우산 하나보다 중요한 것은 일정을 바꿔도 숙소로 돌아오는 길이 선명한가입니다.</p><p>큰 짐이 있는 날에는 환승과 오르막이 많은 코스를 비워 두세요. 체크아웃 뒤 짐 보관 가능 여부, 숙소와 버스 정류장 사이의 실제 보행, 마지막 비행기나 배 시간을 함께 확인하면 자차 없는 제주도 충분히 편안하게 움직일 수 있습니다.</p></section>
<section><h2 id="sources">출발 전 다시 볼 공식 안내</h2><p>제주 관광 정보와 실시간 확인이 필요한 콘텐츠는 <a href="https://www.visitjeju.net/" target="_blank" rel="noopener noreferrer">제주 공식 관광정보 포털 비짓제주</a>에서 확인하세요. 버스 체계와 관광지 순환버스의 기본 정보는 <a href="https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_000000000022500" target="_blank" rel="noopener noreferrer">비짓제주의 대중교통 안내</a>와 <a href="https://www.visitjeju.net/bus/JejuTouristShuttleBusMap%28Kor%29.pdf" target="_blank" rel="noopener noreferrer">관광지 순환버스 안내</a>를 참고할 수 있습니다. 노선·운행일·막차는 변동될 수 있으므로 출발 직전에 최신 공지를 우선하세요.</p></section>`;
const pagePath = path.join(rootDir, slug, "index.html");
const $ = load(await fs.readFile(pagePath, "utf8"), { decodeEntities: false });
const modifiedAt = new Date().toISOString();
$("title").text(`${title} - 여행정보엑스퍼트`);
$("h1").first().text(title);
$(".ss-post-summary p").first().text(summary);
$(".ss-post-body").first().html(body);
$(".ss-toc").first().html(`<div class="ss-toc-head">목차</div><ol>${toc.map(([id,label]) => `<li><a href="#${id}">${label}</a></li>`).join("")}</ol>`);
$("meta[name='description']").attr("content", description);
$("meta[property='og:title'],meta[name='twitter:title']").attr("content", title);
$("meta[property='og:description'],meta[name='twitter:description']").attr("content", description);
$("meta[property='article:modified_time']").attr("content", modifiedAt);
const schemaScript = $("script.rank-math-schema").first();
try { const schema = JSON.parse(schemaScript.html()); for (const node of schema["@graph"] ?? []) { if (node["@type"] === "WebPage") { node.name=title; node.dateModified=modifiedAt; } if (node["@type"] === "BlogPosting") { node.headline=title; node.name=title; node.description=description; node.dateModified=modifiedAt; } } schemaScript.text(JSON.stringify(schema)); } catch { /* Keep unexpected legacy schema untouched. */ }
await writeFileUtf8(pagePath, $.html());
console.log("Rewrote Jeju no-car guide.");
