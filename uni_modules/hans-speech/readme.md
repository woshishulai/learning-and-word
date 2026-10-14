# hans-speech

uni-app / uni-app x App 端语音合成（TTS）插件（Android / iOS / Harmony）。

## 平台

- Android / iOS / Harmony：支持（App 端）
- Web / 小程序：不支持

说明：

- 本插件为 TTS（语音合成），不需要麦克风/语音识别权限
- Android `onBoundary` 仅在 API 26+ 触发（系统限制）；Harmony 暂不触发 `onBoundary`

## 安装

- 插件市场安装后，会在项目根目录生成 `uni_modules/hans-speech/`
- 或将 `hans-speech` 文件夹复制到你的项目 `uni_modules/` 下

## 引入

```ts
import {
  speak,
  stop,
  pause,
  resume,
  getAvailableVoicesAsync,
  isSpeakingAsync,
  synthesizeToFileAsync,
  maxSpeechInputLength,
  getMaxSpeechInputLength,
  setLogEnabled,
  isLogEnabled,
  getEnginesAsync,
  isEngineAvailableAsync,
  openTtsSettings,
  // 类型（仅 uni-app x 支持）
  type Voice,
  type TtsEngineInfo,
  type SpeechOptions,
  type SynthesizeToFileOptions,
  type AudioFocusMode,
  type HansSpeechError,
} from '@/uni_modules/hans-speech'
```

### 类型导入（uni-app x）

uni-app x 页面可以通过 `type X` 显式导入插件导出的类型，获得完整的 IDE 补全与编译期类型检查：

```ts
import {
  speak,
  getAvailableVoicesAsync,
  type Voice,
  type SpeechOptions,
} from '@/uni_modules/hans-speech'

const options: SpeechOptions = {
  language: 'zh-CN',
  onDone: () => console.log('done'),
}
speak('你好', options)

const voices: Array<Voice> = await getAvailableVoicesAsync()
const first: Voice | null = voices.length > 0 ? voices[0] : null
```

可导入的类型：

| 类型 | 说明 |
| --- | --- |
| `Voice` | 发音人：`identifier` / `name` / `language` / `quality` |
| `TtsEngineInfo` | TTS 引擎信息：`name` / `label` / `icon` |
| `SpeechOptions` | `speak()` 的参数（含全部回调） |
| `SynthesizeToFileOptions` | `synthesizeToFileAsync()` 的参数 |
| `AudioFocusMode` | 音频焦点模式：`'duck' \| 'pauseOthers' \| 'mix' \| 'none'` |
| `VoiceQuality` | 音质标记：`'Default' \| 'Enhanced'` |
| `HansSpeechError` / `HansSpeechErrorCode` | 插件错误对象与错误码 |
| `NativeBoundaryEvent` / `NativeBoundaryEventCallback` | `onBoundary` 边界事件 |

说明：`type X` 导入仅 uni-app x（uts）页面支持；经典 uni-app（JS）页面直接调用函数即可，不要导入类型。

## 快速开始

```ts
speak('你好', {
  language: 'zh-CN',
  rate: 1.0,
  pitch: 1.0,
  onStart: () => console.log('start'),
  onDone: () => console.log('done'),
  onStopped: () => console.log('stopped'),
  onBoundary: (e) => console.log(e.charIndex, e.charLength),
  onError: (e) => console.error(e.message),
})
```

停止/暂停/恢复/状态：

```ts
await stop()
const speaking = await isSpeakingAsync()

await pause()
await resume()
```

各端 `pause()/resume()` 语义见下方「平台差异」。

## 语音列表与选择发音人

```ts
const voices = await getAvailableVoicesAsync()
const v = voices.length > 0 ? voices[0] : null

speak('Hello', {
  voice: v?.identifier ?? '',
})
```

`Voice` 字段：

- `identifier: string`（用于 `SpeechOptions.voice`）
- `name: string`
- `language: string`（例如 `zh-CN` / `en-US`）
- `quality: string`（通常为 `Default` / `Enhanced`，平台返回值可能略有差异）

## speak(text, options)

`SpeechOptions`：

- `language?: string`：语言/地区（例如 `zh-CN` / `en-US`），不传则使用系统默认语言
- `rate?: number`：语速，建议范围 `0.1 ~ 2.0`（不传则使用系统默认）
- `pitch?: number`：语调，建议范围 `0.5 ~ 2.0`（不传则使用系统默认）
- `volume?: number`：音量，范围 `0.0 ~ 1.0`（0.0 静音，1.0 最大音量，默认 1.0）
- `voice?: string`：发音人 identifier（来自 `getAvailableVoicesAsync()`）
- `audioFocusMode?: string`：音频焦点模式 `'duck' | 'pauseOthers' | 'mix' | 'none'`（Android，默认 `'duck'`）
- `useApplicationAudioSession?: boolean`：仅 iOS 13+，不传则使用系统默认
- `autoChunk?: boolean`：超长文本自动按句子分块播报，默认 `true`
- 回调：`onStart / onBoundary / onDone / onStopped / onError`

说明：

- 多次调用 `speak()` 会追加到队列；需要“打断并重播”请先 `await stop()` 再 `speak()`
- `onDone` 表示整段文本播放完成；暂停不会触发 `onDone` 或 `onStopped`，恢复不会重复触发该段文本的 `onStart`。
- `speak()` 的错误通过 `options.onError(error)` 回调返回（`error.message` 中会包含错误码信息，例如 `HansSpeechError(9010002): ...`）

## TTS 引擎检测与设置（Android 优化）

针对国内部分定制 ROM 可能缺失默认引擎或语音包的问题，提供以下辅助 API：

```ts
// 检查是否有可用引擎
const available = await isEngineAvailableAsync()

// 获取已安装引擎列表
const engines = await getEnginesAsync()

// 打开系统 TTS 设置页（引导用户安装或切换引擎）
openTtsSettings()
```

说明：iOS 与 Harmony 使用系统内置唯一引擎，`getEnginesAsync()` 返回固定的系统引擎信息、`isEngineAvailableAsync()` 返回 `true`。

## 离线合成到文件

```ts
const filePath = await synthesizeToFileAsync('需要转成音频的文本', {
  language: 'zh-CN',
  // targetFilePath: '/path/to/output.pcm', // 不传则写入应用缓存目录
})
```

- Android / iOS 输出 `.wav`，Harmony 输出 `.pcm`；不传 `targetFilePath` 时写入应用缓存目录并返回完整路径
- iOS 支持并发提交，文件请求按顺序合成，与朗读使用独立队列；WAV 写入并关闭后返回路径，默认路径每个任务独立。写入失败或 `stop()` 取消当前及排队文件时，Promise 以 `9010005` 拒绝；取消后可继续提交新任务，已创建的未完成文件会删除。并发时若自行指定 `targetFilePath`，请为每个任务使用不同路径。
- Android 的 `volume` 会应用到合成后的 WAV 数据，`0` 输出静音，`0.5` 将采样幅度减半；Promise 在音量处理完成后返回，写入或处理失败时拒绝并返回 `9010005`。传统 uni-app 的错误回传适配需使用 HBuilderX 5.24 或更新版本。
- Harmony 的文件合成与朗读共用提交队列，合成 Promise 在文件写入完成后返回；`stop()` 会取消当前及排队任务。暂停朗读不会中断正在写入的文件，但后续排队任务需在 `resume()` 后继续。

## 文本长度限制

- `maxSpeechInputLength: number`：Android 为系统限制；iOS 为 `Number.MAX_VALUE`；Harmony 为 `10000`
- `getMaxSpeechInputLength(): number`：获取当前限制值（用于兼容少量场景下导入常量失败的问题）

## 平台差异

- `pause()/resume()`：iOS 为系统原生暂停/恢复；Android 从引擎最后上报的边界恢复，未上报边界时从当前分段开头重播，暂停期间新增朗读继续排队；Harmony 恢复时从暂停的分句开头重新播报（CoreSpeechKit 无暂停/恢复 API）
- `onBoundary`：Android 仅 API 26+ 触发；iOS 正常触发；Harmony 暂不支持
- 超长文本自动分块（`autoChunk`）三端均支持，由插件内部分句后依次播报

## 日志

插件内部默认会打印关键行为与事件，可按需关闭：

```ts
setLogEnabled(false)
const enabled = isLogEnabled()
```

## 错误码

统一错误码段：`90xxxxx`

- `9010001`：not supported（保留码，当前版本未使用）
- `9010002`：input too long（Android）
- `9010003`：invalid voice（iOS）
- `9010004`：get voices failed
- `9010005`：unknown

提示：

- `pause()/resume()/stop()/getAvailableVoicesAsync()` 通过 `Promise` reject 返回错误对象（通常包含 `errCode/errMsg/errSubject`）
- `speak()` 的错误通过 `options.onError(error)` 回调返回
