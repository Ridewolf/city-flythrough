<!-- docs-i18n: generated translation — do not edit by hand.
     locale: nl
     source: README.md (a549b5879222938d)
     model: claude-haiku-4.5
     generated: 2026-07-31T15:09:55.038Z
     Edit README.md and re-run `docs-i18n translate` instead. -->

> 🌐 This is a generated translation. The canonical document is [README.md](../../../README.md).

<!-- docs-i18n:switcher -->
<p align="center"><sub><a href="../../../README.md">English</a> · <a href="../ru/README.md">Русский</a> · <a href="../ro/README.md">Română</a> · <a href="../de/README.md">Deutsch</a> · <a href="../es/README.md">Español</a> · <a href="../fr/README.md">Français</a> · <a href="../it/README.md">Italiano</a> · <a href="../pt/README.md">Português</a> · <a href="../uk/README.md">Українська</a> · <a href="../pl/README.md">Polski</a> · <a href="../tr/README.md">Türkçe</a> · <a href="../sv/README.md">Svenska</a> · <b>Nederlands</b> · <a href="../el/README.md">Ελληνικά</a> · <a href="../ar/README.md">العربية</a> · <a href="../he/README.md">עברית</a></sub></p>
<!-- /docs-i18n:switcher -->

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-white.png">
    <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-dark.png" alt="Ridewolf" width="260">
  </picture>
  <h1>@ridewolf/city-flythrough</h1>
  <p>Een procedurele stad met levend verkeer op een vlak 2D-canvas.<br>
  Deterministische wereldgeneratie, echte verkeerslichten en rotondes,<br>
  rijstrookdiscipline en adaptieve prestatie. Nul afhankelijkheden.</p>
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

Een camera zweeft over een eindeloze stad. Wegen hebben breedtes en snelheidslimieten;
auto's houden zich aan hun rijstroken, wachten op rode lichten, wijken uit naar rotondes,
plannen geschikte draaiingsbogen, breken af en toe uit en versperren een rijstrook.
Blokken zijn gebouwen, parken en pleinen. Wolken drijven voorbij; zeer zelden steekt
een vliegtuig over. Niets ervan wordt opgenomen of nagebootst — het is een **echte
microsimulatie** over een wereld die een zuivere functie van coördinaten is, dus het
loopt voor altijd in een paar kilobytes en herhaalt zich nooit.

Gebouwd als een lockscreen-achtergrond voor een productie-mobiliteitapp; geëxtraheerd
omdat het de leuke soort engineering bleek te zijn die het waard is om te delen.

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

Of voer de meegeleverde demo uit: `bun run build && bunx serve .` →
[examples/demo.html](examples/demo.html).

## Wat maakt het interessant

- **Deterministische wereld** — elke weglasse, blok, rotonde en lichtfase is
  een hash van zijn roostercoördinaten. De camera kan overal heen en terugkomen;
  niets wordt opgeslagen, niets drijft.
- **Eerlijk verkeer** — auto's volgen elkaar met rijopdrachtcompressie, asymptotisch remmen
  naar stoplijnen, rotonde-uitwijkbogen, rijstrookbewuste draaiingsbogen die nooit naar
  de tegenovergestelde zijde kruisen, gat-gecontroleerde rijstrookveranderingen, zeldzame
  in-rijstrook-storingen.
- **Adaptieve prestatie** — een koppel-tijdmicro-benchmark schaalt entiteitsbegrotingen en
  de DPR-plafond naar het apparaat (0,25×–1,2×); een runtime-bewaker werpt auto's af als
  thermische problemen zich toch voordoen; een frame-cap stopt 120 Hz-panelen van het
  viervoudig betalen voor een langzame pan. `prefers-reduced-motion` geeft een enkel statisch frame weer.
- **Testbaar door constructie** — alle willekeurigheid stroomt door een ingebrachte RNG. De
  suite voert gezaaide simulaties uit en stelt echte invarianten: lichten zijn nooit beide
  kanten groen, auto's overlappen nooit, rotondes vangen niemand op, een 3 600-staps soak
  blijft eindig en rijstrookdisciplinair.

## API

| Export | Doel |
| --- | --- |
| `createCityFlythrough(canvas, options)` | De volledige achtergrond: `start` / `stop` / `setTheme` / `destroy`, plus live `sim` en `sky` handles. |
| `TrafficSim`, `Sky` | De simulatielagen, bruikbaar headless (dat is hoe de tests ze uitvoeren). |
| `renderFrame`, `PALETTE_DARK`, `PALETTE_LIGHT` | De renderer en thema's — breng je eigen lus of palet mee. |
| `roadInfo`, `lightGreen`, `hash`, ... | De deterministische wereldfuncties, individueel geëxporteerd. |
| `measurePerfFactor`, `dprCapFor` | De apparaatmeting, herbruikbaar voor elke canvasscène. |

Opties: `minimal`, `theme` / `palette`, `rng` (deterministische scènes), en
`respectReducedMotion`.

## Prestatie

Gemeten met [mitata](https://github.com/evanwashere/mitata) op een Apple M4, Bun 1.3
(`bun run bench`, gezaaide simulatie, 1280×800 viewport):

| Auto's op scherm | `sim.step` | `renderFrame` (JS-kant) |
| --- | --- | --- |
| 40 | 5,5 µs | 74 µs |
| 120 | 19,1 µs | 76 µs |
| 300 | 54,9 µs | 94 µs |

Plus de wereldfuncties waar de camera voortdurend op leunt: `roadInfo` ≈ 3,6 ns, `hash` ≈ 7,3 ns
per aanroep — goedkoop genoeg dat niets caching nodig heeft, wat is waarom overal heen en
terugkomen niets kost en niets opslaat.

**Lees deze eerlijk.** `renderFrame` hier voert zich uit tegen een no-op-context, dus de tabel is
*onze* per-frame-werk, niet de GPU's rasterisatie — op een echt apparaat domineert vulsnelheid,
en dat is precies wat het DPR-plafond bestaat om te controleren. De verkeer ver- drieën de
simulatiekosten met tien maar nauwelijks de tekenkosten, omdat de stad zelf (wegen, blokken,
bomen) de meeste van het frame is. Zelfs op 300 auto's is de JS-kant van een frame ~0,15 ms
tegen een 16,7 ms budget op 60 Hz, dus de adaptieve begroting is er voor zwakke GPU's en
thermische vertraging, niet voor de wiskunde.

## Documentatie

- [De simulatie](docs/simulation.md) — de werelhashing, het verkeersmodel en
  de drielaagse prestatie-omhulsel.

## Waarom we dit hebben gebouwd

Bij [Ridewolf](https://ridewolf.com) had de operator-app een lockscreen nodig die levend
voelde zonder videobijlagen te versturen of batterijen op te branden. Een procedurele stad was
het antwoord — en ergens tussen "auto's moeten op lichten stoppen" en "ingangers moeten naar
de ring wijken", werd het stilletjes een verkeerssimulatie met meningen. Het is nu ook onze
favoriete demo van adaptieve canvasprestatie.

## Bijdragen

Bijdragen welkom — nieuwe bloktypen, voertuiggedragingen en paletten vooral. Zie de
[contributing guide](https://github.com/Ridewolf/.github/blob/main/CONTRIBUTING.md).
Voer `bun test`, `bun run lint`, `bun run typecheck` uit voor een PR. Beveiligingsproblemen:
[SECURITY.md](https://github.com/Ridewolf/.github/blob/main/SECURITY.md) — nooit in een openbare issue.

## Licentie

[MIT](LICENSE) © [Ridewolf](https://ridewolf.com)
