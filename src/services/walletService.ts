
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