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
    const [mostrarAvanzado, setMostrarAvanzado] = useState<boolean>(false);
    const [indexPrivada, setIndexPrivada] = useState<number>(0);
    const [indexTaken, setIndexTaken] = useState<boolean>(false);
    const [selectedTipo, setSelectedTipo] = useState<'legacy' | 'segwit' | 'native'>('native');
    const [redBtcSeleccionada, setRedBtcSeleccionada] = useState<'mainnet' | 'testnet'>('mainnet');

    // Efectos React

    // Efecto para detectar la red seleccionada por el usuario.
    // Se ejecuta al montar el componente.
    useEffect(() => {
        const detectarRedBtcSeleccionada = async () => {
            setRedBtcSeleccionada(await getRedSeleccionada());
        }
        detectarRedBtcSeleccionada();
    }, []);

    // Efecto encargado de fijar automáticamente el siguiente índice de la cuenta (clave privada)
    // en función del último más grande añadido.
    useEffect(() => {
        if (selectedCoin === null) return;

        if (wallets.length !== 0) {
            if (selectedCoin === 'BTC') {
                let walletsFiltradas = wallets.filter(
                    w => w.tipoMoneda === 'BTC' && w.tipoDireccion === selectedTipo &&
                    w.red === redBtcSeleccionada);

                // Si existen cuentas de este tipo, sacamos el índice más alto y le sumamos 1
                // para asignar el siguiente a la nueva cuenta
                if (walletsFiltradas.length !== 0) {
                    let walletIndiceMasAlto = walletsFiltradas.reduce((max, actual) => {
                        return actual.indicePrivada > max.indicePrivada ? actual : max;
                    });
                    // Sacamos el último indice de privada
                    setIndexPrivada(walletIndiceMasAlto.indicePrivada + 1);
                } else { // Sino, lo ponemos a 0 (nueva cuenta sin tener anteriores)
                    setIndexPrivada(0);
                }
            } else { // Caso ETH
                let walletsFiltradas = wallets.filter(
                    w => w.tipoMoneda === 'ETH');

                // Si existen cuentas de este tipo, sacamos el índice más alto y le sumamos 1
                // para asignar el siguiente a la nueva cuenta
                if (walletsFiltradas.length !== 0) {
                    let walletIndiceMasAlto = walletsFiltradas.reduce((max, actual) => {
                        return actual.indicePrivada > max.indicePrivada ? actual : max;
                    });
                    // Sacamos el último indice de privada
                    setIndexPrivada(walletIndiceMasAlto.indicePrivada + 1);
                } else { // Sino, lo ponemos a 0 (nueva cuenta sin tener anteriores)
                    setIndexPrivada(0);
                }
            }
        }
    }, [selectedCoin, selectedTipo]) // Dependencias que activan el efecto al cambiar

    const navigate = useNavigate();

    // Función para volver a Cuentas
    const salirAgregar = () => {
        navigate("/inicio/cuentas");
    }

    // Avanzar un paso
    const siguientePaso = async () => {
        if (await validarPaso()) {
            setPasoActual((prev) => prev + 1);
        }
    };

    // Disminuir un paso
    const anteriorPaso = () => {
        if (pasoActual > 1) {
            setPasoActual(pasoActual - 1);
        }
    }

    // Validar que se puede pasar al siguiente paso
    const validarPaso = async (): Promise<boolean> => {
        switch (pasoActual) {
            case 1:
                let controlNombre = handleWalletsName();
                if (selectedCoin === 'BTC') {
                    return controlNombre;
                }

                if (controlNombre) { // Caso de ETH, puesto que su inicialización es distinta
                    return await handleCreateEthWallet();
                }
                return false; // Si ninguna condición ocurre, devolvemos false
            case 2: // Solo debería ocurrir si la moneda seleccionada es BTC
                return await handleCreateBtcWallet();
            default:
                return true;
        }
    };

    // Función para comprobar el nombre de la wallet asignada y verificar
    // que cumple los estándares pedidos
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

            // Control para verificar si existe en la misma red e ignorar si están en redes distintas
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

    // Función para crear la wallet de BTC
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

        // Control para verificar si el índice de la cuenta ya está en uso
        if (wallets.length !== 0) {
            let walletsFiltradas = wallets.filter(
                w => w.tipoMoneda === 'BTC' && w.tipoDireccion === selectedTipo &&
                w.red === redBtcSeleccionada);

            if (walletsFiltradas.length !== 0) {
                if (walletsFiltradas.some(w => w.indicePrivada === indexPrivada)) {
                    setIndexTaken(true);
                    return false;
                }
            }
        }

        try {
            let resultado = await crearYGuardarWalletBtc(nombreWallet, mnemonic, 
                indexPrivada, selectedTipo, redBtcSeleccionada);
            if (resultado) { // Actualizamos las wallets en memoria si es correcto
                const allWallets = await getAllWallets();
                setWallets(allWallets);
            }
            return true;
        } catch (err) {
            console.error('Error al crear la cuenta: ', err);
            return false;
        }
    }

    // Función para crear una wallet de Ethereum
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

        // Control para verificar si el índice de la cuenta ya está en uso
        if (wallets.length !== 0) {
            let walletsFiltradas = wallets.filter(
                w => w.tipoMoneda === 'ETH');

            if (walletsFiltradas.length !== 0) {
                if (walletsFiltradas.some(w => w.indicePrivada === indexPrivada)) {
                    setIndexTaken(true);
                    return false;
                }
            }
        }

        try {
            let resultado = await crearYGuardarWalletEth(nombreWallet, mnemonic, indexPrivada);
            if (resultado) { // Actualizamos las wallets en memoria si es correcto
                const allWallets = await getAllWallets();
                setWallets(allWallets);
            }
            return true;
        } catch (err) {
            console.error('Error al crear la cuenta: ', err);
            return false;
        }
    }

    // Función que devuelve el JSX de el desplegable "Avanzado",
    // pensado para el número de la cuenta asignable
    const desplegableAvanzado = () => {
        return (
            <div className="text-center relative mt-4 min-h-[12.5rem]">
                <button
                    onClick={() => setMostrarAvanzado(prev => !prev)}
                    className="text-gray-300 hover:text-white cursor-pointer text-sm flex items-center justify-center mx-auto"
                >
                    <span className="mr-1">Avanzado</span>
                    <svg
                        className={`w-4 h-4 transition-transform duration-200 ${mostrarAvanzado ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                    >
                        <path d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {mostrarAvanzado && (
                    <div className="mt-2">
                        <span className="text-white text-sm min-w-[80px] text-left mr-3">
                            Número de Cuenta
                        </span>
                        <input
                            type="number"
                            step="any"
                            placeholder="Avanzado"
                            value={indexPrivada}
                            onChange={(e) => {
                                const valor = e.target.value;

                                // Permitir solo enteros positivos de hasta 3 cifras
                                if (/^\d{0,3}$/.test(valor)) {
                                    setIndexPrivada(Number(valor));
                                }
                                setIndexTaken(false);
                            }}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            className={`w-full max-w-[65px] font-semibold py-1 px-3 mb-1 rounded-xl shadow-md
                                transition duration-300 border mx-auto cursor-text text-white bg-neutral-800 border-gray-500 hover:bg-neutral-900`}
                        />

                        <p className="text-sm text-gray-400 mt-1">
                            Crear cuenta a partir del número de la clave privada asociada.
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            No lo modifique si desea crear la cuenta a continuación de las que tiene.
                        </p>
                    </div>
                )}
                {indexTaken && (
                    <h2 className="text-center mt-4 text-lg font-semibold text-red-500 select-none">
                        El número elegido de la cuenta ya está en uso
                    </h2>
                )}
            </div>
        )
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
                                onClick={() => {
                                    setSelectedCoin(id as 'BTC' | 'ETH')
                                    setMostrarAvanzado(false);
                                    setIndexTaken(false);
                                }}
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
                            {selectedCoin === 'ETH' && (
                                desplegableAvanzado()
                            )}
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

                        {desplegableAvanzado()}
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