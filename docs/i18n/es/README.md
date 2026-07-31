<!-- docs-i18n: generated translation — do not edit by hand.
     locale: es
     source: README.md (a549b5879222938d)
     model: claude-haiku-4.5
     generated: 2026-07-31T15:09:55.035Z
     Edit README.md and re-run `docs-i18n translate` instead. -->

> 🌐 This is a generated translation. The canonical document is [README.md](../../../README.md).

<p align="center"><sub>[English](../../../README.md) · [Русский](../../../docs/i18n/ru/README.md) · [Română](../../../docs/i18n/ro/README.md) · [Deutsch](../../../docs/i18n/de/README.md) · **Español** · [Français](../../../docs/i18n/fr/README.md) · [Italiano](../../../docs/i18n/it/README.md) · [Português](../../../docs/i18n/pt/README.md) · [Українська](../../../docs/i18n/uk/README.md) · [Polski](../../../docs/i18n/pl/README.md) · [Türkçe](../../../docs/i18n/tr/README.md) · [Svenska](../../../docs/i18n/sv/README.md) · [Nederlands](../../../docs/i18n/nl/README.md) · [Ελληνικά](../../../docs/i18n/el/README.md) · [العربية](../../../docs/i18n/ar/README.md) · [עברית](../../../docs/i18n/he/README.md)</sub></p>

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-white.png">
    <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-dark.png" alt="Ridewolf" width="260">
  </picture>
  <h1>@ridewolf/city-flythrough</h1>
  <p>Una ciudad procedural con tráfico vivo, en un lienzo 2D simple.<br>
  Generación de mundo determinista, semáforos y rotondas reales,<br>
  disciplina de carril y rendimiento adaptativo. Sin dependencias.</p>
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

Una cámara se desliza sobre una ciudad infinita. Los caminos tienen anchos y límites de velocidad; los autos se mantienen
en sus carriles, hacen cola en semáforos rojos, ceden en rotondas, planean arcos de giro apropiados,
ocasionalmente se descomponen y atascan un carril. Los bloques son edificios, parques y
plazas. Las nubes se deslizan; muy raramente, un avión cruza. Nada de esto está grabado o
falsificado — es una **micro-simulación real** sobre un mundo que es una función pura de
coordenadas, así que se ejecuta indefinidamente en unos pocos kilobytes y nunca se repite.

Construido como fondo de pantalla de bloqueo para una aplicación de movilidad en producción; extraído porque
resultó ser el tipo de ingeniería divertida que vale la pena compartir.

## Inicio rápido

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

O ejecuta la demostración incluida: `bun run build && bunx serve .` →
[examples/demo.html](examples/demo.html).

## Qué lo hace interesante

- **Mundo determinista** — cada clase de camino, bloque, rotonda y fase de luz es
  un hash de sus coordenadas de cuadrícula. La cámara puede volar a cualquier lugar y volver;
  nada está almacenado, nada se desplaza.
- **Tráfico honesto** — seguimiento de autos con compresión de colas, frenado asintótico a
  líneas de parada, arcos de rendimiento en rotondas, arcos de giro conscientes de carriles que nunca cruzan el
  lado opuesto, cambios de carril verificados por espacios, descomposiciones raras en carril.
- **Rendimiento adaptativo** — un micro-benchmark de tiempo de montaje escala presupuestos de entidades y
  el límite de DPR al dispositivo (0,25×–1,2×); una guardia en tiempo de ejecución descarga autos si la termia
  muerde de todos modos; un límite de fotogramas detiene paneles de 120 Hz de pagar cuádruple por una panorámica lenta.
  `prefers-reduced-motion` renderiza un solo fotograma estático.
- **Comprobable por construcción** — toda aleatoriedad fluye a través de un RNG inyectado. La
  suite ejecuta simulaciones sembradas y aserta invariantes reales: las luces nunca están
  en verde en ambos lados, los autos nunca se superponen, las rotondas nunca atrapan a nadie, un
  baño de 3 600 pasos se mantiene finito y disciplinado en carriles.

## API

| Exportación | Propósito |
| --- | --- |
| `createCityFlythrough(canvas, options)` | El telón de fondo completo: `start` / `stop` / `setTheme` / `destroy`, más mangos `sim` y `sky` en directo. |
| `TrafficSim`, `Sky` | Las capas de simulación, utilizables sin interfaz gráfica (así es como las pruebas las ejecutan). |
| `renderFrame`, `PALETTE_DARK`, `PALETTE_LIGHT` | El renderizador y temas — trae tu propio bucle o paleta. |
| `roadInfo`, `lightGreen`, `hash`, ... | Las funciones del mundo determinista, exportadas individualmente. |
| `measurePerfFactor`, `dprCapFor` | El benchmark del dispositivo, reutilizable para cualquier escena de lienzo. |

Opciones: `minimal`, `theme` / `palette`, `rng` (escenas deterministas), y
`respectReducedMotion`.

## Rendimiento

Medido con [mitata](https://github.com/evanwashere/mitata) en una Apple M4, Bun 1.3
(`bun run bench`, simulación sembrada, puerto de vista de 1280×800):

| Autos en pantalla | `sim.step` | `renderFrame` (lado de JS) |
| --- | --- | --- |
| 40 | 5,5 µs | 74 µs |
| 120 | 19,1 µs | 76 µs |
| 300 | 54,9 µs | 94 µs |

Más las funciones del mundo en las que la cámara se apoya constantemente: `roadInfo` ≈ 3,6 ns, `hash` ≈ 7,3 ns
por llamada — lo bastante económico que nada necesita caché, que es por qué volar a cualquier lugar y volver
no cuesta nada y no almacena nada.

**Lee estos honestamente.** `renderFrame` aquí se ejecuta contra un contexto sin operación, así la tabla es *nuestra*
obra por fotograma, no la rasterización de la GPU — en un dispositivo real el índice de relleno domina, y eso es
exactamente para qué existe el límite de DPR. Triplicar el tráfico multiplica el costo de simulación
por diez pero apenas mueve el costo de dibujo, porque la ciudad misma (caminos, bloques, árboles) es la mayor parte
del fotograma. Incluso en 300 autos el lado JS de un fotograma es ~0,15 ms contra un presupuesto de 16,7 ms en
60 Hz, así el presupuesto adaptativo está ahí para GPUs débiles y estrangulamiento térmico, no para las matemáticas.

## Documentación

- [La simulación](docs/simulation.md) — el hashing del mundo, el modelo de tráfico, y
  la envoltura de rendimiento de tres capas.

## Por qué construimos esto

En [Ridewolf](https://ridewolf.com) la aplicación de operador necesitaba una pantalla de bloqueo que se sintiera
viva sin enviar activos de video ni quemar baterías. Una ciudad procedural fue la
respuesta — y en algún punto entre "los autos deben parar en semáforos" y "los que entran deben
ceder al anillo", se convirtió silenciosamente en una simulación de tráfico con opiniones. Ahora
también sirve como nuestra demostración favorita de rendimiento adaptativo de lienzo.

## Contribuyendo

Se aceptan contribuciones — nuevos tipos de bloques, comportamientos de vehículos y paletas
especialmente. Ve la [guía de contribución](https://github.com/Ridewolf/.github/blob/main/CONTRIBUTING.md).
Ejecuta `bun test`, `bun run lint`, `bun run typecheck` antes de un PR. Problemas de seguridad:
[SECURITY.md](https://github.com/Ridewolf/.github/blob/main/SECURITY.md) — nunca en un tema público.

## Licencia

[MIT](LICENSE) © [Ridewolf](https://ridewolf.com)
