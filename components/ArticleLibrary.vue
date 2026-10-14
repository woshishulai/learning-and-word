<template>
	<view
		><view class="page-heading"
			><text class="headline">文章书架</text
			><text class="subtitle"
				>按学段选文章，在语境中积累单词。</text
			></view
		><view class="action-row"
			><button
				v-for="l in ['全部', '小学', '初中', '高中']"
				:key="l"
				role="button"
				tabindex="0"
				class="chip"
				:class="{ selected: level === l }"
				@click="level = l"
			>
				{{ l }}</button
			><button
				role="button"
				tabindex="0"
				class="text-btn"
				@click="showImport = !showImport"
			>
				文章导入
			</button></view
		>
		<view v-if="showImport" class="panel"
			><text class="section-title">{{
				cloud ? "管理端导入" : "本机试用导入"
			}}</text
			><text class="small muted"
				>JSON 数组字段：id、title、level、paragraphs（en / zh / image /
				homophone）、words（term / meaning / homophone /
				example）。questions
				可选：段落题、全文理解题、词汇题；选择题/填空题，含翻译与解析。同名
				id 禁止覆盖。{{
					cloud
						? "需要服务端设置的管理员导入密钥。"
						: "仅保存到本浏览器，不会发布到服务器。"
				}}</text
			><textarea
				v-model="raw"
				aria-label="文章 JSON"
				class="import-input"
				maxlength="-1"
				placeholder="粘贴文章 JSON"
			/><input
				v-if="cloud"
				v-model="token"
				password
				aria-label="管理员导入密钥"
				class="field"
				placeholder="管理员导入密钥"
			/><button
				role="button"
				tabindex="0"
				class="btn primary"
				:disabled="working"
				@click="importNow"
			>
				校验并导入文章</button
			><text>{{ message }}</text></view
		>
		<view v-for="a in visible" :key="a.id" class="library-entry"
			><image v-if="a.cover" :src="a.cover" mode="aspectFill" /><view
				class="library-copy"
				><text class="small muted">{{ a.level }}</text
				><text class="story-title">{{ a.title }}</text
				><text class="english-title">{{ a.englishTitle }}</text
				><text class="description">{{ a.description }}</text
				><button
					role="button"
					tabindex="0"
					class="btn primary"
					@click="$emit('open', a.id)"
				>
					阅读文章
				</button></view
			></view
		><view v-if="!visible.length" class="empty-state"
			>这个学段还没有文章</view
		></view
	>
</template>
<script>
import { importArticles } from "../services/catalog.js";
export default {
	props: ["articles", "cloud"],
	emits: ["open", "refresh"],
	data() {
		return {
			level: "全部",
			showImport: false,
			raw: "",
			token: "",
			message: "",
			working: false,
		};
	},
	computed: {
		visible() {
			return this.articles.filter(
				(a) => this.level === "全部" || a.level === this.level,
			);
		},
	},
	methods: {
		async importNow() {
			this.working = true;
			try {
				const count = await importArticles(this.raw, this.token);
				this.message = `成功导入 ${count} 篇文章`;
				this.raw = "";
				this.token = "";
				this.$emit("refresh");
			} catch (e) {
				this.message = e.message;
			} finally {
				this.working = false;
			}
		},
	},
};
</script>
