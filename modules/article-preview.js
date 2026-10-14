import { course, words } from "./course.js";
import { sentenceHint } from "./notebook.js";
export const courseArticle = {
	...course,
	level: "高中",
	paragraphs: course.lessons.flatMap((l) =>
		l.paragraphs.map((p, i) => ({
			...p,
			homophone: sentenceHint(l.id, i),
		})),
	),
	words: Object.values(words),
};
