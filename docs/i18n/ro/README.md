<!-- docs-i18n: generated translation — do not edit by hand.
     locale: ro
     source: README.md (a549b5879222938d)
     model: claude-haiku-4.5
     generated: 2026-07-31T15:09:55.034Z
     Edit README.md and re-run `docs-i18n translate` instead. -->

> 🌐 This is a generated translation. The canonical document is [README.md](../../../README.md).

<!-- docs-i18n:switcher -->
<p align="center"><sub><a href="../../../README.md">English</a> · <a href="../ru/README.md">Русский</a> · <b>Română</b> · <a href="../de/README.md">Deutsch</a> · <a href="../es/README.md">Español</a> · <a href="../fr/README.md">Français</a> · <a href="../it/README.md">Italiano</a> · <a href="../pt/README.md">Português</a> · <a href="../uk/README.md">Українська</a> · <a href="../pl/README.md">Polski</a> · <a href="../tr/README.md">Türkçe</a> · <a href="../sv/README.md">Svenska</a> · <a href="../nl/README.md">Nederlands</a> · <a href="../el/README.md">Ελληνικά</a> · <a href="../ar/README.md">العربية</a> · <a href="../he/README.md">עברית</a></sub></p>
<!-- /docs-i18n:switcher -->

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-white.png">
    <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-dark.png" alt="Ridewolf" width="260">
  </picture>
  <h1>@ridewolf/city-flythrough</h1>
  <p>Un oraș procedural cu trafic viu, pe o pânză 2D obișnuită.<br>
  Generare de lumi deterministică, semafoare reale și rotatoare,<br>
  disciplina benzilor și performanță adaptivă. Zero dependențe.</p>
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

O cameră se deplasează deasupra unui oraș nesfârșit. Drumurile au lățimi și limite de viteză; mașinile rămân
în benzile lor, fac coadă la semafoarele roșii, cedează în rotatoare, planifică arcuri de cotire corecte,
ocazional se striccă și încurcă o benză. Blocurile sunt clădiri, parcuri și
plaze. Norii plutesc peste; foarte rar, un avion traversează. Nimic din asta nu este înregistrat sau
fals — este o **simulare reală în miniatură** pe o lume care este o funcție pură a
coordonatelor, deci rulează pentru totdeauna în câțiva kiloocteți și nu se repetă niciodată.

Construit ca fundal de ecran de blocare pentru o aplicație de mobilitate de producție; extras pentru că
s-a dovedit a fi acel tip de inginerie amuzantă care merită împărtășit.

## Porniți rapid

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

Sau rulați demonstrația inclusă: `bun run build && bunx serve .` →
[examples/demo.html](examples/demo.html).

## Ce o face interesantă

- **Lume deterministică** — fiecare clasă de drum, bloc, rotatoare și fază de lumină este
  un hash al coordonatelor sale pe grilă. Camera poate zbura oriunde și să se întoarcă;
  nimic nu este stocheaza, nimic nu se deplasează.
- **Trafic onest** — urmărire mașini cu compresie coadă, frânare asimptotică la
  linii de oprire, arcuri de cedare a rotatoarelor, arcuri de cotire conștiente de benzi care nu traversează niciodată
  partea opusă, schimbări de benzi verificate pentru spații, defecțiuni rare în-benzi.
- **Performanță adaptivă** — un micro-benchmark de timp de montare scalează bugetele entității și
  limita DPR la dispozitiv (0,25×–1,2×); o gură de runtime elimină mașinile dacă termicele
  se agravează oricum; un capac de cadru oprește panourile de 120 Hz să nu plătească patru ori pentru o pan lentă.
  `prefers-reduced-motion` renderează un singur cadru static.
- **Testabil prin construcție** — toată aleatorietatea curge printr-un RNG injectat. Suita
  conduce simulări cu semințe și afirmă invarianți reali: luminile nu sunt niciodată
  verzi în ambele sensuri, mașinile nu se suprapun niciodată, rotatoarele nu prind pe nimeni, un soak de 3600 de pași
  rămâne finit și disciplinat în benzi.

## API

| Export | Scop |
| --- | --- |
| `createCityFlythrough(canvas, options)` | Fundalul complet: `start` / `stop` / `setTheme` / `destroy`, plus mânere live `sim` și `sky`. |
| `TrafficSim`, `Sky` | Straturile de simulare, utilizabile fără cap (așa cum le rulează testele). |
| `renderFrame`, `PALETTE_DARK`, `PALETTE_LIGHT` | Renderorul și teme — aduceți-vă propria buclă sau paletă. |
| `roadInfo`, `lightGreen`, `hash`, ... | Funcțiile de lume deterministică, exportate individual. |
| `measurePerfFactor`, `dprCapFor` | Benchmarkul dispozitivului, reutilizabil pentru orice scenă de pânză. |

Opțiuni: `minimal`, `theme` / `palette`, `rng` (scene deterministe) și
`respectReducedMotion`.

## Performance

Măsurat cu [mitata](https://github.com/evanwashere/mitata) pe un Apple M4, Bun 1.3
(`bun run bench`, simulare cu semințe, vizualizare 1280×800):

| Mașini pe ecran | `sim.step` | `renderFrame` (latura JS) |
| --- | --- | --- |
| 40 | 5,5 µs | 74 µs |
| 120 | 19,1 µs | 76 µs |
| 300 | 54,9 µs | 94 µs |

Plus funcțiile mondiale pe care camera se bazează constant: `roadInfo` ≈ 3,6 ns, `hash` ≈ 7,3 ns
per apel — destul de ieftin pentru că nimic nu trebuie să fie pus în cache, care este de ce zboară oriunde și revenind
costă nimic și nu stochează nimic.

**Citiți-le cu sinceritate.** `renderFrame` aici rulează în raport cu un context gol, deci tabelul este *munca noastră*
per-cadru, nu rasterizarea GPU — pe un dispozitiv real rata de umplere domină, și asta este
exact ceea ce capacul DPR există pentru a controla. Triplarea traficului înmulțește costul simulării
cu zece dar greu se mișcă costul desenului, pentru că orașul însuși (drumuri, blocuri, copaci) este cele mai
din cadru. Chiar și la 300 de mașini latura JS a unui cadru este ~0,15 ms în raport cu un buget de 16,7 ms la
60 Hz, deci bugetul adaptiv este acolo pentru GPU-uri slabe și limitarea termică, nu pentru matematică.

## Documentație

- [Simularea](docs/simulation.md) — hashul lumii, modelul traficului și
  anvelopa de performanță trei-straturi.

## De ce am construit asta

La [Ridewolf](https://ridewolf.com) aplicația operatorului avea nevoie de un ecran de blocare care să se simtă
viu fără a expedia active video sau a arde baterii. Un oraș procedural era răspunsul — și undeva între "mașinile ar trebui să se oprească la semafoare" și "intrările trebuie să cedeze inelului", în liniște
a devenit o simulare de trafic cu opinii. Acum servește dublu ca demonstrația noastră preferată a performanței adaptive a pânzei.

## Contribuții

Contribuțiile sunt binevenite — tipuri noi de blocuri, comportamente de vehicule și palete
în special. Vedeți [ghidul de contribuții](https://github.com/Ridewolf/.github/blob/main/CONTRIBUTING.md).
Rulați `bun test`, `bun run lint`, `bun run typecheck` înainte de un PR. Probleme de securitate:
[SECURITY.md](https://github.com/Ridewolf/.github/blob/main/SECURITY.md) — niciodată într-o problemă publică.

## Licență

[MIT](LICENSE) © [Ridewolf](https://ridewolf.com)
