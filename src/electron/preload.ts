import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('api', {
    isWalletConfigured: () => ipcRenderer.invoke('wallet:isConfigured'),
    setWalletConfigured: (value: boolean) => {
        console.log(`Estado actualizado a: ${value}`)
        ipcRenderer.invoke('wallet:setConfigured', value) 
    },
    onWalletConfigChange: (callback: (value: boolean) => void) => {
        const listener = (_event: IpcRendererEvent, value: boolean) => {
            callback(value);
        };
        ipcRenderer.on('wallet:configChanged', listener);
        
        // Devuelve una función para limpiar el listener
        return () => {
            ipcRenderer.off('wallet:configChanged', listener);
        };
    },
    generateMnemonic: (args: string) => ipcRenderer.invoke('java:generateMnemonic', args),
});
