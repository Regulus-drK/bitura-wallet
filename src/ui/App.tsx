import { Route, HashRouter as Router, Routes } from 'react-router-dom'; 
import WalletSetup from './pages/WalletSetup';
import './styles/App.css'
import { useWalletConfig } from '../hooks/useWalletConfig';
import Login from './pages/Login';
import Inicio from './pages/Inicio';

function App() {
  const isConfigured = useWalletConfig();

  return (
    <Router>
      <Routes>
        <Route path="/" element={isConfigured ? <Login /> : <WalletSetup />} />
        <Route path='/inicio' element={<Inicio/>}/>
      </Routes>
    </Router>
  );

}

export default App;
