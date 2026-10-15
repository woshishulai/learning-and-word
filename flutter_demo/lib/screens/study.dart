import 'package:flutter/material.dart';
import '../common.dart';
import '../store.dart';
import '../quiz.dart';
import '../sentences.dart';
import '../pages.dart';

class StudyPage extends StatefulWidget {
  final Data article;
  const StudyPage({super.key, required this.article});
  @override
  State<StudyPage> createState() => _StudyPageState();
}

class _StudyPageState extends State<StudyPage> {
  int lessonIndex = 0, paragraph = 0, wordIndex = 0;
  String stage = 'read';
  String get key => 'study:${widget.article['id']}';
  List<Data> get lessons => rows(widget.article['lessons']);
  Data get lesson => lessons.isEmpty ? widget.article : lessons[lessonIndex];
  List<Data> get paragraphs => lessons.isEmpty
      ? rows(widget.article['paragraphs'])
      : rows(
          widget.article['paragraphs'],
        ).skip(lessonIndex * 3).take(3).toList();
  List<Data> get words => lessons.isEmpty
      ? rows(widget.article['words'])
      : (lesson['wordIds'] as List)
            .map((id) => store.wordById(str(id)))
            .where((w) => w.isNotEmpty)
            .toList();
  @override
  void initState() {
    super.initState();
    final s = store.sessions[key];
    if (s is Map) {
      lessonIndex = (s['lesson'] as int? ?? 0).clamp(
        0,
        lessons.isEmpty ? 0 : lessons.length - 1,
      );
      stage = str(s['stage']);
      paragraph = (s['paragraph'] as int? ?? 0).clamp(0, paragraphs.length - 1);
      wordIndex = (s['word'] as int? ?? 0).clamp(
        0,
        words.isEmpty ? 0 : words.length - 1,
      );
    }
  }

  void save() {
    store.sessions[key] = {
      'lesson': lessonIndex,
      'stage': stage,
      'paragraph': paragraph,
      'word': wordIndex,
    };
    store.save();
  }

  void change(VoidCallback fn) {
    voice.stop();
    setState(fn);
    save();
  }

  List<Data> get questions => lessons.isEmpty
      ? rows(widget.article['questions'])
      : rows(lesson['questions']);
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: store,
    builder: (context, _) => Shell(
      title: '情景学习',
      children: [
        heading(str(widget.article['title']), '可自由选择段落和步骤，学习位置自动保存在本机。'),
        if (lessons.isNotEmpty)
          DropdownButtonFormField<int>(
            value: lessonIndex,
            decoration: const InputDecoration(labelText: '选择情节'),
            items: [
              for (final (i, l) in lessons.indexed)
                DropdownMenuItem(
                  value: i,
                  child: Text('${i + 1}. ${l['title']}'),
                ),
            ],
            onChanged: (v) => change(() {
              lessonIndex = v!;
              paragraph = 0;
              wordIndex = 0;
              stage = 'read';
            }),
          ),
        actions([
          for (final e in {
            'read': '读故事',
            'understand': '理解情节',
            'words': '认识单词',
            'practice': '主动回忆',
            'result': '学习收获',
          }.entries)
            ChoiceChip(
              label: Text(e.value),
              selected: stage == e.key,
              onSelected: (_) => change(() => stage = e.key),
            ),
          action(
            '回看完整原文',
            () => openPage(
              context,
              ArticlePage(article: widget.article, reviewOnly: true),
            ),
          ),
        ]),
        if (stage == 'read') ...[
          DropdownButtonFormField<int>(
            value: paragraph,
            decoration: const InputDecoration(labelText: '选择段落'),
            items: [
              for (var i = 0; i < paragraphs.length; i++)
                DropdownMenuItem(value: i, child: Text('第 ${i + 1} 段')),
            ],
            onChanged: (v) => change(() => paragraph = v!),
          ),
          ParagraphCard(
            paragraph: paragraphs[paragraph],
            article: widget.article,
            index: paragraph + lessonIndex * 3,
          ),
          actions([
            action('第一段', () => change(() => paragraph = 0)),
            action(
              '上一段',
              paragraph == 0 ? null : () => change(() => paragraph--),
            ),
            if (paragraph < paragraphs.length - 1)
              action('下一段', () => change(() => paragraph++), primary: true)
            else
              action(
                '读完了，理解情节',
                () => change(() => stage = 'understand'),
                primary: true,
              ),
          ]),
        ],
        if (stage == 'understand')
          panel([
            heading('先读懂，再记住', '${questions.length} 道理解题'),
            action(
              questions.isEmpty ? '本篇暂无理解题' : '开始 / 继续理解题',
              questions.isEmpty
                  ? null
                  : () => openPage(
                      context,
                      QuizPage(
                        title: '理解情节',
                        questions: questions,
                        article: widget.article,
                        sessionKey: '$key:$lessonIndex:understand',
                      ),
                    ),
              primary: true,
            ),
          ]),
        if (stage == 'words') ...[
          if (words.isEmpty)
            panel([const Text('本篇未配置重点词。')])
          else
            panel([
              Text('${wordIndex + 1} / ${words.length}'),
              heading(
                str(words[wordIndex]['term']),
                store.prefs['ipa'] == true ? str(words[wordIndex]['ipa']) : '',
              ),
              if (store.prefs['meaning'] == true)
                Text(
                  str(words[wordIndex]['meaning']),
                  style: const TextStyle(fontSize: 20),
                ),
              if (store.prefs['homophones'] == true)
                Text('谐音：${words[wordIndex]['homophone'] ?? ''}'),
              if (store.prefs['notes'] == true)
                Text(
                  str(words[wordIndex]['mnemonic'] ?? words[wordIndex]['note']),
                ),
              if (store.prefs['examples'] == true)
                EnglishText(
                  str(
                    words[wordIndex]['example'] ?? words[wordIndex]['original'],
                  ),
                  article: widget.article,
                ),
              actions([
                action(
                  '发音 / 收藏',
                  () => showWord(context, words[wordIndex], widget.article),
                ),
                action(
                  '上一个词',
                  wordIndex == 0 ? null : () => change(() => wordIndex--),
                ),
                action(
                  wordIndex == words.length - 1 ? '开始回忆' : '下一个词',
                  () => change(() {
                    if (wordIndex == words.length - 1) {
                      stage = 'practice';
                    } else {
                      wordIndex++;
                    }
                  }),
                  primary: true,
                ),
              ]),
            ]),
        ],
        if (stage == 'practice')
          panel([
            heading('主动回忆', '默认隐藏提示，先试着自己想起来。'),
            action(
              '开始 / 继续回忆题',
              () => openPage(
                context,
                QuizPage(
                  title: '主动回忆',
                  questions: lessons.isEmpty
                      ? store.wordQuiz(words, 'spelling')
                      : rows(lesson['practice']),
                  article: widget.article,
                  mode: 'learn',
                  sessionKey: '$key:$lessonIndex:practice',
                ),
              ),
              primary: true,
            ),
          ]),
        if (stage == 'result')
          panel([
            heading('学习收获'),
            for (final s in ['understand', 'practice'])
              ListTile(
                leading: Icon(
                  store.sessions['$key:$lessonIndex:$s']?['finished'] == true
                      ? Icons.check_circle
                      : Icons.radio_button_unchecked,
                  color: green,
                ),
                title: Text(s == 'understand' ? '理解情节' : '主动回忆'),
                subtitle: Text(
                  store.sessions['$key:$lessonIndex:$s']?['finished'] == true
                      ? '本轮已完成'
                      : '尚未完成',
                ),
              ),
            actions([
              action(
                '句子训练',
                () => openPage(
                  context,
                  SentencePage(
                    sentences: splitSentences(
                      paragraphs.map((p) => str(p['en'])),
                    ),
                    title: str(lesson['title']),
                  ),
                ),
              ),
              if (lessonIndex < lessons.length - 1)
                action(
                  '下一个情节',
                  () => change(() {
                    lessonIndex++;
                    paragraph = 0;
                    wordIndex = 0;
                    stage = 'read';
                  }),
                  primary: true,
                ),
            ]),
          ]),
        TextButton(
          onPressed: () async {
            if (await confirm(
              context,
              '本篇从头学？',
              '只清除这篇文章的步骤和答题记录，保留生词本与单词复习安排。',
            )) {
              store.sessions.removeWhere(
                (k, v) => k == key || k.startsWith('$key:'),
              );
              change(() {
                lessonIndex = 0;
                paragraph = 0;
                wordIndex = 0;
                stage = 'read';
              });
            }
          },
          child: const Text('本篇从头学'),
        ),
      ],
    ),
  );
}
