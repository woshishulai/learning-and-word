<template>
	<LearningLayout ref="layout" :model="pageModel"
		><view>
			<view class="page-heading"
				><text class="headline">让记忆，再深一点。</text
				><text class="subtitle"
					>到期复习检查记忆，自由练习随时巩固。</text
				></view
			>
			<view class="review-page"
				><view class="review-number">{{
					dueIds.length.toString().padStart(2, "0")
				}}</view
				><text class="section-title">{{
					dueIds.length
						? "个词，等你再见一面"
						: "今天暂时没有到期的词"
				}}</text
				><text class="description">{{
					dueIds.length
						? "默认不展示学习提示，答完再看解释。独立答对才调整下次复习时间。"
						: seenCount
							? "学过的词已安排复习。你也可以先自由练习。"
							: "先完成第一个情节，复习会在这里自动安排。"
				}}</text>
				<button
					role="button"
					tabindex="0"
					v-if="
						state.active?.kind === 'review' &&
						state.active.stage !== 'result'
					"
					class="btn primary"
					@click="navigate('lesson')"
				>
					继续上次复习<AppIcon name="arrow-light" />
				</button>
				<button
					role="button"
					tabindex="0"
					v-else-if="dueIds.length"
					class="btn primary"
					:disabled="busy"
					@click="startReview(false)"
				>
					开始到期复习<AppIcon name="arrow-light" />
				</button>
				<button
					role="button"
					tabindex="0"
					v-else-if="!practicedCount"
					class="btn primary"
					@click="startLesson(nextLesson)"
				>
					开始学习<AppIcon name="arrow-light" />
				</button>
				<button
					role="button"
					tabindex="0"
					v-if="practicedCount"
					class="btn secondary"
					:disabled="busy"
					@click="startReview(true)"
				>
					自由练习已学词
				</button>
				<text v-if="practicedCount" class="muted small"
					>自由练习不会提前提升掌握等级或推迟到期复习。</text
				>
			</view>
		</view></LearningLayout
	>
</template>
<script>
import learningPage from "../../modules/learning-page.js";
import LearningLayout from "../../components/LearningLayout.vue";
export default {
	mixins: [learningPage],
	components: { LearningLayout },
	data() {
		return { view: "review" };
	},
};
</script>
