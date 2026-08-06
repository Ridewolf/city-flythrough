<!-- docs-i18n: generated translation — do not edit by hand.
     locale: ru
     source: README.md (a549b5879222938d)
     model: claude-haiku-4.5
     generated: 2026-07-31T15:09:55.034Z
     Edit README.md and re-run `docs-i18n translate` instead. -->

> 🌐 This is a generated translation. The canonical document is [README.md](../../../README.md).

<!-- docs-i18n:switcher -->
<p align="center"><sub><a href="../../../README.md">English</a> · <b>Русский</b> · <a href="../ro/README.md">Română</a> · <a href="../de/README.md">Deutsch</a> · <a href="../es/README.md">Español</a> · <a href="../fr/README.md">Français</a> · <a href="../it/README.md">Italiano</a> · <a href="../pt/README.md">Português</a> · <a href="../uk/README.md">Українська</a> · <a href="../pl/README.md">Polski</a> · <a href="../tr/README.md">Türkçe</a> · <a href="../sv/README.md">Svenska</a> · <a href="../nl/README.md">Nederlands</a> · <a href="../el/README.md">Ελληνικά</a> · <a href="../ar/README.md">العربية</a> · <a href="../he/README.md">עברית</a></sub></p>
<!-- /docs-i18n:switcher -->

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-white.png">
    <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-dark.png" alt="Ridewolf" width="260">
  </picture>
  <h1>@ridewolf/city-flythrough</h1>
  <p>Процедурный город с живым трафиком на 2D холсте.<br>
  Детерминированная генерация мира, реальные светофоры и круговые перекрёстки,<br>
  дисциплина на полосах и адаптивная производительность. Без зависимостей.</p>
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

Камера парит над бесконечным городом. Дороги имеют ширину и ограничения скорости; машины
держатся своих полос, ждут на красных светах, уступают на круговых перекрёстках, планируют
правильные дуги поворотов, иногда ломаются и перекрывают полосу. Блоки это здания, парки и
площади. Облака плывут над ними; очень редко самолёт пересекает небо. Ничего из этого не
записано и не подделано — это **реальная микросимуляция** над миром, который является чистой
функцией координат, поэтому она работает вечно в несколько килобайт и никогда не повторяется.

Построено как обои блокировки экрана для production приложения мобильности; извлечено потому что
оказалось интересным видом инженерии, стоящей поделиться.

## Быстрый старт

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

Или запустите встроенную демонстрацию: `bun run build && bunx serve .` →
[examples/demo.html](examples/demo.html).

## Что делает это интересным

- **Детерминированный мир** — каждый класс дороги, блок, круговой перекрёсток и фаза света
  это хеш его координат в сетке. Камера может летать куда угодно и вернуться;
  ничего не хранится, ничего не дрейфует.
- **Честный трафик** — следование за машиной с сжатием очереди, асимптотическое торможение до
  стоп-линии, дуги уступания на круговых перекрёстках, дуги поворотов в зависимости от полос,
  которые никогда не пересекают встречную сторону, проверка зазора при смене полос, редкие
  поломки в полосе.
- **Адаптивная производительность** — микробенчмарк в момент монтирования масштабирует бюджеты
  сущностей и потолок DPR под устройство (0.25×–1.2×); охрана во время выполнения сбрасывает
  машины если термальный дроссель применяется в любом случае; потолок кадра停止 панели на 120 Hz
  от оплаты в четыре раза больше за медленную панораму. `prefers-reduced-motion` рисует один статичный кадр.
- **Тестируемо по конструкции** — вся случайность течёт через внедрённый RNG. Набор тестов
  запускает симуляции с начальным значением и проверяет реальные инварианты: огни никогда не
  зелёные в обе стороны, машины никогда не перекрываются, круговые перекрёстки никогда не
  ловят кого-то, замачивание на 3 600 шагов остаётся конечным и дисциплинированным на полосах.

## API

| Экспорт | Назначение |
| --- | --- |
| `createCityFlythrough(canvas, options)` | Полный фон: `start` / `stop` / `setTheme` / `destroy`, плюс живые `sim` и `sky` ручки. |
| `TrafficSim`, `Sky` | Слои симуляции, можно использовать без пользовательского интерфейса (вот как тесты их запускают). |
| `renderFrame`, `PALETTE_DARK`, `PALETTE_LIGHT` | Рендерер и темы — приносите свой цикл или палитру. |
| `roadInfo`, `lightGreen`, `hash`, ... | Детерминированные функции мира, экспортируются индивидуально. |
| `measurePerfFactor`, `dprCapFor` | Бенчмарк устройства, переиспользуемый для любой сцены холста. |

Опции: `minimal`, `theme` / `palette`, `rng` (детерминированные сцены) и
`respectReducedMotion`.

## Производительность

Измерено с помощью [mitata](https://github.com/evanwashere/mitata) на Apple M4, Bun 1.3
(`bun run bench`, симуляция с начальным значением, вьюпорт 1280×800):

| Машин на экране | `sim.step` | `renderFrame` (сторона JS) |
| --- | --- | --- |
| 40 | 5.5 µs | 74 µs |
| 120 | 19.1 µs | 76 µs |
| 300 | 54.9 µs | 94 µs |

Плюс функции мира, на которые камера опирается постоянно: `roadInfo` ≈ 3.6 ns, `hash` ≈ 7.3 ns
за вызов — дёшево достаточно чтобы ничего не нужно было кешировать, что почему летать куда
угодно и вернуться ничего не стоит и ничего не хранит.

**Читайте эти числа честно.** `renderFrame` здесь работает против контекста no-op, поэтому таблица это *наша*
работа за кадр, а не растеризация GPU — на реальном устройстве fill rate доминирует, и это ровно то,
для чего существует потолок DPR. Утройка трафика умножает затраты симуляции на десять, но едва сдвигает
затраты рисования, потому что сам город (дороги, блоки, деревья) это большая часть кадра. Даже на 300
машинах сторона JS кадра это ~0.15 ms против 16.7 ms бюджета на 60 Hz, поэтому адаптивный бюджет там
для слабых GPU и термального дросселирования, не для математики.

## Документация

- [Симуляция](docs/simulation.md) — хеширование мира, модель трафика и
  трёхслойный конверт производительности.

## Почему мы это построили

В [Ridewolf](https://ridewolf.com) приложению оператора нужен был экран блокировки, который
выглядел живым без доставки видео-ассетов или расходования батареи. Процедурный город был
ответом — и где-то между "машины должны останавливаться на светах" и "въезжающие должны
уступать кольцу", оно тихо стало трафик-симуляцией с мнением. Теперь это удваивается как
наша любимая демонстрация адаптивной производительности холста.

## Участие

Участие приветствуется — новые типы блоков, поведения машин и палитры
особенно. Смотрите [руководство по участию](https://github.com/Ridewolf/.github/blob/main/CONTRIBUTING.md).
Запустите `bun test`, `bun run lint`, `bun run typecheck` перед PR. Проблемы безопасности:
[SECURITY.md](https://github.com/Ridewolf/.github/blob/main/SECURITY.md) — никогда в публичной issue.

## Лицензия

[MIT](LICENSE) © [Ridewolf](https://ridewolf.com)
