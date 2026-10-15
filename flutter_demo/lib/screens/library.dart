import 'package:flutter/material.dart';
import '../common.dart';
import '../store.dart';
import '../pages.dart';

class LibraryPage extends StatefulWidget {
  const LibraryPage({super.key});
  @override
  State<LibraryPage> createState() => _LibraryPageState();
}

class _LibraryPageState extends State<LibraryPage> {
  String level = '全部';
  Future<void> importArticles() async {
    final input = TextEditingController();
    String error = '';
    await showDialog(
      context: context,
      builder: (c) => StatefulBuilder(
        builder: (c, update) => AlertDialog(
          title: const Text('本机导入文章'),
          content: SizedBox(
            width: 650,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    '粘贴与原项目一致的文章 JSON，含 paragraphs、words、questions。导入后仅保存在这台设备。',
                  ),
                  TextField(
                    controller: input,
                    maxLines: 12,
                    decoration: const InputDecoration(labelText: '文章 JSON'),
                  ),
                  if (error.isNotEmpty)
                    Text(error, style: const TextStyle(color: Colors.red)),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(c),
              child: const Text('取消'),
            ),
            FilledButton(
              onPressed: () {
                try {
                  store.importJson(input.text);
                  Navigator.pop(c);
                  setState(() {});
                } catch (e) {
                  update(() => error = e.toString());
                }
              },
              child: const Text('校验并导入'),
            ),
          ],
        ),
      ),
    );
    input.dispose();
  }

  @override
  Widget build(BuildContext context) => Shell(
    title: '文章书架',
    children: [
      heading('选择一个故事', '全文阅读 → 情景学习 → 主动回忆'),
      actions([
        for (final l in ['全部', '小学', '初中', '高中'])
          ChoiceChip(
            label: Text(l),
            selected: level == l,
            onSelected: (_) => setState(() => level = l),
          ),
        action('导入文章', importArticles, icon: Icons.file_upload_outlined),
      ]),
      if (!store.articles.any((a) => level == '全部' || a['level'] == level))
        panel([const Text('这个学段还没有文章，可以导入本地示例。')]),
      for (final a in store.articles.where(
        (a) => level == '全部' || a['level'] == level,
      ))
        panel([
          if (str(a['cover']).isNotEmpty)
            assetImage(str(a['cover']), height: 200),
          heading(
            str(a['title']),
            '${a['level']} · ${rows(a['paragraphs']).length} 段 · ${rows(a['words']).length} 个重点词',
          ),
          Text(str(a['description'])),
          action(
            '阅读全文',
            () => openPage(context, ArticlePage(article: a)),
            primary: true,
          ),
        ]),
    ],
  );
}
