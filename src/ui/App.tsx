import { Route, HashRouter as Router, Routes } from 'react-router-dom'; 
import './styles/App.css'
import { useWalletConfig } from '../hooks/useWalletConfig';
import React, { Suspense } from 'react';
import Spinner from './components/Spinner';
import PasswordPrompt from './components/PasswordPrompt';

const WalletSetup = React.lazy(() => import('./pages/WalletSetup'));
const Login = React.lazy(() => import('./pages/Login'));
const Inicio = React.lazy(() => import('./pages/Inicio'));

function App() {
  const isConfigured = useWalletConfig();

  return (
    <Router>
      <Suspense fallback={<Spinner/>}>
        <Routes>
          <Route path="/" element={isConfigured ? <Login /> : <WalletSetup />} />
          <Route path='/inicio' element={<Inicio/>}/>
          <Route path='/password-prompt' element={<PasswordPrompt/>}/>
        </Routes>
      </Suspense>
    </Router>
  );

}

export default App;
