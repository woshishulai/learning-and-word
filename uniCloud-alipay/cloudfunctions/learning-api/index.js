var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/learning-api.js
var learning_api_exports = {};
__export(learning_api_exports, {
  main: () => main
});
module.exports = __toCommonJS(learning_api_exports);
var import_node_crypto = require("node:crypto");

// modules/article-study.js
function articlePlan(article, progress) {
  const questions = article.questions || [];
  if ((progress == null ? void 0 : progress.mode) === "mistakes")
    return progress.questionIds.map((id) => ({
      type: "question",
      question: questions.find((q) => q.id === id)
    })).filter((s) => s.question);
  return [
    ...article.paragraphs.flatMap((p, i) => [
      { type: "read", paragraphIndex: i },
      ...questions.filter((q) => q.scope === "paragraph" && q.paragraph === i + 1).map((question) => ({ type: "question", question }))
    ]),
    ...questions.filter((q) => q.scope === "article").map((question) => ({ type: "question", question })),
    ...questions.filter((q) => q.scope === "word").map((question) => ({ type: "question", question }))
  ];
}
function wrongQuestionIds(progress) {
  return Object.entries((progress == null ? void 0 : progress.answers) || {}).filter(([, a]) => !a.correct).map(([id]) => id);
}
var normal = (v) => String(v || "").trim().toLowerCase().replace(/[’‘]/g, "'").replace(/[.!?。！？，,]+$/g, "").replace(/\s+/g, " ");
function applyArticleStudy(state, event, article, now) {
  const require2 = (ok, message) => {
    if (!ok)
      throw new Error(message);
  };
  require2(article && article.id === event.articleId, "\u6587\u7AE0\u4E0D\u5B58\u5728");
  state.articleProgress ||= {};
  let p = Object.prototype.hasOwnProperty.call(
    state.articleProgress,
    article.id
  ) ? state.articleProgress[article.id] : null;
  if (!p) {
    require2(Object.keys(state.articleProgress).length < 500, "\u5DF2\u8FBE\u5230\u5B66\u4E60\u6587\u7AE0\u6570\u91CF\u4E0A\u9650");
    p = state.articleProgress[article.id] = {
      cursor: 0,
      answers: {},
      feedback: null,
      finished: false,
      mode: "all",
      startedAt: now
    };
  }
  if (event.action === "start")
    return;
  if (event.action === "retryWrong") {
    require2(p.finished, "\u8BF7\u5148\u5B8C\u6210\u672C\u6B21\u5B66\u4E60");
    const ids = wrongQuestionIds(p);
    require2(ids.length, "\u6CA1\u6709\u5F85\u91CD\u7EC3\u9519\u9898");
    Object.assign(p, {
      mode: "mistakes",
      questionIds: ids,
      cursor: 0,
      feedback: null,
      finished: false
    });
    return;
  }
  const plan = articlePlan(article, p), step = plan[p.cursor];
  require2(!p.finished && step, "\u672C\u6B21\u5B66\u4E60\u5DF2\u7ED3\u675F");
  require2(event.cursor === p.cursor, "\u9898\u76EE\u4F4D\u7F6E\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u5237\u65B0");
  if (event.action === "answer") {
    require2(step.type === "question" && step.question.id === event.questionId, "\u9898\u76EE\u4E0D\u5339\u914D");
    require2(!p.feedback, "\u8BF7\u52FF\u91CD\u590D\u63D0\u4EA4\u7B54\u6848");
    require2(typeof event.answer === "string" && event.answer.length <= 500, "\u7B54\u6848\u65E0\u6548");
    const q = step.question;
    require2(event.skip || event.answer.trim(), "\u8BF7\u586B\u5199\u7B54\u6848");
    const correct = !event.skip && [q.answer, ...q.acceptedAnswers || []].some(
      (a) => normal(a) === normal(event.answer)
    );
    p.feedback = {
      answer: event.answer,
      correct,
      expected: q.answer,
      explanation: q.explanation,
      assisted: !!event.assisted
    };
    p.answers[q.id] = { ...p.feedback, answeredAt: now };
  } else if (event.action === "next") {
    require2(step.type === "read" || p.feedback, "\u8BF7\u5148\u63D0\u4EA4\u7B54\u6848");
    p.cursor++;
    p.feedback = null;
    if (p.cursor >= plan.length) {
      p.finished = true;
      p.completedAt = now;
    }
  } else
    throw new Error("\u65E0\u6548\u7684\u6587\u7AE0\u5B66\u4E60\u64CD\u4F5C");
  p.updatedAt = now;
}

// modules/course.js
var image = (n) => `/static/course/teenager/${n}.jpg`;
var course = {
  id: "teenager-english-v1",
  title: "\u5C11\u5E74\u4E0E\u82F1\u8BED",
  englishTitle: "A New Beginning",
  description: "\u4E00\u4E2A\u51C6\u5907\u79BB\u5BB6\u7684\u5C11\u5E74\uFF0C\u4E00\u6B21\u6539\u53D8\u4ED6\u7684\u8C08\u8BDD\u3002",
  cover: image(1),
  level: "\u9AD8\u4E2D\u82F1\u8BED",
  lessons: [
    {
      id: "departure",
      title: "\u79BB\u5BB6\u524D\u7684\u51B3\u5B9A",
      subtitle: "A suitcase full of worries",
      image: image(1),
      prompt: "\u4E00\u4E2A\u5C11\u5E74\u6B63\u5728\u6536\u62FE\u884C\u674E\u3002\u662F\u4EC0\u4E48\u8BA9\u4ED6\u51B3\u5B9A\u79BB\u5F00\uFF1F",
      paragraphs: [
        {
          en: "A teenager hid behind loose, dusty curtains, packing his overcoat into a suitcase.",
          zh: "\u4E00\u4E2A\u5C11\u5E74\u8EB2\u5728\u677E\u57AE\u3001\u79EF\u6EE1\u7070\u5C18\u7684\u7A97\u5E18\u540E\uFF0C\u628A\u5927\u8863\u88C5\u8FDB\u884C\u674E\u7BB1\u3002",
          image: image(1)
        },
        {
          en: "He planned to leave home at dusk, even though there was thunder and lightning outside.",
          zh: "\u4ED6\u8BA1\u5212\u5728\u9EC4\u660F\u65F6\u79BB\u5BB6\uFF0C\u5C3D\u7BA1\u5916\u9762\u96F7\u7535\u4EA4\u52A0\u3002",
          image: image(2)
        },
        {
          en: "He had to do this because he was fed up with his parents\u2019 nagging about his English learning and couldn\u2019t bear it any longer.",
          zh: "\u4ED6\u89C9\u5F97\u81EA\u5DF1\u5FC5\u987B\u8FD9\u6837\u505A\uFF0C\u56E0\u4E3A\u4ED6\u5DF2\u7ECF\u538C\u70E6\u7236\u6BCD\u5BF9\u82F1\u8BED\u5B66\u4E60\u7684\u5520\u53E8\uFF0C\u518D\u4E5F\u65E0\u6CD5\u5FCD\u53D7\u4E86\u3002",
          image: image(3)
        }
      ],
      wordIds: ["dusty", "curtain", "pack", "suitcase", "dusk", "bear"],
      questions: [
        {
          id: "d-1",
          prompt: "When did the teenager plan to leave?",
          options: ["At sunrise.", "At dusk.", "At midnight."],
          answer: "At dusk.",
          explanation: "at dusk \u610F\u4E3A\u201C\u5728\u9EC4\u660F\u65F6\u201D\u3002\u7559\u610F planned to\uFF1A\u8FD9\u662F\u4ED6\u7684\u8BA1\u5212\uFF0C\u6587\u7AE0\u8FD8\u6CA1\u6709\u8BF4\u4ED6\u5DF2\u7ECF\u79BB\u5F00\u3002"
        },
        {
          id: "d-2",
          prompt: "Why did he want to leave home?",
          options: [
            "He wanted to buy a coat.",
            "He enjoyed the storm.",
            "He could no longer bear the nagging."
          ],
          answer: "He could no longer bear the nagging.",
          explanation: "fed up with \u548C couldn\u2019t bear \u2026 any longer \u90FD\u8868\u8FBE\u4E86\u4ED6\u5BF9\u5520\u53E8\u7684\u538C\u70E6\u4E0E\u96BE\u4EE5\u5FCD\u53D7\u3002"
        }
      ]
    },
    {
      id: "friend",
      title: "\u670B\u53CB\u7684\u503E\u542C",
      subtitle: "Someone who understands",
      image: image(5),
      prompt: "\u670B\u53CB\u7406\u89E3\u4ED6\u7684\u5904\u5883\uFF0C\u5374\u4E0D\u8D5E\u6210\u4ED6\u7684\u51B3\u5B9A\u3002\u5979\u4F1A\u600E\u6837\u5E2E\u52A9\u4ED6\uFF1F",
      paragraphs: [
        {
          en: "He wasn\u2019t good at English and didn\u2019t like attending English classes because he felt the teacher ignored him.",
          zh: "\u4ED6\u4E0D\u64C5\u957F\u82F1\u8BED\uFF0C\u4E5F\u4E0D\u559C\u6B22\u4E0A\u82F1\u8BED\u8BFE\uFF0C\u56E0\u4E3A\u4ED6\u89C9\u5F97\u8001\u5E08\u5FFD\u89C6\u4E86\u4ED6\u3002",
          image: image(4)
        },
        {
          en: "His partner was very worried about him. She fully understood what he was going through but completely disagreed with his idea.",
          zh: "\u4ED6\u7684\u642D\u6863\u975E\u5E38\u62C5\u5FC3\u4ED6\u3002\u5979\u5B8C\u5168\u7406\u89E3\u4ED6\u6B63\u5728\u7ECF\u5386\u7684\u4E8B\uFF0C\u5374\u5B8C\u5168\u4E0D\u8D5E\u540C\u4ED6\u7684\u60F3\u6CD5\u3002",
          image: image(5)
        },
        {
          en: "To calm him down and solve his problem, she talked with him face to face and shared a series of tips on learning English with him.",
          zh: "\u4E3A\u4E86\u8BA9\u4ED6\u5E73\u9759\u4E0B\u6765\u5E76\u89E3\u51B3\u95EE\u9898\uFF0C\u5979\u4E0E\u4ED6\u9762\u5BF9\u9762\u4EA4\u8C08\uFF0C\u5206\u4EAB\u4E86\u4E00\u7CFB\u5217\u5B66\u4E60\u82F1\u8BED\u7684\u5EFA\u8BAE\u3002",
          image: image(6)
        }
      ],
      wordIds: [
        "ignore",
        "go-through",
        "disagree",
        "calm",
        "face-to-face",
        "series"
      ],
      questions: [
        {
          id: "f-1",
          prompt: "How did his partner feel about his plan?",
          options: [
            "She understood him but disagreed.",
            "She wanted to leave with him.",
            "She ignored his feelings."
          ],
          answer: "She understood him but disagreed.",
          explanation: "understood \u2026 but \u2026 disagreed\uFF1A\u7406\u89E3\u4E00\u4E2A\u4EBA\u7684\u611F\u53D7\uFF0C\u4E0D\u7B49\u4E8E\u8D5E\u540C\u4ED6\u7684\u505A\u6CD5\u3002"
        },
        {
          id: "f-2",
          prompt: "What did she do to help?",
          options: [
            "She sent him a suitcase.",
            "She talked with him and shared tips.",
            "She asked him to stop studying."
          ],
          answer: "She talked with him and shared tips.",
          explanation: "\u5979\u901A\u8FC7 face to face \u7684\u8C08\u8BDD\u548C a series of tips \u6765\u5E2E\u52A9\u4ED6\u3002"
        }
      ]
    },
    {
      id: "beginning",
      title: "\u627E\u56DE\u5B66\u4E60\u7684\u529B\u91CF",
      subtitle: "A different way forward",
      image: image(9),
      prompt: "\u4E00\u6B21\u8C08\u8BDD\u4E4B\u540E\uFF0C\u4ED6\u5F00\u59CB\u91CD\u65B0\u770B\u5F85\u82F1\u8BED\u5B66\u4E60\u3002\u8BFB\u4E00\u8BFB\u6545\u4E8B\u7684\u7ED3\u5C3E\u3002",
      paragraphs: [
        {
          en: "The learning methods she wrote down helped him find the \u201Cpath\u201D to learning English well.",
          zh: "\u5979\u5199\u4E0B\u7684\u5B66\u4E60\u65B9\u6CD5\uFF0C\u5E2E\u52A9\u4ED6\u627E\u5230\u4E86\u5B66\u597D\u82F1\u8BED\u7684\u201C\u9053\u8DEF\u201D\u3002",
          image: image(7)
        },
        {
          en: "The teenager was very grateful and gained great strength from his friend\u2019s words.",
          zh: "\u5C11\u5E74\u975E\u5E38\u611F\u6FC0\uFF0C\u5E76\u4ECE\u670B\u53CB\u7684\u8BDD\u4E2D\u83B7\u5F97\u4E86\u5F88\u5927\u7684\u529B\u91CF\u3002",
          image: image(8)
        },
        {
          en: "Now, he has recovered from his depression and fallen in love with English.",
          zh: "\u73B0\u5728\uFF0C\u4ED6\u5DF2\u7ECF\u4ECE\u4F4E\u843D\u7684\u60C5\u7EEA\u4E2D\u6062\u590D\u8FC7\u6765\uFF0C\u5E76\u7231\u4E0A\u4E86\u82F1\u8BED\u3002",
          image: image(9)
        }
      ],
      wordIds: [
        "method",
        "grateful",
        "gain",
        "strength",
        "recover",
        "fall-in-love"
      ],
      questions: [
        {
          id: "b-1",
          prompt: "What helped him find a path to learning English?",
          options: [
            "A new suitcase.",
            "His friend\u2019s learning methods.",
            "Leaving home."
          ],
          answer: "His friend\u2019s learning methods.",
          explanation: "The learning methods \u2026 helped him\uFF1A\u4E3B\u8BED\u662F\u201C\u5B66\u4E60\u65B9\u6CD5\u201D\uFF0Cshe wrote down \u8865\u5145\u8BF4\u660E\u8FD9\u4E9B\u65B9\u6CD5\u662F\u8C01\u5199\u4E0B\u7684\u3002"
        },
        {
          id: "b-2",
          prompt: "What changed by the end of the story?",
          options: [
            "He began to love English.",
            "He stopped talking to his friend.",
            "He left home in the storm."
          ],
          answer: "He began to love English.",
          explanation: "fallen in love with English \u8868\u793A\u4ED6\u5DF2\u7ECF\u559C\u6B22\u4E0A\u4E86\u82F1\u8BED\u3002\u6587\u4E2D\u6CA1\u6709\u8BF4\u4ED6\u6700\u7EC8\u79BB\u5BB6\u4E86\u3002"
        }
      ]
    }
  ]
};
var entries = [
  [
    "dusty",
    "dusty",
    "/\u02C8d\u028Csti/",
    "adj. \u79EF\u6EE1\u7070\u5C18\u7684",
    "dusty curtains \xB7 \u79EF\u6EE1\u7070\u5C18\u7684\u7A97\u5E18",
    ["dusty"],
    "He hid behind loose, ___ curtains.",
    "dusty",
    ["dusty", "grateful", "calm"],
    "The old books were covered in dust. They were ___.",
    "dusty",
    "dust\uFF08\u7070\u5C18\uFF09\uFF0B -y \u2192 dusty\uFF0C\u8868\u793A\u201C\u5E03\u6EE1\u7070\u5C18\u7684\u201D\u3002"
  ],
  [
    "curtain",
    "curtain",
    "/\u02C8k\u025C\u02D0tn/",
    "n. \u7A97\u5E18",
    "draw the curtains \xB7 \u62C9\u4E0A\u7A97\u5E18",
    ["curtains"],
    "He hid behind loose, dusty ___.",
    "curtains",
    ["methods", "curtains", "tips"],
    "Please close the ___ to keep the light out.",
    "curtains",
    "\u6587\u4E2D curtains \u7528\u590D\u6570\uFF0C\u6307\u7A97\u5E18\u3002\u586B\u7A7A\u65F6\u7559\u610F\u5355\u590D\u6570\u3002"
  ],
  [
    "pack",
    "pack",
    "/p\xE6k/",
    "v. \u6253\u5305\uFF1B\u6536\u62FE\uFF08\u884C\u674E\uFF09",
    "pack a suitcase \xB7 \u6536\u62FE\u884C\u674E\u7BB1",
    ["packing"],
    "He was ___ his overcoat into a suitcase.",
    "packing",
    ["ignoring", "packing", "recovering"],
    "We need to ___ our bags before the trip.",
    "pack",
    "\u6587\u4E2D\u7684 packing \u8868\u793A\u4E0E hid \u540C\u65F6\u53D1\u751F\u7684\u52A8\u4F5C\uFF1Bneed to \u540E\u63A5\u539F\u5F62 pack\u3002"
  ],
  [
    "suitcase",
    "suitcase",
    "/\u02C8su\u02D0tke\u026As/",
    "n. \u884C\u674E\u7BB1",
    "into a suitcase \xB7 \u88C5\u8FDB\u884C\u674E\u7BB1",
    ["suitcase"],
    "He packed his overcoat into a ___.",
    "suitcase",
    ["curtain", "series", "suitcase"],
    "She put her clothes in a ___ for the holiday.",
    "suitcase",
    "\u7528\u201C\u8863\u7269\u653E\u8FDB\u65C5\u884C\u7528\u7684\u7BB1\u5B50\u201D\u8FD9\u4E00\u573A\u666F\u7406\u89E3 suitcase\u3002"
  ],
  [
    "dusk",
    "dusk",
    "/d\u028Csk/",
    "n. \u9EC4\u660F",
    "at dusk \xB7 \u5728\u9EC4\u660F\u65F6",
    ["dusk"],
    "He planned to leave home at ___.",
    "dusk",
    ["dusk", "strength", "home"],
    "The sun was setting. We arrived at ___.",
    "dusk",
    "dusk \u662F\u65E5\u843D\u540E\u5929\u8272\u6E10\u6697\u7684\u65F6\u5019\uFF1B\u56FA\u5B9A\u642D\u914D at dusk\u3002"
  ],
  [
    "bear",
    "bear",
    "/be\u0259(r)/",
    "v. \u5FCD\u53D7\uFF1B\u627F\u53D7",
    "can\u2019t bear \u2026 \xB7 \u65E0\u6CD5\u5FCD\u53D7\u2026\u2026",
    ["bear"],
    "He couldn\u2019t ___ it any longer.",
    "bear",
    ["pack", "bear", "gain"],
    "The noise is so loud that I cannot ___ it.",
    "bear",
    "\u8FD9\u91CC bear \u662F\u52A8\u8BCD\u201C\u5FCD\u53D7\u201D\uFF0C\u4E0D\u662F\u540D\u8BCD\u201C\u718A\u201D\u3002couldn\u2019t \u540E\u7528\u539F\u5F62\u3002"
  ],
  [
    "ignore",
    "ignore",
    "/\u026A\u0261\u02C8n\u0254\u02D0(r)/",
    "v. \u5FFD\u89C6\uFF1B\u4E0D\u7406\u776C",
    "ignore someone \xB7 \u4E0D\u7406\u776C\u67D0\u4EBA",
    ["ignored"],
    "He felt the teacher ___ him.",
    "ignored",
    ["gained", "ignored", "packed"],
    "Please do not ___ someone who asks for help.",
    "ignore",
    "ignored \u662F\u8FC7\u53BB\u5F0F\u3002\u6CE8\u610F\u6587\u4E2D\u662F\u201C\u4ED6\u89C9\u5F97\u201D\u8001\u5E08\u5FFD\u89C6\u4E86\u4ED6\u3002"
  ],
  [
    "go-through",
    "go through",
    "/\u0261\u0259\u028A \u03B8ru\u02D0/",
    "phr. \u7ECF\u5386\uFF1B\u7ECF\u53D7",
    "go through a difficult time \xB7 \u7ECF\u5386\u56F0\u96BE\u65F6\u671F",
    ["going through"],
    "She understood what he was ___.",
    "going through",
    ["going through", "falling in love", "writing down"],
    "Many students ___ a difficult time before exams.",
    "go through",
    "\u672C\u53E5\u8868\u793A\u201C\u7ECF\u5386\u201D\uFF0C\u4E0D\u662F\u4ECE\u67D0\u4E2A\u7269\u4F53\u4E2D\u7A7F\u8FC7\u3002"
  ],
  [
    "disagree",
    "disagree",
    "/\u02CCd\u026As\u0259\u02C8\u0261ri\u02D0/",
    "v. \u4E0D\u540C\u610F",
    "disagree with an idea \xB7 \u4E0D\u8D5E\u540C\u4E00\u4E2A\u60F3\u6CD5",
    ["disagreed"],
    "She completely ___ with his idea.",
    "disagreed",
    ["recovered", "disagreed", "attended"],
    "I understand your idea, but I ___ with it.",
    "disagree",
    "dis- \uFF0B agree\uFF08\u540C\u610F\uFF09\u2192 disagree\uFF1B\u5E38\u4E0E with \u8FDE\u7528\u3002"
  ],
  [
    "calm",
    "calm",
    "/k\u0251\u02D0m/",
    "v. \u4F7F\u5E73\u9759",
    "calm someone down \xB7 \u4F7F\u67D0\u4EBA\u5E73\u9759\u4E0B\u6765",
    ["calm"],
    "She wanted to ___ him down.",
    "calm",
    ["bear", "calm", "ignore"],
    "Take a slow breath to ___ yourself down.",
    "calm",
    "calm him down\uFF1A\u4EE3\u8BCD him \u653E\u5728 calm \u548C down \u4E2D\u95F4\u3002"
  ],
  [
    "face-to-face",
    "face to face",
    "/fe\u026As t\u0259 fe\u026As/",
    "phr. \u9762\u5BF9\u9762\u5730",
    "talk face to face \xB7 \u9762\u5BF9\u9762\u4EA4\u8C08",
    ["face to face"],
    "She talked with him ___.",
    "face to face",
    ["at dusk", "any longer", "face to face"],
    "Let\u2019s meet and discuss this ___ instead of texting.",
    "face to face",
    "\u5728 talked \u540E\u8BF4\u660E\u4EA4\u8C08\u65B9\u5F0F\uFF0C\u7528 face to face\u3002"
  ],
  [
    "series",
    "series",
    "/\u02C8s\u026A\u0259ri\u02D0z/",
    "n. \u4E00\u7CFB\u5217\uFF1B\u4E00\u8FDE\u4E32",
    "a series of tips \xB7 \u4E00\u7CFB\u5217\u5EFA\u8BAE",
    ["series"],
    "She shared a ___ of tips with him.",
    "series",
    ["series", "suitcase", "strength"],
    "The teacher asked a ___ of questions.",
    "series",
    "a series of \u540E\u63A5\u590D\u6570\u540D\u8BCD\uFF1Bseries \u7684\u5355\u590D\u6570\u5F62\u5F0F\u76F8\u540C\u3002"
  ],
  [
    "method",
    "method",
    "/\u02C8me\u03B8\u0259d/",
    "n. \u65B9\u6CD5",
    "learning methods \xB7 \u5B66\u4E60\u65B9\u6CD5",
    ["methods"],
    "The learning ___ helped him find a path.",
    "methods",
    ["curtains", "methods", "parents"],
    "Reading aloud is a useful ___ for learning English.",
    "method",
    "\u539F\u6587 methods \u662F\u590D\u6570\uFF1B\u65B0\u53E5\u524D\u6709 a\uFF0C\u6240\u4EE5\u7528\u5355\u6570 method\u3002"
  ],
  [
    "grateful",
    "grateful",
    "/\u02C8\u0261re\u026Atfl/",
    "adj. \u611F\u6FC0\u7684",
    "be grateful to someone \xB7 \u611F\u6FC0\u67D0\u4EBA",
    ["grateful"],
    "The teenager was very ___.",
    "grateful",
    ["dusty", "grateful", "loose"],
    "I am ___ to you for your help.",
    "grateful",
    "be grateful to \u4EBA for \u4E8B\uFF1A\u56E0\u67D0\u4E8B\u800C\u611F\u6FC0\u67D0\u4EBA\u3002"
  ],
  [
    "gain",
    "gain",
    "/\u0261e\u026An/",
    "v. \u83B7\u5F97",
    "gain strength \xB7 \u83B7\u5F97\u529B\u91CF",
    ["gained"],
    "He ___ great strength from his friend\u2019s words.",
    "gained",
    ["ignored", "disagreed", "gained"],
    "You can ___ experience by trying new things.",
    "gain",
    "gain \u5E38\u7528\u4E8E\u83B7\u5F97\u7ECF\u9A8C\u3001\u4FE1\u5FC3\u3001\u529B\u91CF\u7B49\u3002"
  ],
  [
    "strength",
    "strength",
    "/stre\u014B\u03B8/",
    "n. \u529B\u91CF\uFF1B\u610F\u5FD7\u529B",
    "gain strength from \u2026 \xB7 \u4ECE\u2026\u2026\u83B7\u5F97\u529B\u91CF",
    ["strength"],
    "He gained great ___ from his friend\u2019s words.",
    "strength",
    ["dusk", "strength", "series"],
    "Her kind words gave me the ___ to try again.",
    "strength",
    "\u672C\u53E5\u504F\u91CD\u7CBE\u795E\u4E0A\u7684\u529B\u91CF\uFF1Bstrong \u7684\u540D\u8BCD\u5F62\u5F0F\u662F strength\u3002"
  ],
  [
    "recover",
    "recover",
    "/r\u026A\u02C8k\u028Cv\u0259(r)/",
    "v. \u6062\u590D",
    "recover from \u2026 \xB7 \u4ECE\u2026\u2026\u4E2D\u6062\u590D",
    ["recovered"],
    "He has ___ from his depression.",
    "recovered",
    ["recovered", "packed", "ignored"],
    "It takes time to ___ from a bad cold.",
    "recover",
    "\u539F\u6587 has recovered \u662F\u73B0\u5728\u5B8C\u6210\u65F6\uFF1B\u65B0\u53E5 to \u540E\u7528\u539F\u5F62\u3002"
  ],
  [
    "fall-in-love",
    "fall in love with",
    "/f\u0254\u02D0l \u026An l\u028Cv w\u026A\xF0/",
    "phr. \u7231\u4E0A\uFF1B\u559C\u6B22\u4E0A",
    "fall in love with English \xB7 \u7231\u4E0A\u82F1\u8BED",
    ["fallen in love with"],
    "He has ___ English.",
    "fallen in love with",
    ["gone through", "fallen in love with", "disagreed with"],
    "Visit this city and you may ___ its beautiful parks.",
    "fall in love with",
    "fall \u2192 fell \u2192 fallen\uFF1B\u539F\u6587 has \u540E\u7528\u8FC7\u53BB\u5206\u8BCD fallen\u3002"
  ]
];
var words = Object.fromEntries(
  entries.map(
    ([
      id,
      term,
      ipa,
      meaning,
      collocation,
      variants,
      original,
      originalAnswer,
      options,
      transfer,
      transferAnswer,
      note
    ]) => [
      id,
      {
        id,
        term,
        ipa,
        meaning,
        collocation,
        variants,
        original,
        originalAnswer,
        options,
        transfer,
        transferAnswer,
        note
      }
    ]
  )
);
function practiceQuestions(lessonIndex) {
  const ids = course.lessons[lessonIndex].wordIds;
  return [
    ...ids.map((id) => ({
      id: `${id}-context`,
      wordId: id,
      kind: "context",
      prompt: words[id].original,
      options: words[id].options,
      answer: words[id].originalAnswer,
      explanation: words[id].note
    })),
    ...ids.map((id) => ({
      id: `${id}-transfer`,
      wordId: id,
      kind: "transfer",
      prompt: words[id].transfer,
      answer: words[id].transferAnswer,
      explanation: words[id].note
    }))
  ];
}
function reviewQuestion(id, level = 0) {
  const w = words[id];
  return {
    id: `${id}-review`,
    wordId: id,
    kind: "review",
    prompt: level % 2 ? w.original : w.transfer,
    answer: level % 2 ? w.originalAnswer : w.transferAnswer,
    explanation: w.note
  };
}

// modules/learning-aids.js
function cleanPreferences(value = {}) {
  return {
    mode: ["context", "homophone", "listening"].includes(value.mode) ? value.mode : "context",
    english: typeof value.english === "boolean" ? value.english : value.mode !== "listening",
    images: value.images !== false,
    ipa: value.ipa !== false,
    meaning: value.meaning !== false,
    examples: value.examples !== false,
    notes: value.notes !== false,
    homophones: value.homophones === true,
    translation: value.translation === true,
    accent: value.accent === "en-GB" ? "en-GB" : "en-US",
    rate: [0.65, 0.85, 1].includes(Number(value.rate)) ? Number(value.rate) : 0.85
  };
}
var wordHints = {
  dusty: "\u8FBE\u65AF\u63D0",
  curtain: "\u514B\u817E",
  pack: "\u6D3E\u514B",
  suitcase: "\u4FEE\u7279\u514B\u65AF",
  dusk: "\u8FBE\u65AF\u514B",
  bear: "\u8D1D\u5C14",
  ignore: "\u4F0A\u683C\u8BFA",
  "go-through": "\u52FE \u601D\u9C81",
  disagree: "\u8FEA\u65AF\u989D\u683C\u5229",
  calm: "\u5361\u59C6",
  "face-to-face": "\u8D39\u65AF \u56FE \u8D39\u65AF",
  series: "\u897F\u745E\u5179",
  method: "\u9EA6\u745F\u5FB7",
  grateful: "\u683C\u745E\u7279\u798F",
  gain: "\u7ED9\u6069",
  strength: "\u65AF\u7279\u4F26\u65AF",
  recover: "\u745E\u5361\u6C83",
  "fall-in-love": "\u798F\u5C14 \u56E0 \u62C9\u592B \u5A01\u5179"
};
var glossaryRows = [
  ["a", "\u4E00\uFF08\u4E2A\uFF09\uFF1B\u4E0D\u5B9A\u51A0\u8BCD", "\u989D"],
  ["about", "\u5173\u4E8E", "\u989D\u5305\u7279"],
  ["and", "\u548C\uFF1B\u5E76\u4E14", "\u5B89\u5FB7"],
  ["any", "\u4EFB\u4F55\uFF1B\u4E00\u4E9B", "\u6069\u5C3C"],
  ["at", "\u5728\uFF08\u65F6\u95F4\u3001\u5730\u70B9\uFF09", "\u827E\u7279"],
  ["attending", "\u53C2\u52A0\uFF1Battend \u7684 -ing \u5F62\u5F0F", "\u989D\u817E\u4E01"],
  ["because", "\u56E0\u4E3A", "\u6BD4\u8003\u5179"],
  ["behind", "\u5728\u2026\u2026\u540E\u9762", "\u6BD4\u6D77\u6069\u5FB7"],
  ["but", "\u4F46\u662F", "\u5DF4\u7279"],
  ["classes", "\u8BFE\uFF1Bclass \u7684\u590D\u6570", "\u514B\u62C9\u897F\u65AF"],
  ["completely", "\u5B8C\u5168\u5730", "\u5EB7\u666E\u5229\u7279\u5229"],
  ["couldn\u2019t", "\u4E0D\u80FD\uFF1Bcould not \u7684\u7F29\u5199", "\u5E93\u5FB7\u6069\u7279"],
  ["depression", "\u4F4E\u843D\uFF1B\u6CAE\u4E27\uFF08\u672C\u6587\u4E49\uFF09", "\u8FEA\u666E\u745E\u7533"],
  ["didn\u2019t", "\u6CA1\u6709\uFF1Bdid not \u7684\u7F29\u5199", "\u8FEA\u5FB7\u6069\u7279"],
  ["do", "\u505A", "\u675C"],
  ["down", "\u5411\u4E0B\uFF1Bcalm down \u4E2D\u8868\u793A\u5E73\u9759\u4E0B\u6765", "\u9053\u6069"],
  ["english", "\u82F1\u8BED", "\u82F1\u683C\u5229\u4EC0"],
  ["even", "\u751A\u81F3\uFF1Beven though \u8868\u793A\u5C3D\u7BA1", "\u4F0A\u6587"],
  ["face", "\u8138\uFF1B\u9762\u5BF9", "\u8D39\u65AF"],
  ["fallen", "fall \u7684\u8FC7\u53BB\u5206\u8BCD", "\u798F\u4F26"],
  ["fed", "feed \u7684\u8FC7\u53BB\u5F0F\uFF1Bfed up \u8868\u793A\u538C\u70E6", "\u8D39\u5FB7"],
  ["felt", "\u611F\u5230\uFF1Bfeel \u7684\u8FC7\u53BB\u5F0F", "\u8D39\u5C14\u7279"],
  ["find", "\u627E\u5230", "\u6CD5\u56E0\u5FB7"],
  ["friend\u2019s", "\u670B\u53CB\u7684", "\u5F17\u4F26\u5179"],
  ["from", "\u4ECE\uFF1B\u6765\u81EA", "\u5F17\u82E5\u59C6"],
  ["fully", "\u5B8C\u5168\u5730", "\u5F17\u5229"],
  ["going", "go \u7684 -ing \u5F62\u5F0F", "\u52FE\u56E0"],
  ["good", "\u597D\u7684\uFF1B\u64C5\u957F\u7684", "\u53E4\u5FB7"],
  ["great", "\u5F88\u5927\u7684\uFF1B\u51FA\u8272\u7684", "\u683C\u745E\u7279"],
  ["had", "have \u7684\u8FC7\u53BB\u5F0F\uFF1Bhad to \u8868\u793A\u4E0D\u5F97\u4E0D", "\u54C8\u5FB7"],
  ["has", "have \u7684\u7B2C\u4E09\u4EBA\u79F0\u5355\u6570", "\u54C8\u5179"],
  ["he", "\u4ED6", "\u9ED1"],
  ["helped", "\u5E2E\u52A9\uFF1Bhelp \u7684\u8FC7\u53BB\u5F0F", "\u6D77\u5C14\u5FB7"],
  ["hid", "\u8EB2\u85CF\uFF1Bhide \u7684\u8FC7\u53BB\u5F0F", "\u9ED1\u5FB7"],
  ["him", "\u4ED6\uFF08\u5BBE\u683C\uFF09", "\u9ED1\u59C6"],
  ["his", "\u4ED6\u7684", "\u9ED1\u5179"],
  ["home", "\u5BB6", "\u539A\u59C6"],
  ["idea", "\u60F3\u6CD5", "\u827E\u8FEA\u5C14"],
  ["in", "\u5728\u2026\u2026\u91CC\u9762", "\u56E0"],
  ["into", "\u8FDB\u5165\u2026\u2026\u91CC\u9762", "\u56E0\u56FE"],
  ["it", "\u5B83\uFF1B\u8FD9\u4EF6\u4E8B", "\u4F0A\u7279"],
  ["learning", "\u5B66\u4E60", "\u52D2\u5B81"],
  ["leave", "\u79BB\u5F00", "\u5229\u592B"],
  ["lightning", "\u95EA\u7535", "\u83B1\u7279\u5B81"],
  ["like", "\u559C\u6B22", "\u83B1\u514B"],
  ["longer", "\u66F4\u4E45\uFF1Bany longer \u8868\u793A\u518D\u3001\u7EE7\u7EED", "\u6717\u683C"],
  ["loose", "\u677E\u7684\uFF1B\u677E\u57AE\u7684", "\u8DEF\u65AF"],
  ["love", "\u559C\u7231\uFF1B\u7231", "\u62C9\u592B"],
  ["nagging", "\u5520\u53E8", "\u5948\u6839"],
  ["now", "\u73B0\u5728", "\u95F9"],
  ["of", "\u2026\u2026\u7684", "\u5965\u592B"],
  ["on", "\u5173\u4E8E\uFF1B\u5728\u2026\u2026\u4E0A", "\u6602"],
  ["outside", "\u5728\u5916\u9762", "\u5965\u7279\u8D5B\u5FB7"],
  ["overcoat", "\u5927\u8863", "\u6B27\u6C83\u6263\u7279"],
  ["parents", "\u7236\u6BCD", "\u6D3E\u4F26\u8328"],
  ["partner", "\u642D\u6863", "\u5E15\u7279\u7EB3"],
  ["path", "\u9053\u8DEF\uFF1B\u9014\u5F84", "\u5E15\u65AF"],
  ["planned", "\u8BA1\u5212\uFF1Bplan \u7684\u8FC7\u53BB\u5F0F", "\u666E\u5170\u5F97"],
  ["problem", "\u95EE\u9898", "\u666E\u82E5\u5E03\u52D2\u59C6"],
  ["shared", "\u5206\u4EAB\uFF1Bshare \u7684\u8FC7\u53BB\u5F0F", "\u8C22\u5C14\u5FB7"],
  ["she", "\u5979", "\u5E0C"],
  ["solve", "\u89E3\u51B3", "\u7D22\u5C14\u592B"],
  ["talked", "\u4EA4\u8C08\uFF1Btalk \u7684\u8FC7\u53BB\u5F0F", "\u6258\u514B\u7279"],
  ["teacher", "\u8001\u5E08", "\u63D0\u5F7B"],
  ["teenager", "\u9752\u5C11\u5E74", "\u63D0\u5185\u8005"],
  ["the", "\u5B9A\u51A0\u8BCD\uFF0C\u8868\u793A\u7279\u6307", "\u989D"],
  ["there", "\u90A3\u91CC\uFF1Bthere was \u8868\u793A\u6709", "\u6CFD\u5C14"],
  ["this", "\u8FD9\uFF1B\u8FD9\u4E2A", "\u8FEA\u65AF"],
  ["though", "\u5C3D\u7BA1\uFF1B\u867D\u7136", "\u641C"],
  ["through", "\u7ECF\u5386\uFF1B\u7A7F\u8FC7", "\u601D\u9C81"],
  ["thunder", "\u96F7\uFF1B\u96F7\u58F0", "\u6851\u5FB7"],
  ["tips", "\u5EFA\u8BAE\uFF1B\u7A8D\u95E8", "\u63D0\u666E\u65AF"],
  ["to", "\u5230\uFF1B\u4E0D\u5B9A\u5F0F\u6807\u8BB0", "\u56FE"],
  ["understood", "\u7406\u89E3\uFF1Bunderstand \u7684\u8FC7\u53BB\u5F0F", "\u5B89\u5FB7\u65AF\u56FE\u5FB7"],
  ["up", "\u5411\u4E0A\uFF1Bfed up \u4E2D\u8868\u793A\u538C\u70E6", "\u963F\u666E"],
  ["very", "\u975E\u5E38", "\u7EF4\u745E"],
  ["was", "\u662F\uFF1Bbe \u7684\u8FC7\u53BB\u5F0F", "\u6C83\u5179"],
  ["wasn\u2019t", "\u4E0D\u662F\uFF1Bwas not \u7684\u7F29\u5199", "\u6C83\u5179\u6069\u7279"],
  ["well", "\u597D\u5730", "\u5A01\u5C14"],
  ["what", "\u4EC0\u4E48\uFF1B\u6240\u2026\u2026\u7684\u4E8B", "\u6C83\u7279"],
  ["with", "\u548C\uFF1B\u5E26\u6709", "\u5A01\u5179"],
  ["words", "\u8BDD\u8BED\uFF1B\u5355\u8BCD", "\u6C83\u5179"],
  ["worried", "\u62C5\u5FC3\u7684", "\u6C83\u745E\u5FB7"]
];

// modules/notebook.js
var normalize = (value) => String(value || "").trim().toLowerCase().replace(/[’‘]/g, "'");
var dictionary = { ...words };
for (const w of Object.values(dictionary)) {
  dictionary[w.id] = {
    ...w,
    homophone: wordHints[w.id] || "",
    source: course.title,
    example: w.original.replace("___", w.originalAnswer)
  };
}
var _a;
for (const [term, meaning, homophone] of glossaryRows) {
  const id = "glossary-" + normalize(term);
  dictionary[id] = {
    id,
    term,
    meaning,
    homophone,
    ipa: "",
    source: course.title,
    variants: [term],
    example: ((_a = course.lessons.flatMap((l) => l.paragraphs).find((p) => normalize(p.en).includes(normalize(term)))) == null ? void 0 : _a.en) || ""
  };
}
var courseDictionary = Object.values(dictionary);
function lookupWord(term) {
  const key = normalize(term);
  return Object.values(dictionary).find(
    (w) => {
      var _a2;
      return normalize(w.term) === key || ((_a2 = w.variants) == null ? void 0 : _a2.some((v) => normalize(v) === key));
    }
  ) || null;
}
function getWord(state, id) {
  var _a2, _b;
  return ((_a2 = state.notebook) == null ? void 0 : _a2[id]) || ((_b = state.customWords) == null ? void 0 : _b[id]) || dictionary[id] || null;
}
function cleanEntry(value) {
  const term = String((value == null ? void 0 : value.term) || "").trim().replace(/\s+/g, " ").replace(/[’‘]/g, "'");
  if (!/^[a-zA-Z][a-zA-Z '\-]{0,79}$/.test(term))
    throw new Error("\u8BF7\u8F93\u5165\u4E0D\u8D85\u8FC780\u4E2A\u5B57\u7B26\u7684\u82F1\u6587\u5355\u8BCD\u6216\u77ED\u8BED");
  const meaning = String(value.meaning || "").trim();
  if (!meaning || meaning.length > 300)
    throw new Error("\u8BF7\u586B\u5199\u8BCD\u4E49\uFF08\u4E0D\u8D85\u8FC7300\u5B57\uFF09");
  const canonical = lookupWord(term);
  const id = (canonical == null ? void 0 : canonical.id) || "custom-" + encodeURIComponent(normalize(term));
  const clipped = (name, len) => String(value[name] || "").trim().slice(0, len);
  return {
    id,
    term: (canonical == null ? void 0 : canonical.term) || term,
    meaning,
    ipa: clipped("ipa", 100),
    homophone: clipped("homophone", 150),
    mnemonic: clipped("mnemonic", 500),
    example: clipped("example", 1e3),
    source: clipped("source", 150) || "\u624B\u52A8\u6DFB\u52A0",
    articleId: clipped("articleId", 100) || "manual",
    level: ["\u5C0F\u5B66", "\u521D\u4E2D", "\u9AD8\u4E2D"].includes(value.level) ? value.level : "\u9AD8\u4E2D"
  };
}
function shuffled(values, random = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function notebookQuestion(word, mode = "spelling", pool = []) {
  if (mode === "choice") {
    const alternatives = [
      ...new Set(
        pool.filter(
          (w) => normalize(w.term) !== normalize(word.term) && w.meaning !== word.meaning
        ).map((w) => w.meaning).filter(Boolean)
      )
    ];
    if (!alternatives.length)
      throw new Error("\u53EF\u7528\u8BCD\u4E49\u4E0D\u8DB3\uFF0C\u8BF7\u5148\u4F7F\u7528\u968F\u673A\u9ED8\u5199");
    return {
      id: word.id + "-notebook-choice",
      wordId: word.id,
      kind: "review",
      prompt: "\u9009\u62E9\u8FD9\u4E2A\u8BCD\u7684\u4E2D\u6587\u8BCD\u4E49\uFF1A" + word.term,
      answer: word.meaning,
      options: shuffled([
        word.meaning,
        ...shuffled(alternatives).slice(0, 3)
      ]),
      explanation: [
        word.term + "\uFF1A" + word.meaning,
        word.example,
        word.mnemonic
      ].filter(Boolean).join(" \xB7 ")
    };
  }
  return {
    id: word.id + "-notebook",
    wordId: word.id,
    kind: "review",
    prompt: "\u6839\u636E\u8BCD\u4E49\u5199\u51FA\u6536\u85CF\u7684\u82F1\u8BED\uFF1A" + word.meaning,
    answer: word.term,
    explanation: [word.example, word.mnemonic].filter(Boolean).join(" \xB7 ") || word.meaning
  };
}

// modules/learning-core.js
var DAY = 864e5;
function emptyState() {
  return {
    version: 1,
    revision: 0,
    completed: [],
    records: {},
    active: null,
    lastResult: null,
    notebook: {},
    customWords: {},
    preferences: cleanPreferences()
  };
}
function normalizeAnswer(value) {
  return String(value || "").trim().toLowerCase().replace(/[’‘]/g, "'").replace(/[.!?。！？，,]+$/g, "").replace(/\s+/g, " ");
}
function dueWords(state, now = Date.now()) {
  return Object.keys(state.records).filter(
    (id) => {
      var _a2;
      return (dictionary[id] || ((_a2 = state.notebook) == null ? void 0 : _a2[id])) && state.records[id].dueAt && state.records[id].dueAt <= now;
    }
  ).sort((a, b) => state.records[a].dueAt - state.records[b].dueAt);
}
function currentQuestion(state) {
  const a = state.active;
  if (!a)
    return null;
  if (a.kind === "review")
    return a.stage === "practice" ? a.questions[a.cursor] || null : null;
  if (a.stage === "understand")
    return course.lessons[a.lessonIndex].questions[a.cursor] || null;
  if (a.stage === "practice")
    return practiceQuestions(a.lessonIndex)[a.cursor] || null;
  return null;
}
function assert(value, message) {
  if (!value)
    throw new Error(message);
}
function expose(state, id, now) {
  assert(getWord(state, id), "\u5355\u8BCD\u4E0D\u5B58\u5728");
  if (!state.records[id])
    state.records[id] = {
      seenAt: now,
      attempts: 0,
      level: 0,
      lastCorrect: false,
      dueAt: 0
    };
}
function recordAnswer(state, id, correct, now, isReview) {
  expose(state, id, now);
  const r = state.records[id];
  const wasDue = r.dueAt && r.dueAt <= now;
  r.attempts += 1;
  if (!isReview && r.dueAt && correct)
    return;
  r.lastCorrect = correct;
  r.lastAnsweredAt = now;
  if (!correct) {
    r.level = 0;
    r.dueAt = now + 10 * 6e4;
  } else {
    r.level = isReview && wasDue ? Math.min(4, r.level + 1) : r.level;
    r.dueAt = now + [1, 3, 7, 14, 30][r.level] * DAY;
  }
}
function switchStage(active, stage) {
  active.progress ||= {};
  active.progress[active.stage] = {
    cursor: active.cursor,
    feedback: active.feedback
  };
  let saved = active.progress[stage];
  if (!saved && active.kind === "lesson" && ["understand", "practice"].includes(stage)) {
    const questions = stage === "understand" ? course.lessons[active.lessonIndex].questions : practiceQuestions(active.lessonIndex);
    const firstUnanswered = questions.findIndex(
      (q) => !active.answers.some((answer) => answer.questionId === q.id)
    );
    if (firstUnanswered === -1)
      saved = {
        cursor: questions.length - 1,
        feedback: active.answers.find(
          (answer) => answer.questionId === questions[questions.length - 1].id
        )
      };
    else
      saved = { cursor: firstUnanswered, feedback: null };
  }
  active.stage = stage;
  active.cursor = (saved == null ? void 0 : saved.cursor) || 0;
  active.feedback = (saved == null ? void 0 : saved.feedback) || null;
}
function applyEvent(previous, event, now = Date.now(), article = null) {
  var _a2, _b;
  assert((previous == null ? void 0 : previous.version) === 1, "\u5B66\u4E60\u8BB0\u5F55\u7248\u672C\u4E0D\u517C\u5BB9");
  assert(event && typeof event.type === "string", "\u65E0\u6548\u64CD\u4F5C");
  const s = JSON.parse(JSON.stringify(previous));
  s.notebook ||= {};
  s.customWords ||= {};
  s.preferences = cleanPreferences(s.preferences);
  const a = s.active;
  switch (event.type) {
    case "resetLearning": {
      assert(
        event.scope === "all" || event.scope === "article",
        "\u65E0\u6548\u91CD\u5B66\u8303\u56F4"
      );
      if (event.scope === "all") {
        s.completed = [];
        s.records = {};
        s.active = null;
        s.lastResult = null;
        s.articleProgress = {};
      } else {
        assert(
          /^[a-z][a-z0-9-]{0,79}$/.test(event.articleId || ""),
          "\u65E0\u6548\u6587\u7AE0"
        );
        if (event.articleId === course.id) {
          s.completed = [];
          if (((_a2 = s.active) == null ? void 0 : _a2.kind) === "lesson")
            s.active = null;
          if (((_b = s.lastResult) == null ? void 0 : _b.kind) === "lesson")
            s.lastResult = null;
        } else if (s.articleProgress)
          delete s.articleProgress[event.articleId];
      }
      break;
    }
    case "articleStudy":
      applyArticleStudy(s, event, article, now);
      break;
    case "preferences":
      s.preferences = cleanPreferences(event.value);
      break;
    case "notebookAdd": {
      const entry = cleanEntry(event.entry);
      assert(
        s.customWords[entry.id] || Object.keys(s.customWords).length < 1e3,
        "\u6700\u591A\u4FDD\u5B581000\u4E2A\u81EA\u9009\u751F\u8BCD"
      );
      const old = s.notebook[entry.id];
      const sources = [...(old == null ? void 0 : old.sources) || []];
      if (!sources.some(
        (x) => x.articleId === entry.articleId && x.level === entry.level
      ))
        sources.push({
          articleId: entry.articleId,
          level: entry.level,
          title: entry.source
        });
      entry.sources = sources.slice(-50);
      entry.addedAt = (old == null ? void 0 : old.addedAt) || now;
      s.notebook[entry.id] = entry;
      s.customWords[entry.id] = entry;
      expose(s, entry.id, now);
      if (!s.records[entry.id].dueAt)
        s.records[entry.id].dueAt = now + DAY;
      break;
    }
    case "notebookRemove":
      assert(s.notebook[event.wordId], "\u751F\u8BCD\u4E0D\u5B58\u5728");
      delete s.notebook[event.wordId];
      break;
    case "start": {
      const i = event.lessonIndex;
      assert(Number.isInteger(i) && course.lessons[i], "\u60C5\u8282\u4E0D\u5B58\u5728");
      assert(
        i === 0 || s.completed.includes(course.lessons[i - 1].id),
        "\u8BF7\u5148\u5B8C\u6210\u524D\u4E00\u4E2A\u60C5\u8282"
      );
      if (a && a.kind === "lesson" && a.lessonIndex === i && a.stage !== "result")
        break;
      s.active = {
        kind: "lesson",
        lessonIndex: i,
        stage: "read",
        cursor: 0,
        feedback: null,
        answers: [],
        startedAt: now
      };
      break;
    }
    case "expose": {
      assert((a == null ? void 0 : a.kind) === "lesson" && a.stage === "read", "\u8BF7\u5148\u5F00\u59CB\u9605\u8BFB");
      assert(
        course.lessons[a.lessonIndex].wordIds.includes(event.wordId),
        "\u4E0D\u5C5E\u4E8E\u5F53\u524D\u60C5\u8282"
      );
      expose(s, event.wordId, now);
      break;
    }
    case "stage": {
      assert((a == null ? void 0 : a.kind) === "lesson", "\u8BF7\u5148\u5F00\u59CB\u60C5\u8282\u5B66\u4E60");
      assert(
        ["read", "understand", "words", "practice", "result"].includes(
          event.stage
        ),
        "\u5B66\u4E60\u6B65\u9AA4\u4E0D\u5B58\u5728"
      );
      if (a.stage === "result" && !a.result)
        a.result = s.lastResult;
      assert(
        event.stage !== "result" || a.result,
        "\u5B8C\u6210\u56DE\u5FC6\u7EC3\u4E60\u540E\u53EF\u67E5\u770B\u6536\u83B7"
      );
      switchStage(a, event.stage);
      break;
    }
    case "readDone":
      assert((a == null ? void 0 : a.stage) === "read", "\u5F53\u524D\u4E0D\u5728\u9605\u8BFB\u9636\u6BB5");
      a.finished ||= {};
      a.finished.read = true;
      switchStage(a, "understand");
      break;
    case "nextWord": {
      assert((a == null ? void 0 : a.stage) === "words", "\u5F53\u524D\u4E0D\u5728\u8BCD\u6C47\u9636\u6BB5");
      const ids = course.lessons[a.lessonIndex].wordIds;
      expose(s, ids[a.cursor], now);
      if (a.cursor + 1 < ids.length)
        a.cursor++;
      else {
        a.finished ||= {};
        a.finished.words = true;
        switchStage(a, "practice");
      }
      break;
    }
    case "answer": {
      const q = currentQuestion(s);
      assert(q && !a.feedback, "\u8FD9\u9053\u9898\u5DF2\u63D0\u4EA4\u6216\u4E0D\u53EF\u4F5C\u7B54");
      const answer = String(event.answer || "").slice(0, 300);
      assert(normalizeAnswer(answer) || event.skip, "\u8BF7\u5148\u586B\u5199\u7B54\u6848");
      const correct = !event.skip && normalizeAnswer(answer) === normalizeAnswer(q.answer);
      a.feedback = {
        questionId: q.id,
        assisted: !!event.assisted,
        answer,
        correct,
        skipped: !!event.skip,
        expected: q.answer,
        explanation: q.explanation
      };
      a.answers.push({
        ...a.feedback,
        wordId: q.wordId || null,
        kind: q.kind || "understand"
      });
      if (q.wordId && (q.kind === "transfer" || a.kind === "review" && !a.drill)) {
        if (!correct || !event.assisted)
          recordAnswer(
            s,
            q.wordId,
            correct,
            now,
            a.kind === "review"
          );
      }
      break;
    }
    case "next": {
      assert(
        (a == null ? void 0 : a.feedback) && ["understand", "practice"].includes(a.stage),
        "\u8BF7\u5148\u5B8C\u6210\u5F53\u524D\u9898\u76EE"
      );
      const count = a.kind === "review" ? a.questions.length : a.stage === "understand" ? course.lessons[a.lessonIndex].questions.length : practiceQuestions(a.lessonIndex).length;
      if (a.cursor + 1 < count) {
        a.cursor++;
        a.feedback = null;
        break;
      }
      if (a.stage === "understand") {
        a.finished ||= {};
        a.finished.understand = true;
        switchStage(a, "words");
        break;
      }
      const answers = a.answers.filter((x) => x.kind !== "understand");
      const result = {
        kind: a.kind,
        drill: !!a.drill,
        lessonIndex: a.lessonIndex ?? null,
        at: now,
        total: answers.length,
        correct: answers.filter((x) => x.correct).length,
        weakIds: [
          ...new Set(
            answers.filter((x) => !x.correct && x.wordId).map((x) => x.wordId)
          )
        ],
        recalled: a.answers.filter(
          (x) => x.kind === "transfer" && x.correct
        ).length
      };
      if (a.kind === "lesson" && !s.completed.includes(course.lessons[a.lessonIndex].id))
        s.completed.push(course.lessons[a.lessonIndex].id);
      a.finished ||= {};
      a.finished.practice = true;
      a.result = result;
      switchStage(a, "result");
      s.lastResult = result;
      break;
    }
    case "review": {
      let ids = event.drill ? Object.keys(s.records).filter(
        (id) => (s.records[id].attempts > 0 || s.notebook[id]) && (dictionary[id] || s.notebook[id])
      ) : dueWords(s, now);
      if (event.notebookIds) {
        assert(Array.isArray(event.notebookIds), "\u65E0\u6548\u751F\u8BCD\u8303\u56F4");
        ids = ids.filter(
          (id) => event.notebookIds.includes(id) && s.notebook[id]
        );
      }
      if (event.weakOnly && s.lastResult)
        ids = ids.filter((id) => s.lastResult.weakIds.includes(id));
      assert(ids.length, "\u6682\u65F6\u6CA1\u6709\u53EF\u590D\u4E60\u7684\u8BCD");
      const notebookMode = event.notebookIds ? event.notebookMode || "spelling" : null;
      assert(
        !notebookMode || ["spelling", "choice"].includes(notebookMode),
        "\u65E0\u6548\u7EC3\u4E60\u6A21\u5F0F"
      );
      if (notebookMode)
        ids = shuffled(ids);
      const pool = [
        ...Object.values(dictionary),
        ...Object.values(s.notebook)
      ];
      s.active = {
        kind: "review",
        stage: "practice",
        cursor: 0,
        feedback: null,
        answers: [],
        drill: !!event.drill,
        notebookMode,
        questions: ids.map(
          (id) => words[id] && !event.notebookIds ? reviewQuestion(id, s.records[id].level) : notebookQuestion(getWord(s, id), notebookMode, pool)
        ),
        startedAt: now
      };
      break;
    }
    default:
      throw new Error("\u4E0D\u652F\u6301\u7684\u5B66\u4E60\u64CD\u4F5C");
  }
  s.revision++;
  return s;
}

// modules/article-catalog.js
var levels = ["\u5C0F\u5B66", "\u521D\u4E2D", "\u9AD8\u4E2D"];
function validateArticle(input) {
  const fail = (message) => {
    throw new Error(message);
  };
  const text = (v, n) => {
    const value = String(v || "").trim();
    if (value.length > n)
      fail(`\u6587\u7AE0\u5B57\u6BB5\u8D85\u8FC7 ${n} \u4E2A\u5B57\u7B26\uFF0C\u8BF7\u7F29\u77ED\u540E\u91CD\u8BD5`);
    return value;
  };
  const id = text(input == null ? void 0 : input.id, 80);
  if (!/^[a-z][a-z0-9-]{0,79}$/.test(id))
    fail("\u6587\u7AE0 id \u987B\u4EE5\u5C0F\u5199\u5B57\u6BCD\u5F00\u5934\uFF0C\u53EA\u542B\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u8FDE\u5B57\u7B26");
  if (id === "teenager-english-v1")
    fail("\u6B64 id \u4FDD\u7559\u7ED9\u793A\u4F8B\u6587\u7AE0");
  if (!levels.includes(input.level))
    fail("\u5B66\u6BB5\u987B\u4E3A\u5C0F\u5B66\u3001\u521D\u4E2D\u6216\u9AD8\u4E2D");
  const title = text(input.title, 120);
  if (!title)
    fail("\u6587\u7AE0\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A");
  if (!Array.isArray(input.paragraphs) || !input.paragraphs.length || input.paragraphs.length > 100)
    fail("\u6587\u7AE0\u9700\u8981 1 \u81F3 100 \u4E2A\u6BB5\u843D");
  const image2 = (v) => {
    const s = text(v, 1500);
    if (s && !/^https:\/\//.test(s) && !/^\/static\//.test(s))
      fail("\u56FE\u7247\u8BF7\u4F7F\u7528 https \u4E91\u7AEF\u5730\u5740\u6216 /static/ \u8DEF\u5F84");
    return s;
  };
  const paragraphs = input.paragraphs.map((p) => {
    const en = text(p.en, 4e3);
    if (!en)
      fail("\u82F1\u6587\u6BB5\u843D\u4E0D\u80FD\u4E3A\u7A7A");
    return {
      en,
      zh: text(p.zh, 4e3),
      homophone: text(p.homophone, 4e3),
      image: image2(p.image)
    };
  });
  if (!Array.isArray(input.words) || input.words.length > 1e3)
    fail("words \u5FC5\u987B\u662F\u6570\u7EC4\uFF0C\u6700\u591A 1000 \u8BCD");
  const words2 = input.words.map((w) => {
    const term = text(w.term, 80), meaning = text(w.meaning, 300);
    if (!/^[a-zA-Z][a-zA-Z '\-’]{0,79}$/.test(term) || !meaning)
      fail("\u5355\u8BCD\u9700\u8981\u6709\u6548\u82F1\u6587\u548C\u8BCD\u4E49");
    return {
      term,
      meaning,
      ipa: text(w.ipa, 100),
      homophone: text(w.homophone, 150),
      mnemonic: text(w.mnemonic, 500),
      example: text(w.example, 1e3)
    };
  });
  const rawQuestions = input.questions ?? [];
  if (!Array.isArray(rawQuestions) || rawQuestions.length > 200)
    fail("questions \u5FC5\u987B\u662F\u6570\u7EC4\uFF0C\u6BCF\u7BC7\u6700\u591A 200 \u9898");
  const ids = /* @__PURE__ */ new Set();
  const questions = rawQuestions.map((q) => {
    const qid = text(q.id, 80);
    if (!/^[a-z][a-z0-9-]{0,79}$/.test(qid) || ids.has(qid))
      fail("\u9898\u76EE id \u65E0\u6548\u6216\u91CD\u590D");
    ids.add(qid);
    if (!["choice", "fill"].includes(q.type))
      fail("\u9898\u578B\u987B\u4E3A choice \u6216 fill");
    if (!["paragraph", "article", "word"].includes(q.scope))
      fail("\u9898\u76EE scope \u987B\u4E3A paragraph\u3001article \u6216 word");
    if (q.scope === "paragraph" && (!Number.isInteger(q.paragraph) || q.paragraph < 1 || q.paragraph > paragraphs.length))
      fail("\u6BB5\u843D\u9898\u987B\u5173\u8054\u6709\u6548\u6BB5\u843D\u5E8F\u53F7\uFF0C\u4ECE 1 \u5F00\u59CB");
    const term = text(q.word, 80);
    if (q.scope === "word" && !words2.some((w) => w.term.toLowerCase() === term.toLowerCase()))
      fail("\u8BCD\u6C47\u9898\u987B\u5173\u8054\u672C\u7BC7 words \u4E2D\u7684\u5355\u8BCD");
    const prompt = text(q.prompt, 2e3), explanation = text(q.explanation, 2e3);
    if (!prompt || !explanation)
      fail("\u9898\u5E72\u548C\u89E3\u6790\u4E0D\u80FD\u4E3A\u7A7A");
    let options;
    if (q.type === "choice") {
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6)
        fail("\u9009\u62E9\u9898\u9700\u8981 2 \u81F3 6 \u4E2A\u9009\u9879");
      options = q.options.map((o) => text(o, 500));
      if (options.some((o) => !o) || new Set(options).size !== options.length)
        fail("\u9009\u9879\u4E0D\u80FD\u4E3A\u7A7A\u6216\u91CD\u590D");
    }
    const answer = text(q.answer, 500);
    if (!answer || options && !options.includes(answer))
      fail("\u6B63\u786E\u7B54\u6848\u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u9009\u62E9\u9898\u7B54\u6848\u5FC5\u987B\u4E0E\u67D0\u4E2A\u9009\u9879\u4E00\u81F4");
    if (q.acceptedAnswers != null && (!Array.isArray(q.acceptedAnswers) || q.acceptedAnswers.length > 10))
      fail("acceptedAnswers \u6700\u591A 10 \u9879");
    if (q.optionTranslations != null && (!options || !Array.isArray(q.optionTranslations) || q.optionTranslations.length !== options.length))
      fail("\u9009\u9879\u7FFB\u8BD1\u987B\u4E0E\u9009\u9879\u9010\u4E00\u5BF9\u5E94");
    return {
      id: qid,
      type: q.type,
      scope: q.scope,
      paragraph: q.scope === "paragraph" ? q.paragraph : null,
      word: term,
      prompt,
      promptZh: text(q.promptZh, 2e3),
      ...options ? { options } : {},
      optionTranslations: (q.optionTranslations || []).map(
        (o) => text(o, 500)
      ),
      answer,
      acceptedAnswers: q.type === "fill" ? (q.acceptedAnswers || []).map((o) => text(o, 500)).filter(Boolean) : [],
      explanation
    };
  });
  return {
    id,
    title,
    level: input.level,
    englishTitle: text(input.englishTitle, 150),
    description: text(input.description, 500),
    cover: image2(input.cover) || paragraphs[0].image,
    paragraphs,
    words: words2,
    questions
  };
}

// server/learning-api.js
var hash = (token) => (0, import_node_crypto.createHash)("sha256").update(token).digest("hex");
async function main(event) {
  var _a2, _b;
  try {
    const db = uniCloud.database();
    const articles = db.collection("learning-articles");
    if (event.action === "articles") {
      const output = [];
      let offset = 0;
      while (true) {
        const page = await articles.orderBy("_id", "asc").skip(offset).limit(100).get();
        output.push(
          ...page.data.map(
            ({
              _id,
              id,
              title,
              level,
              englishTitle,
              description,
              cover
            }) => ({
              id: id || _id,
              title,
              level,
              englishTitle,
              description,
              cover
            })
          )
        );
        if (page.data.length < 100)
          break;
        offset += 100;
      }
      return { ok: true, articles: output };
    }
    if (event.action === "article") {
      if (!/^[a-z][a-z0-9-]{0,79}$/.test(event.id || ""))
        return { ok: false, message: "\u6587\u7AE0 id \u65E0\u6548" };
      const a = (await articles.doc(event.id).get()).data[0];
      return a ? { ok: true, article: a } : { ok: false, message: "\u6587\u7AE0\u4E0D\u5B58\u5728" };
    }
    if (event.action === "importArticles") {
      const secret = process.env.ARTICLE_IMPORT_TOKEN;
      if (!secret || secret.length < 32 || typeof event.adminToken !== "string" || !(0, import_node_crypto.timingSafeEqual)(
        Buffer.from(hash(secret), "hex"),
        Buffer.from(hash(event.adminToken), "hex")
      ))
        return { ok: false, message: "\u7BA1\u7406\u5458\u5BFC\u5165\u5BC6\u94A5\u65E0\u6548\u6216\u672A\u914D\u7F6E" };
      if (!Array.isArray(event.articles) || !event.articles.length || event.articles.length > 50)
        return { ok: false, message: "\u6BCF\u6279\u9650 1 \u81F3 50 \u7BC7\u6587\u7AE0" };
      const items = event.articles.map(validateArticle);
      if (new Set(items.map((a) => a.id)).size !== items.length)
        return { ok: false, message: "\u6587\u7AE0 id \u91CD\u590D" };
      for (const a of items)
        if ((await articles.doc(a.id).get()).data.length)
          return { ok: false, message: "\u6587\u7AE0 id \u5DF2\u5B58\u5728\uFF1A" + a.id };
      await articles.add(items.map((a) => ({ ...a, _id: a.id })));
      return { ok: true, count: items.length };
    }
    const collection = db.collection("learning-students");
    if (event.action === "create") {
      const id = (0, import_node_crypto.randomBytes)(16).toString("hex");
      const token = (0, import_node_crypto.randomBytes)(32).toString("hex");
      const state2 = emptyState();
      await collection.add({
        _id: id,
        tokenHash: hash(token),
        state: state2,
        revision: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      return { ok: true, credentials: { studentId: id, token }, state: state2 };
    }
    if (!/^[a-f0-9]{32}$/.test(event.studentId || "") || !/^[a-f0-9]{64}$/.test(event.token || ""))
      return { ok: false, message: "\u5B66\u4E60\u8EAB\u4EFD\u65E0\u6548" };
    const result = await collection.doc(event.studentId).get();
    const student = result.data[0];
    if (!student || !(0, import_node_crypto.timingSafeEqual)(
      Buffer.from(student.tokenHash, "hex"),
      Buffer.from(hash(event.token), "hex")
    ))
      return { ok: false, message: "\u5B66\u4E60\u8EAB\u4EFD\u9A8C\u8BC1\u5931\u8D25" };
    if (event.action === "read")
      return { ok: true, state: student.state };
    if (event.action !== "dispatch")
      return { ok: false, message: "\u4E0D\u652F\u6301\u7684\u64CD\u4F5C" };
    const operationId = event.operationId;
    if (operationId && !/^[a-zA-Z0-9-]{8,100}$/.test(operationId))
      return { ok: false, message: "\u65E0\u6548\u64CD\u4F5C\u6807\u8BC6" };
    const fingerprint = hash(
      JSON.stringify({ revision: event.revision, event: event.event })
    );
    const previousOperation = (_a2 = student.state.operations) == null ? void 0 : _a2.find(
      (item) => item.id === operationId
    );
    if (operationId && previousOperation)
      return previousOperation.fingerprint === fingerprint ? { ok: true, state: student.state } : { ok: false, message: "\u64CD\u4F5C\u6807\u8BC6\u5DF2\u4F7F\u7528" };
    if (event.revision !== student.revision)
      return {
        ok: false,
        code: "CONFLICT",
        message: "\u8FDB\u5EA6\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u5237\u65B0\u540E\u7EE7\u7EED"
      };
    let article = null;
    if (((_b = event.event) == null ? void 0 : _b.type) === "articleStudy") {
      if (!/^[a-z][a-z0-9-]{0,79}$/.test(event.event.articleId || ""))
        return { ok: false, message: "\u6587\u7AE0 id \u65E0\u6548" };
      article = (await articles.doc(event.event.articleId).get()).data[0];
      if (!article)
        return { ok: false, message: "\u6587\u7AE0\u4E0D\u5B58\u5728" };
    }
    const state = applyEvent(
      student.state,
      event.event,
      Date.now(),
      article
    );
    if (operationId)
      state.operations = [
        ...student.state.operations || [],
        { id: operationId, fingerprint }
      ].slice(-32);
    const write = await collection.where({ _id: event.studentId, revision: student.revision }).update({
      state: db.command.set(state),
      revision: state.revision,
      updatedAt: Date.now()
    });
    if (write.updated !== 1)
      return {
        ok: false,
        code: "CONFLICT",
        message: "\u8FDB\u5EA6\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u5237\u65B0\u540E\u7EE7\u7EED"
      };
    return { ok: true, state };
  } catch (error) {
    console.error("learning-api", error.message);
    const retryable = /timeout|timed out|ECONN|ENET|EAI_AGAIN|socket|network/i.test(
      String(error.name) + " " + String(error.code) + " " + String(error.message)
    );
    return {
      ok: false,
      code: retryable ? "TEMPORARY_UNAVAILABLE" : "FAILED",
      retryable,
      message: retryable ? "\u8FDE\u63A5\u6682\u65F6\u4E0D\u7A33\u5B9A\uFF0C\u6B63\u5728\u786E\u8BA4\u4FDD\u5B58\u7ED3\u679C" : "\u64CD\u4F5C\u672A\u4FDD\u5B58\uFF0C\u8BF7\u91CD\u8BD5\u6216\u5237\u65B0\u8FDB\u5EA6"
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  main
});
