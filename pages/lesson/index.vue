<template>
	<LearningLayout ref="layout" :model="pageModel"
		><view v-if="active">
			<view class="lesson-toolbar"
				><text class="muted small">{{
					active.kind === "review"
						? active.drill
							? "自由练习"
							: "到期复习"
						: "少年与英语 / 情节 0" + (active.lessonIndex + 1)
				}}</text
				><text class="save-indicator">{{
					busy
						? "正在保存…"
						: cloud
							? "云端已保存"
							: "进度已保存在本机"
				}}</text></view
			>
			<view v-if="active.kind === 'lesson'" class="stepper"
				><button
					role="button"
					tabindex="0"
					:disabled="
						busy ||
						(step.id === 'result' &&
							!active.result &&
							active.stage !== 'result')
					"
					:aria-pressed="active.stage === step.id"
					@click="send({ type: 'stage', stage: step.id })"
					v-for="(step, i) in steps"
					:key="step.id"
					class="step"
					:class="{
						current: active.stage === step.id,
						passed: !!active.finished?.[step.id],
					}"
				>
					<text class="step-index">{{ i + 1 }}</text
					><text>{{ step.label }}</text>
				</button></view
			>
			<text v-if="active.kind === 'lesson'" class="stage-help muted small"
				>点击任一步骤自由学习，切换后保留各步位置。完成 12
				道回忆练习才计为本情节练习完成。</text
			>
			<ParagraphReview
				:article="active.kind === 'lesson' ? reviewArticle : null"
				:preferences="state.preferences"
				@word="openQuestionWord"
				@preferences="changePreferences"
			>
				<StoryReader
					:preferences="state.preferences"
					v-if="active.stage === 'read'"
					:key="lesson.id"
					:lesson="lesson"
					:busy="busy"
					@word="openWord"
					@done="send({ type: 'readDone' })" />
				<view v-else-if="active.stage === 'words'" class="word-study"
					><view class="word-study-heading"
						><text class="section-title">把单词放回故事里</text
						><text class="muted"
							>{{ active.cursor + 1 }} / 6</text
						></view
					><WordCard
						:preferences="state.preferences"
						:busy="busy"
						@save="editNotebook"
						:word="words[lesson.wordIds[active.cursor]]" /><view
						class="word-study-footer"
						><text class="muted small"
							>看懂词义，再试着自己想起来。</text
						><button
							role="button"
							tabindex="0"
							class="btn primary"
							:disabled="busy"
							@click="send({ type: 'nextWord' })"
						>
							{{
								active.cursor === 5
									? "开始回忆练习"
									: "下一个词"
							}}<AppIcon name="arrow-light" /></button></view
				></view>
				<QuestionCard
					v-else-if="question"
					:key="question.id"
					:question="question"
					:review-mode="active.kind === 'review'"
					:preferences="state.preferences"
					@word="openQuestionWord"
					:feedback="active.feedback"
					:number="active.cursor + 1"
					:total="questionTotal"
					:label="questionLabel"
					:busy="busy"
					@answer="answer"
					@next="send({ type: 'next' })" />
				<view
					v-else-if="active.stage === 'result' && result"
					class="result-page"
				>
					<view class="result-check"
						><AppIcon name="check" :size="34" /></view
					><text class="headline">{{
						active.kind === "review"
							? "又为记忆，添了一点力量。"
							: "一个情节，一点新的积累。"
					}}</text
					><text class="subtitle">{{
						active.kind === "lesson"
							? lesson.title + " · 回忆练习已完成"
							: "本轮" +
								(active.drill ? "自由练习" : "到期复习") +
								"已完成"
					}}</text>
					<view class="result-stats"
						><view
							><text class="stat-number"
								>{{ result.correct
								}}<text class="stat-denominator">
									/ {{ result.total }}</text
								></text
							><text class="muted">本轮词汇题答对</text></view
						><view
							><text class="stat-number">{{
								active.kind === "lesson"
									? result.recalled
									: result.total - result.weakIds.length
							}}</text
							><text class="muted">{{
								active.kind === "lesson"
									? "新语境中独立回忆"
									: "本轮回忆正确的词"
							}}</text></view
						><view
							><text class="stat-number">{{
								result.weakIds.length
							}}</text
							><text class="muted">本轮需再练的词</text></view
						></view
					>
					<view v-if="result.weakIds.length" class="result-weak"
						><text class="section-title">这些词，再见一次</text
						><view class="review-preview"
							><button
								role="button"
								tabindex="0"
								v-for="id in result.weakIds"
								:key="id"
								@click="selectedWord = words[id]"
							>
								{{ words[id].term }}
							</button></view
						><button
							role="button"
							tabindex="0"
							class="text-btn"
							:disabled="busy"
							@click="startReview(true, true)"
						>
							再练薄弱词<AppIcon
								name="arrow"
								:size="17"
							/></button
					></view>
					<text class="result-note">{{
						active.drill
							? "自由练习已完成，原有复习安排保持不变。"
							: "答对只是一个开始。系统会按每个词的表现安排后续复习。"
					}}</text
					><view class="result-actions"
						><button
							role="button"
							tabindex="0"
							class="btn secondary"
							@click="navigate('vocabulary')"
						>
							查看我的词库</button
						><button
							role="button"
							tabindex="0"
							v-if="
								active.kind === 'lesson' &&
								active.lessonIndex < 2
							"
							class="btn primary"
							:disabled="busy"
							@click="startLesson(active.lessonIndex + 1)"
						>
							继续下一个情节<AppIcon name="arrow-light" /></button
						><button
							role="button"
							tabindex="0"
							v-else
							class="btn primary"
							@click="navigate('home')"
						>
							回到今日学习<AppIcon name="arrow-light" /></button
					></view> </view
			></ParagraphReview> </view
		><view v-else class="empty-state"
			><text>还没有进行中的学习任务</text
			><button class="btn primary" @click="navigate('home')">
				回到首页选文章
			</button></view
		></LearningLayout
	>
</template>
<script>
import ParagraphReview from "../../components/ParagraphReview.vue";
import { courseArticle } from "../../modules/article-preview.js";
import learningPage from "../../modules/learning-page.js";
import LearningLayout from "../../components/LearningLayout.vue";
export default {
	mixins: [learningPage],
	components: { LearningLayout, ParagraphReview },
	data() {
		return { view: "lesson", reviewArticle: courseArticle };
	},
};
</script>
