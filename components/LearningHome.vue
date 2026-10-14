<template>
	<view>
		<view class="welcome"
			><text class="headline">今天，从一个故事开始。</text
			><text class="subtitle">在情境中理解，在回忆中记住。</text></view
		>
		<view class="feature">
			<image
				class="feature-image"
				:src="course.cover"
				mode="aspectFill"
			/>
			<view class="feature-copy">
				<text class="story-title">{{ course.title }}</text
				><text class="english-title">{{ course.englishTitle }}</text>
				<view class="short-rule" /><text class="description">{{
					course.description
				}}</text>
				<text class="muted feature-meta">3 个情节 / 18 个重点词</text>
				<button
					role="button"
					tabindex="0"
					class="btn primary"
					@click="$emit('start', nextIndex)"
				>
					{{ cta }}<AppIcon name="arrow-light" />
				</button>
			</view>
		</view>
		<view class="home-bottom">
			<view class="route-panel"
				><view class="section-line"
					><text class="section-title">学习路线</text
					><text class="muted small"
						>{{ state.completed.length }} / 3 已完成</text
					></view
				>
				<button
					role="button"
					tabindex="0"
					v-for="(lesson, i) in course.lessons"
					:key="lesson.id"
					class="route-row"
					:disabled="locked(i)"
					@click="$emit('start', i)"
				>
					<view class="route-number"
						><AppIcon
							v-if="state.completed.includes(lesson.id)"
							name="check"
						/><text v-else>0{{ i + 1 }}</text></view
					>
					<text class="route-name">{{ lesson.title }}</text
					><text class="muted small route-label">{{
						locked(i)
							? "完成上一节后开启"
							: state.completed.includes(lesson.id)
								? "重新阅读"
								: "6 个重点词"
					}}</text
					><AppIcon name="chevron" :size="18" />
				</button>
			</view>
			<view class="review-callout"
				><text class="section-title">让记忆，再深一点。</text
				><text class="description">{{
					dueCount
						? `${dueCount} 个词到了复习时间。`
						: "学过的词，会在这里等你回来。"
				}}</text
				><button
					role="button"
					tabindex="0"
					class="btn primary"
					@click="$emit('review')"
				>
					查看复习<AppIcon name="arrow-light" /></button
			></view>
		</view>
	</view>
</template>
<script>
import AppIcon from "./AppIcon.vue";
export default {
	components: { AppIcon },
	props: ["course", "state", "dueCount"],
	emits: ["start", "review"],
	computed: {
		nextIndex() {
			const a = this.state.active;
			return a?.kind === "lesson" && a.stage !== "result"
				? a.lessonIndex
				: Math.min(this.state.completed.length, 2);
		},
		cta() {
			return "阅读全文";
		},
	},
	methods: {
		locked(i) {
			return (
				i > 0 &&
				!this.state.completed.includes(this.course.lessons[i - 1].id)
			);
		},
	},
};
</script>
