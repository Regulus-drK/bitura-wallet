declare global {
  interface Window {
    api: {
      setWindowSize: (options: {
        width: number,
        height: number,
        minWidth?: number,
        minHeight?: number,
        maxWidth?: number,
        maxHeight?: number,
        resizable?: boolean
      }) => Promise<void>;
      resetWindowSize: () => Promise<void>;
      isWalletConfigured: () => Promise<boolean>;
      setWalletConfigured: (value: boolean) => Promise<void>;
      onWalletConfigChange: (callback: (value: boolean) => void) => () => void;
      generateMnemonic: (numWords: '12' | '24') => Promise<string[]>;
    };
  }
}

export {};