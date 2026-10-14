<template>
	<view
		><view class="page-heading"
			><text class="headline">{{ article.title }}</text
			><text class="subtitle"
				>{{ article.level }} · 点词收藏，读后从生词本练习</text
			></view
		><view class="reading-paper"
			><view
				v-for="(p, i) in article.paragraphs"
				:key="i"
				class="paragraph"
				><image
					v-if="p.image && preferences?.images !== false"
					:src="p.image"
					mode="widthFix"
					class="imported-image"
				/><button
					role="button"
					tabindex="0"
					class="text-btn"
					@click="read(p.en)"
				>
					朗读本段</button
				><button
					v-for="(sentence, si) in sentences(p.en)"
					:key="si"
					role="button"
					tabindex="0"
					class="text-btn"
					@click="read(sentence)"
				>
					朗读第 {{ si + 1 }} 句</button
				><button
					v-if="preferences?.english === false"
					role="button"
					tabindex="0"
					class="text-btn"
					@click="revealed[i] = !revealed[i]"
				>
					{{ revealed[i] ? "隐藏英文" : "展开英文" }}</button
				><view
					v-if="preferences?.english !== false || revealed[i]"
					class="english-paragraph"
					><text
						v-for="(t, j) in tokens(p.en)"
						:key="j"
						:class="{ 'word-link': t.clickable }"
						:role="t.clickable ? 'button' : undefined"
						:tabindex="t.clickable ? 0 : undefined"
						@click="t.clickable && open(t, p.en)"
						@keydown.enter="t.clickable && open(t, p.en)"
						>{{ t.text }}</text
					></view
				><text v-if="preferences?.translation" class="translation">{{
					p.zh
				}}</text
				><text v-if="preferences?.homophones" class="mnemonic">{{
					p.homophone
				}}</text></view
			><view class="panel"
				><text class="section-title">本篇词汇</text
				><view class="action-row"
					><button
						v-for="w in article.words"
						:key="w.term"
						role="button"
						tabindex="0"
						class="chip"
						@click="$emit('word', w)"
					>
						{{ w.term }}
					</button></view
				><button
					role="button"
					tabindex="0"
					class="btn primary"
					@click="$emit('notebook')"
				>
					去生词本练习
				</button></view
			></view
		></view
	>
</template>
<script>
import { tokenizeSentence } from "../modules/notebook.js";
import { speak } from "../services/speech.js";
export default {
	props: ["article", "preferences"],
	emits: ["word", "notebook"],
	data() {
		return { revealed: {} };
	},
	methods: {
		sentences(text) {
			return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
		},
		tokens: tokenizeSentence,
		read: speak,
		open(t, example) {
			const w = this.article.words.find(
				(w) => w.term.toLowerCase() === t.text.toLowerCase(),
			) ||
				t.word || { term: t.text };
			this.$emit("word", { ...w, example });
		},
	},
};
</script>
