<template>
	<view class="full-article">
		<view class="page-heading"
			><text class="headline">{{ article.title }}</text
			><text class="subtitle">{{ article.englishTitle }}</text
			><text class="muted small">{{
				segmented || startLabel
					? "逐段学习"
					: "完整原文 · 先读懂整个故事"
			}}</text></view
		>
		<view class="action-row article-toggles">
			<button
				class="chip"
				role="button"
				:aria-pressed="!!preferences.translation"
				@click="toggle('translation')"
			>
				{{ preferences.translation ? "隐藏翻译" : "显示翻译" }}
			</button>
			<button
				class="chip"
				role="button"
				:aria-pressed="!!preferences.homophones"
				@click="toggle('homophones')"
			>
				{{ preferences.homophones ? "隐藏谐音" : "显示谐音" }}
			</button>
			<button
				class="text-btn"
				role="button"
				@click="read(visibleParagraphs.map((p) => p.en).join(' '))"
			>
				{{ segmented || startLabel ? "朗读本段" : "朗读全文" }}
			</button>
			<button
				v-if="speech.playing"
				class="text-btn"
				role="button"
				@click="stop"
			>
				停止朗读
			</button>
		</view>
		<text v-if="segmented" class="muted small"
			>第 {{ cursor + 1 }} / {{ article.paragraphs.length }} 段</text
		>
		<view class="reading-paper">
			<view
				v-for="(p, i) in visibleParagraphs"
				:key="segmented ? cursor : i"
				class="paragraph"
			>
				<image
					v-if="p.image"
					:src="p.image"
					mode="widthFix"
					class="imported-image"
				/>
				<view class="english-paragraph"
					><InteractiveEnglish :text="p.en" @word="open"
				/></view>
				<text v-if="preferences.translation" class="translation">{{
					p.zh || "本段暂未提供翻译"
				}}</text>
				<text v-if="preferences.homophones" class="mnemonic">{{
					p.homophone || "本段暂未提供谐音提示"
				}}</text>
			</view>
		</view>
		<view class="article-start">
			<text class="muted small">{{
				segmented || startLabel
					? "点词发音、收藏，按自己的节奏往下学。"
					: "先完整阅读，再逐段学习；英文词可以点读和收藏。"
			}}</text>
			<view v-if="segmented" class="action-row"
				><button
					class="btn secondary"
					:disabled="cursor === 0"
					@click="move(-1)"
				>
					上一段</button
				><button
					class="btn primary"
					@click="
						cursor < article.paragraphs.length - 1
							? move(1)
							: $emit('done')
					"
				>
					{{
						cursor < article.paragraphs.length - 1
							? "下一段"
							: "读完了，去生词本练习"
					}}
				</button></view
			>
			<button
				v-else
				class="btn primary"
				role="button"
				:disabled="busy"
				@click="$emit('start')"
			>
				{{ startLabel || "开始学习" }}<AppIcon name="arrow-light" />
			</button>
		</view>
	</view>
</template>
<script>
import InteractiveEnglish from "./InteractiveEnglish.vue";
import AppIcon from "./AppIcon.vue";
import { speak, stopSpeech, speechState } from "../services/speech.js";
export default {
	components: { InteractiveEnglish, AppIcon },
	props: ["article", "preferences", "busy", "segmented", "startLabel"],
	emits: ["word", "preferences", "start", "done", "move"],
	data() {
		return { cursor: 0, speech: speechState };
	},
	computed: {
		visibleParagraphs() {
			return this.segmented
				? [this.article.paragraphs[this.cursor]]
				: this.article.paragraphs;
		},
	},
	watch: {
		"article.id"() {
			this.cursor = 0;
		},
	},
	methods: {
		read: speak,
		stop: stopSpeech,
		toggle(key) {
			this.$emit("preferences", {
				...this.preferences,
				[key]: !this.preferences[key],
			});
		},
		move(delta) {
			stopSpeech();
			this.cursor += delta;
			this.$emit("move");
		},
		open(value) {
			const match = (this.article.words || []).find(
				(w) => w.term.toLowerCase() === value.term.toLowerCase(),
			);
			this.$emit("word", {
				...value,
				...match,
				example: value.example,
				spokenTerm: value.spokenTerm,
			});
		},
	},
};
</script>
