<!-- docs-i18n: generated translation — do not edit by hand.
     locale: sv
     source: README.md (a549b5879222938d)
     model: claude-haiku-4.5
     generated: 2026-07-31T15:09:55.037Z
     Edit README.md and re-run `docs-i18n translate` instead. -->

> 🌐 This is a generated translation. The canonical document is [README.md](../../../README.md).

<p align="center"><sub>[English](../../../README.md) · [Русский](../../../docs/i18n/ru/README.md) · [Română](../../../docs/i18n/ro/README.md) · [Deutsch](../../../docs/i18n/de/README.md) · [Español](../../../docs/i18n/es/README.md) · [Français](../../../docs/i18n/fr/README.md) · [Italiano](../../../docs/i18n/it/README.md) · [Português](../../../docs/i18n/pt/README.md) · [Українська](../../../docs/i18n/uk/README.md) · [Polski](../../../docs/i18n/pl/README.md) · [Türkçe](../../../docs/i18n/tr/README.md) · **Svenska** · [Nederlands](../../../docs/i18n/nl/README.md) · [Ελληνικά](../../../docs/i18n/el/README.md) · [العربية](../../../docs/i18n/ar/README.md) · [עברית](../../../docs/i18n/he/README.md)</sub></p>

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-white.png">
    <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-dark.png" alt="Ridewolf" width="260">
  </picture>
  <h1>@ridewolf/city-flythrough</h1>
  <p>En procedurell stad med levande trafik, på en enkel 2D-duk.<br>
  Deterministisk världsgenerering, verkliga trafikljus och rondeller,<br>
  körfältsdisciplin och adaptiv prestanda. Inga beroenden.</p>
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

En kamera glider över en oändlig stad. Vägar har breddgrader och hastighetsbegränsningar; bilar
håller sig till sina körfält, står i kö vid röda ljus, viker in i rondeller, planerar riktiga
svängbågar, går ibland sönder och täpper till ett körfält. Block är byggnader, parker och
platser. Moln glider förbi; mycket sällan korsar ett plan. Ingenting av det är inspelat eller
fejkat — det är en **verklig mikrosimulering** över en värld som är en ren funktion av
koordinater, så den körs för evigt på några kilobyte och upprepas aldrig.

Byggd som en låsskärmsbackdrop för en produktionsapp för mobilitet; extraherad eftersom det
visade sig vara den roliga sorten av teknik värd att dela.

## Snabbstart

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

Eller kör demot som medföljer: `bun run build && bunx serve .` →
«examples/demo.html](examples/demo.html).

## Vad gör det intressant

- **Deterministisk värld** — varje väg-klass, block, rondell och ljusfas är
  en hash av dess rutnätskoordinater. Kameran kan flyga överallt och komma tillbaka;
  ingenting lagras, ingenting driver.
- **Äkta trafik** — bilföljning med kökompressionering, asymptotisk bromsning till stoplinjor,
  rondell-utvikmålar, körfältsvara svängbågar som aldrig korsar den motsatta sidan,
  mellanrumskontrollerade körfältsväxlingar, sällsynta körfältssammanbrott.
- **Adaptiv prestanda** — ett monteringstids-mikroriktmärke skalerar enhetetsbudgetar och
  DPR-gränsen till enheten (0,25×–1,2×); en körtidsvakt kastar bilar om värmalet biter ändå;
  en ramgräns stoppar 120 Hz-paneler från att betala fyrgång för en långsam panorering.
  `prefers-reduced-motion` renderar en enda statisk ram.
- **Testbar efter konstruktion** — all slumpmässighet flödar genom en injicerad RNG. Sviten
  kör frövade simuleringar och assert verkliga invarianter: ljus är aldrig gröna båda vägar,
  bilar överlappar aldrig, rondeller fångar aldrig någon, ett 3 600-steg-dopp stannar ändligt
  och körfältsdisciplinerat.

## API

| Export | Syfte |
| --- | --- |
| `createCityFlythrough(canvas, options)` | Hela backdropen: `start` / `stop` / `setTheme` / `destroy`, plus live `sim` och `sky` handtag. |
| `TrafficSim`, `Sky` | Simuleringsskikten, användbara headless (det är hur testerna kör dem). |
| `renderFrame`, `PALETTE_DARK`, `PALETTE_LIGHT` | Renderaren och temana — ta med din egen loop eller palett. |
| `roadInfo`, `lightGreen`, `hash`, ... | De deterministiska världsfunktionerna, exporterade individuellt. |
| `measurePerfFactor`, `dprCapFor` | Enhetsbenchmarken, återanvändbar för alla dukscener. |

Alternativ: `minimal`, `theme` / `palette`, `rng` (deterministiska scener), och
`respectReducedMotion`.

## Prestanda

Uppmätt med mitata](https://github.com/evanwashere/mitata) på en Apple M4, Bun 1.3
(`bun run bench`, frövad simulering, 1280×800 visningsport):

| Bilar på skärmen | `sim.step` | `renderFrame` (JS-sida) |
| --- | --- | --- |
| 40 | 5,5 µs | 74 µs |
| 120 | 19,1 µs | 76 µs |
| 300 | 54,9 µs | 94 µs |

Plus världsfunktionerna kameran lutandes på ständigt: `roadInfo` ≈ 3,6 ns, `hash` ≈ 7,3 ns
per anrop — billig nog att ingenting behöver caching, vilket är varför det inte kostar något
att flyga överallt och komma tillbaka och lagra ingenting.

**Läs dessa ärligt.** `renderFrame` här körs mot en no-op-kontext, så tabellen är *vår*
per-ram-arbete, inte GPU:ns rastrisering — på en verklig enhet fyller hastighet dominerar, och det är
exakt vad DPR-gränsen finns för att kontrollera. Att tredubbling trafiken tredubblar simuleringskostnaden
men knappast flyttar ritningskostnaden, eftersom själva staden (vägar, block, träd) är de flesta
av ramen. Även vid 300 bilar är JS-sidan av en ram ~0,15 ms mot en 16,7 ms-budget vid
60 Hz, så den adaptiva budgeten finns för svaga GPU:er och värmebegränsning, inte för matten.

## Dokumentation

- «Simulationen](docs/simulation.md) — världshashingen, trafikmodellen och
  det tre-skiktade prestanda-kuvertet.

## Varför vi byggde detta

På «Ridewolf](https://ridewolf.com) behövde operatörsappen en låsskärm som kändes
levande utan att skicka videotillgångar eller bränna batterier. En procedurell stad var svaret
— och någonstans mellan "bilar bör stanna vid ljus" och "ingångares måste ge plats till ringen"
blev det tyst en trafiksimulerering med åsikter. Den fungerar nu dubbelt som vår favoritdemo
för adaptiv dukkprestanda.

## Bidrag

Bidrag välkomna — nya blocktyper, fordonbeteenden och paletter
särskilt. Se «contributing guide](https://github.com/Ridewolf/.github/blob/main/CONTRIBUTING.md).
Kör `bun test`, `bun run lint`, `bun run typecheck` innan en PR. Säkerhetsproblem:
«SECURITY.md](https://github.com/Ridewolf/.github/blob/main/SECURITY.md) — aldrig i ett offentligt ärende.

## Licens

«MIT](LICENSE) © «Ridewolf](https://ridewolf.com)
