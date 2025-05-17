import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { enableMenu} from '../../services/apiService';
import { walletShouldBeConfigured } from '../../hooks/walletShouldBeConfigured';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useAuth } from '../../context/AuthContext';
import SidebarMenu from '../components/SidebarMenu';

function Inicio() {
  const { password } = useAuth(); // Password global guardada en context

  // Nuevos estados para datos de direcciones
  const navigate = useNavigate();
  
  walletShouldBeConfigured(true);

  const logOut = () => {
    navigate("/");
  };

  useEffect(() => {
    if (!password) return;

    enableMenu();
  });

  useWindowSize({
      width: 1200,
      height: 850,
      minWidth: 750,
      minHeight: 550,
      resizable: true
  });
  
  return (
    <div className="flex min-h-screen bg-neutral-800 text-white">
      <SidebarMenu />

      <main className="ml-60 flex-1 p-6 text-center">

        <h1 className="text-3xl font-bold mt-6 mb-1 text-neutral-100">
          ¡Bienvenido a la aplicación de criptomonedas!
        </h1>
        <p className="text-neutral-300 mb-6">Ha iniciado sesión correctamente.</p>
      </main>
    </div>
  );
}

export default Inicio;