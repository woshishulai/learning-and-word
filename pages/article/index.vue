<template>
	<LearningLayout ref="layout" :model="pageModel"
		><FullArticleReader
			v-if="readingArticle"
			:article="readingArticle"
			:preferences="state.preferences"
			:busy="busy"
			@word="openReadingWord"
			@preferences="changePreferences"
			@start="beginArticleStudy"
			@move="scrollTop"
			@done="navigate('notebook')"
	/></LearningLayout>
</template>
<script>
import learningPage from "../../modules/learning-page.js";
import LearningLayout from "../../components/LearningLayout.vue";
import FullArticleReader from "../../components/FullArticleReader.vue";
export default {
	mixins: [learningPage],
	components: { LearningLayout, FullArticleReader },
	data() {
		return { view: "article" };
	},
};
</script>
