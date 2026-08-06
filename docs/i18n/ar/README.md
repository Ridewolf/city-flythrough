<!-- docs-i18n: generated translation — do not edit by hand.
     locale: ar
     source: README.md (a549b5879222938d)
     model: claude-haiku-4.5
     generated: 2026-07-31T15:09:55.038Z
     Edit README.md and re-run `docs-i18n translate` instead. -->

> 🌐 This is a generated translation. The canonical document is [README.md](../../../README.md).

<!-- docs-i18n:switcher -->
<p align="center"><sub><a href="../../../README.md">English</a> · <a href="../ru/README.md">Русский</a> · <a href="../ro/README.md">Română</a> · <a href="../de/README.md">Deutsch</a> · <a href="../es/README.md">Español</a> · <a href="../fr/README.md">Français</a> · <a href="../it/README.md">Italiano</a> · <a href="../pt/README.md">Português</a> · <a href="../uk/README.md">Українська</a> · <a href="../pl/README.md">Polski</a> · <a href="../tr/README.md">Türkçe</a> · <a href="../sv/README.md">Svenska</a> · <a href="../nl/README.md">Nederlands</a> · <a href="../el/README.md">Ελληνικά</a> · <b>العربية</b> · <a href="../he/README.md">עברית</a></sub></p>
<!-- /docs-i18n:switcher -->

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-white.png">
    <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-dark.png" alt="Ridewolf" width="260">
  </picture>
  <h1>@ridewolf/city-flythrough</h1>
  <p>مدينة إجرائية بحركة مرور حية، على قماش 2D عادي.<br>
  توليد عالم حتمي، إشارات مرور وتقاطعات دوارة حقيقية،<br>
  انضباط الحارات، وأداء متكيفة. بدون مكتبات خارجية.</p>
</div>

<p align="center">
  <a href="https://github.com/Ridewolf/city-flythrough/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Ridewolf/city-flythrough/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@ridewolf/city-flythrough"><img alt="npm" src="https://img.shields.io/npm/v/@ridewolf/city-flythrough"></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6">
  <img alt="Canvas" src="https://img.shields.io/badge/renders%20to-2D%20canvas-e8842c">
  <img alt="Dependencies" src="https://img.shields.io/badge/dependencies-0-3fb950">
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-blue"></a>
</p>

---

<p align="center">
  <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/demo.gif" width="680"
       alt="The camera drifting over the procedural city: cars queue at traffic lights, circulate roundabouts and change lanes">
</p>

ت漂漂 كاميرا فوق مدينة لا نهاية لها. الطرق لها أعراض وحدود سرعة؛ السيارات تبقى في حاراتها، تصطف في الإشارات الحمراء، تفسح في الدوارات، تخطط أقواس دوران صحيحة، وأحيانًا تتعطل وتعيق الحارة. الكتل عبارة عن مباني وحدائق وساحات. الغيوم تطفو؛ نادرًا جدًا، تعبر طائرة. لا شيء مسجل أو مزيف — إنها **محاكاة ميكروسكوبية حقيقية** على عالم هو دالة خالصة للإحداثيات، لذا تعمل إلى الأبد في بضعة كيلوبايت ولا تكرر نفسها أبدًا.

مبني كخلفية شاشة الانتظار لتطبيق حركة إنتاجي؛ تم استخراجه لأنه تبين أنه نوع الهندسة الممتع الذي يستحق المشاركة.

## Quickstart

```bash
bun add @ridewolf/city-flythrough
```

```ts
import { createCityFlythrough } from '@ridewolf/city-flythrough';

const flythrough = createCityFlythrough(document.querySelector('canvas'), {
  theme: 'dark',      // or 'light'; switchable live via setTheme()
  minimal: false,     // true → lighter budgets for background use
});
flythrough.start();
```

أو شغل العرض المجمع: `bun run build && bunx serve .` →
[examples/demo.html](examples/demo.html).

## ما يجعله مثيرًا للاهتمام

- **عالم حتمي** — كل فئة طريق وكتلة وتقاطع دوار ومرحلة إضاءة هي بصمة تجزئة إحداثياتها الشبكية. يمكن للكاميرا أن تطير في أي مكان والعودة؛ لا شيء مخزن، لا شيء ينجرف.
- **حركة مرور صادقة** — متابعة السيارة مع ضغط الطابور، كبح تقاربي لخطوط التوقف، أقواس غلة الدوار، أقواس دوران تدرك الحارات التي لا تتقاطع مع الجانب القادم، تغييرات حارات محققة من الفجوات، أعطال نادرة في الحارة.
- **أداء متكيفة** — يمكن لمؤشر ميكروسكوبي وقت الوصول أن يقيس ميزانيات الكيانات وحد DPR إلى الجهاز (0.25×–1.2×)؛ حارس وقت التشغيل يقلع السيارات إذا أخذت الحرارة. حد الإطار يوقف لوحات 120 Hz من الدفع أربع مرات لمقلاة بطيئة. `prefers-reduced-motion` يعرض إطارًا ثابتًا واحدًا.
- **يختبر البناء** — كل العشوائية تتدفق عبر RNG مضروب. تقود المجموعة محاكاات ملقحة وتؤكد ثوابت حقيقية: الأضواء لا تكون خضراء بطريقتين، والسيارات لا تتداخل أبدًا، والدوارات لا تعيق أحدًا أبدًا، ونقع 3600 خطوة يبقى محدودًا وانضباط حارة.

## API

| التصدير | الغرض |
| --- | --- |
| `createCityFlythrough(canvas, options)` | الخلفية الكاملة: `start` / `stop` / `setTheme` / `destroy`، بالإضافة إلى مقابض `sim` و`sky` الحية. |
| `TrafficSim`، `Sky` | طبقات المحاكاة، قابلة للاستخدام بدون رأس (هذا كيف تشغيل الاختبارات). |
| `renderFrame`، `PALETTE_DARK`، `PALETTE_LIGHT` | العارض والمواضيع — جلب الحلقة أو اللوحة الخاصة بك. |
| `roadInfo`، `lightGreen`، `hash`، ... | وظائف العالم الحتمية، المصدرة بشكل فردي. |
| `measurePerfFactor`، `dprCapFor` | معيار الجهاز، قابل لإعادة الاستخدام لأي مشهد قماشي. |

الخيارات: `minimal`، `theme` / `palette`، `rng` (مشاهد حتمية)، و
`respectReducedMotion`.

## الأداء

تم القياس باستخدام mitata](https://github.com/evanwashere/mitata) على Apple M4، Bun 1.3
(`bun run bench`، محاكاة ملقحة، منفذ 1280×800):

| السيارات على الشاشة | `sim.step` | `renderFrame` (جانب JS) |
| --- | --- | --- |
| 40 | 5.5 µs | 74 µs |
| 120 | 19.1 µs | 76 µs |
| 300 | 54.9 µs | 94 µs |

بالإضافة إلى وظائف العالم التي تستند الكاميرا عليها باستمرار: `roadInfo` ≈ 3.6 ns، `hash` ≈ 7.3 ns
لكل استدعاء — رخيصة بما يكفي بحيث لا شيء يحتاج إلى التخزين المؤقت، وهذا هو السبب في أن الطيران في أي مكان والعودة لا يكلف شيء ولا يخزن شيء.

**اقرأ هذه بصدق.** `renderFrame` هنا يعمل ضد سياق بدون تشغيل، لذا الجدول هو *عملنا* لكل إطار، وليس تسطير GPU — على جهاز حقيقي معدل الملء يهيمن، وهذا بالضبط ما حد DPR موجود للتحكم فيه. مثلية حركة المرور تضاعف ثلاثًا تضاعف التكلفة المحاكاة بعشرة لكن بالكاد تحرك تكلفة الرسم، لأن المدينة نفسها (الطرق والكتل والأشجار) هي معظم الإطار. حتى مع 300 سيارة جانب JS للإطار هو ~0.15 ms مقابل ميزانية 16.7 ms في 60 Hz، لذا الميزانية المتكيفة موجودة لأجهزة GPU ضعيفة والاختناق الحراري، وليس للرياضيات.

## التوثيق

- [المحاكاة](docs/simulation.md) — التجزئة العالمية، نموذج حركة المرور، و
  غلاف الأداء ثلاثي الطبقات.

## لماذا بنينا هذا

في [Ridewolf](https://ridewolf.com) تطبيق المشغل كان بحاجة إلى شاشة قفل تشعر وكأنها حية دون شحن موارد الفيديو أو حرق البطاريات. كانت مدينة إجرائية هي الإجابة — وفي مكان ما بين "يجب على السيارات أن تتوقف عند الأضواء" و"يجب على الوارد أن يفسح للحلقة"، أصبحت بهدوء محاكاة حركة مرور ذات آراء. يعمل الآن بشكل مزدوج كعرض توضيحي المفضل لدينا لأداء قماشي متكيفة.

## المساهمة

المساهمات مرحب بها — أنواع الكتل الجديدة وسلوكيات المركبات واللوحات
بشكل خاص. انظر إلى [دليل المساهمة](https://github.com/Ridewolf/.github/blob/main/CONTRIBUTING.md).
قم بتشغيل `bun test`، `bun run lint`، `bun run typecheck` قبل PR. مشاكل الأمان:
[SECURITY.md](https://github.com/Ridewolf/.github/blob/main/SECURITY.md) — أبدًا في مشكلة عامة.

## الترخيص

[MIT](LICENSE) © [Ridewolf](https://ridewolf.com)
