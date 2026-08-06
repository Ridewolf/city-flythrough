#!/bin/sh
# Points git at .githooks, run from the `prepare` lifecycle script.
#
# It refuses to take over a checkout that already has hooks, in either of the two shapes
# they come in — an explicit core.hooksPath (husky v5+, lefthook, a personal global hooks
# directory) or files sitting in .git/hooks (husky v4, pre-commit, gitleaks, IDEs, git
# init templates). Setting core.hooksPath replaces .git/hooks wholesale, so both would be
# silently switched off on every `bun install`.
#
# Nothing here may fail the install. Installing a hook is a convenience; a read-only
# .git or a checkout without one is not a reason to fail dependency installation, and
# a non-zero `prepare` reads as a broken package rather than a missing hook.

# Not every install happens in a git checkout — a downloaded zip has no work tree and
# nothing to hook.
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

current=$(git config core.hooksPath 2>/dev/null || true)

# Already ours — nothing to do. This has to come before the .git/hooks probe below:
# `git rev-parse --git-path hooks` resolves *through* core.hooksPath, so once we are
# installed it reports our own directory, and every later `bun install` would mistake
# our pre-commit for a stranger's and print a warning about it.
if [ "$current" = ".githooks" ]; then
  exit 0
fi

if [ -n "$current" ]; then
  echo "install-hooks: core.hooksPath is already \"$current\" — leaving it as it is." >&2
  echo "  The README language-switcher check lives in .githooks/pre-commit. Wire it into" >&2
  echo "  your hook manager, or run \`bun run docs:switcher:check\` before committing." >&2
  exit 0
fi

# The .sample files ship with every `git init` and are inert; anything else in there is a
# hook somebody installed on purpose, and pointing core.hooksPath elsewhere would disable
# it without a word.
hooks_dir=$(git rev-parse --git-path hooks 2>/dev/null || true)

if [ -n "$hooks_dir" ] && ls "$hooks_dir" 2>/dev/null | grep -qv '\.sample$'; then
  echo "install-hooks: \"$hooks_dir\" already contains hooks — leaving them in place." >&2
  echo "  Setting core.hooksPath would disable every one of them. The README" >&2
  echo "  language-switcher check lives in .githooks/pre-commit: call it from your hook," >&2
  echo "  or run \`bun run docs:switcher:check\` before committing." >&2
  exit 0
fi

if ! git config core.hooksPath .githooks 2>/dev/null; then
  echo "install-hooks: could not set core.hooksPath — skipping the pre-commit hook." >&2
  echo "  Run \`bun run docs:switcher:check\` before committing; CI runs it too." >&2
fi

exit 0
