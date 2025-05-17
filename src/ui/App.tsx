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
const Config = React.lazy(() => import('./pages/Config'));
const PasswordPrompt = React.lazy(() => import('./components/PasswordPrompt'));
const InicioDashboard = React.lazy(() => import('./components/InicioDashboard'));
const CuentasAgregar = React.lazy(() => import('./components/CuentasAgregar'));

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
                <Route path='config' element={<Config/>} />
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
