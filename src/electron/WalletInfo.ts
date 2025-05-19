export interface WalletInfo {
    tipoMoneda: 'BTC' | 'ETH';
    nombre: string;
    pathBase: string;
    tipoDireccion?: 'legacy' | 'segwit' | 'native';
    red?: 'mainnet' | 'testnet';
    indicePrivada: number,
    indicePublicaActual?: number;
}

export interface WalletStore {
  walletConfigured: boolean;
  wallets?: WalletInfo[];
};