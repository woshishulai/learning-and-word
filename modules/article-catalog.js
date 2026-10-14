export const levels = ["小学", "初中", "高中"];
export function validateArticle(input) {
	const fail = (message) => {
		throw new Error(message);
	};
	const text = (v, n) => {
		const value = String(v || "").trim();
		if (value.length > n) fail(`文章字段超过 ${n} 个字符，请缩短后重试`);
		return value;
	};
	const id = text(input?.id, 80);
	if (!/^[a-z][a-z0-9-]{0,79}$/.test(id))
		fail("文章 id 须以小写字母开头，只含字母、数字、连字符");
	if (id === "teenager-english-v1") fail("此 id 保留给示例文章");
	if (!levels.includes(input.level)) fail("学段须为小学、初中或高中");
	const title = text(input.title, 120);
	if (!title) fail("文章标题不能为空");
	if (
		!Array.isArray(input.paragraphs) ||
		!input.paragraphs.length ||
		input.paragraphs.length > 100
	)
		fail("文章需要 1 至 100 个段落");
	const image = (v) => {
		const s = text(v, 1500);
		if (s && !/^https:\/\//.test(s) && !/^\/static\//.test(s))
			fail("图片请使用 https 云端地址或 /static/ 路径");
		return s;
	};
	const paragraphs = input.paragraphs.map((p) => {
		const en = text(p.en, 4000);
		if (!en) fail("英文段落不能为空");
		return {
			en,
			zh: text(p.zh, 4000),
			homophone: text(p.homophone, 4000),
			image: image(p.image),
		};
	});
	if (!Array.isArray(input.words) || input.words.length > 1000)
		fail("words 必须是数组，最多 1000 词");
	const words = input.words.map((w) => {
		const term = text(w.term, 80),
			meaning = text(w.meaning, 300);
		if (!/^[a-zA-Z][a-zA-Z '\-’]{0,79}$/.test(term) || !meaning)
			fail("单词需要有效英文和词义");
		return {
			term,
			meaning,
			ipa: text(w.ipa, 100),
			homophone: text(w.homophone, 150),
			mnemonic: text(w.mnemonic, 500),
			example: text(w.example, 1000),
		};
	});
	const rawQuestions = input.questions ?? [];
	if (!Array.isArray(rawQuestions) || rawQuestions.length > 200)
		fail("questions 必须是数组，每篇最多 200 题");
	const ids = new Set();
	const questions = rawQuestions.map((q) => {
		const qid = text(q.id, 80);
		if (!/^[a-z][a-z0-9-]{0,79}$/.test(qid) || ids.has(qid))
			fail("题目 id 无效或重复");
		ids.add(qid);
		if (!["choice", "fill"].includes(q.type))
			fail("题型须为 choice 或 fill");
		if (!["paragraph", "article", "word"].includes(q.scope))
			fail("题目 scope 须为 paragraph、article 或 word");
		if (
			q.scope === "paragraph" &&
			(!Number.isInteger(q.paragraph) ||
				q.paragraph < 1 ||
				q.paragraph > paragraphs.length)
		)
			fail("段落题须关联有效段落序号，从 1 开始");
		const term = text(q.word, 80);
		if (
			q.scope === "word" &&
			!words.some((w) => w.term.toLowerCase() === term.toLowerCase())
		)
			fail("词汇题须关联本篇 words 中的单词");
		const prompt = text(q.prompt, 2000),
			explanation = text(q.explanation, 2000);
		if (!prompt || !explanation) fail("题干和解析不能为空");
		let options;
		if (q.type === "choice") {
			if (
				!Array.isArray(q.options) ||
				q.options.length < 2 ||
				q.options.length > 6
			)
				fail("选择题需要 2 至 6 个选项");
			options = q.options.map((o) => text(o, 500));
			if (
				options.some((o) => !o) ||
				new Set(options).size !== options.length
			)
				fail("选项不能为空或重复");
		}
		const answer = text(q.answer, 500);
		if (!answer || (options && !options.includes(answer)))
			fail("正确答案不能为空，选择题答案必须与某个选项一致");
		if (
			q.acceptedAnswers != null &&
			(!Array.isArray(q.acceptedAnswers) || q.acceptedAnswers.length > 10)
		)
			fail("acceptedAnswers 最多 10 项");
		if (
			q.optionTranslations != null &&
			(!options ||
				!Array.isArray(q.optionTranslations) ||
				q.optionTranslations.length !== options.length)
		)
			fail("选项翻译须与选项逐一对应");
		return {
			id: qid,
			type: q.type,
			scope: q.scope,
			paragraph: q.scope === "paragraph" ? q.paragraph : null,
			word: term,
			prompt,
			promptZh: text(q.promptZh, 2000),
			...(options ? { options } : {}),
			optionTranslations: (q.optionTranslations || []).map((o) =>
				text(o, 500),
			),
			answer,
			acceptedAnswers:
				q.type === "fill"
					? (q.acceptedAnswers || [])
							.map((o) => text(o, 500))
							.filter(Boolean)
					: [],
			explanation,
		};
	});

	return {
		id,
		title,
		level: input.level,
		englishTitle: text(input.englishTitle, 150),
		description: text(input.description, 500),
		cover: image(input.cover) || paragraphs[0].image,
		paragraphs,
		words,
		questions,
	};
}
