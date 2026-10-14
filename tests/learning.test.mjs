import test from "node:test";
import assert from "node:assert/strict";
import {
	emptyState,
	applyEvent,
	currentQuestion,
	dueWords,
	wordStatus,
	DAY,
} from "../modules/learning-core.js";
import { course, words, practiceQuestions } from "../modules/course.js";
const now = Date.UTC(2026, 9, 13, 8);
function completeLesson(previous = emptyState(), i = 0, wrongId = null) {
	let s = applyEvent(previous, { type: "start", lessonIndex: i }, now);
	s = applyEvent(s, { type: "readDone" }, now);
	for (let n = 0; n < 2; n++) {
		s = applyEvent(
			s,
			{ type: "answer", answer: currentQuestion(s).answer },
			now,
		);
		s = applyEvent(s, { type: "next" }, now);
	}
	for (let n = 0; n < 6; n++) s = applyEvent(s, { type: "nextWord" }, now);
	while (s.active.stage === "practice") {
		const q = currentQuestion(s);
		s = applyEvent(
			s,
			{
				type: "answer",
				answer:
					q.wordId === wrongId && q.kind === "transfer"
						? "wrong"
						: q.answer,
			},
			now,
		);
		s = applyEvent(s, { type: "next" }, now);
	}
	return s;
}
test("all lessons have exactly six distinct words, two comprehension questions and valid practice answers", () => {
	assert.equal(new Set(course.lessons.flatMap((x) => x.wordIds)).size, 18);
	course.lessons.forEach((l, i) => {
		assert.equal(l.wordIds.length, 6);
		assert.equal(l.questions.length, 2);
		l.wordIds.forEach((id) => assert.ok(words[id]));
		for (const q of [...l.questions, ...practiceQuestions(i)]) {
			if (q.options) assert.ok(q.options.includes(q.answer));
		}
	});
});
test("reading is exposure, never mastery; skipped prerequisites and stage jumps fail", () => {
	let s = emptyState();
	assert.throws(() => applyEvent(s, { type: "start", lessonIndex: 1 }, now));
	s = applyEvent(s, { type: "start", lessonIndex: 0 }, now);
	assert.throws(() => applyEvent(s, { type: "nextWord" }, now));
	s = applyEvent(s, { type: "expose", wordId: "dusty" }, now);
	assert.equal(wordStatus(s.records.dusty), "已接触");
	assert.deepEqual(dueWords(s, now), []);
	assert.throws(() =>
		applyEvent(s, { type: "expose", wordId: "method" }, now),
	);
});
test("progress survives serialization and duplicate answer is rejected", () => {
	let s = applyEvent(emptyState(), { type: "start", lessonIndex: 0 }, now);
	s = applyEvent(s, { type: "readDone" }, now);
	s = applyEvent(s, { type: "answer", answer: "  AT DUSK. " }, now);
	const resumed = JSON.parse(JSON.stringify(s));
	assert.equal(resumed.active.feedback.correct, true);
	assert.throws(() =>
		applyEvent(resumed, { type: "answer", answer: "At dusk." }, now),
	);
	assert.equal(
		applyEvent(resumed, { type: "start", lessonIndex: 0 }, now).active
			.feedback.correct,
		true,
	);
});
test("three full lessons unlock in sequence and produce separate reading / recall progress", () => {
	let s = emptyState();
	for (let i = 0; i < 3; i++) s = completeLesson(s, i);
	assert.equal(s.completed.length, 3);
	assert.equal(Object.keys(s.records).length, 18);
	assert.equal(s.lastResult.recalled, 6);
	assert.equal(s.lastResult.correct, 12);
	assert.equal(wordStatus(s.records.dusty), "能回忆");
	assert.equal(s.records.dusty.level, 0);
	assert.equal(currentQuestion(s), null);
	assert.throws(() =>
		applyEvent(s, { type: "answer", answer: "dusty" }, now),
	);
});
test("wrong words become due in ten minutes; correct words in one day", () => {
	const s = completeLesson(emptyState(), 0, "dusty");
	assert.equal(wordStatus(s.records.dusty), "待巩固");
	assert.equal(s.records.dusty.dueAt, now + 600000);
	assert.equal(s.records.pack.dueAt, now + DAY);
	assert.deepEqual(dueWords(s, now + 600000), ["dusty"]);
	assert.equal(s.lastResult.recalled, 5);
});
test("free practice cannot raise mastery or change scheduled reviews", () => {
	let s = completeLesson();
	const records = JSON.stringify(s.records);
	s = applyEvent(s, { type: "review", drill: true }, now);
	while (s.active.stage !== "result") {
		s = applyEvent(
			s,
			{ type: "answer", answer: currentQuestion(s).answer },
			now,
		);
		s = applyEvent(s, { type: "next" }, now);
	}
	assert.equal(JSON.stringify(s.records), records);
	assert.equal(currentQuestion(s), null);
	assert.throws(() =>
		applyEvent(s, { type: "answer", answer: "dusty" }, now),
	);
});
test("only successive due reviews increase stability; wrong review resets level", () => {
	let s = completeLesson();
	let time = now;
	for (let round = 0; round < 3; round++) {
		time = s.records.dusty.dueAt;
		s = applyEvent(s, { type: "review" }, time);
		while (s.active.stage !== "result") {
			s = applyEvent(
				s,
				{ type: "answer", answer: currentQuestion(s).answer },
				time,
			);
			s = applyEvent(s, { type: "next" }, time);
		}
	}
	assert.equal(wordStatus(s.records.dusty), "较稳定");
	assert.equal(s.records.dusty.level, 3);
	time = s.records.dusty.dueAt;
	s = applyEvent(s, { type: "review" }, time);
	s = applyEvent(s, { type: "answer", skip: true }, time);
	assert.equal(s.records.dusty.level, 0);
	assert.equal(s.records.dusty.dueAt, time + 600000);
});
test("there is no review before words are due and early repeats do not postpone due date", () => {
	const s = completeLesson();
	assert.throws(() => applyEvent(s, { type: "review" }, now));
	const repeated = completeLesson(s);
	assert.equal(repeated.records.dusty.dueAt, s.records.dusty.dueAt);
});
