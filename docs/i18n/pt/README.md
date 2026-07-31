<!-- docs-i18n: generated translation — do not edit by hand.
     locale: pt
     source: README.md (a549b5879222938d)
     model: claude-haiku-4.5
     generated: 2026-07-31T15:09:55.036Z
     Edit README.md and re-run `docs-i18n translate` instead. -->

> 🌐 This is a generated translation. The canonical document is [README.md](../../../README.md).

<p align="center"><sub>[English](../../../README.md) · [Русский](../../../docs/i18n/ru/README.md) · [Română](../../../docs/i18n/ro/README.md) · [Deutsch](../../../docs/i18n/de/README.md) · [Español](../../../docs/i18n/es/README.md) · [Français](../../../docs/i18n/fr/README.md) · [Italiano](../../../docs/i18n/it/README.md) · **Português** · [Українська](../../../docs/i18n/uk/README.md) · [Polski](../../../docs/i18n/pl/README.md) · [Türkçe](../../../docs/i18n/tr/README.md) · [Svenska](../../../docs/i18n/sv/README.md) · [Nederlands](../../../docs/i18n/nl/README.md) · [Ελληνικά](../../../docs/i18n/el/README.md) · [العربية](../../../docs/i18n/ar/README.md) · [עברית](../../../docs/i18n/he/README.md)</sub></p>

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-white.png">
    <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-dark.png" alt="Ridewolf" width="260">
  </picture>
  <h1>@ridewolf/city-flythrough</h1>
  <p>Uma cidade procedural com trânsito vivo, em uma tela 2D simples.<br>
  Geração de mundo determinística, semáforos e rotatórios reais,<br>
  disciplina de faixa e desempenho adaptável. Sem dependências.</p>
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

Uma câmera flutua sobre uma cidade infinita. Estradas têm larguras e limites de velocidade; carros mantêm
suas faixas, fazem fila em semáforos vermelhos, cedem em rotatórios, planejam arcos de curva apropriados,
ocasionalmente travam e congestionam uma faixa. Blocos são edifícios, parques e
praças. Nuvens flutuam; raramente, um avião cruza. Nada disso é gravado ou
falsificado — é uma **micro-simulação real** sobre um mundo que é uma função pura de
coordenadas, então funciona para sempre em alguns kilobytes e nunca se repete.

Construído como um pano de fundo de tela de bloqueio para um aplicativo de mobilidade em produção; extraído porque
se mostrou ser o tipo divertido de engenharia que vale a pena compartilhar.

## Início Rápido

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

Ou execute a demonstração incluída: `bun run build && bunx serve .` →
[examples/demo.html](examples/demo.html).

## O que torna interessante

- **Mundo determinístico** — cada classe de estrada, bloco, rotatório e fase de luz é
  um hash de suas coordenadas de grade. A câmera pode voar para qualquer lugar e voltar;
  nada é armazenado, nada flutua.
- **Trânsito honesto** — seguimento de carro com compressão de fila, frenagem assintótica para
  linhas de parada, arcos de cedência de rotatório, arcos de curva cientes de faixa que nunca cruzam o
  lado oposto, mudanças de faixa verificadas por espaço, travamentos raros em faixa.
- **Desempenho adaptável** — um micro-benchmark em tempo de montagem escala orçamentos de entidade e
  o limite de DPR para o dispositivo (0,25×–1,2×); um guarda de tempo de execução elimina carros se o térmica
  morder mesmo assim; um limite de quadro interrompe painéis de 120 Hz de pagarem quatro vezes por uma panorâmica lenta.
  `prefers-reduced-motion` renderiza um único quadro estático.
- **Testável por construção** — toda aleatoriedade flui por um RNG injetado. O
  suite executa simulações com seed e afirma invariantes reais: luzes nunca são
  verdes nos dois sentidos, carros nunca se sobrepõem, rotatórios nunca prendem ninguém, um soak
  de 3.600 passos permanece finito e disciplinado em faixa.

## API

| Exportação | Propósito |
| --- | --- |
| `createCityFlythrough(canvas, options)` | O pano de fundo completo: `start` / `stop` / `setTheme` / `destroy`, mais os handles `sim` e `sky` ao vivo. |
| `TrafficSim`, `Sky` | As camadas de simulação, usáveis sem cabeça (é assim que os testes as executam). |
| `renderFrame`, `PALETTE_DARK`, `PALETTE_LIGHT` | O renderizador e temas — traga seu próprio loop ou paleta. |
| `roadInfo`, `lightGreen`, `hash`, ... | As funções de mundo determinístico, exportadas individualmente. |
| `measurePerfFactor`, `dprCapFor` | O benchmark do dispositivo, reutilizável para qualquer cena de tela. |

Opções: `minimal`, `theme` / `palette`, `rng` (cenas determinísticas), e
`respectReducedMotion`.

## Desempenho

Medido com [mitata](https://github.com/evanwashere/mitata) em um Apple M4, Bun 1.3
(`bun run bench`, simulação com seed, viewport de 1280×800):

| Carros na tela | `sim.step` | `renderFrame` (lado JS) |
| --- | --- | --- |
| 40 | 5.5 µs | 74 µs |
| 120 | 19.1 µs | 76 µs |
| 300 | 54.9 µs | 94 µs |

Mais as funções de mundo que a câmera usa constantemente: `roadInfo` ≈ 3,6 ns, `hash` ≈ 7,3 ns
por chamada — barato o suficiente para que nada precise de cache, é por isso que voar para qualquer lugar e voltar
não custa nada e não armazena nada.

**Leia estas honestamente.** `renderFrame` aqui é executado em um contexto sem operação, portanto a tabela é *nosso*
trabalho por quadro, não a rasterização da GPU — em um dispositivo real a taxa de preenchimento domina, e é
exatamente para o que o limite de DPR existe. Triplicar o trânsito multiplica o custo de simulação
por dez mas mal move o custo de desenho, porque a cidade em si (estradas, blocos, árvores) é a maior parte
do quadro. Mesmo em 300 carros, o lado JS de um quadro é ~0,15 ms em relação a um orçamento de 16,7 ms em
60 Hz, então o orçamento adaptável está ali para GPUs fracas e aceleração térmica, não para a matemática.

## Documentação

- [A simulação](docs/simulation.md) — o hash do mundo, o modelo de trânsito, e
  o envelope de desempenho em três camadas.

## Por que construímos isso

Na [Ridewolf](https://ridewolf.com) o aplicativo do operador precisava de uma tela de bloqueio que se sentisse
viva sem enviar ativos de vídeo ou queimar baterias. Uma cidade procedural foi a
resposta — e em algum lugar entre "carros devem parar em semáforos" e "participantes devem
ceder ao anel", ela silenciosamente se tornou uma simulação de trânsito com opiniões. Agora
também funciona como nossa demonstração favorita de desempenho de tela adaptável.

## Contribuindo

Contribuições bem-vindas — novos tipos de bloco, comportamentos de veículos e paletas
especialmente. Veja o [guia de contribuição](https://github.com/Ridewolf/.github/blob/main/CONTRIBUTING.md).
Execute `bun test`, `bun run lint`, `bun run typecheck` antes de um PR. Problemas de segurança:
[SECURITY.md](https://github.com/Ridewolf/.github/blob/main/SECURITY.md) — nunca em um problema público.

## Licença

[MIT](LICENSE) © [Ridewolf](https://ridewolf.com)
