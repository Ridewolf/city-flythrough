<!-- docs-i18n: generated translation — do not edit by hand.
     locale: de
     source: README.md (a549b5879222938d)
     model: claude-haiku-4.5
     generated: 2026-07-31T15:09:55.035Z
     Edit README.md and re-run `docs-i18n translate` instead. -->

> 🌐 This is a generated translation. The canonical document is [README.md](../../../README.md).

<p align="center"><sub>[English](../../../README.md) · [Русский](../../../docs/i18n/ru/README.md) · [Română](../../../docs/i18n/ro/README.md) · **Deutsch** · [Español](../../../docs/i18n/es/README.md) · [Français](../../../docs/i18n/fr/README.md) · [Italiano](../../../docs/i18n/it/README.md) · [Português](../../../docs/i18n/pt/README.md) · [Українська](../../../docs/i18n/uk/README.md) · [Polski](../../../docs/i18n/pl/README.md) · [Türkçe](../../../docs/i18n/tr/README.md) · [Svenska](../../../docs/i18n/sv/README.md) · [Nederlands](../../../docs/i18n/nl/README.md) · [Ελληνικά](../../../docs/i18n/el/README.md) · [العربية](../../../docs/i18n/ar/README.md) · [עברית](../../../docs/i18n/he/README.md)</sub></p>

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-white.png">
    <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-dark.png" alt="Ridewolf" width="260">
  </picture>
  <h1>@ridewolf/city-flythrough</h1>
  <p>Eine prozedurale Stadt mit lebendigem Verkehr auf einer ebenen 2D-Leinwand.<br>
  Deterministische Weltgenerierung, echte Ampeln und Kreisverkehre,<br>
  Spurdisziplin und adaptive Performance. Keine Abhängigkeiten.</p>
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

Eine Kamera driftet über eine endlose Stadt. Straßen haben Breiten und Geschwindigkeitsbegrenzungen;
Autos halten ihre Spuren, warten an roten Ampeln, weichen in Kreisverkehre aus, planen richtige Abbiegekurven,
brechen gelegentlich zusammen und verstopfen eine Spur. Blöcke sind Gebäude, Parks und Plätze.
Wolken ziehen vorbei; sehr selten fliegt ein Flugzeug vorbei. Nichts davon wird aufgezeichnet oder gefälscht —
es ist eine **echte Mikro-Simulation** über eine Welt, die eine reine Funktion von Koordinaten ist, daher läuft
sie für immer in wenigen Kilobytes und wiederholt sich niemals.

Gebaut als Lock-Screen-Hintergrund für eine Production Mobilitäts-App; extrahiert, weil sich herausgestellt hat,
dass es die unterhaltsame Art von Engineering ist, die es sich zu teilen lohnt.

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

Oder führe die gebündelte Demo aus: `bun run build && bunx serve .` →
[examples/demo.html](examples/demo.html).

## Was macht es interessant

- **Deterministische Welt** — jede Straßenklasse, jeder Block, Kreisverkehr und jede Ampelphase ist
  ein Hash ihrer Gitterkoordinaten. Die Kamera kann überall hinfliegen und zurückkommen;
  nichts wird gespeichert, nichts driftet.
- **Ehrlicher Verkehr** — Fahrzeugfolge mit Warteschlangen-Kompression, asymptotisches Bremsen zu
  Stopplinien, Kreisverkehr-Ausweichkurven, Spurachse-Abbiegekurven, die die Gegenseite nie kreuzen,
  Lückenkontrolle beim Spurwechsel, seltene Auf-der-Spur-Pannen.
- **Adaptive Performance** — ein Microbenchmark bei Mount-Zeit skaliert Entity-Budgets und
  den DPR-Cap zum Gerät (0,25×–1,2×); ein Runtime-Guard wirft Autos ab, wenn Thermals doch zuschlagen;
  ein Frame-Cap stoppt 120-Hz-Panels, damit sie nicht das Vierfache für ein langsames Schwenken bezahlen.
  `prefers-reduced-motion` rendert einen einzelnen statischen Frame.
- **Testbar von Konstruktion** — die ganze Zufälligkeit fließt durch einen injizierten RNG. Die
  Suite fährt Seed-Simulationen und behauptet echte Invarianten: Ampeln sind nie gleichzeitig grün,
  Autos überlappen sich nie, Kreisverkehre fangen niemanden, ein 3600-Schritt-Durchsoak bleibt
  endlich und spurdiszipliniert.

## API

| Export | Zweck |
| --- | --- |
| `createCityFlythrough(canvas, options)` | Der vollständige Hintergrund: `start` / `stop` / `setTheme` / `destroy`, plus Live-`sim` und `sky` Handles. |
| `TrafficSim`, `Sky` | Die Simulationsebenen, kopflos verwendbar (so laufen die Tests sie). |
| `renderFrame`, `PALETTE_DARK`, `PALETTE_LIGHT` | Der Renderer und Themen — bring deine eigene Schleife oder Palette. |
| `roadInfo`, `lightGreen`, `hash`, ... | Die deterministischen Weltfunktionen, einzeln exportiert. |
| `measurePerfFactor`, `dprCapFor` | Der Device-Benchmark, wiederverwendbar für jede Canvas-Szene. |

Optionen: `minimal`, `theme` / `palette`, `rng` (deterministische Szenen) und
`respectReducedMotion`.

## Performance

Gemessen mit [mitata](https://github.com/evanwashere/mitata) auf einem Apple M4, Bun 1.3
(`bun run bench`, Seed-Simulation, 1280×800 Viewport):

| Autos auf dem Bildschirm | `sim.step` | `renderFrame` (JS-Seite) |
| --- | --- | --- |
| 40 | 5,5 µs | 74 µs |
| 120 | 19,1 µs | 76 µs |
| 300 | 54,9 µs | 94 µs |

Plus die Weltfunktionen, auf die die Kamera ständig lehnt: `roadInfo` ≈ 3,6 ns, `hash` ≈ 7,3 ns
pro Aufruf — billig genug, dass nichts Caching braucht, weshalb überall hinfliegen und zurückkommen
kostet nichts und speichert nichts.

**Lies diese ehrlich.** `renderFrame` hier läuft gegen einen No-Op-Kontext, daher ist die Tabelle
*unsere* Pro-Frame-Arbeit, nicht der GPU-Rasterisierung — auf einem echten Gerät dominiert die
Fill-Rate, und genau dafür existiert der DPR-Cap. Die Verdreifachung des Verkehrs multipliziert
die Simulationskosten um zehn, aber bewegt die Zeichnungskosten kaum, weil die Stadt selbst
(Straßen, Blöcke, Bäume) die meisten Frames ist. Sogar bei 300 Autos ist die JS-Seite eines
Frames ~0,15 ms gegen ein 16,7 ms Budget bei 60 Hz, daher ist das adaptive Budget für schwache
GPUs und thermische Drosselung da, nicht für die Mathematik.

## Dokumentation

- [Die Simulation](docs/simulation.md) — das Welt-Hashing, das Verkehrsmodell und
  die dreischichtige Performance-Umhüllung.

## Warum wir das gebaut haben

Bei [Ridewolf](https://ridewolf.com) brauchte die Operator-App einen Lock-Screen, der lebendig wirkt,
ohne Video-Assets zu versenden oder Batterien zu belasten. Eine prozedurale Stadt war die
Antwort — und irgendwo zwischen „Autos sollten bei Ampeln anhalten" und „Einfahrer müssen dem Ring weichen",
wurde es leise zu einer Verkehrssimulation mit Meinungen. Sie dient jetzt auch als unsere liebste
Demo adaptiver Canvas-Performance.

## Beitragen

Beiträge willkommen — neue Block-Typen, Fahrzeug-Verhaltensweisen und Paletten
besonders. Siehe den [Contributing Guide](https://github.com/Ridewolf/.github/blob/main/CONTRIBUTING.md).
Führe `bun test`, `bun run lint`, `bun run typecheck` vor einem PR aus. Sicherheitsprobleme:
[SECURITY.md](https://github.com/Ridewolf/.github/blob/main/SECURITY.md) — niemals in einem öffentlichen Issue.

## Lizenz

[MIT](LICENSE) © [Ridewolf](https://ridewolf.com)
