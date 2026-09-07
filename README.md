# Bitura Wallet

Cross-platform cryptocurrency wallet built with React, Electron and Java, featuring Bitcoin & Ethereum support, BIP39/BIP32 key derivation, secure local storage and API integration.

<img width="1312" height="962" alt="bituraScreenshot" src="https://github.com/user-attachments/assets/a975884b-ec84-4980-83d9-02b185f7ff97" />

## Overview

Bitura Wallet is a cross-platform desktop cryptocurrency wallet developed as a final degree project (TFG) and personal project.

The application allows users to create and manage different cryptocurrency wallets, generate and derive cryptographic keys, check wallet information and monitor cryptocurrency prices through integrated APIs.

The project combines a React frontend, Electron for the desktop environment, and a lightweight Java service packaged as a `.jar`.

## Key Features

- 🔐 Cryptocurrency wallet creation and management
- 🧠 BIP39 mnemonic generation
- 🔑 BIP32 hierarchical deterministic key derivation
- ₿ Bitcoin support
- Ξ Ethereum support
- 🌐 Mainnet and Testnet support
- 💰 Cryptocurrency price information
- 📊 Wallet balance and portfolio information
- 🔎 Blockchain address information lookup
- 📱 QR code generation
- 💾 Local wallet and portfolio persistence
- 🔒 Secure local storage
- 🖥️ Cross-platform desktop application
- 🔌 React, Electron and Java interoperability

## Architecture

Bitura combines React, Electron and Java to create a self-contained desktop application.

React is responsible for the user interface, Electron manages the desktop environment and IPC communication, while the Java service handles specific operations such as mnemonic generation and external API requests.

The Java component runs locally as a standalone `.jar`, providing a simple API-style communication layer between the Electron application and the Java service.

## Java Service Explanation

Bitura includes a lightweight Java service packaged as a `.jar`.

Electron launches the Java process when required, using it for:

- Mnemonic generation
- Cryptocurrency price queries
- Wallet and address information through external APIs

This demonstrates interoperability between Java and JavaScript within a desktop application while keeping the service completely local.

## Wallet & Blockchain

### Bitcoin

Bitcoin functionality includes:

- BIP39 mnemonic handling
- BIP32 hierarchical deterministic key derivation
- Private and public key generation
- Address derivation
- Legacy, SegWit and Native SegWit addresses
- Mainnet and Testnet support
- Balance and transaction information

Main libraries:

- `bitcoinjs-lib`
- `bip39`
- `bip32`
- `ecpair`
- `tiny-secp256k1`

### Ethereum

Ethereum functionality is implemented using `ethers.js`, allowing the application to generate and manage Ethereum wallet information, through the Mainnet and Testnet.

## Security & Local Storage

Bitura stores wallet information locally on the user's machine.

Electron's `safeStorage` API is used to protect sensitive information such as wallet passwords and mnemonic data, while `electron-store` is used for local application storage.

> **Warning:** Bitura Wallet is an educational project and has not been audited for production use. It is NOT recommended to store real cryptocurrency or real wallet credentials.

## Portfolio

The application also includes portfolio management functionality for tracking cryptocurrency holdings and their current value.

Cryptocurrency prices can be retrieved through the Java service and used to calculate the current value of the user's portfolio, by checking transactions, UTXOs, and balances.

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Framer Motion
- Lucide React

### Desktop

- Electron
- Electron IPC
- Electron Store
- Electron Safe Storage

### Blockchain

- BitcoinJS
- BIP39
- BIP32
- ECPair
- tiny-secp256k1
- ethers.js

### Java Service

- Java
- Executable `.jar`
- Local process communication
- External API integration

Getting Started
Requirements
Node.js
npm

The Java runtime required by the application is included with the project.

### Install dependencies
```bash
npm install
```
### Run in development
```bash
npm run dev
```
### Build
#### Windows
```bash
npm run dist:win
```
#### Linux
```bash
npm run dist:linux
```
#### macOS
```bash
npm run dist:mac
```

## 🛠 Download Bitura Wallet

[![Download for Windows](https://img.shields.io/badge/Download-v1.1.0_x64-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMTIyLjQ2IDEyMi44OCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTIyLjQ2IDEyMi44OCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHN0eWxlIHR5cGU9InRleHQvY3NzIj48IVtDREFUQVsNCgkuc3Qwe2ZpbGw6IzAwNzhENjt9DQpdXT48L3N0eWxlPjxnPjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0wLDE3LjUzdjQxLjUyaDUwLjA3di00OC40TDAsMTcuNTNMMCwxNy41M3ogTTU2LjExLDkuNjhMMTIyLjQ2LDB2NTguNjNINTYuMTFWOS42OEw1Ni4xMSw5LjY4eiBNMCw2NC4xNiB2NDEuNTJsNTAuMDcsNy4wMVY2NC4xNkgwTDAsNjQuMTZ6IE01Ni4xMSw2NC44MWg2Ni4zNXY1OC4wN2wtNjYuMzUtOS40VjY0LjgxTDU2LjExLDY0LjgxeiIvPjwvZz48L3N2Zz4=)](https://github.com/Regulus-drK/bitura-wallet/releases/latest/download/Bitura.Wallet.Setup.1.1.0-win-x64.exe)
[![Download for macOS](https://img.shields.io/badge/Download-v1.1.0_ARM64-lightgrey?style=for-the-badge&logo=apple)](https://github.com/Regulus-drK/bitura-wallet/releases/latest/download/Bitura.Wallet.1.1.0-macos-arm64.dmg)

## Disclaimer

Bitura Wallet was developed as a practical project combining cryptocurrency technologies with desktop application development.

The main goals were to explore:

- Cryptocurrency wallet development
- Blockchain and cryptographic concepts
- Hierarchical deterministic wallets
- Secure local storage
- Electron desktop applications
- Inter-process communication
- Java and Electron interoperability
- External API integration
- Cross-platform software distribution

**Reminder**: this is an educational and experimental project developed for academic purposes, and, even while fully tested, its security and integrity is not fully guaranteed.

It is recommended to not be used to store real cryptocurrency or production wallet credentials. Only through Testnet wallets.

## Author

Jorge Puentes
