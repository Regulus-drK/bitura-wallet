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

export async function isWalletConfigured(): Promise<boolean> {
  return await window.api.isWalletConfigured();
}

export async function setWalletConfigured(value: boolean): Promise<void> {
  await window.api.setWalletConfigured(value);
}

export function onWalletConfigChange(callback: (value: boolean) => void): () => void {
  return window.api.onWalletConfigChange(callback);
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

export async function getMnemonic(): Promise<string | null> {
  const mnemonic = await window.api.getMnemonic();
  if (mnemonic) {
    return mnemonic;
  } else {
    console.log('No hay mnemonic guardado');
    return '';
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

export async function deleteConfigFiles(inputPassword: string): Promise<boolean> {
  return window.api.deleteConfigFiles(inputPassword);
}
