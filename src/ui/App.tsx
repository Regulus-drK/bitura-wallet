import { Route, HashRouter as Router, Routes } from 'react-router-dom'; 
import './styles/App.css'
import { useWalletConfig } from '../hooks/useWalletConfig';
import React, { Suspense } from 'react';
import Spinner from './components/Spinner';
import { AuthProvider } from '../context/AuthContext';

const WalletSetup = React.lazy(() => import('./pages/WalletSetup'));
const Login = React.lazy(() => import('./pages/Login'));
const Inicio = React.lazy(() => import('./pages/Inicio'));
const PasswordPrompt = React.lazy(() => import('./components/PasswordPrompt'));

function App() {
  const isConfigured = useWalletConfig();

  return (
    <Router>
      <Suspense fallback={<Spinner/>}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={isConfigured ? <Login /> : <WalletSetup />} />
            <Route path='/inicio' element={<Inicio/>}/>
            <Route path='/password-prompt' element={<PasswordPrompt/>}/>
          </Routes>
        </AuthProvider>
      </Suspense>
    </Router>
  );

}

export default App;
