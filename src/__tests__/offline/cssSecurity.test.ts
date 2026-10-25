import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('CSS Security & Offline Isolation Suite', () => {
  const srcDir = path.resolve(__dirname, '../../');
  const localXyflowCssPath = path.resolve(srcDir, 'styles/xyflow-base.css');
  const structureCanvasPath = path.resolve(srcDir, 'components/canvas/StructureCanvas.tsx');

  function getCssFilesRecursively(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getCssFilesRecursively(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.css')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  it('guarantees local xyflow-base.css exists and is populated', () => {
    expect(fs.existsSync(localXyflowCssPath)).toBe(true);
    const content = fs.readFileSync(localXyflowCssPath, 'utf-8');
    expect(content.trim().length).toBeGreaterThan(100);
  });

  it('verifies StructureCanvas does not import CSS directly from node_modules', () => {
    expect(fs.existsSync(structureCanvasPath)).toBe(true);
    const content = fs.readFileSync(structureCanvasPath, 'utf-8');
    expect(content).not.toMatch(/import\s+['"][^'"]*@xyflow\/react[^'"]*\.css['"]/);
  });

  it('verifies all src CSS files contain zero remote url(), external @import, or dangerous primitives', () => {
    const cssFiles = getCssFilesRecursively(srcDir);
    expect(cssFiles.length).toBeGreaterThan(0);

    for (const filePath of cssFiles) {
      const relativePath = path.relative(srcDir, filePath);
      const rawContent = fs.readFileSync(filePath, 'utf-8');
      // Strip block comments /* ... */ to prevent false positives in comments
      const content = rawContent.replace(/\/\*[\s\S]*?\*\//g, '');

      // Rule 1: No url() network calls (background-image, cursor, font-face, etc.)
      expect(
        content,
        `File ${relativePath} contains forbidden url() network primitive`
      ).not.toMatch(/url\s*\(/i);

      // Rule 2: No remote @import (http, https, //)
      expect(
        content,
        `File ${relativePath} contains forbidden remote @import`
      ).not.toMatch(/@import\s+['"](https?:|\/\/)/i);

      // Rule 3: No legacy IE expression() or behavior/binding execution
      expect(content).not.toMatch(/expression\s*\(/i);
      expect(content).not.toMatch(/behavior\s*:/i);
      expect(content).not.toMatch(/-moz-binding\s*:/i);
    }
  });
});
