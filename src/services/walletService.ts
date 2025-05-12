import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { ethers } from 'ethers';
import { Buffer } from 'buffer';

// Crear instancia de bip32 con tiny-secp256k1
const bip32 = BIP32Factory(ecc);

function validarMnemonic(mnemonic: string) {
    if (!bip39.validateMnemonic(mnemonic)) throw new Error('Frase semilla inválida');
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
    validarMnemonic(mnemonic);

    // Convertir la frase semilla en una semilla binaria
    const binSeed = bip39.mnemonicToSeedSync(mnemonic);

    // Derivar raíz BIP32
    const root = bip32.fromSeed(binSeed);

    // Para Bitcoin Testnet
    const pathBitcoin = `m/44'/1'/0'/0/${index}`; // BIP44 - BTC Testnet
    const childBitcoin = root.derivePath(pathBitcoin);
    const { address: addressBitcoin } = bitcoin.payments.p2pkh({ 
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

export async function obtenerSaldoEthereum(address: string) {
    const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
    const balance = await provider.getBalance(address);
    console.log(`Saldo ETH (testnet): ${ethers.formatEther(balance)} ETH`);
    return balance;
}
