# content-studio: التركيب والتحديث

أداة المحتوى صارت Plugin اسمه **content-studio** (الإصدار 1.0.0). المحرك داخل الـ Plugin، وكل مشروع له حزمة براند خاصة فيه
اسمها `content-brand/`.

## المتطلبات على الجهاز
- Node 18 أو أحدث، وPython 3، وffmpeg.
- متصفح Chromium أو Chrome. إذا ما انلقى لحاله، حط مساره في المتغير `CHROME_PATH`.
- `GEMINI_API_KEY` في متغيرات البيئة عشان التعليق الصوتي (لا تكتبه في أي ملف).
- صلاحية قراءة على مستودع `kooobra/content-studio` (مسجّل دخول في git أو `gh auth login`).

## التركيب في أي مشروع
1. افتح Claude Code داخل مجلد المشروع.
2. أضف المتجر وثبّت الـ Plugin على مستوى المشروع:
   ```
   /plugin marketplace add kooobra/content-studio
   /plugin install content-studio@kooobra-tools
   ```
   واختر **Project** عشان ينحفظ في `.claude/settings.json`. بعدها سوّ commit للملف، وأي أحد يفتح المشروع يجيه الـ Plugin تلقائياً بعد ما يوافق على الثقة بالمجلد.
   ومن الطرفية تقدر تسويها بأمرين:
   ```bash
   claude plugin marketplace add kooobra/content-studio --scope project
   ```
   ```bash
   claude plugin install content-studio@kooobra-tools --scope project
   ```
3. جهّز حزمة البراند للمشروع:
   ```
   /content-studio:new-brand https://موقع-المشروع
   ```
   يقرأ الموقع والكود (الاسم، الألوان، الخط، الشعار، وش نقدر نقول)، ويسألك عن أي شي ناقص قبل ما يخمّن، وبعدين ينشئ `content-brand/`.
4. اطلب أي محتوى عادي («سوّ لي فيديو عن …»)، أو شغّل المهارة مباشرة: `/content-studio:content-studio`.

في «مدربك الذكي» و«فايا» هذا كله جاهز: المتجر والـ Plugin مسجّلين في `.claude/settings.json`، وحزمة البراند في `content-brand/`.

## التحديث
- **لو أنت اللي تطوّر الأداة:** عدّل في هذا المستودع، وارفع رقم `version` في `.claude-plugin/plugin.json` (مثلاً 1.0.0 ← 1.1.0)، وسوّ commit وpush على `main`. بدون ما ترفع الرقم، المستخدمين يبقون على النسخة اللي عندهم.
- **في أي مشروع مركّب فيه:**
  ```
  /plugin marketplace update kooobra-tools
  ```
  وبعدها من `/plugin` ← Installed ← content-studio ← Update. أو من الطرفية:
  ```bash
  claude plugin update content-studio@kooobra-tools
  ```
- **تحديث تلقائي:** من `/plugin` ← Marketplaces ← kooobra-tools ← Enable auto-update.
- الإعدادات اللي تحتاجها الأداة (playwright وPython) تنحفظ في مجلد بيانات الـ Plugin، وتبقى بعد التحديث.

## وش داخل الـ Plugin
| المكان | وش هو |
|---|---|
| `skills/content-studio/` | طريقة الشغل كاملة، ومعها `references/specs.md` (المشاهد وحقولها) و`references/motion.md` (الحركة والانتقالات والوضع التلقائي) |
| `skills/new-brand/` | أمر تجهيز حزمة براند لأي مشروع |
| `scripts/` | المحرك: الرندر، الصوت، الموسيقى، الترجمة، الكاروسيل، المراجعة |
| `templates/brand-pack/` | قالب حزمة براند فاضي، ومعه مثالين (كاروسيل وفيديو) |

## تنبيهات
- الـ Plugin ما ينشر ولا يجدول أي شي بنفسه.
- هذا المستودع (`kooobra/content-studio`) هو المصدر الرسمي للأداة. فيه نسخة ثانية داخل مستودع «مدربك الذكي» (`plugins/content-studio/`) كاحتياط، وأي تعديل يصير هنا أول.
- المتجر يقرأ من الفرع `main`، فأي تعديل لازم يوصل `main` عشان يوصل للمستخدمين.
