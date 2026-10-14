import test from "node:test";
import assert from "node:assert/strict";
import {
	applyEvent,
	emptyState,
	DAY,
	dueWords,
	currentQuestion,
} from "../modules/learning-core.js";
import { cleanEntry, tokenizeSentence } from "../modules/notebook.js";
import { serializeNotebook } from "../modules/export-notebook.js";
import { validateArticle } from "../modules/article-catalog.js";
import { course } from "../modules/course.js";
const entry = {
	term: "school",
	meaning: "学校",
	level: "小学",
	articleId: "school-day",
	source: "校园的一天",
	homophone: "斯库尔",
};
test("legacy progress accepts preferences and notebook without resetting learning", () => {
	const old = {
		version: 1,
		revision: 8,
		completed: ["departure"],
		records: {},
		active: null,
		lastResult: null,
	};
	const next = applyEvent(old, { type: "notebookAdd", entry }, 100);
	assert.deepEqual(next.completed, old.completed);
	assert.equal(next.revision, 9);
	assert.equal(Object.keys(next.notebook).length, 1);
	assert.equal(old.notebook, undefined);
	const prefs = applyEvent(next, {
		type: "preferences",
		value: {
			mode: "homophone",
			homophones: true,
			accent: "en-GB",
			rate: 0.65,
		},
	});
	assert.equal(prefs.preferences.homophones, true);
	assert.equal(prefs.preferences.rate, 0.65);
});
test("same word keeps article sources, user edits and original review schedule", () => {
	let s = applyEvent(emptyState(), { type: "notebookAdd", entry }, 100);
	const id = Object.keys(s.notebook)[0];
	s = applyEvent(
		s,
		{
			type: "notebookAdd",
			entry: {
				...entry,
				articleId: "second",
				source: "另一篇",
				level: "初中",
				mnemonic: "我的方法",
			},
		},
		1000,
	);
	assert.equal(Object.keys(s.notebook).length, 1);
	assert.equal(s.notebook[id].sources.length, 2);
	assert.equal(s.notebook[id].mnemonic, "我的方法");
	assert.equal(s.records[id].dueAt, 100 + DAY);
	assert.equal(Object.keys(emptyState().notebook).length, 0);
});
test("personal notebook practice and due review use custom words, removal keeps history", () => {
	let s = applyEvent(emptyState(), { type: "notebookAdd", entry }, 100);
	const id = Object.keys(s.notebook)[0];
	const due = s.records[id].dueAt;
	s = applyEvent(s, { type: "review", drill: true, notebookIds: [id] }, 200);
	assert.equal(currentQuestion(s).answer, "school");
	s = applyEvent(s, { type: "answer", answer: "wrong" }, 200);
	assert.equal(s.records[id].dueAt, due);
	s = applyEvent(s, { type: "review" }, due);
	s = applyEvent(s, { type: "answer", answer: "wrong" }, due);
	assert.equal(s.records[id].dueAt, due + 600000);
	s = applyEvent(s, { type: "notebookRemove", wordId: id }, due);
	assert.ok(s.customWords[id]);
	assert.ok(s.records[id]);
	assert.deepEqual(dueWords(s, due + DAY), []);
	assert.throws(() => applyEvent(s, { type: "review", drill: true }));
});
test("notebook rejects invalid entries and export preserves Unicode and escapes CSV formulas", () => {
	assert.throws(() => cleanEntry({ ...entry, term: "<script>" }));
	assert.throws(() => cleanEntry({ ...entry, meaning: "" }));
	const row = {
		...entry,
		mnemonic: '=HYPERLINK("bad")',
		example: 'a,"b"\nc',
	};
	const csv = serializeNotebook([row], "csv");
	assert.ok(csv.startsWith("\uFEFF"));
	assert.ok(csv.includes("'=HYPERLINK"));
	assert.ok(csv.includes('"a,""b""\nc"'));
	assert.equal(
		JSON.parse(serializeNotebook([row], "json")).words[0].meaning,
		"学校",
	);
	assert.ok(serializeNotebook([row], "txt").includes("单词：school"));
});
test("article import validates classification and image URLs; tokens retain original text", () => {
	const a = {
		id: "school-day",
		title: "校园的一天",
		level: "小学",
		paragraphs: [
			{ en: "I read a book.", image: "https://example.com/1.jpg" },
		],
		words: [entry],
	};
	assert.equal(validateArticle(a).level, "小学");
	assert.throws(() => validateArticle({ ...a, level: "大学" }));
	assert.throws(() =>
		validateArticle({
			...a,
			paragraphs: [{ en: "test", image: "javascript:alert(1)" }],
		}),
	);
	assert.throws(() => validateArticle({ ...a, id: "teenager-english-v1" }));
	for (const p of course.lessons.flatMap((l) => l.paragraphs))
		assert.equal(
			tokenizeSentence(p.en)
				.map((t) => t.text)
				.join(""),
			p.en,
		);
});
