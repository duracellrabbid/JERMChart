const { contextBridge } = require('electron');

// Expose safe desktop environment info if needed
contextBridge.exposeInMainWorld('desktopApp', {
  isDesktop: true,
  platform: process.platform,
});
