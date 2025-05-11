import { LogOut } from "lucide-react";

interface WalletImportarProps {
    onBack: () => void;
}

function WalletImportar({ onBack }: WalletImportarProps) {

    return (
    <div className="min-h-[94vh] flex flex-col p-4 gap-4">
        
        {/* Botón Volver a WalletSetup */}
        <button
            onClick={onBack}
            className="mt-auto flex items-center gap-2 bg-neutral-800 hover:bg-neutral-900 
            text-white font-semibold py-2 px-4 rounded-xl shadow-md border border-gray-500 
            transition duration-300 cursor-pointer"
        >
            <LogOut className="w-5 h-5" />
            Volver
        </button>
    </div>
    );
}

export default WalletImportar;