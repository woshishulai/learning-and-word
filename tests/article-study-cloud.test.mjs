import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { main } from "../server/learning-api.js";
import { validateArticle } from "../modules/article-catalog.js";
test("cloud grades stored article questions, ignores client answer keys and deduplicates retries", async () => {
	const article = validateArticle(
		JSON.parse(
			fs.readFileSync(
				new URL(
					"../examples/primary-with-questions.json",
					import.meta.url,
				),
			),
		)[0],
	);
	const maps = {
		"learning-articles": new Map([[article.id, article]]),
		"learning-students": new Map(),
	};
	globalThis.uniCloud = {
		database: () => ({
			command: { set: (v) => ({ value: v }) },
			collection: (name) => ({
				async add(doc) {
					maps[name].set(doc._id, structuredClone(doc));
					return { id: doc._id };
				},
				doc: (id) => ({
					get: async () => ({
						data: maps[name].has(id)
							? [structuredClone(maps[name].get(id))]
							: [],
					}),
				}),
				where: (filter) => ({
					update: async (patch) => {
						const doc = maps[name].get(filter._id);
						if (!doc || doc.revision !== filter.revision)
							return { updated: 0 };
						doc.state = structuredClone(patch.state.value);
						doc.revision = patch.revision;
						return { updated: 1 };
					},
				}),
			}),
		}),
	};
	try {
		const created = await main({ action: "create" });
		assert.ok(created.ok);
		const base = { action: "dispatch", ...created.credentials };
		let res = await main({
			...base,
			revision: 0,
			operationId: "read-next-operation",
			event: {
				type: "articleStudy",
				articleId: article.id,
				action: "next",
				cursor: 0,
			},
		});
		assert.ok(res.ok);
		const request = {
			...base,
			revision: 1,
			operationId: "answer-operation-1",
			event: {
				type: "articleStudy",
				articleId: article.id,
				action: "answer",
				cursor: 1,
				questionId: "where-read",
				answer: "At home.",
				expected: "At home.",
				correct: true,
			},
		};
		res = await main(request);
		assert.ok(res.ok);
		assert.equal(
			res.state.articleProgress[article.id].feedback.correct,
			false,
		);
		assert.equal(
			res.state.articleProgress[article.id].feedback.expected,
			"At school.",
		);
		assert.deepEqual((await main(request)).state, res.state);
		const foreign = await main({ action: "create" });
		assert.equal(
			(
				await main({
					action: "read",
					studentId: created.credentials.studentId,
					token: foreign.credentials.token,
				})
			).ok,
			false,
		);
	} finally {
		delete globalThis.uniCloud;
	}
});
