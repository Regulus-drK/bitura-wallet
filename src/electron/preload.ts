import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    isWalletConfigured: () => ipcRenderer.invoke('wallet:isConfigured'),
    setWalletConfigured: (value: boolean) => {
        console.log(`Estado actualizado a: ${value}`)
        ipcRenderer.invoke('wallet:setConfigured', value) 
    },
    generateMnemonic: (args: string) => ipcRenderer.invoke('java:generateMnemonic', args),
});
