// Practice results are separate from spaced-repetition mastery records.
export function articlePlan(article, progress) {
	const questions = article.questions || [];
	if (progress?.mode === "mistakes")
		return progress.questionIds
			.map((id) => ({
				type: "question",
				question: questions.find((q) => q.id === id),
			}))
			.filter((s) => s.question);
	return [
		...article.paragraphs.flatMap((p, i) => [
			{ type: "read", paragraphIndex: i },
			...questions
				.filter((q) => q.scope === "paragraph" && q.paragraph === i + 1)
				.map((question) => ({ type: "question", question })),
		]),
		...questions
			.filter((q) => q.scope === "article")
			.map((question) => ({ type: "question", question })),
		...questions
			.filter((q) => q.scope === "word")
			.map((question) => ({ type: "question", question })),
	];
}
export function wrongQuestionIds(progress) {
	return Object.entries(progress?.answers || {})
		.filter(([, a]) => !a.correct)
		.map(([id]) => id);
}
const normal = (v) =>
	String(v || "")
		.trim()
		.toLowerCase()
		.replace(/[’‘]/g, "'")
		.replace(/[.!?。！？，,]+$/g, "")
		.replace(/\s+/g, " ");
export function applyArticleStudy(state, event, article, now) {
	const require = (ok, message) => {
		if (!ok) throw new Error(message);
	};
	require(article && article.id === event.articleId, "文章不存在");
	state.articleProgress ||= {};
	let p = Object.prototype.hasOwnProperty.call(
		state.articleProgress,
		article.id,
	)
		? state.articleProgress[article.id]
		: null;
	if (!p) {
		require(Object.keys(state.articleProgress).length <
			500, "已达到学习文章数量上限");
		p = state.articleProgress[article.id] = {
			cursor: 0,
			answers: {},
			feedback: null,
			finished: false,
			mode: "all",
			startedAt: now,
		};
	}
	if (event.action === "start") return;
	if (event.action === "retryWrong") {
		require(p.finished, "请先完成本次学习");
		const ids = wrongQuestionIds(p);
		require(ids.length, "没有待重练错题");
		Object.assign(p, {
			mode: "mistakes",
			questionIds: ids,
			cursor: 0,
			feedback: null,
			finished: false,
		});
		return;
	}
	const plan = articlePlan(article, p),
		step = plan[p.cursor];
	require(!p.finished && step, "本次学习已结束");
	require(event.cursor === p.cursor, "题目位置已更新，请刷新");
	if (event.action === "answer") {
		require(step.type === "question" &&
			step.question.id === event.questionId, "题目不匹配");
		require(!p.feedback, "请勿重复提交答案");
		require(typeof event.answer === "string" &&
			event.answer.length <= 500, "答案无效");
		const q = step.question;
		require(event.skip || event.answer.trim(), "请填写答案");
		const correct =
			!event.skip &&
			[q.answer, ...(q.acceptedAnswers || [])].some(
				(a) => normal(a) === normal(event.answer),
			);
		p.feedback = {
			answer: event.answer,
			correct,
			expected: q.answer,
			explanation: q.explanation,
			assisted: !!event.assisted,
		};
		p.answers[q.id] = { ...p.feedback, answeredAt: now };
	} else if (event.action === "next") {
		require(step.type === "read" || p.feedback, "请先提交答案");
		p.cursor++;
		p.feedback = null;
		if (p.cursor >= plan.length) {
			p.finished = true;
			p.completedAt = now;
		}
	} else throw new Error("无效的文章学习操作");
	p.updatedAt = now;
}
