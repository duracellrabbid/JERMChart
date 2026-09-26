# Build Enforcement & URL Utility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce architectural rules (cognitive complexity < 15, ReDoS-free linear regex) during the build and commit processes using ESLint (`eslint-plugin-sonarjs`, `eslint-plugin-regexp`) and Husky, and centralize path/URL sanitization into a dedicated, reusable string utility.

**Architecture:** 
- A dedicated `urlUtils.ts` utility encapsulates linear $\mathcal{O}(n)$ string operations for trailing slash stripping and URL joining, replacing ad-hoc inline regexes.
- ESLint 9+ flat configuration integrates `typescript-eslint`, `eslint-plugin-sonarjs`, and `eslint-plugin-regexp`, enforcing cognitive complexity thresholds (< 15) and banning backtracking regexes.
- The build pipeline (`npm run build`) and git pre-commit hooks (`husky`) strictly require clean lint passes before compilation or commit creation.

**Tech Stack:** TypeScript 5.7, ESLint 9+, `typescript-eslint`, `eslint-plugin-sonarjs`, `eslint-plugin-regexp`, Husky 9, Vite 6, Vitest 4.

## Global Constraints

- Cognitive complexity of every function, method, and hook must remain strictly `< 15` (SonarSource metric, enforced via `sonarjs/cognitive-complexity`).
- All regular expressions must run in guaranteed linear time $\mathcal{O}(n)$ (enforced via `regexp/no-super-linear-backtracking` and `regexp/optimal-quantifier-concatenation`).
- Build step (`npm run build`) must run linting first and fail immediately on any lint violation.
- Pre-commit git hook via Husky must execute linting to prevent non-compliant code from entering git.
- All tests must reside in `src/__tests__/` and be excluded from production packages.
- Zero regression: All 246 existing tests across all 23 test suites must pass cleanly.

---

### Task 1: Shared URL & Path Sanitization Utility (`src/utils/urlUtils.ts`)

**Files:**
- Create: `src/utils/urlUtils.ts`
- Create: `src/__tests__/utils/urlUtils.test.ts`
- Modify: `src/services/ai/chartVisionService.ts`
- Modify: `src/components/settings/SettingsModal.tsx`
- Modify: `src/__tests__/services/chartVisionService.test.ts`

**Interfaces:**
- Consumes: Raw base URLs and endpoint paths from AI configuration or components.
- Produces:
  - `trimTrailingSlashes(url: string): string`: Linearly strips trailing slashes (`/`) without regex backtracking.
  - `joinUrl(baseUrl: string, path: string): string`: Safely concatenates a base URL and endpoint path ensuring exactly one separator slash between them.

- [x] **Step 1: Write failing unit tests for `urlUtils`**

Create `src/__tests__/utils/urlUtils.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { trimTrailingSlashes, joinUrl } from '../../utils/urlUtils';

describe('urlUtils', () => {
  describe('trimTrailingSlashes', () => {
    it('strips single and multiple trailing slashes', () => {
      expect(trimTrailingSlashes('https://api.openai.com/v1/')).toBe('https://api.openai.com/v1');
      expect(trimTrailingSlashes('https://api.openai.com/v1///')).toBe('https://api.openai.com/v1');
      expect(trimTrailingSlashes('https://api.openai.com/v1')).toBe('https://api.openai.com/v1');
    });

    it('handles empty strings, whitespace, and root slashes', () => {
      expect(trimTrailingSlashes('')).toBe('');
      expect(trimTrailingSlashes('   ')).toBe('');
      expect(trimTrailingSlashes('///')).toBe('');
      expect(trimTrailingSlashes('  https://api.openai.com/v1/  ')).toBe('https://api.openai.com/v1');
    });

    it('preserves internal slashes in paths', () => {
      expect(trimTrailingSlashes('https://example.com/api/v2/')).toBe('https://example.com/api/v2');
      expect(trimTrailingSlashes('/a/b/c//')).toBe('/a/b/c');
    });
  });

  describe('joinUrl', () => {
    it('joins base URL and endpoint path with a single slash', () => {
      expect(joinUrl('https://api.openai.com/v1', 'chat/completions')).toBe(
        'https://api.openai.com/v1/chat/completions'
      );
      expect(joinUrl('https://api.openai.com/v1/', '/chat/completions')).toBe(
        'https://api.openai.com/v1/chat/completions'
      );
      expect(joinUrl('https://api.openai.com/v1///', '///chat/completions')).toBe(
        'https://api.openai.com/v1/chat/completions'
      );
    });

    it('handles root or empty paths', () => {
      expect(joinUrl('https://api.openai.com/v1', '')).toBe('https://api.openai.com/v1');
      expect(joinUrl('', '/chat/completions')).toBe('/chat/completions');
    });
  });
});
```

- [x] **Step 2: Run test to confirm failure**

Run: `rtk npx vitest run src/__tests__/utils/urlUtils.test.ts`
Expected: Fails because `src/utils/urlUtils.ts` does not yet exist.

- [x] **Step 3: Implement `src/utils/urlUtils.ts`**

Create `src/utils/urlUtils.ts`:
```typescript
/**
 * Trims all trailing forward slashes from a URL or path in linear O(n) time
 * using string primitives to guarantee zero regex backtracking and ReDoS immunity.
 */
export function trimTrailingSlashes(url: string): string {
  const trimmed = String(url || '').trim();
  let end = trimmed.length;
  while (end > 0 && trimmed.charCodeAt(end - 1) === 47 /* '/' */) {
    end--;
  }
  return trimmed.slice(0, end);
}

/**
 * Trims all leading forward slashes from a path string in linear O(n) time.
 */
export function trimLeadingSlashes(path: string): string {
  const trimmed = String(path || '').trim();
  let start = 0;
  const len = trimmed.length;
  while (start < len && trimmed.charCodeAt(start) === 47 /* '/' */) {
    start++;
  }
  return trimmed.slice(start);
}

/**
 * Safely joins a base URL and endpoint path, guaranteeing exactly one
 * slash between them with linear O(n) performance.
 */
export function joinUrl(baseUrl: string, path: string): string {
  const cleanBase = trimTrailingSlashes(baseUrl);
  const cleanPath = trimLeadingSlashes(path);
  if (!cleanBase) return cleanPath ? `/${cleanPath}` : '';
  if (!cleanPath) return cleanBase;
  return `${cleanBase}/${cleanPath}`;
}
```

- [x] **Step 4: Update consumers to import from `urlUtils`**

1. In `src/services/ai/chartVisionService.ts`:
   - Import `trimTrailingSlashes` and `joinUrl` from `../../utils/urlUtils`.
   - Update `callOpenAIVision` to use `joinUrl(config.customEndpoint || 'https://api.openai.com/v1', 'chat/completions')`.
   - Re-export `trimTrailingSlashes` if needed for backwards compatibility.
2. In `src/components/settings/SettingsModal.tsx`:
   - Import `joinUrl` from `../../utils/urlUtils`.
   - Update OpenAI ping test to use `joinUrl(config.customEndpoint || 'https://api.openai.com/v1', 'chat/completions')`.
3. In `src/__tests__/services/chartVisionService.test.ts`:
   - Verify all tests pass with the re-exported / imported utility.

- [x] **Step 5: Run tests and verify**

Run: `rtk npx vitest run`
Expected: 24 test suites pass, 250+ tests pass.

---

### Task 2: Install ESLint, SonarJS, Regexp Plugins, and Husky

**Files:**
- Modify: `package.json`

**Dependencies to Install:**
- `eslint`: `^9.22.0`
- `@eslint/js`: `^9.22.0`
- `typescript-eslint`: `^8.26.0`
- `eslint-plugin-sonarjs`: `^4.2.1`
- `eslint-plugin-regexp`: `^3.3.1`
- `husky`: `^9.1.7`

- [x] **Step 1: Install packages via npm**

Run command:
```bash
rtk npm install --save-dev eslint @eslint/js typescript-eslint eslint-plugin-sonarjs eslint-plugin-regexp husky
```

- [x] **Step 2: Verify `package.json` additions**

Check `devDependencies` in `package.json` to ensure the exact packages and versions are recorded.

---

### Task 3: ESLint Flat Configuration (`eslint.config.js`)

**Files:**
- Create: `eslint.config.js`
- Modify: `package.json` (add `"lint"` and `"lint:fix"` scripts)

**Rules & Standards Enforced:**
- `sonarjs/cognitive-complexity`: `['error', 15]` (strictly enforces Rule 4).
- `regexp/no-super-linear-backtracking`: `'error'` (strictly enforces Rule 5 ReDoS prevention).
- `regexp/optimal-quantifier-concatenation`: `'error'`.
- `regexp/no-potentially-useless-backreference`: `'error'`.
- Exclude build and test output folders: `dist/**`, `release/**`, `coverage/**`, `node_modules/**`.

- [x] **Step 1: Create `eslint.config.js`**

Create `eslint.config.js`:
```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import regexpPlugin from 'eslint-plugin-regexp';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'release/**',
      'coverage/**',
      'node_modules/**',
      '**/*.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  regexpPlugin.configs['flat/recommended'],
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Rule 4: Cognitive Complexity must remain strictly below 15
      'sonarjs/cognitive-complexity': ['error', 15],

      // Rule 5: ReDoS prevention and linear regex
      'regexp/no-super-linear-backtracking': 'error',
      'regexp/optimal-quantifier-concatenation': 'error',

      // General code quality & TypeScript guardrails
      '@typescript-eslint/no-explicit-any': 'off', // Permitted for raw external imports/xlsx
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      // Relax cognitive complexity and any checks inside test suites
      'sonarjs/cognitive-complexity': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);
```

- [x] **Step 2: Add lint scripts to `package.json`**

In `package.json`:
```json
"scripts": {
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  ...
}
```

- [x] **Step 3: Run `rtk npm run lint` and remediate any surfaced issues**

Run: `rtk npm run lint`
Inspect any findings. If any existing functions exceed cognitive complexity 15 or have warnings, refactor them cleanly to guarantee 0 errors.

---

### Task 4: Enforce Linter in Build Process & Git Hooks via Husky

**Files:**
- Modify: `package.json`
- Create: `.husky/pre-commit`

- [x] **Step 1: Wire linting into the production build script**

In `package.json`, update the `"build"` script:
```json
"scripts": {
  "build": "npm run lint && tsc && vite build",
  ...
}
```
This guarantees that `npm run build` will immediately fail if any rule is violated.

- [x] **Step 2: Initialize Husky and create the pre-commit hook**

1. Run: `npx husky init`
2. Configure `.husky/pre-commit` to execute `npm run lint`:
```bash
npm run lint
```
3. Add `"prepare": "husky"` to `scripts` in `package.json` so every clone/install sets up git hooks automatically.

- [x] **Step 3: Test that build fails on lint violation**

1. Temporarily introduce a deliberate ReDoS pattern (e.g. `const _bad = /(a+)+$/;`) in a scratch file.
2. Run `rtk npm run lint` and confirm it fails with `regexp/no-super-linear-backtracking`.
3. Remove the deliberate violation.
4. Run `rtk npm run build` and confirm it passes with code 0.

---

### Task 5: Update Operational Guidelines in `AGENTS.md` and `.agents/AGENTS.md`

**Files:**
- Modify: `AGENTS.md`
- Modify: `.agents/AGENTS.md`

- [x] **Step 1: Update AGENTS.md documentation**

1. Update Rule 2 / Tech Stack reference to include ESLint 9, `eslint-plugin-sonarjs`, `eslint-plugin-regexp`, and Husky.
2. Update the Mermaid workflow diagram to include `Lint Check (rtk npm run lint)`.
3. Update Section 3 "Validation" protocol:
   - `rtk npm run lint`
   - `rtk npm test`
   - `rtk npm run build`
4. Document the shared URL utility in `src/utils/urlUtils.ts`.

- [x] **Step 2: Synchronize `.agents/AGENTS.md`**

Ensure `.agents/AGENTS.md` mirrors all updates made to `AGENTS.md`.

- [x] **Step 3: Final complete verification**

Run:
```bash
rtk npm run lint
rtk npm test
rtk npm run build
```
Verify all three commands succeed with exit code 0.
