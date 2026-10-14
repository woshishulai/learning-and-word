<template>
	<view class="word-detail"
		><view class="section-line"
			><text class="word-term">{{ word.term }}</text
			><button
				role="button"
				tabindex="0"
				class="icon-button"
				aria-label="朗读单词"
				@click="read(word.term)"
			>
				<AppIcon name="sound" /></button></view
		><text v-if="preferences?.ipa !== false" class="ipa">{{
			word.ipa
		}}</text
		><text v-if="preferences?.meaning !== false" class="word-meaning">{{
			word.meaning || "暂未收录释义，可添加到生词本补充"
		}}</text
		><view
			v-if="example && preferences?.examples !== false"
			class="word-example"
			><text class="small muted">回到故事</text
			><text class="example-en">{{ example }}</text
			><button
				role="button"
				tabindex="0"
				class="text-btn"
				@click="read(example)"
			>
				朗读例句
			</button></view
		><text v-if="preferences?.homophones && hint" class="mnemonic"
			>谐音提示：{{ hint }}</text
		><text v-if="preferences?.notes !== false" class="collocation">{{
			word.collocation
		}}</text
		><text v-if="preferences?.notes !== false" class="word-note">{{
			word.mnemonic || word.note
		}}</text
		><button
			role="button"
			tabindex="0"
			class="btn secondary"
			:disabled="busy || (saved && word._quickSave)"
			@click="$emit('save', word)"
		>
			{{
				saved
					? word._quickSave
						? "已加入我的生词本"
						: "编辑生词与记忆方法"
					: "加入我的生词本"
			}}</button
		><text v-if="speech.error" class="error-text">{{
			speech.error
		}}</text></view
	>
</template>
<script>
import { speak, speechState } from "../services/speech.js";
import { wordHints } from "../modules/learning-aids.js";
import AppIcon from "./AppIcon.vue";
export default {
	components: { AppIcon },
	props: ["word", "preferences", "saved", "busy"],
	emits: ["save"],
	data() {
		return { speech: speechState };
	},
	computed: {
		example() {
			return (
				this.word.example ||
				this.word.original?.replace("___", this.word.originalAnswer) ||
				""
			);
		},
		hint() {
			return this.word.homophone || wordHints[this.word.id] || "";
		},
	},
	methods: { read: speak },
};
</script>
