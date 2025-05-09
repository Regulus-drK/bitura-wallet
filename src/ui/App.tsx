import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'; 
import WalletSetup from './pages/WalletSetup';
import Inicio from './pages/Inicio';
import './styles/App.css'
import { useWalletConfig } from '../hooks/useWalletConfig';

function App() {
  const isConfigured = useWalletConfig();

  return (
    <Router>
      <Routes>
        <Route path="/" element={isConfigured ? <Inicio /> : <WalletSetup />} />
      </Routes>
    </Router>
  );

}

export default App;
