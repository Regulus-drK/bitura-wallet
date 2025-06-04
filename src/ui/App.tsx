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
const AppConfigResetPrompt = React.lazy(() => import('./components/AppConfigResetPrompt'));
const InicioDashboard = React.lazy(() => import('./components/InicioDashboard'));
const CuentasAgregar = React.lazy(() => import('./components/CuentasAgregar'));
const CuentaDatos = React.lazy(() => import('./components/CuentaDatos'));
const CuentaAjustes = React.lazy(() => import('./components/CuentaAjustes'));
const EnviarCrypto = React.lazy(() => import('./components/EnviarCrypto'));
const RecibirCrypto = React.lazy(() => import('./components/RecibirCrypto'));

// Componente principal de la aplicación
function App() {
  const isConfigured = useWalletConfig(); // Comprueba si la app esta configurada o no, redirigiendo en función

  return (
    <Router>
      <Suspense fallback={<Spinner/>}>
        <AuthProvider>
          <WalletProvider>
            <Routes>
              {/* Transforma "/" en función de si la app está configurada o no */}
              <Route path="/" element={isConfigured ? <Login /> : <WalletSetup />} />
              <Route path='/inicio' element={<Inicio/>}>
                <Route index element={<InicioDashboard/>} />
                <Route path='cuentas' element={<Cuentas/>} />
                <Route path='cuentas/agregar' element={<CuentasAgregar />} />
                <Route path='cuentas/datos-cuenta' element={<CuentaDatos />} />
                <Route path='cuentas/datos-cuenta/ajustes' element={<CuentaAjustes />} />
                <Route path='enviar' element={<EnviarCrypto />} />
                <Route path='recibir' element={<RecibirCrypto />} />
                <Route path='config' element={<Ajustes/>} />
              </Route>
              <Route path='/config-reset-prompt' element={<AppConfigResetPrompt/>}/>
            </Routes>
          </WalletProvider>
        </AuthProvider>
      </Suspense>
    </Router>
  );

}

export default App;
