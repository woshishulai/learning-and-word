import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateArticle } from "../modules/article-catalog.js";
import { articlePlan, wrongQuestionIds } from "../modules/article-study.js";
import { emptyState, applyEvent } from "../modules/learning-core.js";
const raw = JSON.parse(
	fs.readFileSync(
		new URL("../examples/primary-with-questions.json", import.meta.url),
	),
)[0];
const article = validateArticle(raw);
test("import validates question references, answers, translations and duplicate ids", () => {
	assert.equal(article.questions.length, 3);
	for (const mutate of [
		(a) => (a.questions[0].paragraph = 99),
		(a) => (a.questions[0].answer = "invalid"),
		(a) => (a.questions[2].word = "unknown"),
		(a) => (a.questions[0].optionTranslations = ["one"]),
		(a) => (a.questions[1].id = a.questions[0].id),
	]) {
		const a = structuredClone(raw);
		mutate(a);
		assert.throws(() => validateArticle(a));
	}
	assert.deepEqual(
		validateArticle({ ...raw, questions: undefined }).questions,
		[],
	);
});
test("article practice resumes, locks answers, accepts alternatives and retries only mistakes without awarding mastery", () => {
	assert.deepEqual(
		articlePlan(article).map((s) =>
			s.type === "read" ? "read" : s.question.scope,
		),
		["read", "paragraph", "read", "article", "word"],
	);
	let state = emptyState();
	const send = (action, extra = {}) => {
		state = applyEvent(
			state,
			{
				type: "articleStudy",
				articleId: article.id,
				action,
				cursor: state.articleProgress?.[article.id]?.cursor || 0,
				...extra,
			},
			12345,
			article,
		);
	};
	send("next");
	send("answer", {
		questionId: "where-read",
		answer: "At home.",
		assisted: true,
	});
	assert.throws(() =>
		send("answer", { questionId: "where-read", answer: "At school." }),
	);
	state = JSON.parse(JSON.stringify(state));
	assert.equal(state.articleProgress[article.id].feedback.correct, false);
	send("next");
	send("next");
	send("answer", { questionId: "bag-colour", answer: "Blue." });
	send("next");
	send("answer", { questionId: "book-fill", answer: " Storybook " });
	send("next");
	assert.ok(state.articleProgress[article.id].finished);
	assert.deepEqual(wrongQuestionIds(state.articleProgress[article.id]), [
		"where-read",
	]);
	assert.deepEqual(state.records, {});
	assert.deepEqual(state.completed, []);
	send("retryWrong");
	assert.equal(
		articlePlan(article, state.articleProgress[article.id]).length,
		1,
	);
	send("answer", { questionId: "where-read", answer: "At school." });
	send("next");
	assert.deepEqual(wrongQuestionIds(state.articleProgress[article.id]), []);
	assert.throws(() => send("retryWrong"));
});
test("no-question articles finish reading; stale cursors, forged ids and missing context fail", () => {
	const plain = validateArticle({ ...raw, questions: [] });
	let s = applyEvent(
		emptyState(),
		{
			type: "articleStudy",
			articleId: plain.id,
			action: "next",
			cursor: 0,
		},
		0,
		plain,
	);
	assert.throws(() =>
		applyEvent(
			s,
			{
				type: "articleStudy",
				articleId: plain.id,
				action: "next",
				cursor: 0,
			},
			0,
			plain,
		),
	);
	s = applyEvent(
		s,
		{
			type: "articleStudy",
			articleId: plain.id,
			action: "next",
			cursor: 1,
		},
		0,
		plain,
	);
	assert.ok(s.articleProgress[plain.id].finished);
	assert.throws(() =>
		applyEvent(emptyState(), {
			type: "articleStudy",
			articleId: plain.id,
			action: "next",
			cursor: 0,
		}),
	);
});
