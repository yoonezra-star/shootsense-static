import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { writeFileUtf8 } from "./lib/static-site-utils.mjs";

const root = process.cwd();
const additions = new Map([
  ["honja-junbimul-minimum-set", `<section class="ss-depth-extension"><h2>가방이 분실되거나 늦게 도착할 때 남겨야 할 최소 세트</h2><p>여권, 결제수단, 복용 약, 충전 수단, 숙소 주소와 첫날 갈아입을 옷은 위탁수하물과 분리하세요. 이 목록은 짐을 많이 챙기자는 뜻이 아니라, 가방이 바로 오지 않아도 숙소에 들어가고 다음 날까지 버틸 수 있게 만드는 기준입니다.</p><h2>물건을 줄일 때는 기능이 아니라 대체 가능성을 본다</h2><p>현지에서 쉽게 살 수 있는 물건은 줄일 수 있지만, 본인 확인·결제·통신처럼 바로 대체하기 어려운 것은 나누어 보관하는 편이 낫습니다. 출발 전날에는 가방을 다시 열어 무엇을 어디에 넣었는지 한 번 확인하세요.</p></section>`],
  ["honja-siksa-honbap-pandan", `<section class="ss-depth-extension"><h2>식당 앞에서 30초 안에 확인할 것</h2><p>혼자 들어가기 전에는 빈자리보다 주문 방식과 회전 속도를 먼저 보세요. 카운터 좌석, 키오스크, 메뉴 사진, 혼자 앉은 손님이 있는지처럼 입구에서 확인할 수 있는 단서가 있습니다. 설명이 어려운 곳이라면 메뉴를 오래 고민하기보다 부담 없이 나올 수 있는 다른 선택지를 남겨 두는 편이 좋습니다.</p><h2>저녁 식사가 늦어질 때의 기준</h2><p>늦은 시간에는 식당 평점보다 숙소까지의 귀가가 우선입니다. 식사 후 걸어갈 길이 낯설거나 막차가 가까우면 숙소 근처에서 먹거나 포장으로 바꾸는 것이 나을 수 있습니다. 혼자 먹는 식사는 용감함의 문제가 아니라, 일정 전체를 편하게 마무리하는 판단입니다.</p></section>`]
]);
for (const [slug, addition] of additions) {
  const file = path.join(root, slug, "index.html");
  const $ = load(await fs.readFile(file, "utf8"), { decodeEntities: false });
  const body = $(".ss-post-body").first();
  body.find(".ss-depth-extension").remove();
  body.append(addition);
  await writeFileUtf8(file, $.html());
}
