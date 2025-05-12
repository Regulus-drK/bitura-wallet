import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('api', {
    closeApp: () => ipcRenderer.send('app/close'),
    setWindowSize: (options: { 
        width: number, 
        height: number,
        minWidth?: number,
        minHeight?: number,
        maxWidth?: number,
        maxHeight?: number,
        resizable?: boolean
    }) => ipcRenderer.invoke('window:setSize', options),
    resetWindowSize: () => ipcRenderer.invoke('window:resetSize'),
    isWalletConfigured: () => ipcRenderer.invoke('wallet:isConfigured'),
    setWalletConfigured: (value: boolean) => {
        ipcRenderer.invoke('wallet:setConfigured', value); 
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
    savePassword: (password: string) => ipcRenderer.invoke('wallet:savePassword', password),
    // getPassword: () => ipcRenderer.invoke('wallet:getPassword'), // Desactivados para el front (de momento, al menos)
    saveMnemonic: (mnemonic: string) => ipcRenderer.invoke('wallet:saveMnemonic', mnemonic),
    getMnemonic: () => ipcRenderer.invoke('wallet:getMnemonic'),
    validatePassword: (inputPassword: string) => ipcRenderer.invoke('wallet:validatePassword', inputPassword),
});
