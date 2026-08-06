/**
 * Points git at .githooks, run from the `prepare` lifecycle script.
 *
 * TypeScript rather than the shell script this started as: `prepare` runs outside Git
 * Bash on Windows, where `sh` is generally not on PATH — so `sh scripts/install-hooks.sh`
 * fails before any of its own never-fail handling can run, and `bun install` reports a
 * broken package. Bun is the one interpreter this repo already requires everywhere.
 *
 * It refuses to take over a checkout that already has hooks, in either of the two shapes
 * they come in — an explicit core.hooksPath (husky v5+, lefthook, a personal global hooks
 * directory) or files sitting in .git/hooks (husky v4, pre-commit, gitleaks, IDEs, git
 * init templates). Setting core.hooksPath replaces .git/hooks wholesale, so both would be
 * silently switched off on every `bun install`.
 *
 * Nothing here may fail the install. Installing a hook is a convenience; a read-only
 * .git or a checkout without one is not a reason to fail dependency installation, and
 * a non-zero `prepare` reads as a broken package rather than a missing hook. Every exit
 * from this file, including the unexpected ones, is exit 0.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

const HOOKS_PATH = '.githooks';

/** Non-zero exit, a missing git, and a git that died on a signal all read as "no". */
const git = (...args: string[]): { ok: boolean; stdout: string } => {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  return { ok: result.status === 0, stdout: (result.stdout ?? '').trim() };
};

const warn = (...lines: string[]): void => {
  for (const line of lines) console.error(line);
};

const main = (): void => {
  // Not every install happens in a git checkout — a downloaded zip has no work tree and
  // nothing to hook.
  if (!git('rev-parse', '--is-inside-work-tree').ok) return;

  const configured = git('config', 'core.hooksPath');
  const current = configured.ok ? configured.stdout : '';

  // Already ours — nothing to do. This has to come before the .git/hooks probe below:
  // `git rev-parse --git-path hooks` resolves *through* core.hooksPath, so once we are
  // installed it reports our own directory, and every later `bun install` would mistake
  // our pre-commit for a stranger's and print a warning about it.
  if (current === HOOKS_PATH) return;

  if (current !== '') {
    warn(
      `install-hooks: core.hooksPath is already "${current}" — leaving it as it is.`,
      '  The README language-switcher check lives in .githooks/pre-commit. Wire it into',
      '  your hook manager, or run `bun run docs:switcher:check` before committing.',
    );
    return;
  }

  // The .sample files ship with every `git init` and are inert; anything else in there is
  // a hook somebody installed on purpose, and pointing core.hooksPath elsewhere would
  // disable it without a word.
  const hooksDir = git('rev-parse', '--git-path', 'hooks');
  if (hooksDir.ok && hooksDir.stdout !== '' && existsSync(hooksDir.stdout)) {
    const installed = readdirSync(hooksDir.stdout).filter((name) => !name.endsWith('.sample'));
    if (installed.length > 0) {
      warn(
        `install-hooks: "${hooksDir.stdout}" already contains hooks — leaving them in place.`,
        '  Setting core.hooksPath would disable every one of them. The README',
        '  language-switcher check lives in .githooks/pre-commit: call it from your hook,',
        '  or run `bun run docs:switcher:check` yourself.',
      );
      return;
    }
  }

  if (!git('config', 'core.hooksPath', HOOKS_PATH).ok) {
    warn(
      'install-hooks: could not set core.hooksPath — skipping the pre-commit hook.',
      '  Run `bun run docs:switcher:check` before committing; CI runs it too.',
    );
  }
};

try {
  main();
} catch (error) {
  // An unreadable .git/hooks, a git that is not there at all — same rule as every
  // handled path above: say so, install fine.
  warn(
    `install-hooks: ${error instanceof Error ? error.message : error} — skipping the hook.`,
    '  Run `bun run docs:switcher:check` before committing; CI runs it too.',
  );
}
