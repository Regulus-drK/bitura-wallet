export interface WalletInfo {
    tipoMoneda: 'BTC' | 'ETH';
    nombre: string;
    pathBase?: string;
    tipoDireccion?: 'legacy' | 'segwit' | 'native';
    red: 'mainnet' | 'testnet';
    indiceActual: number;
}

// Para que React pueda acceder a esta interfaz
