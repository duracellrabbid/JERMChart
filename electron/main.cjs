const { app, BrowserWindow, Menu, shell, session } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Privacy and zero-telemetry hardening: suppress Chromium background networking and telemetry
const PRIVACY_SWITCHES = [
  'disable-background-networking',
  'disable-component-update',
  'disable-domain-reliability',
  'disable-sync',
  'metrics-recording-only',
  'no-report-upload',
];

if (app.commandLine && typeof app.commandLine.appendSwitch === 'function') {
  PRIVACY_SWITCHES.forEach((switchName) => {
    app.commandLine.appendSwitch(switchName);
  });
}

const ALLOWED_PROTOCOLS = new Set(['file:', 'devtools:', 'blob:', 'data:']);
const DEV_HOSTS = new Set(['localhost', '127.0.0.1']);
const ALLOWED_OLLAMA_PATHS = new Set(['/api/tags', '/api/chat', '/api/version']);

function isRfc1918Subnet(hostname) {
  if (hostname.startsWith('10.') || hostname.startsWith('192.168.')) {
    return true;
  } else if (hostname.startsWith('172.')) {
    const parts = hostname.split('.');
    const secondOctet = Number(parts[1]);
    return Number.isInteger(secondOctet) && secondOctet >= 16 && secondOctet <= 31;
  } else {
    return false;
  }
}

function isPrivateOrLoopbackHost(hostname) {
  if (!hostname) {
    return false;
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  } else {
    return isRfc1918Subnet(hostname);
  }
}

function isAllowedOllamaUrl(parsed) {
  const isHttpOrHttps = parsed.protocol === 'http:' || parsed.protocol === 'https:';
  if (!isHttpOrHttps) {
    return false;
  } else {
    const rawPath = parsed.pathname || '';
    const normalizedPath =
      rawPath.endsWith('/') && rawPath.length > 1 ? rawPath.slice(0, -1) : rawPath;
    if (!ALLOWED_OLLAMA_PATHS.has(normalizedPath)) {
      return false;
    } else {
      return isPrivateOrLoopbackHost(parsed.hostname);
    }
  }
}

function isAllowedUrl(rawUrl, isDevelopment) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return true;
  } else if (
    isDevelopment &&
    (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
    DEV_HOSTS.has(parsed.hostname)
  ) {
    return true;
  } else if (parsed.protocol === 'https:' && parsed.hostname === 'generativelanguage.googleapis.com') {
    return true;
  } else if (isAllowedOllamaUrl(parsed)) {
    return true;
  } else {
    return false;
  }
}

function setupSecurityFirewall(sessionInstance, isDevelopment) {
  const currentSession = sessionInstance !== undefined ? sessionInstance : session.defaultSession;
  if (!currentSession || !currentSession.webRequest) {
    return;
  } else {
    const devMode = typeof isDevelopment === 'boolean' ? isDevelopment : isDev;

    currentSession.webRequest.onBeforeRequest((details, callback) => {
      if (isAllowedUrl(details.url, devMode)) {
        callback({ cancel: false });
      } else {
        console.warn(`[BLOCKED EGRESS] Blocked unauthorized outbound request: ${details.url}`);
        callback({ cancel: true });
      }
    });
  }
}

function handleWindowOpen({ url }) {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    shell.openExternal(url);
  } else {
    // Deny non-http/https schemes
  }
  return { action: 'deny' };
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 650,
    title: 'JERMChart',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Remove default menu in production or create customized menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload Chart',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.reload(),
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ type: 'separator' }, { role: 'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation & Help',
          click: async () => {
            await shell.openExternal('https://github.com');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Handle external links safely
  mainWindow.webContents.setWindowOpenHandler(handleWindowOpen);

  if (isDev) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  setupSecurityFirewall();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      // Do nothing
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  } else {
    // Keep alive on macOS
  }
});

module.exports = {
  createWindow,
  handleWindowOpen,
  isAllowedUrl,
  isPrivateOrLoopbackHost,
  ALLOWED_OLLAMA_PATHS,
  setupSecurityFirewall,
  PRIVACY_SWITCHES,
};
