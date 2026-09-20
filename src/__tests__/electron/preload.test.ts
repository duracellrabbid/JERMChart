import { describe, it, expect, vi } from 'vitest';

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
});
