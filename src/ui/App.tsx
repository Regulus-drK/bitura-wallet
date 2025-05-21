import { Route, HashRouter as Router, Routes } from 'react-router-dom'; 
import './styles/App.css'
import { useWalletConfig } from '../hooks/useWalletConfig';
import React, { Suspense } from 'react';
import Spinner from './components/Spinner';
import { AuthProvider } from '../context/AuthContext';
import { WalletProvider } from '../context/WalletContext';

const WalletSetup = React.lazy(() => import('./pages/WalletSetup'));
const Login = React.lazy(() => import('./pages/Login'));
const Inicio = React.lazy(() => import('./pages/Inicio'));
const Cuentas = React.lazy(() => import('./pages/Cuentas'));
const Ajustes = React.lazy(() => import('./pages/Ajustes'));
const PasswordPrompt = React.lazy(() => import('./components/PasswordPrompt'));
const InicioDashboard = React.lazy(() => import('./components/InicioDashboard'));
const CuentasAgregar = React.lazy(() => import('./components/CuentasAgregar'));
const CuentaDatos = React.lazy(() => import('./components/CuentaDatos'));
const EnviarCrypto = React.lazy(() => import('./components/EnviarCrypto'));
const RecibirCrypto = React.lazy(() => import('./components/RecibirCrypto'));



function App() {
  const isConfigured = useWalletConfig();

  return (
    <Router>
      <Suspense fallback={<Spinner/>}>
        <AuthProvider>
          <WalletProvider>
            <Routes>
              <Route path="/" element={isConfigured ? <Login /> : <WalletSetup />} />
              <Route path='/inicio' element={<Inicio/>}>
                <Route index element={<InicioDashboard/>} />
                <Route path='cuentas' element={<Cuentas/>} />
                <Route path='cuentas/agregar' element={<CuentasAgregar />} />
                <Route path='cuentas/datos-cuenta' element={<CuentaDatos />} />
                <Route path='enviar' element={<EnviarCrypto />} />
                <Route path='recibir' element={<RecibirCrypto />} />
                <Route path='config' element={<Ajustes/>} />
              </Route>
              <Route path='/password-prompt' element={<PasswordPrompt/>}/>
            </Routes>
          </WalletProvider>
        </AuthProvider>
      </Suspense>
    </Router>
  );

}

export default App;
