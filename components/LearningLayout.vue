<template>
	<AppPage ref="pageShell" :locked="!!selectedWord" @keydown="activateKey">
		<template #header
			><view class="route-bar">
				<template v-if="view === 'home'"
					><text class="brand-cn">词境</text
					><text class="muted small">在故事里遇见单词</text></template
				>
				<template v-else
					><button
						class="route-back"
						role="button"
						aria-label="返回上一级"
						:disabled="busy"
						@click="goBack"
					>
						<AppIcon name="back" :size="20" /><text
							>返回</text
						></button
					><text class="route-title">{{ pageTitle }}</text
					><button
						class="route-home"
						role="button"
						aria-label="回到首页"
						:disabled="busy"
						@click="navigate('home')"
					>
						首页
					</button></template
				>
			</view></template
		>
		<view class="main-container" @click="controlsOpen = false">
			<view v-if="loading" class="empty-state"
				><text class="section-title">正在打开你的学习空间…</text></view
			>
			<view v-else-if="loadError" class="empty-state"
				><text class="section-title">暂时无法读取学习进度</text
				><text class="description">{{ loadError }}</text
				><button
					role="button"
					tabindex="0"
					class="btn primary"
					@click="initialize"
				>
					重试
				</button></view
			>
			<template v-else>
				<view v-if="error" class="error-banner"
					><text>{{ error }}</text
					><button
						role="button"
						tabindex="0"
						class="text-btn"
						@click="refreshState"
					>
						刷新进度</button
					><button
						role="button"
						tabindex="0"
						class="icon-button"
						aria-label="关闭提示"
						@click="error = ''"
					>
						<AppIcon name="close" :size="16" /></button
				></view>
				<slot />
				<view class="app-footer"
					><text>词境 · 让单词有故事可记</text
					><text>{{
						cloud
							? "独立学习身份 · 云端保存"
							: "本机体验 · 自动保存"
					}}</text></view
				>
			</template>
		</view>
		<template #overlay>
			<LaunchScreen v-if="launchNeeded" :ready="!loading" />
			<view
				v-if="!loading && !loadError && !selectedWord"
				class="learning-dock"
			>
				<!-- #ifdef H5 -->
				<Transition name="control-surface">
					<!-- #endif -->
					<view
						v-if="controlsOpen"
						class="learning-popover"
						id="learning-controls"
						role="region"
						aria-label="学习控制"
					>
						<view class="dock-heading"
							><text class="section-title">随手调整</text
							><button
								class="text-btn"
								role="button"
								tabindex="0"
								@click="controlsOpen = false"
							>
								收起面板
							</button></view
						>
						<scroll-view
							scroll-y
							class="controls-scroll"
							:show-scrollbar="true"
						>
							<LearningSettings
								:value="state.preferences"
								:status="preferenceStatus"
								@change="changePreferences"
							/>
							<view
								v-if="
									view === 'lesson' &&
									active?.kind === 'lesson'
								"
								class="dock-steps"
								><text class="small muted">切换学习步骤</text
								><view class="action-row"
									><button
										v-for="step in steps"
										:key="step.id"
										class="chip"
										role="button"
										tabindex="0"
										:class="{
											selected: active.stage === step.id,
										}"
										:disabled="
											busy ||
											(step.id === 'result' &&
												!active.result &&
												active.stage !== 'result')
										"
										@click="chooseStage(step.id)"
									>
										{{ step.label }}
									</button></view
								></view
							>
							<view class="dock-steps"
								><text class="small muted">重新学习</text
								><view class="action-row"
									><button
										v-if="resetArticleId"
										class="text-btn"
										role="button"
										:disabled="busy"
										@click="resetLearning('article')"
									>
										本篇从头学</button
									><button
										class="text-btn"
										role="button"
										:disabled="busy"
										@click="resetLearning('all')"
									>
										清空全部学习进度
									</button></view
								><text class="small muted"
									>保留生词本与设置，确认后才清空。</text
								></view
							>
						</scroll-view>
					</view>
					<!-- #ifdef H5 -->
				</Transition>
				<!-- #endif -->
				<button
					class="dock-toggle"
					:class="{ 'is-open': controlsOpen }"
					:aria-label="controlsOpen ? '关闭学习控制' : '打开学习控制'"
					title="学习控制"
					role="button"
					tabindex="0"
					:aria-expanded="controlsOpen"
					aria-controls="learning-controls"
					@click="controlsOpen = !controlsOpen"
				>
					<view class="dock-glyph dock-adjust"
						><AppIcon name="adjust" :size="24" /></view
					><view class="dock-glyph dock-close"
						><AppIcon name="close" :size="20"
					/></view>
				</button>
			</view>
			<!-- #ifdef H5 -->
			<Transition name="dialog-surface">
				<!-- #endif --><AppDialog
					v-if="selectedWord"
					title="单词释义"
					@close="closeWord"
				>
					<input
						v-if="selectedWord._quickSave && !selectedWord.meaning"
						v-model="questionMeaning"
						class="answer-input"
						placeholder="补充中文词义后即可收藏"
						:maxlength="300"
					/>
					<WordCard
						:preferences="state.preferences"
						:busy="busy"
						@save="saveDialogWord"
						:word="selectedWord"
						:saved="!!state.notebook?.[selectedWord.id]"
					/>
					<template #footer
						><button
							role="button"
							tabindex="0"
							class="btn primary"
							@click="closeWord"
						>
							回到学习
						</button></template
					> </AppDialog
				><!-- #ifdef H5 -->
			</Transition>
			<!-- #endif -->
		</template>
	</AppPage>
</template>

<script>
import AppPage from "./AppPage.vue";
import AppDialog from "./AppDialog.vue";
import AppIcon from "./AppIcon.vue";
import WordCard from "./WordCard.vue";
import LearningSettings from "./LearningSettings.vue";
import LaunchScreen from "./LaunchScreen.vue";
const bindings = [
	"resetArticleId",
	"resetLearning",
	"activateKey",
	"active",
	"answer",
	"busy",
	"changePreferences",
	"chooseStage",
	"closeWord",
	"cloud",
	"controlsOpen",
	"error",
	"goBack",
	"initialize",
	"launchNeeded",
	"lesson",
	"loadError",
	"loading",
	"navigate",
	"pageTitle",
	"preferenceStatus",
	"questionMeaning",
	"refreshState",
	"result",
	"saveDialogWord",
	"selectedWord",
	"state",
	"status",
	"steps",
	"view",
];
export default {
	components: {
		AppPage,
		AppDialog,
		AppIcon,
		WordCard,
		LearningSettings,
		LaunchScreen,
	},
	props: { model: { type: Object, required: true } },
	computed: Object.fromEntries(
		bindings.map((key) => [
			key,
			{
				get() {
					return this.model[key];
				},
				set(value) {
					this.model[key] = value;
				},
			},
		]),
	),
	methods: {
		scrollToTop() {
			this.$refs.pageShell?.scrollToTop();
		},
	},
};
</script>
