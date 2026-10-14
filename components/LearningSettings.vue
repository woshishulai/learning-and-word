<template>
	<view class="panel display-settings">
		<view class="section-line"
			><text class="section-title">我的学习显示</text
			><text class="muted small">{{
				status || "即时生效 · 本机保存"
			}}</text></view
		>
		<view class="settings-segments" role="group" aria-label="设置范围"
			><view
				class="segment-indicator"
				:class="{ right: group === 'word' }"
			/><button
				role="button"
				tabindex="0"
				:aria-pressed="group === 'article'"
				@click="group = 'article'"
			>
				文章显示</button
			><button
				role="button"
				tabindex="0"
				:aria-pressed="group === 'word'"
				@click="group = 'word'"
			>
				词卡显示
			</button></view
		>
		<view class="settings-list">
			<button
				v-for="item in visibleDisplays"
				:key="item.id"
				role="switch"
				:aria-label="item.label"
				:aria-checked="prefs[item.id]"
				tabindex="0"
				class="setting-row"
				:class="{ enabled: prefs[item.id] }"
				@click="change({ [item.id]: !prefs[item.id] })"
				@keydown.enter.stop.prevent="
					change({ [item.id]: !prefs[item.id] })
				"
				@keydown.space.stop.prevent="
					change({ [item.id]: !prefs[item.id] })
				"
			>
				<text>{{ item.label }}</text
				><view class="toggle-track" aria-hidden="true"
					><view class="toggle-thumb"
				/></view>
			</button>
		</view>

		<text class="muted small">文章与词卡分别设置，随时可改。</text>
		<view class="section-line"
			><button
				role="button"
				tabindex="0"
				class="text-btn disclosure-toggle"
				:aria-expanded="expanded"
				@click="expanded = !expanded"
			>
				朗读设置
				<text class="disclosure-chevron" :class="{ expanded }"
					>⌄</text
				></button
			><button
				v-if="speech.playing"
				role="button"
				tabindex="0"
				class="text-btn"
				@click="stop"
			>
				停止朗读
			</button></view
		>
		<!-- #ifdef H5 -->
		<Transition name="disclosure">
			<!-- #endif --><view v-if="expanded" class="action-row"
				><button
					v-for="a in accents"
					:key="a.id"
					role="button"
					tabindex="0"
					class="chip"
					:class="{ selected: prefs.accent === a.id }"
					@click="change({ accent: a.id })"
				>
					{{ a.label }}</button
				><button
					v-for="rate in [0.65, 0.85, 1]"
					:key="rate"
					role="button"
					tabindex="0"
					class="chip"
					:class="{ selected: prefs.rate === rate }"
					@click="change({ rate })"
				>
					{{ rate }} 倍速
				</button></view
			>
			<!-- #ifdef H5 -->
		</Transition>
		<!-- #endif -->
		<text v-if="prefs.homophones" class="muted small"
			>谐音仅作近似记忆提示，读音以英语音频为准。</text
		>
		<text v-if="speech.error" class="error-text">{{ speech.error }}</text>
	</view>
</template>
<script>
import { cleanPreferences } from "../modules/learning-aids.js";
import { stopSpeech, speechState } from "../services/speech.js";
export default {
	props: ["value", "status"],
	emits: ["change"],
	data() {
		return {
			expanded: false,
			group: "article",
			speech: speechState,
			displays: [
				{ id: "english", label: "英文原文" },
				{ id: "translation", label: "中文翻译" },
				{ id: "homophones", label: "谐音提示" },
				{ id: "images", label: "文章配图" },
				{ id: "ipa", label: "单词音标" },
				{ id: "meaning", label: "单词释义" },
				{ id: "examples", label: "词卡例句" },
				{ id: "notes", label: "记忆笔记" },
			],
			accents: [
				{ id: "en-US", label: "美式" },
				{ id: "en-GB", label: "英式" },
			],
		};
	},
	computed: {
		visibleDisplays() {
			const keys =
				this.group === "article"
					? ["english", "translation", "homophones", "images"]
					: ["ipa", "meaning", "homophones", "examples", "notes"];
			return keys.map((id) =>
				this.displays.find((item) => item.id === id),
			);
		},
		prefs() {
			return cleanPreferences(this.value);
		},
	},
	methods: {
		stop: stopSpeech,
		change(patch) {
			this.$emit("change", { ...this.prefs, ...patch });
		},
	},
};
</script>
