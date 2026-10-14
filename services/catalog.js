import { isCloud } from "./learning.js";
import { validateArticle } from "../modules/article-catalog.js";
const KEY = "wordscape:articles:v1";
export async function listArticles() {
	if (!isCloud) return uni.getStorageSync(KEY) || [];
	const { result } = await uniCloud.callFunction({
		name: "learning-api",
		data: { action: "articles" },
	});
	if (!result?.ok) throw new Error(result?.message || "文章目录加载失败");
	return result.articles;
}
export async function readArticle(id) {
	if (!isCloud) {
		const a = (uni.getStorageSync(KEY) || []).find((a) => a.id === id);
		if (!a) throw new Error("文章不存在");
		return a;
	}
	const { result } = await uniCloud.callFunction({
		name: "learning-api",
		data: { action: "article", id },
	});
	if (!result?.ok) throw new Error(result?.message || "文章加载失败");
	return result.article;
}
export async function importArticles(raw, adminToken) {
	const parsed = JSON.parse(raw),
		items = (Array.isArray(parsed) ? parsed : [parsed]).map(
			validateArticle,
		);
	if (!items.length || items.length > 50)
		throw new Error("每批导入 1 至 50 篇文章");
	if (new Set(items.map((a) => a.id)).size !== items.length)
		throw new Error("本批文章 id 重复");
	if (isCloud) {
		const { result } = await uniCloud.callFunction({
			name: "learning-api",
			data: { action: "importArticles", articles: items, adminToken },
		});
		if (!result?.ok) throw new Error(result?.message || "导入失败");
	} else {
		const existing = uni.getStorageSync(KEY) || [];
		for (const a of items) {
			if (existing.some((x) => x.id === a.id))
				throw new Error("文章 id 已存在，请使用新 id：" + a.id);
		}
		uni.setStorageSync(KEY, [...existing, ...items]);
	}
	return items.length;
}
