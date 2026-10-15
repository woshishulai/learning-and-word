import 'package:flutter/material.dart';
import '../common.dart';
import '../store.dart';
import '../pages.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: store,
    builder: (context, _) => Shell(
      title: '词境',
      children: [
        Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Image.asset(
                'assets/images/logo.png',
                width: 64,
                height: 64,
              ),
            ),
            const SizedBox(width: 18),
            Expanded(child: heading('在故事里遇见单词', '读懂一篇文章，记住一段故事。')),
          ],
        ),
        actions([
          action(
            '文章书架',
            () => openPage(context, const LibraryPage()),
            icon: Icons.auto_stories,
          ),
          action(
            '我的生词本',
            () => openPage(context, const NotebookPage()),
            icon: Icons.bookmarks_outlined,
          ),
          action(
            '重点词库',
            () => openPage(context, const VocabularyPage()),
            icon: Icons.abc,
          ),
          action(
            '复习中心',
            () => openPage(context, const ReviewPage()),
            icon: Icons.history,
          ),
        ]),
        panel([
          assetImage(str(store.articles.first['cover'])),
          heading(
            str(store.articles.first['title']),
            str(store.articles.first['englishTitle']),
          ),
          Text(str(store.articles.first['description'])),
          actions([
            action(
              '阅读全文',
              () =>
                  openPage(context, ArticlePage(article: store.articles.first)),
              primary: true,
            ),
            action(
              '继续情景学习',
              () => openPage(context, StudyPage(article: store.articles.first)),
            ),
          ]),
        ]),
        panel([
          heading(
            '让记忆，再深一点',
            '${store.notebook.length} 个收藏词 · ${store.due.length} 个词待复习',
          ),
          const Text('当前包含少量预置演示记录，可在设置中恢复初始状态。'),
          action(
            '去复习',
            () => openPage(context, const ReviewPage()),
            primary: true,
          ),
        ]),
      ],
    ),
  );
}
