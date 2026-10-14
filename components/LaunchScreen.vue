<template>
	<view
		v-if="visible"
		class="launch-screen"
		:class="{ 'launch-leaving': leaving }"
		role="status"
		aria-label="词境，正在打开学习空间"
	>
		<view class="launch-halo" aria-hidden="true" />
		<view class="launch-brand">
			<image
				class="launch-mark"
				src="/static/icons/brand-book.svg"
				mode="aspectFit"
				aria-hidden="true"
			/>
			<text class="launch-name">词境</text>
			<text class="launch-english">WORDSCAPE</text>
			<view class="launch-rule" />
			<text class="launch-slogan">在故事里遇见单词</text>
			<text class="launch-subtitle">让记忆有迹可循</text>
		</view>
		<view class="launch-bottom"
			><view class="launch-dots" aria-hidden="true"
				><view /><view /><view /></view
			><text class="launch-loading">正在打开你的学习空间</text
			><text class="launch-note">一篇文章，一段新的积累</text></view
		>
	</view>
</template>
<script>
export default {
	props: { ready: Boolean },
	data() {
		return {
			visible: true,
			leaving: false,
			exitTimer: null,
			safetyTimer: null,
		};
	},
	watch: {
		ready(value) {
			if (value) this.dismiss();
		},
	},
	mounted() {
		if (this.ready) this.dismiss();
		else this.safetyTimer = setTimeout(() => this.dismiss(), 8000);
	},
	beforeUnmount() {
		clearTimeout(this.exitTimer);
		clearTimeout(this.safetyTimer);
	},
	methods: {
		dismiss() {
			if (this.leaving || !this.visible) return;
			clearTimeout(this.safetyTimer);
			this.leaving = true;
			this.exitTimer = setTimeout(() => {
				this.visible = false;
			}, 220);
		},
	},
};
</script>
<style>
.launch-screen {
	position: absolute;
	inset: 0;
	z-index: 200;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	background: #f7f8f2;
	color: #244d37;
	padding: calc(var(--ws-safe-top, 0px) + 24px) 24px
		calc(var(--ws-safe-bottom, 0px) + 24px);
	opacity: 1;
	transition: opacity 220ms ease;
}
.launch-leaving {
	opacity: 0;
	pointer-events: none;
}
.launch-halo {
	position: absolute;
	width: 420px;
	height: 420px;
	top: 10%;
	left: 50%;
	transform: translateX(-50%);
	border-radius: 50%;
	background: radial-gradient(circle, #e7eddb 0%, #f7f8f2 70%);
}
.launch-brand {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	transform: translateY(-35px);
}
.launch-mark {
	width: 88px;
	height: 88px;
	margin-bottom: 28px;
	box-shadow: 0 12px 36px #244d3714;
	border-radius: 26px;
}
.launch-name {
	font-family: "Songti SC", SimSun, serif;
	font-size: 46px;
	font-weight: 600;
	letter-spacing: 10px;
	padding-left: 10px;
	line-height: 1.3;
}
.launch-english {
	font-family: Georgia, serif;
	font-size: 10px;
	letter-spacing: 5px;
	padding-left: 5px;
	margin-top: 10px;
	color: #778672;
}
.launch-rule {
	width: 26px;
	height: 1px;
	background: #bdc9ad;
	margin: 30px 0 22px;
}
.launch-slogan {
	font-size: 18px;
	letter-spacing: 2px;
	line-height: 1.8;
}
.launch-subtitle {
	font-size: 14px;
	letter-spacing: 3px;
	color: #7f8b78;
	margin-top: 7px;
}
.launch-bottom {
	position: absolute;
	bottom: calc(var(--ws-safe-bottom, 0px) + 35px);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
}
.launch-loading {
	font-size: 11px;
	letter-spacing: 1px;
	color: #8a9582;
}
.launch-note {
	font-size: 10px;
	letter-spacing: 2px;
	color: #a5ad9e;
	margin-top: 18px;
}
.launch-dots {
	display: flex;
	gap: 6px;
}
.launch-dots > view {
	height: 4px;
	width: 4px;
	border-radius: 50%;
	background: #779165;
	animation: launch-breathe 1.4s ease-in-out infinite;
}
.launch-dots > view:nth-child(2) {
	animation-delay: 0.15s;
}
.launch-dots > view:nth-child(3) {
	animation-delay: 0.3s;
}
@keyframes launch-breathe {
	0%,
	100% {
		opacity: 0.25;
	}
	50% {
		opacity: 1;
	}
}
@media (max-height: 500px) {
	.launch-mark {
		width: 56px;
		height: 56px;
		margin-bottom: 12px;
	}
	.launch-name {
		font-size: 32px;
	}
	.launch-rule {
		margin: 12px 0;
	}
	.launch-bottom {
		bottom: 16px;
	}
	.launch-note {
		display: none;
	}
	.launch-brand {
		transform: translateY(-25px);
	}
}
@media (prefers-reduced-motion: reduce) {
	.launch-screen {
		transition: none;
	}
	.launch-dots > view {
		animation: none;
	}
}
</style>
