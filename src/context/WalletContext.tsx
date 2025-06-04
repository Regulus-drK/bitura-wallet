import { createContext, useContext, useEffect, useState } from 'react';
import { getAllWallets } from '../services/apiService';
import type { WalletInfo } from '../types/BituraStore';

// Constante de contexto para almacenar wallets y setWallets (memoria)
const WalletContext = createContext<{
  wallets: WalletInfo[];
  setWallets: (wallets: WalletInfo[]) => void;
}>({
  wallets: [],
  setWallets: () => {}
});

/**
 * Función para recuperar las wallets (o establecerlas) a través del contexto creado.
 * Permite acceder a las wallets desde cualquier componente, cargandolas desde
 * el JSON y fijándolas en la variable como una lista
 * @returns Devuelve el contexto de la constante
 */
export const useWallets = () => useContext(WalletContext);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);

  useEffect(() => {
    const cargar = async () => {
      const w = await getAllWallets();
      setWallets(w); // Fijamos a la variable wallets del contexto todas las wallets del JSON
    };
    cargar();
  }, []);

  return (
    <WalletContext.Provider value={{ wallets, setWallets }}>
      {children}
    </WalletContext.Provider>
  );
};
