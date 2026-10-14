<template>
	<LearningLayout ref="layout" :model="pageModel"
		><view class="home-entries"
			><button
				v-for="entry in homeEntries"
				:key="entry.id"
				class="home-entry"
				role="button"
				:aria-label="entry.title"
				@click="navigate(entry.id)"
			>
				<view
					><text class="entry-title">{{ entry.title }}</text
					><text class="entry-description">{{
						entry.description
					}}</text></view
				><AppIcon name="arrow" :size="18" /></button></view
		><LearningHome
			:course="course"
			:state="state"
			:due-count="dueIds.length"
			@start="openArticle(course.id)"
			@review="navigate('review')"
	/></LearningLayout>
</template>
<script>
import learningPage from "../../modules/learning-page.js";
import LearningLayout from "../../components/LearningLayout.vue";
export default {
	mixins: [learningPage],
	components: { LearningLayout },
	data() {
		return { view: "home" };
	},
};
</script>
