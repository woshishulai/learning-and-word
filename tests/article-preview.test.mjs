import test from "node:test";
import assert from "node:assert/strict";
import { course } from "../modules/course.js";
import { courseArticle } from "../modules/article-preview.js";
test("full article preserves every paragraph in story order with images and learning aids", () => {
	assert.deepEqual(
		courseArticle.paragraphs.map((p) => p.en),
		course.lessons.flatMap((l) => l.paragraphs.map((p) => p.en)),
	);
	assert.equal(courseArticle.paragraphs.length, 9);
	for (const p of courseArticle.paragraphs) {
		assert.ok(p.image);
		assert.ok(p.zh);
		assert.ok(p.homophone);
	}
	assert.equal(courseArticle.words.length, 18);
});
