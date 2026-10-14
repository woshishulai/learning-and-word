import test from "node:test";
import assert from "node:assert/strict";
import {
	emptyState,
	applyEvent,
	currentQuestion,
} from "../modules/learning-core.js";
import { cleanPreferences } from "../modules/learning-aids.js";
test("display preferences are independent and migrate legacy listening mode", () => {
	assert.equal(cleanPreferences({ mode: "listening" }).english, false);
	const p = cleanPreferences({
		mode: "listening",
		english: true,
		translation: true,
		homophones: false,
		images: false,
		meaning: false,
	});
	assert.equal(p.english, true);
	assert.equal(p.translation, true);
	assert.equal(p.homophones, false);
	assert.equal(p.images, false);
	assert.equal(p.meaning, false);
	assert.equal(p.ipa, true);
});
test("free stage navigation resumes feedback without duplicate credit or false completion", () => {
	let s = applyEvent(emptyState(), { type: "start", lessonIndex: 0 });
	const event = (e) => {
		s = applyEvent(JSON.parse(JSON.stringify(s)), e);
	};
	assert.throws(() => event({ type: "stage", stage: "result" }));
	assert.throws(() => event({ type: "stage", stage: "bogus" }));
	event({ type: "stage", stage: "practice" });
	assert.equal(s.completed.length, 0);
	assert.deepEqual(s.records, {});
	for (let i = 0; i < 12; i++) {
		const q = currentQuestion(s);
		event({ type: "answer", answer: q.answer });
		const records = JSON.stringify(s.records);
		event({ type: "stage", stage: "read" });
		event({ type: "stage", stage: "words" });
		event({ type: "stage", stage: "practice" });
		assert.equal(s.active.cursor, i);
		assert.equal(s.active.feedback.questionId, q.id);
		assert.throws(() => event({ type: "answer", answer: q.answer }));
		assert.equal(JSON.stringify(s.records), records);
		event({ type: "next" });
	}
	assert.equal(s.completed.length, 1);
	assert.equal(s.active.result.total, 12);
	const records = JSON.stringify(s.records);
	event({ type: "stage", stage: "practice" });
	event({ type: "next" });
	assert.equal(s.active.result.total, 12);
	assert.equal(JSON.stringify(s.records), records);
	event({ type: "stage", stage: "understand" });
	event({ type: "answer", answer: currentQuestion(s).answer });
	event({ type: "next" });
	event({ type: "stage", stage: "read" });
	event({ type: "readDone" });
	assert.equal(s.active.stage, "understand");
	assert.equal(s.active.cursor, 1);
});
test("legacy completed session can revisit practice without submitting its answers twice", () => {
	let s = applyEvent(emptyState(), { type: "start", lessonIndex: 0 });
	s = applyEvent(s, { type: "stage", stage: "practice" });
	while (s.active.stage === "practice") {
		s = applyEvent(s, {
			type: "answer",
			answer: currentQuestion(s).answer,
		});
		s = applyEvent(s, { type: "next" });
	}
	delete s.active.progress;
	delete s.active.result;
	s = applyEvent(s, { type: "stage", stage: "read" });
	s = applyEvent(s, { type: "stage", stage: "practice" });
	assert.equal(s.active.cursor, 11);
	assert.ok(s.active.feedback);
	assert.throws(() =>
		applyEvent(s, { type: "answer", answer: currentQuestion(s).answer }),
	);
	s = applyEvent(s, { type: "next" });
	assert.equal(s.active.result.total, 12);
});
