<!-- docs-i18n: generated translation — do not edit by hand.
     locale: it
     source: README.md (a549b5879222938d)
     model: claude-haiku-4.5
     generated: 2026-07-31T15:09:55.036Z
     Edit README.md and re-run `docs-i18n translate` instead. -->

> 🌐 This is a generated translation. The canonical document is [README.md](../../../README.md).

<!-- docs-i18n:switcher -->
<p align="center"><sub><a href="../../../README.md">English</a> · <a href="../ru/README.md">Русский</a> · <a href="../ro/README.md">Română</a> · <a href="../de/README.md">Deutsch</a> · <a href="../es/README.md">Español</a> · <a href="../fr/README.md">Français</a> · <b>Italiano</b> · <a href="../pt/README.md">Português</a> · <a href="../uk/README.md">Українська</a> · <a href="../pl/README.md">Polski</a> · <a href="../tr/README.md">Türkçe</a> · <a href="../sv/README.md">Svenska</a> · <a href="../nl/README.md">Nederlands</a> · <a href="../el/README.md">Ελληνικά</a> · <a href="../ar/README.md">العربية</a> · <a href="../he/README.md">עברית</a></sub></p>
<!-- /docs-i18n:switcher -->

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-white.png">
    <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-dark.png" alt="Ridewolf" width="260">
  </picture>
  <h1>@ridewolf/city-flythrough</h1>
  <p>Una città procedurale con traffico vivo, su una tela 2D semplice.<br>
  Generazione del mondo deterministica, semafori reali e rotatorie,<br>
  disciplina di corsia e prestazioni adattive. Nessuna dipendenza.</p>
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

Una telecamera si sposta sopra una città infinita. Le strade hanno larghezze e limiti di velocità; le auto mantengono la loro corsia, fanno coda ai semafori rossi, cedono il passo alle rotatorie, pianificano archi di virata corretti, occasionalmente si rompono e bloccano una corsia. I blocchi sono edifici, parchi e piazze. Le nuvole si spostano; molto raramente un aereo attraversa. Niente di tutto questo è registrato o falso — è una **micro-simulazione reale** su un mondo che è una funzione pura delle coordinate, quindi funziona per sempre in pochi kilobyte e mai si ripete.

Costruita come sfondo della schermata di blocco per un'app di mobilità di produzione; estratta perché si è rivelata il tipo di ingegneria divertente che vale la pena condividere.

## Avvio rapido

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

Oppure esegui la demo inclusa: `bun run build && bunx serve .` → [examples/demo.html](examples/demo.html).

## Cosa la rende interessante

- **Mondo deterministica** — ogni classe di strada, blocco, rotatoria e fase di luce è un hash delle coordinate della sua griglia. La telecamera può volare ovunque e tornare; niente è archiviato, niente si sposta.
- **Traffico onesto** — car following con compressione della coda, frenata asintotica alle linee di stop, archi di cedimento in rotatoria, archi di virata consapevoli della corsia che non attraversano mai il lato opposto, cambio di corsia controllato dal divario, rari guasti in corsia.
- **Prestazioni adattive** — un micro-benchmark al momento del montaggio ridimensiona i budget di entità e il limite DPR al dispositivo (0,25×–1,2×); una guardia di runtime elimina le auto se i carichi termici mordono comunque; un limite di frame impedisce ai pannelli 120 Hz di pagare il quadruplo per una pan lenta. `prefers-reduced-motion` renderizza un singolo frame statico.
- **Testabile per costruzione** — tutta la casualità scorre attraverso un RNG iniettato. La suite aziona simulazioni seminate e asserisce invarianti reali: i semafori non sono mai verdi in entrambi i sensi, le auto non si sovrappongono mai, le rotatorie non intrappolano mai nessuno, un soak di 3.600 step rimane finito e disciplinato sulla corsia.

## API

| Esportazione | Scopo |
| --- | --- |
| `createCityFlythrough(canvas, options)` | Lo sfondo completo: `start` / `stop` / `setTheme` / `destroy`, più gli handle `sim` e `sky` vivi. |
| `TrafficSim`, `Sky` | I livelli di simulazione, utilizzabili senza interfaccia (così come vengono eseguiti i test). |
| `renderFrame`, `PALETTE_DARK`, `PALETTE_LIGHT` | Il renderer e i temi — porta il tuo ciclo o la tua tavolozza. |
| `roadInfo`, `lightGreen`, `hash`, ... | Le funzioni del mondo deterministico, esportate individualmente. |
| `measurePerfFactor`, `dprCapFor` | Il benchmark del dispositivo, riutilizzabile per qualsiasi scena su canvas. |

Opzioni: `minimal`, `theme` / `palette`, `rng` (scene deterministiche), e
`respectReducedMotion`.

## Prestazioni

Misurato con [mitata](https://github.com/evanwashere/mitata) su Apple M4, Bun 1.3 (`bun run bench`, simulazione seminata, viewport 1280×800):

| Auto sullo schermo | `sim.step` | `renderFrame` (lato JS) |
| --- | --- | --- |
| 40 | 5,5 µs | 74 µs |
| 120 | 19,1 µs | 76 µs |
| 300 | 54,9 µs | 94 µs |

Più le funzioni del mondo su cui la telecamera fa leva costantemente: `roadInfo` ≈ 3,6 ns, `hash` ≈ 7,3 ns
per chiamata — abbastanza economico che niente ha bisogno di cache, è per questo che volare ovunque e tornare non costa niente e non memorizza niente.

**Leggi questi onestamente.** `renderFrame` qui viene eseguito contro un contesto no-op, quindi la tabella è *il nostro* lavoro per frame, non la rasterizzazione della GPU — su un dispositivo reale il fill rate domina, ed è esattamente per questo che il limite DPR esiste per controllare. Triplicare il traffico moltiplica il costo della simulazione per dieci ma quasi non sposta il costo del disegno, perché la città stessa (strade, blocchi, alberi) è la maggior parte del frame. Anche a 300 auto il lato JS di un frame è ~0,15 ms rispetto a un budget di 16,7 ms a 60 Hz, quindi il budget adattivo è lì per GPU deboli e thermal throttling, non per la matematica.

## Documentazione

- [La simulazione](docs/simulation.md) — l'hashing del mondo, il modello del traffico, e l'enveloppe di prestazioni a tre livelli.

## Perché abbiamo costruito questo

Su [Ridewolf](https://ridewolf.com) l'app dell'operatore aveva bisogno di una schermata di blocco che sembrasse viva senza spedire risorse video o consumare batterie. Una città procedurale era la risposta — e da qualche parte tra "le auto dovrebbero fermarsi ai semafori" e "gli ingressi devono cedere al ring", è diventata tranquillamente una simulazione del traffico con opinioni. Ora raddoppia come la nostra demo preferita delle prestazioni adattive del canvas.

## Contribuire

Contributi benvenuti — nuovi tipi di blocchi, comportamenti dei veicoli e tavolozze specialmente. Vedi la [guida ai contributi](https://github.com/Ridewolf/.github/blob/main/CONTRIBUTING.md).
Esegui `bun test`, `bun run lint`, `bun run typecheck` prima di un PR. Problemi di sicurezza:
[SECURITY.md](https://github.com/Ridewolf/.github/blob/main/SECURITY.md) — mai in un problema pubblico.

## Licenza

[MIT](LICENSE) © [Ridewolf](https://ridewolf.com)
