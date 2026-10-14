export const routes = {
	home: "pages/index/index",
	library: "pages/library/index",
	article: "pages/article/index",
	articleStudy: "pages/article-study/index",
	notebook: "pages/notebook/index",
	vocabulary: "pages/vocabulary/index",
	review: "pages/review/index",
	lesson: "pages/lesson/index",
};
export function routeFor(view, query = {}) {
	if (!routes[view]) throw new Error("未知页面");
	const params = Object.entries(query)
		.filter(([, v]) => v != null)
		.map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v))
		.join("&");
	return "/" + routes[view] + (params ? "?" + params : "");
}
export function navigationTarget(pages, view, query = {}) {
	const route = routes[view];
	let index = -1;
	for (let i = pages.length - 1; i >= 0; i--) {
		const page = pages[i];
		if (
			page.route === route &&
			(!["article", "articleStudy"].includes(view) ||
				String(page.options?.id || page.$page?.options?.id || "") ===
					String(query.id || ""))
		) {
			index = i;
			break;
		}
	}
	if (index === pages.length - 1 && index >= 0) return { kind: "stay" };
	if (index >= 0) return { kind: "back", delta: pages.length - 1 - index };
	return { kind: "push", url: routeFor(view, query) };
}
