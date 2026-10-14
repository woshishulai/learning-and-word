import { applyArticleStudy } from "./article-study.js";
import { course, words, practiceQuestions, reviewQuestion } from "./course.js";
import {
	getWord,
	cleanEntry,
	notebookQuestion,
	dictionary,
} from "./notebook.js";
import { cleanPreferences } from "./learning-aids.js";
export const DAY = 86400000;
export function emptyState() {
	return {
		version: 1,
		revision: 0,
		completed: [],
		records: {},
		active: null,
		lastResult: null,
		notebook: {},
		customWords: {},
		preferences: cleanPreferences(),
	};
}
export function normalizeAnswer(value) {
	return String(value || "")
		.trim()
		.toLowerCase()
		.replace(/[’‘]/g, "'")
		.replace(/[.!?。！？，,]+$/g, "")
		.replace(/\s+/g, " ");
}
export function dueWords(state, now = Date.now()) {
	return Object.keys(state.records)
		.filter(
			(id) =>
				(dictionary[id] || state.notebook?.[id]) &&
				state.records[id].dueAt &&
				state.records[id].dueAt <= now,
		)
		.sort((a, b) => state.records[a].dueAt - state.records[b].dueAt);
}
export function wordStatus(record) {
	if (!record) return "未学习";
	if (!record.attempts) return "已接触";
	if (!record.lastCorrect) return "待巩固";
	return record.level >= 3 ? "较稳定" : "能回忆";
}
export function currentQuestion(state) {
	const a = state.active;
	if (!a) return null;
	if (a.kind === "review")
		return a.stage === "practice" ? a.questions[a.cursor] || null : null;
	if (a.stage === "understand")
		return course.lessons[a.lessonIndex].questions[a.cursor] || null;
	if (a.stage === "practice")
		return practiceQuestions(a.lessonIndex)[a.cursor] || null;
	return null;
}
function assert(value, message) {
	if (!value) throw new Error(message);
}
function expose(state, id, now) {
	assert(getWord(state, id), "单词不存在");
	if (!state.records[id])
		state.records[id] = {
			seenAt: now,
			attempts: 0,
			level: 0,
			lastCorrect: false,
			dueAt: 0,
		};
}
function recordAnswer(state, id, correct, now, isReview) {
	expose(state, id, now);
	const r = state.records[id];
	const wasDue = r.dueAt && r.dueAt <= now;
	r.attempts += 1;
	// 提前反复练同一题不能提前提升间隔等级，也不推迟原先的复习。
	if (!isReview && r.dueAt && correct) return;
	r.lastCorrect = correct;
	r.lastAnsweredAt = now;
	if (!correct) {
		r.level = 0;
		r.dueAt = now + 10 * 60000;
	} else {
		r.level = isReview && wasDue ? Math.min(4, r.level + 1) : r.level;
		r.dueAt = now + [1, 3, 7, 14, 30][r.level] * DAY;
	}
}
// Each stage owns its cursor and submitted feedback. Navigation never awards credit.
function switchStage(active, stage) {
	active.progress ||= {};
	active.progress[active.stage] = {
		cursor: active.cursor,
		feedback: active.feedback,
	};
	let saved = active.progress[stage];
	// Recover submitted positions for sessions created before stage checkpoints existed.
	if (
		!saved &&
		active.kind === "lesson" &&
		["understand", "practice"].includes(stage)
	) {
		const questions =
			stage === "understand"
				? course.lessons[active.lessonIndex].questions
				: practiceQuestions(active.lessonIndex);
		const firstUnanswered = questions.findIndex(
			(q) => !active.answers.some((answer) => answer.questionId === q.id),
		);
		if (firstUnanswered === -1)
			saved = {
				cursor: questions.length - 1,
				feedback: active.answers.find(
					(answer) =>
						answer.questionId ===
						questions[questions.length - 1].id,
				),
			};
		else saved = { cursor: firstUnanswered, feedback: null };
	}

	active.stage = stage;
	active.cursor = saved?.cursor || 0;
	active.feedback = saved?.feedback || null;
}
export function applyEvent(previous, event, now = Date.now(), article = null) {
	assert(previous?.version === 1, "学习记录版本不兼容");
	assert(event && typeof event.type === "string", "无效操作");
	const s = JSON.parse(JSON.stringify(previous));
	s.notebook ||= {};
	s.customWords ||= {};
	s.preferences = cleanPreferences(s.preferences);
	const a = s.active;
	switch (event.type) {
		case "resetLearning": {
			assert(
				event.scope === "all" || event.scope === "article",
				"无效重学范围",
			);
			if (event.scope === "all") {
				s.completed = [];
				s.records = {};
				s.active = null;
				s.lastResult = null;
				s.articleProgress = {};
			} else {
				assert(
					/^[a-z][a-z0-9-]{0,79}$/.test(event.articleId || ""),
					"无效文章",
				);
				if (event.articleId === course.id) {
					s.completed = [];
					if (s.active?.kind === "lesson") s.active = null;
					if(s.lastResult?.kind === "lesson") s.lastResult = null;
				} else if (s.articleProgress)
					delete s.articleProgress[event.articleId];
			}
			break;
		}
		case "articleStudy":
			applyArticleStudy(s, event, article, now);
			break;
		case "preferences":
			s.preferences = cleanPreferences(event.value);
			break;
		case "notebookAdd": {
			const entry = cleanEntry(event.entry);
			assert(
				s.customWords[entry.id] ||
					Object.keys(s.customWords).length < 1000,
				"最多保存1000个自选生词",
			);
			const old = s.notebook[entry.id];
			const sources = [...(old?.sources || [])];
			if (
				!sources.some(
					(x) =>
						x.articleId === entry.articleId &&
						x.level === entry.level,
				)
			)
				sources.push({
					articleId: entry.articleId,
					level: entry.level,
					title: entry.source,
				});
			entry.sources = sources.slice(-50);
			entry.addedAt = old?.addedAt || now;
			s.notebook[entry.id] = entry;
			s.customWords[entry.id] = entry;
			expose(s, entry.id, now);
			if (!s.records[entry.id].dueAt)
				s.records[entry.id].dueAt = now + DAY;
			break;
		}
		case "notebookRemove":
			assert(s.notebook[event.wordId], "生词不存在");
			delete s.notebook[event.wordId];
			break;
		case "start": {
			const i = event.lessonIndex;
			assert(Number.isInteger(i) && course.lessons[i], "情节不存在");
			assert(
				i === 0 || s.completed.includes(course.lessons[i - 1].id),
				"请先完成前一个情节",
			);
			if (
				a &&
				a.kind === "lesson" &&
				a.lessonIndex === i &&
				a.stage !== "result"
			)
				break;
			s.active = {
				kind: "lesson",
				lessonIndex: i,
				stage: "read",
				cursor: 0,
				feedback: null,
				answers: [],
				startedAt: now,
			};
			break;
		}
		case "expose": {
			assert(a?.kind === "lesson" && a.stage === "read", "请先开始阅读");
			assert(
				course.lessons[a.lessonIndex].wordIds.includes(event.wordId),
				"不属于当前情节",
			);
			expose(s, event.wordId, now);
			break;
		}
		case "stage": {
			assert(a?.kind === "lesson", "请先开始情节学习");
			assert(
				["read", "understand", "words", "practice", "result"].includes(
					event.stage,
				),
				"学习步骤不存在",
			);
			if (a.stage === "result" && !a.result) a.result = s.lastResult;
			assert(
				event.stage !== "result" || a.result,
				"完成回忆练习后可查看收获",
			);
			switchStage(a, event.stage);
			break;
		}
		case "readDone":
			assert(a?.stage === "read", "当前不在阅读阶段");
			a.finished ||= {};
			a.finished.read = true;
			switchStage(a, "understand");
			break;
		case "nextWord": {
			assert(a?.stage === "words", "当前不在词汇阶段");
			const ids = course.lessons[a.lessonIndex].wordIds;
			expose(s, ids[a.cursor], now);
			if (a.cursor + 1 < ids.length) a.cursor++;
			else {
				a.finished ||= {};
				a.finished.words = true;
				switchStage(a, "practice");
			}
			break;
		}
		case "answer": {
			const q = currentQuestion(s);
			assert(q && !a.feedback, "这道题已提交或不可作答");
			const answer = String(event.answer || "").slice(0, 150);
			assert(normalizeAnswer(answer) || event.skip, "请先填写答案");
			const correct =
				!event.skip &&
				normalizeAnswer(answer) === normalizeAnswer(q.answer);
			a.feedback = {
				questionId: q.id,
				answer,
				correct,
				skipped: !!event.skip,
				expected: q.answer,
				explanation: q.explanation,
			};
			a.answers.push({
				...a.feedback,
				wordId: q.wordId || null,
				kind: q.kind || "understand",
			});
			if (
				q.wordId &&
				(q.kind === "transfer" || (a.kind === "review" && !a.drill))
			)
				recordAnswer(s, q.wordId, correct, now, a.kind === "review");
			break;
		}
		case "next": {
			assert(
				a?.feedback && ["understand", "practice"].includes(a.stage),
				"请先完成当前题目",
			);
			const count =
				a.kind === "review"
					? a.questions.length
					: a.stage === "understand"
						? course.lessons[a.lessonIndex].questions.length
						: practiceQuestions(a.lessonIndex).length;
			if (a.cursor + 1 < count) {
				a.cursor++;
				a.feedback = null;
				break;
			}
			if (a.stage === "understand") {
				a.finished ||= {};
				a.finished.understand = true;
				switchStage(a, "words");
				break;
			}
			const answers = a.answers.filter((x) => x.kind !== "understand");
			const result = {
				kind: a.kind,
				drill: !!a.drill,
				lessonIndex: a.lessonIndex ?? null,
				at: now,
				total: answers.length,
				correct: answers.filter((x) => x.correct).length,
				weakIds: [
					...new Set(
						answers
							.filter((x) => !x.correct && x.wordId)
							.map((x) => x.wordId),
					),
				],
				recalled: a.answers.filter(
					(x) => x.kind === "transfer" && x.correct,
				).length,
			};
			if (
				a.kind === "lesson" &&
				!s.completed.includes(course.lessons[a.lessonIndex].id)
			)
				s.completed.push(course.lessons[a.lessonIndex].id);
			a.finished ||= {};
			a.finished.practice = true;
			a.result = result;
			switchStage(a, "result");
			s.lastResult = result;
			break;
		}
		case "review": {
			let ids = event.drill
				? Object.keys(s.records).filter(
						(id) =>
							(s.records[id].attempts > 0 || s.notebook[id]) &&
							(dictionary[id] || s.notebook[id]),
					)
				: dueWords(s, now);
			if (event.notebookIds) {
				assert(Array.isArray(event.notebookIds), "无效生词范围");
				ids = ids.filter(
					(id) => event.notebookIds.includes(id) && s.notebook[id],
				);
			}
			if (event.weakOnly && s.lastResult)
				ids = ids.filter((id) => s.lastResult.weakIds.includes(id));
			assert(ids.length, "暂时没有可复习的词");
			s.active = {
				kind: "review",
				stage: "practice",
				cursor: 0,
				feedback: null,
				answers: [],
				drill: !!event.drill,
				questions: ids.map((id) =>
					words[id] && !event.notebookIds
						? reviewQuestion(id, s.records[id].level)
						: notebookQuestion(getWord(s, id)),
				),
				startedAt: now,
			};
			break;
		}
		default:
			throw new Error("不支持的学习操作");
	}
	s.revision++;
	return s;
}
