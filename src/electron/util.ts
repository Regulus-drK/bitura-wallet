import path from "path";
import os from "os";
import { app, BrowserWindow, dialog, safeStorage } from "electron";
import Store from 'electron-store';
import fs from 'fs';

const PASSWORD_FILE = path.join(app.getPath('userData'), 'pass.bin');
const MNEMONIC_FILE = path.join(app.getPath('userData'), 'wallet.bin');


export function isDev(): boolean {
    return process.env.NODE_ENV === 'development';
}

export function getJdkPath(): string {
    const platform = os.platform();

    const basePath = isDev()
        ? path.join(process.cwd(), "java")
        : path.join(process.resourcesPath, "java");

    switch (platform) {
        case "win32":
            return path.join(basePath, "jdk-win", "bin", "java.exe");
        case "darwin": // macOS
            return path.join(basePath, "jdk-mac", "Contents", "Home", "bin", "java");
        case "linux":
            return path.join(basePath, "jdk-linux", "bin", "java");
        default:
            throw new Error("Error: Plataforma no soportada");
    }
}

export function getJarPath(): string {
    return isDev()
    ? path.join(process.cwd(), "java", "BituraUtils.jar")
    : path.join(process.resourcesPath, "java", "BituraUtils.jar");
}

export function savePassword(password: string): void {
    const encrypted = safeStorage.encryptString(password);

    fs.writeFileSync(PASSWORD_FILE, encrypted);
}

export function getPassword(): string | null {
    if (!fs.existsSync(PASSWORD_FILE)) return null;

    const encrypted = fs.readFileSync(PASSWORD_FILE);
    return safeStorage.decryptString(encrypted);
}

export function saveMnemonic(mnemonic: string): void {
    const encrypted = safeStorage.encryptString(mnemonic);

    fs.writeFileSync(MNEMONIC_FILE, encrypted);
}

export function getMnemonic(): string | null {
    if (!fs.existsSync(MNEMONIC_FILE)) return null;

    const encrypted = fs.readFileSync(MNEMONIC_FILE);
    return safeStorage.decryptString(encrypted);
}

export function createAppConfigResetPromptWindow(): void {
    const promptWindow = new BrowserWindow({
        width: 400,
        height: 375,
        resizable: false,
        modal: true,
        autoHideMenuBar: true,
        parent: BrowserWindow.getFocusedWindow() ?? undefined,
        webPreferences: {
            preload: isDev()
                ? path.join(process.cwd(), 'dist-electron', 'preload.js')
                : path.join(app.getAppPath(), 'dist-electron', 'preload.js'),
            contextIsolation: true
        }
    });

    promptWindow.setMenu(null);

    if (isDev()) {
        promptWindow.loadURL('http://localhost:5123/#/config-reset-prompt'); // desarrollo
    } else {
        // En producción, carga la URL de la aplicación React con hash
        const url = `file://${path.join(app.getAppPath(), 'dist-react', 'index.html')}#/config-reset-prompt`;
        promptWindow.loadURL(url); // Producción con hash
    };
}

export function ventanaConfirmarDeleteConfigFiles(): void {
    const response = dialog.showMessageBoxSync({
        type: 'question',
        buttons: ['Cancelar', 'Aceptar'],
        defaultId: 1,
        title: 'Confirmar restauración de frase semilla',
        message: 'Se borrarán todos los datos de su frase semilla y contraseña almacenada. \nRecuerde que no perderá sus activos si conserva su frase semilla. \n\nSe le pedirá su contraseña para esta acción. ¿Desea continuar?'
    });

    if (response === 1) {
        createAppConfigResetPromptWindow();
    } else {
        return;
    }
}

export async function deleteConfigFiles(): Promise<void> {
    let store = new Store();
    try {
        await fs.promises.unlink(store.path);
        await fs.promises.unlink(PASSWORD_FILE);
        await fs.promises.unlink(MNEMONIC_FILE);
        console.log("Archivos eliminados correctamente");
        // Reiniciar aplicación
        app.relaunch();
        app.quit();
    } catch (err) {
        console.error("Error al borrar los archivos:", err);
    }
}