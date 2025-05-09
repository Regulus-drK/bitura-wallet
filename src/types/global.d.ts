declare global {
  interface Window {
    api: {
      isWalletConfigured: () => Promise<boolean>;
      setWalletConfigured: (value: boolean) => Promise<void>;
      generateMnemonic: (numWords: '12' | '24') => Promise<string[]>;
    };
  }
}

export {};