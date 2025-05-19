export interface WalletInfo {
    tipoMoneda: 'BTC' | 'ETH';
    nombre: string;
    pathBase: string;
    tipoDireccion?: 'legacy' | 'segwit' | 'native';
    red?: 'mainnet' | 'testnet';
    indicePrivada: number;
    indicePublicaActual?: number;
    direccionPublica: string; // Si es BTC, este valor irá cambiando 
                              // (al igual que el indice de la pública)
}

// Para que React pueda acceder a esta interfaz
