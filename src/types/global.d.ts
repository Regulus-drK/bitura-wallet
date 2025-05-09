declare global {
  interface Window {
    api: {
      isWalletConfigured: () => Promise<boolean>;
      setWalletConfigured: (value: boolean) => Promise<void>;
      onWalletConfigChange: (callback: (value: boolean) => void) => () => void;
      generateMnemonic: (numWords: '12' | '24') => Promise<string[]>;
    };
  }
}

export {};