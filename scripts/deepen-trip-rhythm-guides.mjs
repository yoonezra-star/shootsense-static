import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { writeFileUtf8 } from "./lib/static-site-utils.mjs";

const root = process.cwd();
const additions = new Map([
  ["honja-local-sim-first-day", `<section class="ss-depth-extension"><h2>공항에서 통신이 바로 안 될 때의 순서</h2><p>설정이 되지 않으면 상품을 다시 결제하기 전에 기기 설정, 로밍 상태, 설치 안내를 차례로 확인하세요. 그 사이에는 공항 와이파이로 숙소 주소와 예약 정보를 열고, 오프라인 지도에 숙소와 첫 이동 지점을 저장합니다. 첫날의 목표는 빠른 인터넷이 아니라 숙소에 문제없이 들어가는 것입니다.</p><h2>통신 수단은 한 가지에만 기대지 않는다</h2><p>eSIM 또는 유심 외에도 숙소 와이파이, 공항 와이파이, 동행이나 가족에게 남긴 일정표가 대안이 될 수 있습니다. 분실이나 배터리 문제에 대비해 숙소 주소와 긴급 연락처는 화면 캡처와 메모 두 방식으로 남겨 두세요.</p></section>`],
  ["honja-laundry-middle-stay", `<section class="ss-depth-extension"><h2>세탁일을 정하는 실제 기준</h2><p>연박 중 비가 오거나 장거리 이동 다음 날처럼 밖에서 보내는 시간이 적은 날이 세탁에 적합합니다. 반대로 다음 날 이른 출발·숙소 이동·투어가 있다면 세탁을 미루거나 필요한 옷만 손세탁하는 편이 나을 수 있습니다. 세탁 자체보다 마르고 정리할 시간을 확보하는 일이 더 중요합니다.</p><h2>빨래가 여행을 방해하기 시작했다는 신호</h2><p>가방이 무거워지고 아침마다 필요한 옷을 찾는 시간이 길어지며, 젖은 옷을 계속 들고 다니게 된다면 세탁을 넣을 시점입니다. 이때는 관광을 하나 줄여도 이후의 이동과 숙소 정리가 쉬워져 전체 여행의 만족이 높아질 수 있습니다.</p></section>`],
  ["honja-pin-rest-day", `<section class="ss-depth-extension"><h2>휴식일이 필요한 구체적인 신호</h2><p>잠이 부족한데도 알람에만 의존하고, 식사를 건너뛰며, 다음 이동 예약을 미루기 시작했다면 체력뿐 아니라 판단력이 떨어진 상태일 수 있습니다. 이때는 계획표를 더 촘촘히 만드는 대신 다음 날의 첫 이동을 늦추거나 한 권역을 제외하는 편이 낫습니다.</p><h2>쉬는 날을 실제 회복으로 만드는 법</h2><p>숙소 주변 식사, 세탁, 짐 정리, 다음 교통편 확인 중 한두 가지만 남기세요. 휴식일을 카페와 쇼핑으로 가득 채우면 이동만 다른 형태로 반복됩니다. 낮에 충분히 쉬고 저녁에 짧은 산책을 하는 정도면 남은 일정의 선택지가 훨씬 넓어집니다.</p></section>`]
]);

for (const [slug, addition] of additions) {
  const file = path.join(root, slug, "index.html");
  const $ = load(await fs.readFile(file, "utf8"), { decodeEntities: false });
  const body = $(".ss-post-body").first();
  body.find(".ss-depth-extension").remove();
  body.append(addition);
  await writeFileUtf8(file, $.html());
}
