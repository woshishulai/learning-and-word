<!-- 主页面由 AppPage.locked 锁定滚动；触摸只停止冒泡，避免 passive 监听器调用 preventDefault。 -->
<template>
	<view
		class="modal-backdrop"
		@click="$emit('close')"
		@touchmove.stop
	>
		<view
			class="app-dialog"
			role="dialog"
			aria-modal="true"
			:aria-label="title"
			@click.stop
		>
			<view class="dialog-header"
				><text class="section-title">{{ title }}</text
				><button
					role="button"
					tabindex="0"
					class="icon-button"
					:aria-label="'关闭' + title"
					@click="$emit('close')"
				>
					<AppIcon name="close" /></button
			></view>
			<scroll-view
				class="dialog-scroll"
				scroll-y
				:show-scrollbar="true"
				@touchmove.stop
				><view class="dialog-body"><slot /></view
			></scroll-view>
			<view class="dialog-footer"><slot name="footer" /></view>
		</view>
	</view>
</template>
<script>
import AppIcon from "./AppIcon.vue";
export default {
	components: { AppIcon },
	props: { title: { type: String, default: "单词释义" } },
	emits: ["close"],
};
</script>
