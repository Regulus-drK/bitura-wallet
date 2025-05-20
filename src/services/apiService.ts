import type { BtcResponse } from "../types/BtcBalance";
import type { CryptoAPIResponse } from "../types/CryptoPrices";
import type { EthResponse } from "../types/EthBalance";
import type { WalletInfo } from "../types/WalletInfo";

export function closeApp() {
  window.api.closeApp();
}

export function closeActualWindow() {
  window.api.closeActualWindow();
}

export function enableMenu(): void {
  window.api.enableMenu();
}

export function disableMenu(): void {
  window.api.disableMenu();
}

export async function generateMnemonic(numWords: '12' | '24'): Promise<string[]> {
  try {
      const result = await window.api.generateMnemonic(numWords);
      return result;
  } catch (err) {
      console.error("Error generando mnemonic: ", err);
      return [];
  }
}

export async function listarPrecios(): Promise<CryptoAPIResponse | null> {
  try {
    const result = await window.api.listarPrecios();
    return result;
  } catch (err) {
    console.error("Error cargando precios: ", err);
    return null;
  }
}

export async function consultarDireccion(direccion: string, pagina: string): Promise<EthResponse | BtcResponse | null> {
  try {
    const result = await window.api.consultarDireccion(direccion, pagina);
    return result;
  } catch (err) {
    console.error("Error consultando dirección: ", err);
    return null;
  }
}

export async function isWalletConfigured(): Promise<boolean> {
  return await window.api.isWalletConfigured();
}

export async function setWalletConfigured(value: boolean): Promise<void> {
  await window.api.setWalletConfigured(value);
}

export function onWalletConfigChange(callback: (value: boolean) => void): () => void {
  return window.api.onWalletConfigChange(callback);
}

export async function getRedBtcSeleccionada(): Promise<'mainnet' | 'testnet'> {
  return window.api.getRedBtcSeleccionada();
}

export async function setRedBtcSeleccionada(isTestnet: boolean): Promise<boolean> {
  return window.api.setRedBtcSeleccionada(isTestnet);
}

export async function savePassword(password: string): Promise<void> {
  return window.api.savePassword(password);
}

export async function getPassword(): Promise<string | null> {
  const password = await window.api.getPassword();
  if (password) {
    return password;
  } else {
    console.log('No hay contraseña guardada');
    return '';
  }
}

export async function saveMnemonic(mnemonic: string): Promise<void> {
  return window.api.saveMnemonic(mnemonic);
}

export async function getMnemonic(inputPassword: string): Promise<string | null> {
  const mnemonic = await window.api.getMnemonic(inputPassword);
  if (mnemonic) {
    return mnemonic;
  } else {
    console.log('No hay mnemonic guardado');
    return null;
  }
}

export async function validatePassword(inputPassword: string): Promise<boolean> {
  const password = await window.api.validatePassword(inputPassword);
  if (!password) {
    console.log('[wallet:validatePassword] Las contraseñas no coinciden.')
    return false;
  }
  return true;
}

export async function getAllWallets(): Promise<WalletInfo[]> {
  return await window.api.getAllWallets();
}

export async function getWalletPorTipo(tipo: 'BTC' | 'ETH'): Promise<WalletInfo | null> {
  return await window.api.getWalletPorTipo(tipo);
}

export async function addWallet(nuevaWallet: WalletInfo): Promise<boolean> {
  return await window.api.addWallet(nuevaWallet);
}

export async function updateWallet(nombre: string, datosActualizados: Partial<WalletInfo>): Promise<boolean> {
  return await window.api.updateWallet(nombre, datosActualizados);
}

export async function deleteWallet(nombre: string): Promise<boolean> {
  return await window.api.deleteWallet(nombre);
}

export async function deleteConfigFiles(inputPassword: string): Promise<boolean> {
  return window.api.deleteConfigFiles(inputPassword);
}
