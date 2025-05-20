import { useEffect } from 'react';
import { Outlet } from "react-router-dom";
import { enableMenu } from '../../services/apiService';
import { walletShouldBeConfigured } from '../../hooks/walletShouldBeConfigured';
import { useWindowSize } from '../../hooks/useWindowSize';
// import { useAuth } from '../../context/AuthContext';
import SidebarMenu from '../components/SidebarMenu';
// import { crearYGuardarWalletBtc } from '../../services/walletService';
// import { useWallets } from '../../context/WalletContext';

function Inicio() {
  // const { password } = useAuth(); // Password global guardada en context
  // const { wallets } = useWallets();

  // const [bitcoinAddress, setBitcoinAddress] = useState<string | null>(null);

  walletShouldBeConfigured(true);

  useEffect(() => {
    enableMenu();
  });

  useWindowSize({
      width: 1200,
      height: 850,
      minWidth: 850,
      minHeight: 650,
      resizable: true
  });
  
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