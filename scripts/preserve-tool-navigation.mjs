import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { writeFileUtf8 } from './lib/static-site-utils.mjs';

export const TOOL_NAV_ROUTES = ['stay-compare', 'arrival-check', 'departure-check', 'trip-board', 'reservation-deadlines'].map(name => `/tools/${name}/`);
const ORIGIN = 'https://shootsense.com';

export function leavesToolPage(href, route, download = false) {
  if (download || !href?.trim()) return false;
  try {
    const current = new URL(route, ORIGIN);
    const destination = new URL(href, current);
    if (!['http:', 'https:'].includes(destination.protocol)) return false;
    return !(destination.hash && destination.origin === current.origin && destination.pathname === current.pathname && destination.search === current.search);
  } catch { return false; }
}

export function protectToolLinks(page, route) {
  let count = 0;
  page('a[href]').each((_, node) => {
    const link = page(node);
    if (!leavesToolPage(link.attr('href'), route, link.attr('download') !== undefined)) return;
    link.attr({ target: '_blank', 'data-tool-navigation': 'new-tab', 'aria-description': '새 탭에서 열립니다. 현재 도구 입력은 이 탭에 유지됩니다.' });
    link.attr('rel', [...new Set((link.attr('rel') || '').split(/\s+/).filter(Boolean).concat('noopener'))].join(' '));
    const title = link.attr('title') || '';
    if (!title.includes('새 탭')) link.attr('title', title ? `${title} · 새 탭에서 열기` : '새 탭에서 열기');
    count++;
  });
  return count;
}

export async function preserveToolNavigation(root = process.cwd()) {
  let links = 0;
  for (const route of TOOL_NAV_ROUTES) {
    const file = path.join(root, route, 'index.html');
    const html = await fs.readFile(file, 'utf8');
    const page = load(html.trimEnd());
    links += protectToolLinks(page, route);
    const next = page.html().replace(/^[\t ]+$/gm, '').trimEnd() + '\n';
    if (next !== html) await writeFileUtf8(file, next);
  }
  return { pages: TOOL_NAV_ROUTES.length, protectedLinks: links };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await preserveToolNavigation()));
