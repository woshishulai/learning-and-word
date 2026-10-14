import test from "node:test";
import assert from "node:assert/strict";
import { course, words } from "../modules/course.js";
import { questionTranslation } from "../modules/question-translations.js";
import { tokenizeSentence } from "../modules/notebook.js";
test("every built-in question and option has Chinese translation; cloze blanks stay blank", () => {
	const questions = course.lessons.flatMap((l) => l.questions);
	for (const q of questions)
		for (const text of [q.prompt, ...q.options])
			assert.ok(questionTranslation(text), text);
	for (const w of Object.values(words)) {
		for (const text of [w.original, w.transfer, ...w.options])
			assert.ok(questionTranslation(text), text);
		for (const text of [w.original, w.transfer])
			assert.equal(
				(questionTranslation(text).match(/___/g) || []).length,
				(text.match(/___/g) || []).length,
			);
	}
});
test("question tokenization keeps punctuation and blanks while exposing English words", () => {
	for (const w of Object.values(words)) {
		const tokens = tokenizeSentence(w.original);
		assert.equal(tokens.map((t) => t.text).join(""), w.original);
		assert.ok(tokens.some((t) => t.clickable));
	}
});
