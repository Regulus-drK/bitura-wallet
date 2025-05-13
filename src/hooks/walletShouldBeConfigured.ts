import { useEffect } from "react";
import { setWalletConfigured } from "../services/apiService";
import { useWalletConfig } from "./useWalletConfig";


export async function walletShouldBeConfigured(arg: boolean) {
    const isConfigured = useWalletConfig();

    useEffect(() => {
        async function setConfig() {
            await setWalletConfigured(!arg);
        }

        if (isConfigured === !arg) {
            setConfig();
        }

        return () => {};
    }, [isConfigured, arg]);
}