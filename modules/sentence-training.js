import { shuffled } from "./notebook.js";
export function sentenceItems(paragraphs) {
	const seen = new Set();
	return paragraphs
		.flatMap((p) => {
			const parts =
				String(p.en || "").match(/[^.!?]+(?:[.!?]+["”']?|$)/g) || [];
			return parts.map((en) => ({
				en: en.trim(),
				zh: parts.length === 1 ? p.zh || "" : "",
			}));
		})
		.filter(
			(p) =>
				p.en &&
				/[a-z]/i.test(p.en) &&
				!seen.has(p.en) &&
				seen.add(p.en),
		);
}
export function sentenceTokens(text) {
	return (text.match(/\S+/g) || []).map((text, id) => ({ text, id }));
}
export function scrambleSentence(text) {
	const original = sentenceTokens(text);
	const result = shuffled(original);
	if (result.length > 1 && result.every((t, i) => t.id === original[i].id))
		result.push(result.shift());
	return result;
}
export function normalizeSentence(text) {
	return String(text)
		.toLowerCase()
		.replace(/[’‘]/g, "'")
		.replace(/[^a-z0-9'\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}
