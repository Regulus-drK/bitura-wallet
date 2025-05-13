import { app, BrowserWindow, dialog, ipcMain, Menu, safeStorage } from 'electron';
import Store from 'electron-store';
import path from 'path';
import { isDev, getJdkPath, getJarPath, savePassword, getPassword, saveMnemonic, getMnemonic, deleteConfigFiles } from './util.js';
import { spawn } from 'child_process';
import { MenuBar } from './MenuBar.js';

interface WalletStore {
  walletConfigured: boolean;
};

const store = new Store<WalletStore>({
  defaults: {
    walletConfigured: false
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
                : path.join(app.getAppPath(), 'dist-electron', 'preload.js')
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

        Menu.setApplicationMenu(null); // Elimina el menú global
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
                reject(`[JAVA ERROR - INVOKE]: ${data}`);
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

    ipcMain.handle('wallet:getMnemonic', () => {
        return getMnemonic();
    });

    ipcMain.handle('wallet:validatePassword', async (_event, inputPassword: string) => {
        const savedPassword = getPassword();
        return savedPassword === inputPassword;
    });

    ipcMain.handle('wallet:deleteConfigFiles', async () => {
        deleteConfigFiles();
        return true;
    })
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
