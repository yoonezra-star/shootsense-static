import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const root = process.cwd();
const entries = await fs.readdir(root, { withFileTypes: true });
let changed = 0;

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const file = path.join(root, entry.name, "index.html");
  let html;
  try {
    html = await fs.readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }

  const $ = load(html, { decodeEntities: false });
  if (!$('.ss-post').length || /noindex/i.test($('meta[name="robots"]').attr('content') || '')) continue;

  let removed = 0;
  for (const selector of ['#editorial-application > .ss-application-lead', '#editorial-application > .ss-method-note']) {
    const node = $(selector);
    if (node.length) {
      node.remove();
      removed++;
    }
  }

  const genericIntro = $('.ss-post-body > p').first();
  if (genericIntro.text().startsWith('이 글은 현장 체험담이 아니라 공식 관광 자료를 읽고')) {
    genericIntro.remove();
    removed++;
  }

  const genericChecklist = $('#editorial-application');
  if (genericChecklist.text().includes('공식 관광 자료로 방문 지점의 존재와 위치를 확인한다.')) {
    genericChecklist.remove();
    $('.ss-toc a[href="#editorial-application"]').closest('li').remove();
    removed++;
  }

  if (removed) {
    await fs.writeFile(file, $.html().replace(/^[ \t]+$/gm, ''));
    changed++;
    console.log(`${entry.name}: ${removed} repeated blocks removed`);
  }
}

console.log(`Updated ${changed} indexed posts.`);
