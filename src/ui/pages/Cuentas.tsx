import { useEffect, useState } from "react";
import type { WalletInfo } from "../../types/WalletInfo";
import { useWallets } from "../../context/WalletContext";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Cuentas() {
    const [cuentaSeleccionada, setCuentaSeleccionada] = useState<WalletInfo | null>(null);
    const { wallets, setWallets } = useWallets();

    const navigate = useNavigate();
    
    useEffect(() => {

    }, [wallets]);

    return (
        <div className="flex flex-col items-center h-full">
            <h1 className="text-2xl font-bold mb-5">Cuentas</h1>

            <div>
                <h2 className="mb-3">Carteras cargadas:</h2>
                {wallets.length === 0 ? (
                    <p>Todavía no hay cuentas creadas. Añada una para empezar.</p>
                ) : (
                    <ul>
                    {wallets.map(wallet => (
                        <li key={wallet.nombre}>{wallet.nombre} - {wallet.tipoDireccion}</li>
                    ))}
                    </ul>
                )}
            </div>
            <button 
            type="button" 
            className="flex items-center gap-3 border-2 mt-5 border-gray-500 border-dotted 
            rounded-xl px-6 py-4 hover:bg-neutral-700 transition-colors cursor-pointer
            w-5/6 text-center justify-center"
            onClick={() => navigate('agregar')}
            >
                <Plus className="w-6 h-6" />
                <span className="text-lg font-semibold">Agregar una nueva cuenta</span>
            </button>
        </div>
    )
}

export default Cuentas;