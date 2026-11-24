import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { PACKING_SLUG, PACKING_REVIEW_MODIFIED, PACKING_REVIEW_GROUPS } from './finalize-packing-source-review.mjs';
import { LODGING_REVIEW_MODIFIED } from './finalize-lodging-source-review.mjs';
import { PREDEPARTURE_REVIEW_DATES } from './predeparture-content.mjs';
const read = async file => load(await fs.readFile(file, 'utf8'));

test('packing article keeps six sections, one TOC and seven bounded official sources', async () => {
  const page = await read(`${PACKING_SLUG}/index.html`);
  assert.equal(page('.ss-toc').length, 1);
  assert.equal(page('.ss-post-body h2').length, 6);
  assert.deepEqual(page('.ss-toc a').toArray().map(node => page(node).attr('href')), page('.ss-post-body h2').toArray().map(node => '#' + page(node).attr('id')));
  const panel = page('#ss-packing-source-review');
  assert.equal(panel.length, 1);
  assert.equal(panel.find('details[open]').length, 0);
  assert.equal(panel.find('li').length, 4);
  assert.equal(panel.find('a').length, 7);
  assert.deepEqual(panel.find('a').toArray().map(node => page(node).attr('href')), PACKING_REVIEW_GROUPS.flatMap(group => group.links.map(([, href]) => href)));
  assert.match(panel.text(), /실제 반입 승인이나 개인 기기의 작동 시험을 완료한 기록은 아닙니다/);
});

test('battery guide distinguishes old and later notices, battery kinds, approval and use rather than certifying carriage', async () => {
  const page = await read(`${PACKING_SLUG}/index.html`);
  const body = page('.ss-post-body').text();
  for (const term of ['1월의 5개를 지금의 보조배터리 허용 개수로 옮겨 쓰지 않습니다', '100Wh 초과~160Wh 이하의 승인 필요', '보조배터리·여분 배터리·기기에 장착된 배터리', '같은 안내의 기내 사용·충전·선반 보관 제한', '실제 운항사', '의료기기·이동보조기기는 별도 안내 대상', 'USB 출력 전압을 대신 넣지 않습니다', '손상된 배터리는 충전 시험 대상으로 삼지 말고']) assert.ok(body.includes(term), term);
  assert.equal(page('#battery-evidence').length, 1);
});

test('offline method requires checking Wi-Fi as well as airplane mode and records failures instead of assuming availability', async () => {
  const page = await read(`${PACKING_SLUG}/index.html`);
  const body = page('.ss-post-body').text();
  for (const term of ['Wi-Fi도 꺼서', '비행기 모드만으로 인터넷이 끊겼다고 가정하지 않습니다', '로그인을 다시 요구하거나 내용이 비면 실패', '시험 뒤에는 필요한 통신을 복구', '오프라인에서 대중교통·자전거·도보 경로를 이용할 수 없고', '다른 앱·운영체제의 기능', '성공 / 실패 / 미확인 / 해당 없음']) assert.ok(body.includes(term), term);
  assert.equal(page('.ss-post-body a[href="https://support.google.com/maps/answer/6291838?hl=ko"]').length, 1);
});

test('private sheet preserves device tests, operator evidence and the limits of a file without requesting secrets', async () => {
  const sheet = await fs.readFile('assets/trip-prep-sheet.txt', 'utf8');
  for (const term of ['양식 검토: 2026-11-24', '비공개로 보관', 'Wi-Fi·모바일 데이터 연결 없음', '성공 / 실패 / 미확인 / 해당 없음', '실제 운항사', '공지 적용일 / 조회 날짜', '기내 사용·충전 제한', '입력된 소계', '텍스트와 입력 복원용 JSON은 다릅니다', '오프라인 작동을 보장하지 않습니다']) assert.ok(sheet.includes(term), term);
  assert.match(sheet, /여권번호, 카드번호, 비밀번호, 출입 코드는 적지 않습니다/);
  assert.ok(!sheet.includes('\ufffd'));
});

test('board workflow stays separate from source body and never promises offline webpage execution or automatically loads data', async () => {
  const page = await read(`${PACKING_SLUG}/index.html`);
  assert.equal(page('.ss-post-body a[href="#ss-workflow-walkthrough"]').length, 1);
  assert.equal(page('#ss-workflow-walkthrough').length, 1);
  assert.equal(page('.ss-post-body #ss-workflow-walkthrough').length, 0);
  assert.equal(page('#ss-workflow-walkthrough a').attr('href'), '/tools/trip-board/#workflow=offline-file');
  assert.match(page('#ss-workflow-walkthrough').text(), /기록을 자동으로 불러오지 않습니다/);
  assert.match(page('.ss-post-body').text(), /준비판은 숙소 주소·출입 코드를 보관하는 전용 보관함도 아닙니다/);
});

test('only packing and home dates advance while previous source reviews, tools and privacy retain their dates', async () => {
  const page = await read(`${PACKING_SLUG}/index.html`);
  assert.equal(page('meta[property="article:modified_time"]').attr('content'), PACKING_REVIEW_MODIFIED);
  assert.match(page('.ss-trust-note').text(), /최종 검토일: 2026-11-24/);
  const graph = JSON.parse(page('script.rank-math-schema').text())['@graph'];
  for (const node of graph.filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) {
    assert.equal(node.dateModified, PACKING_REVIEW_MODIFIED);
    assert.ok(Date.parse(node.datePublished) < Date.parse(PACKING_REVIEW_MODIFIED));
  }
  const home = await read('index.html');
  assert.equal(home('#ss-home-packing-review a').length, 1);
  assert.ok(Date.parse(home('meta[property="og:updated_time"]').attr('content')) >= Date.parse(PACKING_REVIEW_MODIFIED));
  assert.equal(home('.ss-home-updates > li').first().attr('id'), 'november-recovery-update');
  for (const file of ['honja-yeohaeng-sukso-goreuneun-beop/index.html', 'tools/stay-compare/index.html', 'tools/trip-board/index.html']) assert.equal((await read(file))('meta[property="og:updated_time"]').attr('content'), LODGING_REVIEW_MODIFIED);
  for (const [slug, date] of Object.entries(PREDEPARTURE_REVIEW_DATES)) assert.equal((await read(`${slug}/index.html`))('meta[property="article:modified_time"]').attr('content'), date);
  assert.equal((await read('privacy-policy/index.html'))('meta[property="og:updated_time"]').attr('content'), '2026-11-24T13:06:00+09:00');
  const map = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(map('url').length, 18);
  assert.equal(map('url').filter((_, node) => map(node).find('loc').text() === `https://shootsense.com/${PACKING_SLUG}/`).find('lastmod').text(), PACKING_REVIEW_MODIFIED);
});
