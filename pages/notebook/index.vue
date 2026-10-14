<template>
	<LearningLayout ref="layout" :model="pageModel"
		><PersonalNotebook
			:catalog="catalog"
			:entries="state.notebook"
			:preferences="state.preferences"
			:busy="busy"
			:draft="notebookDraft"
			:save-revision="notebookSaveRevision"
			@save="saveNotebook"
			@remove="send({ type: 'notebookRemove', wordId: $event })"
			@review="reviewNotebook"
	/></LearningLayout>
</template>
<script>
import learningPage from "../../modules/learning-page.js";
import LearningLayout from "../../components/LearningLayout.vue";
export default {
	mixins: [learningPage],
	components: { LearningLayout },
	data() {
		return { view: "notebook" };
	},
};
</script>
