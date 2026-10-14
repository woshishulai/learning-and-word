<template>
	<LearningLayout ref="layout" :model="pageModel"
		><view>
			<view class="page-heading"
				><text class="headline">我的词库</text
				><text class="subtitle"
					>看见自己的积累，也看见还需要练习的地方。</text
				></view
			>
			<view class="vocab-summary"
				><view
					><text class="stat-number">{{ seenCount }}</text
					><text class="muted">已接触</text></view
				><view
					><text class="stat-number">{{ recalledCount }}</text
					><text class="muted">能回忆</text></view
				><view
					><text class="stat-number">{{ stableCount }}</text
					><text class="muted">较稳定</text></view
				><button
					role="button"
					tabindex="0"
					class="btn primary"
					@click="navigate('review')"
				>
					复习这些词<AppIcon name="arrow-light" /></button
			></view>
			<view class="vocab-tools"
				><view class="filter-tabs"
					><button
						role="button"
						tabindex="0"
						v-for="filter in filters"
						:key="filter"
						class="filter"
						:class="{ active: wordFilter === filter }"
						@click="wordFilter = filter"
					>
						{{ filter }}
					</button></view
				><input
					class="search-input"
					v-model="search"
					placeholder="搜索单词或中文"
					:maxlength="80"
					aria-label="搜索单词或中文"
			/></view>
			<view class="vocab-table"
				><view class="vocab-table-head"
					><text>单词 / 短语</text><text>本文词义</text
					><text>学习状态</text><text>下次复习</text></view
				>
				<button
					role="button"
					tabindex="0"
					v-for="word in filteredWords"
					:key="word.id"
					class="vocab-row"
					@click="selectedWord = word"
				>
					<text class="vocab-term">{{ word.term }}</text
					><text>{{ word.meaning }}</text
					><text
						class="status-text"
						:class="{ weak: status(word.id) === '待巩固' }"
						>{{ status(word.id) }}</text
					><text class="muted small">{{
						dueLabel(state.records[word.id]?.dueAt)
					}}</text>
				</button>
				<view v-if="!filteredWords.length" class="empty-state"
					><text class="section-title">这里还没有匹配的单词</text
					><text class="muted"
						>试试其他筛选，或先开始学习一个故事。</text
					></view
				> </view
			><text class="library-footnote"
				>“较稳定”需要多次到期复习答对；看过释义不会直接计为掌握。</text
			>
		</view></LearningLayout
	>
</template>
<script>
import learningPage from "../../modules/learning-page.js";
import LearningLayout from "../../components/LearningLayout.vue";
export default {
	mixins: [learningPage],
	components: { LearningLayout },
	data() {
		return { view: "vocabulary" };
	},
};
</script>
