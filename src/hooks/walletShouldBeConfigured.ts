import { useEffect } from "react";
import { setWalletConfigured } from "../services/apiService";
import { useWalletConfig } from "./useWalletConfig";

/**
 * Hook encargado de comprobar si la wallet (configuración inicial) deba estar configurada o no.
 * @param arg Determina si la wallet debería o no estar configurada
 * @category Hooks
 */
export async function walletShouldBeConfigured(arg: boolean) {
    const isConfigured = useWalletConfig();

    useEffect(() => {
        async function setConfig() {
            await setWalletConfigured(!arg);
        }

        // En caso de estar o no configurado mediante el argumento recibido, ejecutar la función
        if (isConfigured === !arg) {
            setConfig();
        }

        return () => {};
    }, [isConfigured, arg]);
}