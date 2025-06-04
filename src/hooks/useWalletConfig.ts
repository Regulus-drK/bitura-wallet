import { useEffect, useState } from "react";
import { isWalletConfigured, onWalletConfigChange } from "../services/apiService";

/**
 * Hook para comprobar si la wallet está configurada
 * @returns Booleano de si está configurada la aplicación o no
 * @category Hooks
 */
export function useWalletConfig() {
    const [isConfigured, setIsConfigured] = useState<boolean | undefined>(undefined);;

    useEffect(() => {
        const loadConfigInicial = async () => {
            const configurado = await isWalletConfigured();
            setIsConfigured(configurado);
        };
        loadConfigInicial();

        // Suscripción a cambios
        const cleanup = onWalletConfigChange((newValue) => {
            setIsConfigured(newValue);
        });

        return cleanup; // Limpieza al desmontar
    }, []);

    return isConfigured;
}