import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { generateMnemonic, setWalletConfigured } from '../../services/walletService';
 
function WalletSetup() {
    const [mnemonic, setMnemonic] = useState<string[] | null>(null);
    const [numPalabras, setNumPalabras] = useState('12');

    const handleConfigureWallet = async () => {
        // Ejemplo: después de configurar la wallet
        await setWalletConfigured(true);
    };

    const handleGenerate = async () => {
        const result = await generateMnemonic(numPalabras as '12' | '24');
        setMnemonic(result);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNumPalabras(event.target.value);
    };

    return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1>Configuración</h1>
        <button className="flex items-center gap-2 bg-neutral-800 cursor-pointer hover:bg-neutral-900 select-none
            text-white font-semibold py-2 px-4 rounded-xl shadow-md border border-gray-500 transition duration-300"
            onClick={handleConfigureWallet}>
            Configurar test
        </button>
        <div className='mb-4'>
            <p className="font-semibold mb-2 text-center">Número de palabras:</p>
            <div className="flex gap-4 justify-center">
                <label className='flex items-center gap-2 cursor-pointer'>
                    <input type='radio' name='numPalabras' value="12" checked={numPalabras === '12'} onChange={handleChange} className='accent-blue-600 cursor-pointer'/>
                    12 palabras
                </label>
                <label className='flex items-center gap-2 cursor-pointer'>
                    <input type='radio' name='numPalabras' value="24" checked={numPalabras === '24'} onChange={handleChange} className='accent-blue-600 cursor-pointer'/>
                    24 palabras
                </label>
            </div>
        </div>

        <button
            onClick={handleGenerate}
            className="flex items-center gap-2 bg-neutral-800 cursor-pointer hover:bg-neutral-900 select-none
            text-white font-semibold py-2 px-4 rounded-xl shadow-md border border-gray-500 transition duration-300">
            <KeyRound className="w-5 h-5" />
            Generar Mnemonic
        </button>

        {mnemonic && (
            <div className="mt-6 p-4 border rounded border-gray-500 text-center shadow-md max-w-xl select-none">
            <strong className="block mb-2">Mnemonic:</strong>
            <div className="flex flex-wrap justify-center gap-2">
                {mnemonic.map((word, index) => (
                <span key={index} className="bg-neutral-900 px-2 py-1 rounded">
                    {word}
                </span>
                ))}
            </div>
            </div>
        )}
    </div>
    );
}
 
export default WalletSetup;