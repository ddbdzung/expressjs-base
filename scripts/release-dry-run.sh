#!/usr/bin/env bash
# Preview the next release produced by standard-version without leaving any commits/tags behind.
# Work-around for the broken --dry-run flag in standard-version@9.x which still writes commits & tags.
#
# Usage: pnpm run release:dry-run
#
# Steps:
# 1. Remember current branch & existing tags.
# 2. Create a throw-away branch.
# 3. Run standard-version --dry-run (ignore its side-effects).
# 4. Delete any new tags that appeared, drop the temp branch and restore HEAD.
# 5. Print the preview output (already echoed by standard-version).
#
# Safe for repeated execution.

set -euo pipefail

CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
TMP_BRANCH="tmp/dry-run"

# -----------------------------------------------------------------------------
# 1. SAFETY CHECKS -------------------------------------------------------------
# -----------------------------------------------------------------------------
# Abort if we are already on the temp branch (would recurse endlessly).
if [[ "${CURRENT_BRANCH}" == "${TMP_BRANCH}" ]]; then
  echo "❌  You are already on ${TMP_BRANCH}. Checkout another branch first." >&2
  exit 1
fi

# Abort if working directory is not clean (both staged & unstaged changes).
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌  Working tree is dirty – commit or stash your changes before running a dry-run preview." >&2
  exit 1
fi

# -----------------------------------------------------------------------------
# 4. KEEP FLAG -----------------------------------------------------------------
# -----------------------------------------------------------------------------
KEEP=false
if [[ "${1:-}" == "--keep" ]]; then
  KEEP=true
  shift  # remove flag so remaining args pass to standard-version
fi

# Any additional CLI args will be forwarded to standard-version below

# List tags before we start (sorted, one per line).
TAGS_BEFORE=$(git tag)

# Remove old temp branch if it exists
if git show-ref --quiet --verify "refs/heads/${TMP_BRANCH}"; then
  git branch -D "${TMP_BRANCH}"
fi

# Create the sandbox branch and switch to it
git switch -c "${TMP_BRANCH}"

# -----------------------------------------------------------------------------
# 3. PASS-THROUGH ARGS to standard-version ------------------------------------
# -----------------------------------------------------------------------------
# Run the release preview. Ignore non-zero exit so script continues (std-ver may
# exit 1 if tag already exists).

if ! pnpm exec standard-version --dry-run "$@"; then
  echo "\n⚠️  standard-version exited with a non-zero status (expected in some cases). Continuing cleanup…\n"
fi

# Capture new tags and delete them.
TAGS_AFTER=$(git tag)
for tag in ${TAGS_AFTER}; do
  if ! echo "${TAGS_BEFORE}" | grep -qx "${tag}"; then
    git tag -d "${tag}" >/dev/null
  fi
done

# Switch back before optional deletion so HEAD is safe
git switch "${CURRENT_BRANCH}"

# Drop temp branch unless --keep was provided
if ! $KEEP; then
  if git show-ref --quiet --verify "refs/heads/${TMP_BRANCH}"; then
    git branch -D "${TMP_BRANCH}" >/dev/null
  fi
fi

printf "\n✅ Release dry-run completed – repository left untouched.\n"
printf "ℹ️  The output above shows what standard-version would have done (bumped version, updated CHANGELOG, commit, tag).\n"
if $KEEP; then
  printf "   Temp branch '%s' has been kept – inspect it freely and delete when done.\n" "$TMP_BRANCH"
else
  printf "   Nothing was persisted: temp branch deleted, tags removed. Push was intentionally skipped.\n"
fi 
