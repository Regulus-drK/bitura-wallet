import { useState } from 'react';

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
        <div className="p-4">
            <button onClick={handleGenerate} className="bg-blue-500 text-white px-4 py-2 rounded">
                Generar Mnemonic
            </button>
            {mnemonic && (
                <div className="mt-4 p-2 border rounded border-s-gray-700">
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
