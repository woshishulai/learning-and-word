import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'common.dart';
import 'store.dart';
import 'pages.dart';

late final SemanticsHandle appSemantics;

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  appSemantics = WidgetsBinding.instance.ensureSemantics();
  store = DemoStore();
  runApp(const WordscapeApp());
}

class WordscapeApp extends StatefulWidget {
  const WordscapeApp({super.key});
  @override
  State<WordscapeApp> createState() => _WordscapeAppState();
}

class _WordscapeAppState extends State<WordscapeApp> {
  late final Future<void> ready = store.load();
  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: '词境 · 离线演示',
    theme: ThemeData(
      useMaterial3: true,
      fontFamily: 'NotoSansSC',
      colorScheme: ColorScheme.fromSeed(seedColor: green),
      scaffoldBackgroundColor: paper,
      appBarTheme: const AppBarTheme(backgroundColor: paper, centerTitle: true),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
    home: FutureBuilder(
      future: ready,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Scaffold(
            body: SafeArea(
              child: Center(child: Text('打开失败：${snapshot.error}')),
            ),
          );
        }
        if (snapshot.connectionState != ConnectionState.done) {
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(28),
                    child: Image.asset(
                      'assets/images/logo.png',
                      width: 112,
                      height: 112,
                    ),
                  ),
                  heading('词境', '在故事里遇见单词'),
                  const CircularProgressIndicator(),
                ],
              ),
            ),
          );
        }
        return const HomePage();
      },
    ),
  );
}
