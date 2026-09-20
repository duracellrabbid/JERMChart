import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('electron/main.cjs', () => {
  const originalEnv = { ...process.env };
  const originalPlatform = process.platform;

  let mockApp: any;
  let mockBrowserWindowInstances: any[];
  let MockBrowserWindow: any;
  let mockMenu: any;
  let mockShell: any;
  let registeredListeners: Record<string, Function>;

  beforeEach(() => {
    vi.resetModules();
    registeredListeners = {};
    mockBrowserWindowInstances = [];

    mockApp = {
      isPackaged: false,
      whenReady: vi.fn(() => ({
        then: (callback: () => void) => {
          callback();
          return Promise.resolve();
        },
      })),
      on: vi.fn((event: string, handler: Function) => {
        registeredListeners[event] = handler;
      }),
      quit: vi.fn(),
    };

    MockBrowserWindow = class {
      static getAllWindows = vi.fn(() => mockBrowserWindowInstances);
      reload = vi.fn();
      loadURL = vi.fn();
      loadFile = vi.fn();
      webContents = {
        setWindowOpenHandler: vi.fn(),
      };
      options: any;
      constructor(options: any) {
        this.options = options;
        mockBrowserWindowInstances.push(this);
      }
    };

    mockMenu = {
      buildFromTemplate: vi.fn((template: any) => template),
      setApplicationMenu: vi.fn(),
    };

    mockShell = {
      openExternal: vi.fn().mockResolvedValue(undefined),
    };

    const electronResolved = require.resolve('electron');
    require.cache[electronResolved] = {
      id: electronResolved,
      filename: electronResolved,
      loaded: true,
      exports: {
        app: mockApp,
        BrowserWindow: MockBrowserWindow,
        Menu: mockMenu,
        shell: mockShell,
      },
    } as any;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      configurable: true,
    });
    const mainResolved = require.resolve('../../../electron/main.cjs');
    delete require.cache[mainResolved];
  });

  const loadMain = () => {
    const mainResolved = require.resolve('../../../electron/main.cjs');
    delete require.cache[mainResolved];
    return require('../../../electron/main.cjs');
  };

  it('initializes window with dev defaults when in development', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.VITE_DEV_SERVER_URL;
    mockApp.isPackaged = false;

    loadMain();

    expect(mockApp.whenReady).toHaveBeenCalled();
    expect(mockBrowserWindowInstances.length).toBe(1);

    const win = mockBrowserWindowInstances[0];
    expect(win.options.width).toBe(1400);
    expect(win.options.height).toBe(900);
    expect(win.loadURL).toHaveBeenCalledWith('http://localhost:5173');

    // Verify Menu template
    expect(mockMenu.buildFromTemplate).toHaveBeenCalled();
    const template = mockMenu.buildFromTemplate.mock.calls[0][0];
    const fileMenu = template.find((m: any) => m.label === 'File');
    const viewMenu = template.find((m: any) => m.label === 'View');
    const helpMenu = template.find((m: any) => m.label === 'Help');

    expect(fileMenu).toBeDefined();
    expect(viewMenu).toBeDefined();
    expect(helpMenu).toBeDefined();

    // DevTools separator and role included in dev mode
    expect(viewMenu.submenu.some((item: any) => item.role === 'toggleDevTools')).toBe(true);

    // Test File menu clicks: Reload Chart
    const reloadItem = fileMenu.submenu.find((item: any) => item.label === 'Reload Chart');
    reloadItem.click();
    expect(win.reload).toHaveBeenCalled();

    // Test File menu clicks: Exit
    const exitItem = fileMenu.submenu.find((item: any) => item.label === 'Exit');
    exitItem.click();
    expect(mockApp.quit).toHaveBeenCalled();

    // Test Help menu click
    const helpDocItem = helpMenu.submenu.find((item: any) => item.label === 'Documentation & Help');
    await helpDocItem.click();
    expect(mockShell.openExternal).toHaveBeenCalledWith('https://github.com');

    // Test setWindowOpenHandler
    expect(win.webContents.setWindowOpenHandler).toHaveBeenCalled();
    const openHandler = win.webContents.setWindowOpenHandler.mock.calls[0][0];
    const openResult = openHandler({ url: 'https://example.com/ext' });
    expect(mockShell.openExternal).toHaveBeenCalledWith('https://example.com/ext');
    expect(openResult).toEqual({ action: 'deny' });
  });

  it('uses custom VITE_DEV_SERVER_URL when defined in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.VITE_DEV_SERVER_URL = 'http://127.0.0.1:8080';
    mockApp.isPackaged = false;

    loadMain();

    const win = mockBrowserWindowInstances[0];
    expect(win.loadURL).toHaveBeenCalledWith('http://127.0.0.1:8080');
  });

  it('loads production file when packaged and not development', () => {
    process.env.NODE_ENV = 'production';
    mockApp.isPackaged = true;

    loadMain();

    const win = mockBrowserWindowInstances[0];
    expect(win.loadFile).toHaveBeenCalledWith(expect.stringContaining('dist'));
    expect(win.loadURL).not.toHaveBeenCalled();

    const template = mockMenu.buildFromTemplate.mock.calls[0][0];
    const viewMenu = template.find((m: any) => m.label === 'View');
    expect(viewMenu.submenu.some((item: any) => item.role === 'toggleDevTools')).toBe(false);
  });

  it('handles app activate event: creates window if none exist', () => {
    loadMain();
    expect(mockBrowserWindowInstances.length).toBe(1);

    // Simulate all windows closed then activate
    mockBrowserWindowInstances = [];
    MockBrowserWindow.getAllWindows.mockReturnValue([]);

    registeredListeners['activate']();
    expect(mockBrowserWindowInstances.length).toBe(1);
  });

  it('handles app activate event: does not create window if windows already exist', () => {
    loadMain();
    expect(mockBrowserWindowInstances.length).toBe(1);

    MockBrowserWindow.getAllWindows.mockReturnValue(mockBrowserWindowInstances);
    registeredListeners['activate']();
    expect(mockBrowserWindowInstances.length).toBe(1);
  });

  it('quits on window-all-closed when platform is not darwin', () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      configurable: true,
    });

    loadMain();
    registeredListeners['window-all-closed']();
    expect(mockApp.quit).toHaveBeenCalled();
  });

  it('does not quit on window-all-closed when platform is darwin (macOS)', () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      configurable: true,
    });

    loadMain();
    registeredListeners['window-all-closed']();
    expect(mockApp.quit).not.toHaveBeenCalled();
  });
});
