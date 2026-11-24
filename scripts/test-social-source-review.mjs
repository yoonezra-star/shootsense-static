import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { SOCIAL_ACTIVITY_MODIFIED, SOCIAL_ACTIVITY_SLUG, SOCIAL_ACTIVITY_SOURCES } from './social-activity-content.mjs';
import { SOCIAL_REVIEW_GROUPS } from './finalize-social-source-review.mjs';
import { DINING_MODIFIED, DINING_SLUG } from './dining-content.mjs';
const read = async file => load(await fs.readFile(file, 'utf8'));

test('six references disclose direct-page versus search-index verification without duplicate TOC', async () => {
  assert.equal(Object.keys(SOCIAL_ACTIVITY_SOURCES).length, 6);
  assert.equal(new Set(SOCIAL_REVIEW_GROUPS.flatMap(group => group.keys)).size, 6);
  const page = await read(`${SOCIAL_ACTIVITY_SLUG}/index.html`);
  assert.equal(page('#ss-social-source-review').length, 1);
  assert.equal(page('#ss-social-source-review a').length, 6);
  assert.equal(page('#ss-social-source-review details[open]').length, 0);
  assert.match(page('#ss-social-source-review').text(), /직접 조회 지연으로 공식 검색 색인/);
  assert.match(page('#ss-social-source-review').text(), /직접 참가·예약 후기가 아닙니다/);
  assert.equal(page('.ss-toc').length, 1);
  assert.equal(page('.ss-post-body h2').length, 6);
});

test('conflicting TFG windows and guide counts are visible rather than silently merged', async () => {
  const body = (await read(`${SOCIAL_ACTIVITY_SLUG}/index.html`))('.ss-post-body').text();
  assert.match(body, /최대 2개월 전 신청.*3개월 전까지·6명 일행에 복수 가이드/);
  assert.match(body, /반드시 1명분 실비.*결론 내리지 않습니다/);
  assert.match(body, /어느 화면이 실제 신청에 적용되는지 시험하지 않았으므로/);
  assert.match(body, /접수 메일이 없음.*미접수 가능성/);
  assert.match(body, /배정 메시지만 있음.*스팸함 확인/);
});

test('hypothetical date arithmetic does not invent cutoff hours or cancellation completion', async () => {
  const body = (await read(`${SOCIAL_ACTIVITY_SLUG}/index.html`))('.ss-post-body').text();
  assert.equal(12 - 3, 9); assert.equal(12 - 2, 10); assert.equal(12 - 1, 11);
  assert.match(body, /3일 전은 12월 9일.*전날 회신 기준은 12월 11일/);
  assert.match(body, /2일 전 무연락 기준은 12월 10일/);
  assert.match(body, /실제 접수 마감 시각·72시간 계산·영업일 처리·예약 가능을 확인한 예가 아닙니다/);
  assert.match(body, /미배정 신청의 취소.*Cancel Request.*Register, 이미 배정됐다면.*직접 이메일/);
  assert.match(body, /메일 발송과 취소 완료를 같은 상태로 표시하지 않습니다/);
});

test('worksheet, homepage and sitemaps match the review without redating the dining article', async () => {
  const home = await read('index.html');
  assert.equal(home('#ss-home-source-review #ss-home-social-review').length, 1);
  const homeModified = home('meta[property="og:updated_time"]').attr('content');
  assert.ok(Date.parse(homeModified) >= Date.parse(SOCIAL_ACTIVITY_MODIFIED));
  const graph = JSON.parse(home('script.rank-math-schema').text())['@graph'];
  assert.ok(graph.filter(node => node.dateModified).every(node => node.dateModified === homeModified));
  const map = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(map('url').length, 18);
  assert.equal(map('url').filter((_, node) => map(node).find('loc').text().endsWith(`/${SOCIAL_ACTIVITY_SLUG}/`)).find('lastmod').text(), SOCIAL_ACTIVITY_MODIFIED);
  const pageMap = load(await fs.readFile('page-sitemap.xml', 'utf8'), { xml: true });
  assert.equal(pageMap('url').filter((_, node) => pageMap(node).find('loc').text() === 'https://shootsense.com/').find('lastmod').text(), homeModified);
  assert.equal((await read(`${DINING_SLUG}/index.html`))('meta[property="article:modified_time"]').attr('content'), DINING_MODIFIED);
  const sheet = await fs.readFile('assets/social-activity-check.txt', 'utf8');
  assert.match(sheet, /자료 검토: 2026-11-24/);
  assert.match(sheet, /문서 간 차이/);
  assert.match(sheet, /배정 메시지 수신과 담당자 직접 연락을 구분/);
  assert.match(sheet, /취소 시 현재 상태/);
  assert.match(sheet, /인증번호를 이 문서에 적지 않습니다/);
});
