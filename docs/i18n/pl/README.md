<!-- docs-i18n: generated translation — do not edit by hand.
     locale: pl
     source: README.md (a549b5879222938d)
     model: claude-haiku-4.5
     generated: 2026-07-31T15:09:55.037Z
     Edit README.md and re-run `docs-i18n translate` instead. -->

> 🌐 This is a generated translation. The canonical document is [README.md](../../../README.md).

<!-- docs-i18n:switcher -->
<p align="center"><sub><a href="../../../README.md">English</a> · <a href="../ru/README.md">Русский</a> · <a href="../ro/README.md">Română</a> · <a href="../de/README.md">Deutsch</a> · <a href="../es/README.md">Español</a> · <a href="../fr/README.md">Français</a> · <a href="../it/README.md">Italiano</a> · <a href="../pt/README.md">Português</a> · <a href="../uk/README.md">Українська</a> · <b>Polski</b> · <a href="../tr/README.md">Türkçe</a> · <a href="../sv/README.md">Svenska</a> · <a href="../nl/README.md">Nederlands</a> · <a href="../el/README.md">Ελληνικά</a> · <a href="../ar/README.md">العربية</a> · <a href="../he/README.md">עברית</a></sub></p>
<!-- /docs-i18n:switcher -->

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-white.png">
    <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-dark.png" alt="Ridewolf" width="260">
  </picture>
  <h1>@ridewolf/city-flythrough</h1>
  <p>Proceduralne miasto z żywym ruchem, na zwykłym płaskim kanwie.<br>
  Deterministyczne generowanie świata, rzeczywiste światła drogowe i ronda,<br>
  dyscyplina pasów ruchu i adaptacyjna wydajność. Bez zależności.</p>
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

Kamera dryfuje nad nieskończonym miastem. Drogi mają szerokości i limity prędkości;
samochody trzymają się swoich pasów, czekają na czerwonych światłach, ustępują na rondach,
planują prawidłowe łuki skrętu, czasami się psują i zatkają pas. Bloki to budynki, parki
i place. Chmury dryfują; bardzo rzadko, samolot się pojawia. Nic z tego nie jest nagrywane
ani fałszywe — to **prawdziwa mikrosymulacja** nad światem, który jest czystą funkcją
współrzędnych, więc działa wiecznie w kilka kilobajtów i nigdy się nie powtarza.

Zbudowane jako tapeta blokady ekranu dla produkcyjnej aplikacji mobilności; wyekstrahowane,
ponieważ okazało się być zabawnym rodzajem inżynierii wartym udostępnienia.

## Szybki start

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

Lub uruchom dołączony demo: `bun run build && bunx serve .` →
[examples/demo.html](examples/demo.html).

## Co czyni to interesującym

- **Deterministyczny świat** — każda klasa drogi, blok, rondo i faza światła
  to skrót współrzędnych siatki. Kamera może latać wszędzie i wrócić;
  nic nie jest przechowywane, nic się nie dryfuje.
- **Uczciwy ruch** — podążanie za samochodami z kompresją kolejki, asymptotycznym hamowaniem
  do linii zatrzymania, łukami ustępowania na rondach, łukami skrętu świadomymi pasów,
  które nigdy nie przecinają strony naprzeciwko, zmianami pasów sprawdzanymi pod względem
  szczeliny, rzadkie awarie w pasie.
- **Adaptacyjna wydajność** — mikro-benchmark w momencie montażu skaluje budżety jednostek
  i limit DPR do urządzenia (0,25×–1,2×); strażnik runtime odrzuca samochody, jeśli termika
  zadziała mimo wszystko; limit klatek zatrzymuje panele 120 Hz przed zapłaceniem czterokrotności
  za powolny panoramę. `prefers-reduced-motion` renderuje pojedynczą statyczną klatkę.
- **Testowalne przez konstrukcję** — cała losowość przepływa przez wstrzykniętą losową liczbę.
  Pakiet testów napędza symulacje z ziarnem i potwierdza rzeczywiste niezmienniki: światła
  nigdy nie są zielone w obie strony, samochody nigdy się nie nakładają, ronda nigdy nikogo nie
  nie lapią, soak 3 600-krokowy pozostaje skończony i zdyscyplinowany w pasach.

## API

| Export | Cel |
| --- | --- |
| `createCityFlythrough(canvas, options)` | Pełna tapeta: `start` / `stop` / `setTheme` / `destroy`, plus live `sim` i `sky` uchwyty. |
| `TrafficSim`, `Sky` | Warstwy symulacji, użyteczne bez głowy (tak działają testy). |
| `renderFrame`, `PALETTE_DARK`, `PALETTE_LIGHT` | Renderer i motywy — przynieś własną pętlę lub paletę. |
| `roadInfo`, `lightGreen`, `hash`, ... | Funkcje świata deterministycznego, wyekstrahowane indywidualnie. |
| `measurePerfFactor`, `dprCapFor` | Benchmark urządzenia, możliwy do ponownego użycia dla każdej sceny płótna. |

Opcje: `minimal`, `theme` / `palette`, `rng` (scene deterministyczne) i
`respectReducedMotion`.

## Wydajność

Zmierzone za pomocą [mitata](https://github.com/evanwashere/mitata) na Apple M4, Bun 1.3
(`bun run bench`, symulacja z ziarnem, viewport 1280×800):

| Samochody na ekranie | `sim.step` | `renderFrame` (strona JS) |
| --- | --- | --- |
| 40 | 5,5 µs | 74 µs |
| 120 | 19,1 µs | 76 µs |
| 300 | 54,9 µs | 94 µs |

Plus funkcje świata, na które kamera stale się opiera: `roadInfo` ≈ 3,6 ns, `hash` ≈ 7,3 ns
na wywołanie — wystarczająco tanie, że nic nie potrzebuje buforowania, dlatego latanie wszędzie
i powrót nic nie kosztuje i nic nie przechowuje.

**Czytaj je szczerze.** `renderFrame` tutaj uruchamia się przed kontekstem no-op, więc tabela to *nasza*
praca na klatkę, nie rasteryzacja GPU — na rzeczywistym urządzeniu przepustowość wypełnienia
dominuje, i dokładnie dlatego limit DPR istnieje. Potrojenie ruchu mnoży koszt symulacji dziesięciokrotnie,
ale ledwie porusza koszt rysowania, ponieważ samo miasto (drogi, bloki, drzewa) to większość ramki.
Nawet przy 300 samochodach strona JS ramki to ~0,15 ms wobec budżetu 16,7 ms przy 60 Hz, więc adaptacyjny
budżet istnieje dla słabych GPU i throttlingu termicznego, a nie dla matematyki.

## Dokumentacja

- [Symulacja](docs/simulation.md) — hashing świata, model ruchu i
  trójwarstwowa koperta wydajności.

## Dlaczego to zbudowaliśmy

W [Ridewolf](https://ridewolf.com) aplikacja operatora potrzebowała blokady ekranu,
która czuła się żywa bez wysyłania zasobów wideo ani spalania baterii. Proceduralne miasto
było odpowiedzią — i gdzieś między "samochody powinny zatrzymywać się na światłach"
a "wjeżdżający muszą ustępować pierścieniowi", cicho stało się symulacją ruchu z opiniami.
Teraz podwajamy się jako nasze ulubione demo adaptacyjnej wydajności płótna.

## Wkład

Wkład jest mile widziany — nowe typy bloków, zachowania pojazdu i palety
szczególnie. Patrz [przewodnik Contributing](https://github.com/Ridewolf/.github/blob/main/CONTRIBUTING.md).
Uruchom `bun test`, `bun run lint`, `bun run typecheck` przed PR. Problemy bezpieczeństwa:
[SECURITY.md](https://github.com/Ridewolf/.github/blob/main/SECURITY.md) — nigdy w publicznym problemie.

## Licencja

[MIT](LICENSE) © [Ridewolf](https://ridewolf.com)
