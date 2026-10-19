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
        for (final entry in <(String, String, IconData, Widget)>[
          (
            '文章书架',
            '选择学段 · 进入文章',
            Icons.auto_stories_outlined,
            const LibraryPage(),
          ),
          ('我的生词本', '按文章整理收藏', Icons.bookmarks_outlined, const NotebookPage()),
          ('重点词库', '查看掌握情况', Icons.abc, const VocabularyPage()),
          ('复习中心', '巩固今天到期的词', Icons.history, const ReviewPage()),
        ])
          Card(
            child: ListTile(
              leading: Icon(entry.$3, color: green),
              title: Text(entry.$1),
              subtitle: Text(entry.$2),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => openPage(context, entry.$4),
            ),
          ),
        heading('今天，从一个故事开始。', '在情境中理解，在回忆中记住。'),
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
