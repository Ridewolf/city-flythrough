<!-- docs-i18n: generated translation — do not edit by hand.
     locale: tr
     source: README.md (a549b5879222938d)
     model: claude-haiku-4.5
     generated: 2026-07-31T15:09:55.037Z
     Edit README.md and re-run `docs-i18n translate` instead. -->

> 🌐 This is a generated translation. The canonical document is [README.md](../../../README.md).

<p align="center"><sub>[English](../../../README.md) · [Русский](../../../docs/i18n/ru/README.md) · [Română](../../../docs/i18n/ro/README.md) · [Deutsch](../../../docs/i18n/de/README.md) · [Español](../../../docs/i18n/es/README.md) · [Français](../../../docs/i18n/fr/README.md) · [Italiano](../../../docs/i18n/it/README.md) · [Português](../../../docs/i18n/pt/README.md) · [Українська](../../../docs/i18n/uk/README.md) · [Polski](../../../docs/i18n/pl/README.md) · **Türkçe** · [Svenska](../../../docs/i18n/sv/README.md) · [Nederlands](../../../docs/i18n/nl/README.md) · [Ελληνικά](../../../docs/i18n/el/README.md) · [العربية](../../../docs/i18n/ar/README.md) · [עברית](../../../docs/i18n/he/README.md)</sub></p>

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-white.png">
    <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-dark.png" alt="Ridewolf" width="260">
  </picture>
  <h1>@ridewolf/city-flythrough</h1>
  <p>Canlı trafik içeren prosedürel şehir, düz 2D tuval üzerinde.<br>
  Belirleyici dünya üretimi, gerçek trafik ışıkları ve dönerişler,<br>
  şerit disiplini ve uyarlanabilir performans. Sıfır bağımlılık.</p>
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

Bir kamera sonsuz bir şehrin üzerinde sürüklenir. Yolların genişlikleri ve hız sınırları vardır; arabalar şeritlerini korurlar, kırmızı ışıklarda kuyruk oluştururlar, dönerişlerde yol verirler, uygun dönüş yaylarını planlarlar, ara sıra bozulurlar ve bir şeridi tıkarlar. Bloklar binalar, parklar ve meydanlardır. Bulutlar sürüklenir; çok nadiren bir uçak geçer. Hiçbiri kaydedilmemiş veya sahte değildir — bu, koordinatların saf bir işlevi olan dünya üzerinde **gerçek mikro-simülasyon** ve birkaç kilobaytlı çalışır ve asla tekrar etmez.

Bir üretim hareketlilik uygulaması için kilitli ekran arka planı olarak inşa edilmiştir; paylaşmaya değer eğlenceli mühendislik çıktığı için çıkartılmıştır.

## Hızlı Başlangıç

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

Veya paketlenmiş demoyu çalıştırın: `bun run build && bunx serve .` →
[examples/demo.html](examples/demo.html).

## Ne onu ilginç kılıyor

- **Belirleyici dünya** — her yol sınıfı, blok, dönerişi ve ışık fazı ızgaralı koordinatının bir karmasıdır. Kamera herhangi bir yere uçabilir ve geri dönebilir; hiçbir şey depolanmaz, hiçbir şey sürüklenmez.
- **Dürüst trafik** — kuyruk sıkıştırması ile araba izlemesi, durma çizgilerine asimptotik frenlemesi, dönerişi yol verme yayları, hiçbir zaman karşı tarafa geçmeyen şerit farkında dönüş yayları, boşluk kontrollü şerit değişimleri, nadir şerit içi bozulmalar.
- **Uyarlanabilir performans** — bağlama süresi mikro karşılaştırması varlık bütçelerini ve DPR başlığını cihaza ölçeklendirir (0.25×–1.2×); çalışma zamanı koruması herhangi bir şekilde termaller ısırırsa arabalar çıkarır; çevre başlığı 120 Hz panellerini yavaş bir kaydırma için dörtlü ödeme yapmasından durduruyor. `prefers-reduced-motion` tek bir statik çerçeve oluşturur.
- **İnşa gereği test edilebilir** — tüm rastgelelik enjekte edilmiş RNG'nin aracılığıyla akar. Paket, tohum simülasyonlarını sürür ve gerçek değişmezleri sağlar: ışıklar hiçbir zaman her iki yolda da yeşil değildir, arabalar asla çakışmaz, dönerişler kimseyi asla tuzağa düşürmez, 3 600 adımlı ıslak kalan sınırlandırılmış ve şerit disiplinlidir.

## API

| Export | Purpose |
| --- | --- |
| `createCityFlythrough(canvas, options)` | Tam arka planı: `start` / `stop` / `setTheme` / `destroy`, artı canlı `sim` ve `sky` tutamakları. |
| `TrafficSim`, `Sky` | Simülasyon katmanları, başsız kullanılabilir (testlerin nasıl çalıştığı budur). |
| `renderFrame`, `PALETTE_DARK`, `PALETTE_LIGHT` | İşleyici ve temalar — kendi döngünüzü veya paletinizi getirin. |
| `roadInfo`, `lightGreen`, `hash`, ... | Belirleyici dünya işlevleri, ayrı ayrı dışa aktarılmış. |
| `measurePerfFactor`, `dprCapFor` | Cihaz kıyası, herhangi bir tuval sahne için yeniden kullanılabilir. |

Seçenekler: `minimal`, `theme` / `palette`, `rng` (belirleyici sahneler) ve
`respectReducedMotion`.

## Performans

[mitata](https://github.com/evanwashere/mitata) ile Apple M4, Bun 1.3 üzerinde ölçülmüştür (`bun run bench`, tohum simülasyonu, 1280×800 görüş):

| Cars on screen | `sim.step` | `renderFrame` (JS side) |
| --- | --- | --- |
| 40 | 5.5 µs | 74 µs |
| 120 | 19.1 µs | 76 µs |
| 300 | 54.9 µs | 94 µs |

Artı kamera sürekli yaslanacak dünya işlevleri: `roadInfo` ≈ 3.6 ns, `hash` ≈ 7.3 ns
çağrı başına — hiçbir şeyin önbelleğe alınması gerekmeyecek kadar ucuz, bu yüzden herhangi bir yere ve geri dönmek hiçbir şey maliyeti olmaz ve hiçbir şey depolar.

**Bunları dürüstçe okuyun.** `renderFrame` burada no-op bağlamında çalışır, bu nedenle tablo *bizim* çerçeve başına çalışmamızdır, GPU'nun rasterizasyonu değil — gerçek bir cihazda dolgu oranı hakimdir ve tam olarak DPR başlığının kontrol ettiği şeydir. Trafiği üçe katlamak simülasyon maliyetini on katına çarpar ancak çizim maliyetini zar zor hareket ettirir, çünkü şehrin kendisi (yollar, bloklar, ağaçlar) çerçevenin çoğudur. 300 arabada bile bir çerçevenin JS tarafı 60 Hz'te 16.7 ms bütçesine karşı ~0.15 ms, bu nedenle uyarlanabilir bütçe zayıf GPU'lar ve termal azaltma içindir, matematiksel değil.

## Belgeler

- [Simülasyon](docs/simulation.md) — dünya karmalaştırması, trafik modeli ve
  üç katmanlı performans zarfı.

## Neden inşa ettik

[Ridewolf](https://ridewolf.com) adresinde işletmeci uygulama, video varlıkları göndermeden veya pilineri yakamadan canlı hissettiren kilitli bir ekran gerekiyordu. Prosedürel bir şehir cevabıydı — ve "arabalar ışıklarda durmalı" ile "girişçiler halkanın vermeleri gerekir" arasında bir yerde sessizce fikri olan bir trafik simülasyonu haline geldi. Artık uyarlanabilir tuval performansı hakkında en sevdiğimiz demonun iki katını yaptı.

## Katkıda Bulunma

Katkılar hoş geldiniz — özellikle yeni blok türleri, araç davranışları ve paletler. [Katkı rehberine](https://github.com/Ridewolf/.github/blob/main/CONTRIBUTING.md) bakın.
PR'dan önce `bun test`, `bun run lint`, `bun run typecheck` çalıştırın. Güvenlik sorunları:
[SECURITY.md](https://github.com/Ridewolf/.github/blob/main/SECURITY.md) — asla halka açık bir sorununda.

## Lisans

[MIT](LICENSE) © [Ridewolf](https://ridewolf.com)
