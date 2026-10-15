import 'package:flutter/material.dart';
import '../common.dart';
import '../quiz.dart';

class ReviewPage extends StatelessWidget {
  const ReviewPage({super.key});
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: store,
    builder: (context, _) => Shell(
      title: '复习中心',
      children: [
        heading('离开原文，也能想起来', '提示默认隐藏，需要时再主动打开。'),
        panel([
          heading('${store.due.length} 个到期词', '演示预置词可直接体验到期复习。'),
          const Text('到期复习：独立答对才延长间隔；答错稍后重练；使用提示答对仍保留原安排。'),
          action(
            '开始到期复习',
            store.due.isEmpty
                ? null
                : () => openPage(
                    context,
                    QuizPage(
                      title: '到期复习',
                      questions: store.wordQuiz(store.due, 'spelling'),
                      mode: 'due',
                    ),
                  ),
            primary: true,
          ),
        ]),
        panel([
          heading('自由练习', '不改变原来的复习时间和掌握等级。'),
          actions([
            for (final mode in {'spelling': '随机默写', 'choice': '词义选择'}.entries)
              action(
                mode.value,
                store.records.isEmpty
                    ? null
                    : () => openPage(
                        context,
                        QuizPage(
                          title: '自由练习 · ${mode.value}',
                          questions: store.wordQuiz(
                            store.records.keys
                                .map(store.wordById)
                                .where((w) => w.isNotEmpty)
                                .toList(),
                            mode.key,
                          ),
                        ),
                      ),
              ),
          ]),
        ]),
      ],
    ),
  );
}
