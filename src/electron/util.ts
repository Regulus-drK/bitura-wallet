import path from "path";
import os from "os";
import { app, safeStorage } from "electron";
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