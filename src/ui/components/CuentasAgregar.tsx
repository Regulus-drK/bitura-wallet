import { useEffect, useMemo, useState } from "react";
import { useWallets } from "../../context/WalletContext";
import { ArrowRight, ChevronLeft } from "lucide-react";
import btcLogo from "../../assets/crypto/bitcoin.png";
import ethLogo from "../../assets/crypto/ether.png";


function CuentasAgregar() {
    const { wallets, setWallets } = useWallets();
    const [pasoActual, setPasoActual] = useState<number>(1);
    const [nombreWallet, setNombreWallet] = useState<string>("");
    const [nameTaken, setNameTaken] = useState<boolean>(false);
    const [selectedCoin, setSelectedCoin] = useState<'BTC' | 'ETH' | null>(null);

    const siguientePaso = () => {
        setPasoActual(pasoActual + 1);
    }

    const anteriorPaso = () => {
        if (pasoActual > 1) {
            setPasoActual(pasoActual - 1);
        }
    }

    const handleWalletsName = () => {
        if (wallets.some(w => w.nombre === nombreWallet)) {
            setNameTaken(true);
            return;
        }
    }

    const puedeContinuar = useMemo(() => {
        if (pasoActual === 1 && !selectedCoin) return false;
        // Aquí puedes añadir más condiciones en el futuro
        return true;
    }, [pasoActual, selectedCoin]);

    return(
        <div className="flex flex-col h-full p-4">

            {pasoActual === 1 && (
                <>
                    <h1 className="text-xl font-semibold mb-6 text-center">Seleccione el activo de la cuenta:</h1>
                    <div className="flex justify-center gap-6 mb-10">
                        {[
                            { id: 'BTC', nombre: 'Bitcoin', logo: btcLogo },
                            { id: 'ETH', nombre: 'Ethereum', logo: ethLogo },
                        ].map(({ id, nombre, logo }) => (
                            <button
                                key={id}
                                onClick={() => setSelectedCoin(id as 'BTC' | 'ETH')}
                                className={`flex items-center gap-4 px-6 py-5 w-64 cursor-pointer rounded-2xl border-2 transition-colors
                                    ${selectedCoin === id
                                        ? 'border-green-500 bg-neutral-900'
                                        : 'border-gray-500 bg-neutral-700 hover:bg-neutral-600'}
                                `}
                            >
                                <img src={logo} alt={nombre} className="w-10 h-10" />
                                <span className="text-white text-lg font-semibold">{nombre}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}


            {pasoActual === 2 && (
                <>
                    <h1 className="text-xl font-semibold mb-4">Seleccione el nombre de la cuenta:</h1>
                    {/* Aquí iría el campo para nombre de wallet */}
                </>
            )}

            <div className="flex justify-between mt-auto"> {/* Este div empuja los botones abajo y separa izquierda/derecha */}
                {pasoActual > 1 && (
                    <button
                        onClick={anteriorPaso}
                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-900 text-white font-semibold py-2 px-4 rounded-xl shadow-md border border-gray-500 transition duration-300 cursor-pointer"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Atrás
                    </button>
                )}

                <button
                    onClick={siguientePaso}
                    className="ml-auto flex items-center gap-2 bg-neutral-800 hover:bg-neutral-900 text-white font-semibold py-2 px-4 rounded-xl shadow-md border border-gray-500 transition duration-300 cursor-pointer"
                >
                    Siguiente
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}

export default CuentasAgregar;