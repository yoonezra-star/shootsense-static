import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const root = process.cwd();
const slugs = [
  "관광-코스가-없어-자유로웠던-사피-여행",
  "관광객이-적어-현지의-속도를-느낀-아르타",
  "구경-대신-산책이-전부였던-샤르자-외곽의-오후",
  "심심함이-여행의-일부가-된-반퐁에서의-며칠",
  "여행자보다-주민이-더-많았던-투이호아의-분위기",
  "이탈리아-치비타-디-반뇨레조-근처-마을",
  "추천은-못-해도-기억에서-지워지지-않는-코다이카날"
];

for (const slug of slugs) {
  const file = path.join(root, slug, "index.html");
  const $ = load(await fs.readFile(file, "utf8"), { decodeEntities: false });
  const duration = $('.ss-post-meta span').filter((_, node) => /약 \d+분 분량/.test($(node).text()));
  if (duration.length > 1) throw new Error(`Duplicate reading-time badge: ${slug}`);
  if (duration.length) duration.text('자료 조사 가이드');
  else if (!$('.ss-post-meta').text().includes('자료 조사 가이드')) throw new Error(`Missing guide badge: ${slug}`);

  if (slug.includes('투이호아')) {
    const intro = $('#ss-h-1').next('p');
    if (intro.text().includes('푸옌의 중심 도시')) {
      intro.html(`여행자와 주민의 수를 비교한 자료가 없으므로 '여행자보다 주민이 많았다'는 표현은 근거로 삼지 않는다. <a href="https://vietnam.travel/node/1475">베트남 관광청의 푸옌 안내</a>는 투이호아 해변이 시가지 동쪽 해안에 이어진다고 설명한다. 다만 여기서 푸옌은 자료의 관광 지역명·옛 행정명이다. <a href="https://daklak.gov.vn/web/english/-/announcement-of-resolutions-and-decisions-on-the-reorganization-of-administrative-units-in-dak-lak-province-new-">닥락성 정부의 행정구역 통합 발표</a>에 따르면 옛 푸옌성과 닥락성은 2025년에 새 닥락성으로 통합됐다.`);
      intro.after(`<p>따라서 푸옌(Phu Yen)으로 검색되는 관광 자료와 닥락성(Dak Lak)으로 표시되는 현재 행정 주소가 서로 모순되는 것은 아니다. 숙소·공항 이동을 예약할 때는 관광지 이름만 복사하지 말고 투이호아의 실제 주소와 승하차 지점을 확인한다. 옛 지명으로 검색한 글의 운행 시간과 요금은 현재 정보로 취급하지 않는다.</p>`);
      $('#ss-h-4').before(`<h2 id="ss-h-3b" class="wp-block-heading">시내 명소와 광역 명소를 가르는 실제 예</h2><p><a href="https://vietnam.travel/node/1475">베트남 관광청의 여행지 목록</a>에는 투이호아 해변·냐짱 탑(Nhan Tower)과 함께 바이몬, 다디아 암초, 망랑 성당이 한 페이지에 나온다. 같은 페이지에 실렸다는 이유로 같은 보행권이라고 보면 안 된다. 투이호아 시내 숙소를 기준으로 해변과 탑을 먼저 지도에 표시하고, 나머지는 각각 왕복 교통을 따로 조회한다.</p><p>왕복 이동 수단을 확인할 수 없는 명소는 숙박일수를 늘리는 근거로 쓰지 않는다. 특히 공항 도착일에는 먼 명소를 추가하지 않고, 다음 날에도 복귀 시각이 확정된 한 곳만 우선한다. 이 구분은 관광청의 장소 목록을 실제 예약 결정으로 바꾸기 위한 편집상 판단이며, 현장 이동 시간을 측정한 결과는 아니다.</p>`);
      $('.ss-toc a[href="#ss-h-4"]').closest('li').before('<li><a href="#ss-h-3b">시내 명소와 광역 명소를 가르는 실제 예</a></li>');
    } else if (!intro.text().includes('닥락성 정부의 행정구역 통합 발표')) {
      throw new Error('Tuy Hoa introduction changed unexpectedly');
    }
  }

  await fs.writeFile(file, $.html());
  console.log(`Checked ${slug}`);
}
