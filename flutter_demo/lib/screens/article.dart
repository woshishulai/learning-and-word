import 'package:flutter/material.dart';
import '../common.dart';
import '../store.dart';
import '../sentences.dart';
import '../pages.dart';

class ParagraphCard extends StatelessWidget {
  final Data paragraph, article;
  final int index;
  final bool full;
  const ParagraphCard({
    super.key,
    required this.paragraph,
    required this.article,
    required this.index,
    this.full = false,
  });
  @override
  Widget build(BuildContext context) {
    final content = <Widget>[
      if (!full) ...[
        Text(
          '第 ${index + 1} 段',
          style: const TextStyle(color: Colors.blueGrey),
        ),
        const SizedBox(height: 12),
      ],
      if (store.prefs['images'] == true) assetImage(str(paragraph['image'])),
      const SizedBox(height: 14),
      if (full || store.prefs['english'] == true)
        EnglishText(str(paragraph['en']), article: article),
      if (store.prefs['translation'] == true)
        Padding(
          padding: const EdgeInsets.only(top: 14),
          child: Text(
            str(paragraph['zh']),
            style: const TextStyle(
              fontSize: 17,
              height: 1.8,
              color: Colors.blueGrey,
            ),
          ),
        ),
      if (store.prefs['homophones'] == true)
        Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Text(
            str(paragraph['homophone']).isEmpty
                ? '本段暂无谐音提示'
                : str(paragraph['homophone']),
            style: const TextStyle(height: 1.6, color: Colors.brown),
          ),
        ),
      if (!full)
        actions([
          action(
            '朗读本段',
            () => speak(context, str(paragraph['en'])),
            icon: Icons.volume_up_outlined,
          ),
          action('停止', voice.stop),
          for (final (i, s) in splitSentences([str(paragraph['en'])]).indexed)
            TextButton(
              onPressed: () => speak(context, s),
              child: Text('听第 ${i + 1} 句'),
            ),
        ]),
    ];
    if (!full) return panel(content);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: content,
      ),
    );
  }
}

class ArticlePage extends StatefulWidget {
  final Data article;
  final bool reviewOnly;
  const ArticlePage({
    super.key,
    required this.article,
    this.reviewOnly = false,
  });
  @override
  State<ArticlePage> createState() => _ArticlePageState();
}

class _ArticlePageState extends State<ArticlePage> {
  int? paragraph;
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: store,
    builder: (context, _) => Shell(
      title: str(widget.article['title']),
      bottomBar: widget.reviewOnly
          ? action('返回学习', () => Navigator.pop(context), primary: true)
          : action(
              '开始学习',
              () => openPage(context, StudyPage(article: widget.article)),
              primary: true,
            ),
      children: [
        heading(
          str(widget.article['title']),
          str(widget.article['englishTitle']),
        ),
        actions([
          FilterChip(
            label: const Text('中文翻译'),
            selected: store.prefs['translation'] == true,
            onSelected: (v) {
              store.prefs['translation'] = v;
              store.save();
            },
          ),
          FilterChip(
            label: const Text('谐音提示'),
            selected: store.prefs['homophones'] == true,
            onSelected: (v) {
              store.prefs['homophones'] = v;
              store.save();
            },
          ),
          action(
            '朗读全文',
            () => speak(
              context,
              rows(
                widget.article['paragraphs'],
              ).map((p) => str(p['en'])).join(' '),
            ),
          ),
          action('停止朗读', voice.stop, icon: Icons.stop_rounded),
          action(
            '句子训练',
            () => openPage(
              context,
              SentencePage(
                sentences: splitSentences(
                  rows(widget.article['paragraphs']).map((p) => str(p['en'])),
                ),
                title: str(widget.article['title']),
              ),
            ),
          ),
        ]),
        if (widget.reviewOnly)
          DropdownButtonFormField<int>(
            value: paragraph ?? -1,
            decoration: const InputDecoration(labelText: '原文段落'),
            items: [
              const DropdownMenuItem(value: -1, child: Text('完整原文')),
              for (
                var i = 0;
                i < rows(widget.article['paragraphs']).length;
                i++
              )
                DropdownMenuItem(value: i, child: Text('第 ${i + 1} 段')),
            ],
            onChanged: (v) {
              voice.stop();
              setState(() => paragraph = v == -1 ? null : v);
            },
          ),
        for (final (i, p) in rows(widget.article['paragraphs']).indexed)
          if (paragraph == null || paragraph == i)
            ParagraphCard(
              paragraph: p,
              article: widget.article,
              index: i,
              full: true,
            ),
      ],
    ),
  );
}
