<template>
	<view>
		<view class="page-heading"
			><text class="headline">我的生词本</text
			><text class="subtitle"
				>按学段和文章收藏，留下适合自己的记忆方法。</text
			></view
		>
		<view class="panel"
			><view class="action-row"
				><button
					v-for="l in ['全部', '小学', '初中', '高中']"
					:key="l"
					role="button"
					tabindex="0"
					class="chip"
					:class="{ selected: level === l }"
					@click="
						level = l;
						article = '全部';
					"
				>
					{{ l }}
				</button></view
			>
			<picker
				:range="articles"
				range-key="title"
				@change="article = articles[Number($event.detail.value)].id"
				><view class="notebook-picker"
					>文章：{{
						articles.find((a) => a.id === article)?.title ||
						"全部文章"
					}}
					▾</view
				></picker
			>
			<input
				v-model="query"
				class="field"
				aria-label="搜索生词"
				placeholder="搜索单词、词义或记忆提示"
			/>
			<view class="action-row"
				><button
					role="button"
					tabindex="0"
					class="btn primary"
					@click="add"
				>
					手动添加生词</button
				><button
					role="button"
					tabindex="0"
					class="btn secondary"
					:disabled="!filtered.length || busy"
					@click="
						$emit(
							'review',
							filtered.map((w) => w.id),
						)
					"
				>
					练习当前生词</button
				><button
					v-for="format in ['csv', 'txt', 'json']"
					:key="format"
					role="button"
					tabindex="0"
					class="text-btn"
					:disabled="!filtered.length"
					@click="download(format)"
				>
					导出 {{ format.toUpperCase() }}
				</button></view
			><text class="muted small"
				>当前 {{ filtered.length }} 个词 · 导出遵循当前筛选</text
			></view
		>
		<view v-if="form" class="panel notebook-form"
			><text class="section-title">{{
				editing ? "编辑记忆卡" : "添加生词"
			}}</text>
			<label v-for="field in fields" :key="field.key"
				><text>{{ field.label }}</text
				><textarea
					v-if="['example', 'mnemonic'].includes(field.key)"
					v-model="form[field.key]"
					:aria-label="field.label"
					:maxlength="field.max"
					auto-height
					class="field" /><input
					v-else
					v-model="form[field.key]"
					:disabled="editing && field.key === 'term'"
					:aria-label="field.label"
					:maxlength="field.max"
					class="field"
			/></label>
			<picker
				:range="['小学', '初中', '高中']"
				@change="setLevel(Number($event.detail.value))"
			>
				<view class="notebook-picker">学段：{{ form.level }} ▾</view>
			</picker>
			<picker
				:range="sourceOptions"
				range-key="title"
				@change="setSource(Number($event.detail.value))"
				><view class="notebook-picker"
					>所属文章：{{ form.source }} ▾</view
				></picker
			>
			<view class="action-row"
				><button
					role="button"
					tabindex="0"
					class="btn primary"
					:disabled="busy"
					@click="save"
				>
					保存生词</button
				><button
					role="button"
					tabindex="0"
					class="text-btn"
					@click="form = null"
				>
					取消
				</button></view
			></view
		>
		<text v-if="message" class="notebook-message">{{ message }}</text>
		<view v-if="!filtered.length" class="empty-state"
			><text
				>还没有符合条件的生词。阅读时点开单词收藏，或手动添加。</text
			></view
		>
		<view v-for="w in filtered" :key="w.id" class="notebook-row"
			><view
				><text class="section-title">{{ w.term }}</text
				><text class="word-meaning">{{ w.meaning }}</text
				><text
					v-if="preferences?.homophones && w.homophone"
					class="mnemonic"
					>谐音：{{ w.homophone }}</text
				><text v-if="w.mnemonic" class="description">{{
					w.mnemonic
				}}</text
				><text class="muted small">{{
					(w.sources || [])
						.map((s) => s.level + " · " + s.title)
						.join(" / ")
				}}</text></view
			><view class="action-row"
				><button
					role="button"
					tabindex="0"
					class="text-btn"
					@click="read(w.term)"
				>
					发音</button
				><button
					role="button"
					tabindex="0"
					class="text-btn"
					@click="edit(w)"
				>
					编辑</button
				><button
					role="button"
					tabindex="0"
					class="text-btn"
					:disabled="busy"
					@click="$emit('remove', w.id)"
				>
					移出生词本
				</button></view
			></view
		>
	</view>
</template>
<script>
import { course } from "../modules/course.js";
import { cleanEntry } from "../modules/notebook.js";
import { exportNotebook } from "../services/export.js";
import { speak } from "../services/speech.js";
export default {
	props: [
		"entries",
		"preferences",
		"busy",
		"draft",
		"saveRevision",
		"catalog",
	],
	emits: ["save", "remove", "review"],
	data() {
		return {
			level: "全部",
			article: "全部",
			query: "",
			form: null,
			editing: false,
			message: "",
			fields: [
				{ key: "term", label: "英文单词或短语", max: 80 },
				{ key: "meaning", label: "中文词义", max: 300 },
				{ key: "homophone", label: "谐音提示", max: 150 },
				{ key: "mnemonic", label: "我的记忆方法", max: 500 },
				{ key: "example", label: "英文例句", max: 1000 },
			],
		};
	},
	computed: {
		sourceOptions() {
			return [
				{ id: "manual", title: "手动添加" },
				...(
					this.catalog || [
						{ id: course.id, title: course.title, level: "高中" },
					]
				).filter((a) => !this.form || a.level === this.form.level),
			];
		},
		all() {
			return Object.values(this.entries || {});
		},
		articles() {
			const result = [{ id: "全部", title: "全部文章" }];
			for (const w of this.all)
				for (const s of w.sources || [])
					if (
						(this.level === "全部" || s.level === this.level) &&
						!result.some((x) => x.id === s.articleId)
					)
						result.push({ id: s.articleId, title: s.title });
			return result;
		},
		filtered() {
			const q = this.query.trim().toLowerCase();
			return this.all.filter(
				(w) =>
					(w.sources || []).some(
						(s) =>
							(this.level === "全部" || s.level === this.level) &&
							(this.article === "全部" ||
								s.articleId === this.article),
					) &&
					(!q ||
						[w.term, w.meaning, w.mnemonic]
							.join(" ")
							.toLowerCase()
							.includes(q)),
			);
		},
	},
	watch: {
		saveRevision() {
			this.form = null;
			this.message = "生词已保存";
		},
	},
	mounted() {
		if (this.draft) {
			this.form = { ...this.draft };
			this.editing = !!this.entries?.[this.draft.id];
		}
	},
	methods: {
		setLevel(index) {
			this.form.level = ["小学", "初中", "高中"][index];
			this.form.articleId = "manual";
			this.form.source = "手动添加";
		},
		read: speak,
		add() {
			this.editing = false;
			this.form = {
				term: "",
				meaning: "",
				homophone: "",
				mnemonic: "",
				example: "",
				source: "手动添加",
				articleId: "manual",
				level: this.level === "全部" ? "高中" : this.level,
			};
		},
		edit(w) {
			this.editing = true;
			this.form = { ...w };
		},
		setSource(index) {
			const a = this.sourceOptions[index];
			this.form.articleId = a.id;
			this.form.source = a.title;
		},
		save() {
			try {
				this.message = "";
				this.$emit("save", cleanEntry(this.form));
			} catch (e) {
				this.message = e.message;
			}
		},
		async download(format) {
			try {
				this.message =
					"已导出：" + (await exportNotebook(this.filtered, format));
			} catch (e) {
				this.message = e.message || "导出失败";
			}
		},
	},
};
</script>
