import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wordscape_demo/common.dart';
import 'package:wordscape_demo/store.dart';
import 'package:wordscape_demo/pages.dart';
import 'package:wordscape_demo/quiz.dart';
import 'package:wordscape_demo/sentences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('flutter_tts'),
          (_) async => 1,
        );
    store = DemoStore();
    await store.load();
  });
  test(
    'bundle preserves all original paragraphs, images, hints and questions',
    () async {
      final a = store.articles.first;
      expect(rows(a['paragraphs']).length, 9);
      expect(rows(a['words']).length, 18);
      for (final p in rows(a['paragraphs'])) {
        expect(str(p['homophone']), isNotEmpty);
        expect(await rootBundle.load(str(p['image'])), isNotNull);
      }
      expect(rows(a['lessons']).expand((l) => rows(l['practice'])).length, 36);
      expect(store.articles.any((a) => a['level'] == '小学'), true);
    },
  );
  test(
    'assisted review cannot postpone due date and local progress survives reload',
    () async {
      final id = store.due.first['id'] as String;
      final before = jsonEncode(store.records[id]);
      store.record(id, true, assisted: true, dueReview: true);
      expect(jsonEncode(store.records[id]), before);
      store.record(id, true, dueReview: true);
      final after = jsonEncode(store.records[id]);
      store.record(id, true, dueReview: true);
      expect(jsonEncode(store.records[id]), after);
      await store.save();
      final reload = DemoStore();
      await reload.load();
      expect(jsonEncode(reload.records[id]), after);
    },
  );
  test('import is atomic and choices unique', () {
    final count = store.articles.length;
    expect(
      () => store.importJson(
        jsonEncode([
          {
            'id': 'new-article',
            'title': 'Test',
            'level': '小学',
            'paragraphs': [
              {'en': 'Hello.'},
            ],
          },
          {'id': 'bad'},
        ]),
      ),
      throwsFormatException,
    );
    expect(store.articles.length, count);
    final q = store.wordQuiz(store.due, 'choice').first;
    expect(
      (q['options'] as List).toSet().length,
      (q['options'] as List).length,
    );
    expect(q['options'], contains(q['answer']));
    expect(sentenceNormal('I like it!'), sentenceNormal(' i like it. '));
  });
  testWidgets('mobile article preserves full text and paragraph controls', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(const MaterialApp(home: HomePage()));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('阅读全文'));
    await tester.tap(find.text('阅读全文'));
    await tester.pumpAndSettle();
    expect(find.text('原文段落'), findsOneWidget);
    expect(find.text('第 1 段'), findsWidgets);
    expect(find.text('开始学习'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
  testWidgets('quiz hides assistance and stores submitted answer', (
    tester,
  ) async {
    final questions = [
      <String, dynamic>{
        'id': 'q',
        'prompt': 'Write cat',
        'answer': 'cat',
        'explanation': '猫',
      },
    ];
    await tester.pumpWidget(
      MaterialApp(
        home: QuizPage(title: '测试复习', questions: questions, sessionKey: 'test'),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('学习提示（翻译 / 查词）'), findsOneWidget);
    expect(find.text('朗读题干'), findsNothing);
    await tester.enterText(find.byType(TextField), 'cat');
    await tester.pump();
    await tester.ensureVisible(find.text('确认答案'));
    await tester.tap(find.text('确认答案'));
    await tester.pumpAndSettle();
    expect(find.text('回答正确'), findsOneWidget);
    expect(store.sessions['test']['feedback']['correct'], true);
    expect(tester.takeException(), isNull);
  });
  testWidgets(
    'sentence dictation hides original and supports wrong-answer retry',
    (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: SentencePage(sentences: ['I like my cat.'], title: '测试例句'),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('听音默写'));
      await tester.pump();
      await tester.tap(find.text('随机开始训练'));
      await tester.pumpAndSettle();
      expect(find.text('I like my cat.'), findsNothing);
      await tester.enterText(find.byType(TextField), 'wrong');
      await tester.pump();
      await tester.ensureVisible(find.text('检查答案'));
      await tester.tap(find.text('检查答案'));
      await tester.pump();
      await tester.ensureVisible(find.text('查看结果'));
      await tester.tap(find.text('查看结果'));
      await tester.pumpAndSettle();
      expect(find.text('只练错句'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
}
