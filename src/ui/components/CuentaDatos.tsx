import { useLocation } from "react-router-dom";
import type { WalletInfo } from "../../types/WalletInfo";

function CuentaDatos() {
  const location = useLocation();
  const wallet: WalletInfo | undefined = location.state?.wallet;

  if (!wallet) return <div>No hay wallet seleccionada.</div>;

  return (
    <div>
      <h2>Datos de la wallet {wallet.nombre}</h2>
      {/* Renderizar info de wallet */}
    </div>
  );
}

export default CuentaDatos;