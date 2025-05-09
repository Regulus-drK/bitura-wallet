import { useState, useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'; 
import { isWalletConfigured } from '../services/walletService';
import WalletSetup from './pages/WalletSetup';
import Inicio from './pages/Inicio';
import './styles/App.css'

function App() {
    const [isConfigured, setIsConfigured] = useState<boolean>(false);

    useEffect(() => {
        // Función async para llamar al servicio
        const checkWallet = async () => {
            const estadoConfigurado = await isWalletConfigured();
            setIsConfigured(estadoConfigurado);
        };
        
        checkWallet();
    }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={isConfigured ? <Inicio /> : <WalletSetup />} />
      </Routes>
    </Router>
  );

}

export default App;
