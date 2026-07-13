import { CATEGORY_MAP } from "./lib/site-config.mjs";
import { loadPosts, updateCategoryPage, updateSitemaps } from "./lib/static-site-utils.mjs";

const rootDir = process.cwd();
const posts = await loadPosts(rootDir);

for (const categoryKey of Object.keys(CATEGORY_MAP)) {
  await updateCategoryPage(rootDir, categoryKey, posts);
}

await updateSitemaps(rootDir, posts);

console.log(
  JSON.stringify(
    {
      ok: true,
      categories: Object.keys(CATEGORY_MAP).length,
      indexedPosts: posts.length
    },
    null,
    2
  )
);
