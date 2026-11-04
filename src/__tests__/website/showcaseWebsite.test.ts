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
