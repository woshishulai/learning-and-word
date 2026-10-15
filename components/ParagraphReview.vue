<template>
	<view>
		<view v-if="article?.paragraphs?.length" class="paragraph-navigation">
			<picker
				:range="labels"
				:value="Math.max(0, selected)"
				@change="select(Number($event.detail.value))"
			>
				<view class="notebook-picker"
					>{{
						selected < 0 ? "回看原文 · 选择段落" : labels[selected]
					}}
					▾</view
				>
			</picker>
			<view class="action-row"
				><button role="button" class="text-btn" @click="trainSentences">
					句子训练
				</button>
				<button role="button" class="text-btn" @click="select(0)">
					看第一段
				</button>
				<template v-if="selected >= 0">
					<button
						role="button"
						class="text-btn"
						:disabled="selected === 0"
						@click="select(selected - 1)"
					>
						上一段
					</button>
					<button
						role="button"
						class="text-btn"
						:disabled="selected === article.paragraphs.length - 1"
						@click="select(selected + 1)"
					>
						下一段
					</button>
					<button role="button" class="chip selected" @click="close">
						返回当前学习
					</button>
				</template>
			</view>
		</view>
		<FullArticleReader
			v-if="selected >= 0"
			:key="selected"
			:article="preview"
			:preferences="preferences"
			start-label="返回当前学习"
			@start="close"
			@word="$emit('word', $event)"
			@preferences="$emit('preferences', $event)"
		/>
		<view v-show="selected < 0"><slot /></view>
	</view>
</template>
<script>
import { routeFor } from "../modules/navigation.js";
import FullArticleReader from "./FullArticleReader.vue";
import { stopSpeech } from "../services/speech.js";
export default {
	components: { FullArticleReader },
	props: ["article", "preferences"],
	emits: ["word", "preferences", "inspect"],
	data() {
		return { selected: -1 };
	},
	computed: {
		labels() {
			return this.article.paragraphs.map(
				(_, i) =>
					`第 ${i + 1} 段 / 共 ${this.article.paragraphs.length} 段`,
			);
		},
		preview() {
			return {
				...this.article,
				paragraphs: [this.article.paragraphs[this.selected]],
			};
		},
	},
	watch: {
		"article.id"() {
			this.close();
		},
	},
	methods: {
		trainSentences() {
			stopSpeech();
			uni.navigateTo({
				url: routeFor("sentenceTraining", { id: this.article.id }),
			});
		},
		select(i) {
			stopSpeech();
			this.selected = i;
			this.$emit("inspect");
		},
		close() {
			stopSpeech();
			this.selected = -1;
		},
	},
};
</script>
<style scoped>
.paragraph-navigation {
	margin-bottom: 20px;
	padding: 12px 16px;
	border-radius: 16px;
	background: #f1f5f2;
}
</style>
