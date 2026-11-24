import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { ARTICLE_WORKFLOWS, readArticleWorkflow } from '../assets/article-workflows.js';
import { exampleBoard, boardOverview, boardText, parseBoardFile } from '../assets/trip-board-model.js';
import { exampleDeadlineBook, inspectDeadline, parseDeadlineBook, deadlineCalendar } from '../assets/deadline-model.js';
import { DateTime } from '../assets/vendor/luxon.js';

const now = DateTime.fromISO('2026-11-24T00:00:00Z');

test('workflow identifiers are allowlisted by tool and contain no personal input', () => {
  assert.equal(Object.keys(ARTICLE_WORKFLOWS).length, 2);
  for (const [id, entry] of Object.entries(ARTICLE_WORKFLOWS)) {
    assert.equal(readArticleWorkflow(`#workflow=${id}`, entry.tool), entry);
    assert.equal(readArticleWorkflow(`#workflow=${id}`, 'wrong'), null);
    assert.ok(!Object.hasOwn(entry, 'inputs'));
  }
  for (const hash of ['', '#workflow=__proto__', '#workflow=constructor', '#workflow=<script>']) assert.equal(readArticleWorkflow(hash, 'board'), null);
});

test('readable board summary is not a restore file and JSON restore clears same-trip confirmation', () => {
  const board = exampleBoard();
  assert.equal(boardOverview(board).readyCount, 3);
  assert.equal(boardOverview(board).relation, 'not-linked');
  board.context.selectedStay = 'a'; board.context.sameTrip = true;
  assert.equal(boardOverview(board).relation, 'ordered');
  const restored = parseBoardFile(JSON.stringify(board));
  assert.equal(restored.context.sameTrip, false);
  assert.equal(restored.context.selectedStay, 'a');
  assert.equal(boardOverview(restored).readyCount, 3);
  assert.equal(boardOverview(restored).hasExample, true);
  assert.throws(() => parseBoardFile(boardText(board)), /JSON/);
});

test('deadline examples separate valid Tokyo conversion from unresolved New York fold', () => {
  const book = exampleDeadlineBook();
  const tokyo = inspectDeadline(book.records[0], 'Asia/Seoul', now);
  assert.equal(tokyo.converted, '2026-12-10 12:00 UTC+09:00');
  assert.equal(tokyo.eligible, false);
  const ny = inspectDeadline(book.records[1], 'Asia/Seoul', now);
  assert.equal(ny.valid, false);
  assert.equal(ny.choices.length, 2);
  assert.equal(ny.record.progress, 'requested');
  const resolved = inspectDeadline({ ...book.records[1], offset: '-240', verified: true }, 'Asia/Seoul', now);
  assert.equal(resolved.converted, '2027-11-07 14:30 UTC+09:00');
  assert.equal(resolved.eligible, false, 'fiction remains excluded even after confirmation');
  assert.throws(() => deadlineCalendar(book, now), /실제 기록/);
});

test('deadline restore preserves progress but revokes confirmation and excludes completed real records', () => {
  const book = exampleDeadlineBook();
  const original = { ...book.records[0], example: false, verified: true, progress: 'requested' };
  assert.equal(inspectDeadline(original, 'Asia/Seoul', now).eligible, true);
  assert.equal(inspectDeadline({ ...original, progress: 'resolved' }, 'Asia/Seoul', now).eligible, false);
  const restored = parseDeadlineBook(JSON.stringify({ ...book, records: [original] }));
  assert.equal(restored.records[0].progress, 'requested');
  assert.equal(restored.records[0].verified, false);
  assert.equal(inspectDeadline(restored.records[0], 'Asia/Seoul', now).eligible, false);
});

test('both article attachments remain outside source body and preserve single TOC', async () => {
  for (const [id, entry] of Object.entries(ARTICLE_WORKFLOWS)) {
    const page = load(await fs.readFile(`.${entry.article}index.html`, 'utf8'));
    const aside = page('#ss-workflow-walkthrough');
    assert.equal(aside.length, 1);
    assert.equal(page('.ss-post-body #ss-workflow-walkthrough, .ss-toc #ss-workflow-walkthrough').length, 0);
    assert.equal(page('.ss-toc').length, 1);
    assert.equal(aside.next().attr('id'), 'ss-related-tools');
    assert.equal(aside.find('a').attr('href'), `${entry.route}#workflow=${id}`);
    assert.equal(aside.find('a').attr('rel'), 'noopener');
    assert.equal(aside.find('a').attr('target'), '_blank');
    assert.match(aside.text(), /본문의 자료 확인일과 별개/);
    assert.match(aside.text(), /기록을 자동으로 불러오지 않습니다/);
    assert.equal(page('#ss-article-cases-style').length, 1);
  }
  const board = load(await fs.readFile('tools/trip-board/index.html', 'utf8'));
  const deadlines = load(await fs.readFile('tools/reservation-deadlines/index.html', 'utf8'));
  assert.equal(board('.ss-trip-board > header').length, 1);
  assert.equal(deadlines('.ss-deadline-tool > header').length, 1);
});

test('context notice never imports, saves or sends data and does not promise offline site execution', async () => {
  const source = await fs.readFile('assets/article-workflows.js', 'utf8');
  assert.ok(!/fetch\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon|\.click\(|postMessage/.test(source));
  assert.match(source, /location\.hash/);
  const packing = load(await fs.readFile('honja-yeohaeng-junbimul-checklist/index.html', 'utf8'));
  assert.match(packing('#ss-workflow-walkthrough').text(), /JSON 복원 기능이 오프라인으로 작동한다는 뜻은 아닙니다/);
  const change = load(await fs.readFile('honja-yeohaeng-gamjeong-gwanri/index.html', 'utf8'));
  assert.match(change('#ss-workflow-walkthrough').text(), /지원을 미루지 않습니다/);
});
