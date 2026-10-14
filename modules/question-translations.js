import { course, words } from "./course.js";
import { lookupWord } from "./notebook.js";
const comprehension = [
	["少年计划什么时候离开？", ["日出时。", "黄昏时。", "午夜时。"]],
	[
		"他为什么想离家？",
		["他想买一件外套。", "他喜欢暴风雨。", "他再也无法忍受唠叨。"],
	],
	[
		"他的搭档怎么看待他的计划？",
		["她理解他，但不赞同。", "她想和他一起离开。", "她忽视了他的感受。"],
	],
	[
		"她做了什么来帮助他？",
		[
			"她送给他一个行李箱。",
			"她和他交谈，并分享建议。",
			"她让他停止学习。",
		],
	],
	[
		"什么帮助他找到了学习英语的方法？",
		["一个新行李箱。", "朋友的学习方法。", "离家。"],
	],
	[
		"故事结束时发生了什么变化？",
		["他开始喜欢英语。", "他不再和朋友说话。", "他在暴风雨中离家了。"],
	],
];
const contexts = [
	["他躲在松垮、___的窗帘后。", "旧书上盖满了灰尘。它们___。"],
	["他躲在松垮、积满灰尘的___后。", "请拉上___，挡住光线。"],
	["他正在把大衣___进行李箱。", "旅行前，我们需要___行李。"],
	["他把大衣装进一个___。", "她把度假要穿的衣服放进一个___。"],
	["他计划在___离家。", "太阳正在落山。我们在___到达。"],
	["他再也无法___这件事了。", "噪声太大，我无法___。"],
	["他觉得老师___了他。", "请不要___向你求助的人。"],
	["她理解他正在___的事情。", "许多学生在考试前会___一段困难时期。"],
	["她完全___他的想法。", "我理解你的想法，但我___它。"],
	["她想让他___下来。", "缓缓吸一口气，让自己___下来。"],
	["她和他___交谈。", "我们见面___讨论这件事吧，不要发短信了。"],
	["她与他分享了___建议。", "老师问了___问题。"],
	["这些学习___帮助他找到了方向。", "朗读是学习英语的一种实用___。"],
	["这个少年非常___。", "对于你的帮助，我非常___。"],
	["他从朋友的话中___了很大的力量。", "尝试新事物能让你___经验。"],
	["他从朋友的话中获得了很大的___。", "她温暖的话语给了我再次尝试的___。"],
	["他已经从低落的情绪中___过来。", "重感冒后___需要时间。"],
	["他已经___英语。", "来这座城市看看，你可能会___这里美丽的公园。"],
];
const translations = new Map();
course.lessons
	.flatMap((l) => l.questions)
	.forEach((q, i) => {
		translations.set(q.prompt, comprehension[i][0]);
		q.options.forEach((o, j) =>
			translations.set(o, comprehension[i][1][j]),
		);
	});
Object.values(words).forEach((w, i) => {
	translations.set(w.original, contexts[i][0]);
	translations.set(w.transfer, contexts[i][1]);
});
Object.entries({
	ignoring: "忽视（进行中）",
	recovering: "恢复（进行中）",
	packed: "打包（过去式）",
	"falling in love": "爱上",
	"writing down": "写下",
	attended: "参加（过去式）",
	"at dusk": "在黄昏时",
	"any longer": "再；更久",
	"gone through": "经历过",
	"disagreed with": "不同意",
}).forEach(([en, zh]) => translations.set(en, zh));
export function questionTranslation(text) {
	return (
		translations.get(text) ||
		lookupWord(text)?.meaning ||
		(text.startsWith("根据词义") ? text : "")
	);
}
