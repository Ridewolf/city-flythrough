<!-- docs-i18n: generated translation — do not edit by hand.
     locale: fr
     source: README.md (a549b5879222938d)
     model: claude-haiku-4.5
     generated: 2026-07-31T15:09:55.035Z
     Edit README.md and re-run `docs-i18n translate` instead. -->

> 🌐 This is a generated translation. The canonical document is [README.md](../../../README.md).

<!-- docs-i18n:switcher -->
<p align="center"><sub><a href="../../../README.md">English</a> · <a href="../ru/README.md">Русский</a> · <a href="../ro/README.md">Română</a> · <a href="../de/README.md">Deutsch</a> · <a href="../es/README.md">Español</a> · <b>Français</b> · <a href="../it/README.md">Italiano</a> · <a href="../pt/README.md">Português</a> · <a href="../uk/README.md">Українська</a> · <a href="../pl/README.md">Polski</a> · <a href="../tr/README.md">Türkçe</a> · <a href="../sv/README.md">Svenska</a> · <a href="../nl/README.md">Nederlands</a> · <a href="../el/README.md">Ελληνικά</a> · <a href="../ar/README.md">العربية</a> · <a href="../he/README.md">עברית</a></sub></p>
<!-- /docs-i18n:switcher -->

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-white.png">
    <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-dark.png" alt="Ridewolf" width="260">
  </picture>
  <h1>@ridewolf/city-flythrough</h1>
  <p>Une ville procédurale avec un trafic vivant, sur un canevas 2D simple.<br>
  Génération de monde déterministe, vrais feux de circulation et carrefours giratoires,<br>
  discipline des voies et performance adaptative. Zéro dépendances.</p>
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

Une caméra dérive au-dessus d'une ville sans fin. Les routes ont des largeurs et des
limites de vitesse ; les voitures restent dans leurs voies, font la queue aux feux
rouges, cèdent aux carrefours giratoires, planifient les arcs de virage appropriés,
se décomposent occasionnellement et bloquent une voie. Les blocs sont des bâtiments,
des parcs et des places. Les nuages ​​dérivent ; très rarement, un avion traverse.
Rien n'est enregistré ou simulé — c'est une **véritable micro-simulation** sur un
monde qui est une fonction pure des coordonnées, de sorte qu'il s'exécute indéfiniment
en quelques kilooctets et ne se répète jamais.

Construit comme fond d'écran de verrouillage pour une application de mobilité en
production ; extrait car il s'avère être le type intéressant d'ingénierie qui vaut la peine d'être partagé.

## Démarrage rapide

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

Ou exécutez la démo groupée : `bun run build && bunx serve .` →
[examples/demo.html](examples/demo.html).

## Ce qui le rend intéressant

- **Monde déterministe** — chaque classe de route, bloc, carrefour giratoire et phase
  de feu est un hash de ses coordonnées de grille. La caméra peut voler n'importe où
  et revenir ; rien n'est stocké, rien ne dérasse.
- **Trafic honnête** — suivi des voitures avec compression des files d'attente, freinage
  asymptotique aux lignes d'arrêt, arcs de cession de carrefour giratoire, arcs de virage
  conscients des voies qui ne traversent jamais le côté opposé, changements de voie vérifiés
  par écart, pannes en voie rarement.
- **Performance adaptative** — un micro-benchmark au moment du montage met à l'échelle les
  budgets d'entités et le plafond DPR sur l'appareil (0,25×–1,2×) ; un garde d'exécution
  supprime les voitures si le thermique mord de toute façon ; un plafond d'image empêche
  les panneaux 120 Hz de payer quatre fois pour un panoramique lent. `prefers-reduced-motion` rend un
  seul cadre statique.
- **Testable par construction** — tous les aléas transitent par un RNG injecté. La suite
  conduit des simulations avec graine et affirme les vrais invariants : les lumières ne
  sont jamais vertes des deux côtés, les voitures ne se chevauchent jamais, les carrefours
  giratoires ne piègent jamais personne, un trempage de 3 600 pas reste fini et discipliné
  en voie.

## API

| Export | Objectif |
| --- | --- |
| `createCityFlythrough(canvas, options)` | Le fond d'écran complet : `start` / `stop` / `setTheme` / `destroy`, plus les poignées `sim` et `sky` en direct. |
| `TrafficSim`, `Sky` | Les couches de simulation, utilisables sans tête (c'est ainsi que les tests les exécutent). |
| `renderFrame`, `PALETTE_DARK`, `PALETTE_LIGHT` | Le moteur de rendu et les thèmes — apportez votre propre boucle ou palette. |
| `roadInfo`, `lightGreen`, `hash`, ... | Les fonctions du monde déterministe, exportées individuellement. |
| `measurePerfFactor`, `dprCapFor` | L'indice de référence de l'appareil, réutilisable pour n'importe quelle scène de canevas. |

Options : `minimal`, `theme` / `palette`, `rng` (scènes déterministes), et
`respectReducedMotion`.

## Performance

Mesuré avec [mitata](https://github.com/evanwashere/mitata) sur un Apple M4, Bun 1.3
(`bun run bench`, simulation avec graine, viewport 1280×800) :

| Voitures à l'écran | `sim.step` | `renderFrame` (côté JS) |
| --- | --- | --- |
| 40 | 5,5 µs | 74 µs |
| 120 | 19,1 µs | 76 µs |
| 300 | 54,9 µs | 94 µs |

Plus les fonctions du monde sur lesquelles la caméra s'appuie constamment :
`roadInfo` ≈ 3,6 ns, `hash` ≈ 7,3 ns par appel — assez bon marché pour que rien n'ait
besoin de mise en cache, ce qui est pourquoi voler n'importe où et revenir ne coûte rien
et ne stocke rien.

**Lisez ceux-ci honnêtement.** `renderFrame` ici s'exécute contre un contexte sans opération,
donc le tableau est *notre* travail par image, pas la rastérisation du GPU — sur un
appareil réel le taux de remplissage domine, et c'est exactement ce que le plafond DPR existe
pour contrôler. Tripler le trafic multiplie le coût de la simulation par dix mais déplace à
peine le coût du dessin, car la ville elle-même (routes, blocs, arbres) est la plupart de l'image.
Même à 300 voitures, le côté JS d'une image est ~0,15 ms par rapport à un budget de 16,7 ms à 60 Hz,
donc le budget adaptatif est là pour les GPU faibles et l'accélération thermique, pas pour les mathématiques.

## Documentation

- [La simulation](docs/simulation.md) — le hachage du monde, le modèle de trafic et
  l'enveloppe de performance à trois couches.

## Pourquoi nous l'avons construit

Chez [Ridewolf](https://ridewolf.com) l'application de l'opérateur avait besoin d'un
écran de verrouillage qui semblait vivant sans expédier d'éléments vidéo ni brûler de
batterie. Une ville procédurale était la réponse — et quelque part entre « les voitures
doivent s'arrêter aux feux » et « les entrants doivent céder à la bague », c'est
tranquillement devenu une simulation de trafic avec des opinions. Il double maintenant comme
notre démo préférée de la performance du canevas adaptatif.

## Contribution

Les contributions sont bienvenues — les nouveaux types de blocs, les comportements des
véhicules et les palettes surtout. Voir le [guide de contribution](https://github.com/Ridewolf/.github/blob/main/CONTRIBUTING.md).
Exécutez `bun test`, `bun run lint`, `bun run typecheck` avant un PR. Problèmes de sécurité :
[SECURITY.md](https://github.com/Ridewolf/.github/blob/main/SECURITY.md) — jamais dans un problème public.

## Licence

[MIT](LICENSE) © [Ridewolf](https://ridewolf.com)
