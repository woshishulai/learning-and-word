import 'package:flutter/material.dart';
import 'common.dart';
import 'store.dart';

List<String> splitSentences(Iterable<String> paragraphs) => paragraphs
    .expand(
      (p) => RegExp(
        r'[^.!?]+(?:[.!?]+|$)',
      ).allMatches(p).map((m) => m.group(0)!.trim()),
    )
    .where((s) => s.isNotEmpty && RegExp('[a-zA-Z]').hasMatch(s))
    .toSet()
    .toList();
String sentenceNormal(String s) => normal(s)
    .replaceAll(RegExp(r"[^a-z0-9'\s]"), ' ')
    .replaceAll(RegExp(r'\s+'), ' ')
    .trim();

class SentencePage extends StatefulWidget {
  final List<String> sentences;
  final String title;
  const SentencePage({super.key, required this.sentences, required this.title});
  @override
  State<SentencePage> createState() => _SentencePageState();
}

class _SentencePageState extends State<SentencePage> {
  String mode = 'listen';
  bool started = false;
  int index = 0;
  List<String> queue = [], wrong = [], tokens = [];
  List<int> shuffled = [], chosen = [];
  bool? correct;
  final input = TextEditingController();
  @override
  void dispose() {
    input.dispose();
    voice.stop();
    super.dispose();
  }

  void start(List<String> items) {
    setState(() {
      queue = randomOrder(items);
      wrong = [];
      index = 0;
      started = true;
      prepare();
    });
  }

  void prepare() {
    correct = null;
    chosen = [];
    input.clear();
    tokens = index < queue.length ? queue[index].split(RegExp(r'\s+')) : [];
    shuffled = randomOrder(List.generate(tokens.length, (i) => i));
    if (shuffled.length > 1 && shuffled.indexed.every((p) => p.$1 == p.$2)) {
      shuffled.add(shuffled.removeAt(0));
    }
  }

  String get answer =>
      mode == 'order' ? chosen.map((i) => tokens[i]).join(' ') : input.text;
  void submit(bool skip) {
    if (correct != null) return;
    setState(
      () => correct =
          !skip && sentenceNormal(answer) == sentenceNormal(queue[index]),
    );
    if (correct != true) wrong.add(queue[index]);
  }

  @override
  Widget build(BuildContext context) => Shell(
    title: '句子训练',
    children: [
      heading('句子训练', '${widget.title} · ${widget.sentences.length} 句'),
      if (widget.sentences.isEmpty)
        panel([const Text('暂无例句，请收藏带例句的生词，或从文章进入。')])
      else if (!started)
        panel([
          actions([
            for (final e in {
              'listen': '听句跟读',
              'order': '乱序组句',
              'dictation': '听音默写',
            }.entries)
              ChoiceChip(
                label: Text(e.value),
                selected: mode == e.key,
                onSelected: (_) => setState(() => mode = e.key),
              ),
          ]),
          Text(
            {
              'listen': '播放原句，对照英文自行跟读。不录音、不自动评测发音。',
              'order': '点击打乱的词块，重新组成原句；点击已选词块可撤回。',
              'dictation': '先听句子，再默写英文，提交后对照原句。',
            }[mode]!,
          ),
          const SizedBox(height: 20),
          action('随机开始训练', () => start(widget.sentences), primary: true),
          const Text('本轮结果在当前页面保留，不改变单词掌握等级。'),
        ])
      else if (index >= queue.length)
        panel([
          heading(
            '本轮完成',
            mode == 'listen'
                ? '已跟读 ${queue.length} 句'
                : '答对 ${queue.length - wrong.length} / ${queue.length} 句',
          ),
          for (final s in wrong)
            ListTile(
              title: Text(s),
              trailing: IconButton(
                tooltip: '朗读正确句子',
                icon: const Icon(Icons.volume_up),
                onPressed: () => speak(context, s),
              ),
            ),
          actions([
            if (wrong.isNotEmpty)
              action('只练错句', () => start(wrong), primary: true),
            action('重新选择模式', () => setState(() => started = false)),
          ]),
        ])
      else
        panel([
          Text('第 ${index + 1} / ${queue.length} 句'),
          actions([
            action(
              '播放句子',
              () => speak(context, queue[index]),
              icon: Icons.volume_up,
            ),
            action('停止朗读', voice.stop),
          ]),
          if (mode == 'listen' || correct != null)
            Text(
              queue[index],
              style: const TextStyle(fontSize: 22, height: 1.7),
            ),
          if (mode == 'order') ...[
            Container(
              constraints: const BoxConstraints(minHeight: 90),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.black26),
                borderRadius: BorderRadius.circular(16),
              ),
              child: chosen.isEmpty
                  ? const Text('在这里组成句子')
                  : Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final i in chosen)
                          InputChip(
                            label: Text(tokens[i]),
                            onDeleted: correct == null
                                ? () => setState(() => chosen.remove(i))
                                : null,
                          ),
                      ],
                    ),
            ),
            actions([
              for (final i in shuffled.where((i) => !chosen.contains(i)))
                ActionChip(
                  label: Text(tokens[i]),
                  onPressed: correct == null
                      ? () => setState(() => chosen.add(i))
                      : null,
                ),
            ]),
          ],
          if (mode == 'dictation')
            TextField(
              controller: input,
              maxLines: 4,
              enabled: correct == null,
              autocorrect: false,
              enableSuggestions: false,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(labelText: '听音默写句子'),
            ),
          if (correct != null)
            Text(
              correct == true
                  ? '回答正确'
                  : '你的答案：${answer.isEmpty ? '未作答' : answer}',
            ),
          actions(
            mode == 'listen' || correct != null
                ? [
                    action(index == queue.length - 1 ? '查看结果' : '下一句', () {
                      voice.stop();
                      setState(() {
                        index++;
                        prepare();
                      });
                    }, primary: true),
                  ]
                : [
                    action('不会，查看原句', () => submit(true)),
                    action(
                      '检查答案',
                      answer.trim().isEmpty ? null : () => submit(false),
                      primary: true,
                    ),
                  ],
          ),
        ]),
    ],
  );
}
