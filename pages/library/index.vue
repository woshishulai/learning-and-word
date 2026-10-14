<template>
	<LearningLayout ref="layout" :model="pageModel"
		><ArticleLibrary
			:articles="catalog"
			:cloud="cloud"
			@open="openArticle"
			@refresh="refreshCatalog"
	/></LearningLayout>
</template>
<script>
import learningPage from "../../modules/learning-page.js";
import LearningLayout from "../../components/LearningLayout.vue";
export default {
	mixins: [learningPage],
	components: { LearningLayout },
	data() {
		return { view: "library" };
	},
};
</script>
