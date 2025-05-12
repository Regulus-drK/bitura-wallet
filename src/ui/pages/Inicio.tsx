import { useEffect, useState } from "react";
import { getMnemonic, getPassword } from "../../services/walletService";

function Inicio() {
  const [passRecuperada, setPassRecuperada] = useState<string | null>(null);
  const [mnemonic, setMnemonic] = useState<string | null>(null);

  useEffect(() => {
    const loadPassword = async () => {
      const pwd = await getPassword();
      setPassRecuperada(pwd);
    };

    const loadMnemonic = async () => {
      const mnemonic = await getMnemonic();
      setMnemonic(mnemonic);
    }

    loadPassword();
    loadMnemonic();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-2">
      <h1>¡Bienvenido a la aplicación de criptomonedas!</h1>
      <p>La wallet está configurada.</p>
      <p>Contraseña recuperada: {passRecuperada ?? 'No disponible'}</p>
      <p>Mnemonic recuperada: {mnemonic ?? 'No disponible'}</p>
    </div>
  );
}

export default Inicio;