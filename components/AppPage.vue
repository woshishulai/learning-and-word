<template>
	<view class="app-shell" :style="viewportStyle">
		<view class="app-header"><slot name="header" /></view>
		<scroll-view
			class="app-scroll"
			:scroll-y="!locked"
			:scroll-top="scrollTop"
			:show-scrollbar="true"
			:scroll-with-animation="false"
			:enable-back-to-top="true"
			@scroll="lastScroll = $event.detail.scrollTop"
		>
			<view class="app-content"><slot /></view>
		</scroll-view>
		<slot name="overlay" />
	</view>
</template>
<script>
export default {
	props: { locked: Boolean },
	data() {
		return { scrollTop: 0, lastScroll: 0, viewportStyle: {} };
	},
	mounted() {
		// 浏览器工具栏 / 软键盘改变可见高度时，滚动容器跟随可见区域。
		// #ifdef H5
		this.resizeViewport = () => {
			const h = window.visualViewport?.height;
			if (h) this.viewportStyle = { height: `${Math.round(h)}px` };
		};
		this.resizeViewport();
		window.visualViewport?.addEventListener("resize", this.resizeViewport);
		window.addEventListener("resize", this.resizeViewport);
		// #endif
	},
	beforeUnmount() {
		// #ifdef H5
		window.visualViewport?.removeEventListener(
			"resize",
			this.resizeViewport,
		);
		window.removeEventListener("resize", this.resizeViewport);
		// #endif
	},
	methods: {
		scrollToTop() {
			this.scrollTop = this.lastScroll;
			this.$nextTick(() => {
				this.scrollTop = 0;
			});
		},
	},
};
</script>
