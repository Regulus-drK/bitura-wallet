import { LogOut, Eye, EyeOff, Check, CheckCircle } from "lucide-react";
import { useState } from "react";
import { setWalletConfigured } from "../../services/walletService";

interface WalletCrearPasswordProps {
    onBack: () => void;

}

function WalletCrearPassword({ onBack }: WalletCrearPasswordProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [password, setPassword] = useState<string | null>(null);
    const [confirmPassword, setConfirmPassword] = useState<string | null>(null);
    const [checkPasswords, setCheckPasswords] = useState<boolean | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleConfigureWallet = async () => {
        setShowSuccess(true);

        setTimeout(async () => {
            // await setWalletConfigured(true);
            console.log('Ahora se pondría a true la config')
        }, 4000)

        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleCheckPasswords = () => {
        if (!password || !confirmPassword) return;

        if (password === confirmPassword) {
            setCheckPasswords(true);
            handleConfigureWallet();
        } else {
            setCheckPasswords(false);
        }
    }

    const isButtonDisabled = !password || !confirmPassword;

    return (
        <div className="min-h-[94vh] flex flex-col p-4 gap-6 relative">
            <h1 className="text-2xl font-bold text-white text-center">Proteja su frase semilla</h1>
            <p className="text-white text-center mb-3">
                Necesita poner una contraseña para impedir que otros accedan a sus activos a través de la aplicación.
                ¡Use una contraseña que no haya usado nunca en otros lugares!
            </p>

            <div className="flex flex-col items-center">
                {/* Contraseña */}
                <h2 className="text-xl font-bold text-white text-center">
                    Contraseña
                </h2>
                <div className="relative mt-2 w-full max-w-xs">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password || ""}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setCheckPasswords(null);
                        }}
                        className="w-full gap-2 bg-neutral-800 hover:bg-neutral-900 
                        text-white font-semibold py-1 px-6 rounded-xl shadow-md border border-gray-500 
                        transition duration-300"
                    />
                    <button 
                        className="absolute inset-y-0 right-2 flex items-center 
                        justify-center text-gray-300 hover:text-white cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff/> : <Eye/>}
                    </button>
                </div>

                {/* Confirmar contraseña */}
                <h2 className="pt-10 text-xl font-bold text-white text-center">
                    Confirmar contraseña
                </h2>
                <div className="relative mt-2 w-full max-w-xs">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword || ""}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value); 
                            setCheckPasswords(null);
                        }}
                        className="w-full gap-2 bg-neutral-800 hover:bg-neutral-900 
                        text-white font-semibold py-1 px-6 rounded-xl shadow-md border border-gray-500 
                        transition duration-300"
                    />
                    <button 
                        className="absolute inset-y-0 right-2 flex items-center 
                        justify-center text-gray-300 hover:text-white cursor-pointer"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? <EyeOff/> : <Eye/>}
                    </button>
                </div>

                {/* Botón Finalizar configuración */}
                <div className="mt-10 flex flex-col items-center text-center">
                    <button
                        onClick={handleCheckPasswords}
                        disabled={isButtonDisabled}
                        className={`px-4 py-2 rounded-xl shadow-md border flex items-center gap-2 transition duration-300
                            ${isButtonDisabled 
                                ? "bg-neutral-600 text-gray-300 cursor-not-allowed border-gray-400" 
                                : "border-gray-500 bg-neutral-800 cursor-pointer text-white hover:bg-neutral-900"}`
                        }
                    >
                        <Check className="w-5 h-5"/>
                        Finalizar configuración
                    </button>
                </div>

                {/* Info. estado contraseñas introducidas */}
                {checkPasswords === false && (
                    <h2 className="text-center mt-4 text-lg font-semibold text-red-500">
                        Las contraseñas no coinciden.
                    </h2>
                )}
            </div>
                
            {/* Popup de éxito */}
            {showSuccess && (
            <div
                className={`absolute top-6 left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-xl 
                shadow-lg flex items-center gap-3 text-white bg-emerald-600 transition-all duration-500`}
            >
                <CheckCircle className="w-5 h-5 text-white" />
                <span className="font-semibold">¡Cartera creada con éxito! Redirigiendo...</span>
            </div>
            )}


            {/* Botón Volver */}
            <button
                onClick={onBack}
                className="mt-auto flex items-center gap-2 bg-neutral-800 hover:bg-neutral-900 
                text-white font-semibold py-2 px-4 rounded-xl shadow-md border border-gray-500 
                transition duration-300 cursor-pointer"
            >
                <LogOut className="w-5 h-5" />
                Cancelar
            </button>
        </div>
    );
}

export default WalletCrearPassword;