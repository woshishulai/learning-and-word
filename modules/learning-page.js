import { courseArticle } from "./article-preview.js";
import { reactive } from "vue";
import { routeFor, navigationTarget } from "../modules/navigation.js";

import { course, words, practiceQuestions } from "../modules/course.js";
import {
	emptyState,
	dueWords,
	wordStatus,
	currentQuestion,
} from "../modules/learning-core.js";
import {
	loadLearning,
	savePreferences,
	syncPreferences,
	preferencesPending,
	dispatchLearning,
	isCloud,
} from "../services/learning.js";
import { stopSpeech, configureSpeech, speak } from "../services/speech.js";
import LaunchScreen from "../components/LaunchScreen.vue";
import AppPage from "../components/AppPage.vue";
import AppDialog from "../components/AppDialog.vue";
import AppIcon from "../components/AppIcon.vue";
import LearningHome from "../components/LearningHome.vue";
import StoryReader from "../components/StoryReader.vue";
import WordCard from "../components/WordCard.vue";
import QuestionCard from "../components/QuestionCard.vue";
import ArticleLibrary from "../components/ArticleLibrary.vue";
import ImportedReader from "../components/ImportedReader.vue";
import { listArticles, readArticle } from "../services/catalog.js";
import PersonalNotebook from "../components/PersonalNotebook.vue";
import LearningSettings from "../components/LearningSettings.vue";
import { dictionary, getWord } from "../modules/notebook.js";
const session = reactive({
	state: emptyState(),
	catalog: [{ ...course, level: "高中" }],
	articles: { [course.id]: courseArticle },
	ready: false,
	draft: null,
});
let initializing = null;
export default {
	components: {
		LaunchScreen,
		AppPage,
		AppDialog,
		ArticleLibrary,
		ImportedReader,
		PersonalNotebook,
		LearningSettings,
		AppIcon,
		LearningHome,
		StoryReader,
		WordCard,
		QuestionCard,
	},
	data() {
		return {
			course,
			articleId: "",

			notebookDraft: null,
			notebookSaveRevision: 0,

			cloud: isCloud,
			loading: !session.ready,
			launchNeeded: !session.ready,
			loadError: "",
			busy: false,
			controlsOpen: false,
			preferenceTimer: null,
			preferenceSyncing: false,
			preferenceStatus: "即时生效 · 本机保存",
			error: "",
			view: "home",
			homeEntries: [
				{
					id: "library",
					title: "文章书架",
					description: "选择学段 · 进入文章",
				},
				{
					id: "notebook",
					title: "我的生词本",
					description: "按文章整理收藏",
				},
				{
					id: "vocabulary",
					title: "重点词库",
					description: "查看掌握情况",
				},
				{
					id: "review",
					title: "复习中心",
					description: "巩固今天到期的词",
				},
			],
			selectedWord: null,
			questionMeaning: "",
			search: "",
			wordFilter: "全部",
			now: Date.now(),
			timer: null,
			navItems: [
				{ id: "home", label: "今日学习" },
				{ id: "library", label: "文章书架" },
				{ id: "vocabulary", label: "重点词库" },
				{ id: "notebook", label: "生词本" },
			],
			filters: ["全部", "已接触", "待巩固", "能回忆", "较稳定"],
			steps: [
				{ id: "read", label: "读故事" },
				{ id: "understand", label: "理解情节" },
				{ id: "words", label: "认识单词" },
				{ id: "practice", label: "主动回忆" },
				{ id: "result", label: "学习收获" },
			],
		};
	},
	computed: {
		resetArticleId() {
			return (
				this.articleId ||
				(this.view === "lesson" && this.active?.kind === "lesson"
					? course.id
					: "")
			);
		},
		pageModel() {
			return this;
		},
		pageTitle() {
			return {
				home: "词境",
				library: "文章书架",
				article: this.readingArticle?.title || "文章阅读",
				articleStudy: "逐段学习",
				notebook: "我的生词本",
				vocabulary: "重点词库",
				review: "复习中心",
				lesson:
					this.active?.kind === "review" ? "词汇复习" : "文章学习",
			}[this.view];
		},
		state: {
			get() {
				return session.state;
			},
			set(value) {
				session.state = value;
			},
		},
		catalog: {
			get() {
				return session.catalog;
			},
			set(value) {
				session.catalog = value;
			},
		},
		readingArticle() {
			return session.articles[this.articleId] || null;
		},
		words() {
			return {
				...dictionary,
				...this.state.customWords,
				...this.state.notebook,
			};
		},
		active() {
			return this.state.active;
		},
		lesson() {
			return this.active?.kind === "lesson"
				? course.lessons[this.active.lessonIndex]
				: null;
		},
		result() {
			return this.active?.result || this.state.lastResult;
		},
		question() {
			return this.active?.stage === "result"
				? null
				: currentQuestion(this.state);
		},
		questionTotal() {
			return this.active.kind === "review"
				? this.active.questions.length
				: this.active.stage === "understand"
					? this.lesson.questions.length
					: practiceQuestions(this.active.lessonIndex).length;
		},
		questionLabel() {
			return this.active.kind === "review"
				? this.active.drill
					? "自由练习 · 自己想起来"
					: "到期复习 · 自己想起来"
				: this.active.stage === "understand"
					? "先读懂，再记住"
					: this.question?.kind === "context"
						? "原句回忆 · 找回故事中的词"
						: "新的语境 · 试着独立运用";
		},
		stepIndex() {
			return this.steps.findIndex((s) => s.id === this.active?.stage);
		},
		dueIds() {
			return dueWords(this.state, this.now);
		},
		seenCount() {
			return Object.keys(this.state.records).length;
		},
		practicedCount() {
			return Object.values(this.state.records).filter(
				(x) => x.attempts > 0,
			).length;
		},
		recalledCount() {
			return Object.values(this.state.records).filter(
				(x) => x.attempts && x.lastCorrect,
			).length;
		},
		stableCount() {
			return Object.values(this.state.records).filter(
				(x) => x.lastCorrect && x.level >= 3,
			).length;
		},
		nextLesson() {
			return this.active?.kind === "lesson" &&
				this.active.stage !== "result"
				? this.active.lessonIndex
				: Math.min(this.state.completed.length, 2);
		},
		navActive() {
			if (["article", "articleStudy"].includes(this.view))
				return "library";
			return ["lesson", "review"].includes(this.view)
				? "home"
				: this.view;
		},
		filteredWords() {
			const query = this.search.trim().toLowerCase();
			return Object.values(words).filter(
				(w) =>
					(this.wordFilter === "全部" ||
						this.status(w.id) === this.wordFilter) &&
					(!query ||
						`${w.term} ${w.meaning}`.toLowerCase().includes(query)),
			);
		},
	},
	onLoad(query = {}) {
		this.articleId = query.id || "";
		if (this.view === "notebook" && session.draft) {
			this.notebookDraft = session.draft;
			session.draft = null;
		}
		this.initialize();
		this.timer = setInterval(() => (this.now = Date.now()), 30000);
	},
	onShow() {
		if (this.view === "notebook" && session.draft) {
			this.notebookDraft = session.draft;
			session.draft = null;
		}
		this.schedulePreferences();
		this.now = Date.now();
	},
	onBackPress() {
		if (this.selectedWord) {
			this.closeWord();
			return true;
		}
		if (this.controlsOpen) {
			this.controlsOpen = false;
			return true;
		}
		if (this.busy) {
			uni.showToast({ title: "正在保存，请稍候", icon: "none" });
			return true;
		}
		return false;
	},
	onHide() {
		this.controlsOpen = false;
		this.selectedWord = null;
		clearTimeout(this.preferenceTimer);
		stopSpeech();
	},
	onUnload() {
		clearTimeout(this.preferenceTimer);
		clearInterval(this.timer);
		stopSpeech();
	},
	methods: {
		async resetLearning(scope) {
			if (this.busy) return;
			const articleId = this.resetArticleId;
			if (scope === "article" && !articleId) return;
			const result = await new Promise((resolve) =>
				uni.showModal({
					title:
						scope === "all" ? "清空全部学习进度？" : "本篇从头学？",
					content:
						scope === "all"
							? "将清空你的全部文章进度、答题结果、错题和单词掌握/复习记录。生词本、记忆方法、显示设置和文章内容保留。此操作无法撤销。"
							: "将清空本篇的阅读/答题进度和完成记录，从第一段重新开始。生词本、单词掌握/复习记录与其他文章保留。此操作无法撤销。",
					confirmText: "确认重学",
					cancelText: "取消",
					success: resolve,
					fail: () => resolve({ confirm: false }),
				}),
			);
			if (!result.confirm) return;
			if (await this.send({ type: "resetLearning", scope, articleId })) {
				stopSpeech();
				this.controlsOpen = false;
				uni.reLaunch({
					url:
						scope === "all"
							? routeFor("home")
							: routeFor("article", { id: articleId }),
				});
			}
		},
		changePreferences(value) {
			try {
				this.state.preferences = savePreferences(value);
				configureSpeech(this.state.preferences);
				this.preferenceStatus = "已存本机 · 即时生效";
				this.schedulePreferences();
			} catch (e) {
				this.preferenceStatus = "本机保存失败，请重试";
			}
		},
		schedulePreferences() {
			clearTimeout(this.preferenceTimer);
			if (preferencesPending())
				this.preferenceTimer = setTimeout(
					() => this.flushPreferences(),
					2000,
				);
		},
		async flushPreferences() {
			if (this.preferenceSyncing || this.loading) return;
			this.preferenceSyncing = true;
			try {
				const state = await syncPreferences();
				if (state) this.state = state;
				this.preferenceStatus = preferencesPending()
					? "已存本机 · 即时生效"
					: this.cloud
						? "已存本机 · 云端已备份"
						: "已保存在本机";
				if (preferencesPending()) this.schedulePreferences();
			} catch (e) {
				this.preferenceStatus = "已存本机 · 联网后再备份";
			} finally {
				this.preferenceSyncing = false;
			}
		},
		async chooseStage(stage) {
			if (await this.send({ type: "stage", stage }))
				this.controlsOpen = false;
		},
		async refreshCatalog() {
			try {
				this.catalog = [
					{ ...course, level: "高中" },
					...(await listArticles()),
				];
			} catch (e) {
				this.error = e.message;
			}
		},
		async openArticle(id) {
			if (id === course.id) return this.navigate("article", { id });
			try {
				const a = await readArticle(id);
				session.articles[id] = a;
				this.navigate("article", { id });
			} catch (e) {
				this.error = e.message;
			}
		},
		async beginArticleStudy() {
			if (this.articleId === course.id) {
				const index = this.nextLesson;
				if (
					!(
						this.active?.kind === "lesson" &&
						this.active.lessonIndex === index
					) &&
					!(await this.confirmSwitch())
				)
					return;
				if (
					(await this.send({ type: "start", lessonIndex: index })) &&
					(await this.send({ type: "stage", stage: "read" }))
				)
					this.navigate("lesson");
			} else this.navigate("articleStudy", { id: this.articleId });
		},
		async openReadingWord(value) {
			this.questionMeaning = "";
			const match = this.readingArticle?.words?.find(
				(w) => w.term.toLowerCase() === value.term.toLowerCase(),
			);
			const saved = Object.values(this.state.notebook || {}).find(
				(w) => w.term.toLowerCase() === value.term.toLowerCase(),
			);
			await this.openWord({
				...value,
				...match,
				...saved,
				example: value.example,
			});
			this.selectedWord._quickSave = true;
			speak(value.spokenTerm || value.term);
		},
		activateKey(event) {
			// #ifdef H5
			if (event.key === "Escape") {
				this.controlsOpen = false;
				this.closeWord();
				return;
			}
			if (!["Enter", " "].includes(event.key)) return;
			const el = event.target;
			if (el?.tagName === "UNI-BUTTON" && !el.hasAttribute("disabled")) {
				event.preventDefault();
				el.click();
			}
			// #endif
		},
		async initialize() {
			this.loading =
				!session.ready ||
				["article", "articleStudy"].includes(this.view);
			this.loadError = "";
			try {
				if (
					["article", "articleStudy"].includes(this.view) &&
					!this.articleId
				)
					throw new Error("缺少文章信息，请返回书架重新选择");
				if (!session.ready) {
					if (!initializing)
						initializing = (async () => {
							session.state = await loadLearning();
							await this.refreshCatalog();
							session.ready = true;
						})().finally(() => {
							initializing = null;
						});
					await initializing;
				}
				if (
					["article", "articleStudy"].includes(this.view) &&
					this.articleId &&
					!this.readingArticle
				)
					session.articles[this.articleId] = await readArticle(
						this.articleId,
					);
				configureSpeech(this.state.preferences);
			} catch (e) {
				this.loadError = e.message;
			} finally {
				this.loading = false;
				this.schedulePreferences();
			}
		},
		async refreshState() {
			if (this.busy) return;
			try {
				this.state = await loadLearning();
				configureSpeech(this.state.preferences);
				await this.refreshCatalog();
				this.error = "";
			} catch (e) {
				this.error = e.message;
			}
		},
		async send(event) {
			if (this.busy) return false;
			this.busy = true;
			this.error = "";
			const oldStage = this.active?.stage;
			try {
				this.state = await dispatchLearning(this.state, event);
				configureSpeech(this.state.preferences);
				this.now = Date.now();
				if (oldStage !== this.active?.stage) {
					stopSpeech();
					this.scrollTop();
				}
				return true;
			} catch (e) {
				this.error = e.message;
				uni.showToast({ title: "操作未确认，请重试", icon: "none" });
				return false;
			} finally {
				this.busy = false;
			}
		},
		goBack() {
			if (this.busy) return;
			if (this.selectedWord) return this.closeWord();
			if (this.controlsOpen) {
				this.controlsOpen = false;
				return;
			}
			stopSpeech();
			if (getCurrentPages().length > 1) uni.navigateBack();
			else uni.reLaunch({ url: routeFor("home") });
		},
		navigate(view, query = {}) {
			if (this.busy) return;
			stopSpeech();
			this.controlsOpen = false;
			this.selectedWord = null;
			const target = navigationTarget(getCurrentPages(), view, query);
			if (target.kind === "stay") return;
			if (target.kind === "back")
				uni.navigateBack({ delta: target.delta });
			else
				uni.navigateTo({
					url: target.url,
					fail: () => {
						uni.showToast({
							title: "页面打开失败，请返回后重试",
							icon: "none",
						});
					},
				});
		},
		scrollTop() {
			this.$refs.layout?.scrollToTop();
		},
		async confirmSwitch() {
			if (!this.active || this.active.stage === "result") return true;
			return new Promise((resolve) =>
				uni.showModal({
					title: "切换学习任务？",
					content:
						"当前题目进度将被新任务替换，已完成的学习和词汇记录会保留。",
					confirmText: "切换任务",
					cancelText: "继续当前",
					success: (r) => resolve(r.confirm),
				}),
			);
		},
		async startLesson(i) {
			if (this.busy) return;
			if (
				!(
					this.active?.kind === "lesson" &&
					this.active.lessonIndex === i
				) &&
				!(await this.confirmSwitch())
			) {
				this.navigate("lesson");
				return;
			}
			if (await this.send({ type: "start", lessonIndex: i }))
				this.navigate("lesson");
		},
		async startReview(drill, weakOnly = false) {
			if (this.busy) return;
			if (!(await this.confirmSwitch())) {
				this.navigate("lesson");
				return;
			}
			if (await this.send({ type: "review", drill, weakOnly }))
				this.navigate("lesson");
		},
		async openWord(value) {
			const context = ["article", "articleStudy"].includes(this.view)
				? this.readingArticle
				: null;
			this.selectedWord = {
				...(typeof value === "string"
					? getWord(this.state, value)
					: value),
				articleId: context?.id || course.id,
				source: context?.title || course.title,
				level: context?.level || "高中",
			};
			if (
				this.view === "lesson" &&
				this.active?.stage === "read" &&
				this.lesson?.wordIds.includes(this.selectedWord?.id)
			)
				await this.send({
					type: "expose",
					wordId: this.selectedWord.id,
				});
		},
		async openQuestionWord(value) {
			this.questionMeaning = "";
			await this.openWord(value);
			const source =
				this.active?.kind === "review"
					? getWord(this.state, this.question?.wordId)
					: null;
			if (source)
				Object.assign(this.selectedWord, {
					articleId: source.articleId || course.id,
					source: source.source || course.title,
					level: source.level || "高中",
				});
			this.selectedWord._quickSave = true;
			speak(value.spokenTerm || value.term);
		},
		async saveDialogWord(word) {
			if (!word._quickSave) return this.editNotebook(word);
			const meaning = word.meaning || this.questionMeaning.trim();
			if (!meaning) {
				uni.showToast({ title: "请先补充中文词义", icon: "none" });
				return;
			}
			if (
				await this.send({
					type: "notebookAdd",
					entry: { ...word, meaning },
				})
			) {
				const saved = Object.values(this.state.notebook || {}).find(
					(w) => w.term.toLowerCase() === word.term.toLowerCase(),
				);
				if (this.selectedWord === word)
					Object.assign(this.selectedWord, saved || { meaning });
				uni.showToast({ title: "已加入本篇生词本", icon: "success" });
			}
		},
		editNotebook(word) {
			const saved =
				this.state.notebook?.[word.id] ||
				Object.values(this.state.notebook || {}).find(
					(w) => w.term.toLowerCase() === word.term.toLowerCase(),
				);
			const entry = {
				...dictionary[word.id],
				...word,
				...saved,
				articleId: word.articleId || course.id,
				source: word.source || course.title,
				level: word.level || "高中",
			};
			session.draft = entry;
			this.navigate("notebook");
			if (this.view === "notebook") {
				this.notebookDraft = entry;
				session.draft = null;
			}
		},
		async saveNotebook(entry) {
			if (await this.send({ type: "notebookAdd", entry }))
				this.notebookSaveRevision++;
		},
		async reviewNotebook(ids) {
			if (!(await this.confirmSwitch())) return;
			if (
				await this.send({
					type: "review",
					drill: true,
					notebookIds: ids,
				})
			)
				this.navigate("lesson");
		},
		closeWord() {
			this.selectedWord = null;
			stopSpeech();
		},
		answer(payload) {
			this.send({ type: "answer", ...payload });
		},
		status(id) {
			return wordStatus(this.state.records[id]);
		},
		dueLabel(time) {
			if (!time) return "—";
			if (time <= this.now) return "待复习";
			const diff = time - this.now;
			if (diff < 3600000) return `${Math.ceil(diff / 60000)} 分钟后`;
			if (diff < 86400000) return `${Math.ceil(diff / 3600000)} 小时后`;
			return `${Math.ceil(diff / 86400000)} 天后`;
		},
	},
};
