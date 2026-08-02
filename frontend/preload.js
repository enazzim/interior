const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  showAlert: (message) => ipcRenderer.sendSync('show-alert-sync', message),
  showConfirm: (message) => ipcRenderer.sendSync('show-confirm-sync', message)
});
