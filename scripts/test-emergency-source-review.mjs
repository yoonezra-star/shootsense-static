import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { load } from 'cheerio';
import { EMERGENCY_MODIFIED, PREPARATION_SAFETY_MODIFIED, PREDEPARTURE_REVIEW_DATES } from './predeparture-content.mjs';
import { EMERGENCY_SOURCE_REVIEW, finalizePreparationSafetySourceReview } from './finalize-preparation-safety-source-review.mjs';

const slug = EMERGENCY_SOURCE_REVIEW.slug;
const read = async file => load(await fs.readFile(file, 'utf8'));

test('retained priority notice and regenerated body warning converge to one notice and remain byte-stable', async () => {
  const prefix = path.join(os.tmpdir(), 'shootsense-emergency-');
  const fixture = await fs.mkdtemp(prefix);
  const files = [...Object.keys(PREDEPARTURE_REVIEW_DATES).map(item => `${item}/index.html`), 'index.html', 'post-sitemap.xml', 'page-sitemap.xml', 'sitemap_index.xml'];
  try {
    for (const file of files) {
      await fs.mkdir(path.dirname(path.join(fixture, file)), { recursive: true });
      await fs.copyFile(file, path.join(fixture, file));
    }
    const file = path.join(fixture, slug, 'index.html');
    const page = load(await fs.readFile(file, 'utf8'));
    page('.ss-post-body').prepend(page('#ss-emergency-priority > p').first().toString());
    await fs.writeFile(file, page.html());
    await finalizePreparationSafetySourceReview(fixture);
    const repaired = load(await fs.readFile(file, 'utf8'));
    assert.equal((repaired('.ss-post').text().match(/지금 생명·신체에 즉각적인 위험/g) || []).length, 1);
    assert.equal(repaired('.ss-post-body').text().includes('지금 생명·신체에 즉각적인 위험'), false);
    const before = await Promise.all(files.map(item => fs.readFile(path.join(fixture, item), 'utf8')));
    await finalizePreparationSafetySourceReview(fixture);
    const after = await Promise.all(files.map(item => fs.readFile(path.join(fixture, item), 'utf8')));
    assert.deepEqual(after, before);
  } finally {
    if (!path.resolve(fixture).startsWith(path.resolve(prefix))) throw new Error('Unexpected fixture cleanup path');
    await fs.rm(fixture, { recursive: true, force: true });
  }
});

test('emergency warning precedes summary, review details, TOC and record download without duplication', async () => {
  const page = await read(`${slug}/index.html`);
  const children = page('.ss-post').children().toArray();
  const position = selector => children.indexOf(page(selector)[0]);
  assert.equal(page('#ss-emergency-priority').length, 1);
  assert.ok(position('.ss-post-hero') < position('#ss-emergency-priority'));
  assert.ok(position('#ss-emergency-priority') < position('.ss-post-summary'));
  assert.ok(position('#ss-emergency-priority') < position('.ss-toc'));
  assert.match(page('#ss-emergency-priority').text(), /현지 긴급서비스/);
  assert.match(page('#ss-emergency-priority').text(), /문의메일은 실시간 구조·신고 접수 창구가 아닙니다/);
  assert.equal((page('.ss-post').text().match(/지금 생명·신체에 즉각적인 위험/g) || []).length, 1);
  assert.equal(page('.ss-post-body #ss-emergency-priority').length, 0);
  assert.equal(page('.ss-toc').length, 1);
  assert.equal(page('.ss-post-body h2').length, 6);
});

test('four official sources distinguish consultation, document validity and limits from actual completed services', async () => {
  const page = await read(`${slug}/index.html`);
  const review = page('#ss-emergency-source-review');
  assert.equal(review.length, 1);
  assert.equal(review.find('details[open]').length, 0);
  assert.equal(review.find('li').length, 3);
  assert.equal(review.find('a').length, 4);
  const expected = EMERGENCY_SOURCE_REVIEW.groups.flatMap(group => group.links.map(([, href]) => href));
  assert.deepEqual(review.find('a').toArray().map(node => page(node).attr('href')), expected);
  assert.match(review.text(), /실제 연결·대기시간·통신 요금은 시험하지 않았습니다/);
  assert.match(review.text(), /발급일과 다음 여정에서의 문서 인정/);
  assert.match(review.text(), /법적 권리·비용 지원·보험 보상·환불 여부를 판정하지 않습니다/);
  assert.equal(page('.ss-post-body a[href="tel:+82232100404"]').length, 1);
  assert.equal(page('.ss-post-body a[href="tel:+82232100404"]').text(), '+82-2-3210-0404');
});

test('contact guidance separates paid phone, internet app, offline reading and actual receipt', async () => {
  const page = await read(`${slug}/index.html`);
  const body = page('.ss-post-body').text();
  assert.match(body, /일반 전화번호를 유료로 구분/);
  assert.match(body, /긴급번호에 시험 전화를 걸지는 않습니다/);
  assert.match(body, /오프라인으로 번호와 주소를 읽을 수 있는지 확인하는 것과 실제 통화/);
  assert.match(body, /연락 시도 · 접수 미확인/);
  assert.match(body, /그 기관에 접수 확인/);
  assert.match(body, /실제 상담·출동 기록이 아닌 편집 예시/);
  assert.match(body, /경찰 신고와 한국 여권 분실 신고는 별도/);
  assert.match(body, /공통 서류 목록이나 발급 소요일을 확정하지 않습니다/);
  assert.equal(page('.ss-post-body input, .ss-post-body form, .ss-post-body textarea').length, 0);
});

test('private worksheet separates preparation, help request and post-safety records', async () => {
  const sheet = await fs.readFile('assets/incident-contact-record.txt', 'utf8');
  assert.match(sheet, /양식 검토: 2026-11-24/);
  assert.ok(sheet.indexOf('즉각적인 생명·신체 위험') < sheet.indexOf('0. 출발 전 연락 준비'));
  for (const term of ['긴급한 상황에서 작성할 항목 아님', '적용 국가·지역', '공식 자료 주소 / 확인 날짜', '연락 시도 / 연결됨 / 접수 확인 / 후속 조치 남음', '미확인인 처리', '경찰 신고 / 한국 여권 분실 신고 / 새 문서 발급 / 운송사 확인', '발신 화면만 있다면 접수 미확인']) assert.ok(sheet.includes(term), term);
  assert.match(sheet, /여권·카드 전체 번호, 비밀번호, 인증번호를 적거나 공개하지 마세요/);
  assert.ok(!sheet.includes('\ufffd'));
});

test('emergency dates advance without redating the other two reviewed guides or changing historical log order', async () => {
  const page = await read(`${slug}/index.html`);
  assert.equal(page('meta[property="article:modified_time"]').attr('content'), EMERGENCY_MODIFIED);
  const graph = JSON.parse(page('script.rank-math-schema').text())['@graph'];
  for (const node of graph.filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) {
    assert.equal(node.dateModified, EMERGENCY_MODIFIED);
    assert.ok(Date.parse(node.datePublished) < Date.parse(node.dateModified));
  }
  for (const [other, date] of Object.entries(PREDEPARTURE_REVIEW_DATES)) {
    const article = await read(`${other}/index.html`);
    assert.equal(article('meta[property="article:modified_time"]').attr('content'), date);
    if (other !== slug) assert.equal(date, PREPARATION_SAFETY_MODIFIED);
  }
  const home = await read('index.html');
  assert.equal(home('#ss-home-emergency-review a').length, 1);
  assert.equal(home('.ss-home-updates > li').first().attr('id'), 'november-recovery-update');
  assert.equal(home('meta[property="og:updated_time"]').attr('content'), EMERGENCY_MODIFIED);
  const map = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(map('url').length, 18);
  assert.equal(map('url').filter((_, node) => map(node).find('loc').text() === `https://shootsense.com/${slug}/`).find('lastmod').text(), EMERGENCY_MODIFIED);
  assert.equal(graph.find(node => node['@type'] === 'BlogPosting').datePublished.slice(0, 10), '2025-06-06');
});
