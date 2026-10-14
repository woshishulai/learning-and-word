// #ifdef APP-PLUS
import {
	speak as nativeSpeak,
	stop as nativeStop,
} from "../uni_modules/hans-speech";
// #endif
import { reactive } from "vue";
import { defaultPreferences } from "../modules/learning-aids.js";
let options = { ...defaultPreferences };
let generation = 0;
export const speechState = reactive({ playing: false, text: "", error: "" });
export function configureSpeech(prefs) {
	options = { ...defaultPreferences, ...prefs };
}
export function canSpeak() {
	// #ifdef APP-PLUS
	return typeof plus !== "undefined";
	// #endif
	// #ifdef H5
	return typeof window !== "undefined" && "speechSynthesis" in window;
	// #endif
	// #ifndef H5
	// #ifndef APP-PLUS
	return false;
	// #endif
	// #endif
}
export function stopSpeech() {
	generation++;
	speechState.playing = false;
	speechState.text = "";
	// #ifdef H5
	if (canSpeak()) window.speechSynthesis.cancel();
	// #endif
	// #ifdef APP-PLUS
	if (typeof plus === "undefined") return;
	try {
		return Promise.resolve(nativeStop()).catch(() => {});
	} catch {
		return;
	}
	// #endif
}
export async function speak(content, overrides = {}) {
	const text = String(content || "").trim();
	if (!text) return false;
	const stopped = stopSpeech();
	const current = generation;
	await stopped;
	if (current !== generation) return false;
	const settings = { ...options, ...overrides };
	speechState.error = "";
	const onStart = () => {
		if (current === generation) {
			speechState.playing = true;
			speechState.text = text;
		}
	};
	const onDone = () => {
		if (current === generation) {
			speechState.playing = false;
			speechState.text = "";
		}
	};
	const onError = () => {
		if (current !== generation) return;
		onDone();
		speechState.error = `朗读失败，请检查设备是否安装${settings.accent.startsWith("zh") ? "中文" : "英语"}语音，或稍后重试。`;
		uni.showToast({ title: speechState.error, icon: "none" });
	};
	// #ifdef APP-PLUS
	if (typeof plus === "undefined") {
		onError();
		return false;
	}
	try {
		nativeSpeak(text, {
			language: settings.accent,
			rate: settings.rate,
			pitch: 1,
			onStart,
			onDone,
			onStopped: onDone,
			onError,
		});
		return true;
	} catch (e) {
		onError();
		return false;
	}
	// #endif
	// #ifdef H5
	if (!canSpeak()) {
		onError();
		return false;
	}
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = settings.accent;
	utterance.rate = settings.rate;
	const voices = window.speechSynthesis.getVoices();
	const selected =
		voices.find((v) => v.lang === settings.accent) ||
		voices.find((v) =>
			v.lang
				.toLowerCase()
				.startsWith(settings.accent.split("-")[0].toLowerCase()),
		);
	if (selected) utterance.voice = selected;
	utterance.onstart = onStart;
	utterance.onend = onDone;
	utterance.onerror = (e) => {
		if (!["canceled", "interrupted"].includes(e.error)) onError();
	};
	window.speechSynthesis.speak(utterance);
	return true;
	// #endif
	// #ifndef APP-PLUS
	// #ifndef H5
	onError();
	return false;
	// #endif
	// #endif
}
