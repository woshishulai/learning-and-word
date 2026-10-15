<template>
	<LearningLayout ref="layout" :model="pageModel"
		><SentenceTraining
			v-if="!loading"
			:items="sentences"
			:title="readingArticle?.title || '生词本例句'"
	/></LearningLayout>
</template>
<script>
import learningPage from "../../modules/learning-page.js";
import LearningLayout from "../../components/LearningLayout.vue";
import SentenceTraining from "../../components/SentenceTraining.vue";
import { sentenceItems } from "../../modules/sentence-training.js";
export default {
	mixins: [learningPage],
	components: { LearningLayout, SentenceTraining },
	data() {
		return { view: "sentenceTraining", scope: {} };
	},
	onLoad(query) {
		this.scope = query || {};
	},
	computed: {
		sentences() {
			if (this.articleId)
				return sentenceItems(this.readingArticle?.paragraphs || []);
			const q = (this.scope.search || "").trim().toLowerCase();
			const entries = Object.values(this.state.notebook || {}).filter(
				(w) =>
					(w.sources || []).some(
						(s) =>
							(!this.scope.level ||
								this.scope.level === "全部" ||
								s.level === this.scope.level) &&
							(!this.scope.article ||
								this.scope.article === "全部" ||
								s.articleId === this.scope.article),
					) &&
					(!q ||
						[w.term, w.meaning, w.mnemonic]
							.join(" ")
							.toLowerCase()
							.includes(q)),
			);
			return sentenceItems(entries.map((w) => ({ en: w.example })));
		},
	},
};
</script>
