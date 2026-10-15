import 'package:flutter/material.dart';
import '../common.dart';
import '../store.dart';

class VocabularyPage extends StatelessWidget {
  const VocabularyPage({super.key});
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: store,
    builder: (context, _) => Shell(
      title: '重点词库',
      children: [
        heading('词汇积累', '阅读是接触，主动回忆才是练习。'),
        for (final a in store.articles) ...[
          heading(str(a['title'])),
          for (final w in rows(a['words']))
            ListTile(
              title: Text(str(w['term'])),
              subtitle: Text(
                '${w['meaning']} · ${store.records[w['id']]?['attempts'] == null
                    ? '未练习'
                    : store.records[w['id']]?['correct'] == true
                    ? '能回忆'
                    : '待巩固'}',
              ),
              trailing: const Icon(Icons.volume_up_outlined),
              onTap: () =>
                  showWord(context, store.lookup(str(w['term']), a), a),
            ),
        ],
      ],
    ),
  );
}
