/* eslint-disable sonarjs/code-eval */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';

function loadScriptInWindow(scriptContent: string) {
  vm.runInThisContext(scriptContent);
}

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

  it('logo-placeholder.svg and hero-structure.svg exist and contain valid SVG markup', () => {
    const logoSvg = fs.readFileSync(path.join(websiteDir, 'assets', 'logo-placeholder.svg'), 'utf-8');
    expect(logoSvg).toContain('<svg');
    expect(logoSvg).toContain('JERMChart');

    const heroSvg = fs.readFileSync(path.join(websiteDir, 'assets', 'icons', 'hero-structure.svg'), 'utf-8');
    expect(heroSvg).toContain('<svg');
    expect(heroSvg).toContain('Apex International Trust');
    expect(heroSvg).toContain('Global Holdings Ltd');
  });

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

  it('main.js and mockup-callouts.js provide required browser interaction handlers', () => {
    const mainJs = fs.readFileSync(path.join(websiteDir, 'scripts', 'main.js'), 'utf-8');
    expect(mainJs).toContain('initNavigation');
    expect(mainJs).toContain('initModals');
    expect(mainJs).toContain('initCopySnippet');

    const calloutsJs = fs.readFileSync(path.join(websiteDir, 'scripts', 'mockup-callouts.js'), 'utf-8');
    expect(calloutsJs).toContain('initMockupCallouts');
  });

  describe('Client Script DOM Interactive Behavior', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
      vi.restoreAllMocks();
    });

    it('initModals manages opening, closing, backdrop clicks, and Escape key', () => {
      document.body.innerHTML = `
        <button id="open-btn" data-modal-target="test-modal">Open</button>
        <div id="test-modal" class="modal-dialog" aria-hidden="true">
          <div class="modal-backdrop"></div>
          <div class="modal-content">
            <button class="modal-close" aria-label="Close">&times;</button>
            <p>Modal Body</p>
          </div>
        </div>
      `;

      // Initialize modals
      const mainJs = fs.readFileSync(path.join(websiteDir, 'scripts', 'main.js'), 'utf-8');
      loadScriptInWindow(mainJs);
      const api = (window as unknown as { JERMWebsite: { openModal: (id: string) => void; closeModal: (id: string) => void; initModals: () => void } }).JERMWebsite;
      api.initModals();

      const modal = document.getElementById('test-modal')!;
      const openBtn = document.getElementById('open-btn')!;
      const closeBtn = modal.querySelector('.modal-close') as HTMLElement;
      const backdrop = modal.querySelector('.modal-backdrop') as HTMLElement;

      // 1. Initial state
      expect(modal.classList.contains('open')).toBe(false);
      expect(modal.getAttribute('aria-hidden')).toBe('true');

      // 2. Open via trigger click
      openBtn.click();
      expect(modal.classList.contains('open')).toBe(true);
      expect(modal.getAttribute('aria-hidden')).toBe('false');
      expect(document.body.style.overflow).toBe('hidden');

      // 3. Close via close button
      closeBtn.click();
      expect(modal.classList.contains('open')).toBe(false);
      expect(modal.getAttribute('aria-hidden')).toBe('true');
      expect(document.body.style.overflow).toBe('');

      // 4. Open again and close via backdrop click
      openBtn.click();
      expect(modal.classList.contains('open')).toBe(true);
      backdrop.click();
      expect(modal.classList.contains('open')).toBe(false);

      // 5. Open again and close via Escape key
      openBtn.click();
      expect(modal.classList.contains('open')).toBe(true);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(modal.classList.contains('open')).toBe(false);

      // 6. Direct programmatic window.JERMWebsite openModal & closeModal API
      api.openModal('test-modal');
      expect(modal.classList.contains('open')).toBe(true);
      api.closeModal('test-modal');
      expect(modal.classList.contains('open')).toBe(false);
    });

    it('initCopySnippet copies command text and displays visual feedback', async () => {
      document.body.innerHTML = `
        <div class="terminal-card">
          <div class="terminal-tabs">
            <button class="terminal-tab active" data-command="git clone https://github.com/duracellrabbid/JERMChart.git">Git</button>
            <button class="terminal-tab" data-command="npm install">NPM</button>
          </div>
          <div class="terminal-actions">
            <span class="copied-feedback" style="display: none;">Copied!</span>
            <button class="copy-btn">Copy</button>
          </div>
          <div class="terminal-body">
            <div class="terminal-command">git clone https://github.com/duracellrabbid/JERMChart.git</div>
          </div>
        </div>
      `;

      let clipboardWritten = '';
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn(async (text: string) => {
            clipboardWritten = text;
            return Promise.resolve();
          }),
        },
      });

      const mainJs = fs.readFileSync(path.join(websiteDir, 'scripts', 'main.js'), 'utf-8');
      loadScriptInWindow(mainJs);
      const api = (window as unknown as { JERMWebsite: { initCopySnippet: () => void } }).JERMWebsite;
      api.initCopySnippet();

      const copyBtn = document.querySelector('.copy-btn') as HTMLElement;
      const feedback = document.querySelector('.copied-feedback') as HTMLElement;
      const tabs = document.querySelectorAll('.terminal-tab');

      // Click copy button
      copyBtn.click();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(clipboardWritten).toBe('git clone https://github.com/duracellrabbid/JERMChart.git');
      expect(feedback.style.display).not.toBe('none');

      // Click tab to switch command
      (tabs[1] as HTMLElement).click();
      expect(tabs[1].classList.contains('active')).toBe(true);
      expect(tabs[0].classList.contains('active')).toBe(false);
      const commandEl = document.querySelector('.terminal-command') as HTMLElement;
      expect(commandEl.textContent).toBe('npm install');

      // Click copy again for new tab command
      copyBtn.click();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(clipboardWritten).toBe('npm install');
    });

    it('initMockupCallouts handles pin focus, click toggles, keyboard accessibility and click-outside', () => {
      document.body.innerHTML = `
        <div class="showcase-diagram-container">
          <button class="callout-pin" data-pin="dagre" aria-label="Layout Pin">
            <div class="pin-beacon"><div class="pin-core"></div></div>
            <div class="pin-tooltip">
              <div class="pin-tooltip-title">Deterministic Hierarchy</div>
              <div class="pin-tooltip-desc">Layout description</div>
            </div>
          </button>
          <button class="callout-pin" data-pin="directors" aria-label="Director Pin">
            <div class="pin-beacon"><div class="pin-core"></div></div>
            <div class="pin-tooltip">
              <div class="pin-tooltip-title">Director Cross-Reference</div>
              <div class="pin-tooltip-desc">Director description</div>
            </div>
          </button>
          <div id="outside-area">Outside</div>
        </div>
      `;

      const calloutsJs = fs.readFileSync(path.join(websiteDir, 'scripts', 'mockup-callouts.js'), 'utf-8');
      loadScriptInWindow(calloutsJs);
      const api = (window as unknown as { JERMWebsite: { initMockupCallouts: () => void } }).JERMWebsite;
      api.initMockupCallouts();

      const pins = document.querySelectorAll('.callout-pin');
      const pin1 = pins[0] as HTMLElement;
      const pin2 = pins[1] as HTMLElement;
      const outside = document.getElementById('outside-area')!;

      // 1. Initial accessibility attributes
      expect(pin1.getAttribute('role')).toBe('button');
      expect(pin1.getAttribute('tabindex')).toBe('0');
      expect(pin1.getAttribute('aria-expanded')).toBe('false');

      // 2. Click pin 1 activates it
      pin1.click();
      expect(pin1.classList.contains('active')).toBe(true);
      expect(pin1.getAttribute('aria-expanded')).toBe('true');
      expect(pin2.classList.contains('active')).toBe(false);

      // 3. Click pin 2 switches active pin
      pin2.click();
      expect(pin1.classList.contains('active')).toBe(false);
      expect(pin1.getAttribute('aria-expanded')).toBe('false');
      expect(pin2.classList.contains('active')).toBe(true);
      expect(pin2.getAttribute('aria-expanded')).toBe('true');

      // 4. Click pin 2 again toggles it off
      pin2.click();
      expect(pin2.classList.contains('active')).toBe(false);
      expect(pin2.getAttribute('aria-expanded')).toBe('false');

      // 5. Keyboard accessibility: Enter or Space toggles pin
      pin1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(pin1.classList.contains('active')).toBe(true);

      pin1.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(pin1.classList.contains('active')).toBe(false);

      // 6. Escape key dismisses active pin
      pin1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(pin1.classList.contains('active')).toBe(true);
      pin1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(pin1.classList.contains('active')).toBe(false);

      // 7. Click outside closes pin
      pin1.click();
      expect(pin1.classList.contains('active')).toBe(true);
      outside.click();
      expect(pin1.classList.contains('active')).toBe(false);
    });

    it('initNavigation sets up smooth scrolling and anchor click handlers', () => {
      document.body.innerHTML = `
        <header class="navbar">
          <ul class="nav-links">
            <li><a class="nav-link active" href="#features">Features</a></li>
            <li><a class="nav-link" href="#security">Security</a></li>
          </ul>
        </header>
        <section id="features">Features Content</section>
        <section id="security">Security Content</section>
      `;

      const featuresEl = document.getElementById('features')!;
      featuresEl.scrollIntoView = vi.fn();
      const securityEl = document.getElementById('security')!;
      securityEl.scrollIntoView = vi.fn();

      const mainJs = fs.readFileSync(path.join(websiteDir, 'scripts', 'main.js'), 'utf-8');
      loadScriptInWindow(mainJs);
      const api = (window as unknown as { JERMWebsite: { initNavigation: () => void } }).JERMWebsite;
      api.initNavigation();

      const navLinks = document.querySelectorAll('.nav-link');
      const securityLink = navLinks[1] as HTMLElement;

      securityLink.click();
      expect(securityEl.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });
});
