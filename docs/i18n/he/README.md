<!-- docs-i18n: generated translation — do not edit by hand.
     locale: he
     source: README.md (a549b5879222938d)
     model: claude-haiku-4.5
     generated: 2026-07-31T15:09:55.039Z
     Edit README.md and re-run `docs-i18n translate` instead. -->

> 🌐 This is a generated translation. The canonical document is [README.md](../../../README.md).

<p align="center"><sub>[English](../../../README.md) · [Русский](../../../docs/i18n/ru/README.md) · [Română](../../../docs/i18n/ro/README.md) · [Deutsch](../../../docs/i18n/de/README.md) · [Español](../../../docs/i18n/es/README.md) · [Français](../../../docs/i18n/fr/README.md) · [Italiano](../../../docs/i18n/it/README.md) · [Português](../../../docs/i18n/pt/README.md) · [Українська](../../../docs/i18n/uk/README.md) · [Polski](../../../docs/i18n/pl/README.md) · [Türkçe](../../../docs/i18n/tr/README.md) · [Svenska](../../../docs/i18n/sv/README.md) · [Nederlands](../../../docs/i18n/nl/README.md) · [Ελληνικά](../../../docs/i18n/el/README.md) · [العربية](../../../docs/i18n/ar/README.md) · **עברית**</sub></p>

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-white.png">
    <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-dark.png" alt="Ridewolf" width="260">
  </picture>
  <h1>@ridewolf/city-flythrough</h1>
  <p>עיר פרוצדורלית עם תנועה חיה, על בד רגיל 2D.<br>
  יצור עולם דטרמיניסטי, רמזורים אמיתיים ועגלוגים,<br>
  משמעת נתיבים, וביצוע ההסתגלות. ללא תלויות.</p>
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

מצלמה סחרחרת על עיר אינסופית. לכבישים יש רוחבים והגבלות מהירות; מכוניות שומרות
על נתיביהן, עומדות בתור ברמזורים אדומים, נכנעות לעגלוגים, מתכננות קשתות פנייה ראויות,
לעתים רחוקות מתקלקלות וחוסמות נתיב. בלוקים הם בניינים, פארקים, וכיכרות. ענני דריפט מעל; מאוד לעתים רחוקות, מטוס חוצה. כלום מכן לא הוקלט או
לא מזוייף — זה **סימולציה מיקרו אמיתית** על עולם שהוא פונקציה טהורה של
קואורדינטות, כך שזה רץ לנצח בכמה קילובתים ולעולם לא חוזר.

בנוי כרקע נעול-מסך לאפליקציה ניידות ייצור; מורכבת משום שזה תברר שהיה
מסוג ההנדסה החביבה שראוי שיתוף.

## התחלה מהירה

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

או הרץ את הדמו הצרור: `bun run build && bunx serve .` →
[examples/demo.html](examples/demo.html).

## מה הופך את זה לעניין

- **עולם דטרמיניסטי** — כל כיתת כביש, בלוק, עגלוג, ושלב אור הוא
  גיבוב של קואורדינטות הרשת שלו. המצלמה יכולה לעוף בכל מקום וחזור;
  כלום לא מאוחסן, כלום לא סחרחר.
- **תנועה כנה** — עוקב מכונית עם דחיסת תור, בלימה אסימפטוטית לשורות עצירה,
  קשתות נכנסות לעגלוג, קשתות פנייה מודע-נתיב שלעולם לא חוצות את הצד הבא בחזיתות, בדיקת רווח החלפות נתיב, התמוטטויות בנתיב נדירות.
- **ביצוע הסתגלות** — סימולציה מיקרו בזמן התקנה מידתה תקציבי ישות ודך DPR לציוד (0.25×–1.2×); שומר ריצה זורק מכוניות אם טרמיקה נושכת בכל זאת; כובע מסגרת עוצר לוחות 120 Hz מלהשלם ארבע פעמים עבור פנייה איטית.
  `prefers-reduced-motion` מעבד מסגרת סטטית אחת.
- **בדיקה בידי קונסטרוקציה** — כל אקראיות זורמות דרך RNG מוזרק. הסוויטה מנהלת סימולציות זרוע וטוענת אינוריאנטים אמיתיים: אורות לעולם לא ירוקים בשתי דרכים, מכוניות לעולם לא חופפות, עגלוגים לעולם לא יותרים אף אחד, סימון 3 600-שלב נשאר סופי ומשמעת נתיב.

## API

| ייצוא | מטרה |
| --- | --- |
| `createCityFlythrough(canvas, options)` | הרקע המלא: `start` / `stop` / `setTheme` / `destroy`, בתוספת ידיות `sim` ו-`sky` חיות. |
| `TrafficSim`, `Sky` | שכבות הסימולציה, בשימוש headless (כך הסוויטה מריצה אותן). |
| `renderFrame`, `PALETTE_DARK`, `PALETTE_LIGHT` | המעבד והערכות צבעים — הנח את הלולאה שלך או הפלטה. |
| `roadInfo`, `lightGreen`, `hash`, ... | פונקציות העולם הדטרמיניסטיות, מיוצאות בנפרד. |
| `measurePerfFactor`, `dprCapFor` | אמת ציוד, בשימוש חוזר לכל סצנת בד. |

אפשרויות: `minimal`, `theme` / `palette`, `rng` (סצנות דטרמיניסטיות), ו-
`respectReducedMotion`.

## ביצוע

נמדד עם [mitata](https://github.com/evanwashere/mitata) ב-Apple M4, Bun 1.3
(`bun run bench`, סימולציה זרוע, צפייה 1280×800):

| מכוניות על מסך | `sim.step` | `renderFrame` (JS צד) |
| --- | --- | --- |
| 40 | 5.5 µs | 74 µs |
| 120 | 19.1 µs | 76 µs |
| 300 | 54.9 µs | 94 µs |

בתוספת פונקציות העולם המצלמה מסתמכת עליהן כל הזמן: `roadInfo` ≈ 3.6 ns, `hash` ≈ 7.3 ns
לכל קריאה — זול מספיק שכלום לא צריך קישור, וזו בדיוק למה טיסה בכל מקום וחזרה עוולה כלום וחנויה כלום.

**קרא אלה בכנות.** `renderFrame` כאן רץ כנגד הקשר ללא-או, אז הטבלה היא *שלנו*
עבודה לכל-מסגרת, לא רסטריזציה של ה-GPU — בציוד אמיתי שיעור מילוי שולט, וזה בדיוק מה ה-DPR כובע קיים כדי לשלוט. הטריפ התנועה מכפיל את עלות הסימולציה בעשר אך בקושי מזיז את עלות הציור, משום שהעיר עצמה (כבישים, בלוקים, עצים) היא רובה של המסגרת. אפילו ב-300 מכוניות צד ה-JS של מסגרת הוא ~0.15 ms נגד תקציב של 16.7 ms ב-60 Hz, אז התקציב ההסתגלות הוא שם לעצבות קלות וחניקה תרמית, לא למתמטיקה.

## תיעוד

- [הסימולציה](docs/simulation.md) — תיבטוח העולם, מודל התנועה, ו-
  הקנקן ביצוע שלוש-שכבות.

## למה בנינו את זה

ב-[Ridewolf](https://ridewolf.com) אפליקציית מפעיל דרוש מסך נעול שחש
חי ללא ספינה של סיפורי וידאו או הצתת סוללות. עיר פרוצדורלית הייתה התשובה — ואיפה שבין "מכוניות צריכות לעצור ברמזורים" ו"נכנסים חייבים לנכנע לטבעת", הוא בשקט הפך סימולציה תנועה עם דעות. היא כעת משמשת כהדגמה מועדפת שלנו של ביצוע בד ההסתגלות.

## תרומה

תרומות מוזמנות — סוגי בלוק חדשים, התנהגויות רכב, והפלטות
בעיקר. ראה את [מדריך התרומה](https://github.com/Ridewolf/.github/blob/main/CONTRIBUTING.md).
הרץ `bun test`, `bun run lint`, `bun run typecheck` לפני PR. בעיות ביטחון:
[SECURITY.md](https://github.com/Ridewolf/.github/blob/main/SECURITY.md) — לעולם לא בבעיה ציבורית.

## רישיון

[MIT](LICENSE) © [Ridewolf](https://ridewolf.com)
