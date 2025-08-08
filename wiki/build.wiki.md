# Build & Deployment Guide

This project follows a **two-step** production workflow that avoids shipping build-time tools in the final image.

---

## 1. Install (CI)

```bash
npm ci --omit=dev       # or simply: npm run ci:prod
```

- Installs **dependencies** only.
- All build-time utilities (Babel CLI, plugins, cross-env, rimraf …) are located in `dependencies` so they are still available for the build even though dev-deps are skipped.

## 2. Build

```bash
npm run build           # compiles `src/` → `dist/`
```

- Uses Babel to transpile source code according to `.babelrc` / `babel.config.js`.

## 3. Strip build-time packages (optional-but-recommended)

```bash
npm prune --production  # or: npm run build:prod (runs build + prune)
```

- Removes **devDependencies** from `node_modules`.
- Build-time packages that now live in `dependencies` will **remain**. If you want a minimal runtime image, use a multi-stage Docker build and copy only the following into the final stage:
  - `dist/` folder
  - `package.json` + `package-lock.json` / `pnpm-lock.yaml`
  - then run `npm ci --omit=dev && npm prune --production` again

## One-shot command

```bash
npm run ci:prod         # aliases: ci:prod -> build -> prune
```

---

## Why move build tools to `dependencies`?

Running `npm ci --omit=dev` skips `devDependencies`, therefore tools like Babel would be missing during the build. By placing them in regular `dependencies`, we guarantee they are present when compiling.

For the **runtime** image you can still slim down by:

1. Using multi-stage Docker (recommended).
2. Copying only the transpiled `dist/` folder and re-installing production deps.

---

## TL;DR

```bash
npm run ci:prod   # safest path
node dist/index.js
```
