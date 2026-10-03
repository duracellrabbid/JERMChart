# Design: Upgrade electron-builder to v27 Alpha

## Context

See `proposal.md` for background and vulnerability analysis.

`JERMChart` packages a standalone Windows desktop executable using `electron-builder` with configuration defined in `electron-builder.json`. The current version `^26.15.3` relies on `app-builder-lib@26.15.3`, which depends on `@electron/get@^3.0.0`. In that lineage, `@electron/get` uses `got@11`, which pulls in `cacheable-request` and `http-cache-semantics` ($\le 4.2.0$), triggering high-severity security advisory [GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp).

## Goals / Non-Goals

**Goals:**
* Eliminate the high-severity security vulnerability in `package-lock.json` by adopting `electron-builder@^27.0.0-alpha.9`.
* Ensure `npm run audit:security` passes with 0 moderate or higher vulnerabilities.
* Verify that `electron-builder.json` remains fully compatible with `electron-builder` v27 for Windows NSIS and Portable packaging.
* Ensure all existing quality gates (`verify:pre-commit`, `verify:pre-push`) pass without regression.

**Non-Goals:**
* No changes to application frontend code, Zustand store (`src/store/useStructureStore.ts`), React Flow canvas, or layout calculations.
* No changes to Electron runtime scripts (`electron/main.cjs`, `electron/preload.cjs`).
* No modification of GitHub Actions workflow triggers or release structures outside dependency updates.

## Decisions

### Decision 1: Upgrade to `^27.0.0-alpha.9` over Downgrading to `26.5.0`
* **Rationale**: Downgrading to `26.5.0` leaves technical debt and reverts 10+ minor releases of builder fixes. `electron-builder` v27 natively upgrades `@electron/get` to `^5.0.0`, matching `electron@44.4.3`'s native dependency.
* **Alternatives Considered**:
  * *Downgrade to 26.5.0*: Avoids alpha tag, but reverts tooling fixes and leaves the codebase on an older branch.
  * *Package Overrides (`@electron/get@5`)*: Incompatible with `app-builder-lib@26` CommonJS loader and `got` agent configs.
  * *Audit Level Suppression*: Weakens security compliance and violates our zero-vulnerability gate.

### Decision 2: Verify `electron-builder.json` Directives
* **Rationale**: `electron-builder.json` uses standard target declarations:
  ```json
  "win": {
    "target": [
      { "target": "portable", "arch": ["x64"] },
      { "target": "nsis", "arch": ["x64"] }
    ]
  }
  ```
  We will verify these targets build cleanly on v27 without deprecated options.

## Risks / Trade-offs

* **[Risk: Alpha Stability]**: `electron-builder` v27 is currently in alpha (`27.0.0-alpha.9`).
  * *Mitigation*: Perform a local smoke test by running `npm run electron:pack` (unpacked directory build) to ensure the packager completes with zero errors and correctly bundles `dist/` and `electron/main.cjs`.
* **[Risk: Lockfile Bloat or Unexpected Secondary Transitives]**: Updating a major build dependency could pull in unexpected transitive packages.
  * *Mitigation*: Run `npm run audit:security` to ensure zero moderate/high/critical advisories exist anywhere in the updated dependency tree.

## Migration & Rollback Strategy

1. Work strictly on the isolated branch `spike/electron-builder-v27`.
2. Update `package.json` and install with `npm install electron-builder@^27.0.0-alpha.9 --save-dev`.
3. Execute validation:
   - `npm run audit:security`
   - `npm run verify:pre-commit`
   - `npm run verify:pre-push`
   - `npm run electron:pack`
4. If any unresolvable issues arise in v27 alpha, rollback simply involves discarding the branch and returning to `main` without affecting any release.
