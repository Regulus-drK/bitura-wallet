import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import './App.css'

function App() {
    const [mnemonic, setMnemonic] = useState<string[] | null>(null);

    const handleGenerate = async () => {
        try {
            const args = '12';
            const result = await (window as any).api.generateMnemonic(args);
            setMnemonic(result);
        } catch (err) {
            console.error("Error generando mnemonic:", err);
        }
    };

    return (
    <div className="relative min-h-screen flex items-center justify-center">
        <button
            onClick={handleGenerate}
            className="absolute flex items-center gap-2 bg-neutral-800 hover:bg-neutral-900 cursor-pointer text-white 
            font-semibold py-2 px-4 rounded-xl shadow-md border-2 border-gray-500 transition duration-300 ease-in-out">
            <KeyRound className="w-5 h-5" />
            Generar Mnemonic
        </button>

        {mnemonic && (
            <div className="mt-50 p-2 border rounded border-s-gray-700 text-center">
            <strong>Mnemonic:</strong><br />
            {mnemonic.map((word, index) => (
                <span key={index}>{word} </span>
            ))}
            </div>
        )}
    </div>
    );
}

export default App;
