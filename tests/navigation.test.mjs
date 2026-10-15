import test from "node:test";
import assert from "node:assert/strict";
import { routes, routeFor, navigationTarget } from "../modules/navigation.js";
const home = { route: routes.home },
	library = { route: routes.library },
	lesson = { route: routes.lesson };
test("each section has its own route and returns to its actual existing ancestor", () => {
	assert.equal(new Set(Object.values(routes)).size, 9);
	assert.deepEqual(navigationTarget([home, library, lesson], "library"), {
		kind: "back",
		delta: 1,
	});
	assert.deepEqual(navigationTarget([home, library, lesson], "home"), {
		kind: "back",
		delta: 2,
	});
	assert.deepEqual(navigationTarget([home, library], "library"), {
		kind: "stay",
	});
	assert.deepEqual(navigationTarget([home, library], "notebook"), {
		kind: "push",
		url: "/pages/notebook/index",
	});
});
test("article route preserves identifiers and distinguishes two articles", () => {
	assert.equal(
		routeFor("article", { id: "高 中&1" }),
		"/pages/article/index?id=%E9%AB%98%20%E4%B8%AD%261",
	);
	assert.equal(
		navigationTarget(
			[home, { route: routes.article, options: { id: "a" } }],
			"article",
			{ id: "b" },
		).kind,
		"push",
	);
	assert.equal(
		navigationTarget(
			[home, { route: routes.article, options: { id: "a" } }],
			"article",
			{ id: "a" },
		).kind,
		"stay",
	);
	assert.throws(() => routeFor("unknown"));
});
