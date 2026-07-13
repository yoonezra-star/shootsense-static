import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { AUTHOR_NAME, SITE_NAME, SITE_TAGLINE, SITE_URL } from "./lib/site-config.mjs";

const rootDir = process.cwd();
const authorPath = "author/index.html";
const authorUrl = `${SITE_URL}/author/`;
const contactEmail = "contact@shootsense.com";
const skipSegments = new Set(["node_modules", ".git", "feed", "comments", "wp-json"]);

const authorCss = `
/* ss-author-signals:start */
.ss-author-box{margin:18px 0 18px;padding:18px 20px;border:1px solid #d8e4ef;border-radius:8px;background:#fff;color:#213044;box-shadow:0 8px 22px rgba(15,23,42,.035);}
.ss-author-box h2{margin:0 0 10px;font-size:20px;line-height:1.35;color:#10213a;}
.ss-author-box p{margin:0 0 10px;color:#475569;line-height:1.65;}
.ss-author-box strong{color:#10213a;}
.ss-author-meta{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 0;padding:0;list-style:none;}
.ss-author-meta li{margin:0;padding:5px 10px;border:1px solid #dbe5f0;border-radius:999px;background:#f8fbff;color:#0f5b99;font-size:12px;font-weight:800;}
.ss-author-box a,.ss-author-profile a{font-weight:900;color:#0f5b99;text-decoration:underline;text-underline-offset:3px;}
.ss-author-profile{max-width:980px;margin:0 auto;color:#1f2d3d;word-break:keep-all;overflow-wrap:break-word;}
.ss-author-profile .ss-page-hero{margin-bottom:22px;}
.ss-author-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:16px 0 24px;}
.ss-author-fact{padding:18px;border:1px solid #dbe5f0;border-radius:8px;background:#fff;}
.ss-author-fact span{display:block;margin-bottom:7px;color:#0f5b99;font-size:12px;font-weight:900;letter-spacing:.06em;}
.ss-author-fact strong{display:block;color:#10213a;font-size:17px;line-height:1.45;}
.ss-author-process{counter-reset:authorstep;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:14px 0 24px;}
.ss-author-step{position:relative;padding:18px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;}
.ss-author-step:before{counter-increment:authorstep;content:counter(authorstep, decimal-leading-zero);display:block;margin-bottom:8px;color:#0f5b99;font-weight:900;}
.ss-author-step h3{margin:0 0 8px;font-size:17px;color:#10213a;}
.ss-author-step p{margin:0;color:#475569;line-height:1.65;}
@media (max-width:720px){
  .ss-author-facts,.ss-author-process{grid-template-columns:1fr;}
}
/* ss-author-signals:end */
`;

await ensureAuthorPage();

const htmlFiles = await collectHtmlFiles(rootDir);
let cssTouched = 0;
let postTouched = 0;
let footerTouched = 0;
let metaTouched = 0;

for (const file of htmlFiles) {
  const rel = path.relative(rootDir, file).replaceAll("\\", "/");
  if (shouldSkip(rel)) {
    continue;
  }

  const html = await fs.readFile(file, "utf8");
  if (!html.includes("<html")) {
    continue;
  }

  const $ = load(html, { decodeEntities: false });
  if (ensureAuthorCss($)) {
    cssTouched += 1;
  }
  if (addPostAuthorBox($)) {
    postTouched += 1;
  }
  if (repairFooterAndNav($)) {
    footerTouched += 1;
  }
  if (rel === authorPath && applyAuthorMeta($)) {
    metaTouched += 1;
  }

  const next = normalizeHtml($.html());
  if (next !== html) {
    await fs.writeFile(file, next, "utf8");
  }
}

console.log(
  `Strengthened author signals: ${postTouched} posts, ${footerTouched} navigation/footer files, CSS touched on ${cssTouched} HTML files, meta touched ${metaTouched}.`
);

async function ensureAuthorPage() {
  const source = path.join(rootDir, "about/index.html");
  const dest = path.join(rootDir, authorPath);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(source, dest);
}

async function collectHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (skipSegments.has(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...await collectHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

function shouldSkip(rel) {
  return rel.split("/").some((part) => skipSegments.has(part));
}

function ensureAuthorCss($) {
  const existing = $("style").filter((_, el) => $(el).html()?.includes("ss-author-signals:start")).first();
  if (existing.length) {
    const current = existing.html();
    if (current.includes("ss-author-signals:end")) {
      existing.html(current.replace(/\/\* ss-author-signals:start \*\/[\s\S]*?\/\* ss-author-signals:end \*\//, authorCss.trim()));
    }
    return false;
  }

  const globalStyle = $("#ss-global-style").first();
  const trustStyle = $("style").filter((_, el) => $(el).html()?.includes("ss-trust-signals:start")).first();
  const target = globalStyle.length ? globalStyle : trustStyle;
  if (target.length) {
    target.html(`${target.html()}\n${authorCss}`);
  } else {
    $("head").append(`\n<style id="ss-author-style">${authorCss}</style>`);
  }
  return true;
}

function addPostAuthorBox($) {
  if (!$(".ss-post").length) {
    return false;
  }
  $(".ss-post .ss-author-box").remove();
  const box = buildAuthorBox();
  const trust = $(".ss-post .ss-trust-box").first();
  if (trust.length) {
    trust.after(box);
  } else {
    $(".ss-post").first().prepend(box);
  }
  return true;
}

function buildAuthorBox() {
  return `
      <div class="ss-author-box" itemscope itemtype="https://schema.org/Person">
        <h2>작성자와 검수 기준</h2>
        <p><strong itemprop="name">${AUTHOR_NAME}</strong>는 혼자 여행자가 실제로 결정해야 하는 숙소 위치, 이동 동선, 식사 난이도, 야간 도착 가능성, 현장 확인 필요 정보를 중심으로 글을 정리합니다.</p>
        <p>새 정보나 오류 제보가 들어오면 공식 안내, 지도 정보, 교통 정보, 현지 운영 정보와 비교해 본문을 다시 검토합니다. 자세한 운영 기준은 <a href="/author/">작성자/검수자 소개</a>에서 확인할 수 있습니다.</p>
        <ul class="ss-author-meta">
          <li>혼자 여행 기준</li>
          <li>출발 전 확인 중심</li>
          <li>오류 제보 반영</li>
        </ul>
      </div>`;
}

function repairFooterAndNav($) {
  let changed = false;
  const replacements = new Map([
    ["index.html%3Fp=1150.html", "/about/"],
    ["index.html?p=1150.html", "/about/"],
    ["index.html%3Fp=1148.html", "/contact/"],
    ["index.html?p=1148.html", "/contact/"],
    ["index.html%3Fp=1144.html", "/privacy-policy/"],
    ["index.html?p=1144.html", "/privacy-policy/"],
    ["index.html%3Fp=1265.html", "/terms-of-service/"],
    ["index.html?p=1265.html", "/terms-of-service/"],
    ["index.html%3Fp=1770.html", "/editorial-policy/"],
    ["index.html?p=1770.html", "/editorial-policy/"]
  ]);

  $("a[href]").each((_, node) => {
    const anchor = $(node);
    const href = anchor.attr("href") || "";
    for (const [from, to] of replacements) {
      if (href.includes(from)) {
        anchor.attr("href", to);
        changed = true;
        break;
      }
    }
  });

  $(".ss-site-footer a").each((_, node) => {
    const anchor = $(node);
    const href = anchor.attr("href") || "";
    const text = anchor.text().trim();
    if (href.includes("/cdn-cgi/l/email-protection") || text.includes("email")) {
      anchor.attr("href", `mailto:${contactEmail}`);
      anchor.text(contactEmail);
      changed = true;
    }
  });

  const footer = $(".ss-site-footer").first();
  if (footer.length) {
    const siteGuideHeading = footer.find("h4").filter((_, el) => $(el).text().trim() === "사이트 안내").first();
    const list = siteGuideHeading.next("ul");
    if (list.length && !list.find('a[href="/author/"]').length) {
      list.append(`<li><a href="/author/">작성자/검수자 소개</a></li>`);
      changed = true;
    }
  }

  return changed;
}

function applyAuthorMeta($) {
  const title = `작성자/검수자 소개 - ${SITE_NAME}`;
  const description = `${SITE_NAME}의 작성자와 검수 기준을 소개합니다. 혼자 여행자를 위한 숙소, 동선, 식사, 안전 정보 작성 원칙과 오류 제보 반영 방식을 안내합니다.`;
  $("title").text(title);
  setMeta($, "description", description);
  setProperty($, "og:title", title);
  setProperty($, "og:description", description);
  setProperty($, "og:url", authorUrl);
  setMeta($, "twitter:title", title);
  setMeta($, "twitter:description", description);
  setCanonical($, authorUrl);

  const entry = $(".entry-content").first();
  if (entry.length) {
    entry.html(buildAuthorPageBody());
  }

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${authorUrl}#webpage`,
        url: authorUrl,
        name: title,
        description,
        inLanguage: "ko-KR",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#author` }
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#author`,
        name: AUTHOR_NAME,
        worksFor: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        knowsAbout: ["혼자 여행", "숙소 위치 판단", "여행 동선", "여행 안전", "여행 준비"],
        email: `mailto:${contactEmail}`,
        url: authorUrl
      }
    ]
  };
  $("script#ss-author-schema").remove();
  $("head").append(`\n<script type="application/ld+json" id="ss-author-schema">${JSON.stringify(schema)}</script>`);
  return true;
}

function buildAuthorPageBody() {
  return `
<div class="ss-page ss-author-profile">
  <section class="ss-page-hero">
    <p class="ss-page-kicker">Author & Review</p>
    <h1>작성자/검수자 소개</h1>
    <p class="ss-page-lead">${SITE_NAME}는 혼자 여행자가 출발 전에 실제로 판단해야 하는 질문을 중심으로 콘텐츠를 만듭니다. 목적지의 인상보다 숙소 위치, 이동 동선, 식사 난이도, 야간 도착 가능성, 현장 확인이 필요한 정보를 먼저 봅니다.</p>
  </section>
  <div class="ss-author-facts">
    <div class="ss-author-fact"><span>운영 주체</span><strong>${AUTHOR_NAME}</strong></div>
    <div class="ss-author-fact"><span>전문 영역</span><strong>혼자 여행 준비와 현장 판단 기준</strong></div>
    <div class="ss-author-fact"><span>공식 문의</span><strong><a href="mailto:${contactEmail}">${contactEmail}</a></strong></div>
  </div>
  <h2>어떤 전문 정보를 다루나요?</h2>
  <p>여행정보엑스퍼트는 여행지를 홍보하듯 소개하기보다, 독자가 스스로 결정할 수 있는 기준을 정리합니다. 같은 도시라도 숙소 위치, 도착 시간, 짐의 양, 혼자 식사하기 쉬운 환경, 야간 이동 가능성에 따라 체감 난이도가 달라지기 때문입니다.</p>
  <div class="ss-author-process">
    <div class="ss-author-step"><h3>결정 질문으로 주제 분해</h3><p>“가볼 만한 곳”보다 “혼자 가도 무리 없는가”, “밤에 도착해도 되는가”, “숙소 위치를 어디까지 허용할 수 있는가”처럼 실제 판단 질문으로 글을 나눕니다.</p></div>
    <div class="ss-author-step"><h3>정보 교차 확인</h3><p>공식 안내, 지도 정보, 교통 정보, 숙소와 식당 후기, 현지 운영 정보에서 반복적으로 확인되는 내용을 비교합니다.</p></div>
    <div class="ss-author-step"><h3>예외와 한계 표시</h3><p>요금, 영업시간, 교통편처럼 바뀔 수 있는 정보는 단정하지 않고 현장 확인이 필요하다는 전제를 함께 적습니다.</p></div>
    <div class="ss-author-step"><h3>제보 기반 수정</h3><p>오류 제보나 최신 정보가 확인되면 본문, 요약, 체크리스트, 관련 내부 링크까지 함께 다시 봅니다.</p></div>
  </div>
  <h2>편집 독립성과 광고 기준</h2>
  <p>광고나 제휴 가능성이 있는 콘텐츠라도 독자의 판단을 흐리게 만드는 표현은 지양합니다. 특정 업체를 무리하게 권하기보다 선택 기준, 피해야 할 조건, 현장에서 다시 확인해야 할 정보를 함께 제시합니다.</p>
  <h2>오류 제보와 연락</h2>
  <p>글의 정보가 오래되었거나 실제와 다르다고 판단되면 <a href="/contact/">문의하기</a> 또는 <a href="mailto:${contactEmail}">${contactEmail}</a>로 알려주세요. 글 주소, 수정이 필요한 문장, 확인 가능한 근거를 함께 보내주시면 더 빠르게 검토할 수 있습니다.</p>
  <p class="ss-page-callout">이 페이지는 사이트가 어떤 기준으로 콘텐츠를 만들고 수정하는지 독자와 검색엔진이 이해할 수 있도록 공개한 운영 정보입니다.</p>
</div>`;
}

function setMeta($, name, content) {
  const node = $(`meta[name="${name}"]`).first();
  if (node.length) {
    node.attr("content", content);
  } else {
    $("head").append(`\n<meta name="${name}" content="${content}">`);
  }
}

function setProperty($, property, content) {
  const node = $(`meta[property="${property}"]`).first();
  if (node.length) {
    node.attr("content", content);
  } else {
    $("head").append(`\n<meta property="${property}" content="${content}">`);
  }
}

function setCanonical($, href) {
  const node = $('link[rel="canonical"]').first();
  if (node.length) {
    node.attr("href", href);
  } else {
    $("head").append(`\n<link rel="canonical" href="${href}">`);
  }
}

function normalizeHtml(html) {
  return html.replace(/[ \t]+$/gm, "");
}
