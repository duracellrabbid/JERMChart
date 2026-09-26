## Context

JERMChart operates as an offline, 100% client-side desktop (Electron 44 / Node 22) and web application. The core visualization and state management combine Zustand 5 (`src/store/useStructureStore.ts`), `@xyflow/react` (React Flow 12), and `@dagrejs/dagre` for algorithmic hierarchical layout with stepped orthogonal edges. Upgrading major packages involves cross-cutting changes across rendering (React 19), styling (Tailwind CSS 4 + `@tailwindcss/vite`), layout engine (`@dagrejs/dagre` 3), and testing/tooling (Vite 8, Vitest 5, `@testing-library/react` 16).

See `proposal.md` for user motivations and `specs/modern-runtime-stack/spec.md` for formal requirement deltas.

## Goals / Non-Goals

**Goals:**
- Transition the application seamlessly to React 19, Dagre 3, Lucide React 1.x, Vite 8, Vitest 5, and Tailwind CSS 4.
- Preserve 100% of existing functional behavior, visual fidelity (fiduciary color tokens, node dimensions, director directory tags), and export capabilities (A4 PDF, PPTX, Excel, PNG/SVG).
- Maintain cognitive complexity strictly below 15 across all components and helpers.
- Retain 100% test coverage and zero ESLint errors under `verify:pre-commit`.
- Maintain zero security vulnerabilities under `verify:pre-push`.

**Non-Goals:**
- Upgrading to TypeScript 7: Blocked by `typescript-eslint` 8 parser limitations (`typescript: '>=4.8.4 <6.1.0'`). TypeScript will be upgraded to 5.9.3.
- Upgrading to `@types/node` 26: Misaligned with Electron 44's Node 22 desktop runtime. Definitions remain on Node 22 LTS (`^22.x`).
- Introducing server components or backend API calls: JERMChart remains 100% client-side with full fiduciary privacy.

## Decisions

### 1. Phased Migration Strategy: React 19 & Toolchain Decoupling
- **Decision**: Execute the upgrade in three distinct phases:
  - *Phase 1*: React 19 Core (`react`, `react-dom`, `@types/react`, `@types/react-dom`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@dagrejs/dagre`, `lucide-react`).
  - *Phase 2*: Build & Styling Pipeline (`vite` 8, `@vitejs/plugin-react` 6, `vitest` 5, `@vitest/coverage-v8` 5, `tailwindcss` 4 with `@tailwindcss/vite`, purge `autoprefixer` / `postcss.config.js`).
  - *Phase 3*: Toolchain Pinned Guardrails (Keep `typescript` on `^5.9.3` and `@types/node` on `^22.x`).
- **Rationale**: Isolating React runtime and library changes from build/bundler transformations makes debugging regressions deterministic.
- **Alternatives Considered**: Upgrading all packages in a single `npx npm-check-updates -u` step. Rejected because concurrent failures in PostCSS, TypeScript 7, and React 19 types would cause conflated errors.

### 2. Tailwind CSS v4 CSS-First Configuration via `@tailwindcss/vite`
- **Decision**: Adopt `@tailwindcss/vite` and migrate custom fiduciary theme extensions into `src/index.css` via `@theme` directives:
  ```css
  @import "tailwindcss";

  @theme {
    --color-trust-50: #f8fafc;
    --color-trust-100: #f1f5f9;
    --color-trust-500: #0f172a;
    --color-trust-600: #0284c7;
    --color-trust-700: #0369a1;
    --color-trust-gold: #d97706;
    --color-trust-navy: #0f172a;
    --color-trust-teal: #0d9488;
  }
  ```
  Delete `tailwind.config.js`, `postcss.config.js`, and remove `autoprefixer` and `postcss` devDependencies.
- **Rationale**: Tailwind 4 delegates prefixing and nesting to Lightning CSS inside the Vite plugin, producing faster builds and eliminating redundant configuration files.
- **Alternatives Considered**: Keeping `@tailwindcss/postcss` with legacy PostCSS. Rejected because `@tailwindcss/vite` provides tighter Vite 8 integration and removes 2 config files.

### 3. Dagre 3.x Layout Engine Integration
- **Decision**: Upgrade `@dagrejs/dagre` to `3.1.1`. Retain the existing import `import dagre from '@dagrejs/dagre'` and graphlib instantiation in `src/utils/layoutEngine.ts`.
- **Rationale**: In v3.1.1, Dagre bundles native TypeScript declarations (`./dist/types/index.d.ts`) and ESM exports, while maintaining 100% backwards-compatibility with `new dagre.graphlib.Graph()` and `dagre.layout(dagreGraph)`.
- **Data Flow & Layout Implications**: Node positioning, orthogonal edge routing, and sibling sorting calculations remain byte-for-byte identical.

### 4. Zustand Store & React Flow Canvas Architectural Impact
- **Decision**: Keep Zustand 5 (`^5.0.3` -> `^5.0.15`) and `@xyflow/react` (`^12.4.2` -> `^12.12.0`).
- **Impact on Store**: Zustand 5 officially supports React 19 `useSyncExternalStore` without deprecation warnings. Undo/redo history slices, snapshot generation, and director spotlight selectors in `src/store/useStructureStore.ts` continue uninterrupted.
- **Impact on Canvas**: `@xyflow/react` v12 specifies `react: '>=17'`, operating natively in React 19 StrictMode.

### 5. Cognitive Complexity & Regex Guardrails (Rules 4 & 5)
- **Decision**: Cognitive complexity will remain strictly `< 15` across all new or modified code. All string manipulations (e.g. icon name lookups, CSS variable mapping) must use linear-time string primitives (`startsWith`, `includes`, `slice`) or ReDoS-free linear regex.

## Risks / Trade-offs

- **[Risk] React 19 Typing Changes in Function Components & Events** → **Mitigation**: Verified that codebase does not use deprecated `defaultProps` or `propTypes`. Event types in forms and canvas listeners are standard React 19 events. Run `tsc --noEmit` to validate.
- **[Risk] Vitest 5 Configuration or Environment Incompatibility** → **Mitigation**: Vitest 5 seamlessly integrates with Vite 8. Coverage provider `v8` with 100% threshold enforcement will be tested immediately after bumping.
- **[Risk] Tailwind 4 Utility Renaming or Missing Base Styles** → **Mitigation**: Verify entity cards, director pills, modals, and canvas zoom controls in both light and dark backgrounds; inspect DOM classes in test suite.
- **[Risk] Dependency Security Vulnerabilities Introduced by Major Bumps** → **Mitigation**: Run `npm run audit:security` on every phase to verify zero moderate or higher vulnerabilities.

## Migration Plan

1. **Step 1: Install React 19 Core & Safe Majors** (`react`, `react-dom`, `@types/react`, `@types/react-dom`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@dagrejs/dagre`, `lucide-react`, `zustand`). Run `npm run verify:pre-commit`.
2. **Step 2: Install Vite 8 & Vitest 5 Toolchain** (`vite`, `@vitejs/plugin-react`, `vitest`, `@vitest/coverage-v8`). Verify test suite passes with 100% coverage.
3. **Step 3: Migrate to Tailwind CSS v4** (Install `tailwindcss` and `@tailwindcss/vite`, uninstall `autoprefixer`, update `src/index.css` and `vite.config.ts`, delete `tailwind.config.js` and `postcss.config.js`).
4. **Step 4: Execute Full Pre-Push Verification** (`npm run verify:pre-commit`, `npm run verify:pre-push`, Electron build dry-run).

## Open Questions

None. All dependency compatibility matrices, peer dependencies, icon usages, and engine constraints have been empirically verified.
