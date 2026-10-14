import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { emptyState, applyEvent } from "../modules/learning-core.js";
import { validateArticle } from "../modules/article-catalog.js";
const hash = (token) => createHash("sha256").update(token).digest("hex");
export async function main(event) {
	try {
		const db = uniCloud.database();
		const articles = db.collection("learning-articles");
		if (event.action === "articles") {
			const output = [];
			let offset = 0;
			while (true) {
				const page = await articles
					.orderBy("_id", "asc")
					.skip(offset)
					.limit(100)
					.get();
				output.push(
					...page.data.map(
						({
							_id,
							id,
							title,
							level,
							englishTitle,
							description,
							cover,
						}) => ({
							id: id || _id,
							title,
							level,
							englishTitle,
							description,
							cover,
						}),
					),
				);
				if (page.data.length < 100) break;
				offset += 100;
			}
			return { ok: true, articles: output };
		}
		if (event.action === "article") {
			if (!/^[a-z][a-z0-9-]{0,79}$/.test(event.id || ""))
				return { ok: false, message: "文章 id 无效" };
			const a = (await articles.doc(event.id).get()).data[0];
			return a
				? { ok: true, article: a }
				: { ok: false, message: "文章不存在" };
		}
		if (event.action === "importArticles") {
			const secret = process.env.ARTICLE_IMPORT_TOKEN;
			if (
				!secret ||
				secret.length < 32 ||
				typeof event.adminToken !== "string" ||
				!timingSafeEqual(
					Buffer.from(hash(secret), "hex"),
					Buffer.from(hash(event.adminToken), "hex"),
				)
			)
				return { ok: false, message: "管理员导入密钥无效或未配置" };
			if (
				!Array.isArray(event.articles) ||
				!event.articles.length ||
				event.articles.length > 50
			)
				return { ok: false, message: "每批限 1 至 50 篇文章" };
			const items = event.articles.map(validateArticle);
			if (new Set(items.map((a) => a.id)).size !== items.length)
				return { ok: false, message: "文章 id 重复" };
			for (const a of items)
				if ((await articles.doc(a.id).get()).data.length)
					return { ok: false, message: "文章 id 已存在：" + a.id };
			await articles.add(items.map((a) => ({ ...a, _id: a.id })));
			return { ok: true, count: items.length };
		}
		const collection = db.collection("learning-students");
		if (event.action === "create") {
			const id = randomBytes(16).toString("hex");
			const token = randomBytes(32).toString("hex");
			const state = emptyState();
			await collection.add({
				_id: id,
				tokenHash: hash(token),
				state,
				revision: 0,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
			return { ok: true, credentials: { studentId: id, token }, state };
		}
		if (
			!/^[a-f0-9]{32}$/.test(event.studentId || "") ||
			!/^[a-f0-9]{64}$/.test(event.token || "")
		)
			return { ok: false, message: "学习身份无效" };
		const result = await collection.doc(event.studentId).get();
		const student = result.data[0];
		if (
			!student ||
			!timingSafeEqual(
				Buffer.from(student.tokenHash, "hex"),
				Buffer.from(hash(event.token), "hex"),
			)
		)
			return { ok: false, message: "学习身份验证失败" };
		if (event.action === "read") return { ok: true, state: student.state };
		if (event.action !== "dispatch")
			return { ok: false, message: "不支持的操作" };
		const operationId = event.operationId;
		if (operationId && !/^[a-zA-Z0-9-]{8,100}$/.test(operationId))
			return { ok: false, message: "无效操作标识" };
		const fingerprint = hash(
			JSON.stringify({ revision: event.revision, event: event.event }),
		);
		const previousOperation = student.state.operations?.find(
			(item) => item.id === operationId,
		);
		if (operationId && previousOperation)
			return previousOperation.fingerprint === fingerprint
				? { ok: true, state: student.state }
				: { ok: false, message: "操作标识已使用" };
		if (event.revision !== student.revision)
			return {
				ok: false,
				code: "CONFLICT",
				message: "进度已更新，请刷新后继续",
			};
		let article = null;
		if (event.event?.type === "articleStudy") {
			if (!/^[a-z][a-z0-9-]{0,79}$/.test(event.event.articleId || ""))
				return { ok: false, message: "文章 id 无效" };
			article = (await articles.doc(event.event.articleId).get()).data[0];
			if (!article) return { ok: false, message: "文章不存在" };
		}
		const state = applyEvent(
			student.state,
			event.event,
			Date.now(),
			article,
		);
		if (operationId)
			state.operations = [
				...(student.state.operations || []),
				{ id: operationId, fingerprint },
			].slice(-32);
		// CAS: 同一版本只能更新一次，网络重试和并发请求不会重复计分。
		const write = await collection
			.where({ _id: event.studentId, revision: student.revision })
			.update({
				state: db.command.set(state),
				revision: state.revision,
				updatedAt: Date.now(),
			});
		if (write.updated !== 1)
			return {
				ok: false,
				code: "CONFLICT",
				message: "进度已更新，请刷新后继续",
			};
		return { ok: true, state };
	} catch (error) {
		console.error("learning-api", error.message);
		const retryable =
			/timeout|timed out|ECONN|ENET|EAI_AGAIN|socket|network/i.test(
				String(error.name) +
					" " +
					String(error.code) +
					" " +
					String(error.message),
			);
		return {
			ok: false,
			code: retryable ? "TEMPORARY_UNAVAILABLE" : "FAILED",
			retryable,
			message: retryable
				? "连接暂时不稳定，正在确认保存结果"
				: "操作未保存，请重试或刷新进度",
		};
	}
}
