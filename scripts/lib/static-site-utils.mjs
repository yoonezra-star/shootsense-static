import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import {
  AUTHOR_NAME,
  CATEGORY_MAP,
  DEFAULT_IMAGE,
  DEFAULT_LOGO,
  HOME_PAGE,
  PAGE_SITEMAP,
  POST_SITEMAP,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  TEMPLATE_POST
} from "./site-config.mjs";

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

export async function writeFileUtf8(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

export async function readHtml(filePath) {
  return fs.readFile(filePath, "utf8");
}

export function formatDate(input) {
  const date = new Date(input);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export function buildTocHtml(sections) {
  const items = ensureArray(sections)
    .map((section, index) => {
      const id = `section-${index + 1}`;
      const children = ensureArray(section.points)
        .map((point, pointIndex) => {
          const childId = `${id}-point-${pointIndex + 1}`;
          return `<li class="lv3"><a href="#${childId}">${escapeHtml(point.title)}</a></li>`;
        })
        .join("");
      return `<li><a href="#${id}">${escapeHtml(section.heading)}</a></li>${children}`;
    })
    .join("");
  return `<div class="ss-toc"><div class="ss-toc-head">목차</div><ol>${items}</ol></div>`;
}

export function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildPostBodyHtml(post) {
  const sections = ensureArray(post.sections);
  const body = sections
    .map((section, index) => {
      const sectionId = `section-${index + 1}`;
      const intro = ensureArray(section.paragraphs)
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join("");
      const points = ensureArray(section.points)
        .map((point, pointIndex) => {
          const pointId = `${sectionId}-point-${pointIndex + 1}`;
          const paragraphs = ensureArray(point.paragraphs)
            .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
            .join("");
          const bullets = ensureArray(point.bullets).length
            ? `<ul>${point.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`
            : "";
          return `<h3 id="${pointId}">${escapeHtml(point.title)}</h3>${paragraphs}${bullets}`;
        })
        .join("");
      const checklist = ensureArray(section.checklist).length
        ? `<blockquote><strong>체크 포인트</strong><ul>${section.checklist
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul></blockquote>`
        : "";
      return `<h2 id="${sectionId}">${escapeHtml(section.heading)}</h2>${intro}${points}${checklist}`;
    })
    .join("");

  const summary = `<div class="ss-post-summary"><span class="lbl">핵심 요약</span><p>${escapeHtml(
    post.summary
  )}</p></div>`;
  const reviewedAt = formatDate(post.modifiedAt || post.publishedAt || new Date());
  const trustBox = `<div class="ss-trust-box">
        <span class="ss-trust-kicker">검수 기준</span>
        <h2>이 글은 이렇게 검토했습니다</h2>
        <ul>
          <li>혼자 여행자가 실제로 판단해야 하는 숙소 위치, 이동 동선, 식사 난이도, 야간 도착 가능성을 우선 확인했습니다.</li>
          <li>교통, 영업시간, 요금처럼 바뀔 수 있는 정보는 현장 확인이 필요하다는 전제를 함께 표시했습니다.</li>
          <li>특정 업체 추천보다 독자가 스스로 비교할 수 있는 기준과 예외 상황을 먼저 정리했습니다.</li>
        </ul>
        <p class="ss-trust-note">최종 검토일: ${escapeHtml(reviewedAt)} · 작성/검수: ${escapeHtml(
          AUTHOR_NAME
        )} · 오류 제보와 수정 요청은 <a href="/contact/">문의하기</a>에서 받습니다.</p>
      </div>`;
  const authorBox = `<div class="ss-author-box" itemscope itemtype="https://schema.org/Person">
        <h2>작성자와 검수 기준</h2>
        <p><strong itemprop="name">${escapeHtml(
          AUTHOR_NAME
        )}</strong>는 혼자 여행자가 실제로 결정해야 하는 숙소 위치, 이동 동선, 식사 난이도, 야간 도착 가능성, 현장 확인 필요 정보를 중심으로 글을 정리합니다.</p>
        <p>새 정보나 오류 제보가 들어오면 공식 안내, 지도 정보, 교통 정보, 현지 운영 정보와 비교해 본문을 다시 검토합니다. 자세한 운영 기준은 <a href="/author/">작성자/검수자 소개</a>에서 확인할 수 있습니다.</p>
        <ul class="ss-author-meta">
          <li>혼자 여행 기준</li>
          <li>출발 전 확인 중심</li>
          <li>오류 제보 반영</li>
        </ul>
      </div>`;

  return `
    <div class="ss-post">
      <div class="ss-post-hero">
        <span class="ss-cat-badge">${escapeHtml(post.categoryName)}</span>
        <h1>${escapeHtml(post.title)}</h1>
        <div class="ss-post-meta">
          <span>발행일 ${escapeHtml(formatDate(post.publishedAt))}</span>
          <span>작성자 ${escapeHtml(AUTHOR_NAME)}</span>
          <span>검토 기준 ${escapeHtml(post.reviewNote || "공식 채널 재확인 권장")}</span>
        </div>
      </div>
      <div class="ss-post-cover">
        <img src="${escapeHtml(post.image || DEFAULT_IMAGE)}" alt="${escapeHtml(post.title)}">
      </div>
      ${summary}
      ${trustBox}
      ${authorBox}
      ${buildTocHtml(sections)}
      <div class="ss-post-body">
        ${body}
      </div>
    </div>
  `;
}

export function buildSchema(post) {
  const pageUrl = `${SITE_URL}/${post.slug}/`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Person", "Organization"],
        "@id": `${SITE_URL}/#person`,
        name: SITE_NAME,
        logo: {
          "@type": "ImageObject",
          "@id": `${SITE_URL}/#logo`,
          url: DEFAULT_LOGO,
          contentUrl: DEFAULT_LOGO,
          caption: SITE_NAME,
          inLanguage: "ko-KR"
        },
        image: {
          "@type": "ImageObject",
          "@id": `${SITE_URL}/#logo`,
          url: DEFAULT_LOGO,
          contentUrl: DEFAULT_LOGO,
          caption: SITE_NAME,
          inLanguage: "ko-KR"
        }
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_TAGLINE,
        publisher: { "@id": `${SITE_URL}/#person` },
        inLanguage: "ko-KR"
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, item: { "@id": SITE_URL, name: "홈" } },
          {
            "@type": "ListItem",
            position: 2,
            item: {
              "@id": `${SITE_URL}/${post.category}/`,
              name: post.categoryName
            }
          },
          { "@type": "ListItem", position: 3, item: { "@id": pageUrl, name: post.title } }
        ]
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: post.title,
        datePublished: post.publishedAt,
        dateModified: post.modifiedAt,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        primaryImageOfPage: { "@id": post.image || DEFAULT_IMAGE },
        inLanguage: "ko-KR",
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` }
      },
      {
        "@type": "BlogPosting",
        headline: post.title,
        datePublished: post.publishedAt,
        dateModified: post.modifiedAt,
        articleSection: post.categoryName,
        author: { "@type": "Person", name: AUTHOR_NAME },
        publisher: { "@id": `${SITE_URL}/#person` },
        description: post.description,
        name: post.title,
        "@id": `${pageUrl}#richSnippet`,
        isPartOf: { "@id": `${pageUrl}#webpage` },
        image: { "@id": post.image || DEFAULT_IMAGE },
        inLanguage: "ko-KR",
        mainEntityOfPage: { "@id": `${pageUrl}#webpage` }
      }
    ]
  };
}

export async function loadPosts(rootDir) {
  const posts = [];
  const existingCards = await loadExistingCards(rootDir);
  posts.push(...existingCards);
  const existingPostPages = await loadExistingPostPages(rootDir);
  posts.push(...existingPostPages);
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const metaPath = path.join(rootDir, entry.name, "meta.json");
    try {
      const meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
      posts.push(meta);
    } catch {
      continue;
    }
  }
  const deduped = new Map();
  for (const post of posts) {
    const key = post.slug || post.href || post.title;
    deduped.set(key, { ...deduped.get(key), ...post });
  }
  return [...deduped.values()].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

export async function buildPostPage(rootDir, post) {
  const templatePath = path.join(rootDir, TEMPLATE_POST);
  const html = await readHtml(templatePath);
  const $ = load(html, { decodeEntities: false });
  const pageUrl = `${SITE_URL}/${post.slug}/`;
  const title = `${post.title} - ${SITE_NAME}`;

  $("title").text(title);
  setMeta($, 'meta[name="description"]', "content", post.description);
  setMeta($, 'meta[property="og:title"]', "content", post.title);
  setMeta($, 'meta[property="og:description"]', "content", post.description);
  setMeta($, 'meta[property="og:url"]', "content", pageUrl);
  setMeta($, 'meta[property="og:type"]', "content", "article");
  setMeta($, 'meta[property="article:section"]', "content", post.categoryName);
  setMeta($, 'meta[property="article:published_time"]', "content", post.publishedAt);
  setMeta($, 'meta[property="article:modified_time"]', "content", post.modifiedAt);
  setMeta($, 'meta[name="twitter:title"]', "content", post.title);
  setMeta($, 'meta[name="twitter:description"]', "content", post.description);
  setMeta($, 'meta[name="twitter:image"]', "content", post.image || DEFAULT_IMAGE);
  setMeta($, 'meta[property="og:image"]', "content", post.image || DEFAULT_IMAGE);
  setMeta($, 'meta[property="og:image:secure_url"]', "content", post.image || DEFAULT_IMAGE);
  setMeta($, 'link[rel="canonical"]', "href", pageUrl);
  setMeta($, 'meta[name="robots"]', "content", "follow, index, max-snippet:-1, max-video-preview:-1, max-image-preview:large");

  $('script.rank-math-schema').first().text(JSON.stringify(buildSchema(post)));

  const article = $("article").first();
  article.attr("id", `post-${post.slug}`);
  article.find(".entry-content").first().html(buildPostBodyHtml(post));

  $(".ss-breadcrumb").first().html(
    `<a href="${relativePath(post.slug, "")}">홈</a><span class="sep">/</span><a href="${relativePath(
      post.slug,
      `${post.category}/`
    )}">${escapeHtml(post.categoryName)}</a><span class="sep">/</span><span class="here">${escapeHtml(
      post.title
    )}</span>`
  );

  removeWpRemnants($);
  return $.html();
}

export function buildCard(post, fromDir = "") {
  const target = post.slug ? `${post.slug}/` : post.href || "";
  const href = relativePath(fromDir, target);
  const cover = post.image
    ? `<a class="cover" href="${href}"><img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}"></a>`
    : `<a class="cover" href="${href}"></a>`;
  return `<article class="ss-archive-card">${cover}<div class="body"><span class="cat">${escapeHtml(
    post.categoryName
  )}</span><a class="ti" href="${href}">${escapeHtml(post.title)}</a><span class="dt">${escapeHtml(
    formatDate(post.publishedAt)
  )}</span></div></article>`;
}

export async function updateCategoryPage(rootDir, categoryKey, posts) {
  const category = CATEGORY_MAP[categoryKey];
  if (!category) {
    return;
  }
  const categoryPath = path.join(rootDir, category.path);
  const html = await readHtml(categoryPath);
  const $ = load(html, { decodeEntities: false });
  setMeta($, 'meta[name="robots"]', "content", "follow, index, max-snippet:-1, max-video-preview:-1, max-image-preview:large");
  setMeta($, 'link[rel="canonical"]', "href", `${SITE_URL}/${categoryKey}/`);
  setMeta($, 'meta[property="og:url"]', "content", `${SITE_URL}/${categoryKey}/`);
  setMeta($, 'meta[property="og:description"]', "content", category.description);
  setMeta($, 'meta[name="twitter:description"]', "content", category.description);
  ensureCategoryGuideCss($);
  const main = $("main.site-main").first();
  const categoryPosts = posts.filter((post) => post.category === categoryKey);
  const cards = categoryPosts
    .map((post) => buildCard(post, categoryKey))
    .join("");
  main.html(
    `<header class="ss-archive-hero"><span class="pill">카테고리</span><h1>${escapeHtml(
      category.name
    )}</h1><p>${escapeHtml(category.description)}</p></header>${buildCategoryGuide(
      categoryKey,
      category,
      categoryPosts
    )}<div class="ss-archive-grid">${cards}</div><div class="ast-row"></div>`
  );
  removeWpRemnants($);
  await writeFileUtf8(categoryPath, $.html());
}

function buildCategoryGuide(categoryKey, category, posts) {
  const guide = CATEGORY_GUIDES[categoryKey] || CATEGORY_GUIDES.default;
  const featured = posts.slice(0, 3);
  const links = featured.length
    ? `<div class="ss-category-start"><h3>먼저 읽으면 좋은 기준 글</h3><ol>${featured
        .map(
          (post) =>
            `<li><a href="${relativePath(categoryKey, `${post.slug}/`)}">${escapeHtml(post.title)}</a><span>${escapeHtml(
              formatDate(post.publishedAt)
            )}</span></li>`
        )
        .join("")}</ol></div>`
    : "";

  return `<section class="ss-category-guide" aria-label="${escapeHtml(category.name)} 카테고리 안내">
    <div class="ss-category-guide-head">
      <span>Category Review Map</span>
      <h2>${escapeHtml(guide.title)}</h2>
      <p>${escapeHtml(guide.lead)}</p>
    </div>
    <div class="ss-category-matrix">
      ${guide.cards
        .map(
          (card) =>
            `<article><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.text)}</p></article>`
        )
        .join("")}
    </div>
    <div class="ss-category-check">
      <h3>글을 읽기 전에 같이 확인할 것</h3>
      <ul>${guide.checks.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
    ${links}
  </section>`;
}

function ensureCategoryGuideCss($) {
  const style = $("#ss-global-style").first();
  if (!style.length) {
    return;
  }
  const css = style.html() || "";
  if (css.includes("ss-category-guide")) {
    return;
  }
  style.html(`${css}
.ss-category-guide{max-width:1200px;margin:-4px auto 26px;padding:0 20px;color:var(--ss-text);}
.ss-category-guide-head{padding:24px 26px;border:1px solid var(--ss-line);border-radius:14px;background:#fff;box-shadow:var(--ss-shadow);}
.ss-category-guide-head span{display:inline-block;margin:0 0 8px;color:var(--ss-blue);font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;}
.ss-category-guide-head h2{margin:0 0 8px;font-size:24px;letter-spacing:-.4px;color:var(--ss-text);}
.ss-category-guide-head p{margin:0;color:#475569;font-size:15.5px;line-height:1.75;}
.ss-category-matrix{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:14px 0;}
.ss-category-matrix article,.ss-category-check,.ss-category-start{border:1px solid var(--ss-line);border-radius:14px;background:#fff;padding:18px 20px;box-shadow:0 8px 22px rgba(15,23,42,.04);}
.ss-category-matrix h3,.ss-category-check h3,.ss-category-start h3{margin:0 0 8px;font-size:16px;color:var(--ss-text);letter-spacing:-.2px;}
.ss-category-matrix p{margin:0;color:#475569;font-size:14.5px;line-height:1.7;}
.ss-category-check{margin:0 0 14px;background:#f8fbff;border-color:#dbeafe;}
.ss-category-check ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 18px;margin:0;padding-left:20px;color:#334155;font-size:14.5px;line-height:1.65;}
.ss-category-start ol{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0;padding:0;list-style:none;}
.ss-category-start li{border-top:1px solid var(--ss-line);padding-top:10px;}
.ss-category-start li:first-child{border-top:1px solid var(--ss-line);}
.ss-category-start a{display:block;color:var(--ss-text) !important;text-decoration:none !important;font-weight:800;font-size:14.5px;line-height:1.5;}
.ss-category-start a:hover{color:var(--ss-blue) !important;}
.ss-category-start span{display:block;margin-top:5px;color:var(--ss-muted);font-size:12px;}
@media(max-width:840px){
  .ss-category-matrix,.ss-category-check ul,.ss-category-start ol{grid-template-columns:1fr;}
  .ss-category-guide-head{padding:20px;}
  .ss-category-guide-head h2{font-size:21px;}
}
`);
}

const CATEGORY_GUIDES = {
  "travel-tips": {
    title: "혼자 여행 준비 글을 읽는 기준",
    lead:
      "여행 팁 카테고리는 준비물 목록보다 판단 순서를 먼저 다룹니다. 숙소, 이동, 식사, 안전처럼 출발 전 실제로 결정해야 하는 항목을 분리해 독자가 자기 일정에 맞게 점검할 수 있도록 구성합니다.",
    cards: [
      { title: "출발 전 판단", text: "짐을 더 챙기는 방식보다 불필요한 선택지를 줄이고, 숙소와 이동 동선을 먼저 고정하는 기준을 설명합니다." },
      { title: "현장 대응", text: "분실, 야간 도착, 길 찾기처럼 계획과 다른 상황에서 무엇을 먼저 확인해야 하는지 순서로 정리합니다." },
      { title: "반복 가능한 루틴", text: "하루를 덜 흔들리게 만드는 아침 루틴, 식사 선택, 휴식 배치를 실제 일정 단위로 나눕니다." }
    ],
    checks: ["숙소 체크인 시간과 야간 출입 방식", "도착일 첫 이동 수단과 대체 이동 수단", "현금·카드·통신 연결 가능 여부", "개인 건강 상태와 여행자 보험 조건"]
  },
  "asia-travel": {
    title: "아시아 여행지를 볼 때의 판단 기준",
    lead:
      "아시아 카테고리는 유명 명소보다 숙소 주변 생활권, 도보 동선, 식사 난이도, 조용한 체류 가능성을 중심으로 봅니다. 국가와 도시마다 교통·언어·결제 환경이 크게 달라 출발 전 재확인이 중요합니다.",
    cards: [
      { title: "동선 밀도", text: "하루에 많은 장소를 넣기보다 숙소에서 안전하게 오갈 수 있는 거리와 복귀 시간을 먼저 봅니다." },
      { title: "생활권 체류", text: "관광지 바깥의 동네 분위기, 편의시설, 식당 접근성을 함께 확인해 오래 머물기 쉬운지 판단합니다." },
      { title: "변수 관리", text: "기후, 산악 이동, 현금 사용, 언어 장벽처럼 현장에서 체감되는 변수를 별도로 표시합니다." }
    ],
    checks: ["공식 교통 시간표와 막차 시간", "숙소 주변 편의점·식당 운영 시간", "현금 필요 여부와 결제 수단", "날씨와 고도·이동 피로도"]
  },
  "europe-travel": {
    title: "유럽 여행 글을 읽을 때의 기준",
    lead:
      "유럽 카테고리는 도시 이름보다 일정 밀도, 도보 이동, 숙소 위치, 작은 마을 체류감을 기준으로 정리합니다. 교통권과 예약 조건이 달라질 수 있어 공식 채널 재확인을 전제로 안내합니다.",
    cards: [
      { title: "숙소 위치", text: "중심가 여부보다 역과 숙소 사이의 실제 이동 난이도, 밤 시간 복귀 가능성을 먼저 봅니다." },
      { title: "일정 간격", text: "박물관과 명소를 빽빽하게 넣기보다 이동 사이의 휴식과 식사 시간을 현실적으로 계산합니다." },
      { title: "소도시 체류", text: "짧게 찍고 이동하는 일정이 아니라 조용히 걷고 머무는 여행에 맞는지 따져봅니다." }
    ],
    checks: ["철도·버스 파업 또는 운행 변경", "숙소 체크인/수하물 보관 조건", "일요일·공휴일 영업 여부", "야간 귀가 동선과 조명 상태"]
  },
  "middle-east-travel": {
    title: "중동과 주변 지역을 볼 때의 기준",
    lead:
      "중동 카테고리는 화려한 랜드마크보다 더위, 이동 거리, 사진 촬영 매너, 복장과 생활 리듬처럼 현장에서 바로 영향을 주는 조건을 중심으로 정리합니다.",
    cards: [
      { title: "기후와 시간대", text: "한낮 이동보다 오전·해질녘 동선을 중심으로 체력 소모와 휴식 지점을 함께 봅니다." },
      { title: "현지 매너", text: "사진 촬영, 복장, 종교·생활 공간에서 조심해야 할 행동을 과장 없이 설명합니다." },
      { title: "이동 안정성", text: "도보 가능 거리, 택시 이용, 숙소 복귀 방법처럼 혼자 이동할 때의 현실성을 확인합니다." }
    ],
    checks: ["방문 시기별 기온과 일몰 시간", "사진 촬영 제한과 복장 기준", "택시·대중교통 이용 방식", "숙소 주변 야간 이동 환경"]
  },
  "southeast-asia-travel": {
    title: "동남아 여행지를 판단하는 기준",
    lead:
      "동남아 카테고리는 날씨, 이동 피로, 숙소 위치, 현지 식사와 생활권 리듬을 중심으로 봅니다. 같은 도시라도 우기와 건기, 오토바이 교통, 야간 이동 환경에 따라 체감 난이도가 크게 달라집니다.",
    cards: [
      { title: "기후 대응", text: "비와 더위가 일정에 주는 영향을 먼저 보고, 쉬어 갈 수 있는 동선인지 확인합니다." },
      { title: "이동 현실성", text: "지도상 거리가 짧아도 보행 환경과 교통 방식에 따라 달라지는 피로도를 따집니다." },
      { title: "생활권 적응", text: "시장, 식당, 편의시설 접근성을 기준으로 혼자 머물기 쉬운 구역인지 설명합니다." }
    ],
    checks: ["우기·건기와 비 예보", "오토바이·차량 이동 방식", "숙소 주변 야간 소음과 조명", "식사 위생과 물 사용 기준"]
  },
  default: {
    title: "이 카테고리의 글을 읽는 기준",
    lead: "각 글은 혼자 여행자가 실제로 판단해야 하는 숙소, 이동, 식사, 안전, 현장 확인 항목을 중심으로 정리합니다.",
    cards: [
      { title: "숙소", text: "위치와 복귀 가능성을 먼저 확인합니다." },
      { title: "이동", text: "공식 시간표와 대체 동선을 함께 봅니다." },
      { title: "안전", text: "늦은 시간과 변수 대응 가능성을 확인합니다." }
    ],
    checks: ["공식 안내 재확인", "현지 운영 시간 확인", "숙소와 이동 동선 점검", "개인 상황에 맞는 안전 판단"]
  }
};

export async function updateHomePage(rootDir, posts) {
  const homePath = path.join(rootDir, HOME_PAGE);
  const html = await readHtml(homePath);
  const $ = load(html, { decodeEntities: false });
  setMeta($, 'meta[name="robots"]', "content", "follow, index, max-snippet:-1, max-video-preview:-1, max-image-preview:large");
  setMeta($, 'link[rel="canonical"]', "href", `${SITE_URL}/`);
  setMeta($, 'meta[property="og:url"]', "content", `${SITE_URL}/`);
  const homeRoot = $(".ss-expert-home").first();
  const latestSectionHtml = `
    <div class="wp-block-group ss-expert-band ss-auto-latest-posts is-layout-flow wp-block-group-is-layout-flow">
      <p class="ss-expert-section-kicker">LATEST UPDATES</p>
      <h2 class="wp-block-heading">최근 발행된 판단 기준 문서</h2>
      <p>최신 글은 혼자 여행 준비와 이동, 숙소, 현지 체류 판단에 직접 도움이 되는 문서만 선별해 반영합니다.</p>
      <div class="ss-archive-grid">${posts.slice(0, 6).map((post) => buildCard(post)).join("")}</div>
    </div>
  `;
  const current = homeRoot.find(".ss-auto-latest-posts").first();
  if (current.length) {
    current.replaceWith(latestSectionHtml);
  } else {
    const faq = homeRoot.find(".ss-expert-faq").first();
    if (faq.length) {
      faq.before(latestSectionHtml);
    } else {
      homeRoot.append(latestSectionHtml);
    }
  }
  removeWpRemnants($);
  await writeFileUtf8(homePath, $.html());
}

export async function updateSitemaps(rootDir, posts) {
  const postSitemapEntries = posts
    .map(
      (post) => {
        const loc = post.slug ? `${SITE_URL}/${post.slug}/` : `${SITE_URL}/${toUrlPath(post.href || "")}`;
        return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${post.modifiedAt || post.publishedAt || new Date().toISOString()}</lastmod>\n  </url>`;
      }
    )
    .join("\n");
  const pageEntries = [
    "",
    "about/",
    "author/",
    "contact/",
    "editorial-policy/",
    "privacy-policy/",
    "terms-of-service/",
    "travel-tips/",
    "asia-travel/",
    "europe-travel/",
    "middle-east-travel/",
    "southeast-asia-travel/"
  ]
    .map((segment) => {
      const loc = segment ? `${SITE_URL}/${segment}` : `${SITE_URL}/`;
      return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
    })
    .join("\n");

  const now = new Date().toISOString();
  await writeFileUtf8(
    path.join(rootDir, POST_SITEMAP),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${postSitemapEntries}\n</urlset>\n`
  );
  await writeFileUtf8(
    path.join(rootDir, PAGE_SITEMAP),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pageEntries}\n</urlset>\n`
  );
  await writeFileUtf8(
    path.join(rootDir, "sitemap_index.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\t<sitemap>\n\t\t<loc>${SITE_URL}/${POST_SITEMAP}</loc>\n\t\t<lastmod>${now}</lastmod>\n\t</sitemap>\n\t<sitemap>\n\t\t<loc>${SITE_URL}/${PAGE_SITEMAP}</loc>\n\t\t<lastmod>${now}</lastmod>\n\t</sitemap>\n</sitemapindex>\n`
  );
}

export async function savePostMeta(rootDir, post) {
  const postDir = path.join(rootDir, post.slug);
  await writeFileUtf8(path.join(postDir, "meta.json"), JSON.stringify(post, null, 2));
}

function relativePath(fromDir, toDir) {
  const from = fromDir ? `${fromDir}/x` : "x";
  const rel = path.posix.relative(path.posix.dirname(from), toDir || ".");
  return rel === "" ? "./" : rel;
}

async function loadExistingCards(rootDir) {
  const cards = [];
  for (const [categoryKey, category] of Object.entries(CATEGORY_MAP)) {
    const categoryPath = path.join(rootDir, category.path);
    try {
      const html = await readHtml(categoryPath);
      const $ = load(html, { decodeEntities: false });
      $(".ss-archive-card").each((_, element) => {
        const card = $(element);
        const link = card.find("a.ti").attr("href") || card.find("a.cover").attr("href") || "";
        const href = normalizeHref(link, categoryKey);
        if (!href) {
          return;
        }
        cards.push({
          href,
          slug: trimSlashes(href),
          title: card.find("a.ti").text().trim(),
          category: categoryKey,
          categoryName: category.name,
          image: card.find("img").attr("src") || null,
          publishedAt: card.find(".dt").text().trim() || "2025-01-01",
          modifiedAt: card.find(".dt").text().trim() || "2025-01-01"
        });
      });
    } catch {
      continue;
    }
  }
  return cards;
}

async function loadExistingPostPages(rootDir) {
  const files = await collectPostHtmlFiles(rootDir);
  const posts = [];
  const categoryByName = new Map(Object.entries(CATEGORY_MAP).map(([key, category]) => [category.name, key]));

  for (const file of files) {
    try {
      const html = await readHtml(file);
      const $ = load(html, { decodeEntities: false });
      if (!$(".ss-post").length) {
        continue;
      }

      const relativeDir = path.relative(rootDir, path.dirname(file)).replaceAll("\\", "/");
      const canonical = $('link[rel="canonical"]').attr("href") || "";
      const slug = trimSlashes(canonical.replace(`${SITE_URL}/`, "")) || relativeDir;
      const title = $(".ss-post h1").first().text().trim() || $("h1").first().text().trim() || $("title").text().trim();
      const categoryName = $(".ss-cat-badge").first().text().trim() || $('meta[property="article:section"]').attr("content") || "";
      const category = categoryByName.get(categoryName) || inferCategoryFromBreadcrumb($) || "travel-tips";
      const publishedAt =
        $('meta[property="article:published_time"]').attr("content") ||
        $(".ss-post-meta span").first().text().replace("발행일", "").trim() ||
        "2025-01-01";
      const modifiedAt = $('meta[property="article:modified_time"]').attr("content") || publishedAt;

      if (!slug || !title) {
        continue;
      }

      posts.push({
        slug,
        title,
        description: $('meta[name="description"]').attr("content") || "",
        summary: $(".ss-post-summary p").first().text().trim() || "",
        category,
        categoryName: CATEGORY_MAP[category]?.name || categoryName || "여행 팁",
        image:
          $(".ss-post-cover img").first().attr("src") ||
          $('meta[property="og:image"]').attr("content") ||
          DEFAULT_IMAGE,
        publishedAt,
        modifiedAt
      });
    } catch {
      continue;
    }
  }

  return posts;
}

async function collectPostHtmlFiles(dir) {
  const skip = new Set([".git", "node_modules", "cdn-cgi", "wp-content", "content", "scripts", ".github"]);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];

  for (const entry of entries) {
    if (skip.has(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...await collectPostHtmlFiles(full));
    } else if (entry.isFile() && entry.name === "index.html") {
      out.push(full);
    }
  }

  return out;
}

function inferCategoryFromBreadcrumb($) {
  const links = $(".ss-breadcrumb a")
    .map((_, element) => trimSlashes($(element).attr("href") || ""))
    .get();
  for (const link of links) {
    if (CATEGORY_MAP[link]) {
      return link;
    }
  }
  return "";
}

function normalizeHref(href, categoryKey) {
  if (!href) {
    return "";
  }
  if (href.startsWith("http")) {
    return href.replace(`${SITE_URL}/`, "");
  }
  if (href.startsWith("../")) {
    return href.replace("../", "");
  }
  if (href.startsWith("./")) {
    return `${categoryKey}/${href.slice(2)}`;
  }
  return href;
}

function trimSlashes(value) {
  return String(value).replace(/^\/+|\/+$/g, "");
}

function toUrlPath(href) {
  const cleaned = trimSlashes(href);
  return cleaned.endsWith(".html") ? cleaned : `${cleaned}/`;
}

function setMeta($, selector, attr, value) {
  const node = $(selector).first();
  if (node.length) {
    node.attr(attr, value);
  }
}

function removeWpRemnants($) {
  $('link[href*="/feed/"]').remove();
  $('link[href*="wp-json"]').remove();
  $('link[href*="xmlrpc.php"]').remove();
  $('meta[name="generator"]').remove();
  $('form[action*="wp-comments-post.php"]').remove();
  $(".comments-area").remove();
  $(".comment-respond").remove();
  $(".comments-title").remove();
  $(".ast-comment-formwrap").remove();
}
