import { useEffect, useState } from 'react';
import { Outlet } from "react-router-dom";
import { enableMenu, getAllWallets, getMnemonic} from '../../services/apiService';
import { walletShouldBeConfigured } from '../../hooks/walletShouldBeConfigured';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useAuth } from '../../context/AuthContext';
import SidebarMenu from '../components/SidebarMenu';
import { crearYGuardarWalletBtc } from '../../services/walletService';
import { useWallets } from '../../context/WalletContext';

function Inicio() {
  const { password } = useAuth(); // Password global guardada en context
  const { wallets, setWallets } = useWallets();

  const [bitcoinAddress, setBitcoinAddress] = useState<string | null>(null);

  walletShouldBeConfigured(true);

  useEffect(() => {
    enableMenu();
  });

  // useEffect(() => {
  //   if (!password) return;

  //   const loadWallet = async () => {
  //     const mnemonic = await getMnemonic(password);
  //     const wallet = crearWalletBtc(mnemonic, 0, 'native');

  //     if (wallet) {
  //       setBitcoinAddress(wallet.address);
  //     }
  //   };

  //   loadWallet();
  // }, [password]);

  useWindowSize({
      width: 1200,
      height: 850,
      minWidth: 850,
      minHeight: 650,
      resizable: true
  });

  const crearWalletHandler = async () => {
    if (!password) return;

    const mnemonic = await getMnemonic(password);
    const resultado = await crearYGuardarWalletBtc('Prueba', mnemonic, 0, 'native');
    if (resultado) {
      // Refrescar lista de wallets
      const todasWallets = await getAllWallets();
      setWallets(todasWallets);
    }
  }
  
  return (
    <div className="flex min-h-screen bg-neutral-800 text-white">
      <SidebarMenu />

      <main className="ml-60 flex-1 p-6 text-center">
        <Outlet/>
      </main>
    </div>
  );
}

export default Inicio;