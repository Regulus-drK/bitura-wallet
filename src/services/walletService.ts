import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { ethers } from 'ethers';
import { Buffer } from 'buffer';
import { p2wpkh } from 'bitcoinjs-lib/src/payments';
import type { WalletInfo } from '../types/WalletInfo';
import { addWallet } from './apiService';
import type { testnet } from 'bitcoinjs-lib/src/networks';

// Crear instancia de bip32 con tiny-secp256k1
const bip32 = BIP32Factory(ecc);

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
    const pathBitcoin = `m/84'/0'/0'/0/${index}`; // BIP44 - BTC Native SegWit
    const childBitcoin = root.derivePath(pathBitcoin);
    const { address: addressBitcoin } = bitcoin.payments.p2wpkh({ 
        pubkey: Buffer.from(childBitcoin.publicKey),
        network: network
    });

    // Ethereum
    const pathEthereum = `m/44'/60'/0'/0/${index}`; // BIP44 - Ethereum
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

export function crearWalletBtc(mnemonic: string | null, indexPrivada: number, tipoDireccion: string, testnet?: boolean) {
    let network;
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

    const path = `m/${derivacion}/0'/0/${indexPrivada}`;

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
        indiceActual: walletBtc.index,
    };

    const resultado = await addWallet(walletInfo);

    if (resultado) {
        console.log('Wallet guardada correctamente');
    } else {
        console.error('Error guardando la wallet');
    }

    return resultado;
}

export async function obtenerSaldoEthereum(address: string) {
    const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
    const balance = await provider.getBalance(address);
    console.log(`Saldo ETH (testnet): ${ethers.formatEther(balance)} ETH`);
    return balance;
}
