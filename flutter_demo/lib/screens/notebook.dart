import 'dart:convert';
import 'dart:typed_data';
import 'package:file_saver/file_saver.dart';
import 'package:flutter/material.dart';
import '../common.dart';
import '../store.dart';
import '../quiz.dart';
import '../sentences.dart';

class NotebookPage extends StatefulWidget {
  const NotebookPage({super.key});
  @override
  State<NotebookPage> createState() => _NotebookPageState();
}

class _NotebookPageState extends State<NotebookPage> {
  String level = '全部', article = '全部', query = '';
  List<Data> get filtered => store.notebook.values
      .map((w) => Map<String, dynamic>.from(w))
      .where(
        (w) =>
            (rows(w['sources']).isEmpty ? [w] : rows(w['sources'])).any(
              (s) =>
                  (level == '全部' || s['level'] == level) &&
                  (article == '全部' || s['articleId'] == article),
            ) &&
            '${w['term']} ${w['meaning']} ${w['mnemonic']}'
                .toLowerCase()
                .contains(query.toLowerCase()),
      )
      .toList();
  Future<void> add() async {
    final term = TextEditingController(),
        meaning = TextEditingController(),
        example = TextEditingController();
    await showDialog(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('添加生词'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: term,
                decoration: const InputDecoration(labelText: '英文单词或短语'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: meaning,
                decoration: const InputDecoration(labelText: '中文词义'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: example,
                decoration: const InputDecoration(labelText: '英文例句'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () {
              if (!RegExp(
                    r"^[a-zA-Z][a-zA-Z '\-]{0,79}$",
                  ).hasMatch(term.text.trim()) ||
                  meaning.text.trim().isEmpty) {
                message(c, '请填写有效英文和中文词义');
                return;
              }
              store.collect(
                {
                  'id': normal(term.text),
                  'term': term.text.trim(),
                  'meaning': meaning.text.trim(),
                  'example': example.text.trim(),
                  'level': level == '全部' ? '高中' : level,
                },
                (article == '全部' || article == 'manual')
                    ? null
                    : store.articles.firstWhere((a) => a['id'] == article),
              );
              Navigator.pop(c);
            },
            child: const Text('保存'),
          ),
        ],
      ),
    );
    term.dispose();
    meaning.dispose();
    example.dispose();
  }

  Future<void> export(String format) async {
    String content;
    String cell(dynamic value) {
      var s = str(value);
      if (RegExp(r'^\s*[=+@-]').hasMatch(s)) s = "'$s";
      return '"${s.replaceAll('"', '""')}"';
    }

    if (format == 'json') {
      content = const JsonEncoder.withIndent('  ').convert(filtered);
    } else if (format == 'csv') {
      content =
          '\uFEFF单词,词义,例句,文章\r\n${filtered.map((w) => [w['term'], w['meaning'], w['example'], w['source']].map(cell).join(',')).join('\r\n')}';
    } else {
      content = filtered
          .map((w) => '${w['term']}\t${w['meaning']}\n${w['example'] ?? ''}')
          .join('\n\n');
    }
    try {
      final path = await FileSaver.instance.saveFile(
        name: '词境生词本',
        bytes: Uint8List.fromList(utf8.encode(content)),
        ext: format,
        mimeType: MimeType.custom,
        customMimeType: format == 'json'
            ? 'application/json'
            : format == 'csv'
            ? 'text/csv'
            : 'text/plain',
      );
      if (mounted) message(context, '已导出${path.isEmpty ? '' : '：$path'}');
    } catch (_) {
      if (mounted) message(context, '导出失败，请检查设备文件权限后重试。');
    }
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: store,
    builder: (context, _) => Shell(
      title: '我的生词本',
      children: [
        heading('把遇见的单词留下来', '按文章整理，按自己的节奏练习。'),
        panel([
          actions([
            for (final l in ['全部', '小学', '初中', '高中'])
              ChoiceChip(
                label: Text(l),
                selected: level == l,
                onSelected: (_) => setState(() {
                  level = l;
                  article = '全部';
                }),
              ),
          ]),
          DropdownButtonFormField<String>(
            value: article,
            decoration: const InputDecoration(labelText: '所属文章'),
            items: [
              const DropdownMenuItem(value: '全部', child: Text('全部文章')),
              const DropdownMenuItem(value: 'manual', child: Text('手动添加')),
              for (final a in store.articles.where(
                (a) => level == '全部' || a['level'] == level,
              ))
                DropdownMenuItem(
                  value: str(a['id']),
                  child: Text(str(a['title'])),
                ),
            ],
            onChanged: (v) => setState(() => article = v!),
          ),
          const SizedBox(height: 12),
          TextField(
            decoration: const InputDecoration(labelText: '搜索单词 / 词义'),
            onChanged: (v) => setState(() => query = v),
          ),
          actions([
            action('手动添加', add),
            for (final m in {'spelling': '随机默写', 'choice': '词义选择'}.entries)
              action(
                m.value,
                filtered.isEmpty
                    ? null
                    : () => openPage(
                        context,
                        QuizPage(
                          title: m.value,
                          questions: store.wordQuiz(filtered, m.key),
                        ),
                      ),
                primary: true,
              ),
            action(
              '例句训练',
              filtered.isEmpty
                  ? null
                  : () => openPage(
                      context,
                      SentencePage(
                        sentences: splitSentences(
                          filtered.map((w) => str(w['example'])),
                        ),
                        title: '生词本例句',
                      ),
                    ),
            ),
          ]),
        ]),
        actions([
          Text('当前 ${filtered.length} 个词'),
          for (final format in ['csv', 'txt', 'json'])
            TextButton(
              onPressed: filtered.isEmpty ? null : () => export(format),
              child: Text('导出 ${format.toUpperCase()}'),
            ),
        ]),
        if (filtered.isEmpty) panel([const Text('暂无符合条件的生词，阅读时点词收藏，或手动添加。')]),
        for (final w in filtered)
          panel([
            heading(str(w['term']), str(w['meaning'])),
            Text('${w['level']} · ${w['source']}'),
            if (store.prefs['homophones'] == true)
              Text('谐音：${w['homophone'] ?? ''}'),
            actions([
              action('发音 / 编辑', () => showWord(context, w, null)),
              TextButton(
                onPressed: () async {
                  if (await confirm(
                    context,
                    '移出生词本？',
                    '移除 ${w['term']} 的收藏，已有复习记录保留。',
                  )) {
                    store.notebook.remove(w['id']);
                    store.save();
                  }
                },
                child: const Text('移出'),
              ),
            ]),
          ]),
      ],
    ),
  );
}
