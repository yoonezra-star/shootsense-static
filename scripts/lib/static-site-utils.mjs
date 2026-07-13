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
  const main = $("main.site-main").first();
  const cards = posts
    .filter((post) => post.category === categoryKey)
    .map((post) => buildCard(post, categoryKey))
    .join("");
  main.html(
    `<header class="ss-archive-hero"><span class="pill">카테고리</span><h1>${escapeHtml(
      category.name
    )}</h1><p>${escapeHtml(category.description)}</p></header><div class="ss-archive-grid">${cards}</div><div class="ast-row"></div>`
  );
  removeWpRemnants($);
  await writeFileUtf8(categoryPath, $.html());
}

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
