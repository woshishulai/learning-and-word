## 1.1.0（2026-09-08）
- fix: iOS 文件合成失败、取消或停止时正确拒绝 Promise，并保留插件错误码和错误信息。
- fix: iOS 支持并发文件合成，默认输出路径互不覆盖；文件写入完成并关闭后才返回成功，取消后的回调不会影响新任务。
- fix: Android 暂停期间新增朗读会继续排队；恢复时不会重复触发 `onStart`，并从最近的边界继续播放。
- fix: Android 文件合成支持对生成的 WAV 应用 `volume`，写入或音量处理失败时 Promise 会拒绝。
- fix: 传统 uni-app 在 HBuilderX 5.24 及以上版本中可以通过 `catch` 接收 Android 文件合成错误。
- fix: Harmony 的 `onDone` 在整段文本播放完成后触发；连续朗读、暂停恢复和文件合成队列行为得到修正。
- fix: Harmony 停止时会取消当前及排队中的文件合成任务，并为并发文件任务生成独立的默认路径。
- feat: 支持音量调节（`volume` 0.0 ~ 1.0）在 Android 和 iOS 原生生效
- feat: 新增国内 Android 机型 TTS 引擎检测（`getEnginesAsync`, `isEngineAvailableAsync`）与一键跳转系统设置（`openTtsSettings`）
- fix: Harmony `resume()` 现在会重新提交暂停时未播完的语句（原先静默无效），从暂停分句开头重播
- fix: Harmony 引擎初始化并发等待改为共享 Promise，去除轮询忙等
- fix: 三端 `stop()` 打断 `synthesizeToFile` 时现在会以失败落定 Promise（原先永久挂起）
- fix: Android TTS 初始化失败后会释放坏实例并在下次调用时重试（原先后续 speak 永久静默挂起）
- fix: iOS 暂停后调用 `stop()` 会先恢复合成器，修复之后 `speak()` 静音不播的问题
- fix: Android 引擎回调 Map 改为并发安全；修复 `getVoicesAsync` 遇到未知 ISO3 国家码时的崩溃风险
## 1.0.0（2026-01-27）
- feat: 提供语音合成（TTS）核心 API（Android/iOS）
- feat: 新增 playground 验证页（`uniappx-speech-playground/pages/index/index.uvue`）
- docs: 完善使用文档与发布/实现说明
