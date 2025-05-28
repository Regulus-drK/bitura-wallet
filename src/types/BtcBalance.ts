import type { BIP32Interface } from 'bip32';

export interface BtcUtxo {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_time: number;
  };
  value: number;
}

export interface BtcAddressUtxo {
  path: string;
  address: string;
  utxos: BtcUtxo[];
  keyPair?: BIP32Interface;
}

// Interfaces para las transacciones del API mempool.space
export interface BtcTxStatus {
  confirmed: boolean;
  block_height?: number;
  block_hash?: string;
  block_time?: number;
}

export interface BtcTxVinPrevout {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  scriptpubkey_address: string;
  value: number; // en satoshis
}

export interface BtcTxVin {
  txid: string;
  vout: number;
  prevout: BtcTxVinPrevout;
  scriptsig: string;
  scriptsig_asm: string;
  witness: string[];
  is_coinbase: boolean;
  sequence: number;
  inner_redeemscript_asm?: string;
}

export interface BtcTxVout {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  scriptpubkey_address: string;
  value: number; // en satoshis
  esCambio: boolean;
}

export interface BtcTransactionRaw {
  txid: string;
  version: number;
  locktime: number;
  vin: BtcTxVin[];
  vout: BtcTxVout[];
  size: number;
  weight: number;
  sigops: number;
  fee: number; // en satoshis
  status: BtcTxStatus;
}

// Interfaces formateadas sin usar Omit, explícitas

export interface BtcTxVinFormatted {
  txid: string;
  vout: number;
  prevout: {
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address: string;
    valueBtc: string; // en BTC (string)
  };
  scriptsig: string;
  scriptsig_asm: string;
  witness: string[];
  is_coinbase: boolean;
  sequence: number;
  inner_redeemscript_asm?: string;
}

export interface BtcTxVoutFormatted {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  scriptpubkey_address: string;
  valueBtc: string; // en BTC (string)
  esCambio: boolean;
}

export interface BtcTxStatusFormatted {
  confirmed: boolean;
  block_height?: number;
  block_hash?: string;
  block_time_formatted?: string; // formato DD/MM/AAAA en horario España
}

export interface BtcTransactionFormatted {
  txid: string;
  address: string;
  path: string;
  version: number;
  locktime: number;
  vin: BtcTxVinFormatted[];
  vout: BtcTxVoutFormatted[];
  size: number;
  weight: number;
  sigops: number;
  feeBtc: string; // en BTC (string)
  status: BtcTxStatusFormatted;
}

// Función para convertir satoshis a BTC (string con 7 decimales)
function satoshisToBtc(sat: number): string {
  return (sat / 1e8).toFixed(7);
}

// Función para formatear timestamp a "DD/MM/AAAA" con horario de España
function formatBlockTimeSpain(timestamp?: number): string | undefined {
  if (!timestamp) return undefined;
  const date = new Date(timestamp * 1000);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  }).format(date);
}

/**
 * Recibe un array de transacciones crudas y devuelve un array formateado:
 * - satoshis -> BTC en strings con 7 decimales
 * - timestamp -> fecha formateada DD/MM/AAAA en horario España
 */
export function formatTxsBtc(
  txs: BtcTransactionRaw[], direccionPublica: string, path: string, direccionesCambio: Set<string>): BtcTransactionFormatted[] {
  return txs.map((tx) => ({
    txid: tx.txid,
    address: direccionPublica,
    path: path,
    version: tx.version,
    locktime: tx.locktime,
    vin: tx.vin.map((vin) => ({
      txid: vin.txid,
      vout: vin.vout,
      prevout: {
        scriptpubkey: vin.prevout.scriptpubkey,
        scriptpubkey_asm: vin.prevout.scriptpubkey_asm,
        scriptpubkey_type: vin.prevout.scriptpubkey_type,
        scriptpubkey_address: vin.prevout.scriptpubkey_address,
        valueBtc: satoshisToBtc(vin.prevout.value)
      },
      scriptsig: vin.scriptsig,
      scriptsig_asm: vin.scriptsig_asm,
      witness: vin.witness,
      is_coinbase: vin.is_coinbase,
      sequence: vin.sequence,
      inner_redeemscript_asm: vin.inner_redeemscript_asm,
    })),
    vout: tx.vout.map((vout) => ({
      scriptpubkey: vout.scriptpubkey,
      scriptpubkey_asm: vout.scriptpubkey_asm,
      scriptpubkey_type: vout.scriptpubkey_type,
      scriptpubkey_address: vout.scriptpubkey_address,
      valueBtc: satoshisToBtc(vout.value),
      esCambio: direccionesCambio.has(vout.scriptpubkey_address ?? ''),
    })),
    size: tx.size,
    weight: tx.weight,
    sigops: tx.sigops,
    feeBtc: satoshisToBtc(tx.fee),
    status: {
      confirmed: tx.status.confirmed,
      block_height: tx.status.block_height,
      block_hash: tx.status.block_hash,
      block_time_formatted: formatBlockTimeSpain(tx.status.block_time),
    },
  }));
}