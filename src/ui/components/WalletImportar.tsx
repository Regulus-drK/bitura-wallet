import { ArrowRight, LogOut, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { validarMnemonic } from "../../services/walletService";
import { walletShouldBeConfigured } from "../../hooks/walletShouldBeConfigured";

interface WalletImportarProps {
    onBack: () => void;
    onNext: () => void;
    setMnemonicImportado: (mnemonic: string[]) => void;
}

function WalletImportar({ onBack, onNext, setMnemonicImportado }: WalletImportarProps) {
    const [numPalabras, setNumPalabras] = useState('12');
    const [inputs, setInputs] = useState<string[]>(Array(12).fill(""))
    const [sinRellenar, setSinRellenar] = useState<boolean>(true);
    const [invalidMnemonic, setInvalidMnemonic] = useState<boolean>(false);

    walletShouldBeConfigured(false);

    const handleNumPalabras = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNumPalabras(event.target.value);
    };

    const handleChange = (index: number, value: string) => {
        const updatedInputs = [...inputs];
        updatedInputs[index] = value;
        setInputs(updatedInputs);

        setSinRellenar(updatedInputs.some(palabra => palabra.trim() === ""));
    };

    const handleReset = () => {
        setInputs(Array(parseInt(numPalabras)).fill(""));
        setInvalidMnemonic(false);
        setSinRellenar(true);
    };

    const handleSubmit = () => {
        console.log(inputs);
        if (inputs.some(palabra => palabra.trim() === "")) {
            setSinRellenar(true);
            return;
        } else {
            setSinRellenar(false);
        }

        const mnemonicString: string = inputs.join(" ");
        if (validarMnemonic(mnemonicString)) {
            setMnemonicImportado(inputs);
            onNext();
        } else {
            console.log(validarMnemonic(mnemonicString))
            setInvalidMnemonic(true);
            return;
        }
    }

    // Cuando cambia el número de palabras, actualiza el número de inputs
    useEffect(() => {
        const n = parseInt(numPalabras);
        setInputs(Array(n).fill(""));
        setSinRellenar(true);
    }, [numPalabras]);

    return (
    <div className="min-h-[94vh] flex flex-col p-4 gap-4">
        {/* Sección de opciones (12/24 palabras) */}
        <div className="text-center">
            <p className="text-lg font-semibold text-white mb-2">Seleccione el número de palabras que contiene su frase semilla:</p>
            <div className="flex gap-4 justify-center">
                <label className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700
                 text-white rounded-lg cursor-pointer shadow-md border border-gray-500 ">
                    <input 
                    type="radio" 
                    name="numPalabras" 
                    value="12" 
                    checked={numPalabras === '12'} 
                    onChange={(e) => {
                        handleNumPalabras(e);
                        setInvalidMnemonic(false);
                    }} 
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
                    onChange={(e) => {
                        handleNumPalabras(e);
                        setInvalidMnemonic(false);
                    }}
                    className="accent-green-500 scale-125 cursor-pointer"
                    />
                    <span className="text-base">24 palabras</span>
                </label>
            </div>
        </div>
        <div className="p-2 self-center border rounded border-b-gray-500 text-center shadow-md max-w-[620px] grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {inputs.map((value, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                    <input
                        value={value}
                        onChange={(e) => {
                            handleChange(index, e.target.value); 
                            setInvalidMnemonic(false);
                        }}
                        className="w-23 text-center px-2 py-1 rounded bg-neutral-900 border border-gray-600 text-white text-sm"
                    />
                    <span className="text-xs font-bold text-white mb-2">{index + 1}</span>
                </div>
            ))}
        </div>

        <div className="flex justify-center gap-4">
            <button
                onClick={handleReset}
                className="flex items-center gap-2 font-semibold py-2 px-5 rounded-xl shadow-md border 
                transition duration-300 bg-neutral-800 hover:bg-neutral-900 text-white border-gray-500 cursor-pointer"
            >
            <RotateCcw className="w-5 h-5" />
            Reiniciar
            </button>

            <button
                onClick={handleSubmit}
                disabled={sinRellenar}
                className={`flex items-center gap-2 font-semibold py-2 px-4 rounded-xl shadow-md border 
                transition duration-300
                ${sinRellenar ? 'bg-neutral-600 text-gray-300 cursor-not-allowed border-gray-400' 
                                : 'bg-neutral-800 hover:bg-neutral-900 text-white cursor-pointer border-gray-500'}`}
                >
                <ArrowRight className="w-5 h-5"/>
                Continuar
            </button>
        </div>

        {/* Info. estado mnemonic introducido */}
        {invalidMnemonic === true && (
            <h2 className="text-center text-lg font-semibold text-red-500">
                La frase semilla introducida no es válida
            </h2>
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

export default WalletImportar;