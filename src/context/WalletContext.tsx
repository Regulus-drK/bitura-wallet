import { createContext, useContext, useEffect, useState } from 'react';
import { getAllWallets } from '../services/apiService';
import type { WalletInfo } from '../types/WalletInfo';


const WalletContext = createContext<{
  wallets: WalletInfo[];
  setWallets: (wallets: WalletInfo[]) => void;
}>({
  wallets: [],
  setWallets: () => {}
});

export const useWallets = () => useContext(WalletContext);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);

  useEffect(() => {
    const cargar = async () => {
      const w = await getAllWallets();
      setWallets(w);
    };
    cargar();
  }, []);

  return (
    <WalletContext.Provider value={{ wallets, setWallets }}>
      {children}
    </WalletContext.Provider>
  );
};
