import type { BtcResponse } from "./BtcBalance";
import type { CryptoAPIResponse } from "./CryptoPrices";
import type { EthResponse } from "./EthBalance";
import type { WalletInfo } from "./WalletInfo";

declare global {
  interface Window {
    api: {
      closeApp: () => void;
      closeActualWindow: () => void;
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
      enableMenu: () => void;
      disableMenu: () => void;
      isWalletConfigured: () => Promise<boolean>;
      setWalletConfigured: (value: boolean) => Promise<void>;
      onWalletConfigChange: (callback: (value: boolean) => void) => () => void;
      walletCheckAndNotify: (currentValue: boolean) => void;
      getRedBtcSeleccionada: () => Promise<'mainnet' | 'testnet'>;
      setRedBtcSeleccionada: (isTestnet: boolean) => Promise<boolean>;
      generateMnemonic: (numWords: '12' | '24') => Promise<string[]>;
      listarPrecios: () => Promise<CryptoAPIResponse>;
      consultarDireccion: (direccion: string, pagina: string) => Promise<BtcResponse | EthResponse>;
      savePassword: (password: string) => Promise<void>;
      getPassword: () => Promise<string>;
      saveMnemonic: (mnemonic: string) => Promise<void>;
      getMnemonic: (inputPassword: string) => Promise<string>;
      validatePassword: (inputPassword: string) => Promise<boolean>;
      getAllWallets: () => Promise<WalletInfo[]>;
      getWalletPorTipo: (tipo: 'BTC' | 'ETH') => Promise<WalletInfo | null>;
      addWallet: (nuevaWallet: WalletInfo) => Promise<boolean>;
      updateWallet: (nombre: string, datosActualizados: Partial<WalletInfo>) => Promise<boolean>;
      deleteWallet: (nombre: string) => Promise<boolean>;
      deleteConfigFiles: (inputPassword: string) => Promise<boolean>;
    };
  }
}

export {};