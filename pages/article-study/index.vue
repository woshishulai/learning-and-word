<template>
	<LearningLayout ref="layout" :model="pageModel"
		><ArticleStudy
			v-if="readingArticle"
			:article="readingArticle"
			:progress="state.articleProgress?.[articleId]"
			:preferences="state.preferences"
			:busy="busy"
			@event="studyEvent"
			@word="openReadingWord"
			@preferences="changePreferences"
			@notebook="navigate('notebook')"
			@back="goBack"
	/></LearningLayout>
</template>
<script>
import learningPage from "../../modules/learning-page.js";
import LearningLayout from "../../components/LearningLayout.vue";
import ArticleStudy from "../../components/ArticleStudy.vue";
export default {
	mixins: [learningPage],
	components: { LearningLayout, ArticleStudy },
	methods: {
		async studyEvent(event) {
			const cursor = this.state.articleProgress?.[this.articleId]?.cursor;
			if (
				(await this.send(event)) &&
				cursor !== this.state.articleProgress?.[this.articleId]?.cursor
			)
				this.scrollTop();
		},
	},
	data() {
		return { view: "articleStudy" };
	},
};
</script>
