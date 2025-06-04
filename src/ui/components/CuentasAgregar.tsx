import { useEffect, useState } from "react";
import { useWallets } from "../../context/WalletContext";
import { ArrowRight, CheckCircle, ChevronLeft, LogOut } from "lucide-react";
import btcLogo from "../../assets/crypto/bitcoin.png";
import ethLogo from "../../assets/crypto/ether.png";
import { useNavigate } from "react-router-dom";
import { getAllWallets, getMnemonic, getRedSeleccionada } from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import { crearYGuardarWalletBtc, crearYGuardarWalletEth } from "../../services/walletService";


function CuentasAgregar() {
    const { password } = useAuth();
    const { wallets, setWallets } = useWallets();
    const [pasoActual, setPasoActual] = useState<number>(1);
    const [nombreWallet, setNombreWallet] = useState<string>("");
    const [nameTaken, setNameTaken] = useState<boolean>(false);
    const [nameEmpty, setNameEmpty] = useState<boolean>(false);
    const [nameTooLong, setNameTooLong] = useState<boolean>(false);
    const [selectedCoin, setSelectedCoin] = useState<'BTC' | 'ETH' | null>(null);
    const [selectedTipo, setSelectedTipo] = useState<'legacy' | 'segwit' | 'native'>('native');
    const [redBtcSeleccionada, setRedBtcSeleccionada] = useState<'mainnet' | 'testnet'>('mainnet');

    useEffect(() => {
        const detectarRedBtcSeleccionada = async () => {
            setRedBtcSeleccionada(await getRedSeleccionada());
        }
        detectarRedBtcSeleccionada();
    }, []);

    const navigate = useNavigate();

    const salirAgregar = () => {
        navigate("/inicio/cuentas");
    }

    const siguientePaso = async () => {
        if (await validarPaso()) {
            setPasoActual((prev) => prev + 1);
        }
    };

    const anteriorPaso = () => {
        if (pasoActual > 1) {
            setPasoActual(pasoActual - 1);
        }
    }

    const validarPaso = async (): Promise<boolean> => {
        switch (pasoActual) {
            case 1:
                let controlNombre = handleWalletsName();
                if (selectedCoin === 'BTC') {
                    return controlNombre;
                }

                if (controlNombre) {
                    return await handleCreateEthWallet();
                }
                return false; // Si ninguna condición ocurre, devolvemos false
            case 2: // Solo debería ocurrir si la moneda seleccionada es BTC
                return await handleCreateBtcWallet();
            default:
                return true;
        }
    };

    const handleWalletsName = (): boolean => {
        let valid = true;
        if (nombreWallet.length === 0) {
            setNameEmpty(true);
            valid = false;
        }
        if (nombreWallet.length > 20) {
            setNameTooLong(true);
            valid = false;
        }
        const nombreMinusculas = nombreWallet.trim().toLowerCase();

        const nombreDuplicado = wallets.some(w => {
            const nombreW = w.nombre.trim().toLowerCase();

            if (w.tipoMoneda === 'BTC') {
                // Si la wallet es BTC, comparamos solo si están en la misma red
                return nombreW === nombreMinusculas && w.red === redBtcSeleccionada;
            } else if (w.tipoMoneda === 'ETH') {
                // ETH no tiene red, pero el nombre no puede coincidir con ningún BTC ni ETH
                return nombreW === nombreMinusculas;
            }
            return false;
        });

        if (nombreDuplicado) {
            setNameTaken(true);
            valid = false;
        }
        return valid;
    };

    const handleCreateBtcWallet = async (): Promise<boolean> => {
        if (!password) { 
            console.error('No se pudo obtener la contraseña del usuario.')
            return false;
        }
        const mnemonic = await getMnemonic(password);
        if (!mnemonic) {
            console.error('No se pudo obtener el mnemonic.')
            return false;
        }

        let ultimoIndex = 0;

        if (wallets.length !== 0) {
            let walletsFiltradas = wallets.filter(
                w => w.tipoMoneda === 'BTC' && w.tipoDireccion === selectedTipo &&
                w.red === redBtcSeleccionada);

            if (walletsFiltradas.length !== 0) {
                let walletIndiceMasAlto = walletsFiltradas.reduce((max, actual) => {
                    return actual.indicePrivada > max.indicePrivada ? actual : max;
                });

                ultimoIndex = walletIndiceMasAlto.indicePrivada + 1;
            }
        }

        try {
            let resultado = await crearYGuardarWalletBtc(nombreWallet, mnemonic, 
                ultimoIndex, selectedTipo, redBtcSeleccionada);
            if (resultado) {
                const allWallets = await getAllWallets();
                setWallets(allWallets);
            }
            return true;
        } catch (err) {
            console.error('Error al crear la cuenta: ', err);
            return false;
        }
    }

    const handleCreateEthWallet = async(): Promise<boolean> => {
        if (!password) { 
            console.error('No se pudo obtener la contraseña del usuario.')
            return false;
        }
        const mnemonic = await getMnemonic(password);
        if (!mnemonic) {
            console.error('No se pudo obtener el mnemonic.')
            return false;
        }

        let ultimoIndex = 0;

        if (wallets.length !== 0) {
            let walletsFiltradas = wallets.filter(
                w => w.tipoMoneda === 'ETH');

            if (walletsFiltradas.length !== 0) {
                let walletIndiceMasAlto = walletsFiltradas.reduce((max, actual) => {
                    return actual.indicePrivada > max.indicePrivada ? actual : max;
                });

                ultimoIndex = walletIndiceMasAlto.indicePrivada + 1;
            }
        }

        try {
            let resultado = await crearYGuardarWalletEth(nombreWallet, mnemonic, ultimoIndex);
            if (resultado) {
                const allWallets = await getAllWallets();
                setWallets(allWallets);
            }
            return true;
        } catch (err) {
            console.error('Error al crear la cuenta: ', err);
            return false;
        }
    }

    return(
        <div className="flex flex-col h-full p-4">

            {pasoActual === 1 && (
                <>
                    <h1 className="text-xl font-semibold mb-6 text-center">Seleccione el activo de la cuenta:</h1>
                    <div className="flex justify-center gap-6 mb-10 select-none">
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
                                <img src={logo} alt={nombre} draggable="false" className="w-10 h-10" />
                                <span className="text-white text-lg font-semibold">{nombre}</span>
                            </button>
                        ))}
                    </div>
                    {selectedCoin !== null && (
                        <div className="fade-in flex flex-col items-center">
                            <h1 className="text-xl font-semibold mt-4 mb-2 text-center">
                                Seleccione el nombre de la cuenta:
                            </h1>
                            <div className="w-full max-w-xs">
                                <input
                                    type="text"
                                    value={nombreWallet || ""}
                                    spellCheck="false"
                                    onChange={(e) => {
                                        setNombreWallet(e.target.value);
                                        setNameTaken(false);
                                        setNameEmpty(false);
                                        setNameTooLong(false);
                                    }}
                                    className={`w-full bg-neutral-800 hover:bg-neutral-900 
                                    text-white font-semibold py-2 px-4 rounded-xl shadow-md 
                                    transition duration-300 
                                    ${(nameEmpty || nameTaken)
                                        ? "border-2 border-red-500"
                                        : "border border-gray-500"
                                    }`}
                                />
                                {nameEmpty && (
                                    <h2 className="text-center mt-4 text-lg font-semibold text-red-500 select-none">
                                        Introduzca un nombre
                                    </h2>
                                )}
                                {nameTaken && (
                                    <h2 className="text-center mt-4 text-lg font-semibold text-red-500 select-none">
                                        El nombre introducido ya está en uso
                                    </h2>
                                )}
                                {nameTooLong && (
                                    <h2 className="text-center mt-4 text-lg font-semibold text-red-500 select-none">
                                        El nombre no puede superar los 20 caracteres
                                    </h2>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {(pasoActual === 2 && selectedCoin === 'BTC') && (
                <div className="mt-4 text-center">
                    <div className="flex flex-col items-center">
                        <h2 className="text-xl font-semibold mb-4">Seleccione el tipo de cuenta:</h2>

                        <select
                            value={selectedTipo || "native"}
                            onChange={(e) => setSelectedTipo(e.target.value as 'legacy' | 'segwit' | 'native')}
                            className="bg-neutral-800 text-white cursor-pointer font-semibold py-3 px-5 rounded-xl border-2 border-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all w-80 text-center text-lg"
                        >
                            <option value="native">
                                Native SegWit
                            </option>
                            <option value="segwit">SegWit</option>
                            <option value="legacy">Legacy</option>
                        </select>

                        {selectedTipo && (
                            <div className="mt-6 max-w-lg text-sm text-gray-300 text-center">
                                {selectedTipo === 'native' && (
                                    <>
                                        <div className="flex justify-center items-center gap-2 mb-1">
                                            <p className="font-semibold text-green-400">Native SegWit (bech32)</p>
                                            <span className="text-green-500 text-xs border border-green-500 px-2 py-0.5 rounded-full font-medium">
                                                recomendado
                                            </span>
                                        </div>
                                        <p>
                                            Formato moderno de direcciones que empieza por <code>bc1</code>. Tiene menores comisiones y es ampliamente compatible.
                                        </p>
                                    </>
                                )}
                                {selectedTipo === 'segwit' && (
                                    <>
                                        <p className="font-semibold text-yellow-400 mb-1">SegWit (compat):</p>
                                        <p>
                                            Direcciones que empiezan por <code>3</code>. Buena compatibilidad con servicios antiguos, aunque no tan eficiente como Native SegWit.
                                        </p>
                                    </>
                                )}
                                {selectedTipo === 'legacy' && (
                                    <>
                                        <p className="font-semibold text-red-400 mb-1">Legacy:</p>
                                        <p>
                                            Direcciones clásicas que empiezan por <code>1</code>. Altas comisiones y menor eficiencia. Solo recomendable para compatibilidad extrema.
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {(pasoActual === 3 || pasoActual === 2 && selectedCoin === 'ETH') && (
            <>
                <div
                className="text-center mt-2 text-lg font-semibold text-green-500"
                >
                    <CheckCircle className="inline mr-1" /> 
                    ¡Cuenta creada correctamente!
                </div>
                <h1 className="text-center mt-2 text-lg font-semibold text-white">
                    Puede consultarla accediendo al menú Cuentas.
                </h1>
            </>
            )}

            <div className="flex justify-between mt-auto select-none"> {/* Este div empuja los botones abajo y separa izquierda/derecha */}
                {pasoActual === 1 && (
                    <button
                        onClick={salirAgregar}
                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-900 text-white font-semibold py-2 px-4 rounded-xl shadow-md border border-gray-500 transition duration-300 cursor-pointer"
                    >
                        <LogOut className="w-5 h-5" />
                        Salir
                    </button>
                )}
                {(pasoActual > 1 && pasoActual < 3 && selectedCoin === 'BTC') && (
                    <button
                        onClick={anteriorPaso}
                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-900 text-white font-semibold py-2 px-4 rounded-xl shadow-md border border-gray-500 transition duration-300 cursor-pointer"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Atrás
                    </button>
                )}

                <button
                    onClick={((pasoActual === 3 && selectedCoin === 'BTC') || 
                        (pasoActual === 2 && selectedCoin === 'ETH')) ? salirAgregar : siguientePaso}
                    disabled={selectedCoin === null}
                    className="ml-auto flex items-center gap-2 bg-neutral-800 hover:bg-neutral-900 
                    text-white font-semibold py-2 px-4 rounded-xl shadow-md border border-gray-500 
                    transition duration-300 cursor-pointer disabled:cursor-not-allowed 
                    disabled:bg-neutral-600 disabled:hover:bg-neutral-600 disabled:text-gray-300"
                >
                    {((pasoActual === 3 && selectedCoin === 'BTC') || 
                        (pasoActual === 2 && selectedCoin === 'ETH')) ? 'Continuar' : 'Siguiente'}
                    {((pasoActual === 3 && selectedCoin === 'BTC') || 
                        (pasoActual === 2 && selectedCoin === 'ETH')) ? <CheckCircle className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                </button>
            </div>
        </div>
    )
}

export default CuentasAgregar;