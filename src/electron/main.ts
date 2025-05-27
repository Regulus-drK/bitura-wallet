import { app, BrowserWindow, dialog, ipcMain, Menu, safeStorage, session } from 'electron';
import Store from 'electron-store';
import path from 'path';
import { isDev, getJdkPath, getJarPath, savePassword, getPassword, saveMnemonic, getMnemonic, deleteConfigFiles } from './util.js';
import { spawn } from 'child_process';
import { EmptyMenu, MenuBar } from './MenuBar.js';
import { WalletStore, WalletInfo } from './WalletInfo.js';

const store = new Store<WalletStore>({
  defaults: {
    walletConfigured: false,
    redSeleccionada: 'mainnet'
  }
});

function createMainWindow(): BrowserWindow {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 600,
        minHeight: 450,
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            preload: isDev()
                ? path.join(process.cwd(), 'dist-electron', 'preload.js')
                : path.join(app.getAppPath(), 'dist-electron', 'preload.js'),
            // partition: 'persist:default',
            webSecurity: false
        }
    });

    if (isDev()) {
        mainWindow.loadURL('http://localhost:5123'); // desarrollo
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), 'dist-react/index.html')); // producción
    }

    
    // // Establecer el menú de la aplicación
    // const menu = MenuBar.buildMenu(); // Usamos el método buildMenu para construir el menú
    // Menu.setApplicationMenu(menu); // Asigna el menú a la aplicación

    // mainWindow.setMenu(null);
    // mainWindow.setMenuBarVisibility(false);

    return mainWindow;
}

app.on("ready", () => {
    if (!safeStorage.isEncryptionAvailable()) {
        dialog.showErrorBox(
            "Cifrado no disponible",
            `No se pudo activar el almacenamiento seguro en este sistema.
            
        Posibles soluciones:
            - Asegúrese de estar en sesión (Windows).
            - Inicie un gestor de llaveros como gnome-keyring (Linux).
            - Desbloquee el llavero (macOS).`
        );
        app.quit();
        return;
    }

    // app.commandLine.appendSwitch('disable-features', 'SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure');

    // Creamos la ventana principal
    createMainWindow();

    ipcMain.on('app/close', () => {
        app.quit();
    });

    ipcMain.on('app/closeActualWindow', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (!win) return;

        win.close();
    })

    ipcMain.handle('window:setSize', (_, options) => {
        const win = BrowserWindow.getFocusedWindow();
        if (!win) return;

        win.setMinimumSize(options.minWidth || options.width, options.minHeight || options.height);
        win.setMaximumSize(options.maxWidth, options.maxHeight);
        win.setSize(options.width, options.height);
        win.setResizable(options.resizable ?? false);
    });

    ipcMain.handle('window:resetSize', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (!win) return;

        win.setMinimumSize(600, 450); // Valores por defecto
        win.setMaximumSize(999999, 999999);
        win.setResizable(true);
    });

    ipcMain.on('window:enableMenu', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (!win) return;

        // Establecer el menú de la aplicación
        const menu = MenuBar.buildMenu(); // Usamos el método buildMenu para construir el menú
        Menu.setApplicationMenu(menu); // Asigna el menú a la aplicación
        win.autoHideMenuBar = false;
        win.setMenuBarVisibility(true);
    })

    ipcMain.on('window:disableMenu', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (!win) return;

        const emptyMenu = EmptyMenu.buildMenu();
        Menu.setApplicationMenu(emptyMenu); // Elimina el menú global
        win.autoHideMenuBar = true;
        win.setMenuBarVisibility(false);
    })

    // function reOpenWindow() {
    //     const oldWindow = BrowserWindow.getFocusedWindow();
    //     if (oldWindow) {
    //         oldWindow.on('closed', () => {
    //             const newWindow = createMainWindow();
    //             newWindow.webContents.once('did-finish-load', () => {
                    
    //             });
    //         });

    //         oldWindow.close(); // Esto disparará el evento 'closed'
    //     } else {
    //         // En caso de que no haya ventana activa, simplemente la creamos
    //         const newWindow = createMainWindow();
    //         newWindow.webContents.once('did-finish-load', () => {
                
    //         });
    //     }
    // }

    // ipcMain.handle('window:reOpen', () => {

    // })

    // Ejecución de Java JAR con JDK embebido

    // Electron corre en el proceso principal, mientras que React en el proceso denominado "renderer", por lo que para
    // permitir la comunicación con el .jar hay que hacer un proceso interno de comunicación (IPC de Electron), haciendo que React se
    // comunique con Electron como puente

    /**
     * Estructura:
     * React (renderer) ⇄ Electron (main) ⇄ Java (.jar embebido)
     */

    // Aquí añadimos un canal para que React pueda pedir una acción al .jar directamente

    ipcMain.handle('java:generateMnemonic', async (_event, args) => {
        return new Promise((resolve, reject) => {
            const javaPath = getJdkPath();
            const jarPath = getJarPath();

            // Ejecuta el .jar temporalmente para una tarea concreta (por ejemplo: generar mnemonic)
            const proc = spawn(javaPath, ['-jar', jarPath, 'generateMnemonic', args]);
            let output = '';

            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.stderr.on('data', (data) => {
                reject(`[JAVA ERROR - generateMnemonic]: ${data}`);
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    try {
                        const wordsArray = output.trim().split(" ");
                        resolve(wordsArray);
                    } catch (error) {
                        reject("Error al parsear la salida de Java.");
                    }
                } else {
                    reject(`El proceso Java terminó con código ${code}`);
                }
            });
        });
    });

    ipcMain.handle('java:listarPrecios', async () => {
        return new Promise((resolve, reject) => {
            const javaPath = getJdkPath();
            const jarPath = getJarPath();

            const proc = spawn(javaPath, ['-jar', jarPath, 'llamarAPI', 'listarPrecios']);
            let output = '';

            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.stderr.on('data', (data) => {
                console.error('stderr:', data.toString());
                reject(`[JAVA ERROR - listarPrecios]: ${data}`);
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    try {
                        const parsed = JSON.parse(output.trim());
                        resolve(parsed);
                    } catch (err) {
                        reject(`Error al parsear JSON: ${err}`);
                    }
                } else {
                    reject(`El proceso Java terminó con código ${code}`);
                }
            });
        });
    });

    ipcMain.handle('java:consultarDireccion', async (_event, direccion: string, pagina: string, testnet?: boolean) => {
        return new Promise((resolve, reject) => {
            const javaPath = getJdkPath();
            const jarPath = getJarPath();

            let param = 'consultarDireccion';
            if (testnet && testnet === true) param = 'consultarDireccionTESTNET';
            
            const proc = spawn(javaPath, ['-jar', jarPath, 'llamarAPI', param, direccion, pagina]);
            let output = '';

            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.stderr.on('data', (data) => {
                console.error('stderr:', data.toString());
                reject(`[JAVA ERROR - consultarDireccion]: ${data}`);
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    try {
                        const parsed = JSON.parse(output.trim());
                        resolve(parsed);
                    } catch (err) {
                        reject(`Error al parsear JSON: ${err}`);
                    }
                } else {
                    reject(`El proceso Java terminó con código ${code}`);
                }
            });
        });
    });

    // Nuevo canal para consultar si está configurada la wallet
    ipcMain.handle('wallet:isConfigured', () => {
        return store.get('walletConfigured');
    });

    // Nuevo canal para establecer que la wallet ha sido configurada
    ipcMain.handle('wallet:setConfigured', (_event, value: boolean) => {
        store.set('walletConfigured', value);

        const oldWindow = BrowserWindow.getFocusedWindow();
        if (oldWindow) {
            oldWindow.on('closed', () => {
                const newWindow = createMainWindow();
                newWindow.webContents.once('did-finish-load', () => {
                    newWindow.webContents.send('wallet:configChanged', value);
                });
            });

            oldWindow.close(); // Esto disparará el evento 'closed'
        } else {
            // En caso de que no haya ventana activa, simplemente la creamos
            const newWindow = createMainWindow();
            newWindow.webContents.once('did-finish-load', () => {
                newWindow.webContents.send('wallet:configChanged', value);
            });
        }

        return true;
    });

    ipcMain.handle('wallet:getRedSeleccionada', () => {
        let redSeleccionada = store.get('redSeleccionada');
        if (redSeleccionada !== 'mainnet' && redSeleccionada !== 'testnet') {
            redSeleccionada = 'mainnet';
        }
        return redSeleccionada;
    });

    ipcMain.handle('wallet:setRedSeleccionada', (_event, isTestnet: boolean) => {
        if (isTestnet) {
            store.set('redSeleccionada', 'testnet');
        } else {
            store.set('redSeleccionada', 'mainnet');
        }
        return true;
    })

    ipcMain.handle('wallet:savePassword', (_event, password: string) => {
        savePassword(password);
        return true;
    });

    ipcMain.handle('wallet:getPassword', () => {
        return getPassword();
    });

    ipcMain.handle('wallet:saveMnemonic', (_event, mnemonic: string) => {
        saveMnemonic(mnemonic);
        return true;
    });

    ipcMain.handle('wallet:getMnemonic', async () => {
        return getMnemonic();
    });

    ipcMain.handle('wallet:validatePassword', async (_event, inputPassword: string) => {
        const savedPassword = getPassword();
        return savedPassword === inputPassword;
    });

    // Obtener todas las wallets
    ipcMain.handle('wallet:getAllWallets', () => {
        return store.get('wallets') || [];
    });

    // Obtener wallets por tipo de moneda (BTC o ETH)
    ipcMain.handle('wallet:getWalletPorTipo', (_event, tipo: 'BTC' | 'ETH') => {
        const todas = store.get('wallets') || [];
        return todas.filter(w => w.tipoMoneda === tipo);
    });

    // Crear una wallet
    ipcMain.handle('wallet:addWallet', (_event, nuevaWallet: WalletInfo) => {
        const existentes: WalletInfo[] = store.get('wallets') || [];
        existentes.push(nuevaWallet);
        store.set('wallets', existentes);
        return true;
    });

    // Actualizar una wallet por nombre
    ipcMain.handle('wallet:updateWallet', (_event, nombre: string, datosActualizados: Partial<WalletInfo>) => {
        const existentes = store.get('wallets') || [];
        const actualizadas = existentes.map(wallet =>
            wallet.nombre === nombre ? { ...wallet, ...datosActualizados } : wallet
        );
        store.set('wallets', actualizadas);
        return true;
    });

    // Eliminar una wallet
    ipcMain.handle('wallet:deleteWallet', (_event, nombre: string) => {
        const existentes = store.get('wallets') || [];
        const filtradas = existentes.filter(wallet => wallet.nombre !== nombre);
        store.set('wallets', filtradas);
        return true;
    });

    ipcMain.handle('wallet:deleteConfigFiles', async () => {
        deleteConfigFiles();
        return true;
    });
});

// Cierra completamente la aplicación excepto en macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// En macOS, vuelve a crear la ventana al hacer clic en el icono del dock
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
