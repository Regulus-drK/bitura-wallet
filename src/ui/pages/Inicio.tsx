import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from "react-router-dom";
import { enableMenu } from '../../services/apiService';
import { walletShouldBeConfigured } from '../../hooks/walletShouldBeConfigured';
import { useWindowSize } from '../../hooks/useWindowSize';
import SidebarMenu from '../components/SidebarMenu';
import Spinner from '../components/Spinner';
import { AnimatePresence } from 'framer-motion';

function Inicio() {
  walletShouldBeConfigured(true);

  const location = useLocation();

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
    <div className="flex min-h-screen bg-neutral-800 text-white">
      <SidebarMenu />

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