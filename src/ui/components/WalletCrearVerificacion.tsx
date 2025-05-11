import { LogOut } from "lucide-react";

interface WalletCrearVerificacionProps {
    onBack: () => void;
}

function WalletCrearVerificacion({ onBack }: WalletCrearVerificacionProps) {
    
    return (
        <>
            <div>
                <h1>Verificación de frase semilla</h1>
                <p>Confirme que su frase semilla es correcta haciendo click en las palabras en el orden correcto:</p>
            </div>

            {/* Botón Volver a WalletCrear */}
            <button
                onClick={onBack}
                className="mt-auto flex items-center gap-2 bg-neutral-800 hover:bg-neutral-900 
                text-white font-semibold py-2 px-4 rounded-xl shadow-md border border-gray-500 
                transition duration-300 cursor-pointer"
            >
                <LogOut className="w-5 h-5" />
                Cancelar
            </button>
        </>
    );
}

export default WalletCrearVerificacion;