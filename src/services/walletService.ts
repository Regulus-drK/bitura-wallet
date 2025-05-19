import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import ECPairFactory from 'ecpair';
import { ethers } from 'ethers';
import BigNumber from "bignumber.js";
import { Buffer } from 'buffer';
import type { WalletInfo } from '../types/WalletInfo';
import { addWallet, consultarDireccion, updateWallet } from './apiService';
import { parseBtcResponse, type BtcResponse, type ParsedBtcResponse } from '../types/BtcBalance';

// Crear instancia de bip32 con tiny-secp256k1
const bip32 = BIP32Factory(ecc);

const ECPair = ECPairFactory(ecc);

export function validarMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
}

/**
 * Crea una wallet para Bitcoin y Ethereum a partir de una frase semilla.
 * @param mnemonic La frase semilla.
 * @returns Wallets para ambas redes.
 */
export function createWallets(mnemonic: string | null, index: number, testnet?: boolean) {
    let network;
    if (testnet) {
        network = bitcoin.networks.testnet;
    }
    if (!mnemonic) return;

    if (!validarMnemonic(mnemonic)) return;

    // Convertir la frase semilla en una semilla binaria
    const binSeed = bip39.mnemonicToSeedSync(mnemonic);

    // Derivar raíz BIP32
    const root = bip32.fromSeed(binSeed);

    // Para Bitcoin
    const pathBitcoin = `m/84'/0'/0'/${index}'/0`; // BIP44 - BTC Native SegWit
    const childBitcoin = root.derivePath(pathBitcoin);
    const { address: addressBitcoin } = bitcoin.payments.p2wpkh({ 
        pubkey: Buffer.from(childBitcoin.publicKey),
        network: network
    });

    // Ethereum
    const pathEthereum = `m/44'/60'/0'/${index}'/0`; // BIP44 - Ethereum
    const childEthereum = root.derivePath(pathEthereum);

    // Verificar que la clave privada de Ethereum no es undefined
    if (!childEthereum.privateKey) {
        throw new Error('Clave privada de Ethereum no disponible');
    }

    const walletEthereum = new ethers.Wallet(Buffer.from(childEthereum.privateKey).toString('hex'));
    const addressEthereum = walletEthereum.address;

    return {
        bitcoin: {
            address: addressBitcoin!,
            privateKey: childBitcoin.privateKey!,
        },
        ethereum: {
            address: addressEthereum,
            privateKey: walletEthereum.privateKey,
        },
    };
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

    const path = `m/${derivacion}/0'/${indexPrivada}'/0`;

    const childBitcoin = root.derivePath(path);
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
    tipoDireccion: 'legacy' | 'segwit' | 'native', testnet?: boolean) 
{
    if (testnet === undefined) testnet = false;

    let network: 'mainnet' | 'testnet';
    if (testnet) {
        network = 'testnet';
    } else {
        network = 'mainnet';
    }

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
        red: network,
        indicePrivada: index,
        indicePublicaActual: 0,
        direccionPublica: walletBtc.address
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

    // Convertir la frase semilla en una semilla binaria
    const binSeed = bip39.mnemonicToSeedSync(mnemonic);

    // Derivar raíz BIP32
    const root = bip32.fromSeed(binSeed);

    let indiceSiguiente = cuenta.indicePublicaActual! + 1;

    const path = cuenta.pathBase + `/${indiceSiguiente}`;

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
        network: bitcoin.networks.bitcoin
    });

    cuenta.indicePublicaActual = indiceSiguiente;
    cuenta.direccionPublica = addressBitcoin!;

    const actualizado = await updateWallet(cuenta.nombre, cuenta);

    if (actualizado) {
        console.log('Dirección pública generada correctamente.');
    } else {
        console.error('Error al generar la dirección pública.');
    }

    return actualizado;
}

export async function verificarFondosDireccionesBtc(
    mnemonic: string | null,
    wallet: WalletInfo,
    testnet: boolean = false
) {
    if (!mnemonic || !validarMnemonic(mnemonic)) {
        console.error("Mnemonic inválido.");
        return;
    }

    const SATOSHIS_IN_BTC = new BigNumber(1e8);
    const binSeed = bip39.mnemonicToSeedSync(mnemonic);
    const root = bip32.fromSeed(binSeed);
    const network = testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    const pathBase = wallet.pathBase.replace(/\/[0-1]\/\d+$/, '');
    const metodoBtc = (() => {
        switch (wallet.tipoDireccion) {
            case 'legacy':
                return bitcoin.payments.p2pkh;
            case 'segwit':
                return (args: bitcoin.payments.Payment) =>
                    bitcoin.payments.p2sh({
                        redeem: bitcoin.payments.p2wpkh(args),
                        network: args.network,
                    });
            case 'native':
            default:
                return bitcoin.payments.p2wpkh;
        }
    })();

    let totalConfirmed = new BigNumber(0);
    let totalUnconfirmed = new BigNumber(0);

    // Recorremos tanto direcciones externas como de cambio
    for (let cambio = 0; cambio <= 1; cambio++) {
        let index = 0;
        let gapCount = 0;
        const gapLimit = 20;

        while (gapCount < gapLimit) {
            const fullPath = `${pathBase}/${cambio}/${index}`;
            const child = root.derivePath(fullPath);
            const { address } = metodoBtc({
                pubkey: Buffer.from(child.publicKey),
                network,
            });

            if (!address) {
                index++;
                gapCount++;
                continue;
            }

            try {
                const datosRaw = await consultarDireccion(address, "1");
                const datos: ParsedBtcResponse = parseBtcResponse(datosRaw as BtcResponse);

                const hayFondos = datos.confirmedSats.isGreaterThan(0) || datos.unconfirmedSats.isGreaterThan(0);

                if (hayFondos) {
                    console.log(`Fondos encontrados en dirección ${address} (${fullPath})`);
                    console.log(`  ✔ Confirmados: ${datos.confirmedBtc.toFixed()} BTC`);
                    console.log(`  ✔ No confirmados: ${datos.unconfirmedBtc.toFixed()} BTC`);
                    gapCount = 0; // Reset gap
                } else {
                    gapCount++;
                }

                totalConfirmed = totalConfirmed.plus(datos.confirmedSats);
                totalUnconfirmed = totalUnconfirmed.plus(datos.unconfirmedSats);
            } catch (error) {
                console.warn(`Error al consultar dirección ${address}:`, error);
                gapCount++; // contamos como vacía si hay error
            }

            index++;
        }
    }

    const totalBtc = totalConfirmed.plus(totalUnconfirmed).dividedBy(SATOSHIS_IN_BTC);

    console.log(`\nResumen:`)
    console.log(`✔ Total Confirmado: ${totalConfirmed.dividedBy(SATOSHIS_IN_BTC).toFixed(8)} BTC`);
    console.log(`✔ Total No Confirmado: ${totalUnconfirmed.dividedBy(SATOSHIS_IN_BTC).toFixed(8)} BTC`);
    console.log(`✔ Total BTC: ${totalBtc.toFixed(8)} BTC`);

    return {
        totalConfirmed,
        totalUnconfirmed,
        totalBtc,
    };
}

export function esDireccionValida(address: string, tipo: 'legacy' | 'segwit' | 'native', testnet: boolean = false): boolean {
    const network = testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

    try {
        switch (tipo) {
            case 'legacy':
                bitcoin.address.toOutputScript(address, network); // p2pkh
                break;
            case 'segwit':
                const decoded = bitcoin.address.fromBase58Check(address);
                if (decoded.version !== 5) return false; // p2sh (3...)
                break;
            case 'native':
                bitcoin.address.fromBech32(address); // bech32 (bc1...)
                break;
            default:
                return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

// Dios sabe si esto funcionará
export async function enviarBtc(
  mnemonic: string,
  wallet: WalletInfo,
  destino: string,
  cantidadBtc: number,
  testnet: boolean = false,
  feeSat: BigNumber = new BigNumber(500) // fee por defecto
) {
    const SATOSHIS_IN_BTC = new BigNumber(1e8);
    const cantidadSatoshis = new BigNumber(cantidadBtc).multipliedBy(SATOSHIS_IN_BTC);

    const binSeed = bip39.mnemonicToSeedSync(mnemonic);
    const root = bip32.fromSeed(binSeed);
    const network = testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

    const pathBase = wallet.pathBase.replace(/\/[0-1]\/\d+$/, '');
    const metodoBtc = (() => {
        switch (wallet.tipoDireccion) {
        case 'legacy':
            return bitcoin.payments.p2pkh;
        case 'segwit':
            return (args: bitcoin.payments.Payment) =>
            bitcoin.payments.p2sh({
                redeem: bitcoin.payments.p2wpkh(args),
                network: args.network,
            });
        case 'native':
        default:
            return bitcoin.payments.p2wpkh;
        }
    })();

    let utxos: { txid: string; vout: number; value: number; keyPair: any }[] = [];
    let totalSeleccionado = new BigNumber(0);

    // Función para obtener UTXOs desde Blockstream API
    async function fetchUtxos(address: string, keyPair: any) {
        const url = testnet
        ? `https://blockstream.info/testnet/api/address/${address}/utxo`
        : `https://blockstream.info/api/address/${address}/utxo`;

        try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error al obtener UTXOs: ${response.statusText}`);

        const data: Array<{ txid: string; vout: number; value: number }> = await response.json();

        data.forEach((utxo) => {
            utxos.push({
            txid: utxo.txid,
            vout: utxo.vout,
            value: utxo.value,
            keyPair,
            });
            totalSeleccionado = totalSeleccionado.plus(utxo.value);
        });
        } catch (error) {
        console.warn(`Error fetch UTXOs para ${address}:`, error);
        }
    }

    // Recorremos direcciones externas y de cambio
    for (let cambio = 0; cambio <= 1; cambio++) {
        let index = 0;
        let gapCount = 0;
        const gapLimit = 20;

        while (
        gapCount < gapLimit &&
        totalSeleccionado.isLessThan(cantidadSatoshis.plus(feeSat))
        ) {
        const path = `${pathBase}/${cambio}/${index}`;
        const child = root.derivePath(path);
        const { address } = metodoBtc({ pubkey: Buffer.from(child.publicKey), network });

        if (!address) {
            gapCount++;
            index++;
            continue;
        }

        const utxosPrevios = utxos.length;

        await fetchUtxos(address, child);

        if (utxos.length > utxosPrevios) {
            gapCount = 0; // reiniciamos gap si encontramos utxos
        } else {
            gapCount++;
        }

        if (totalSeleccionado.isGreaterThanOrEqualTo(cantidadSatoshis.plus(feeSat))) {
            break; // Ya tenemos suficientes fondos
        }

        index++;
        }

        if (totalSeleccionado.isGreaterThanOrEqualTo(cantidadSatoshis.plus(feeSat))) {
        break; // Ya tenemos suficientes fondos
        }
    }

    if (totalSeleccionado.isLessThan(cantidadSatoshis.plus(feeSat))) {
        throw new Error('Fondos insuficientes.');
    }

    // Crear la transacción
    const psbt = new bitcoin.Psbt({ network });

    for (const utxo of utxos) {
        psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
            script: metodoBtc({ pubkey: utxo.keyPair.publicKey, network }).output!,
            value: utxo.value,
        },
        });
    }

    psbt.addOutput({
        address: destino,
        value: cantidadSatoshis.toNumber(),
    });

    const cambioRestante = totalSeleccionado.minus(cantidadSatoshis.plus(feeSat));
    if (cambioRestante.isGreaterThan(0)) {
        const cambioPath = `${pathBase}/1/0`;
        const cambioKey = root.derivePath(cambioPath);
        const { address: direccionCambio } = metodoBtc({ pubkey: Buffer.from(cambioKey.publicKey), network });
        if (!direccionCambio) throw new Error('Error derivando dirección de cambio');
        psbt.addOutput({
        address: direccionCambio,
        value: cambioRestante.toNumber(),
        });
    }

    // Firmar cada input
    utxos.forEach((utxo, i) => {
        psbt.signInput(i, utxo.keyPair);
    });

    // Validar y finalizar
    psbt.validateSignaturesOfAllInputs((pubkey, msghash, signature) =>
        ECPair.fromPublicKey(pubkey).verify(msghash, signature)
    );
    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();

    // Función para enviar la tx a Blockstream
    async function broadcastTx(txHex: string, testnet: boolean): Promise<string> {
        const url = testnet
            ? 'https://blockstream.info/testnet/api/tx'
            : 'https://blockstream.info/api/tx';

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

        // La respuesta es el txid de la tx propagada
        const txid = await response.text();
        return txid;
    }

    // Llamada para enviar
    const txid = await broadcastTx(txHex, testnet);

    return {
        txid,
        rawTx: txHex,
        totalInput: totalSeleccionado.dividedBy(SATOSHIS_IN_BTC),
        totalOutput: cantidadBtc,
        fee: feeSat.dividedBy(SATOSHIS_IN_BTC),
    };
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

    const path = `m/44'/60'/${indexPrivada}'/0`;

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
        direccionPublica: walletEth.address
    };

    const resultado = await addWallet(walletInfo);

    if (resultado) {
        console.log('Wallet guardada correctamente');
    } else {
        console.error('Error guardando la wallet');
    }

    return resultado;
}