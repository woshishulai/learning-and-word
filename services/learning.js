import { reliableDispatch } from "../modules/reliable-dispatch.js";
import { storageMode } from "../config/learning.js";
import { emptyState, applyEvent } from "../modules/learning-core.js";
import { cleanPreferences } from "../modules/learning-aids.js";
const KEY = "wordscape:v1:" + storageMode;
let credentials = null;
let latestState = null;
let writes = Promise.resolve();
const PREF_KEY = KEY + ":preferences";
function enqueue(task) {
	const result = writes.then(task);
	writes = result.catch(() => {});
	return result;
}
function withPreferences(state) {
	const cached = uni.getStorageSync(PREF_KEY);
	return {
		...state,
		preferences: cleanPreferences(cached?.value || state.preferences),
	};
}
export function savePreferences(value) {
	const preferences = cleanPreferences(value);
	uni.setStorageSync(PREF_KEY, { value: preferences, dirty: true });
	return preferences;
}
export function preferencesPending() {
	return !!uni.getStorageSync(PREF_KEY)?.dirty;
}
export function syncPreferences() {
	return enqueue(async () => {
		const snapshot = uni.getStorageSync(PREF_KEY);
		if (!latestState || !snapshot?.dirty)
			return latestState && withPreferences(latestState);
		latestState = await dispatchRaw(latestState, {
			type: "preferences",
			value: snapshot.value,
		});
		const current = uni.getStorageSync(PREF_KEY);
		if (JSON.stringify(current?.value) === JSON.stringify(snapshot.value))
			uni.setStorageSync(PREF_KEY, { ...current, dirty: false });
		return withPreferences(latestState);
	});
}

export const isCloud = storageMode === "cloud";
async function cloud(data) {
	if (typeof uniCloud === "undefined")
		throw new Error("云服务未初始化，请检查服务空间绑定");
	let response;
	try {
		response = await uniCloud.callFunction({
			name: "learning-api",
			data: { ...data, ...credentials },
		});
	} catch (error) {
		const failure = new Error("网络连接暂时不稳定，请稍后重试");
		failure.retryable =
			/timeout|timed out|ECONN|ENET|EAI_AGAIN|socket|network|网络|超时/i.test(
				String(error.name) +
					" " +
					String(error.code) +
					" " +
					String(error.message || error.errMsg),
			);
		throw failure;
	}
	const { result } = response;
	if (!result?.ok) {
		const error = new Error(
			result?.message || "云端暂时不可用，请稍后重试",
		);
		error.retryable = result?.retryable === true;
		error.code = result?.code;
		throw error;
	}
	return result;
}
export function loadLearning() {
	return enqueue(async () => {
		latestState = await loadRaw();
		return withPreferences(latestState);
	});
}
async function loadRaw() {
	const saved = uni.getStorageSync(KEY);
	if (!isCloud) {
		if (!saved) return emptyState();
		if (
			saved.version !== 1 ||
			!saved.records ||
			!Array.isArray(saved.completed)
		)
			throw new Error("本机学习记录无法读取，请保留数据并联系维护者");
		return saved;
	}
	credentials = saved || null;
	if (!credentials) {
		const res = await cloud({ action: "create" });
		credentials = res.credentials;
		uni.setStorageSync(KEY, credentials);
		return res.state;
	}
	return (await cloud({ action: "read" })).state;
}
export function dispatchLearning(state, event) {
	return enqueue(async () => {
		latestState = await dispatchRaw(latestState || state, event);
		return withPreferences(latestState);
	});
}
async function dispatchRaw(state, event) {
	if (isCloud)
		return (
			await reliableDispatch(cloud, {
				action: "dispatch",
				revision: state.revision,
				event,
				operationId:
					Date.now().toString(36) +
					"-" +
					Math.random().toString(36).slice(2) +
					"-" +
					Math.random().toString(36).slice(2),
			})
		).state;
	// 防止同一浏览器的多个标签页相互覆盖。
	const saved = uni.getStorageSync(KEY);
	if (saved && saved.revision !== state.revision)
		throw new Error("另一页面更新了进度，请刷新后继续");
	const article =
		event.type === "articleStudy"
			? (uni.getStorageSync("wordscape:articles:v1") || []).find(
					(a) => a.id === event.articleId,
				)
			: null;
	const next = applyEvent(state, event, Date.now(), article);
	uni.setStorageSync(KEY, next);
	return next;
}
