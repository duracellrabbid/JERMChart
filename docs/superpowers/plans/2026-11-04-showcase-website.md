# JERMChart Open-Source Showcase Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-conversion, self-contained open-source showcase landing website in `website/` modeled after DeepSeek Harness (`deepseek.com/en/harness/`), adhering to JERMChart's fiduciary color palette, zero-telemetry principles, and single-page vertical scroll structure.

**Architecture:** Pure Vanilla HTML5, CSS3 (custom properties, responsive grid/flexbox), and lightweight modular JavaScript residing completely within `website/`. No npm build step or external CDNs required to serve or deploy. Fully verified by a dedicated test suite in `src/__tests__/website/` to uphold the repository's 100% test coverage and zero-telemetry guardrails.

**Tech Stack:** Vanilla HTML5, CSS3, ES6+ JavaScript, Vitest, JSDOM, RTK.

## Global Constraints

- Tech Stack: Pure Vanilla HTML5, CSS3, and ES6 JavaScript (zero npm dependencies in `website/`).
- Color Scheme: Navy `#0f172a`, Trust Blue `#0284c7`, Trust Gold `#d97706`, Trust Teal `#0d9488`, Slate `#1e293b`/`#334155`, High-contrast text `#f8fafc`/`#cbd5e1`.
- Navigation: Single-page vertical scroll with sticky header, section anchors, and accessible modal popups for legal terms.
- Zero-Telemetry: No external CDN fonts, stylesheets, analytics, or remote scripts. All assets local.
- Repository Rules: Cognitive complexity < 15, linear ReDoS-free regex, tests in `src/__tests__/`, 100% pre-commit coverage gate.

---

### Task 1: Scaffolding, Offline Asset Scan Test & Theme Design Tokens

**Files:**
- Create: `src/__tests__/website/showcaseWebsite.test.ts`
- Create: `website/styles/theme.css`
- Create: `website/assets/favicon.svg`

**Interfaces:**
- Consumes: Design spec at `docs/superpowers/specs/2026-11-04-showcase-website-design.md`
- Produces: `website/styles/theme.css` CSS variables (`--color-trust-*`, `--color-bg-*`, etc.), `favicon.svg`, and Vitest test suite enforcing zero external network imports and presence of required design tokens.

- [ ] **Step 1: Write the failing tests in `src/__tests__/website/showcaseWebsite.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Showcase Website Offline & Theme Security', () => {
  const websiteDir = path.resolve(__dirname, '../../../website');

  it('website directory exists with theme stylesheet', () => {
    expect(fs.existsSync(websiteDir)).toBe(true);
    const themeCssPath = path.join(websiteDir, 'styles', 'theme.css');
    expect(fs.existsSync(themeCssPath)).toBe(true);
  });

  it('theme.css contains all required JERMChart fiduciary color tokens', () => {
    const themeCss = fs.readFileSync(path.join(websiteDir, 'styles', 'theme.css'), 'utf-8');
    expect(themeCss).toContain('--color-trust-navy: #0f172a');
    expect(themeCss).toContain('--color-trust-blue: #0284c7');
    expect(themeCss).toContain('--color-trust-gold: #d97706');
    expect(themeCss).toContain('--color-trust-teal: #0d9488');
    expect(themeCss).toContain('--color-bg-primary: #0f172a');
  });

  it('contains zero external network imports, scripts, or CDNs', () => {
    const checkDirRecursively = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          checkDirRecursively(fullPath);
        } else if (file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.js')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          // Disallow external stylesheet or script references to third parties (fonts.googleapis.com, cdnjs, unpkg, etc.)
          expect(content).not.toMatch(/https?:\/\/(fonts\.googleapis\.com|cdnjs|unpkg|cdn\.jsdelivr\.net)/i);
          // Disallow <script src="http...">
          expect(content).not.toMatch(/<script[^>]+src=["']https?:\/\//i);
          // Disallow <link rel=["']stylesheet["'][^>]+href=["']https?:\/\//i
          expect(content).not.toMatch(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']https?:\/\//i);
        }
      }
    };
    checkDirRecursively(websiteDir);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npx vitest run src/__tests__/website/showcaseWebsite.test.ts`
Expected: FAIL (files do not exist yet)

- [ ] **Step 3: Implement `website/styles/theme.css` and `website/assets/favicon.svg`**

Create `website/styles/theme.css`:
```css
:root {
  /* Fiduciary Brand Color Tokens */
  --color-trust-navy: #0f172a;
  --color-trust-navy-light: #1e293b;
  --color-trust-navy-card: #152238;
  --color-trust-blue: #0284c7;
  --color-trust-blue-hover: #0369a1;
  --color-trust-blue-glow: rgba(2, 132, 199, 0.25);
  --color-trust-gold: #d97706;
  --color-trust-gold-light: #f59e0b;
  --color-trust-teal: #0d9488;
  --color-trust-emerald: #10b981;

  /* Surfaces & Backgrounds */
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #090e1a;
  --color-bg-card: rgba(30, 41, 59, 0.7);
  --color-bg-card-hover: rgba(51, 65, 85, 0.8);
  --color-bg-glass: rgba(15, 23, 42, 0.85);

  /* Borders & Dividers */
  --color-border: #334155;
  --color-border-subtle: #1e293b;
  --color-border-glow: rgba(2, 132, 199, 0.4);

  /* Typography */
  --color-text-primary: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-text-muted: #94a3b8;
  --color-text-dim: #64748b;

  /* Fonts & Shadows */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --shadow-card: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
  --shadow-glow: 0 0 30px -5px rgba(2, 132, 199, 0.3);
}
```

Create `website/assets/favicon.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="8" fill="#0f172a"/>
  <rect x="2" y="2" width="28" height="28" rx="6" stroke="#0284c7" stroke-width="1.5" stroke-opacity="0.6"/>
  <circle cx="16" cy="9" r="3.5" fill="#d97706"/>
  <path d="M16 12.5V19.5M10 19.5H22M10 19.5V23M22 19.5V23" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
  <rect x="7" y="23" width="6" height="4" rx="1" fill="#0284c7"/>
  <rect x="19" y="23" width="6" height="4" rx="1" fill="#0d9488"/>
</svg>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npx vitest run src/__tests__/website/showcaseWebsite.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add website/styles/theme.css website/assets/favicon.svg src/__tests__/website/showcaseWebsite.test.ts
rtk git commit -m "feat(website): scaffold theme tokens, favicon and zero-telemetry test suite"
```

---

### Task 2: High-Fidelity SVG Brand Mark & Diagram Illustration Assets

**Files:**
- Create: `website/assets/logo-placeholder.svg`
- Create: `website/assets/icons/hero-structure.svg`
- Modify: `src/__tests__/website/showcaseWebsite.test.ts`

**Interfaces:**
- Consumes: `website/styles/theme.css`
- Produces: Reusable standalone SVG assets for brand logo placeholder and high-fidelity fiduciary structure diagram illustration (Trust $\to$ HoldCo $\to$ OpCo/SPV/Nominee).

- [ ] **Step 1: Write the failing test for SVG assets**

Add to `src/__tests__/website/showcaseWebsite.test.ts`:
```typescript
  it('logo-placeholder.svg and hero-structure.svg exist and contain valid SVG markup', () => {
    const logoSvg = fs.readFileSync(path.join(websiteDir, 'assets', 'logo-placeholder.svg'), 'utf-8');
    expect(logoSvg).toContain('<svg');
    expect(logoSvg).toContain('JERMChart');
    
    const heroSvg = fs.readFileSync(path.join(websiteDir, 'assets', 'icons', 'hero-structure.svg'), 'utf-8');
    expect(heroSvg).toContain('<svg');
    expect(heroSvg).toContain('Apex International Trust');
    expect(heroSvg).toContain('Global Holdings Ltd');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npx vitest run src/__tests__/website/showcaseWebsite.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `logo-placeholder.svg` and `hero-structure.svg`**

Create `website/assets/logo-placeholder.svg`:
- Clean, modular brand mark with hierarchy node iconography, glowing gradient, and crisp text "JERMChart".
- Well commented for easy swapping when actual final logo is provided.

Create `website/assets/icons/hero-structure.svg`:
- 800x480 desktop window SVG canvas showing:
  - Trust card: Amber border, "Apex International Trust", "Cayman Islands", Settlor & Protector details.
  - 100% ownership orthogonal stepped connector.
  - Holding Company: Sky blue border, "Global Holdings Ltd", "British Virgin Islands", Director list.
  - Subsidiary connectors to 3 cards:
    - "Asia Operating Subsidiary Co" (Emerald, 100% Owned, Hong Kong)
    - "European Real Estate SPV" (Emerald, 75% JV, Luxembourg)
    - "Private Banking Nominee" (Indigo, Custodian, Singapore)
  - Orthogonal stepped connector lines with percentage tags (`100%`, `75%`).

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npx vitest run src/__tests__/website/showcaseWebsite.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add website/assets/logo-placeholder.svg website/assets/icons/hero-structure.svg src/__tests__/website/showcaseWebsite.test.ts
rtk git commit -m "feat(website): add swappable logo placeholder and hero structure diagram SVG"
```

---

### Task 3: Base Styles & Component Layout CSS (`main.css` & `components.css`)

**Files:**
- Create: `website/styles/main.css`
- Create: `website/styles/components.css`
- Modify: `src/__tests__/website/showcaseWebsite.test.ts`

**Interfaces:**
- Consumes: `website/styles/theme.css`
- Produces: Complete responsive styling for sticky glassmorphism header, hero banner, showcase window with glowing pins, feature grid cards, technical security cards, terminal snippet, modals, and footer.

- [ ] **Step 1: Write test verifying CSS rule definitions and responsive breakpoints**

Add to `src/__tests__/website/showcaseWebsite.test.ts`:
```typescript
  it('main.css and components.css define required layout classes', () => {
    const mainCss = fs.readFileSync(path.join(websiteDir, 'styles', 'main.css'), 'utf-8');
    expect(mainCss).toContain('box-sizing: border-box');
    expect(mainCss).toContain('font-family: var(--font-sans)');

    const compCss = fs.readFileSync(path.join(websiteDir, 'styles', 'components.css'), 'utf-8');
    expect(compCss).toContain('.navbar');
    expect(compCss).toContain('.hero-section');
    expect(compCss).toContain('.feature-grid');
    expect(compCss).toContain('.callout-pin');
    expect(compCss).toContain('.modal-dialog');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npx vitest run src/__tests__/website/showcaseWebsite.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `website/styles/main.css` and `website/styles/components.css`**

`website/styles/main.css`:
- Box-sizing reset, smooth scroll behavior (`scroll-behavior: smooth;`).
- Custom dark scrollbar matching JERMChart.
- Container utilities (`.container`, `.section-title`, `.section-subtitle`, `.badge-pill`).
- Responsive typography and layout utilities.

`website/styles/components.css`:
- `.navbar`: Sticky glassmorphism header (`backdrop-filter: blur(12px); background: var(--color-bg-glass);`).
- `.hero-section`: Grid layout with headline, subhead, CTA buttons with glowing hover effects.
- `.showcase-window`: Desktop window frame with macOS-style window controls, titlebar, canvas grid background, and embedded diagram.
- `.callout-pin`: Pulsing beacon pins (`@keyframes pulse-ring`) with rich hover tooltips detailing Dagre layout, director spotlight, AES-256 encryption, and AI OCR vision.
- `.metric-strip`: Dark glass pill strip showcasing 100% Client-Side, 460+ Tests, AES-256-GCM, MIT License.
- `.feature-grid`: 6-card responsive CSS grid with subtle gradient borders (`linear-gradient(135deg, rgba(2, 132, 199, 0.4), transparent)`), hover lifts, and category tags.
- `.security-section`: 4-column cards detailing compile-time AST restrictions, Electron runtime firewall, offline vendored assets, and local PBKDF2 encryption.
- `.terminal-card`: Mac terminal card with prompt, copy-to-clipboard button, and tabbed developer commands.
- `.modal-dialog`: Backdrop overlay, animated dialog box, close button, and typography for Privacy Policy & Terms of Use.
- `.site-footer`: Multi-column layout with social placeholders, legal links, and copyright.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npx vitest run src/__tests__/website/showcaseWebsite.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add website/styles/main.css website/styles/components.css src/__tests__/website/showcaseWebsite.test.ts
rtk git commit -m "feat(website): implement main layout and component styles"
```

---

### Task 4: Interactive Client Scripts (`main.js` & `mockup-callouts.js`)

**Files:**
- Create: `website/scripts/main.js`
- Create: `website/scripts/mockup-callouts.js`
- Modify: `src/__tests__/website/showcaseWebsite.test.ts`

**Interfaces:**
- Consumes: DOM elements from `index.html` (Header, Nav links, Modals, Copy buttons, Callout pins)
- Produces:
  - `initNavigation()`: Active link highlighting on scroll (ScrollSpy) and smooth scroll fallback.
  - `initModals()`: Open/close modal logic for Privacy Policy and Terms of Use with Escape key listener and backdrop click handling.
  - `initCopySnippet()`: Clipboard copy handler with visual feedback for developer install commands.
  - `initMockupCallouts()`: Keyboard accessibility and active state management for diagram pins.

- [ ] **Step 1: Write test for script exports and behavior in JSDOM**

Add to `src/__tests__/website/showcaseWebsite.test.ts`:
```typescript
  it('main.js and mockup-callouts.js provide required browser interaction handlers', () => {
    const mainJs = fs.readFileSync(path.join(websiteDir, 'scripts', 'main.js'), 'utf-8');
    expect(mainJs).toContain('initNavigation');
    expect(mainJs).toContain('initModals');
    expect(mainJs).toContain('initCopySnippet');

    const calloutsJs = fs.readFileSync(path.join(websiteDir, 'scripts', 'mockup-callouts.js'), 'utf-8');
    expect(calloutsJs).toContain('initMockupCallouts');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npx vitest run src/__tests__/website/showcaseWebsite.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `website/scripts/main.js` and `website/scripts/mockup-callouts.js`**

Implement `website/scripts/main.js`:
- Vanilla JS, adhering to Rule 4 (cognitive complexity < 15, guard returns, early exit).
- Event listeners for modal dialog toggling (`openModal(id)`, `closeModal(id)`).
- Accessibility: Trap focus or close modal on `Escape` key.
- One-click copy handler with animated "Copied!" badge feedback.

Implement `website/scripts/mockup-callouts.js`:
- Pin focus and click/hover tooltip management.
- Handles both touch devices and mouse hovers cleanly.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npx vitest run src/__tests__/website/showcaseWebsite.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add website/scripts/main.js website/scripts/mockup-callouts.js src/__tests__/website/showcaseWebsite.test.ts
rtk git commit -m "feat(website): implement navigation, modal dialogs, and callout scripts"
```

---

### Task 5: Single-Page HTML Document Assembly (`index.html`)

**Files:**
- Create: `website/index.html`
- Modify: `src/__tests__/website/showcaseWebsite.test.ts`

**Interfaces:**
- Consumes: `website/styles/*.css`, `website/scripts/*.js`, `website/assets/*`
- Produces: The complete, single-page semantic HTML5 showcase document with all sections, hero mockup, callout pins, 6 capability cards, zero-telemetry security deep-dive, quick start terminal, social placeholders, and legal modals.

- [ ] **Step 1: Write test verifying HTML markup validity and all required sections**

Add to `src/__tests__/website/showcaseWebsite.test.ts`:
```typescript
  it('index.html contains all required sections, anchors, and modal containers', () => {
    const html = fs.readFileSync(path.join(websiteDir, 'index.html'), 'utf-8');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>JERMChart - Fiduciary Structure Chart Utility</title>');
    
    // Check navigation anchors
    expect(html).toContain('id="features"');
    expect(html).toContain('id="capabilities"');
    expect(html).toContain('id="security"');
    expect(html).toContain('id="exports"');
    expect(html).toContain('id="quickstart"');

    // Check CTAs
    expect(html).toContain('Download for Windows');
    expect(html).toContain('https://github.com/duracellrabbid/JERMChart');

    // Check Callout Pins
    expect(html).toContain('data-pin="dagre"');
    expect(html).toContain('data-pin="directors"');
    expect(html).toContain('data-pin="encryption"');
    expect(html).toContain('data-pin="vision"');

    // Check Placeholders
    expect(html).toContain('id="privacy-modal"');
    expect(html).toContain('id="terms-modal"');
    expect(html).toContain('aria-label="Social Link: X"');
    expect(html).toContain('aria-label="Social Link: LinkedIn"');
    expect(html).toContain('aria-label="Social Link: Discord"');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npx vitest run src/__tests__/website/showcaseWebsite.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `website/index.html`**

Craft the complete, accessible, semantic HTML5 document:
- `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- SEO meta tags (title, description, Open Graph, Twitter card).
- `<header class="navbar">`: Sticky glassmorphic navigation with swappable logo placeholder, anchor links, GitHub Stars button, and "Download for Windows" CTA.
- `<section class="hero-section">`: Headline, pill badge, subhead, primary/secondary action buttons, and high-fidelity desktop mockup with pulsing callout pins.
- `<section class="metrics-section">`: Trust bar (100% Client-Side, 460+ Tests, AES-256-GCM, MIT License).
- `<section id="features" class="features-section">`: 6 capability cards (Layout, Entities, Sibling Sort, Directors, Exports, AI OCR).
- `<section id="security" class="security-section">`: Deep-dive into client-side security and zero-telemetry guarantee.
- `<section id="exports" class="exports-section">`: Visual showcase of PDF, PPTX, Excel, and AES-256 encrypted JSON exports.
- `<section id="quickstart" class="quickstart-section">`: Dual cards for Windows `.exe` download and developer terminal clone commands.
- `<footer class="site-footer">`: Social media placeholders, legal links, copyright, and MIT License badge.
- `<div id="privacy-modal" class="modal-dialog">` & `<div id="terms-modal" class="modal-dialog">`: Accessible dialog modals with comprehensive, realistic fiduciary-grade placeholder text.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npx vitest run src/__tests__/website/showcaseWebsite.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add website/index.html src/__tests__/website/showcaseWebsite.test.ts
rtk git commit -m "feat(website): assemble complete single-page showcase document"
```

---

### Task 6: End-to-End Verification & Pre-Commit Quality Gate

**Files:**
- Modify: `README.md` (add mention of website/ showcase and how to deploy it)
- Run: `rtk npm run verify:pre-commit`
- Run: `rtk npm run verify:pre-push`

- [ ] **Step 1: Document `website/` in `README.md`**

Add a brief section in `README.md` explaining the `website/` folder and how to preview/deploy it:
```markdown
## Showcase Website

A standalone, zero-telemetry showcase landing page is available in the `website/` directory. It requires zero build tools and can be previewed or deployed directly to any static web server (such as GitHub Pages or Nginx):

```bash
# Preview locally:
npx serve website
# or with Python:
python -m http.server 8000 --directory website
```
```

- [ ] **Step 2: Run pre-commit quality gate**

Run: `rtk npm run verify:pre-commit`
Expected:
- ESLint: zero errors, cognitive complexity < 15, linear regexes
- Vitest: all test suites pass with 100% coverage threshold

- [ ] **Step 3: Run pre-push quality gate**

Run: `rtk npm run verify:pre-push`
Expected:
- Production build passes
- Security audit passes with 0 moderate or higher vulnerabilities

- [ ] **Step 4: Commit**

```bash
rtk git add README.md
rtk git commit -m "docs: document showcase website in README"
```
