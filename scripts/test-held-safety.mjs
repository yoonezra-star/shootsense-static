import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { HELD_SAFETY_GUIDES, HELD_SAFETY_MODIFIED } from './held-safety.mjs';

for (const guide of HELD_SAFETY_GUIDES) {
  test(`${guide.slug}: explicit travel caution without restoring index or ads`, async () => {
    const $ = load(await fs.readFile(`${guide.slug}/index.html`, 'utf8'));
    assert.equal($('h1').text(), guide.title);
    assert.equal($('.ss-post-summary p').text(), guide.summary);
    assert.equal($('.ss-post.ss-regional-guide').length, 1);
    assert.equal($('link#ss-regional-style').length, 1);
    assert.equal($('.ss-post-cover').length, 0);
    assert.match($('meta[name="robots"]').attr('content'), /noindex/);
    assert.equal($('script[src*="googlesyndication"], ins.adsbygoogle').length, 0);
    assert.equal($('#ss-held-safety-note').length, 1);
    assert.equal($('#ss-held-safety-note').next('.ss-toc').length, 1);
    assert.equal($('.ss-post-body').children().first().attr('id'), 'ss-held-archive-scope');
    assert.match($('#ss-held-safety-note').text(), /2026-10-19/);
    assert.ok($('#ss-held-safety-note').text().includes(guide.warning));
    assert.equal($('#ss-held-safety-note a').attr('href'), guide.source);
    assert.match($('#ss-held-safety-note').text(), /환불이 자동 확정되는 것은 아닙니다/);
    assert.match($('.ss-trust-note').text(), /기존 원고 전체 검토는 미완료/);
    assert.match($('.ss-trust-box h2').text(), /원고 재검토 대기/);
    assert.ok(!$('.ss-trust-box').text().includes('숙소 위치, 이동 동선, 식사 난이도, 야간 도착 가능성을 우선 확인했습니다'));
    assert.equal($('meta[property="article:modified_time"]').attr('content'), HELD_SAFETY_MODIFIED);
    const xml = load(await fs.readFile('post-sitemap.xml', 'utf8'), { xml: true });
    assert.ok(!xml('loc').toArray().some(node => decodeURIComponent(xml(node).text()).endsWith(`/${guide.slug}/`)));
    const graph = JSON.parse($('script.rank-math-schema').text())['@graph'];
    for (const node of graph.filter(node => ['WebPage', 'BlogPosting'].includes(node['@type']))) {
      assert.equal(node.name, guide.title);
      assert.equal(node.dateModified, HELD_SAFETY_MODIFIED);
      assert.ok(Date.parse(node.datePublished) < Date.parse(HELD_SAFETY_MODIFIED));
    }
  });
}

test('Cambodia caution distinguishes the city from the province and never exempts an unspecified outskirts address', async () => {
  const guide = HELD_SAFETY_GUIDES[2];
  const $ = load(await fs.readFile(`${guide.slug}/index.html`, 'utf8'));
  const text = $('#ss-held-safety-note').text();
  assert.match(text, /시하누크빌 시 출국권고 · 시하누크빌 주 여행자제/);
  assert.match(text, /외곽이라는 표현만으로 시 경계 밖이거나 경보 적용 밖이라고 판단할 수 없습니다/);
  assert.match(text, /원고 전체의 운영·교통·관광 정보를 다시 검증했다는 뜻이 아닙니다/);
});
