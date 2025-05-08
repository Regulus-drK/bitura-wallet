import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    generateMnemonic: (args: string) => ipcRenderer.invoke('java:generateMnemonic', args),
});
