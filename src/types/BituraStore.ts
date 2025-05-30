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
    ultSaldoGuardado: string;
    ultSaldoGuardadoEur: number;
}

export interface PortfolioData {
  valorTotal: number;
  btc: {
    cantidad: number;
    valor: number;
  },
  eth: {
    cantidad: number;
    valor: number;
  }
}


// Para que React pueda acceder a esta interfaz
