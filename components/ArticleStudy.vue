<template>
	<view>
		<view v-if="progress?.finished" class="panel"
			><text class="headline">本篇学习完成</text
			><text class="description"
				>已练习 {{ Object.keys(progress.answers).length }} 题 ·
				当前待巩固 {{ wrong.length }} 题</text
			><text class="muted small"
				>这是辅助学习记录，不代表独立掌握。错题重练不会提升间隔复习等级。</text
			><view class="action-row"
				><button
					v-if="wrong.length"
					class="btn primary"
					role="button"
					:disabled="busy"
					@click="act('retryWrong')"
				>
					重练错题</button
				><button
					class="btn secondary"
					role="button"
					@click="$emit('notebook')"
				>
					打开生词本</button
				><button class="text-btn" role="button" @click="$emit('back')">
					返回完整文章
				</button></view
			></view
		>
		<template v-else-if="step"
			><view class="section-line"
				><text>{{
					progress?.mode === "mistakes" ? "错题重练" : "逐段学习"
				}}</text
				><text>{{ cursor + 1 }} / {{ plan.length }}</text></view
			>
			<FullArticleReader
				v-if="step.type === 'read'"
				:key="cursor"
				:article="paragraphArticle"
				:preferences="preferences"
				:busy="busy"
				@word="$emit('word', $event)"
				@preferences="$emit('preferences', $event)"
				@start="act('next')"
				start-label="读完本段，继续"
			/>
			<QuestionCard
				v-else
				:key="step.question.id"
				:question="step.question"
				:feedback="progress?.feedback"
				:number="questionNumber"
				:total="questionTotal"
				:next-label="
					plan[cursor + 1]?.type === 'read'
						? '继续阅读'
						: cursor === plan.length - 1
							? '查看结果'
							: '下一题'
				"
				:label="label"
				:busy="busy"
				:preferences="preferences"
				@assist="assisted = true"
				@word="
					assisted = true;
					$emit('word', $event);
				"
				@answer="answer"
				@next="act('next')"
			/> </template
	></view>
</template>
<script>
import { articlePlan, wrongQuestionIds } from "../modules/article-study.js";
import FullArticleReader from "./FullArticleReader.vue";
import QuestionCard from "./QuestionCard.vue";
export default {
	components: { FullArticleReader, QuestionCard },
	props: ["article", "progress", "preferences", "busy"],
	emits: ["event", "word", "preferences", "notebook", "back"],
	data() {
		return { assisted: !!this.preferences?.translation };
	},
	computed: {
		questionNumber() {
			return this.plan
				.slice(0, this.cursor + 1)
				.filter((s) => s.type === "question").length;
		},
		questionTotal() {
			return this.plan.filter((s) => s.type === "question").length;
		},
		cursor() {
			return this.progress?.cursor || 0;
		},
		plan() {
			return articlePlan(this.article, this.progress);
		},
		step() {
			return this.plan[this.cursor];
		},
		wrong() {
			return wrongQuestionIds(this.progress);
		},
		label() {
			return (
				{
					paragraph: "段落理解",
					article: "全文理解",
					word: "词汇运用",
				}[this.step?.question?.scope] || "逐段阅读"
			);
		},
		paragraphArticle() {
			return {
				...this.article,
				paragraphs: [this.article.paragraphs[this.step.paragraphIndex]],
			};
		},
	},
	watch: {
		cursor() {
			this.assisted = !!this.preferences?.translation;
		},
	},
	methods: {
		act(action, extra = {}) {
			this.$emit("event", {
				type: "articleStudy",
				articleId: this.article.id,
				cursor: this.cursor,
				action,
				...extra,
			});
		},
		answer(payload) {
			this.act("answer", {
				...payload,
				questionId: this.step.question.id,
				assisted: this.assisted || payload.assisted,
			});
		},
	},
};
</script>
