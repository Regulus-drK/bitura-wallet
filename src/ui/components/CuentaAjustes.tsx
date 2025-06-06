import { useLocation, useNavigate } from "react-router-dom";
import TransiccionPagina from "./TransiccionPagina";
import { ArrowLeft, Trash2, X } from "lucide-react";
import type { WalletInfo } from "../../types/BituraStore";
import { useEffect, useRef, useState } from "react";
import { useWallets } from "../../context/WalletContext";
import { deleteWallet, getAllWallets, getRedSeleccionada, updateWallet } from "../../services/apiService";
import Spinner from "./Spinner";
import { useToast } from "./Toast";

function CuentaAjustes() {
    const { wallets, setWallets } = useWallets();
    const location = useLocation();
    const wallet: WalletInfo = location.state.wallet;
    const navigate = useNavigate();
    const { showToast } = useToast();

    const toastResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [currentNombreWallet, setCurrentNombreWallet] = useState<string>(wallet.nombre);
    const [newNombreWallet, setNewNombreWallet] = useState<string>(wallet.nombre);
    const [nameTaken, setNameTaken] = useState<boolean>(false);
    const [nameEmpty, setNameEmpty] = useState<boolean>(false);
    const [nameTooLong, setNameTooLong] = useState<boolean>(false);
    const [redBtcSeleccionada, setRedBtcSeleccionada] = useState<'mainnet' | 'testnet' | undefined>(undefined);

    const [nombreChangedSuccess, setNombreChangedSuccess] = useState<boolean | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const detectarRedBtcSeleccionada = async () => {
            setRedBtcSeleccionada(await getRedSeleccionada());
        }
        detectarRedBtcSeleccionada();
    }, []);

    // Función para volver a los datos de la cuenta de la wallet en concreto
    const handleNavigate = async (path: string) => {
        navigate(path, { state: { wallet } });
    }

    // Función para gestionar el nombre de la cuenta y comprobar si cumple
    // los requisitos necesarios para ser asignado
    const handleWalletsName = (): boolean => {
        if (!redBtcSeleccionada) return false;

        let valid = true;
        if (newNombreWallet.length === 0) {
            setNameEmpty(true);
            showToast("Introduzca un nombre", "error");
            valid = false;
        }
        if (newNombreWallet.length > 20) {
            setNameTooLong(true);
            showToast("El nombre no puede superar los 20 caracteres", "error");
            valid = false;
        }
        const nombreMinusculas = newNombreWallet.trim().toLowerCase();

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
            showToast("El nombre elegido ya está en uso", "error");
            valid = false;
        }
        return valid;
    };

    // Limpia los flags de error y éxito tras mostrar el toast (tras la animación de salida)
    const resetNameFlags = () => {
        if (toastResetTimeoutRef.current) clearTimeout(toastResetTimeoutRef.current);
        toastResetTimeoutRef.current = setTimeout(() => {
            setNameTaken(false);
            setNameEmpty(false);
            setNameTooLong(false);
            setNombreChangedSuccess(null); // SIEMPRE desbloquea el input y botón
        }, 3000); // igual que el tiempo de ocultar el toast
    };

    // Función para cambiar el nombre a la wallet
    const handleNombreChange = async () => {
        if (!redBtcSeleccionada) return;

        if (handleWalletsName()) {
            wallet.nombre = newNombreWallet;
            const resultado = await updateWallet(currentNombreWallet, wallet, wallet.red);
            if (resultado) {
                setNombreChangedSuccess(true);
                // Actualizamos las wallets en memoria
                const wallets = await getAllWallets();
                setWallets(wallets);
                setCurrentNombreWallet(newNombreWallet);
                showToast("¡Nombre cambiado con éxito!", "success");
            } else {
                setNombreChangedSuccess(false);
                showToast("Error al cambiar el nombre", "error");
            }
            resetNameFlags();
        } else {
            setNombreChangedSuccess(false);
            // Ya se muestra el toast correspondiente en handleWalletsName
            resetNameFlags();
        }
    };

    // Función para borrar la cuenta seleccionada
    const handleBorrarCuenta = async () => {
        setIsDeleting(true);
        try {
            let borrado;
            if (wallet.red !== undefined) {
                borrado = await deleteWallet(wallet.nombre, wallet.red);
            } else { // Caso ETH
                borrado = await deleteWallet(wallet.nombre);
            }
            
            if (borrado) {
                // Actualizamos las wallets en memoria
                const wallets = await getAllWallets();
                setWallets(wallets);
            } else {
                console.error('Error al borrar la cuenta: ')
                return;
            }
            // Pequeño retraso
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Navegar después de borrar
            navigate("/inicio/cuentas");
        } catch (error) {
            console.error("Error al borrar cuenta:", error);
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    // Limpieza del timer al desmontar
    useEffect(() => {
        return () => {
            if (toastResetTimeoutRef.current) clearTimeout(toastResetTimeoutRef.current);
        };
    }, []);

    return(
        <TransiccionPagina>
            <div className="flex flex-col items-center h-full p-4 overflow-y-auto text-white w-full">
                <h1 className="text-2xl font-bold mb-5">Ajustes de cuenta</h1>

                {/* Contenedor de la flecha y título - ahora ocupa todo el ancho */}
                <div className="flex items-center w-full relative">
                    {/* Flecha izquierda - posicionada absolutamente a la izquierda */}
                    <div className="absolute -top-11.75 -left-5">
                        <ArrowLeft
                            onClick={() => handleNavigate("/inicio/cuentas/datos-cuenta")}
                            className="w-7 h-7 text-gray-400 hover:text-green-500 transition duration-200 cursor-pointer ml-4"
                        />
                    </div>
                </div>

                {/* Sección Cambiar nombre de cuenta */}
                <div className="w-full max-w-5xl bg-neutral-700 rounded-xl p-4 flex items-center justify-between shadow-md mb-5">
                    <div className="flex flex-col text-left">
                        <span className="text-lg font-semibold text-white">
                            Cambiar nombre de cuenta
                        </span>
                    </div>

                    <div>
                        <input
                        type="text"
                        value={newNombreWallet}
                        disabled={nombreChangedSuccess === true}
                        spellCheck="false"
                        onChange={(e) => {
                            const valor = e.target.value;
                            setNewNombreWallet(valor);

                            // Validaciones en caliente
                            if (nameEmpty && valor.length > 0) setNameEmpty(false);
                            if (nameTooLong && valor.length <= 20) setNameTooLong(false);
                            if (nameTaken) setNameTaken(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleNombreChange();
                            }
                        }}
                        className={`w-full gap-2 bg-neutral-800 hover:bg-neutral-900 
                        text-white font-semibold py-1 px-6 rounded-xl shadow-md 
                        transition duration-300 focus:outline-none
                            ${(nombreChangedSuccess)
                                ? "border-green-500 border-2"
                                : "border-gray-500 border"
                            }
                            ${(nombreChangedSuccess === false)
                                ? "border-red-500 border-2"
                                : "border-gray-500 border"
                            }`}
                        />
                    </div>
                </div>

                {/* Sección Path de la cuenta */}
                <div className="w-full max-w-5xl bg-neutral-700 rounded-xl p-4 flex items-center justify-between shadow-md mb-5">
                    <div className="flex flex-col text-left">
                        <span className="text-lg font-semibold text-white">
                            Path de la cuenta
                        </span>
                        <span className="text-sm text-gray-400">
                            Información del path base de la cuenta actual. Datos para usuarios avanzados.
                        </span>
                    </div>

                    <span 
                        className="group flex items-center gap-2 text-sm px-4 py-2 rounded-lg text-white bg-neutral-800"
                    >
                        {wallet.pathBase}
                    </span>
                </div>

                {/* Sección Borrar cuenta */}
                <div className="w-full max-w-5xl bg-neutral-700 rounded-xl p-4 flex items-center justify-between shadow-md mb-5">
                    <div className="flex flex-col text-left">
                        <span className="text-lg font-semibold text-white">
                            Borrar cuenta
                        </span>
                        <span className="text-sm text-gray-400">
                            Se eliminarán los datos guardados. Recuerde que sus activos no se pierden aunque la borre.
                        </span>
                    </div>

                    <button 
                        className="group flex items-center gap-2 text-sm px-4 py-2 select-none rounded-lg border 
                        border-gray-500 cursor-pointer text-white bg-neutral-800 hover:bg-neutral-700 transition
                        disabled:bg-neutral-500 disabled:cursor-not-allowed"
                        disabled={nombreChangedSuccess === true}
                        onClick={() => setShowDeleteModal(true)}
                    >
                        <Trash2
                            className={`w-4 h-4 transition-colors duration-300
                                ${nombreChangedSuccess === true ? "text-white" : "text-white group-hover:text-red-400"}
                            `}
                        />
                    </button>
                </div>
                {/* Modal de confirmación de borrado */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Fondo oscuro */}
                        <div 
                            className="absolute inset-0 bg-black/50"
                            onClick={() => !isDeleting && setShowDeleteModal(false)}
                        />
                        
                        {/* Contenedor del modal */}
                        <div className="relative bg-neutral-800 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 z-10 border border-neutral-600">
                            {/* Botón de cerrar */}
                            <button
                                onClick={() => !isDeleting && setShowDeleteModal(false)}
                                className="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-white transition"
                                disabled={isDeleting}
                            >
                                <X size={24} />
                            </button>
                            
                            {/* Título */}
                            <h2 className="text-xl font-bold mb-4 text-white">Confirmar borrado</h2>
                            
                            {/* Contenido */}
                            <div className="mb-6 text-gray-300">
                                <p>¿Está seguro de que quiere borrar la cuenta <span className="font-semibold text-white">{wallet.nombre}</span>?</p>
                                <p className="mt-2 text-sm text-gray-400">Recuerde que los fondos asociados a la cuenta no se perderán. Puede volver a crearla más adelante.</p>

                                <p className="mt-2 text-sm text-red-400">Esta acción no se puede deshacer.</p>
                            </div>
                            
                            {/* Botones de acción */}
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isDeleting}
                                    className="px-4 py-2 rounded-md cursor-pointer border border-neutral-600 hover:bg-neutral-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleBorrarCuenta}
                                    disabled={isDeleting}
                                    className="px-4 py-2 rounded-md cursor-pointer bg-red-600 text-white hover:bg-red-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Spinner small size={16} />
                                            Borrando...
                                        </>
                                    ) : (
                                        "Borrar cuenta"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TransiccionPagina>
    )
}

export default CuentaAjustes;