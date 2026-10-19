# 词境 · Flutter 离线演示版

基于 uni-app 提交 `e97bc30` 迁移，独立目录，不影响原项目。

## 运行

在本目录执行：

```powershell
flutter pub get
flutter run -d chrome
```

静态网页演示构建：

```powershell
flutter build web --release --no-web-resources-cdn
python -m http.server 5188 --bind 127.0.0.1 --directory build/web
```

打开 http://127.0.0.1:5188/ 。不能直接双击 index.html。`build/web` 可以整体交给任何静态网页服务器。

Android 演示包：

```powershell
flutter build apk --debug
```

最低 Android 7.0（API 24），compile SDK 36、NDK 27.0.12077973、Gradle 8.12。debug 包用于现场演示；正式发布需要独立配置发布签名。

## 内置内容与演示路径

数据集中在 `assets/data/catalog.json`，配图在 `assets/images/`，不连接 uniCloud、不使用在线账号。

- 首页 → 文章书架 → 高中《少年与英语》：9 段、18 个重点词、6 道理解题、36 道回忆题。
- 小学《校园的一天》：2 段、3 个重点词、3 道文章题，展示分类与导入兼容性。
- 全文阅读 → 开始学习 → 切换情节 / 段落 / 学习步骤 → 题目中回看原文。
- 生词本 → 随机默写 / 词义选择 / 例句训练 / 导出 CSV、TXT、JSON。
- 复习中心：有 4 个预置收藏和到期词，便于开场直接演示；明确标记为演示记录。
- 设置 → 恢复演示初始状态，确认后重置学习与收藏；保留导入文章和显示设置。

学习进度只在本机保存。句子训练只保留本轮结果。读音使用设备 TTS；离线发音需提前安装英语语言包，跟读不做录音评分。

## 防遗漏与维护

参见 `MIGRATION.md` 的页面、功能、验收矩阵。每个页面独立放在 `lib/screens/`；题目、句子训练与本机数据分别在 `lib/quiz.dart`、`lib/sentences.dart`、`lib/store.dart`。

重新从原 uni-app 内容导出内置数据：

```powershell
node tool/export-course.mjs
```

导出不包含任何真实学生数据、身份令牌或云空间密钥。可继续通过书架的 JSON 导入功能增加本地示例。

## 检查

```powershell
flutter analyze
flutter test
```

如本机设置代理导致测试连接 localhost 失败，只对测试进程设置 `NO_PROXY=localhost,127.0.0.1,::1` 并清空 `HTTP_PROXY`、`HTTPS_PROXY`。

### 真机卡在启动图标 / VM Service 连接超时

在 VS Code 中打开 `flutter_demo` 目录，使用“词境 Android 本地调试”启动配置；配置只为调试进程绕过代理，不改系统代理。
先用 `adb devices -l` 检查手机状态。`offline` 时重新连接 USB 并在解锁手机上允许调试，不能仅靠重新编译解决。
演示给客户时使用 `dist/词境-离线演示-arm64.apk` 的 release 包，无需电脑或 VM Service。覆盖安装保留本机记录，不必卸载应用。

2026-10-15 的 PJV110 排查中，重新连接后原安装包冷启动约 1.9 秒完成首帧，Impeller/Vulkan 正常，因此没有禁用渲染引擎。此前卡住的具体触发原因未能完整复现。

## 第三方资源

- Noto Sans SC 字体随包内置，来源：https://github.com/google/fonts/tree/main/ofl/notosanssc ，许可证见 `assets/fonts/OFL.txt`。
- Flutter 和插件的许可证可通过依赖包查看。字体不需要在运行时下载。

当前 Android release 构建使用演示签名，关闭资源压缩以降低首次构建的内存需求；如用于正式发行，需配置自己的签名并完成真机验收。

本地字体的 `NotoSansSC-Regular.ttf` 从原可变字体取 400 常规字重，许可证保持不变。原始可变字体仅用于源资源留存，不随应用打包。
