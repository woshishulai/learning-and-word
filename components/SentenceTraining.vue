<template>
	<view>
		<view class="page-heading"
			><text class="headline">句子训练</text
			><text class="subtitle"
				>{{ title }} · {{ items.length }} 句</text
			></view
		>
		<view v-if="!items.length" class="empty-state"
			>暂无可练习的例句，请先收藏带例句的单词，或从文章进入。</view
		>
		<view v-else-if="!started" class="panel">
			<text class="section-title">选择训练方式</text>
			<view class="action-row"
				><button
					v-for="m in modes"
					:key="m.id"
					role="button"
					class="chip"
					:class="{ selected: mode === m.id }"
					@click="mode = m.id"
				>
					{{ m.label }}
				</button></view
			>
			<text class="description">{{ descriptions[mode] }}</text>
			<button role="button" class="btn primary" @click="start(items)">
				随机开始训练
			</button>
			<text class="muted small"
				>本轮结果在此页保留，离开页面后结束；不改变单词掌握等级。</text
			>
		</view>
		<view v-else-if="finished" class="panel">
			<text class="headline">本轮训练完成</text>
			<text class="description">{{
				mode === "listen"
					? "已跟读 " + queue.length + " 句"
					: "答对 " +
						(queue.length - wrong.length) +
						" / " +
						queue.length +
						" 句"
			}}</text>
			<view v-for="(item, i) in wrong" :key="i" class="paragraph"
				><text>{{ item.en }}</text
				><button role="button" class="text-btn" @click="read(item.en)">
					听正确句子
				</button></view
			>
			<view class="action-row"
				><button
					v-if="wrong.length"
					role="button"
					class="btn primary"
					@click="start(wrong)"
				>
					只练错句</button
				><button role="button" class="btn secondary" @click="configure">
					重新选择模式
				</button></view
			>
		</view>
		<view v-else class="panel">
			<view class="section-line"
				><text>{{ modes.find((m) => m.id === mode).label }}</text
				><text>{{ index + 1 }} / {{ queue.length }}</text></view
			>
			<view class="action-row"
				><button
					role="button"
					class="btn secondary"
					@click="read(current.en)"
				>
					播放句子</button
				><button role="button" class="text-btn" @click="stop">
					停止朗读
				</button></view
			>
			<text
				v-if="mode === 'listen' || feedback"
				class="english-paragraph"
				>{{ current.en }}</text
			>
			<text
				v-if="current.zh && (mode === 'listen' || feedback)"
				class="translation"
				>{{ current.zh }}</text
			>
			<template v-if="mode === 'order'">
				<text class="muted small"
					>点击词块组句；点击已选词块可撤回。</text
				>
				<view class="sentence-answer"
					><button
						v-for="token in chosen"
						:key="token.id"
						role="button"
						class="chip selected"
						:disabled="!!feedback"
						@click="
							chosen = chosen.filter((t) => t.id !== token.id)
						"
					>
						{{ token.text }}</button
					><text v-if="!chosen.length" class="muted"
						>在这里组成句子</text
					></view
				>
				<view class="action-row"
					><button
						v-for="token in available"
						:key="token.id"
						role="button"
						class="chip"
						:disabled="!!feedback"
						@click="chosen.push(token)"
					>
						{{ token.text }}
					</button></view
				>
			</template>
			<textarea
				v-if="mode === 'dictation'"
				v-model="typed"
				class="field"
				aria-label="听音默写句子"
				placeholder="听句子，写下你听到的英文"
				:disabled="!!feedback"
				:maxlength="3000"
				auto-height
			/>
			<text v-if="mode !== 'listen'" class="muted small"
				>忽略大小写和句末标点，保留单词拼写与顺序。</text
			>
			<view v-if="feedback" class="paragraph"
				><text>{{
					feedback.correct ? "回答正确" : "再对照原句听一遍"
				}}</text
				><text v-if="!feedback.correct" class="description"
					>你的答案：{{ feedback.answer || "未作答" }}</text
				></view
			>
			<view class="action-row">
				<button
					v-if="mode === 'listen' || feedback"
					role="button"
					class="btn primary"
					@click="next"
				>
					{{
						index === queue.length - 1
							? "查看结果"
							: mode === "listen"
								? "跟读完成，下一句"
								: "下一句"
					}}
				</button>
				<template v-else
					><button
						role="button"
						class="btn primary"
						:disabled="!answer.trim()"
						@click="submit(false)"
					>
						检查答案</button
					><button
						role="button"
						class="text-btn"
						@click="submit(true)"
					>
						不会，查看原句
					</button></template
				>
			</view>
			<text v-if="mode === 'listen'" class="muted small"
				>听完后自行跟读；此模式不录音、不评测发音。</text
			>
		</view>
	</view>
</template>
<script>
import { shuffled } from "../modules/notebook.js";
import {
	scrambleSentence,
	normalizeSentence,
} from "../modules/sentence-training.js";
import { speak, stopSpeech } from "../services/speech.js";
export default {
	props: ["items", "title"],
	data() {
		return {
			mode: "listen",
			started: false,
			queue: [],
			index: 0,
			chosen: [],
			tokens: [],
			typed: "",
			feedback: null,
			wrong: [],
			modes: [
				{ id: "listen", label: "听句跟读" },
				{ id: "order", label: "乱序组句" },
				{ id: "dictation", label: "听音默写" },
			],
			descriptions: {
				listen: "播放原句，对照英文跟读。",
				order: "把打乱的词块重新排成原句，也可以先听发音。",
				dictation: "先听句子，再默写英文，提交后对照原句。",
			},
		};
	},
	computed: {
		finished() {
			return this.index >= this.queue.length;
		},
		current() {
			return this.queue[this.index];
		},
		available() {
			return this.tokens.filter(
				(t) => !this.chosen.some((c) => c.id === t.id),
			);
		},
		answer() {
			return this.mode === "order"
				? this.chosen.map((t) => t.text).join(" ")
				: this.typed;
		},
	},
	beforeUnmount() {
		stopSpeech();
	},
	methods: {
		read: speak,
		stop: stopSpeech,
		configure() {
			stopSpeech();
			this.started = false;
		},
		start(items) {
			stopSpeech();
			this.queue = shuffled(items);
			this.wrong = [];
			this.index = 0;
			this.started = true;
			this.prepare();
		},
		prepare() {
			this.typed = "";
			this.chosen = [];
			this.feedback = null;
			this.tokens = this.current ? scrambleSentence(this.current.en) : [];
		},
		submit(skip) {
			if (this.feedback) return;
			const correct =
				!skip &&
				normalizeSentence(this.answer) ===
					normalizeSentence(this.current.en);
			this.feedback = { correct, answer: this.answer };
			if (!correct) this.wrong.push(this.current);
		},
		next() {
			stopSpeech();
			this.index++;
			this.prepare();
		},
	},
};
</script>
<style scoped>
.sentence-answer {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	min-height: 70px;
	padding: 16px;
	margin: 16px 0;
	border: 1px dashed #b4c6b8;
	border-radius: 14px;
}
</style>
