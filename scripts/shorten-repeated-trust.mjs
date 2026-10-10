import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const rootDir = process.cwd();
const researchedDestinations = new Set([
  "honja-lushan-yeohaeng",
  "관광-코스가-없어-자유로웠던-사피-여행",
  "관광객이-적어-현지의-속도를-느낀-아르타",
  "구경-대신-산책이-전부였던-샤르자-외곽의-오후",
  "심심함이-여행의-일부가-된-반퐁에서의-며칠",
  "여행자보다-주민이-더-많았던-투이호아의-분위기",
  "이탈리아-치비타-디-반뇨레조-근처-마을",
  "추천은-못-해도-기억에서-지워지지-않는-코다이카날"
]);

let count = 0;
for (const entry of await fs.readdir(rootDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const filePath = path.join(rootDir, entry.name, "index.html");
  let html;
  try { html = await fs.readFile(filePath, "utf8"); } catch { continue; }
  const $ = load(html, { sourceCodeLocationInfo: true });
  if (!$('.ss-post').length || /noindex/i.test($('meta[name="robots"]').attr('content') || '')) continue;

  const trust = $('.ss-trust-box').first().get(0);
  const author = $('.ss-author-box').first().get(0);
  const date = ($('meta[property="article:modified_time"]').attr('content') || '').slice(0, 10);
  if (!trust?.sourceCodeLocation || !author?.sourceCodeLocation || !date) throw new Error(`Missing trust metadata: ${entry.name}`);

  const method = researchedDestinations.has(entry.name)
    ? '공식 기관·관광청의 공개 자료를 비교했습니다. 직접 방문 후기는 아닙니다.'
    : '공식 안내와 예약·이동 판단 기준을 비교했습니다. 개별 조건은 출발 전에 다시 확인하세요.';
  const replacements = [
    {
      start: trust.sourceCodeLocation.startOffset,
      end: trust.sourceCodeLocation.endOffset,
      value: `<div class="ss-trust-box"><p class="ss-trust-note">최종 검토일: ${date} · 작성: <a href="/author/">여행엑스퍼트(필명)</a> · ${method} <a href="/editorial-policy/">편집 원칙</a> · <a href="/contact/">오류 제보</a></p></div>`
    },
    {
      start: author.sourceCodeLocation.startOffset,
      end: author.sourceCodeLocation.endOffset,
      value: ''
    }
  ].sort((a, b) => b.start - a.start);

  for (const { start, end, value } of replacements) html = html.slice(0, start) + value + html.slice(end);
  await fs.writeFile(filePath, html);
  count += 1;
}

console.log(`Shortened repeated trust text in ${count} indexed posts`);
