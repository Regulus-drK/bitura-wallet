import { useEffect, useState } from "react";

/**
 * Hook para verificar si el usuario tiene conexión a internet
 * @returns Devuelve un booleano para decir si está o no conectado a internet
 * @category Hooks
 */
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Función para verificar la conectividad real
    const checkOnlineStatus = async () => {
      try {
        // Usamos un endpoint confiable que debería estar siempre disponible
        const response = await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });
        if (response) setIsOnline(true);
      } catch (error) {
        setIsOnline(false);
      }
    };

    // Verificación inicial
    checkOnlineStatus();

    // Configuramos intervalos regulares para verificar la conexión
    const intervalId = setInterval(checkOnlineStatus, 10000);

    // Manejadores de eventos para cambios rápidos
    const handleOnline = () => {
      setIsOnline(true);
      console.log("Conectado a Internet");
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log("Sin conexión a Internet");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

export default useOnlineStatus;