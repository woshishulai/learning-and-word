import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'store.dart';

late DemoStore store;
final voice = FlutterTts();
const green = Color(0xff285840), paper = Color(0xfff7f8f2);
void message(BuildContext context, String text) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
}

Future<void> speak(
  BuildContext context,
  String text, {
  bool chinese = false,
}) async {
  try {
    await voice.stop();
    await voice.setLanguage(chinese ? 'zh-CN' : str(store.prefs['accent']));
    await voice.setSpeechRate((store.prefs['rate'] as num).toDouble() * 0.6);
    final result = await voice.speak(text.replaceAll('___', 'blank'));
    if (result == 0 && context.mounted) message(context, '未找到可用语音，请安装设备英语语音包。');
  } catch (_) {
    if (context.mounted) message(context, '当前设备语音不可用，请检查语音引擎和语言包。');
  }
}

void openPage(BuildContext context, Widget page) {
  voice.stop();
  Navigator.push(
    context,
    CupertinoPageRoute(builder: (_) => page),
  ).then((_) => voice.stop());
}

Future<bool> confirm(BuildContext context, String title, String detail) async =>
    await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: Text(title),
        content: Text(detail),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(c, true),
            child: const Text('确认'),
          ),
        ],
      ),
    ) ??
    false;
Widget heading(String title, [String subtitle = '']) => Padding(
  padding: const EdgeInsets.symmetric(vertical: 20),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        title,
        style: const TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w600,
          color: green,
        ),
      ),
      if (subtitle.isNotEmpty)
        Padding(
          padding: const EdgeInsets.only(top: 10),
          child: Text(
            subtitle,
            style: const TextStyle(color: Colors.blueGrey, height: 1.6),
          ),
        ),
    ],
  ),
);
Widget panel(List<Widget> children) => Card(
  margin: const EdgeInsets.symmetric(vertical: 10),
  child: Padding(
    padding: const EdgeInsets.all(22),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: children,
    ),
  ),
);
Widget actions(List<Widget> children) => Padding(
  padding: const EdgeInsets.symmetric(vertical: 12),
  child: Wrap(
    spacing: 10,
    runSpacing: 10,
    crossAxisAlignment: WrapCrossAlignment.center,
    children: children,
  ),
);
Widget action(
  String text,
  VoidCallback? onPressed, {
  bool primary = false,
  IconData? icon,
}) => primary
    ? FilledButton.icon(
        onPressed: onPressed,
        icon: Icon(icon ?? Icons.arrow_forward, size: 18),
        label: Text(text),
      )
    : OutlinedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon ?? Icons.chevron_right, size: 18),
        label: Text(text),
      );
Widget assetImage(String path, {double height = 260}) => path.isEmpty
    ? const SizedBox.shrink()
    : ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Image.asset(
          path,
          height: height,
          width: double.infinity,
          fit: BoxFit.cover,
          cacheWidth: 1080,
          errorBuilder: (_, __, ___) => const SizedBox.shrink(),
        ),
      );

class Shell extends StatelessWidget {
  final String title;
  final List<Widget> children;
  final bool settings;
  final ScrollController? controller;
  final Widget? bottomBar;
  const Shell({
    super.key,
    required this.title,
    required this.children,
    this.settings = true,
    this.controller,
    this.bottomBar,
  });
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(title),
      actions: [
        if (settings)
          IconButton(
            tooltip: '学习设置',
            onPressed: () => openPage(context, const SettingsPage()),
            icon: const Icon(Icons.tune_rounded),
          ),
      ],
    ),
    bottomNavigationBar: bottomBar == null
        ? null
        : SafeArea(
            top: false,
            minimum: const EdgeInsets.fromLTRB(20, 8, 20, 12),
            child: bottomBar!,
          ),
    body: SafeArea(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1000),
          child: ListView(
            controller: controller,
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            children: [
              if (store.saveError != null)
                MaterialBanner(
                  content: Text(store.saveError!),
                  actions: [
                    TextButton(
                      onPressed: store.save,
                      child: const Text('重试保存'),
                    ),
                  ],
                ),
              ...children,
              const SizedBox(height: 28),
              const Text(
                '词境 · 在故事里遇见单词\n离线演示 · 本机保存',
                style: TextStyle(color: Colors.blueGrey, fontSize: 12),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: store,
    builder: (context, _) => Shell(
      title: '学习设置',
      settings: false,
      children: [
        heading('按自己的方式学习', '阅读设置不会自动打开复习提示。'),
        panel([
          for (final entry in {
            'english': '显示英文',
            'images': '显示配图',
            'translation': '中文翻译',
            'homophones': '谐音提示',
            'ipa': '音标',
            'meaning': '单词释义',
            'examples': '单词例句',
            'notes': '记忆方法',
          }.entries)
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(entry.value),
              value: store.prefs[entry.key] == true,
              onChanged: (v) {
                store.prefs[entry.key] = v;
                store.save();
              },
            ),
          const Text(
            '谐音只是近似记忆辅助，发音以英语语音为准。',
            style: TextStyle(color: Colors.blueGrey),
          ),
          DropdownButtonFormField<String>(
            value: str(store.prefs['accent']),
            decoration: const InputDecoration(labelText: '朗读口音'),
            items: const [
              DropdownMenuItem(value: 'en-US', child: Text('美式英语')),
              DropdownMenuItem(value: 'en-GB', child: Text('英式英语')),
            ],
            onChanged: (v) {
              store.prefs['accent'] = v;
              store.save();
            },
          ),
          DropdownButtonFormField<double>(
            value: (store.prefs['rate'] as num).toDouble(),
            decoration: const InputDecoration(labelText: '朗读速度'),
            items: const [
              DropdownMenuItem(value: 0.65, child: Text('慢速')),
              DropdownMenuItem(value: 0.85, child: Text('舒缓')),
              DropdownMenuItem(value: 1.0, child: Text('正常')),
            ],
            onChanged: (v) {
              store.prefs['rate'] = v;
              store.save();
            },
          ),
          actions([
            action('试听英语', () => speak(context, 'Meet words in stories.')),
            action('停止朗读', voice.stop),
          ]),
          const Text('所有课程数据随包内置。发音依赖设备语音引擎；离线演示前请安装英语语音包。'),
        ]),
        panel([
          const Text('演示数据', style: TextStyle(fontSize: 20)),
          const Text('内置收藏和到期词用于展示功能，不代表真实学习成绩。'),
          action('恢复演示初始状态', () async {
            if (await confirm(
              context,
              '恢复演示初始状态？',
              '将清除本机学习进度和手动收藏，恢复预设收藏及到期词；保留导入文章和显示设置。',
            )) {
              await store.reset();
              if (context.mounted) message(context, '已恢复演示初始状态');
            }
          }),
        ]),
      ],
    ),
  );
}

class EnglishText extends StatelessWidget {
  final String text;
  final Data? article;
  final bool clickable;
  final VoidCallback? onHint;
  const EnglishText(
    this.text, {
    super.key,
    this.article,
    this.clickable = true,
    this.onHint,
  });
  @override
  Widget build(BuildContext context) {
    if (!clickable) {
      return SelectableText(
        text,
        style: const TextStyle(fontSize: 20, height: 1.8),
      );
    }
    final phrases =
        [...rows(article?['words']), ...store.dictionary]
            .expand(
              (w) => [
                str(w['term']),
                ...(w['variants'] as List? ?? []).map(str),
              ],
            )
            .where((s) => s.contains(' '))
            .toSet()
            .toList()
          ..sort((a, b) => b.length.compareTo(a.length));
    final pattern = RegExp(
      '${phrases.isEmpty ? '' : '${phrases.map((p) => '\\b${RegExp.escape(p)}\\b').join('|')}|'}[a-zA-Z]+(?:[’\'][a-zA-Z]+)?|[^a-zA-Z]+',
      caseSensitive: false,
    );
    return Text.rich(
      TextSpan(
        children: pattern.allMatches(text).map((m) {
          final value = m.group(0)!;
          if (!RegExp('[a-zA-Z]').hasMatch(value)) return TextSpan(text: value);
          return WidgetSpan(
            alignment: PlaceholderAlignment.baseline,
            baseline: TextBaseline.alphabetic,
            child: InkWell(
              onTap: () {
                onHint?.call();
                showWord(
                  context,
                  store.lookup(value, article),
                  article,
                  example: text,
                );
              },
              child: Text(
                value,
                style: const TextStyle(
                  fontSize: 20,
                  color: green,
                  decoration: TextDecoration.underline,
                  decorationColor: Color(0xffc3d2c8),
                ),
              ),
            ),
          );
        }).toList(),
      ),
      style: const TextStyle(fontSize: 20, height: 1.8),
    );
  }
}

Future<void> showWord(
  BuildContext context,
  Data word,
  Data? article, {
  String example = '',
}) async {
  final meaning = TextEditingController(text: str(word['meaning']));
  final mnemonic = TextEditingController(
    text: str(word['mnemonic'] ?? word['note']),
  );
  // Present the word immediately, even if the device TTS engine is slow.
  unawaited(speak(context, str(word['term'])));
  if (!context.mounted) return;
  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) => SafeArea(
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          24,
          0,
          24,
          24 + MediaQuery.viewInsetsOf(ctx).bottom,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            heading(
              str(word['term']),
              store.prefs['ipa'] == true ? str(word['ipa']) : '',
            ),
            if (store.prefs['homophones'] == true &&
                str(word['homophone']).isNotEmpty)
              Text('谐音：${word['homophone']}'),
            if (store.prefs['meaning'] == true || str(word['meaning']).isEmpty)
              TextField(
                controller: meaning,
                decoration: const InputDecoration(labelText: '中文词义（收藏必填）'),
              ),
            if (store.prefs['examples'] == true)
              Text(
                str(word['example']).isNotEmpty
                    ? str(word['example'])
                    : example,
                style: const TextStyle(height: 1.7),
              ),
            if (store.prefs['notes'] == true)
              TextField(
                controller: mnemonic,
                decoration: const InputDecoration(labelText: '我的记忆方法'),
              ),
            actions([
              action(
                '发音',
                () => speak(ctx, str(word['term'])),
                icon: Icons.volume_up_outlined,
              ),
              action('收藏 / 保存', () {
                if (meaning.text.trim().isEmpty) {
                  message(ctx, '请填写词义');
                  return;
                }
                store.collect({
                  ...word,
                  'meaning': meaning.text.trim(),
                  'mnemonic': mnemonic.text,
                  'example': str(word['example']).isNotEmpty
                      ? word['example']
                      : example,
                }, article);
                Navigator.pop(ctx);
                message(context, '已保存到生词本');
              }, primary: true),
            ]),
          ],
        ),
      ),
    ),
  );
  meaning.dispose();
  mnemonic.dispose();
}
