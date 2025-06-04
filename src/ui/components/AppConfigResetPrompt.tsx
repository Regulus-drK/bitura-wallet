import { useState } from 'react';
import { closeActualWindow, deleteConfigFiles, validatePassword } from '../../services/apiService';
import { Eye, EyeOff, Trash } from 'lucide-react';

// Ventana emergente para reestablecer toda la configuración a por defecto (pide contraseña)
// Antes llamado PasswordPrompt, cambiado nombre para más sentido
export default function AppConfigResetPrompt() {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isValidPassword, setIsValidPassword] = useState<boolean | undefined>(undefined);

    const handleConfirm = async () => {
        // Comprobamos que la contraseña sea la correcta
        if (await validatePassword(password)) {
            setIsValidPassword(true);

            setTimeout(() => {
                deleteConfigFiles(password);
            }, 1350);
        } else {
            setIsValidPassword(false);
        }
    };

    return (
        <div className="flex flex-col items-center mt-5">
            <h1 className="text-2xl font-bold text-white text-center">Restaurar frase semilla</h1>
            {/* Contraseña */}
            <h2 className="text-lg mt-3 text-white text-center">
                Introduzca su contraseña
            </h2>
            <div className="relative mt-3 w-full max-w-xs">
                <input
                    type={showPassword ? "text" : "password"}
                    value={password || ""}
                    disabled={isValidPassword}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setIsValidPassword(undefined);
                    }}
                    className={`w-full gap-2 bg-neutral-800 hover:bg-neutral-900 
                    text-white font-semibold py-1 px-6 rounded-xl shadow-md 
                    transition duration-300
                        ${(isValidPassword)
                            ? "border-green-500 border-2"
                            : "border-gray-500 border"
                        }`}
                />
                <button 
                    className="absolute inset-y-0 right-2 flex items-center 
                    justify-center text-gray-300 hover:text-white cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeOff/> : <Eye/>}
                </button>
            </div>
            <div className="mt-5 flex flex-col gap-3.5">
                {/* Botón Entrar */}
                <button
                    onClick={handleConfirm}
                    disabled={isValidPassword || !password}
                    className={`px-4 py-2 rounded-xl shadow-md border flex items-center gap-2 transition duration-300
                        ${(isValidPassword || !password) 
                            ? "bg-neutral-600 text-gray-300 cursor-not-allowed border-gray-400" 
                            : "border-gray-500 bg-neutral-800 cursor-pointer text-white hover:bg-neutral-900"}`
                    }
                >
                    <Trash className="w-5 h-5"/>
                    Reiniciar Configuración
                </button>
                <button
                    onClick={closeActualWindow}
                    disabled={isValidPassword}
                    className="py-2 w-30 mt-0 self-center rounded-xl shadow-md border items-center transition duration-300
                            border-gray-500 bg-neutral-800 cursor-pointer text-white hover:bg-neutral-900"
                >
                    Cancelar
                </button>
            </div>
            {/* Info. estado contraseñas introducidas */}
            {isValidPassword === false && (
            <h2 className="text-center mt-4 text-lg font-semibold text-red-500">
                Contraseña incorrecta
            </h2>
            )}

            {isValidPassword === true && (
            <div
                className={`absolute bottom-8 px-5 py-3 rounded-xl 
                shadow-lg flex items-center gap-3 text-white bg-emerald-600 transition-all duration-500`}
            >
                <span className="font-semibold">¡Éxito! Restaurando valores por defecto...</span>
            </div>
            )}
        </div>
    );
}
