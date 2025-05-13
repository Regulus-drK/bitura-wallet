import { useEffect, useState } from "react";
import { isWalletConfigured, onWalletConfigChange } from "../services/apiService";

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