import fs from "node:fs/promises";
import path from "node:path";
import { CATEGORY_MAP } from "./lib/site-config.mjs";
import {
  buildPostPage,
  loadPosts,
  readJson,
  savePostMeta,
  updateCategoryPage,
  updateHomePage,
  updateSitemaps,
  writeFileUtf8
} from "./lib/static-site-utils.mjs";

const rootDir = process.cwd();
const sourceArg = process.argv[2];

if (!sourceArg) {
  console.error("Usage: npm run publish:post -- content/queue/your-post.json");
  process.exit(1);
}

const sourcePath = path.resolve(rootDir, sourceArg);
const raw = await readJson(sourcePath);
const category = CATEGORY_MAP[raw.category];

if (!category) {
  console.error(`Unknown category: ${raw.category}`);
  process.exit(1);
}

const now = new Date().toISOString();
const post = {
  slug: raw.slug,
  title: raw.title,
  description: raw.description,
  summary: raw.summary,
  category: raw.category,
  categoryName: category.name,
  image: raw.image || null,
  reviewNote: raw.reviewNote || "공식 채널 재확인 권장",
  sections: raw.sections || [],
  publishedAt: raw.publishedAt || now,
  modifiedAt: now
};

if (!post.slug || !post.title || !post.description || !post.summary) {
  console.error("slug, title, description, summary are required.");
  process.exit(1);
}

const postHtml = await buildPostPage(rootDir, post);
await writeFileUtf8(path.join(rootDir, post.slug, "index.html"), postHtml);
await savePostMeta(rootDir, post);

const posts = await loadPosts(rootDir);
await updateHomePage(rootDir, posts);

for (const key of Object.keys(CATEGORY_MAP)) {
  await updateCategoryPage(rootDir, key, posts);
}

await updateSitemaps(rootDir, posts);

const donePath = sourcePath.replace(/\.json$/i, ".done.json");
await fs.rename(sourcePath, donePath);
console.log(JSON.stringify({ ok: true, slug: post.slug, title: post.title, category: post.categoryName }, null, 2));
