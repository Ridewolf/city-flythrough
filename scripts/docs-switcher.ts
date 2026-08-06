/**
 * Renders the language switcher at the top of every README.
 *
 * The switcher lives inside an HTML block (`<p align="center">`), and markdown is
 * NOT parsed inside one — `[Русский](…)` there renders as literal brackets. So the
 * links have to be real `<a href>` tags, which is exactly the detail a translator
 * or a hand-edit drops. This script owns the block instead: `bun run docs:switcher`
 * rewrites it in all 16 files, `--check` fails when any of them drifted.
 *
 * Translated READMEs under docs/i18n/ are machine-generated, so the generator will
 * happily reintroduce the markdown form on its next run — that is what the
 * pre-commit hook and the CI check are there to catch.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath, not `new URL(...).pathname`: the latter stays percent-encoded, so a
// checkout under `~/My Projects/` would resolve to a `%20` path that does not exist.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const I18N_DIR = join(ROOT, 'docs/i18n');

/** Display order of the switcher. `en` is the canonical README at the repo root. */
const LOCALES = [
  ['en', 'English'],
  ['ru', 'Русский'],
  ['ro', 'Română'],
  ['de', 'Deutsch'],
  ['es', 'Español'],
  ['fr', 'Français'],
  ['it', 'Italiano'],
  ['pt', 'Português'],
  ['uk', 'Українська'],
  ['pl', 'Polski'],
  ['tr', 'Türkçe'],
  ['sv', 'Svenska'],
  ['nl', 'Nederlands'],
  ['el', 'Ελληνικά'],
  ['ar', 'العربية'],
  ['he', 'עברית'],
] as const satisfies ReadonlyArray<readonly [string, string]>;

const OPEN_MARKER = '<!-- docs-i18n:switcher -->';
const CLOSE_MARKER = '<!-- /docs-i18n:switcher -->';

/**
 * The generated region. The markers are the anchor — matching "the first centered
 * `<sub>` line" instead would let this script overwrite any other centered small-text
 * line that happens to come first, which is a silent way to lose content.
 *
 * The body may not contain another open marker. Without that, a stray `${OPEN_MARKER}`
 * above the real block makes the region span from the stray one all the way to the real
 * close marker, and everything in between — prose, the translation notice — is replaced
 * by the switcher and reported as a routine `updated …`. `assertMarkersWellFormed`
 * refuses that file outright; this is the second lock on the same door.
 */
const MARKED_BLOCK = new RegExp(
  `${OPEN_MARKER}\\r?\\n(?:(?!${OPEN_MARKER})[\\s\\S])*?\\r?\\n${CLOSE_MARKER}`,
);

/** Migration fallback for files that predate the markers — see `locateSwitcher`. */
const CENTERED_SUB_LINE = /^<p align="center"><sub>.*<\/sub><\/p>$/gm;

/** The `> 🌐 This is a generated translation…` notice every translated file opens with. */
const TRANSLATION_NOTICE = /^> 🌐 .*$/m;

/** How many locale names a bare line must carry before it counts as a switcher. */
const SWITCHER_LABEL_QUORUM = 3;

/**
 * Windows checkouts have CRLF READMEs (`core.autocrlf=true`, git's default there), and
 * drift is decided by string equality — so a block joined with `\n` would report all 16
 * files as drifted, fail the hook on every commit, and "fix" them into mixed endings
 * that the next checkout reverts. `.gitattributes` pins the repo to LF; this keeps the
 * script honest on a tree that arrived some other way.
 */
const lineEndingOf = (source: string): string => (source.includes('\r\n') ? '\r\n' : '\n');

const countOccurrences = (source: string, marker: string): number =>
  source.split(marker).length - 1;

/**
 * A file may carry at most one intact marker pair. Anything else — a duplicate, an
 * orphan left by a hand-edit or a bad merge — is ambiguous about which span is the
 * generated one, and guessing means deleting whatever sits between the wrong pair.
 * This runs before any span is chosen, and the fix is always the same: delete the stray
 * marker.
 */
const assertMarkersWellFormed = (source: string, locale: string): void => {
  const opens = countOccurrences(source, OPEN_MARKER);
  const closes = countOccurrences(source, CLOSE_MARKER);
  if (opens === closes && opens <= 1) return;

  throw new Error(
    `${displayPath(locale)}: expected one ${OPEN_MARKER} / ${CLOSE_MARKER} pair, found ` +
      `${opens} open and ${closes} close. Remove the stray marker — leaving it would ` +
      'let this script overwrite the content between it and the real block.',
  );
};

const relativePath = (from: string, to: string): string => {
  if (from === 'en') return `docs/i18n/${to}/README.md`;
  return to === 'en' ? '../../../README.md' : `../${to}/README.md`;
};

const switcherFor = (locale: string): string =>
  `<p align="center"><sub>${LOCALES.map(([code, label]) =>
    code === locale ? `<b>${label}</b>` : `<a href="${relativePath(locale, code)}">${label}</a>`,
  ).join(' · ')}</sub></p>`;

const blockFor = (locale: string, eol: string): string =>
  `${OPEN_MARKER}${eol}${switcherFor(locale)}${eol}${CLOSE_MARKER}`;

const readmeFor = (locale: string): string =>
  locale === 'en' ? join(ROOT, 'README.md') : join(I18N_DIR, locale, 'README.md');

/**
 * How a file is named in anything a human reads. Never the absolute path: the pre-commit
 * hook runs this script against a temp copy of the index and deletes it on exit, so an
 * absolute path in an error message points at a directory that is already gone by the
 * time anyone reads it — and the hook deliberately adds no advice of its own, trusting
 * these messages to be the actionable ones.
 */
const displayPath = (locale: string): string => readmeFor(locale).slice(ROOT.length + 1);

/**
 * A centered line is only the switcher if it actually lists languages. Without this,
 * an unrelated `<p align="center"><sub>Sponsored by …</sub></p>` sitting above the
 * switcher would be the first match and get overwritten.
 */
const looksLikeSwitcher = (line: string): boolean =>
  LOCALES.filter(([, label]) => line.includes(label)).length >= SWITCHER_LABEL_QUORUM;

/** The span the generated block should replace, or null when the file has none yet. */
const locateSwitcher = (source: string): { start: number; end: number } | null => {
  const marked = source.match(MARKED_BLOCK);
  if (marked?.index !== undefined) {
    return { start: marked.index, end: marked.index + marked[0].length };
  }

  // Pre-marker files: take the first centered line that reads like a switcher, and
  // the write path wraps it in markers so the next run takes the branch above.
  for (const match of source.matchAll(CENTERED_SUB_LINE)) {
    if (match.index !== undefined && looksLikeSwitcher(match[0])) {
      return { start: match.index, end: match.index + match[0].length };
    }
  }
  return null;
};

/** Replaces the generated block, or inserts one when the file has none yet. */
const applySwitcher = (source: string, locale: string): string => {
  assertMarkersWellFormed(source, locale);

  const eol = lineEndingOf(source);
  const block = blockFor(locale, eol);

  const span = locateSwitcher(source);
  if (span) return source.slice(0, span.start) + block + source.slice(span.end);

  const notice = source.match(TRANSLATION_NOTICE);
  if (notice?.index === undefined) {
    throw new Error(
      `${displayPath(locale)}: no switcher and no translation notice to anchor one to — ` +
        `add a ${OPEN_MARKER} / ${CLOSE_MARKER} pair by hand once, then re-run.`,
    );
  }
  const at = notice.index + notice[0].length;
  return `${source.slice(0, at)}${eol}${eol}${block}${source.slice(at)}`;
};

/**
 * Guards against a locale being added under docs/i18n/ without a label here: the
 * switcher is generated from LOCALES, so an unlisted directory would be a language
 * nobody can navigate to.
 */
const assertLocalesMatchDisk = (): void => {
  const known = new Set<string>(LOCALES.map(([code]) => code));
  const onDisk = readdirSync(I18N_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const untracked = onDisk.filter((code) => !known.has(code));
  if (untracked.length > 0) {
    throw new Error(
      `docs/i18n/ has locales missing from LOCALES in this script: ${untracked.join(', ')}. ` +
        'Add them (code + native label) so they show up in the switcher.',
    );
  }

  const missing = LOCALES.filter(([code]) => code !== 'en' && !existsSync(readmeFor(code)));
  if (missing.length > 0) {
    throw new Error(
      `LOCALES lists locales with no README: ${missing.map(([code]) => code).join(', ')}. ` +
        'Translate them or drop them from the list.',
    );
  }
};

const main = (): void => {
  const check = process.argv.includes('--check');

  assertLocalesMatchDisk();

  const drifted: string[] = [];
  for (const [locale] of LOCALES) {
    const path = readmeFor(locale);
    const source = readFileSync(path, 'utf8');
    const updated = applySwitcher(source, locale);
    if (updated === source) continue;

    const shown = displayPath(locale);

    // One pass has to be enough, checked before anything is written: "I ran the fixer
    // and CI still says it's out of date" is the exact confusion this script exists to
    // prevent. Stray markers are `assertMarkersWellFormed`'s job — it rejects them
    // before a span is chosen, because by the time a mangled file converges here there
    // is nothing left to compare it against.
    if (applySwitcher(updated, locale) !== updated) {
      throw new Error(
        `${shown}: the switcher region did not converge in one pass. Look for a stray ` +
          `${OPEN_MARKER} or ${CLOSE_MARKER} without its pair, remove it, and re-run.`,
      );
    }

    if (check) {
      drifted.push(shown);
    } else {
      writeFileSync(path, updated);
      console.log(`updated ${shown}`);
    }
  }

  if (drifted.length > 0) {
    throw new Error(
      `Language switcher is out of date in:\n${drifted.map((path) => `  ${path}`).join('\n')}\n\n` +
        'Run `bun run docs:switcher` and commit the result.',
    );
  }

  console.log(check ? 'Language switcher is up to date.' : 'Language switcher rendered.');
};

try {
  main();
} catch (error) {
  // These messages are for whoever's commit or CI run just failed — a stack trace
  // through readdirSync tells them nothing they can act on.
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
