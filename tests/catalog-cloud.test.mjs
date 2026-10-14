import test from "node:test";
import assert from "node:assert/strict";
import { main } from "../server/learning-api.js";
test("cloud article import requires admin key; learners read catalog without private student data", async () => {
	const maps = {};
	const old = process.env.ARTICLE_IMPORT_TOKEN;
	process.env.ARTICLE_IMPORT_TOKEN = "test-only-secret-0123456789-abcdef";
	globalThis.uniCloud = {
		database: () => ({
			collection: (name) => {
				const docs = (maps[name] ||= new Map());
				return {
					async add(items) {
						for (const doc of Array.isArray(items)
							? items
							: [items]) {
							assert.ok(!docs.has(doc._id));
							docs.set(doc._id, structuredClone(doc));
						}
					},
					doc: (id) => ({
						get: async () => ({
							data: docs.has(id)
								? [structuredClone(docs.get(id))]
								: [],
						}),
					}),
					orderBy() {
						let offset = 0,
							count = 100;
						return {
							skip(n) {
								offset = n;
								return this;
							},
							limit(n) {
								count = n;
								return this;
							},
							async get() {
								return {
									data: [...docs.values()].slice(
										offset,
										offset + count,
									),
								};
							},
						};
					},
				};
			},
		}),
	};
	const article = {
		id: "test-school-day",
		title: "校园的一天",
		level: "小学",
		paragraphs: [{ en: "I read a book." }],
		words: [{ term: "book", meaning: "书" }],
	};
	try {
		assert.equal(
			(await main({ action: "importArticles", articles: [article] })).ok,
			false,
		);
		assert.equal((await main({ action: "articles" })).articles.length, 0);
		assert.equal(
			(
				await main({
					action: "importArticles",
					articles: [article],
					adminToken: process.env.ARTICLE_IMPORT_TOKEN,
				})
			).ok,
			true,
		);
		assert.equal(
			(
				await main({
					action: "importArticles",
					articles: [article],
					adminToken: process.env.ARTICLE_IMPORT_TOKEN,
				})
			).ok,
			false,
		);
		const list = await main({ action: "articles" });
		assert.equal(list.articles[0].title, article.title);
		assert.equal(list.articles[0].words, undefined);
		assert.equal(
			(await main({ action: "article", id: article.id })).article.words[0]
				.term,
			"book",
		);
		assert.equal(
			(await main({ action: "article", id: { $ne: null } })).ok,
			false,
		);
	} finally {
		delete globalThis.uniCloud;
		if (old === undefined) delete process.env.ARTICLE_IMPORT_TOKEN;
		else process.env.ARTICLE_IMPORT_TOKEN = old;
	}
});
