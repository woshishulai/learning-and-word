import { words, course } from "./course.js";
import { wordHints, glossaryRows, sentenceHints } from "./learning-aids.js";
const normalize = (value) =>
	String(value || "")
		.trim()
		.toLowerCase()
		.replace(/[’‘]/g, "'");
export const dictionary = { ...words };
for (const w of Object.values(dictionary)) {
	dictionary[w.id] = {
		...w,
		homophone: wordHints[w.id] || "",
		source: course.title,
		example: w.original.replace("___", w.originalAnswer),
	};
}
for (const [term, meaning, homophone] of glossaryRows) {
	const id = "glossary-" + normalize(term);
	dictionary[id] = {
		id,
		term,
		meaning,
		homophone,
		ipa: "",
		source: course.title,
		variants: [term],
		example:
			course.lessons
				.flatMap((l) => l.paragraphs)
				.find((p) => normalize(p.en).includes(normalize(term)))?.en ||
			"",
	};
}
export const courseDictionary = Object.values(dictionary);
export function lookupWord(term) {
	const key = normalize(term);
	return (
		Object.values(dictionary).find(
			(w) =>
				normalize(w.term) === key ||
				w.variants?.some((v) => normalize(v) === key),
		) || null
	);
}
export function tokenizeSentence(sentence) {
	const variants = Object.values(words)
		.flatMap((w) => w.variants.map((v) => ({ text: v, id: w.id })))
		.sort((a, b) => b.text.length - a.text.length);
	const pattern = variants
		.map((v) => v.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
		.join("|");
	const regex = new RegExp(
		`\\b(?:${pattern})\\b|[a-z]+(?:[’'][a-z]+)?|[^a-z]+`,
		"gi",
	);
	return (sentence.match(regex) || []).map((text) => ({
		text,
		word: /[a-z]/i.test(text) ? lookupWord(text) : null,
		clickable: /[a-z]/i.test(text),
	}));
}
export function sentenceHint(lessonId, index) {
	return (
		sentenceHints[
			course.lessons.findIndex((l) => l.id === lessonId) * 3 + index
		] || ""
	);
}
export function getWord(state, id) {
	return (
		state.notebook?.[id] ||
		state.customWords?.[id] ||
		dictionary[id] ||
		null
	);
}
export function cleanEntry(value) {
	const term = String(value?.term || "")
		.trim()
		.replace(/\s+/g, " ")
		.replace(/[’‘]/g, "'");
	if (!/^[a-zA-Z][a-zA-Z '\-]{0,79}$/.test(term))
		throw new Error("请输入不超过80个字符的英文单词或短语");
	const meaning = String(value.meaning || "").trim();
	if (!meaning || meaning.length > 300)
		throw new Error("请填写词义（不超过300字）");
	const canonical = lookupWord(term);
	const id = canonical?.id || "custom-" + encodeURIComponent(normalize(term));
	const clipped = (name, len) =>
		String(value[name] || "")
			.trim()
			.slice(0, len);
	return {
		id,
		term: canonical?.term || term,
		meaning,
		ipa: clipped("ipa", 100),
		homophone: clipped("homophone", 150),
		mnemonic: clipped("mnemonic", 500),
		example: clipped("example", 1000),
		source: clipped("source", 150) || "手动添加",
		articleId: clipped("articleId", 100) || "manual",
		level: ["小学", "初中", "高中"].includes(value.level)
			? value.level
			: "高中",
	};
}
export function shuffled(values, random = Math.random) {
	const result = [...values];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}
export function notebookQuestion(word, mode = "spelling", pool = []) {
	if (mode === "choice") {
		const alternatives = [
			...new Set(
				pool
					.filter(
						(w) =>
							normalize(w.term) !== normalize(word.term) &&
							w.meaning !== word.meaning,
					)
					.map((w) => w.meaning)
					.filter(Boolean),
			),
		];
		if (!alternatives.length)
			throw new Error("可用词义不足，请先使用随机默写");
		return {
			id: word.id + "-notebook-choice",
			wordId: word.id,
			kind: "review",
			prompt: "选择这个词的中文词义：" + word.term,
			answer: word.meaning,
			options: shuffled([
				word.meaning,
				...shuffled(alternatives).slice(0, 3),
			]),
			explanation: [
				word.term + "：" + word.meaning,
				word.example,
				word.mnemonic,
			]
				.filter(Boolean)
				.join(" · "),
		};
	}
	return {
		id: word.id + "-notebook",
		wordId: word.id,
		kind: "review",
		prompt: "根据词义写出收藏的英语：" + word.meaning,
		answer: word.term,
		explanation:
			[word.example, word.mnemonic].filter(Boolean).join(" · ") ||
			word.meaning,
	};
}
