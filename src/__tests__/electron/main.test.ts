import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('electron/main.cjs', () => {
  const originalEnv = { ...process.env };
  const originalPlatform = process.platform;

  let mockApp: any;
  let mockBrowserWindowInstances: any[];
  let MockBrowserWindow: any;
  let mockMenu: any;
  let mockShell: any;
  let mockSession: any;
  let registeredListeners: Record<string, Function>;

  beforeEach(() => {
    vi.resetModules();
    registeredListeners = {};
    mockBrowserWindowInstances = [];

    mockApp = {
      isPackaged: false,
      commandLine: {
        appendSwitch: vi.fn(),
      },
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

    mockSession = {
      defaultSession: {
        webRequest: {
          onBeforeRequest: vi.fn(),
        },
      },
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
        session: mockSession,
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

  it('appends Chromium privacy and zero-telemetry switches on startup', () => {
    const mainModule = loadMain();
    expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('disable-background-networking');
    expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('disable-component-update');
    expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('disable-domain-reliability');
    expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('disable-sync');
    expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('metrics-recording-only');
    expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('no-report-upload');
    expect(mainModule.PRIVACY_SWITCHES).toHaveLength(6);
  });

  it('handles case when app.commandLine is missing', () => {
    mockApp.commandLine = undefined;
    const mainModule = loadMain();
    expect(mainModule).toBeDefined();
  });

  it('validates allowed and blocked URLs via isAllowedUrl', () => {
    const { isAllowedUrl } = loadMain();

    // Local / internal protocol resources
    expect(isAllowedUrl('file:///path/to/dist/index.html', false)).toBe(true);
    expect(isAllowedUrl('devtools://devtools/bundled/inspector.html', false)).toBe(true);
    expect(isAllowedUrl('blob:http://localhost:5173/uuid-here', false)).toBe(true);
    expect(isAllowedUrl('data:image/png;base64,abc123', false)).toBe(true);

    // Dev server allowed only in development
    expect(isAllowedUrl('http://localhost:5173', true)).toBe(true);
    expect(isAllowedUrl('http://127.0.0.1:8080', true)).toBe(true);
    expect(isAllowedUrl('http://localhost:5173', false)).toBe(false);
    expect(isAllowedUrl('http://127.0.0.1:8080', false)).toBe(false);
    expect(isAllowedUrl('http://other-site.com', true)).toBe(false);
    expect(isAllowedUrl('http://other-site.com', false)).toBe(false);

    // Approved AI vision host in dev and prod
    expect(
      isAllowedUrl('https://generativelanguage.googleapis.com/v1beta/models', false)
    ).toBe(true);
    expect(
      isAllowedUrl('https://generativelanguage.googleapis.com/v1beta/models', true)
    ).toBe(true);
    expect(
      isAllowedUrl('http://generativelanguage.googleapis.com/v1beta/models', false)
    ).toBe(false); // Insecure HTTP blocked
    expect(
      isAllowedUrl('http://generativelanguage.googleapis.com/v1beta/models', true)
    ).toBe(false);

    // Unauthorized external hosts blocked in dev and prod
    expect(isAllowedUrl('https://api.openai.com/v1', false)).toBe(false);
    expect(isAllowedUrl('https://api.openai.com/v1', true)).toBe(false);
    expect(isAllowedUrl('https://evil-analytics.com/collect', true)).toBe(false);
    expect(isAllowedUrl('https://telemetry.example.org', false)).toBe(false);
    expect(isAllowedUrl('http://unauthorized.org', true)).toBe(false);

    // Malformed URL blocked safely
    expect(isAllowedUrl('not-a-valid-url', false)).toBe(false);
  });

  it('sets up security firewall and intercepts requests in dev mode', () => {
    const { setupSecurityFirewall } = loadMain();

    expect(mockSession.defaultSession.webRequest.onBeforeRequest).toHaveBeenCalled();
    const interceptor =
      mockSession.defaultSession.webRequest.onBeforeRequest.mock.calls[0][0];

    const mockCallback = vi.fn();

    // Allowed: file protocol
    interceptor(
      { url: 'file:///path/to/dist/index.html' },
      mockCallback
    );
    expect(mockCallback).toHaveBeenCalledWith({ cancel: false });

    // Allowed: dev server localhost
    interceptor(
      { url: 'http://localhost:5173/src/main.tsx' },
      mockCallback
    );
    expect(mockCallback).toHaveBeenCalledWith({ cancel: false });

    // Allowed: Gemini API
    interceptor(
      { url: 'https://generativelanguage.googleapis.com/test' },
      mockCallback
    );
    expect(mockCallback).toHaveBeenCalledWith({ cancel: false });

    // Blocked: unauthorized external host
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    interceptor({ url: 'https://leak-data.com/track' }, mockCallback);
    expect(mockCallback).toHaveBeenCalledWith({ cancel: true });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[BLOCKED EGRESS]')
    );
    warnSpy.mockRestore();

    // Handles null / empty session gracefully
    expect(() => setupSecurityFirewall(null)).not.toThrow();
    expect(() => setupSecurityFirewall({ webRequest: null })).not.toThrow();
  });

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

    // Test firewall in production mode
    expect(mockSession.defaultSession.webRequest.onBeforeRequest).toHaveBeenCalled();
    const prodInterceptor =
      mockSession.defaultSession.webRequest.onBeforeRequest.mock.calls[0][0];

    const mockProdCallback = vi.fn();

    // Allowed in prod: file protocol
    prodInterceptor({ url: 'file:///dist/index.html' }, mockProdCallback);
    expect(mockProdCallback).toHaveBeenCalledWith({ cancel: false });

    // Allowed in prod: Gemini API
    prodInterceptor(
      { url: 'https://generativelanguage.googleapis.com/v1beta' },
      mockProdCallback
    );
    expect(mockProdCallback).toHaveBeenCalledWith({ cancel: false });

    // Blocked in prod: localhost
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    prodInterceptor({ url: 'http://localhost:5173' }, mockProdCallback);
    expect(mockProdCallback).toHaveBeenCalledWith({ cancel: true });
    warnSpy.mockRestore();
  });

  it('handles app activate event: creates window if none exist', () => {
    loadMain();
    expect(mockBrowserWindowInstances.length).toBe(1);

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
