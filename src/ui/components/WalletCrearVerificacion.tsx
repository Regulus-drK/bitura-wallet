import { useEffect, useState } from "react";
import { LogOut, CheckCircle, ArrowRight, RotateCcw } from "lucide-react";
import { walletShouldBeConfigured } from "../../hooks/walletShouldBeConfigured";

interface WalletCrearVerificacionProps {
  onBack: () => void;
  onNext: () => void;
  mnemonic: string[] | null;
}

function WalletCrearVerificacion({ onBack, onNext, mnemonic }: WalletCrearVerificacionProps) {
  const [palabrasMezcladas, setPalabrasMezcladas] = useState<string[]>([]);
  const [palabrasSeleccionadas, setPalabrasSeleccionadas] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  walletShouldBeConfigured(false);

  useEffect(() => {
    if (mnemonic) {
      const shuffled = [...mnemonic].sort(() => Math.random() - 0.5);
      setPalabrasMezcladas(shuffled);
      setPalabrasSeleccionadas([]);
      setIsCorrect(null);
    }
  }, [mnemonic]);

  const handleSelectWord = (word: string) => {
    setPalabrasSeleccionadas([...palabrasSeleccionadas, word]);
    setPalabrasMezcladas(palabrasMezcladas.filter(w => w !== word));
  };

  const handleDeselectWord = (word: string, index: number) => {
    // Sacar la palabra de selectedWords y volverla a añadir a shuffledWords
    const newSelected = [...palabrasSeleccionadas];
    newSelected.splice(index, 1); // quita la palabra en la posición `index`
    setPalabrasSeleccionadas(newSelected);
    setPalabrasMezcladas([...palabrasMezcladas, word]);
    setIsCorrect(null); // resetear verificación si el usuario cambia algo
  };

  const handleVerify = () => {
    if (!mnemonic) return;
    const isMatch = mnemonic.join(' ') === palabrasSeleccionadas.join(' ');
    setIsCorrect(isMatch);
  };

  const handleReset = () => {
    if (!mnemonic) return;
    setPalabrasMezcladas([...mnemonic].sort(() => Math.random() - 0.5));
    setPalabrasSeleccionadas([]);
    setIsCorrect(null);
  };

  return (
    <div className="min-h-[94vh] flex flex-col p-4 gap-6 select-none">
      <h1 className="text-2xl font-bold text-white text-center">Verificación de frase semilla</h1>
      <p className="text-white text-center mb-3">
        Haga clic en las palabras en el orden correcto para verificar su frase semilla.
      </p>

      {/* Cuadro de palabras seleccionadas */}
      <div className="border border-gray-500 bg-neutral-800 p-3 rounded-lg min-h-[80px] shadow-md text-white text-center">
        <strong className="block mb-2">Frase seleccionada:</strong>
        <div className="flex flex-wrap justify-center gap-2">
          {palabrasSeleccionadas.map((word, idx) => (
            <button 
                key={idx} 
                onClick={() => handleDeselectWord(word, idx)}
                className="bg-neutral-900 px-2 py-1 rounded hover:bg-neutral-800 transition cursor-pointer"
            >
                {word}
            </button>
          ))}
        </div>
      </div>

      {/* Palabras desordenadas para hacer clic */}
      <div className="flex flex-wrap justify-center gap-2">
        {palabrasMezcladas.map((word, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectWord(word)}
            className="px-3 py-1 bg-neutral-900 text-white rounded cursor-pointer hover:bg-neutral-800"
          >
            {word}
          </button>
        ))}
      </div>

      {/* Acciones de verificación */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleVerify}
          disabled={palabrasSeleccionadas.length !== mnemonic?.length}
          className={`px-4 py-2 rounded-xl shadow-md border font-semibold transition duration-300
            ${palabrasSeleccionadas.length === mnemonic?.length
              ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
              : "bg-neutral-600 text-gray-300 cursor-not-allowed border-gray-400"}`}
        >
          Verificar
        </button>
        <button
          onClick={handleReset}
          className="flex px-4 py-2 gap-2 rounded-xl shadow-md border border-gray-500 bg-neutral-800
        text-white hover:bg-neutral-900 cursor-pointer"
        >
          <RotateCcw className="relative top-[2px] w-5 h-5" />
          Reiniciar
        </button>
      </div>

      {/* Resultado */}
      {isCorrect !== null && (
        <div
          className={`text-center mt-2 text-lg font-semibold 
            ${isCorrect ? "text-green-500" : "text-red-500"}`}
        >
          {isCorrect ? (
            <>
              <CheckCircle className="inline mr-1" /> ¡Frase verificada correctamente!
            </>
          ) : (
            "La frase no coincide. Inténtelo de nuevo."
          )}
        </div>
      )}

      {/* Botón Continuar */}
      {isCorrect === true && (
        <div className="flex flex-col items-center text-center">
            <button
                onClick={onNext}
                className="px-4 py-2 rounded-xl shadow-md border border-gray-500 bg-neutral-800 
                text-white hover:bg-neutral-900 cursor-pointer flex items-center gap-2"
            >
                <ArrowRight className="w-5 h-5"/>
                Continuar
            </button>
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

export default WalletCrearVerificacion;
