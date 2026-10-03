# Proposal: Upgrade electron-builder to v27 Alpha

## Why

A high-severity security vulnerability ([GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp) / CVE-2026-93748) in `http-cache-semantics` ($\le 4.2.0$) is pulled into `package-lock.json` via `electron-builder@^26.15.3` $\to$ `app-builder-lib` $\to$ `@electron/get@3.x` $\to$ `got@11.x` $\to$ `cacheable-request`. This causes `npm run audit:security` (`npm audit --audit-level=moderate`) to fail with exit code 1, which blocks our mandatory `npm run verify:pre-push` quality gate and CI/CD release builds.

In alignment with our **Security by Design** mandate, rather than downgrading to an older build stack or using ad-hoc audit exceptions, we upgrade `electron-builder` to `^27.0.0-alpha.9`. In `electron-builder` v27, `app-builder-lib` natively adopts `@electron/get@^5.0.0`, completely eliminating `got`, `cacheable-request`, and `http-cache-semantics` from the dependency tree.

## What Changes

* Upgrade `electron-builder` devDependency from `^26.15.3` to `^27.0.0-alpha.9` in `package.json`.
* Regenerate `package-lock.json` to eliminate `@electron/get@3.x`, `got`, `cacheable-request`, and vulnerable `http-cache-semantics`.
* Validate that packaging configurations in `electron-builder.json` remain fully compatible with v27 schema and architecture.
* Verify that Windows desktop compilation, packaging (`electron:pack`, `electron:build`), and cryptographic checksum generation pass without regressions.
* Confirm that `npm run audit:security` reports zero moderate or higher vulnerabilities, unblocking `npm run verify:pre-push` and CI/CD workflows.

## Capabilities

### New Capabilities
*(None)*

### Modified Capabilities
- `windows-release-pipeline`: Update the build and packaging toolchain to use `electron-builder` v27 to build Windows x64 NSIS and portable distribution executables while maintaining zero security vulnerabilities during security audits.

## Impact

* **Dependencies**: `package.json` and `package-lock.json` (`electron-builder` upgraded to `^27.0.0-alpha.9`).
* **Toolchain & Packaging**: `electron-builder.json` packaging directives for NSIS and portable Windows x64 artifacts.
* **CI/CD Workflows**: `.github/workflows/ci.yml` and `.github/workflows/release.yml` executing `verify:pre-push` and `electron:build`.
* **Runtime**: None. `electron-builder` is strictly a `devDependency` and is never included in the production web bundle or desktop runtime.
