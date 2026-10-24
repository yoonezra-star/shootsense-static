import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { load } from 'cheerio';
import { MATSUDAI_GUIDES, MATSUDAI_MODIFIED, MATSUDAI_SLUG, MATSUDAI_SOURCES } from './matsudai-content.mjs';

const guide = MATSUDAI_GUIDES[0];
const read = async () => load(await fs.readFile(`${MATSUDAI_SLUG}/index.html`, 'utf8'));
const bodyText = async () => (await read())('.ss-post-body').text();

test('Matsudai has a scoped purpose, six unique sections and one matching TOC', async () => {
  const $ = await read();
  assert.equal($('h1').length, 1);
  assert.equal($('h1').text(), guide.title);
  assert.equal($('.ss-post-summary p').text(), guide.summary);
  assert.equal($('.ss-post.ss-regional-guide').length, 1);
  assert.equal($('link#ss-regional-style').length, 1);
  const ids = $('.ss-post-body h2').toArray().map(node => $(node).attr('id'));
  assert.equal(ids.length, 6);
  assert.equal(new Set(ids).size, 6);
  assert.ok(ids.every(Boolean));
  assert.equal($('.ss-toc').length, 1);
  assert.deepEqual($('.ss-toc a').toArray().map(node => $(node).attr('href')), ids.map(id => `#${id}`));
  assert.match($('.ss-post-body').text(), /실제 방문·승차·시설 개방 확인이나 운영자 회신을 받은 기록은 아닙니다/);
  assert.equal($('.ss-post-cover').length, 0);
});

test('specific suspended works override an evergreen deck-viewing course without implying total closure', async () => {
  const body = await bodyText();
  assert.match(body, /2026\/09\/05 갱신/);
  assert.match(body, /테라스에서의 작품 공개를 중단/);
  assert.match(body, /외부나 식당에서는 조형물 자체를 볼 수/);
  assert.match(body, /D184 Reverse City, D001 棚田/);
  assert.match(body, /마을 전체 폐쇄나 조형물 전면 철거로 확대하지도 않습니다/);
  assert.match(body, /운영자에게 재개 답변을 받았다고 주장하지 않습니다/);
});

test('autumn event end is not a universal shutdown or winter availability guarantee', async () => {
  const body = await bodyText();
  assert.match(body, /9월 28일~11월 8일/);
  assert.match(body, /11월 중순부터는 순차적으로/);
  assert.match(body, /겨울에는 기본적으로 야외 작품을 볼 수 없으며/);
  assert.match(body, /11월 중순 전에는 모두 정상 공개.*단일 날짜 규칙을 만들지 않습니다/);
  assert.match(body, /12월 일정에 그대로 복사할 수도 없습니다/);
});

test('station access, seasonal weekend shuttle and remaining steep walk stay distinct', async () => {
  const body = await bodyText();
  assert.match(body, /마쓰다이역에서 노부타이까지 도보 3분/);
  assert.match(body, /편도 약 2km.*자동차·자전거가 들어갈 수 없/);
  assert.match(body, /4~11월 토·일·공휴일/);
  assert.match(body, /필드뮤지엄권 또는 공통권이 필요/);
  assert.equal(7 + 10, 17);
  assert.match(body, /7분 \+ 남은 도보 약 10분 = 약 17분/);
  assert.match(body, /호출 대기·승하차·성 관람·돌아오는 이동을 포함한 총시간이 아닙니다/);
  assert.match(body, /평일 개관일에도 같은 셔틀이 있다고 가정하지 않습니다/);
  assert.match(body, /이동 약자를 위한 접근 가능 인증이 아닙니다/);
  assert.match(body, /2시간 800엔.*필드뮤지엄 밖으로 나갈 수 없고/);
});

test('overlapping ticket scopes are alternatives, not mandatory summed admission or access to closed works', async () => {
  const body = await bodyText();
  assert.equal(1200 - 600, 600);
  assert.equal(2500 - 1200, 1300);
  assert.match(body, /향토자료관은 별도 400엔/);
  assert.match(body, /판매 기간 2026년 4월 25일~11월 8일/);
  assert.match(body, /차이 600엔/);
  assert.match(body, /차이 1,300엔/);
  assert.match(body, /4,300엔을 필수 입장료로 잡지 않습니다/);
  assert.match(body, /모든 바깥길을 걷기 위한 통행료로 1,200엔을 강제 계산하지 않습니다/);
  assert.match(body, /유료 시설 입장·셔틀 이용 조건은 야외 조형물을 보는 것과 별개/);
});

test('fictional arrival arithmetic does not become train timings or castle opening; overnight does not resolve closure', async () => {
  const body = await bodyText();
  assert.equal((16 * 60 + 30) - (15 * 60 + 50), 40);
  assert.equal(17 * 60 - (15 * 60 + 50), 70);
  assert.match(body, /가상 도착 사례: 15:50/);
  assert.match(body, /16:30까지 40분, 17:00까지 70분/);
  assert.match(body, /이 시각은 실제 열차·셔틀 운행표가 아닙니다/);
  assert.match(body, /성이나 다른 시설에 건물의 마감 시간을 그대로 적용하지 않습니다/);
  assert.match(body, /1박이 관람 불가를 해결하지 않음/);
  assert.match(body, /특정 숙소의 빈방·늦은 체크인·식사·눈길 이동을 확인하지 않았습니다/);
  assert.match(body, /에치고유자와까지 직통 운행하지 않는 열차도/);
  assert.match(body, /확정 막차·실시간 운행·좌석 확보를 제시하지 않습니다/);
});

test('private worksheet and primary-source metadata preserve publication and never collect reservations', async () => {
  const $ = await read();
  const download = $('.ss-post-body a[download]');
  assert.equal(download.length, 1);
  const sheet = await fs.readFile(`.${download.attr('href')}`, 'utf8');
  assert.ok(sheet.includes(`https://shootsense.com/${MATSUDAI_SLUG}/`));
  assert.match(sheet, /검토: 2026-10-25/);
  assert.match(sheet, /비공개 개인용/);
  assert.match(sheet, /예약번호·객실번호·결제 인증정보를 적거나 제출하지 않습니다/);
  assert.match(sheet, /0이나 가능 대신 미확인/);
  assert.match(sheet, /에치고유자와 직통 여부/);
  assert.ok(!sheet.includes('\ufffd'));
  assert.equal($('.ss-post-body form').length, 0);
  const external = $('.ss-post-body a[href^="https:"]').toArray().map(node => $(node).attr('href').split('#')[0]);
  assert.deepEqual(new Set(external), new Set(Object.values(MATSUDAI_SOURCES)));
  assert.equal($('link[rel="canonical"]').attr('href'), `https://shootsense.com/${MATSUDAI_SLUG}/`);
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) assert.equal($(selector).attr('content'), guide.title);
  assert.equal($('meta[property="article:modified_time"]').attr('content'), MATSUDAI_MODIFIED);
  const graph = JSON.parse($('script.rank-math-schema').text())['@graph'];
  assert.ok(!graph.some(node => node['@type'] === 'FAQPage'));
  for (const node of graph.filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) {
    assert.equal(node.name, guide.title);
    assert.equal(node.description, guide.summary);
    assert.equal(node.dateModified, MATSUDAI_MODIFIED);
    assert.equal(node.datePublished, '2026-04-05T10:42:00+09:00');
  }
});

test('held Matsudai rerun is idempotent and leaves homepage, sitemaps and other held articles untouched', async () => {
  const files = ['index.html', 'post-sitemap.xml', 'page-sitemap.xml', 'sitemap_index.xml', 'honja-busan-yeohaeng-course/index.html', 'honja-jeju-yeohaeng-no-car/index.html', '볼거리가-없어서-오래-머물-수-있었던-무스카트-외곽/index.html', '지도에-별표가-없는-곳에서-보낸-수르의-시간/index.html', '구경이-아니라-머무름에-가까웠던-시아누크빌-외곽/index.html'];
  const before = [];
  for (const file of files) before.push(await fs.readFile(file, 'utf8'));
  const articleBefore = await fs.readFile(`${MATSUDAI_SLUG}/index.html`, 'utf8');
  const result = spawnSync(process.execPath, ['scripts/revise-predeparture-guides.mjs', '--matsudai'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /"homepageLogUpdated": false/);
  assert.equal(await fs.readFile(`${MATSUDAI_SLUG}/index.html`, 'utf8'), articleBefore);
  for (let i = 0; i < files.length; i++) assert.equal(await fs.readFile(files[i], 'utf8'), before[i], files[i]);
  const $ = await read();
  assert.equal($('meta[name="robots"]').attr('content'), 'noindex, nofollow, noarchive');
  assert.equal($('script[src*="googlesyndication"], ins.adsbygoogle').length, 0);
  const xml = load(before[1], { xml: true });
  assert.equal(xml('loc').length, 18);
  assert.ok(!xml('loc').toArray().some(node => decodeURI(xml(node).text()).includes(MATSUDAI_SLUG)));
});
