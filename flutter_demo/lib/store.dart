import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

typedef Data = Map<String, dynamic>;
List<Data> rows(dynamic value) => (value as List? ?? [])
    .map((e) => Map<String, dynamic>.from(e as Map))
    .toList();
String str(dynamic value) => value?.toString() ?? '';
String normal(String value) => value
    .trim()
    .toLowerCase()
    .replaceAll(RegExp('[’‘]'), "'")
    .replaceAll(RegExp(r'[.!?。！？，,]+$'), '')
    .replaceAll(RegExp(r'\s+'), ' ');
List<T> randomOrder<T>(Iterable<T> values) => values.toList()..shuffle();

class DemoStore extends ChangeNotifier {
  static const storageKey = 'wordscape.flutter.demo.v1';
  late SharedPreferences disk;
  List<Data> articles = [], dictionary = [];
  Data notebook = {}, records = {}, sessions = {}, customWords = {};
  Data prefs = {
    'translation': false,
    'homophones': false,
    'english': true,
    'images': true,
    'meaning': true,
    'ipa': true,
    'examples': true,
    'notes': true,
    'accent': 'en-US',
    'rate': 0.85,
  };
  String? saveError;
  Future<void> pending = Future.value();
  Future<void> load() async {
    final bundle =
        jsonDecode(await rootBundle.loadString('assets/data/catalog.json'))
            as Map;
    articles = rows(bundle['articles']);
    dictionary = rows(bundle['dictionary']);
    disk = await SharedPreferences.getInstance();
    final raw = disk.getString(storageKey);
    if (raw == null) {
      seed();
      await save();
      return;
    }
    try {
      final data = jsonDecode(raw) as Map;
      notebook = Map<String, dynamic>.from(data['notebook'] ?? {});
      customWords = Map<String, dynamic>.from(data['customWords'] ?? {});
      records = Map<String, dynamic>.from(data['records'] ?? {});
      sessions = Map<String, dynamic>.from(data['sessions'] ?? {});
      prefs.addAll(Map<String, dynamic>.from(data['prefs'] ?? {}));
      articles.addAll(rows(data['imported']));
    } catch (_) {
      throw const FormatException('本机演示记录无法读取，请备份后再恢复演示数据。');
    }
  }

  void seed() {
    notebook = {};
    customWords = {};
    records = {};
    sessions = {};
    for (final w in rows(articles.first['words']).take(4)) {
      final id = str(w['id']).isEmpty ? normal(str(w['term'])) : str(w['id']);
      notebook[id] = {
        ...w,
        'id': id,
        'articleId': articles.first['id'],
        'source': articles.first['title'],
        'level': '高中',
      };
      records[id] = {
        'attempts': 1,
        'level': 0,
        'dueAt': DateTime.now()
            .subtract(const Duration(minutes: 1))
            .millisecondsSinceEpoch,
        'correct': false,
      };
    }
  }

  Future<void> reset() async {
    seed();
    await save();
  }

  Future<void> save() {
    final data = jsonEncode({
      'notebook': notebook,
      'customWords': customWords,
      'records': records,
      'sessions': sessions,
      'prefs': prefs,
      'imported': articles.where((a) => a['imported'] == true).toList(),
    });
    notifyListeners();
    pending = pending.catchError((_) {}).then((_) async {
      final previousError = saveError;
      try {
        if (!await disk.setString(storageKey, data)) throw StateError('写入失败');
        saveError = null;
      } catch (_) {
        saveError = '本机保存失败，请不要关闭应用，并重试保存。';
      }
      if (saveError != previousError) notifyListeners();
    });
    return pending;
  }

  Data lookup(String term, [Data? article]) {
    final value = normal(term);
    final pool = [
      ...notebook.values.map((e) => Map<String, dynamic>.from(e)),
      ...rows(article?['words']),
      ...dictionary,
    ];
    return pool.firstWhere(
      (w) =>
          normal(str(w['term'])) == value ||
          (w['variants'] as List? ?? []).any((v) => normal(str(v)) == value),
      orElse: () => {'id': value, 'term': term, 'meaning': ''},
    );
  }

  void collect(Data word, Data? article) {
    final id = str(word['id']).isEmpty
        ? normal(str(word['term']))
        : str(word['id']);
    final old = notebook[id];
    final sources = old is Map ? rows(old['sources']) : <Data>[];
    if (sources.isEmpty && old is Map) {
      sources.add({
        'articleId': old['articleId'],
        'title': old['source'],
        'level': old['level'],
      });
    }
    final source = {
      'articleId': article?['id'] ?? word['articleId'] ?? 'manual',
      'title': article?['title'] ?? word['source'] ?? '手动添加',
      'level': article?['level'] ?? word['level'] ?? '高中',
    };
    if (!sources.any((s) => s['articleId'] == source['articleId'])) {
      sources.add(source);
    }
    notebook[id] = {
      ...word,
      'sources': sources,
      'id': id,
      'articleId': article?['id'] ?? word['articleId'] ?? 'manual',
      'source': article?['title'] ?? word['source'] ?? '手动添加',
      'level': article?['level'] ?? word['level'] ?? '高中',
    };
    customWords[id] = notebook[id];
    records.putIfAbsent(
      id,
      () => {
        'attempts': 0,
        'level': 0,
        'dueAt': DateTime.now().millisecondsSinceEpoch,
        'correct': false,
      },
    );
    save();
  }

  List<Data> get due => records.entries
      .where(
        (e) =>
            (e.value['dueAt'] ?? 0) > 0 &&
            e.value['dueAt'] <= DateTime.now().millisecondsSinceEpoch,
      )
      .map((e) => wordById(e.key))
      .where((w) => w.isNotEmpty)
      .toList();
  Data wordById(String id) => notebook[id] != null
      ? Map<String, dynamic>.from(notebook[id])
      : customWords[id] != null
      ? Map<String, dynamic>.from(customWords[id])
      : [
          ...dictionary,
          ...articles.expand((a) => rows(a['words'])),
        ].firstWhere((w) => w['id'] == id, orElse: () => {});
  void record(
    String id,
    bool correct, {
    bool assisted = false,
    bool dueReview = false,
  }) {
    if (correct && assisted) return;
    final now = DateTime.now().millisecondsSinceEpoch;
    final old = Map<String, dynamic>.from(
      records[id] ?? {'attempts': 0, 'level': 0, 'dueAt': 0},
    );
    if (correct && !dueReview && (old['dueAt'] ?? 0) > 0) return;
    if (dueReview && (old['dueAt'] ?? 0) > now) return;
    final level = correct
        ? (dueReview
              ? min(4, (old['level'] as int? ?? 0) + 1)
              : old['level'] as int? ?? 0)
        : 0;
    records[id] = {
      'attempts': (old['attempts'] ?? 0) + 1,
      'level': level,
      'correct': correct,
      'dueAt': now + (correct ? [1, 3, 7, 14, 30][level] * 86400000 : 600000),
    };
    save();
  }

  List<Data> wordQuiz(List<Data> words, String mode) =>
      randomOrder(words).map((w) {
        if (mode == 'choice') {
          final options = randomOrder(
            {
              ...dictionary.map((d) => str(d['meaning'])),
              ...notebook.values.map((d) => str(d['meaning'])),
            }.where((m) => m.isNotEmpty && m != w['meaning']),
          ).take(3).toList()..add(str(w['meaning']));
          return <String, dynamic>{
            'id': '${w['id']}-choice',
            'wordId': w['id'],
            'prompt': '选择中文词义：${w['term']}',
            'answer': w['meaning'],
            'options': randomOrder(options),
            'explanation': '${w['term']}：${w['meaning']}',
          };
        }
        return <String, dynamic>{
          'id': '${w['id']}-spelling',
          'wordId': w['id'],
          'prompt': '根据词义写出单词：${w['meaning']}',
          'answer': w['term'],
          'explanation': w['example'] ?? w['meaning'],
        };
      }).toList();
  void importJson(String text) {
    final value = jsonDecode(text);
    final list = value is List ? value : [value];
    if (list.isEmpty || list.length > 100) {
      throw const FormatException('一次导入 1–100 篇文章');
    }
    final pendingArticles = <Data>[];
    final ids = articles.map((a) => a['id']).toSet();
    for (final item in list) {
      final a = Map<String, dynamic>.from(item as Map);
      if (!RegExp(r'^[a-z][a-z0-9-]{0,79}$').hasMatch(str(a['id'])) ||
          !ids.add(a['id'])) {
        throw const FormatException('文章 ID 无效或重复');
      }
      if (str(a['title']).trim().isEmpty ||
          !['小学', '初中', '高中'].contains(a['level'])) {
        throw const FormatException('请提供标题和小学/初中/高中分类');
      }
      final paragraphs = rows(a['paragraphs']);
      if (paragraphs.isEmpty ||
          paragraphs.length > 100 ||
          paragraphs.any((p) => str(p['en']).trim().isEmpty)) {
        throw const FormatException('请提供 1–100 段英文原文');
      }
      if (paragraphs.any(
        (p) =>
            str(p['image']).isNotEmpty &&
            !RegExp(r'^assets/images/[1-9]\.jpg$').hasMatch(str(p['image'])),
      )) {
        throw const FormatException(
          '离线版仅接受已内置配图 assets/images/1.jpg 至 9.jpg，或留空',
        );
      }
      if (rows(
        a['words'],
      ).any((w) => str(w['term']).isEmpty || str(w['meaning']).isEmpty)) {
        throw const FormatException('单词必须有英文和词义');
      }
      a['words'] = rows(a['words'])
          .map(
            (w) => <String, dynamic>{
              ...w,
              'id': str(w['id']).isEmpty ? normal(str(w['term'])) : w['id'],
            },
          )
          .toList();
      final questionIds = <String>{};
      for (final q in rows(a['questions'])) {
        if (str(q['id']).isEmpty ||
            !questionIds.add(str(q['id'])) ||
            str(q['prompt']).isEmpty ||
            str(q['answer']).isEmpty ||
            str(q['explanation']).isEmpty) {
          throw const FormatException('题目需要唯一 ID、题干、答案与解析');
        }
        if (q['type'] == 'choice' &&
            ((q['options'] as List? ?? []).length < 2 ||
                !(q['options'] as List).contains(q['answer']))) {
          throw const FormatException('选择题答案必须在选项中');
        }
        if (q['scope'] == 'paragraph' &&
            (q['paragraph'] is! int ||
                q['paragraph'] < 1 ||
                q['paragraph'] > paragraphs.length)) {
          throw const FormatException('题目段落编号超出范围');
        }
      }
      pendingArticles.add({
        ...a,
        'imported': true,
        'cover': paragraphs.first['image'] ?? '',
      });
    }
    articles.addAll(pendingArticles);
    save();
  }
}
