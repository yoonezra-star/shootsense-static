import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { writeFileUtf8 } from "./lib/static-site-utils.mjs";

const root = process.cwd();
const slugs = [
  "honja-sukso-anjeon-checklist",
  "honja-yeohaeng-emergency-response",
  "honja-southeast-asia-safety"
];
const section = `<section class="ss-official-source"><h2>출발 전 공식 안전 정보 확인</h2><p>국가별 여행경보, 재난·치안 공지, 현지 긴급 연락처는 수시로 바뀔 수 있습니다. 출발 전과 현지 이동 전에는 <a href="https://www.0404.go.kr/" target="_blank" rel="noopener noreferrer">외교부 해외안전여행</a>에서 방문 국가와 지역의 최신 경보 및 안전공지를 다시 확인하세요.</p></section>`;

for (const slug of slugs) {
  const file = path.join(root, slug, "index.html");
  const $ = load(await fs.readFile(file, "utf8"), { decodeEntities: false });
  const body = $(".ss-post-body").first();
  body.find(".ss-official-source").remove();
  body.append(section);
  await writeFileUtf8(file, $.html());
}
