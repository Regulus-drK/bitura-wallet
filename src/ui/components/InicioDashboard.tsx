import { useEffect, useState } from "react";
import { getRedSeleccionada } from "../../services/apiService";

function InicioDashboard() {    
    const [redBtcSeleccionada, setRedBtcSeleccionada] = useState<'mainnet' | 'testnet'>('mainnet');

    useEffect(() => {
        const detectarRedBtcSeleccionada = async () => {
            setRedBtcSeleccionada(await getRedSeleccionada());
        }
        detectarRedBtcSeleccionada();
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold mt-6 mb-1 text-neutral-100">
            ¡Bienvenido a la aplicación de criptomonedas! {redBtcSeleccionada}
            </h1>
            <p className="text-neutral-300 mb-6">Ha iniciado sesión correctamente.</p>
        </div>
    )
}

export default InicioDashboard;