import logoBitura from '../../assets/LogotipoBituraPng.png'
import { LogOut } from "lucide-react";
import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { enableMenu, getMnemonic } from '../../services/apiService';
import { createWallets } from '../../services/walletService';
import { walletShouldBeConfigured } from '../../hooks/walletShouldBeConfigured';
import { useWindowSize } from '../../hooks/useWindowSize';

function Inicio() {
  const [bitcoinAddress, setBitcoinAddress] = useState<string | null>(null);
  const [ethereumAddress, setEthereumAddress] = useState<string | null>(null);
  const navigate = useNavigate();
  
  walletShouldBeConfigured(true);

  const logOut = () => {
    navigate("/");
  };

  useEffect(() => {
    enableMenu();
    const loadWallets = async () => {
      try {
        const mnemonic = await getMnemonic();
        const wallets = createWallets(mnemonic, 1, true);
        if (wallets) {
          setBitcoinAddress(wallets.bitcoin.address);
          setEthereumAddress(wallets.ethereum.address);
        }
      } catch (err) {
        console.error('Error al cargar la wallet:', err);
      }
    };

    loadWallets();
  }, []);

  useWindowSize({
      width: 1200,
      height: 850,
      minWidth: 750,
      minHeight: 550,
      resizable: true
  });
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-2">
      <div className="flex justify-center mt-4 select-none">
        <img 
          src={logoBitura} 
          alt="Logo Bitura" 
          className="w-115 h-40"
        />
      </div>

      <h1>¡Bienvenido a la aplicación de criptomonedas!</h1>
      <p>Ha iniciado sesión correctamente.</p>

      {bitcoinAddress && (
        <p><strong>Bitcoin:</strong> {bitcoinAddress}</p>
      )}
      {ethereumAddress && (
        <p><strong>Ethereum:</strong> {ethereumAddress}</p>
      )}

      <button
        onClick={logOut}
        className="px-4 py-2 mt-4 rounded-xl shadow-md border flex items-center gap-2 transition duration-300 cursor-pointer"
      >
        <LogOut className="w-5 h-5"/>
        Cerrar sesión
      </button>
    </div>
  );
}

export default Inicio;