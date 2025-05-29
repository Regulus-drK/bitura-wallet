import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory, type BIP32Interface } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import ECPairFactory from 'ecpair';
import { ethers } from 'ethers';
import BigNumber from "bignumber.js";
import { Buffer } from 'buffer';
import type { WalletInfo } from '../types/WalletInfo';
import { addWallet, updateWallet } from './apiService';
import { formatTxsBtc, type BtcAddressUtxo, type BtcTransactionFormatted, type BtcTransactionRaw} from '../types/BtcBalance';

// Crear instancia de bip32 con tiny-secp256k1
const bip32 = BIP32Factory(ecc);

const ECPair = ECPairFactory(ecc);

export function validarMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
}

/**
 * Función para crear una wallet de Bitcoin a partir del mnemonic.
 * @param mnemonic Mnemonic guardado en .bin
 * @param indexPrivada Índice de la clave privada a generar
 * @param tipoDireccion Tipo de la dirección de BTC (Legacy, SegWit..)
 * @param testnet Opcional, para indicar si es testnet o no
 * @returns Devuelve un array con información de la wallet
 */
function crearWalletBtc(mnemonic: string | null, indexPrivada: number, tipoDireccion: string, testnet?: boolean) {
    let network = bitcoin.networks.bitcoin;
    if (testnet) {
        network = bitcoin.networks.testnet;
    }

    let derivacion: string;
    let metodoBtc: (args: bitcoin.payments.Payment) => bitcoin.payments.Payment;
    switch (tipoDireccion) {
        case "legacy":
            derivacion = "44'";
            metodoBtc = bitcoin.payments.p2pkh;
            break;
        case "segwit":
            derivacion = "49'";
            metodoBtc = (args) =>
                bitcoin.payments.p2sh({
                    redeem: bitcoin.payments.p2wpkh(args),
                    network: args.network,
                });
            break;
        case "native":
            derivacion = "84'";
            metodoBtc = bitcoin.payments.p2wpkh;
            break;
        default:
            derivacion = "84'";
            metodoBtc = bitcoin.payments.p2wpkh;
            break;
    }

    if (!mnemonic || !validarMnemonic(mnemonic)) return;

    // Convertir la frase semilla en una semilla binaria
    const binSeed = bip39.mnemonicToSeedSync(mnemonic);

    // Derivar raíz BIP32
    const root = bip32.fromSeed(binSeed);

    const path = `m/${derivacion}/0'/${indexPrivada}'`;

    const childBitcoin = root.derivePath(path + '/0/0');
    const { address: addressBitcoin } = metodoBtc({ 
        pubkey: Buffer.from(childBitcoin.publicKey),
        network: network
    });

    return {
        index: indexPrivada,
        path,
        address: addressBitcoin!
    };
}

export async function crearYGuardarWalletBtc(
    nombre: string, mnemonic: string | null, index: number, 
    tipoDireccion: 'legacy' | 'segwit' | 'native', redSeleccionada: 'mainnet' | 'testnet') 
{
    let testnet = false;
    if (redSeleccionada === 'testnet') testnet = true;

    const walletBtc = crearWalletBtc(mnemonic, index, tipoDireccion, testnet);
    if (!walletBtc) {
        console.error('No se pudo crear la wallet');
        return false;
    }

    // Completa la wallet con el formato WalletInfo
    const walletInfo: WalletInfo = {
        tipoMoneda: 'BTC',
        nombre: nombre,
        pathBase: walletBtc.path,
        tipoDireccion: tipoDireccion,
        red: redSeleccionada,
        indicePrivada: index,
        indicePublicaActual: 0,
        direccionPublica: walletBtc.address,
        ultSaldoGuardado: '0.0000000',
        ultSaldoGuardadoEur: 0
    };

    const resultado = await addWallet(walletInfo);

    if (resultado) {
        console.log('Wallet guardada correctamente');
    } else {
        console.error('Error guardando la wallet');
    }

    return resultado;
}

export async function crearDireccionPublicaBtc(mnemonic: string | null, cuenta: WalletInfo) {
    if (!mnemonic || !validarMnemonic(mnemonic) || 
    cuenta.tipoMoneda !== 'BTC') return false;

    const testnet = cuenta.red === 'testnet';
    const network = testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

    // Convertir la frase semilla en una semilla binaria
    const binSeed = bip39.mnemonicToSeedSync(mnemonic);

    // Derivar raíz BIP32
    const root = bip32.fromSeed(binSeed);

    let indiceSiguiente = cuenta.indicePublicaActual! + 1;

    const path = cuenta.pathBase + `/0/${indiceSiguiente}`;

    let metodoBtc: (args: bitcoin.payments.Payment) => bitcoin.payments.Payment;
    switch (cuenta.tipoDireccion) {
        case "legacy":
            metodoBtc = bitcoin.payments.p2pkh;
            break;
        case "segwit":
            metodoBtc = (args) =>
                bitcoin.payments.p2sh({
                    redeem: bitcoin.payments.p2wpkh(args),
                    network: args.network,
                });
            break;
        case "native":
            metodoBtc = bitcoin.payments.p2wpkh;
            break;
        default:
            metodoBtc = bitcoin.payments.p2wpkh;
            break;
    }

    const childBitcoin = root.derivePath(path);
    const { address: addressBitcoin } = metodoBtc({ 
        pubkey: Buffer.from(childBitcoin.publicKey),
        network: network
    });

    cuenta.indicePublicaActual = indiceSiguiente;
    cuenta.direccionPublica = addressBitcoin!;

    const actualizado = await updateWallet(cuenta.nombre, cuenta, cuenta.red);

    return actualizado;
}

export async function verificarFondosDireccionesBtc(
  mnemonic: string | null,
  wallet: WalletInfo,
  redSeleccionada: 'mainnet' | 'testnet'
) {
  if (!mnemonic || !validarMnemonic(mnemonic)) {
    console.error("Mnemonic inválido.");
    return;
  }

  const testnet = redSeleccionada === 'testnet';
  const SATOSHIS_IN_BTC = new BigNumber(1e8);
  const binSeed = bip39.mnemonicToSeedSync(mnemonic);
  const network = testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
  const apiBase = testnet ? "https://mempool.space/testnet/api" : "https://mempool.space/api";
  const root = bip32.fromSeed(binSeed, network);
  const pathBase = wallet.pathBase.replace(/\/[0-1]\/\d+$/, '');

  const metodoBtc = (() => {
    switch (wallet.tipoDireccion) {
      case 'legacy': return bitcoin.payments.p2pkh;
      case 'segwit':
        return (args: bitcoin.payments.Payment) =>
          bitcoin.payments.p2sh({
            redeem: bitcoin.payments.p2wpkh(args),
            network: args.network,
          });
      case 'native':
      default: return bitcoin.payments.p2wpkh;
    }
  })();

  const direccionesConFondos: BtcAddressUtxo[] = [];
  let totalConfirmed = new BigNumber(0);
  let totalUnconfirmed = new BigNumber(0);

  const escanear = async (cambio: number) => {
    let index = 0;
    let vaciasConsecutivas = 0;
    const BATCH_SIZE = 20;

    while (vaciasConsecutivas < 20) {
      const batch: { path: string; address: string; keyPair: BIP32Interface }[] = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const fullPath = `${pathBase}/${cambio}/${index + i}`;
        const child = root.derivePath(fullPath);
        const { address } = metodoBtc({ pubkey: Buffer.from(child.publicKey), network });

        if (address) {
          batch.push({ path: fullPath, address, keyPair: child });
        }
      }

      const respuestas = await Promise.allSettled(
        batch.map(dir =>
          fetch(`${apiBase}/address/${dir.address}/utxo`)
            .then(r => r.json())
            .then((utxos) => ({ ...dir, utxos }))
        )
      );

      for (const respuesta of respuestas) {
        if (respuesta.status === "fulfilled") {
          const { path, address, utxos, keyPair } = respuesta.value;
          let confirmados = new BigNumber(0);
          let noConfirmados = new BigNumber(0);

          for (const utxo of utxos) {
            if (utxo.status.confirmed) confirmados = confirmados.plus(utxo.value);
            else noConfirmados = noConfirmados.plus(utxo.value);
          }

          const total = confirmados.plus(noConfirmados);
          if (total.isGreaterThan(0)) {
            vaciasConsecutivas = 0;
            direccionesConFondos.push({ path, address, utxos, keyPair });
            totalConfirmed = totalConfirmed.plus(confirmados);
            totalUnconfirmed = totalUnconfirmed.plus(noConfirmados);
            console.log(`✔ Fondos en ${address} (${path})`);
          } else {
            vaciasConsecutivas++;
          }
        } else {
          vaciasConsecutivas++;
        }
      }

      index += BATCH_SIZE;
    }
  };

  // Escanear direcciones externas y de cambio
  await escanear(0);
  await escanear(1);

  // Añadir dirección de cambio aunque no tenga fondos si no se detectó ninguna
  let cambioConFondos = direccionesConFondos.find(d => d.path.includes('/1/'));
  if (!cambioConFondos) {
    const child = root.derivePath(`${pathBase}/1/0`);
    const { address } = metodoBtc({ pubkey: Buffer.from(child.publicKey), network });
    if (address) {
      cambioConFondos = { path: `${pathBase}/1/0`, address, utxos: [], keyPair: child };
      direccionesConFondos.push(cambioConFondos);
    }
  }

  const totalBtc = totalConfirmed.plus(totalUnconfirmed).div(SATOSHIS_IN_BTC);
  console.log(`\nResumen total cuenta ${wallet.nombre}:`);
  console.log(`✔ Confirmado: ${totalConfirmed.div(SATOSHIS_IN_BTC).toFixed(8)} BTC`);
  console.log(`✔ No confirmado: ${totalUnconfirmed.div(SATOSHIS_IN_BTC).toFixed(8)} BTC`);
  console.log(`✔ Total: ${totalBtc.toFixed(8)} BTC`);

  return {
    totalConfirmed,
    totalUnconfirmed,
    totalBtc,
    direccionesConFondos,
  };
}

export async function obtenerTxsBtc(
  mnemonic: string | null,
  wallet: WalletInfo,
  redSeleccionada: 'mainnet' | 'testnet'
): Promise<BtcTransactionFormatted[] | undefined> {
    if (!mnemonic || !validarMnemonic(mnemonic)) {
        console.error("Mnemonic inválido.");
        return;
    }

    const testnet = redSeleccionada === 'testnet';
    const binSeed = bip39.mnemonicToSeedSync(mnemonic);
    const network = testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    const apiBase = testnet ? "https://mempool.space/testnet/api" : "https://mempool.space/api";
    const root = bip32.fromSeed(binSeed, network);
    const pathBase = wallet.pathBase.replace(/\/[0-1]\/\d+$/, '');

    const metodoBtc = (() => {
        switch (wallet.tipoDireccion) {
        case 'legacy': return bitcoin.payments.p2pkh;
        case 'segwit':
            return (args: bitcoin.payments.Payment) =>
            bitcoin.payments.p2sh({
                redeem: bitcoin.payments.p2wpkh(args),
                network: args.network,
            });
        case 'native':
        default: return bitcoin.payments.p2wpkh;
        }
    })();

    const resultados: BtcTransactionFormatted[] = [];
    const direccionesCambio = new Set<string>();

    const escanear = async (cambio: number) => {
        let index = 0;
        let vaciasConsecutivas = 0;
        const BATCH_SIZE = 20;

        while (vaciasConsecutivas < 20) {
            const batch: { path: string; address: string }[] = [];

            for (let i = 0; i < BATCH_SIZE; i++) {
                const fullPath = `${pathBase}/${cambio}/${index + i}`;
                const child = root.derivePath(fullPath);
                const { address } = metodoBtc({ pubkey: Buffer.from(child.publicKey), network });

                if (address) {
                    batch.push({ path: fullPath, address });
                }

                if (cambio === 1 && address) {
                    direccionesCambio.add(address);
                }
            }

            const respuestas = await Promise.allSettled(
                batch.map(dir =>
                fetch(`${apiBase}/address/${dir.address}/txs`)
                    .then(r => {
                    if (!r.ok) throw new Error(`Error en fetch para ${dir.address}: ${r.statusText}`);
                        return r.json();
                    })
                )
            );

            let encontradasEnBatch = 0;

            for (let i = 0; i < respuestas.length; i++) {
                const respuesta = respuestas[i];
                const address = batch[i].address;

                if (respuesta.status === "fulfilled") {
                    const txsRaw: BtcTransactionRaw[] = respuesta.value;

                    if (txsRaw.length > 0) {
                        vaciasConsecutivas = 0;
                        encontradasEnBatch++;

                        const txsFormateadas = formatTxsBtc(txsRaw, address, batch[i].path, direccionesCambio);

                        resultados.push(...txsFormateadas);

                        console.log(`✔ Actividad en ${address}, (${batch[i].path}) txs: ${txsFormateadas.length}`);
                    } else {
                        vaciasConsecutivas++;
                    }
                } else {
                    vaciasConsecutivas++;
                    console.error("Error en fetch de txs:", respuesta.reason);
                }
            }

            if (encontradasEnBatch === 0) {
                vaciasConsecutivas += BATCH_SIZE;
            }

            index += BATCH_SIZE;
        }
    };

    await escanear(1); // Direcciones de cambio
    await escanear(0); // Direcciones externas

    resultados.sort((a, b) => {
        if (!a.status.confirmed && b.status.confirmed) return 1;
        if (a.status.confirmed && !b.status.confirmed) return -1;

        const alturaA = a.status.block_height ?? 0;
        const alturaB = b.status.block_height ?? 0;

        return alturaB - alturaA;
    });

    return resultados;
}

export function esDireccionBtcValida(address: string, redSeleccionada: 'mainnet' | 'testnet'): boolean {
    let testnet = false;
    if (redSeleccionada === 'testnet') testnet = true;

    const network = testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

    try {
        // Intenta como legacy (P2PKH) o segwit-P2SH (P2SH también puede entrar aquí)
        bitcoin.address.toOutputScript(address, network);
        return true;
    } catch (_) {}

    try {
        // Intenta como segwit-P2SH específicamente (empieza por "3" en mainnet o "2" en testnet)
        const decoded = bitcoin.address.fromBase58Check(address);
        if (decoded.version === 5) {
            // Solo válido si encaja con la red deseada
            bitcoin.address.toOutputScript(address, network);
            return true;
        }
    } catch (_) {}

    try {
        // Intenta como native segwit (Bech32: bc1... o tb1...)
        const { prefix } = bitcoin.address.fromBech32(address);
        const expectedPrefix = testnet ? 'tb' : 'bc';
        if (prefix === expectedPrefix) {
            bitcoin.address.toOutputScript(address, network);
            return true;
        }
    } catch (_) {}

    return false;
}

export function esDireccionEthValida(address: string): boolean {
    return ethers.isAddress(address);
}


/**
 * Función para sacar de una llamada API el fee recomendado actual
 * @param red Red elegida de BTC
 * @returns Fee actual de la red
 */
async function obtenerFeeActualBtc(red: 'mainnet' | 'testnet'): Promise<number> {
  const url = red === 'mainnet'
    ? 'https://mempool.space/api/v1/fees/recommended'
    : 'https://mempool.space/testnet/api/v1/fees/recommended';

  const res = await fetch(url);
  const data = await res.json();

  return data.fastestFee ?? 20;
}

/**
 * Función para calcular el tamaño estimado de la transacción
 * @param numInputs Número de inputs (entrada)
 * @param numOutputs Número de outputs (salida)
 * @param addresses Lista de direcciones a iterar
 * @returns Devuelve el tamaño estimado de la Tx
 */
function estimateTxSize(numInputs: number, numOutputs: number, addresses: string[]) {
  // Estimación según tipo de input (segwit, native segwit, legacy...)
  const inputSize = addresses[0].startsWith('bc1') || addresses[0].startsWith('tb1')
    ? 68 // native segwit
    : addresses[0].startsWith('3') || addresses[0].startsWith('2')
    ? 91 // p2sh-segwit
    : 148; // legacy

  const outputSize = 34;
  return numInputs * inputSize + numOutputs * outputSize + 10; // +10 para encabezados
}

export async function calcularEnvioTotalBtc(
  direccionesConFondos: BtcAddressUtxo[],
  destino: string,
  redSeleccionada: 'mainnet' | 'testnet',
  cantidadBtc?: number,
  satPerVbyte?: number
): Promise<{ cantidadEnviar: BigNumber, feeReal: BigNumber }> {
    if (!satPerVbyte) {
        satPerVbyte = await obtenerFeeActualBtc(redSeleccionada);
    }

    if (!cantidadBtc) {
        cantidadBtc = 0;
    }
    const testnet = redSeleccionada === 'testnet';
    const network = testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

    const utxos: {
        txid: string;
        vout: number;
        value: number;
        address: string;
        keyPair: BIP32Interface;
    }[] = [];

    const SATOSHIS_IN_BTC = new BigNumber(1e8);
    const cantidadSatoshis = new BigNumber(cantidadBtc).multipliedBy(SATOSHIS_IN_BTC);

    let totalDisponible = new BigNumber(0);

    for (const entrada of direccionesConFondos) {
        for (const utxo of entrada.utxos) {
            utxos.push({
                txid: utxo.txid,
                vout: utxo.vout,
                value: utxo.value,
                address: entrada.address,
                keyPair: entrada.keyPair!,
            });
            totalDisponible = totalDisponible.plus(utxo.value);
        }
    }

    const psbt = new bitcoin.Psbt({ network });

    for (const utxo of utxos) {
        const pubkey = Buffer.from(utxo.keyPair.publicKey);

        const tipo = utxo.address.startsWith('1') || utxo.address.startsWith('m') || utxo.address.startsWith('n')
        ? 'legacy'
        : utxo.address.startsWith('3') || utxo.address.startsWith('2')
            ? 'segwit'
            : utxo.address.startsWith('bc1') || utxo.address.startsWith('tb1')
            ? 'native'
            : 'desconocido';

        let payment;
        switch (tipo) {
            case 'legacy':
                payment = bitcoin.payments.p2pkh({ pubkey, network });
                const rawTx = await fetchRawTransaction(utxo.txid, testnet);
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    nonWitnessUtxo: Buffer.from(rawTx, 'hex'),
                });
                break;
            case 'segwit':
                payment = bitcoin.payments.p2sh({
                    redeem: bitcoin.payments.p2wpkh({ pubkey, network }),
                    network,
                });
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: payment.output!,
                        value: utxo.value,
                    },
                    redeemScript: bitcoin.payments.p2wpkh({ pubkey, network }).output!,
                });
                break;
            case 'native':
                payment = bitcoin.payments.p2wpkh({ pubkey, network });
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: payment.output!,
                        value: utxo.value,
                    },
                });
                break;
            default:
                throw new Error(`Tipo de dirección desconocido: ${utxo.address}`);
        }
    }

    // Añadir un output temporal de 0 para estimar tamaño
    psbt.addOutput({
        address: destino,
        value: 0,
    });

    let numOutputs = 1;

    if (cantidadBtc !== 0) {
        const cambioRestante = totalDisponible.minus(cantidadSatoshis);
        if (cambioRestante.isGreaterThan(0)) numOutputs++;
    } 

    const estimatedVbytes = estimateTxSize(utxos.length, numOutputs, utxos.map(u => u.address));
    let fee = new BigNumber(estimatedVbytes).multipliedBy(satPerVbyte).integerValue();
    if (fee.isLessThan(351)) fee = new BigNumber(351);

    // Cantidad que realmente se puede enviar
    const cantidadEnviar = totalDisponible.minus(fee);

    if (cantidadEnviar.lte(0)) {
        throw new Error('El fee es mayor o igual al total disponible');
    }

    return {
        cantidadEnviar,
        feeReal: fee,
    };
}

// Función para poder enviar Bitcoin
export async function enviarBtc(
  direccionesConFondos: BtcAddressUtxo[],
  destino: string,
  cantidadBtc: number,
  redSeleccionada: 'mainnet' | 'testnet',
  feeSat: BigNumber = new BigNumber(500) // fee por defecto
) {
    const SATOSHIS_IN_BTC = new BigNumber(1e8);
    const cantidadSatoshis = new BigNumber(cantidadBtc).multipliedBy(SATOSHIS_IN_BTC);

    let totalSeleccionado = new BigNumber(0);
    const utxos: { txid: string; address: string; vout: number; value: number; keyPair: BIP32Interface }[] = [];

    let testnet = false;
    if (redSeleccionada === 'testnet') testnet = true;

    // Recolectar UTXOs confirmados hasta alcanzar la cantidad requerida + fee
    for (const entrada of direccionesConFondos) {
        for (const utxo of entrada.utxos) {
            utxos.push({
                txid: utxo.txid,
                address: entrada.address,
                vout: utxo.vout,
                value: utxo.value,
                keyPair: entrada.keyPair!,
            });
            totalSeleccionado = totalSeleccionado.plus(utxo.value);

            if (totalSeleccionado.isGreaterThanOrEqualTo(cantidadSatoshis.plus(feeSat))) {
                break;
            }
        }

        if (totalSeleccionado.isGreaterThanOrEqualTo(cantidadSatoshis.plus(feeSat))) {
            break;
        }
    }

    if (totalSeleccionado.isLessThan(cantidadSatoshis.plus(feeSat))) {
        throw new Error('Fondos insuficientes.');
    }

    const network = testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

    const psbt = new bitcoin.Psbt({ network });

    for (const utxo of utxos) {
        const pubkey = Buffer.from(utxo.keyPair.publicKey);

        const tipo = (() => {
            const prefix = utxo.address[0];
            if (prefix === '1' || prefix === 'm' || prefix === 'n') return 'legacy';      // P2PKH
            if (prefix === '3' || prefix === '2') return 'segwit';                        // P2SH-SegWit
            if (utxo.address.startsWith('bc1') || utxo.address.startsWith('tb1')) return 'native'; // P2WPKH
            throw new Error(`Tipo de dirección desconocido: ${utxo.address}`);
        })();

        let payment;
        switch (tipo) {
            case 'legacy':
                payment = bitcoin.payments.p2pkh({ pubkey, network });
                break;
            case 'segwit':
                payment = bitcoin.payments.p2sh({
                    redeem: bitcoin.payments.p2wpkh({ pubkey, network }),
                    network,
                });
                break;
            case 'native':
                payment = bitcoin.payments.p2wpkh({ pubkey, network });
                break;
            default:
                throw new Error(`Tipo de dirección no soportado para ${utxo.address}`);
        }

        if (tipo === 'legacy') {
            const rawTx = await fetchRawTransaction(utxo.txid, testnet);
            psbt.addInput({
                hash: utxo.txid,
                index: utxo.vout,
                nonWitnessUtxo: Buffer.from(rawTx, 'hex'),
            });
        } else {
        const input: {
            hash: string;
            index: number;
            witnessUtxo: {
                script: Buffer;
                value: number;
            };
            redeemScript?: Buffer;
            } = {
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
                script: payment.output!,
                value: utxo.value,
            },
        };

            if (tipo === 'segwit') {
                input.redeemScript = bitcoin.payments.p2wpkh({ pubkey, network }).output!;
            }

            psbt.addInput(input);
        }
    }

    if (feeSat.eq(500)) {
        const numInputs = utxos.length;
        const tieneCambio = totalSeleccionado.isGreaterThan(cantidadSatoshis);
        const numOutputs = tieneCambio ? 2 : 1;
        const addresses = utxos.map(u => u.address);

        const estimatedSize = estimateTxSize(numInputs, numOutputs, addresses);
        const satPerVbyte = await obtenerFeeActualBtc(redSeleccionada);

        feeSat = new BigNumber(estimatedSize).multipliedBy(satPerVbyte).integerValue();

        console.log(`Fee estimado: ${feeSat.toString()} sat (${satPerVbyte} sat/vB × ${estimatedSize} vB)`);
    }

    psbt.addOutput({
        address: destino,
        value: cantidadSatoshis.toNumber(),
    });

    const cambioRestante = totalSeleccionado.minus(cantidadSatoshis.plus(feeSat));
    if (cambioRestante.isGreaterThan(0)) {
        const dirCambio = direccionesConFondos.find((d) => d.path.includes('/1/'));
        if (!dirCambio) {
            throw new Error("Error FATAL: No se ha encontrado dirección de cambio")
        }
        psbt.addOutput({
            address: dirCambio.address,
            value: cambioRestante.toNumber(),
        });
    }

    // Firmar inputs
    utxos.forEach((utxo, i) => {
        const keyPair = utxo.keyPair;
        
        if (!keyPair) {
            throw new Error(`No se encontró keyPair para la dirección ${utxo.address}`);
        }

        if (!keyPair.privateKey) {
            throw new Error(`El keyPair de ${utxo.address} no tiene privateKey`);
        }

        try {
            // Convertir BIP32Interface a ECPair (que implementa Signer)
            const ecPair = ECPair.fromPrivateKey(
                Buffer.from(keyPair.privateKey),
                {
                    network: testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin,
                }
            );

            // Crear objeto compatible con Signer (con publicKey tipo Buffer)
            const signer: bitcoin.Signer = {
                publicKey: Buffer.from(ecPair.publicKey),
                sign: (hash: Buffer) => {
                    const signature = ecPair.sign(hash);
                    return Buffer.from(signature);
                },
            };


            // Firmar el input
            psbt.signInput(i, signer);
            
            // Opcional: Validar firma inmediatamente
            const isValid = psbt.validateSignaturesOfInput(i, (pubkey, msghash, signature) => {
                return ECPair.fromPublicKey(pubkey).verify(msghash, signature);
            });
            
            if (!isValid) {
                throw new Error(`Firma inválida para el input ${i}`);
            }
        } catch (e) {
            console.error(`❌ Error firmando input ${i}:`, e);
            throw new Error(`No se pudo firmar el input ${i}: ${e instanceof Error ? e.message : String(e)}`);
        }
    });

    psbt.validateSignaturesOfAllInputs((pubkey, msghash, signature) =>
        ECPair.fromPublicKey(pubkey).verify(msghash, signature)
    );
    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();

    // Enviar a la red
    async function broadcastTx(txHex: string): Promise<string> {
        const url = testnet
        ? 'https://mempool.space/testnet/api/tx'
        : 'https://mempool.space/api/tx';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: txHex,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al enviar la transacción: ${response.status} - ${errorText}`);
        }

        return await response.text(); // devuelve el txid
    }

    const txid = await broadcastTx(txHex);

    return {
        txid,
        rawTx: txHex,
        totalInput: totalSeleccionado.dividedBy(SATOSHIS_IN_BTC),
        totalOutput: cantidadBtc,
        fee: feeSat.dividedBy(SATOSHIS_IN_BTC),
    };
}

// Realizar transacción en Legacy
async function fetchRawTransaction(txid: string, testnet: boolean): Promise<string> {
    const url = testnet
        ? `https://mempool.space/testnet/api/tx/${txid}/hex`
        : `https://mempool.space/api/tx/${txid}/hex`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`No se pudo obtener rawTx de ${txid}: ${await response.text()}`);
    }

    return await response.text();
}

/**
 * Función para crear una wallet de Ethereum a partir del mnemonic.
 * @param mnemonic Mnemonic guardado en .bin
 * @param indexPrivada Índice de la clave privada a generar
 * @returns Devuelve un array con información de la wallet
 */
function crearWalletEth(mnemonic: string | null, indexPrivada: number) {
    if (!mnemonic || !validarMnemonic(mnemonic)) return;

    // Convertir la frase semilla en una semilla binaria
    const binSeed = bip39.mnemonicToSeedSync(mnemonic);

    // Derivar raíz BIP32
    const root = bip32.fromSeed(binSeed);

    const path = `m/44'/60'/${indexPrivada}'/0/0`;

    const childEthereum = root.derivePath(path);

    // Verificar que la clave privada de Ethereum no es undefined
    if (!childEthereum.privateKey) {
        throw new Error('Clave privada de Ethereum no disponible');
    }

    const walletEthereum = new ethers.Wallet(Buffer.from(childEthereum.privateKey).toString('hex'));
    const addressEthereum = walletEthereum.address;

    return {
        index: indexPrivada,
        path,
        address: addressEthereum
    };
}

export async function crearYGuardarWalletEth(nombre: string, mnemonic: string | null, indexPrivada: number) {
    if (!mnemonic) return false;
    const walletEth = crearWalletEth(mnemonic, indexPrivada);

    if (!walletEth) {
        console.error('No se pudo crear la wallet');
        return false;
    }

    // Completa la wallet con el formato WalletInfo
    const walletInfo: WalletInfo = {
        tipoMoneda: 'ETH',
        nombre: nombre,
        pathBase: walletEth.path,
        indicePrivada: indexPrivada,
        direccionPublica: walletEth.address,
        ultSaldoGuardado: '0.0000000',
        ultSaldoGuardadoEur: 0
    };

    const resultado = await addWallet(walletInfo);

    if (resultado) {
        console.log('Wallet guardada correctamente');
    } else {
        console.error('Error guardando la wallet');
    }

    return resultado;
}

export async function calcularFeeEth(
    wallet: WalletInfo,
    mnemonic: string,
    destino: string,
    cantidadEth: string,
    redSeleccionada: 'mainnet' | 'testnet',
    feeWei?: BigNumber) {
    if (!mnemonic || !validarMnemonic(mnemonic)) return;

    // Convertir la frase semilla en una semilla binaria
    const binSeed = bip39.mnemonicToSeedSync(mnemonic);

    // Derivar raíz BIP32
    const root = bip32.fromSeed(binSeed);

    const childEthereum = root.derivePath(wallet.pathBase);

    const clavePrivada = childEthereum.privateKey;

    // Verificar que la clave privada de Ethereum no es undefined
    if (!clavePrivada) {
        throw new Error('Clave privada de Ethereum no disponible');
    }

    const red = redSeleccionada === 'mainnet' ? 'homestead' : 'sepolia';

    const provider = new ethers.AlchemyProvider(red, "w3jHpOUC794ll1nhzQxVITITAs1MBWNM");

    const signer = new ethers.Wallet(Buffer.from(clavePrivada).toString('hex'), provider);

    const txBase = {
        to: destino,
        value: ethers.parseEther(cantidadEth)
    };

    // Estimar gasLimit
    const gasLimit = await signer.estimateGas(txBase);

    // Obtener gasPrice (si no hay manual, usar el de la red)
    let gasPrice = feeWei ? BigInt(feeWei.toFixed()) : (await provider.getFeeData()).gasPrice;

    if (!gasPrice) throw new Error("No se pudo obtener gasPrice");

    return {
        gasLimit,
        gasPrice
    };
}

export async function calcularEnvioTotalEth(    
    wallet: WalletInfo,
    mnemonic: string,
    destino: string,
    redSeleccionada: 'mainnet' | 'testnet',
    cantidadEth: string) {
    if (!mnemonic || !validarMnemonic(mnemonic)) return;
    
    let resultadoFees = await calcularFeeEth(wallet, mnemonic, destino, cantidadEth, redSeleccionada);

    if (!resultadoFees) throw new Error('Error al calcular los fees.')

    const { gasLimit, gasPrice } = resultadoFees;

    // fee total en wei = gasLimit * gasPrice
    const feeTotalWei = gasLimit * gasPrice;

    // Convertir cantidadEth a wei (BigInt)
    const cantidadEthWei = ethers.parseEther(cantidadEth); // bigint

    if (cantidadEthWei < feeTotalWei) {
        throw new Error('Cantidad muy pequeña para cubrir el fee');
    }

    // Cantidad a enviar = cantidad total - fee total
    const cantidadEnviarWei = cantidadEthWei - feeTotalWei;
    
    return {
        cantidadEnviar: ethers.formatEther(cantidadEnviarWei), // en string ETH
        feeGwei: ethers.formatUnits(feeTotalWei.toString(), "gwei"), // Luego reconvertir a wei
        gasLimit,
        gasPrice: gasPrice.toString()
    };
}

export async function enviarEth(
    wallet: WalletInfo,
    mnemonic: string,
    destino: string,
    cantidadEth: string,
    redSeleccionada: 'mainnet' | 'testnet',
    gasPrice: bigint,
    gasLimit: bigint) {
    if (!mnemonic || !validarMnemonic(mnemonic)) return;

    // Convertir la frase semilla en una semilla binaria
    const binSeed = bip39.mnemonicToSeedSync(mnemonic);

    // Derivar raíz BIP32
    const root = bip32.fromSeed(binSeed);

    const childEthereum = root.derivePath(wallet.pathBase);

    const clavePrivada = childEthereum.privateKey;

    // Verificar que la clave privada de Ethereum no es undefined
    if (!clavePrivada) {
        throw new Error('Clave privada de Ethereum no disponible');
    }
    
    const red = redSeleccionada === 'mainnet' ? 'homestead' : 'sepolia';

    const provider = new ethers.AlchemyProvider(red, "w3jHpOUC794ll1nhzQxVITITAs1MBWNM");

    const signer = new ethers.Wallet(Buffer.from(clavePrivada).toString('hex'), provider);

    const tx = {
        to: destino,
        value: ethers.parseEther(cantidadEth),
        gasLimit: gasLimit,
        gasPrice: gasPrice
    };

    try {
        const response = await signer.sendTransaction(tx);
        await response.wait(1, 180000);
        console.log("Transacción enviada con éxito:", response.hash);
        return response.hash;
    } catch (error: any) {
        console.error("Error al enviar la transacción:", error);

        const mensajeError = error?.reason || error?.message || "Error desconocido al enviar la transacción";
        throw new Error(`Error al enviar la transacción: ${mensajeError}`);
    }
} 