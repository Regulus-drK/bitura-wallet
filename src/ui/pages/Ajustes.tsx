import { useEffect, useState } from "react";
import { getRedSeleccionada, savePassword, setRedSeleccionada, validatePassword } from "../../services/apiService";
import Spinner from "../components/Spinner";
import { CheckCircle, Eye, EyeOff, RotateCcwKey, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function Ajustes() {
    const [ajusteTestnetActivo, setAjusteTestnetActivo] = useState<boolean | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
    const [isPasswordChanging, setIsPasswordChanging] = useState<boolean>(false);
    const [oldPassword, setOldPassword] = useState<string>("");
    const [showOldPassword, setShowOldPassword] = useState<boolean>(false);
    const [newPassword, setNewPassword] = useState<string>("");
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const { setPassword } = useAuth();
    const [notSecurePassword, setNotSecurePassword] = useState<boolean>(false);
    const [isNotCurrentPassword, setIsNotCurrentPassword] = useState<boolean>(false);
    const [isSamePassword, setIsSamePassword] = useState<boolean>(false);
    const [animacionEntrada, setAnimacionEntrada] = useState(false);
    const [mostrarToast, setMostrarToast] = useState(false);
    const [salidaToast, setSalidaToast] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);

    useEffect(() => {
        const redAlmacenada = async () => {
            let redSeleccionada = await getRedSeleccionada();

            if (redSeleccionada === 'mainnet') {
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
            setRedSeleccionada(nuevoValor);
            return nuevoValor;
        });
    }

    const handleCambiarPassword = async () => {
        if (await validatePassword(oldPassword)) {
            const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword); // al menos un carácter no alfanumérico
            if (newPassword.length < 7 || !hasSpecialChar) {
                setNotSecurePassword(true);
                return;
            }
            if (newPassword === oldPassword) {
                setIsSamePassword(true);
                return;
            }
            try {
                setIsPasswordChanging(true);

                let passwordCambiada = await savePassword(newPassword)
                if (passwordCambiada) {
                    setPassword(newPassword);
                } else {
                    console.error('Error al cambiar la contraseña');
                    return;
                }

                // Pequeño retraso
                await new Promise(resolve => setTimeout(resolve, 500));
                setPasswordChanged(true);
                handleChangePasswordToast();
            } catch (error) {
                console.error('Error al cambiar la contraseña: ', error)
            } finally {
                setIsPasswordChanging(false);
                handleCerrarModalPassword();
            }

        } else {
            setIsNotCurrentPassword(true);
            return;
        }
    }

    const handleCerrarModalPassword = () => {
        setOldPassword("");
        setNewPassword("");
        setIsSamePassword(false);
        setIsNotCurrentPassword(false);
        setNotSecurePassword(false);
        setShowOldPassword(false);
        setShowNewPassword(false);
        setShowPasswordModal(false);
    }

    // Constante para manejar el "toast" o pop-up al cambiar Contraseña
    const handleChangePasswordToast = () => {
        setAnimacionEntrada(false);
        setMostrarToast(true);
        setSalidaToast(false);

        setTimeout(() => {
            setAnimacionEntrada(true); // entrada
        }, 10);

        setTimeout(() => {
            setSalidaToast(true); // salida
        }, 2000);

        setTimeout(() => {
            setMostrarToast(false); // eliminar del DOM
            setPasswordChanged(false);
        }, 3000);
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
                        Cambiar a red Testnet
                    </span>
                    <span className="text-sm text-gray-400">
                        Cambia la red seleccionada de la principal a la de Testnet para realizar pruebas.
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

            <div className="w-full max-w-5xl bg-neutral-700 rounded-xl p-4 flex items-center justify-between shadow-md mb-4">
                <div className="flex flex-col text-left">
                    <span className="text-lg font-semibold text-white">
                        Cambiar la contraseña
                    </span>
                    <span className="text-sm text-gray-400">
                        Reestablece tu contraseña actual por otra nueva.
                    </span>
                </div>

                <button 
                    className="group flex items-center gap-1 text-sm px-4 py-2 select-none rounded-lg border 
                    border-gray-500 cursor-pointer text-white bg-neutral-800 hover:bg-neutral-700 transition
                    disabled:bg-neutral-500 disabled:cursor-not-allowed"
                    onClick={() => setShowPasswordModal(true)}
                >
                    <RotateCcwKey
                        className="w-5 h-5 transition-colors duration-300 text-white group-hover:text-yellow-400"
                    />
                    Cambiar
                </button>
            </div>
            {/* Modal de confirmación de borrado */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Fondo oscuro */}
                    <div 
                        className="absolute inset-0 bg-black/50"
                        onClick={() => !isPasswordChanging && handleCerrarModalPassword()}
                    />
                    
                    {/* Contenedor del modal */}
                    <div className="relative bg-neutral-800 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 z-10 border border-neutral-600">
                        {/* Botón de cerrar */}
                        <button
                            onClick={() => !isPasswordChanging && handleCerrarModalPassword()}
                            className="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-white transition"
                            disabled={isPasswordChanging}
                        >
                            <X size={24} />
                        </button>
                        
                        {/* Título */}
                        <h2 className="text-xl font-bold mb-4 text-white">Cambiar contraseña</h2>
                        
                        {/* Contenido */}
                        <div className="mb-5 text-gray-300 flex flex-col items-center gap-2">
                            <p>Introduzca la contraseña actual:</p>
                            <div className="relative mt-2 mb-5 w-full max-w-[300px]">
                                <input
                                type={showOldPassword ? "text" : "password"}
                                value={oldPassword || ""}
                                onChange={(e) => {
                                    setOldPassword(e.target.value);
                                    setIsNotCurrentPassword(false);
                                    setNotSecurePassword(false);
                                    setIsSamePassword(false);
                                }}
                                className="w-full gap-2 bg-neutral-800 hover:bg-neutral-900 
                                text-white font-semibold py-1 px-6 rounded-xl shadow-md 
                                transition duration-300 border-gray-500 border"
                                />
                                <button 
                                type="button"
                                className="absolute inset-y-0 right-2 flex items-center 
                                justify-center text-gray-300 hover:text-white cursor-pointer"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                                >
                                {showOldPassword ? <EyeOff/> : <Eye/>}
                                </button>
                            </div>

                            <p>Introduzca la nueva contraseña:</p>
                            <div className="relative mt-2 w-full max-w-[300px]">
                                <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword || ""}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    setIsNotCurrentPassword(false);
                                    setNotSecurePassword(false);
                                    setIsSamePassword(false);
                                }}
                                className="w-full gap-2 bg-neutral-800 hover:bg-neutral-900 
                                text-white font-semibold py-1 px-6 rounded-xl shadow-md 
                                transition duration-300 border-gray-500 border"
                                />
                                <button 
                                type="button"
                                className="absolute inset-y-0 right-2 flex items-center 
                                justify-center text-gray-300 hover:text-white cursor-pointer"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                {showNewPassword ? <EyeOff/> : <Eye/>}
                                </button>
                            </div>
                            {/* Mensaje de error o aviso */}
                            <div className="min-h-[1.5rem] text-sm text-center mt-2 w-full text-red-400">
                                {isNotCurrentPassword && <span>La contraseña actual no es correcta</span>}
                                {notSecurePassword && <span>La nueva contraseña debe tener al menos 7 caracteres y uno especial</span>}
                                {isSamePassword && <span>La nueva contraseña no puede ser igual a la antigua</span>}
                            </div>
                        </div>
                        
                        {/* Botones de acción */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => handleCerrarModalPassword()}
                                disabled={isPasswordChanging}
                                className="px-4 py-2 rounded-md cursor-pointer border border-neutral-600 hover:bg-neutral-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCambiarPassword}
                                disabled={isPasswordChanging || oldPassword.length === 0 || newPassword.length === 0}
                                className="px-4 py-2 rounded-md cursor-pointer bg-yellow-700 text-white hover:bg-yellow-600 
                                transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-yellow-700 flex items-center gap-2"
                            >
                                {isPasswordChanging ? (
                                    <>
                                        <Spinner small size={16} />
                                        Cambiando contraseña...
                                    </>
                                ) : (
                                    "Cambiar"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST */}
            {mostrarToast && (
                <>
                    {passwordChanged && (
                        <div
                            className={`absolute left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-xl 
                            shadow-lg flex items-center gap-3 text-white bg-emerald-600 transition-all duration-500 ease-in-out
                            ${salidaToast ? "top-0 opacity-0" : animacionEntrada ? "top-6 opacity-100" : "top-0 opacity-0"}`}
                        >
                            <CheckCircle className="w-5 h-5 text-white" />
                            <span className="font-semibold">¡Contraseña cambiada con éxito!</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Ajustes;
