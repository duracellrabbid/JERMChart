## Why

JERMChart relies on several core libraries—including React 18, Dagre 1.1, Lucide React 0.475, Vite 6, and Tailwind CSS 3—where upstream development has transitioned to new major versions (React 19, Dagre 3, Lucide 1.48, Vite 8, and Tailwind CSS 4). Upgrading these foundational packages resolves latent vulnerabilities, improves rendering and layout calculation performance, ensures long-term supportability, and equips fiduciary trust officers and wealth managers with a modern, secure, and snappy structure chart utility without sacrificing 100% client-side data privacy.

## What Changes

- **Upgrade React Core to v19**: Upgrade `react` and `react-dom` from `^18.3.1` to `^19.3.0`, along with `@types/react` and `@types/react-dom` to `^19.3.0`.
- **Upgrade Dagre Layout Engine to v3**: Upgrade `@dagrejs/dagre` from `^1.1.4` to `^3.1.1`, adopting native ESM and built-in type definitions while preserving layout calculations.
- **Upgrade Lucide React to v1**: Upgrade `lucide-react` from `^0.475.0` to `^1.48.0` with verified availability of all fiduciary entity, director, and toolbar icons.
- **Upgrade Test Harness**: Upgrade `@testing-library/react` to `^16.3.3`, `@testing-library/jest-dom` to `^7.0.1`, and `jsdom` to `^30.1.1` for seamless React 19 compatibility.
- **Upgrade Build Pipeline to Vite 8 & Vitest 5**: Upgrade `vite` from `^6.1.0` to `^8.3.1`, `@vitejs/plugin-react` to `^6.1.1`, and `vitest`/`@vitest/coverage-v8` to `^5.0.2`.
- **Modernize Styling with Tailwind CSS v4**: Upgrade `tailwindcss` to `^4.3.3` with `@tailwindcss/vite`, migrate custom fiduciary color palettes (`trust-50`..`trust-navy`) into `@theme` directives in CSS, and eliminate obsolete `autoprefixer` and `postcss.config.js`.
- **Maintain Safety Guardrails**: 
  - Keep `typescript` at `^5.9.3` to avoid breaking `typescript-eslint` 8 (which does not support TypeScript 7).
  - Keep `@types/node` on the Node 22 LTS branch (`^22.x`) to strictly align with Electron 44's Node 22 desktop runtime.

## Capabilities

### New Capabilities
- `modern-runtime-stack`: Defines system requirements for React 19 component execution, Dagre 3 layout computations, Tailwind 4 theme rendering, and Vite 8 bundling while maintaining zero security vulnerabilities and 100% offline client-side fiduciary privacy.

### Modified Capabilities
<!-- None: No existing specs in openspec/specs/ -->

## Impact

- **Dependencies**: Updates `package.json` with major bumps for `react`, `react-dom`, `@dagrejs/dagre`, `lucide-react`, `vite`, `@vitejs/plugin-react`, `vitest`, `@vitest/coverage-v8`, `@testing-library/jest-dom`, `jsdom`, and `tailwindcss` (with `@tailwindcss/vite`).
- **Configuration**: Replaces `tailwind.config.js` and `postcss.config.js` with `@tailwindcss/vite` in `vite.config.ts` and `@theme` in `src/index.css`.
- **Domain Impact**: All fiduciary entities (Trusts, SPVs, HoldCos, OpCos), director directory spotlights, and A4 PDF/PowerPoint/Excel exports continue functioning identically with 100% test coverage.
- **Non-Goals**: No backend services or external API dependencies will be introduced. TypeScript 7 and Node 26 types will not be adopted at this stage to safeguard linting and Electron runtime stability.
