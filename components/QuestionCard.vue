<template>
	<view class="question-card">
		<view class="section-line"
			><text class="small muted">{{ label }}</text
			><text class="question-count"
				>{{ number }} <text class="muted">/ {{ total }}</text></text
			></view
		>
		<view class="mini-progress"
			><view :style="{ width: ((number - 1) / total) * 100 + '%' }"
		/></view>
		<text class="question-instruction">{{
			question.options
				? "选择最合适的答案"
				: "用学过的词或短语填空，试着自己想起来。"
		}}</text>
		<view class="question-prompt"
			><text v-if="reviewMode && !hintsOpen && !feedback">{{
				question.prompt
			}}</text
			><InteractiveEnglish
				v-else
				:text="question.prompt"
				@word="wordHint($event)"
		/></view>
		<button
			v-if="reviewMode && !feedback"
			role="button"
			class="text-btn"
			@click="hintsOpen = !hintsOpen"
		>
			{{ hintsOpen ? "收起学习提示" : "学习提示（翻译 / 查词）" }}</button
		><text v-if="reviewMode && hintUsed" class="muted small"
			>本题已使用提示，不计为独立掌握。</text
		><view v-if="!reviewMode || hintsOpen || feedback" class="action-row"
			><button
				class="text-btn"
				role="button"
				tabindex="0"
				:aria-expanded="showTranslation"
				@click="toggleTranslation()"
			>
				{{ showTranslation ? "隐藏翻译" : "显示翻译" }}</button
			><button
				class="text-btn"
				role="button"
				tabindex="0"
				@click="read(question.prompt.replace(/___/g, 'blank'))"
			>
				朗读题干</button
			><button
				class="text-btn"
				role="button"
				tabindex="0"
				@click="readTranslation"
				:disabled="!translate(question.prompt)"
			>
				朗读翻译</button
			><button
				v-if="speech.playing"
				class="text-btn"
				role="button"
				tabindex="0"
				@click="stop"
			>
				停止朗读
			</button></view
		>
		<text
			v-if="showTranslation && (!reviewMode || hintsOpen || feedback)"
			class="translation"
			>{{ translate(question.prompt) || "这道题暂未提供中文翻译" }}</text
		>
		<text v-if="!reviewMode || hintsOpen || feedback" class="muted small"
			>点英文词可发音、收藏；点选项左侧字母选择答案。</text
		>
		<view v-if="question.options" class="options">
			<view
				v-for="(option, i) in question.options"
				:key="option"
				class="option"
				:class="{
					chosen: choice === option,
					correct: feedback && option === feedback.expected,
					incorrect:
						feedback && !feedback.correct && choice === option,
				}"
			>
				<button
					class="option-pick"
					role="button"
					tabindex="0"
					:aria-label="
						'选择 ' + String.fromCharCode(65 + i) + '：' + option
					"
					:aria-pressed="choice === option"
					:disabled="!!feedback || busy"
					@click="choice = option"
				>
					<text class="option-letter">{{
						String.fromCharCode(65 + i)
					}}</text>
				</button>
				<view class="option-copy"
					><text v-if="reviewMode && !hintsOpen && !feedback">{{
						option
					}}</text
					><InteractiveEnglish
						v-else
						:text="option"
						@word="wordHint($event)"
					/><text
						v-if="
							showTranslation &&
							(!reviewMode || hintsOpen || feedback)
						"
						class="translation"
						>{{ translate(option) || "暂未收录翻译" }}</text
					></view
				>
				<AppIcon
					v-if="feedback && option === feedback.expected"
					name="check"
				/> </view
		></view>
		<view v-else class="answer-input-wrap"
			><input
				v-model="choice"
				class="answer-input"
				:disabled="!!feedback || busy"
				placeholder="输入英文答案"
				:maxlength="150"
				:adjust-position="true"
				confirm-type="done"
				@confirm="submit(false)"
			/><text class="muted small"
				>注意句中的词形；大小写不影响判定。</text
			></view
		>
		<view
			v-if="feedback"
			class="feedback"
			:class="{ retry: !feedback.correct }"
			><text class="feedback-title">{{
				feedback.correct
					? "回答正确，继续保持。"
					: "没关系，再把它放回语境里。"
			}}</text
			><text v-if="!feedback.correct" class="expected-answer"
				>正确答案：{{ feedback.expected }}</text
			><text class="feedback-note">{{ feedback.explanation }}</text></view
		>
		<view class="question-actions"
			><button
				role="button"
				tabindex="0"
				v-if="!feedback"
				class="text-btn"
				:disabled="busy"
				@click="submit(true)"
			>
				暂时想不起来</button
			><text v-else class="muted small">{{
				feedback.correct ? "这次回忆已记录" : "下次还会遇见它"
			}}</text
			><button
				role="button"
				tabindex="0"
				v-if="!feedback"
				class="btn primary"
				:disabled="!choice.trim() || busy"
				@click="submit(false)"
			>
				确认答案<AppIcon name="arrow-light" /></button
			><button
				role="button"
				tabindex="0"
				v-else
				class="btn primary"
				:disabled="busy"
				@click="$emit('next')"
			>
				{{ nextLabel || (number === total ? "查看下一步" : "下一题")
				}}<AppIcon name="arrow-light" /></button
		></view>
	</view>
</template>
<script>
import InteractiveEnglish from "./InteractiveEnglish.vue";
import { questionTranslation } from "../modules/question-translations.js";
import { speak, stopSpeech, speechState } from "../services/speech.js";
import AppIcon from "./AppIcon.vue";
export default {
	components: { AppIcon, InteractiveEnglish },
	props: [
		"question",
		"feedback",
		"number",
		"total",
		"label",
		"busy",
		"preferences",
		"nextLabel",
		"reviewMode",
	],
	emits: ["answer", "next", "word", "assist"],
	data() {
		return {
			speech: speechState,
			choice: this.feedback?.answer || "",
			showTranslation:
				!this.reviewMode && !!this.preferences?.translation,
			hintsOpen: false,
			hintUsed: false,
		};
	},
	watch: {
		"preferences.translation"(value) {
			if (!this.reviewMode) this.showTranslation = !!value;
		},
		"question.id"() {
			this.choice = this.feedback?.answer || "";
			this.hintUsed = false;
			this.hintsOpen = false;
			if (this.reviewMode) this.showTranslation = false;
		},
		feedback(v) {
			if (v) this.choice = v.answer;
		},
	},
	methods: {
		wordHint(value) {
			this.hintUsed = true;
			this.$emit("assist");
			this.$emit("word", value);
		},
		translate(text) {
			if (text === this.question.prompt && this.question.promptZh)
				return this.question.promptZh;
			const i = this.question.options?.indexOf(text) ?? -1;
			if (i >= 0 && this.question.optionTranslations?.[i])
				return this.question.optionTranslations[i];
			return questionTranslation(text);
		},
		toggleTranslation() {
			this.showTranslation = !this.showTranslation;
			if (this.showTranslation) {
				this.hintUsed = true;
				this.$emit("assist");
			}
		},
		read: speak,
		stop: stopSpeech,
		readTranslation() {
			this.hintUsed = true;
			this.$emit("assist");
			const lines = [
				this.translate(this.question.prompt),
				...(this.question.options || []).map(
					(option, i) =>
						`选项${String.fromCharCode(65 + i)}：${this.translate(option)}`,
				),
			];
			speak(lines.join("。 ").replace(/___/g, "空格"), {
				accent: "zh-CN",
			});
		},
		submit(skip) {
			if (this.busy || this.feedback || (!skip && !this.choice.trim()))
				return;
			this.$emit("answer", {
				answer: this.choice,
				skip,
				assisted: this.showTranslation || this.hintUsed,
			});
		},
	},
};
</script>
