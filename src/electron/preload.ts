import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { WalletInfo } from './WalletInfo.js';

contextBridge.exposeInMainWorld('api', {
    closeApp: () => ipcRenderer.send('app/close'),
    closeActualWindow: () => ipcRenderer.send('app/closeActualWindow'),
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
    enableMenu: () => ipcRenderer.send('window:enableMenu'),
    disableMenu: () => ipcRenderer.send('window:disableMenu'),
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
    getRedSeleccionada: () => ipcRenderer.invoke('wallet:getRedSeleccionada'),
    setRedSeleccionada: (isTestnet: boolean) => {
        ipcRenderer.invoke("wallet:setRedSeleccionada", isTestnet);
    },
    // Llamadas API Java
    generateMnemonic: async (args: string) => ipcRenderer.invoke('java:generateMnemonic', args),
    listarPrecios: async () => ipcRenderer.invoke('java:listarPrecios'),
    consultarDireccion: (direccion: string, pagina: string, testnet?: boolean) => ipcRenderer.invoke('java:consultarDireccion', direccion, pagina, testnet),
    // Fin Llamadas API Java
    savePassword: (password: string) => ipcRenderer.invoke('wallet:savePassword', password),
    // getPassword: () => ipcRenderer.invoke('wallet:getPassword'), // Desactivados para el front (de momento, al menos)
    saveMnemonic: (mnemonic: string) => ipcRenderer.invoke('wallet:saveMnemonic', mnemonic),
    getMnemonic: async (inputPassword: string): Promise<string | null> => {
        if (!inputPassword) {
            console.error('Error: La contraseña ha llegado como null');
            return null;
        }
        try {
            const isValid = await ipcRenderer.invoke('wallet:validatePassword', inputPassword);
            if (isValid) {
                const mnemonic = await ipcRenderer.invoke('wallet:getMnemonic');
                return mnemonic;
            } else {
                console.error('Contraseña inválida, no se puede acceder al mnemonic.');
                return null;
            }
        } catch (error) {
            console.error('Error al obtener el mnemonic:', error);
            return null;
        }
    },
    validatePassword: (inputPassword: string) => ipcRenderer.invoke('wallet:validatePassword', inputPassword),
    getAllWallets: () => ipcRenderer.invoke('wallet:getAllWallets'),
    getWalletPorTipo: (tipo: 'BTC' | 'ETH') => ipcRenderer.invoke('wallet:getWalletPorTipo', tipo),
    addWallet: (nuevaWallet: WalletInfo) => ipcRenderer.invoke('wallet:addWallet', nuevaWallet),
    updateWallet: (nombre: string, datosActualizados: Partial<WalletInfo>) => ipcRenderer.invoke('wallet:updateWallet', nombre, datosActualizados),
    deleteWallet: (nombre: string) => ipcRenderer.invoke('wallet:deleteWallet', nombre),
    deleteConfigFiles: (inputPassword: string) => {
        // Primero validamos la contraseña
        ipcRenderer.invoke('wallet:validatePassword', inputPassword)
            .then(isValid => {
                if (isValid) {
                    // Si la contraseña es válida, procedemos a eliminar los archivos
                    ipcRenderer.invoke('wallet:deleteConfigFiles');
                } else {
                    console.error('Contraseña inválida');
                }
            })
            .catch(error => {
                console.error('Error al validar la contraseña', error);
            });
    }
});
