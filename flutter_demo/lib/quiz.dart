import 'package:flutter/material.dart';
import 'common.dart';
import 'store.dart';
import 'pages.dart';

class QuizPage extends StatefulWidget {
  final String title, mode;
  final List<Data> questions;
  final Data? article;
  final String? sessionKey;
  final bool embedded;
  final VoidCallback? onComplete;
  final VoidCallback? onAdvance;
  const QuizPage({
    super.key,
    required this.title,
    required this.questions,
    this.mode = 'free',
    this.article,
    this.sessionKey,
    this.embedded = false,
    this.onComplete,
    this.onAdvance,
  });
  @override
  State<QuizPage> createState() => _QuizPageState();
}

class _QuizPageState extends State<QuizPage> {
  final scroll = ScrollController();
  final input = TextEditingController();
  int index = 0;
  String selected = '';
  bool hints = false, translation = false, assisted = false;
  Data? feedback;
  List<Data> answers = [];
  late List<Data> questions;
  @override
  void initState() {
    super.initState();
    final saved = store.sessions[widget.sessionKey];
    questions = saved is Map && saved['questions'] is List
        ? rows(saved['questions'])
        : widget.questions;
    if (saved is Map) {
      index = saved['index'] ?? 0;
      answers = rows(saved['answers']);
      feedback = saved['feedback'] == null
          ? null
          : Map<String, dynamic>.from(saved['feedback']);
      selected = str(saved['selected']);
      input.text = selected;
      assisted = saved['assisted'] == true;
    }
  }

  @override
  void dispose() {
    scroll.dispose();
    input.dispose();
    voice.stop();
    super.dispose();
  }

  Data get question => questions[index];
  bool get finished => index >= questions.length;
  void persist() {
    if (widget.sessionKey == null) return;
    store.sessions[widget.sessionKey!] = {
      'index': index,
      'questions': questions,
      'answers': answers,
      'feedback': feedback,
      'selected': selected,
      'assisted': assisted,
      'finished': finished,
    };
    store.save();
  }

  void markHint() {
    assisted = true;
    persist();
  }

  void submit({bool skip = false}) {
    if (feedback != null || finished || (!skip && selected.trim().isEmpty)) {
      return;
    }
    final correct =
        !skip &&
        [
          question['answer'],
          ...(question['acceptedAnswers'] as List? ?? []),
        ].map((a) => normal(str(a))).contains(normal(selected));
    setState(
      () => feedback = {
        'correct': correct,
        'answer': selected,
        'assisted': assisted,
        'question': question,
      },
    );
    answers.add(feedback!);
    if (str(question['wordId']).isNotEmpty &&
        (widget.mode == 'due' ||
            widget.mode == 'learn' && question['kind'] == 'transfer')) {
      store.record(
        str(question['wordId']),
        correct,
        assisted: assisted,
        dueReview: widget.mode == 'due',
      );
    }
    persist();
  }

  void next() {
    voice.stop();
    setState(() {
      index++;
      feedback = null;
      selected = '';
      input.clear();
      hints = false;
      translation = false;
      assisted = false;
    });
    persist();
    if (finished) widget.onComplete?.call();
    widget.onAdvance?.call();
    if (scroll.hasClients) scroll.jumpTo(0);
  }

  Widget frame({required String title, required List<Widget> children}) =>
      widget.embedded
      ? Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: children,
        )
      : Shell(title: title, controller: scroll, children: children);

  @override
  Widget build(BuildContext context) {
    if (questions.isEmpty) {
      return frame(title: widget.title, children: [heading('暂无可练习题目')]);
    }
    if (finished) {
      final wrong = answers
          .where((a) => a['correct'] != true)
          .map((a) => Map<String, dynamic>.from(a['question']))
          .toList();
      return frame(
        title: widget.title,
        children: [
          heading(
            '这一轮，完成了',
            '答对 ${answers.length - wrong.length} / ${answers.length} 题',
          ),
          panel([
            const Icon(Icons.task_alt, size: 54, color: green),
            Text(
              '使用提示 ${answers.where((a) => a['assisted'] == true).length} 题',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              widget.mode == 'due'
                  ? '独立答对才调整复习间隔；用提示答对仍保留原到期安排。'
                  : '自由练习不会提前提升掌握等级或推迟复习。',
            ),
            for (final q in wrong)
              ListTile(
                title: Text(str(q['prompt'])),
                subtitle: Text('正确答案：${q['answer']}'),
              ),
            actions([
              if (wrong.isNotEmpty)
                action(
                  '只练错题',
                  () => openPage(
                    context,
                    QuizPage(
                      title: '错题重练',
                      questions: randomOrder(wrong),
                      article: widget.article,
                    ),
                  ),
                  primary: true,
                ),
              if (widget.embedded)
                action('继续下一步', widget.onComplete, primary: true)
              else
                action('返回上一级', () => Navigator.pop(context)),
            ]),
          ]),
        ],
      );
    }
    final options = (question['options'] as List? ?? []).map(str).toList();
    return frame(
      title: widget.title,
      children: [
        heading(widget.title, '第 ${index + 1} / ${questions.length} 题'),
        LinearProgressIndicator(value: index / questions.length),
        panel([
          EnglishText(
            str(question['prompt']),
            article: widget.article,
            clickable: hints || feedback != null,
            onHint: markHint,
          ),
          actions([
            if (feedback == null)
              action(
                hints ? '收起学习提示' : '学习提示（翻译 / 查词）',
                () => setState(() => hints = !hints),
                icon: Icons.lightbulb_outline,
              ),
            if (widget.article != null)
              action('回看原文 / 第一段', () {
                markHint();
                openPage(
                  context,
                  ArticlePage(article: widget.article!, reviewOnly: true),
                );
              }),
          ]),
          if (hints || feedback != null)
            actions([
              action('朗读题干', () => speak(context, str(question['prompt']))),
              if (str(question['promptZh']).isNotEmpty)
                action(translation ? '隐藏翻译' : '显示翻译', () {
                  markHint();
                  setState(() => translation = !translation);
                }),
              if (str(question['promptZh']).isNotEmpty)
                action('听中文', () {
                  markHint();
                  speak(context, str(question['promptZh']), chinese: true);
                }),
            ]),
          if (translation && (hints || feedback != null))
            Text(
              str(question['promptZh']),
              style: const TextStyle(color: Colors.blueGrey, height: 1.7),
            ),
          if (assisted)
            const Text('已使用提示：不计为独立掌握', style: TextStyle(color: Colors.orange)),
          const SizedBox(height: 18),
          if (options.isNotEmpty)
            for (final (i, option) in options.indexed)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Radio<String>(
                      value: option,
                      groupValue: selected,
                      onChanged: feedback == null
                          ? (v) {
                              setState(() => selected = v!);
                              persist();
                            }
                          : null,
                    ),
                    Expanded(
                      child: InkWell(
                        onTap: feedback == null
                            ? () {
                                setState(() => selected = option);
                                persist();
                              }
                            : null,
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            border: Border.all(
                              color:
                                  feedback != null &&
                                      option == question['answer']
                                  ? green
                                  : Colors.black12,
                            ),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('${String.fromCharCode(65 + i)}.'),
                              EnglishText(
                                option,
                                article: widget.article,
                                clickable: hints || feedback != null,
                                onHint: markHint,
                              ),
                              if (translation &&
                                  i <
                                      (question['optionTranslations']
                                                  as List? ??
                                              [])
                                          .length)
                                Text(str(question['optionTranslations'][i])),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          if (options.isEmpty)
            TextField(
              controller: input,
              enabled: feedback == null,
              autocorrect: false,
              enableSuggestions: false,
              decoration: const InputDecoration(labelText: '输入英文答案'),
              onChanged: (v) {
                setState(() => selected = v);
                persist();
              },
              onSubmitted: (_) => submit(),
            ),
          if (feedback != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    feedback!['correct'] == true ? '回答正确' : '再记一次',
                    style: const TextStyle(color: green, fontSize: 20),
                  ),
                  Text('正确答案：${question['answer']}'),
                  Text(
                    str(question['explanation']),
                    style: const TextStyle(height: 1.7),
                  ),
                ],
              ),
            ),
          actions(
            feedback != null
                ? [
                    action(
                      index == questions.length - 1 ? '查看结果' : '下一题',
                      next,
                      primary: true,
                    ),
                  ]
                : [
                    action('暂时想不起来', () => submit(skip: true)),
                    action(
                      '确认答案',
                      selected.trim().isEmpty ? null : submit,
                      primary: true,
                    ),
                  ],
          ),
        ]),
      ],
    );
  }
}
