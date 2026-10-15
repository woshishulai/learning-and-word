import test from "node:test";
import assert from "node:assert/strict";
import { applyEvent, emptyState, DAY } from "../modules/learning-core.js";
import {
	sentenceItems,
	sentenceTokens,
	scrambleSentence,
	normalizeSentence,
} from "../modules/sentence-training.js";

test("notebook choice uses unique meanings and scoped words; assisted due recall does not postpone review", () => {
	let s = emptyState();
	for (const [term, meaning] of [
		["cat", "猫"],
		["dog", "狗"],
		["kitten", "猫"],
	])
		s = applyEvent(
			s,
			{ type: "notebookAdd", entry: { term, meaning } },
			100,
		);
	const ids = Object.keys(s.notebook);
	s = applyEvent(
		s,
		{
			type: "review",
			drill: true,
			notebookIds: [ids[0]],
			notebookMode: "choice",
		},
		101,
	);
	assert.equal(s.active.questions.length, 1);
	const q = s.active.questions[0];
	assert.equal(q.wordId, ids[0]);
	assert.equal(q.answer, "猫");
	assert.equal(new Set(q.options).size, q.options.length);
	assert.equal(q.options.filter((x) => x === q.answer).length, 1);
	s = applyEvent(
		s,
		{
			type: "review",
			drill: true,
			notebookIds: ids,
			notebookMode: "spelling",
		},
		102,
	);
	assert.deepEqual(
		new Set(s.active.questions.map((q) => q.wordId)),
		new Set(ids),
	);
	assert.ok(s.active.questions.every((q) => !q.options));
	s = applyEvent(s, { type: "review", drill: false }, DAY * 2);
	const id = s.active.questions[0].wordId;
	const old = structuredClone(s.records[id]);
	s = applyEvent(
		s,
		{
			type: "answer",
			answer: s.active.questions[0].answer,
			assisted: true,
		},
		DAY * 2,
	);
	assert.deepEqual(s.records[id], old);
	assert.equal(s.active.feedback.assisted, true);
	assert.equal(s.active.feedback.correct, true);
});

test("sentence exercises preserve repeated tokens, deduplicate examples and do not expose paragraph translations as sentence translations", () => {
	const items = sentenceItems([
		{ en: "I like it. I like it. Do you?", zh: "整段翻译" },
		{ en: "Hello!", zh: "你好" },
	]);
	assert.equal(items.length, 3);
	assert.equal(items[0].zh, "");
	assert.equal(items[2].zh, "你好");
	const text = "I think I can.";
	assert.deepEqual(
		scrambleSentence(text).sort((a, b) => a.id - b.id),
		sentenceTokens(text),
	);
	assert.equal(
		normalizeSentence("  I like apples! "),
		normalizeSentence("i like apples."),
	);
	assert.notEqual(
		normalizeSentence("I can't."),
		normalizeSentence("I cant."),
	);
});
