import path from "path";
import os from "os";

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