#!/usr/bin/env bash

cat <<'HELP'
Release command cheatsheet
==========================

pnpm release
  Run a REAL release using standard-version (commits, tags, no push).

pnpm release -- --first-release
  First ever release – generates CHANGELOG without bumping version.

pnpm run release:dry-run [--keep] [extra standard-version flags]
  Preview the next release safely.
    --keep  keep the temporary branch so you can inspect generated files.
    All other flags are forwarded to standard-version, e.g.:
      pnpm run release:dry-run -- --release-as minor

pnpm run release:help
  Show this help.

Notes
-----
• The dry-run helper creates a throw-away branch, executes standard-version
  with --dry-run, then cleans up commits/tags so your repo stays pristine.
• After a successful REAL release remember to push:
    git push --follow-tags origin $(git symbolic-ref --short HEAD)
HELP 
