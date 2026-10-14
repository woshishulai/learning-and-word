<template>
	<view
		class="reader-layout"
		:class="{ 'reader-text-only': preferences?.images === false }"
	>
		<view v-if="preferences?.images !== false" class="scene-column"
			><image
				class="scene-image"
				:src="lesson.paragraphs[scene].image"
				mode="aspectFill"
			/><view class="scene-caption"
				><text>STORY {{ String(scene + 1).padStart(2, "0") }}</text
				><view class="scene-dots"
					><button
						role="button"
						tabindex="0"
						v-for="(p, i) in lesson.paragraphs"
						:key="i"
						class="scene-dot"
						:class="{ selected: scene === i }"
						:aria-label="'查看第' + (i + 1) + '幅配图'"
						@click="scene = i" /></view></view
			><text class="scene-prompt">{{ lesson.prompt }}</text
			><text class="muted small"
				>点开英文单词查看释义，收藏到本篇文章的生词本。</text
			></view
		>
		<view class="reading-paper"
			><view class="section-line"
				><text class="section-title">{{ lesson.title }}</text></view
			>
			<view
				v-for="(p, i) in lesson.paragraphs"
				:key="i"
				v-show="i === scene"
				class="paragraph"
				@click="scene = i"
			>
				<text class="paragraph-no">0{{ i + 1 }}</text>
				<button
					v-if="preferences?.english === false"
					role="button"
					tabindex="0"
					class="text-btn"
					@click="revealed[i] = !revealed[i]"
				>
					{{ revealed[i] ? "收起英文" : "展开英文" }}</button
				><view
					v-if="preferences?.english !== false || revealed[i]"
					class="english-paragraph"
					><text
						v-for="(token, j) in tokenize(p.en)"
						:key="j"
						:class="{ 'word-link': token.clickable }"
						:role="token.clickable ? 'button' : undefined"
						:tabindex="token.clickable ? 0 : undefined"
						@click.stop="
							token.clickable &&
							$emit('word', {
								...(token.word || { term: token.text }),
								example: p.en,
							})
						"
						@keydown.enter.stop="
							token.clickable &&
							$emit('word', {
								...(token.word || { term: token.text }),
								example: p.en,
							})
						"
						>{{ token.text }}</text
					></view
				>
				<text v-if="preferences?.homophones" class="mnemonic">{{
					hint(lesson.id, i)
				}}</text
				><text v-if="preferences?.translation" class="translation">{{
					p.zh
				}}</text>
				<button
					role="button"
					tabindex="0"
					v-if="audio"
					class="listen-button"
					@click.stop="read(p.en)"
				>
					<AppIcon name="sound" :size="16" />朗读本段
				</button>
				<button
					v-for="(sentence, si) in sentences(p.en)"
					:key="si"
					role="button"
					tabindex="0"
					class="text-btn"
					@click.stop="read(sentence)"
				>
					朗读第 {{ si + 1 }} 句
				</button>
			</view>
			<view class="action-row"
				><button
					class="btn secondary"
					:disabled="scene === 0"
					@click="scene--"
				>
					上一段</button
				><text class="muted small"
					>第 {{ scene + 1 }} /
					{{ lesson.paragraphs.length }} 段</text
				><button
					v-if="scene < lesson.paragraphs.length - 1"
					class="btn primary"
					@click="scene++"
				>
					下一段
				</button></view
			>
			<view
				v-if="scene === lesson.paragraphs.length - 1"
				class="reader-end"
				><text class="muted small"
					>读懂大意就可以继续，不必一次记住所有词。</text
				><button
					role="button"
					tabindex="0"
					class="btn primary"
					:disabled="busy"
					@click="$emit('done')"
				>
					读完了，理解情节<AppIcon name="arrow-light" /></button
			></view>
		</view>
	</view>
</template>
<script>
import { tokenizeSentence, sentenceHint } from "../modules/notebook.js";
import { canSpeak, speak, stopSpeech } from "../services/speech.js";
import AppIcon from "./AppIcon.vue";
export default {
	components: { AppIcon },
	props: ["lesson", "busy", "preferences"],
	emits: ["word", "done"],
	data() {
		return {
			scene: 0,
			audio: canSpeak(),
			revealed: {},
		};
	},
	watch: {
		"lesson.id"() {
			this.scene = 0;
		},
		scene() {
			stopSpeech();
		},
	},
	methods: {
		sentences(text) {
			return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
		},
		read: speak,
		tokenize: tokenizeSentence,
		hint: sentenceHint,
	},
};
</script>
