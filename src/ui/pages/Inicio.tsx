import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from "react-router-dom";
import { enableMenu } from '../../services/apiService';
import { walletShouldBeConfigured } from '../../hooks/walletShouldBeConfigured';
import { useWindowSize } from '../../hooks/useWindowSize';
import SidebarMenu from '../components/SidebarMenu';
import Spinner from '../components/Spinner';
import { AnimatePresence } from 'framer-motion';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

function Inicio() {
  walletShouldBeConfigured(true);

  const location = useLocation();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    enableMenu();
  });

  useWindowSize({
      width: 1200,
      height: 850,
      minWidth: 1050,
      minHeight: 650,
      resizable: true
  });

  return (
    <div className="flex min-h-screen bg-neutral-800 text-white relative">
      <SidebarMenu />
      {/* Aviso de conexión */}
      {!isOnline && (
        <div className="ml-30 select-none fixed p-6 text-center top-6 left-1/2 -translate-x-1/2 
        px-5 py-3 rounded-xl bg-red-500 shadow-lg flex items-center gap-3 z-50">
          <WifiOff className="w-5 h-5 text-white" />
          <span className="font-semibold">
            Sin conexión. Funcionalidades limitadas
          </span>
        </div>
      )}
      <main className="ml-60 flex-1 p-6 text-center relative overflow-hidden">
        <Suspense fallback={<Spinner />}>
          <AnimatePresence mode="wait">
            <Outlet key={location.pathname}/>
          </AnimatePresence>
        </Suspense>
      </main>
    </div>
  );
}

export default Inicio;