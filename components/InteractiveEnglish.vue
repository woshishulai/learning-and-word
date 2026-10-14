<template>
	<text
		><text
			v-for="(token, i) in tokens"
			:key="i"
			:class="{ 'word-link': token.clickable }"
			:role="token.clickable ? 'button' : undefined"
			:tabindex="token.clickable ? 0 : undefined"
			@click.stop="open(token)"
			@keydown.enter.stop.prevent="open(token)"
			@keydown.space.stop.prevent="open(token)"
			>{{ token.text }}</text
		></text
	>
</template>
<script>
import { tokenizeSentence } from "../modules/notebook.js";
export default {
	props: ["text"],
	emits: ["word"],
	computed: {
		tokens() {
			return tokenizeSentence(this.text || "");
		},
	},
	methods: {
		open(token) {
			if (token.clickable)
				this.$emit("word", {
					...(token.word || { term: token.text }),
					spokenTerm: token.text,
					example: this.text,
				});
		},
	},
};
</script>
