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
import { type BtcAddressUtxo} from '../types/BtcBalance';

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
        ultSaldoGuardado: '0.000000',
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
  redSeleccionada: 'mainnet' | 'testnet'
) {
    if (!mnemonic || !validarMnemonic(mnemonic)) {
        console.error("Mnemonic inválido.");
        return;
    }

    let testnet = false;
    if (redSeleccionada === 'testnet') testnet = true;

    const SATOSHIS_IN_BTC = new BigNumber(1e8);
    const binSeed = bip39.mnemonicToSeedSync(mnemonic);
    const network = testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    const apiBase = testnet ? "https://mempool.space/testnet/api" : "https://mempool.space/api";
    const root = bip32.fromSeed(binSeed, network);
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

    const direcciones: { path: string; address: string; keyPair: BIP32Interface }[] = [];

    // Derivar 20 externas y 20 de cambio (como en tu versión funcional)
    for (let cambio = 0; cambio <= 1; cambio++) {
        for (let index = 0; index < 20; index++) {
            const fullPath = `${pathBase}/${cambio}/${index}`;
            const child = root.derivePath(fullPath);
            const { address } = metodoBtc({
                pubkey: Buffer.from(child.publicKey),
                network,
            });

            if (address) {
                direcciones.push({ path: fullPath, address, keyPair: child });
            }
        }
    }

    // Consulta de UTXOs
    const respuestas = await Promise.allSettled(
        direcciones.map(dir =>
        fetch(`${apiBase}/address/${dir.address}/utxo`)
            .then(r => r.json())
            .then((utxos) => ({ path: dir.path, address: dir.address, utxos, keyPair: dir.keyPair }))
        )
    );

    let totalConfirmed = new BigNumber(0);
    let totalUnconfirmed = new BigNumber(0);
    const direccionesConFondos: BtcAddressUtxo[] = [];

    for (const respuesta of respuestas) {
        if (respuesta.status === "fulfilled") {
            const { path, address, utxos, keyPair } = respuesta.value;
            let confirmados = new BigNumber(0);
            let noConfirmados = new BigNumber(0);

        for (const utxo of utxos) {
            if (utxo.status.confirmed) {
                confirmados = confirmados.plus(utxo.value);
            } else {
                noConfirmados = noConfirmados.plus(utxo.value);
            }
        }

        const total = confirmados.plus(noConfirmados);
        if (total.isGreaterThan(0)) {
            direccionesConFondos.push({ path, address, utxos, keyPair });
            console.log(`✔ Fondos en ${address} (${path})`);
            console.log(`  Confirmados: ${confirmados.div(SATOSHIS_IN_BTC).toFixed()} BTC`);
            console.log(`  No confirmados: ${noConfirmados.div(SATOSHIS_IN_BTC).toFixed()} BTC`);
        }

        totalConfirmed = totalConfirmed.plus(confirmados);
        totalUnconfirmed = totalUnconfirmed.plus(noConfirmados);
        }
    }

    // Busca dirección de cambio con fondos para la hora de enviar BTC
    let cambioConFondos = direccionesConFondos.find(d => d.path.includes('/1/'));

    // Si no hay cambio con fondos, añade la primera dirección de cambio derivada (aunque sin fondos)
    if (!cambioConFondos) {
        const primeraDireccionCambio = direcciones.find(d => d.path.includes('/1/'));
        if (primeraDireccionCambio) {
        // Insertamos la dirección de cambio aunque no tenga fondos, con utxos vacíos
        cambioConFondos = { 
            path: primeraDireccionCambio.path, 
            address: primeraDireccionCambio.address, 
            utxos: [], 
            keyPair: primeraDireccionCambio.keyPair 
        };
        direccionesConFondos.push(cambioConFondos);
        }
    }

    const totalBtc = totalConfirmed.plus(totalUnconfirmed).div(SATOSHIS_IN_BTC);

    console.log(`\nResumen total:`);
    console.log(`✔ Confirmado: ${totalConfirmed.div(SATOSHIS_IN_BTC).toFixed(8)} BTC`);
    console.log(`✔ No confirmado: ${totalUnconfirmed.div(SATOSHIS_IN_BTC).toFixed(8)} BTC`);
    console.log(`✔ Total: ${totalBtc.toFixed(8)} BTC`);

    return {
        totalConfirmed,
        totalUnconfirmed,
        totalBtc,
        direccionesConFondos, // Para usar en envío
    };
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
        direccionPublica: walletEth.address,
        ultSaldoGuardado: '0.000000',
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