import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const { mockExposeInMainWorld } = vi.hoisted(() => ({
  mockExposeInMainWorld: vi.fn(),
}));

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: mockExposeInMainWorld,
  },
}));

describe('electron/preload.cjs', () => {
  it('exposes desktopApp API to main world via contextBridge', () => {
    const mockExpose = vi.fn();
    const electronResolved = require.resolve('electron');
    require.cache[electronResolved] = {
      id: electronResolved,
      filename: electronResolved,
      loaded: true,
      exports: {
        contextBridge: {
          exposeInMainWorld: mockExpose,
        },
      },
    } as any;

    // Clear preload.cjs from cache if already required
    const preloadResolved = require.resolve('../../../electron/preload.cjs');
    delete require.cache[preloadResolved];

    require('../../../electron/preload.cjs');

    expect(mockExpose).toHaveBeenCalledWith('desktopApp', {
      isDesktop: true,
      platform: process.platform,
    });
  });

  it('verifies electron-builder.json isolates production bundles from test files', () => {
    const configPath = path.resolve(__dirname, '../../../electron-builder.json');
    expect(fs.existsSync(configPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(config.files).toEqual([
      'dist/**/*',
      'electron/**/*',
      'package.json',
    ]);
    expect(config.extraMetadata?.main).toBe('electron/main.cjs');
    expect(config.directories?.output).toBe('release');
  });
});
