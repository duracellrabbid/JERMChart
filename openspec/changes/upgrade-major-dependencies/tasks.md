## 1. Phase 1: React 19 Core & Safe Major Upgrades

- [x] 1.1 Upgrade React runtime and types to `^19.3.0` (`react`, `react-dom`, `@types/react`, `@types/react-dom`) in `package.json`
- [x] 1.2 Upgrade `@testing-library/react` to `^16.3.3`, `@testing-library/jest-dom` to `^7.0.1`, and `jsdom` to `^30.1.1` in `package.json`
- [x] 1.3 Upgrade `@dagrejs/dagre` to `^3.1.1` and `lucide-react` to `^1.48.0` in `package.json`
- [x] 1.4 Upgrade `zustand` to `^5.0.15` and `@xyflow/react` to `^12.12.0` in `package.json`
- [x] 1.5 Run `npm install` and verify TypeScript compilation with `tsc --noEmit`
- [x] 1.6 Verify layout engine tests in `src/__tests__/utils/layoutEngine.test.ts` and component test suite with `rtk npm test`

## 2. Phase 2: Build & Styling Pipeline Modernization

- [x] 2.1 Upgrade `vite` to `^8.3.1` and `@vitejs/plugin-react` to `^6.1.1` in `package.json`
- [x] 2.2 Upgrade `vitest` and `@vitest/coverage-v8` to `^5.0.2` in `package.json`
- [x] 2.3 Install `tailwindcss` v4 (`^4.3.3`) and `@tailwindcss/vite` (`^4.3.3`)
- [x] 2.4 Remove obsolete devDependencies `autoprefixer` and standalone `postcss`
- [x] 2.5 Configure `@tailwindcss/vite` in `vite.config.ts` alongside `@vitejs/plugin-react`
- [x] 2.6 Migrate custom fiduciary color definitions into `@theme` block in `src/index.css`
- [x] 2.7 Delete obsolete `tailwind.config.js` and `postcss.config.js` files
- [x] 2.8 Validate styles and visual rendering across canvas nodes and modals with `rtk npm test`

## 3. Phase 3: Guardrail Enforcement & Quality Gate Verification

- [x] 3.1 Verify `typescript` is pinned to `^5.9.3` to ensure full compatibility with `typescript-eslint` 8
- [x] 3.2 Verify `@types/node` is pinned to `^22.x` to maintain parity with Electron 44's Node 22 desktop runtime
- [x] 3.3 Run `rtk npm run lint` to enforce zero ESLint warnings/errors, cognitive complexity < 15 (Rule 4), and linear regex (Rule 5)
- [x] 3.4 Run `rtk npm run test:coverage` to confirm 100% test coverage across statements, branches, functions, and lines (Pre-Commit Gate)
- [x] 3.5 Run `rtk npm run build` to validate production bundle bundling
- [x] 3.6 Run `rtk npm run audit:security` to confirm zero moderate, high, or critical vulnerabilities (Pre-Push Gate)
- [x] 3.7 Run `rtk npm run electron:pack` dry-run to verify desktop application packaging integrity
