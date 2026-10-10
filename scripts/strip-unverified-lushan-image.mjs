import fs from "node:fs/promises";
import { load } from "cheerio";

const filePath = "honja-lushan-yeohaeng/index.html";
const $ = load(await fs.readFile(filePath, "utf8"), { decodeEntities: false });
$('.ss-post-cover').remove();
$('meta[property^="og:image"], meta[name="twitter:image"]').remove();

const schemaNode = $('script[type="application/ld+json"]').first();
const schema = JSON.parse(schemaNode.html() || '{}');
const page = schema['@graph'].find((node) => node['@type'] === 'WebPage');
const imageId = page?.primaryImageOfPage?.['@id'];
schema['@graph'] = schema['@graph'].filter((node) => !(node['@type'] === 'ImageObject' && node['@id'] === imageId));
for (const node of schema['@graph']) {
  if (node['@type'] === 'WebPage') delete node.primaryImageOfPage;
  if (node['@type'] === 'BlogPosting') delete node.image;
}
schemaNode.text(JSON.stringify(schema));
await fs.writeFile(filePath, $.html());
