import test from "node:test";
import assert from "node:assert/strict";
import { main } from "../server/learning-api.js";
// 模拟 uniCloud 数据库，仅验证函数逻辑；不代替真实服务空间联调。
test("cloud students are isolated; credentials, stale revisions and duplicate writes are checked", async () => {
	const docs = new Map();
	globalThis.uniCloud = {
		database: () => ({
			command: {
				set: (value) => ({ __replace: structuredClone(value) }),
			},
			collection: () => ({
				async add(doc) {
					docs.set(doc._id, structuredClone(doc));
					return { id: doc._id };
				},
				doc(id) {
					return {
						async get() {
							return {
								data: docs.has(id)
									? [structuredClone(docs.get(id))]
									: [],
							};
						},
					};
				},
				where(filter) {
					return {
						async update(patch) {
							const doc = docs.get(filter._id);
							if (!doc || doc.revision !== filter.revision)
								return { updated: 0 };
							assert.ok(
								patch.state.__replace,
								"state must replace the whole field, not merge into null active or retain deleted notebook words",
							);
							Object.assign(
								doc,
								structuredClone({
									...patch,
									state: patch.state.__replace,
								}),
							);
							return { updated: 1 };
						},
					};
				},
			}),
		}),
	};
	try {
		const alice = await main({ action: "create" }),
			bob = await main({ action: "create" });
		assert.ok(alice.ok && bob.ok);
		assert.notEqual(alice.credentials.studentId, bob.credentials.studentId);
		assert.equal(docs.get(alice.credentials.studentId).token, undefined);
		assert.equal(
			(
				await main({
					action: "read",
					studentId: alice.credentials.studentId,
					token: bob.credentials.token,
				})
			).ok,
			false,
		);
		const updated = await main({
 operationId: "test-operation-0001",
			action: "dispatch",
			...alice.credentials,
			revision: 0,
			event: { type: "start", lessonIndex: 0 },
		});
		assert.ok(updated.ok);
 const retried = await main({action:"dispatch",...alice.credentials,revision:0,operationId:"test-operation-0001",event:{type:"start",lessonIndex:0}});
 assert.equal(retried.ok,true);assert.equal(retried.state.revision,1);
 const reused = await main({action:"dispatch",...alice.credentials,revision:0,operationId:"test-operation-0001",event:{type:"start",lessonIndex:1}});
 assert.equal(reused.ok,false);

		assert.equal(updated.state.revision, 1);
		assert.equal(
			(await main({ action: "read", ...bob.credentials })).state.active,
			null,
		);
		assert.equal(
			(
				await main({
					action: "dispatch",
					...alice.credentials,
					revision: 0,
					event: { type: "start", lessonIndex: 0 },
				})
			).ok,
			false,
		);
		const concurrent = await Promise.all(
			[1, 2].map(() =>
				main({
					action: "dispatch",
					...alice.credentials,
					revision: 1,
					event: { type: "readDone" },
				}),
			),
		);
		assert.equal(concurrent.filter((x) => x.ok).length, 1);
		assert.equal(
			(await main({ action: "read", ...alice.credentials })).state
				.revision,
			2,
		);
		assert.equal(
			(
				await main({
					action: "read",
					studentId: { $ne: null },
					token: bob.credentials.token,
				})
			).ok,
			false,
		);
	} finally {
		delete globalThis.uniCloud;
	}
});
