import { app, BrowserWindow, ipcMain } from 'electron';
import Store from 'electron-store';
import path from 'path';
import { isDev, getJdkPath, getJarPath } from './util.js';
import { spawn } from 'child_process';

interface WalletStore {
  walletConfigured: boolean;
};

const store = new Store<WalletStore>({
  defaults: {
    walletConfigured: false
  }
});

app.on("ready", () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 600,
        minHeight: 450,
        webPreferences: {
            contextIsolation: true,
            preload: isDev()
            ? path.join(process.cwd(), 'dist-electron', 'preload.js')           // cuando es en desarrollo
            : path.join(app.getAppPath(), 'dist-electron', 'preload.js')        // cuando es en producción          
        }
    });

    if (isDev()) {
        mainWindow.loadURL('http://localhost:5123');
    } else {
        mainWindow.loadFile(path.join(app.getAppPath() + '/dist-react/index.html'));
    }

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
    });
});