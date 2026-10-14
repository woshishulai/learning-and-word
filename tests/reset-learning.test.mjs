import test from "node:test";
import assert from "node:assert/strict";
import { emptyState, applyEvent } from "../modules/learning-core.js";
import { course } from "../modules/course.js";
const fixture = () => ({
	...emptyState(),
	completed: ["departure"],
	records: { dusty: { level: 2, dueAt: 100 } },
	active: { kind: "lesson", stage: "read" },
	lastResult: { score: 2 },
	articleProgress: { "test-a": { cursor: 3 }, "test-b": { cursor: 2 } },
	notebook: { dusty: { term: "dusty", meaning: "灰尘" } },
	customWords: { custom: { term: "apple" } },
	operations: [{ id: "old-op" }],
});
test("all reset clears progress but preserves notebook, settings, custom words and operation history", () => {
	const before = fixture(),
		after = applyEvent(before, { type: "resetLearning", scope: "all" });
	for (const key of ["records", "articleProgress"])
		assert.deepEqual(after[key], {});
	assert.deepEqual(after.completed, []);
	assert.equal(after.active, null);
	assert.equal(after.lastResult, null);
	for (const key of ["notebook", "customWords", "preferences", "operations"])
		assert.deepEqual(after[key], before[key]);
	assert.equal(after.revision, before.revision + 1);
	assert.ok(before.active);
});
test("per-article reset affects only that article and preserves vocabulary mastery", () => {
	const before = fixture(),
		after = applyEvent(before, {
			type: "resetLearning",
			scope: "article",
			articleId: "test-a",
		});
	assert.deepEqual(after.articleProgress, { "test-b": { cursor: 2 } });
	assert.deepEqual(after.records, before.records);
	assert.deepEqual(after.active, before.active);
	const built = applyEvent(before, {
		type: "resetLearning",
		scope: "article",
		articleId: course.id,
	});
	assert.equal(built.active, null);
	assert.deepEqual(built.completed, []);
	assert.deepEqual(built.articleProgress, before.articleProgress);
	assert.deepEqual(built.records, before.records);
	assert.throws(() =>
		applyEvent(before, { type: "resetLearning", scope: "invalid" }),
	);
});
