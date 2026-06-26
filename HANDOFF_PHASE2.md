# Ahmed Academy Platform - Phase 2 Handoff

هذا الملف يلخّص ما تم إنجازه داخل المشروع الجديد `ahmed-academy-platform` وما تبقّى من العمل، بحيث يستطيع أي شخص يكمل الخطة مباشرة بدون الرجوع لكل التفاصيل القديمة.

## 1) ما تم إنجازه حتى الآن

### هيكل المشروع
- تم إنشاء مشروع جديد مستقل داخل `work/ahmed-academy-platform`.
- المشروع مبني على `Next.js App Router` و`TypeScript` و`Tailwind CSS`.
- تم الحفاظ على فكرة أن المشروع مستقل عن Numeris AI ولا يعتمد عليه.

### الهوية والبراند
- تم اعتماد هوية أكاديمية شخصية باسم:
  - `Ahmed Abdelmegid`
  - `Software Engineer`
  - `Programming & Computer Science Instructor`
- تم وضع الصورة الشخصية داخل:
  - الصفحة الرئيسية
  - الهيدر/الهوية البصرية
  - لوحات التحكم
- الصورة المستخدمة موجودة في:
  - `public/images/ahmed-abdelmegid.jpg`

### البنية الخلفية
- تم تجهيز مبدأ `Supabase` كقاعدة للـ Auth وPostgres وStorage وRLS.
- تم إنشاء migration للهيكل الأساسي:
  - `supabase/migrations/001_academy_schema.sql`
- تم تجهيز طبقة Supabase helpers داخل:
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/client.ts`
  - `src/lib/supabase/middleware.ts`

### نظام التقدم
- تم بناء منطق أولي للتعلّم المتدرج:
  - Course
  - Chapters
  - Lessons
  - Video
  - Exercise
  - Progress
- يوجد منطق progression داخل:
  - `src/lib/learning/progression.ts`

### الـ AI
- تم تجهيز pipeline مبدئي لتوليد التمارين باستخدام الذكاء الاصطناعي.
- تم ربط الفكرة بمحتوى المنهج بدل توليد أسئلة عشوائية.
- توجد ملفات مرتبطة بذلك داخل:
  - `src/lib/ai/exercise-generator.ts`
  - `src/app/api/ai/generate-exercise/route.ts`
  - `src/components/learning/generate-exercise-panel.tsx`

### المنهج والـ PDF
- تم تجهيز مسار لاستخراج المحتوى من الـ PDF:
  - `src/lib/pdf/extract.ts`
  - `src/app/api/pdf/extract/route.ts`
- المنهج الأول مربوط بفكرة مادة ICT للصف الأول الثانوي.

### الفيديو
- تم تجهيز abstraction أولية لمزودات الفيديو:
  - `src/lib/video/providers.ts`
- الهدف الحالي: عرض روابط YouTube unlisted داخل المشغل، مع جاهزية للتوسّع لاحقًا.

### الواجهة
- تم إضافة أساسات للشاشات الأساسية:
  - الصفحة الرئيسية
  - تسجيل الدخول
  - إنشاء حساب
  - لوحات الطالب
  - لوحات المدرّس/المحاضر
  - صفحات الدروس والتمارين والنتائج
- تم استخدام مكونات UI من نمط shadcn/utility components داخل:
  - `src/components/ui/*`

### i18n
- تم بدء بناء نظام ترجمة عربي/إنجليزي.
- الملفات الموجودة حاليًا:
  - `src/lib/i18n/dictionaries.ts`
  - `src/lib/i18n/server.ts`
  - `src/lib/i18n/client.tsx`
  - `src/components/i18n/language-switcher.tsx`
  - `src/lib/i18n/curriculum.ts`
- تم ربط `layout` بالاتجاه واللغة بشكل أولي.

### الاستقرار والتشغيل
- تم التعامل مع مشكلة middleware الخاصة بـ Supabase بحيث لا تعطل الصفحة العامة عند غياب المتغيرات.
- تم التأكد من أن الصفحة الرئيسية تعمل محليًا على المنفذ `3001`.
- تم التحقق من عرض صورة أحمد داخل الصفحة الرئيسية.
- تم التأكد من عدم وجود overflow أفقي واضح في عرض ضيق أثناء الفحص.

## 2) ما تم البدء فيه لكن يحتاج مراجعة/استكمال

### الترجمة الكاملة
- ليس كل النصوص في المشروع قد تحولت إلى عربي/إنجليزي كامل.
- ما يزال مطلوبًا تنظيف أي text hardcoded داخل:
  - `src/app/page.tsx`
  - صفحات الطالب
  - صفحات المحاضر
  - صفحات المصادقة
  - الرسائل الداخلية وtoast/error states

### العربية الصارمة
- يحتاج وضع Arabic mode إلى تدقيق أقوى لضمان عدم خروج أي English leakage.
- مطلوب فحص ومراجعة أسئلة الـ AI والتأكد من:
  - عدم وجود mixed language
  - عدم وجود markdown artifacts
  - عدم وجود `null`/`undefined`
  - عدم وجود مصطلحات إنجليزية داخل العربية

### أمان التقدّم
- يجب مراجعة منطق فتح الدروس بحيث يعتمد على تسلسل صحيح وليس على افتراضات غير دقيقة.
- يجب إضافة checks على مستوى الـ API للتأكد من:
  - enrollment
  - lesson unlock state
  - student ownership

### الفيديو
- abstraction موجودة، لكن تجربة الفيديو تحتاج تدقيق نهائي:
  - responsive player
  - states of loading/error
  - completion flow
  - تقليل exposure للروابط المباشرة قدر الإمكان

## 3) ما تبقّى

### A. استكمال الـ UI / i18n
- إنهاء تعريب كل صفحة ومكوّن.
- التأكد أن العربية تعمل `RTL` بشكل كامل.
- التأكد أن الإنجليزية تعمل `LTR` بدون كسر layout.
- توحيد النصوص في `dictionaries.ts` بدل ترك strings مباشرة داخل الصفحات.

### B. إنهاء المنهج
- استخراج الـ PDF بالكامل.
- تثبيت الهيكل النهائي:
  - courses
  - chapters
  - lessons
  - resources
  - exercises
  - chapter exams
- منع أي inventing خارج الـ PDF.

### C. إنهاء AI workflow
- مراجعة pipeline لتوليد الأسئلة.
- إضافة validation صارم قبل الحفظ.
- مراجعة جودة الأسئلة يدويًا قبل النشر من لوحة المحاضر.
- فصل:
  - generation
  - validation
  - review
  - publish

### D. الأمان
- تحسين route protection.
- إضافة role checks واضحة.
- مراجعة Supabase RLS assumptions.
- حماية صفحات instructor من أي وصول غير مصرح.

### E. تجربة الطالب
- إكمال:
  - lesson locking
  - retries
  - score tracking
  - chapter exams
  - progress analytics
- جعل التجربة ممتازة على الموبايل.

### F. تجربة المحاضر
- إكمال:
  - إدارة courses
  - chapters
  - lessons
  - exercises
  - videos
  - resources
  - exam review
  - student progress
  - results dashboard

### G. الجودة النهائية
- تشغيل:
  - `npm run lint`
  - `npm run build`
- مراجعة console errors.
- مراجعة responsive layout على:
  - mobile
  - tablet
  - desktop

## 4) الملفات المهمة التي يبدأ منها الشخص التالي

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/components/dashboard/dashboard-shell.tsx`
- `src/components/auth/auth-form.tsx`
- `src/components/learning/video-player.tsx`
- `src/components/learning/exercise-form.tsx`
- `src/components/learning/generate-exercise-panel.tsx`
- `src/lib/i18n/dictionaries.ts`
- `src/lib/i18n/server.ts`
- `src/lib/i18n/client.tsx`
- `src/lib/ai/exercise-generator.ts`
- `src/lib/learning/progression.ts`
- `src/app/api/learning/submit-exercise/route.ts`
- `src/app/api/learning/mark-video/route.ts`
- `src/app/student/lesson/[id]/page.tsx`
- `src/app/instructor/*`

## 5) ملاحظات مهمة

- لا يتم لمس مشروع Numeris الأصلي.
- العمل كله يجب أن يظل داخل `work/ahmed-academy-platform`.
- أي تحسين لاحق يجب أن يحافظ على:
  - Next.js App Router
  - Supabase
  - middleware protection
  - RLS mindset
  - shadcn-style components

## 6) الخلاصة

المشروع الآن ليس فكرة فارغة، بل أصبح لديه:
- بنية مستقلة
- هوية أكاديمية شخصية
- أساس Auth وSupabase
- أساس PDF curriculum extraction
- أساس AI exercise generation
- أساس progress tracking
- أساس localization

المرحلة التالية هي الإغلاق النهائي للفجوات:
1. تعريب شامل.
2. تدقيق Arabic mode.
3. تقوية الأمان.
4. تحسين التجربة على الشاشات الصغيرة.
5. مراجعة AI والأداء.
6. تجهيز النشر النهائي.

