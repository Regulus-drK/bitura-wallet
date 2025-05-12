import { ArrowRight, KeyRound, LogOut } from "lucide-react";
import { useState } from "react";
import { generateMnemonic } from "../../services/apiService";

interface WalletCrearProps {
    onBack: () => void;
    onNext: () => void;
    mnemonic: string[] | null;
    setMnemonic: (mnemonic: string[]) => void;
}

function WalletCrear({ onBack, onNext, mnemonic, setMnemonic }: WalletCrearProps) {
    const [numPalabras, setNumPalabras] = useState('12');
    const [isSafelyStored, setIsSafelyStored] = useState(false);

    // Manejador del generador de Mnemonic
    const handleGenerate = async () => {
        const result = await generateMnemonic(numPalabras as '12' | '24');
        setMnemonic(result);
        setIsSafelyStored(false);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNumPalabras(event.target.value);
    };

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsSafelyStored(e.target.checked);
    };
    
    return (
    <div className="min-h-[94vh] flex flex-col p-4 gap-4">
        {/* Sección de opciones (12/24 palabras) */}
        <div className="text-center">
            <p className="text-lg font-semibold text-white mb-2">Seleccione el número de palabras que tendrá su frase semilla:</p>
            <div className="flex gap-4 justify-center">
                <label className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700
                 text-white rounded-lg cursor-pointer shadow-md border border-gray-500 ">
                    <input 
                    type="radio" 
                    name="numPalabras" 
                    value="12" 
                    checked={numPalabras === '12'} 
                    onChange={handleChange} 
                    className="accent-green-500 scale-125 cursor-pointer"
                    />
                    <span className="text-base">12 palabras</span>
                </label>
                <label className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700
                 text-white rounded-lg cursor-pointer shadow-md border border-gray-500 ">
                    <input 
                    type="radio" 
                    name="numPalabras" 
                    value="24" 
                    checked={numPalabras === '24'} 
                    onChange={handleChange} 
                    className="accent-green-500 scale-125 cursor-pointer"
                    />
                    <span className="text-base">24 palabras</span>
                </label>
            </div>
        </div>

        {/* Botón "Generar Mnemonic" */}
        <button
            onClick={handleGenerate}
            className="flex self-center gap-2 bg-neutral-800 hover:bg-neutral-900 
            text-white font-semibold py-2 px-4 rounded-xl shadow-md border border-gray-500 
            transition duration-300 cursor-pointer"
        >
            <KeyRound className="w-5 h-5" />
            {mnemonic ? 'Volver a generar Mnemonic' : 'Generar Mnemonic'}
        </button>

        {/* Mostrar Mnemonic (si existe) */}
        {mnemonic && (
            <>
                <div className="bg-neutral-600 border-l-4 border-gray-500 
                text-white-900 p-4 rounded shadow-md max-w-3xl mx-auto">
                    <strong className="block text-lg mb-2">Importante:</strong>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Por favor, escriba esta frase semilla en un papel, <strong>NUNCA</strong> en un dispositivo o almacenamiento online.</li>
                        <li><strong>JAMÁS</strong> comparta su frase semilla con alguien.</li>
                        <li>Si pierde el acceso a esta frase semilla, perderá <strong>todos</strong> sus activos (¡Guárdelo adecuadamente!).</li>
                    </ul>
                </div>
                <div className="p-2 self-center-safe border rounded border-gray-500 text-center shadow-md max-w-[620px] select-none">
                    <strong className="block mb-2">Su frase semilla:</strong>
                    <div className="flex flex-wrap justify-center gap-2">
                        {mnemonic.map((word, index) => (
                        <span key={index} className="bg-neutral-900 px-2 py-1 rounded">
                            {word}
                        </span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                    <label className="cursor-pointer">
                        <input 
                            type="checkbox"
                            checked={isSafelyStored}    
                            onChange={handleCheckbox}
                            className="accent-green-500 cursor-pointer mr-1.5 scale-110"
                        />
                        He guardado mi frase semilla en un lugar seguro.
                    </label>
                    <button
                        onClick={onNext} // Temporal
                        disabled={!isSafelyStored}
                        className={`flex items-center gap-2 font-semibold py-2 px-4 rounded-xl shadow-md border 
                        transition duration-300
                        ${isSafelyStored ? 'bg-neutral-800 hover:bg-neutral-900 text-white cursor-pointer border-gray-500' 
                                      : 'bg-neutral-600 text-gray-300 cursor-not-allowed border-gray-400'}`}
                    >
                        <ArrowRight className="w-5 h-5" />
                        Continuar
                    </button>
                </div>
            </>
        )}

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

export default WalletCrear;