<!-- docs-i18n: generated translation — do not edit by hand.
     locale: uk
     source: README.md (a549b5879222938d)
     model: claude-haiku-4.5
     generated: 2026-07-31T15:09:55.037Z
     Edit README.md and re-run `docs-i18n translate` instead. -->

> 🌐 This is a generated translation. The canonical document is [README.md](../../../README.md).

<!-- docs-i18n:switcher -->
<p align="center"><sub><a href="../../../README.md">English</a> · <a href="../ru/README.md">Русский</a> · <a href="../ro/README.md">Română</a> · <a href="../de/README.md">Deutsch</a> · <a href="../es/README.md">Español</a> · <a href="../fr/README.md">Français</a> · <a href="../it/README.md">Italiano</a> · <a href="../pt/README.md">Português</a> · <b>Українська</b> · <a href="../pl/README.md">Polski</a> · <a href="../tr/README.md">Türkçe</a> · <a href="../sv/README.md">Svenska</a> · <a href="../nl/README.md">Nederlands</a> · <a href="../el/README.md">Ελληνικά</a> · <a href="../ar/README.md">العربية</a> · <a href="../he/README.md">עברית</a></sub></p>
<!-- /docs-i18n:switcher -->

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-white.png">
    <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-dark.png" alt="Ridewolf" width="260">
  </picture>
  <h1>@ridewolf/city-flythrough</h1>
  <p>Процедурне місто з живим трафіком на простому 2D полотні.<br>
  Детермінована генерація світу, реальні світлофори та кільцеві розв'язки,<br>
  дисципліна переходу між смугами та адаптивна продуктивність. Без залежностей.</p>
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

Камера дрейфує над нескінченним містом. Дороги мають ширину та обмеження швидкості; машини тримаються
своїх смуг, чекають на червоні світла, поступаються при в'їзді на кільцеву розв'язку, планують правильні дуги повороту,
час від часу ламаються й закупорюють смугу. Блоки — це будівлі, парки та площі. Хмари дрейфують; дуже рідко літак перетинає. Ніщо не записується і не підробляється — це **реальна мікросимуляція** над світом, який є чистою функцією
координат, тому він працює вічно в кількох кілобайтах і ніколи не повторюється.

Побудовано як заставка екрана блокування для виробничого додатку мобільності; витягнуто, тому що
виявилося тим цікавим видом інженерії, вартої поділу.

## Швидкий старт

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

Або запустіть вбудовану демонстрацію: `bun run build && bunx serve .` →
[examples/demo.html](examples/demo.html).

## Що робить це цікавим

- **Детермінований світ** — кожен клас дороги, блок, кільцева розв'язка та фаза світла —
  це хеш її координат сітки. Камера може летіти будь-куди і повернутися;
  нічого не зберігається, нічого не дрейфує.
- **Честна трафік** — слідування за машиною з компресією черг, асимптотичне гальмування до
  стоп-ліній, дуги поступлення на кільцевій розв'язці, дуги повороту з урахуванням смуги, які ніколи не перетинають
  протилежну сторону, перевірені щілини для переходу між смугами, рідкі порушення в смузі.
- **Адаптивна продуктивність** — мікробенчмарк в момент монтування масштабує бюджети сутностей та
  ліміт DPR на пристрій (0.25×–1.2×); дежурна охорона в момент виконання скидає машини, якщо термічні
  гвинти все одно навали; ліміт кадрів зупиняє 120 Hz панелі від сплати в чотири рази за повільну панораму.
  `prefers-reduced-motion` малює один статичний кадр.
- **Перевіряється за конструкцією** — вся випадковість проходить через впроваджений RNG. Набір
  тестів запускає насіяні симуляції та стверджує реальні інваріанти: світла ніколи не зелені в обидва боки, машини ніколи не перекриваються, кільцеві розв'язки ніколи не ловлять нікого, замочування з 3 600 кроків залишається скінченним та дисциплінованим в смузі.

## API

| Експорт | Призначення |
| --- | --- |
| `createCityFlythrough(canvas, options)` | Повна заставка: `start` / `stop` / `setTheme` / `destroy`, плюс живі `sim` та `sky` ручки. |
| `TrafficSim`, `Sky` | Шари симуляції, придатні для безголової роботи (це як бігають тести). |
| `renderFrame`, `PALETTE_DARK`, `PALETTE_LIGHT` | Рендерер та теми — принесіть свої власні цикл або палітру. |
| `roadInfo`, `lightGreen`, `hash`, ... | Детерміновані функції світу, експортовані окремо. |
| `measurePerfFactor`, `dprCapFor` | Бенчмарк пристрою, придатний для повторного використання в будь-якій сцені полотна. |

Опції: `minimal`, `theme` / `palette`, `rng` (детерміновані сцени), та
`respectReducedMotion`.

## Продуктивність

Вимірено з [mitata](https://github.com/evanwashere/mitata) на Apple M4, Bun 1.3
(`bun run bench`, насіяна симуляція, 1280×800 видовків):

| Машини на екрані | `sim.step` | `renderFrame` (сторона JS) |
| --- | --- | --- |
| 40 | 5.5 µs | 74 µs |
| 120 | 19.1 µs | 76 µs |
| 300 | 54.9 µs | 94 µs |

Плюс функції світу, на які камера спирається постійно: `roadInfo` ≈ 3.6 ns, `hash` ≈ 7.3 ns
на виклик — достатньо дешево, що нічого не потребує кешування, що саме чому політ будь-куди і повернення
ніч не коштує та нічого не зберігає.

**Читайте це чесно.** `renderFrame` тут працює проти контексту без операцій, тому таблиця — це *наша*
робота за кадр, а не растеризація GPU — на реальному пристрої швидкість заповнення домінує, і це саме
те, для чого існує ліміт DPR. Потроєння трафіку множить витрати симуляції на десять, але ледве рушає витрати малювання, тому що місто саме по собі (дороги, блоки, дерева) — більшість кадру. Навіть при 300 машин сторона JS кадру ~ 0.15 ms проти бюджету 16.7 ms на 60 Hz, тому адаптивний бюджет — для слабких GPU та теплової дросельної заслінки, а не для математики.

## Документація

- [Симуляція](docs/simulation.md) — хешування світу, модель трафіку та
  трьохрівневий конверт продуктивності.

## Чому ми це побудували

На [Ridewolf](https://ridewolf.com) додаток оператора потребував екрана блокування, що себе почував
живим без доставки відеоматеріалів або спалювання батарей. Процедурне місто було відповіддю — і десь між
"машини повинні зупинятися на світлах" та "учасники повинні поступатися кільцю", це тихо стало симуляцією трафіку з переконаннями. Тепер він служить подвійно як наш улюблений демонстраційний матеріал адаптивної продуктивності полотна.

## Участь

Участь приймаємо — нові типи блоків, поведінка транспортних засобів та палітри
особливо. Див. [посібник участі](https://github.com/Ridewolf/.github/blob/main/CONTRIBUTING.md).
Запустіть `bun test`, `bun run lint`, `bun run typecheck` перед PR. Проблеми безпеки:
[SECURITY.md](https://github.com/Ridewolf/.github/blob/main/SECURITY.md) — ніколи в публічній проблемі.

## Ліцензія

[MIT](LICENSE) © [Ridewolf](https://ridewolf.com)
