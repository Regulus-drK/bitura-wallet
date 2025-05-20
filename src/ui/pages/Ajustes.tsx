import { useEffect, useState } from "react";
import { getRedBtcSeleccionada, setRedBtcSeleccionada } from "../../services/apiService";
import Spinner from "../components/Spinner";

function Ajustes() {
    const [ajusteTestnetActivo, setAjusteTestnetActivo] = useState<boolean | null>(null);

    useEffect(() => {
        const redAlmacenada = async () => {
            let redBtcSeleccionada = await getRedBtcSeleccionada();

            if (redBtcSeleccionada === 'mainnet') {
                setAjusteTestnetActivo(false);
            } else {
                setAjusteTestnetActivo(true);
            }
        }
        redAlmacenada();
    }, [])

    const handleToggle = () => {
        setAjusteTestnetActivo(prev => {
            if (prev === null) return false; // Por si se pulsa antes de cargar
            const nuevoValor = !prev;
            setRedBtcSeleccionada(nuevoValor);
            return nuevoValor;
        });
    }

    if (ajusteTestnetActivo === null) {
        return (
            <div className="flex flex-col items-center h-full p-4 overflow-y-auto text-white w-full">
                <h1 className="text-2xl font-bold mb-5">Ajustes</h1>
                <Spinner/>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center h-full p-4 overflow-y-auto text-white w-full">
            <h1 className="text-2xl font-bold mb-5">Ajustes</h1>

            <div className="w-full max-w-5xl bg-neutral-700 rounded-xl p-4 flex items-center justify-between shadow-md mb-4">
                <div className="flex flex-col text-left">
                    <span className="text-lg font-semibold text-white">
                        Cambiar a red BTC Testnet
                    </span>
                    <span className="text-sm text-gray-400">
                        Cambia la red de Bitcoin de Mainnet a la de Testnet para realizar pruebas.
                    </span>
                </div>

                <div
                    onClick={handleToggle}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                        ajusteTestnetActivo ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                >
                    <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                            ajusteTestnetActivo ? 'translate-x-6' : ''
                        }`}
                    ></div>
                </div>
            </div>
        </div>
    );
}

export default Ajustes;
