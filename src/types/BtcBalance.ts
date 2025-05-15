import BigNumber from "bignumber.js"; // Uso de BigNumber para evitar errores de cálculo (los números pueden ser demasiado grandes)

export interface BtcTx {
  txid: string;
  vin: {
    txid: string;
    prevout: {
        scriptpubkey_address: string;
        value: any; // Para despues convertirlos a BigNumber
    }
  }[];
  vout: {
    scriptpubkey_address: string;
    value: any; // Para despues convertirlos a BigNumber
  }[]
  fee: number; // satoshis
  status: {
    confirmed: boolean;
    block_time?: number;
    block_height: number;
  };
  value: number; // satoshis
}

export interface BtcResponse {
  address: string;
  balance_data: {
    address: string;
    chain_stats: {
      funded_txo_count: number;
      funded_txo_sum: number;    // satoshis
      spent_txo_count: number;
      spent_txo_sum: number;     // satoshis
      tx_count: number;
    };
    mempool_stats: {
      funded_txo_count: number;
      funded_txo_sum: number;    // satoshis
      spent_txo_count: number;
      spent_txo_sum: number;     // satoshis
      tx_count: number;
    };
  };
  transactions: BtcTx[];
  page: number;
}

export interface ParsedBtcTx extends BtcTx {
  feeBtc: BigNumber;  // fee en BTC
}

export interface ParsedBtcResponse {
  address: string;
  confirmedSats: BigNumber;    // satoshis (BigNumber)
  unconfirmedSats: BigNumber;  // satoshis (BigNumber)
  confirmedBtc: BigNumber;     // BTC
  unconfirmedBtc: BigNumber;   // BTC
  transactions: ParsedBtcTx[];
  page: number;
}

// Método para convertir (parsear) los parámetros a número que se puedan usar
export function parseBtcResponse(response: BtcResponse): ParsedBtcResponse {
  const SATOSHIS_IN_BTC = new BigNumber(1e8);

  const confirmedSats = new BigNumber(response.balance_data.chain_stats.funded_txo_sum)
    .minus(response.balance_data.chain_stats.spent_txo_sum);
  const unconfirmedSats = new BigNumber(response.balance_data.mempool_stats.funded_txo_sum)
    .minus(response.balance_data.mempool_stats.spent_txo_sum);

  const confirmedBtc = confirmedSats.dividedBy(SATOSHIS_IN_BTC);
  const unconfirmedBtc = unconfirmedSats.dividedBy(SATOSHIS_IN_BTC);

  const transactions: ParsedBtcTx[] = (response.transactions ?? []).map(tx => ({
    ...tx,
    feeBtc: new BigNumber(tx.fee).dividedBy(SATOSHIS_IN_BTC),
    vin: tx.vin.map(vinItem => ({
      ...vinItem,
      prevout: {
        ...vinItem.prevout,
        value: new BigNumber(vinItem.prevout.value),
      },
    })),
    vout: tx.vout.map(voutItem => ({
      ...voutItem,
      value: new BigNumber(voutItem.value),
    })),
  }));

  return {
    address: response.address,
    confirmedSats,
    unconfirmedSats,
    confirmedBtc,
    unconfirmedBtc,
    transactions,
    page: response.page,
  };
}
