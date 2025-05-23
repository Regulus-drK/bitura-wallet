import {  useLocation, useNavigate } from "react-router-dom";
import type { WalletInfo } from "../../types/WalletInfo";
import btcIcon from "../../assets/crypto/bitcoin.png";
import ethIcon from "../../assets/crypto/ether.png";
import { useEffect, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import Spinner from "./Spinner";
import type { CryptoAPIResponse } from "../../types/CryptoPrices";
import { getAllWallets, getMnemonic, listarPrecios, updateWallet } from "../../services/apiService";
import { ArrowDown, ArrowUp, ArrowLeft, RefreshCw } from "lucide-react";
import { useWallets } from "../../context/WalletContext";
import { useAuth } from "../../context/AuthContext";
import { verificarFondosDireccionesBtc } from "../../services/walletService";

function CuentaDatos() {
  const { password } = useAuth();
  const { setWallets } = useWallets();
  const location = useLocation();
  const wallet: WalletInfo | undefined = location.state?.wallet;
  const [saldos, setSaldos] = useState<Record<string, BigNumber>>({});
  const [saldoEur, setSaldoEur] = useState<number>(-1);
  const [precioActCrypto, setPrecioActCrypto] = useState<CryptoAPIResponse | null>(null);
  const navigate = useNavigate();

  const isCancelled = useRef(false);

  if (!wallet || !saldos) return <Spinner/>;

  const handleNavigate = async (path: string) => {
    navigate(path, { state: { wallet } });
  }

  const loadPricesYBalances = async () => {
    try {
      // Reset de variables para hacer aparecer de nuevo los spinner e indicar que está cargando de nuevo
      setSaldos({});
      setSaldoEur(-1);
      setPrecioActCrypto(null);

      const datos = await listarPrecios();
      if (isCancelled.current || !datos) return;

      const criptoFiltrada = Object.values(datos.data).find(
        (crypto) => crypto.symbol === wallet?.tipoMoneda
      );

      if (!criptoFiltrada || isCancelled.current) return;

      const nuevaRespuesta: CryptoAPIResponse = {
        ...datos,
        data: {
          [wallet.tipoMoneda]: criptoFiltrada,
        },
      };
      setPrecioActCrypto(nuevaRespuesta);
      const precioMoneda = criptoFiltrada.quote.EUR.price;

      if (wallet?.tipoMoneda === 'BTC') {
        const mnemonic = await getMnemonic(password!);
        if (isCancelled.current) return;

        const fondosBtc = await verificarFondosDireccionesBtc(mnemonic, wallet, wallet.red!);
        if (isCancelled.current || !fondosBtc) return;

        setSaldos(prev => ({ ...prev, [wallet.nombre]: fondosBtc.totalBtc }));
        wallet.ultSaldoGuardado = fondosBtc.totalBtc.toFixed(7);

        const totalEur = fondosBtc.totalBtc.toNumber() * precioMoneda;
        setSaldoEur(totalEur);
        wallet.ultSaldoGuardadoEur = totalEur;

        const walletActualizada = await updateWallet(wallet.nombre, wallet);
        if (isCancelled.current) return;

        if (walletActualizada) {
          const allWallets = await getAllWallets();
          setWallets(allWallets);
        } else {
          console.error('Error al actualizar la wallet en localStorage.');
        }
      } else {
        // lógica ETH futura
      }
    } catch (err) {
      console.error("Error al cargar precios o balances:", err);
    }
  };

  useEffect(() => {
    if (!password) {
      navigate("/");
      return;
    }
    if (!wallet) return;

    isCancelled.current = false;
    loadPricesYBalances();

    return () => {
      isCancelled.current = true;
    };
  }, [wallet, password]);

  const iconoCrypto = wallet.tipoMoneda === 'BTC' ? btcIcon : ethIcon;
  const fecha = new Date();
  const ultSync = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});
  const infoCripto = precioActCrypto?.data[wallet.tipoMoneda];

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Encabezado con logo y nombre + botón */}
      <div className="flex items-center justify-between mb-6">
        {/* Bloque izquierdo: flecha, icono, nombre, etiquetas */}
        <div className="flex items-center space-x-4">
          <ArrowLeft
            onClick={() => navigate("/inicio/cuentas")}
            className="w-7 h-7 text-gray-400 hover:text-green-500 transition duration-200 cursor-pointer"
          />
          <img
            src={iconoCrypto}
            alt={`${wallet.tipoMoneda} logo`}
            draggable="false"
            className="w-10 h-10 select-none"
          />
          <h2 className="text-2xl font-bold">{wallet.nombre}</h2>

          {wallet.tipoDireccion === "native" && (
            <span className="text-green-500 text-xs border border-green-500 px-2 py-0.5 rounded-full font-medium">
              Native SegWit
            </span>
          )}
          {wallet.tipoDireccion === "segwit" && (
            <span className="text-yellow-400 text-xs border border-yellow-400 px-2 py-0.5 rounded-full font-medium">
              SegWit
            </span>
          )}
          {wallet.tipoDireccion === "legacy" && (
            <span className="text-red-400 text-xs border border-red-400 px-2 py-0.5 rounded-full font-medium">
              Legacy
            </span>
          )}
          {wallet.red === "testnet" && (
            <span className="text-yellow-500 text-xs border border-yellow-500 px-2 py-0.5 rounded-full font-medium">
              testnet
            </span>
          )}
        </div>

        {/* Botón sincronizar alineado a la derecha */}
        <button
          onClick={() => loadPricesYBalances()}
          className="flex items-center gap-2 text-sm px-4 py-2 select-none rounded-lg border border-gray-500 cursor-pointer text-white bg-neutral-800 hover:bg-neutral-700 transition"
        >
          <RefreshCw className="w-4 h-4 text-green-500" />
          <span className="font-semibold">Sincronizar</span>
        </button>
      </div>
      {/* Info de saldo */}
      <div className="bg-neutral-700 shadow max-w-4xl mx-auto rounded-xl text-left p-5 pl-10 pr-10 mb-4">
      {/* Saldo y euros en línea */}
      <div className="flex justify-between items-center mb-2">
        {/* Saldo BTC (o moneda) con spinner si no cargado */}
        <div className="text-lg font-semibold text-white flex items-center gap-2">
          {saldos[wallet.nombre] == null ? (
            <>
              <Spinner small size={16} />
              {wallet.ultSaldoGuardado} {wallet.tipoMoneda}
            </>
          ) : (
            <>
              {saldos[wallet.nombre].toFixed(7)} {wallet.tipoMoneda}
            </>
          )}
        </div>

        {/* Saldo en euros con spinner si no cargado */}
        <div className="text-lg text-gray-200 ml-4 flex items-center gap-2">
          {saldoEur == -1 ? (
            <>
              <Spinner small size={16} />
              <span className="font-medium">
                {wallet.ultSaldoGuardadoEur.toFixed(2)} €
              </span>
            </>
          ) : (
            <span className="font-medium">
              {saldoEur.toFixed(2)} €
            </span>
          )}
        </div>
      </div>

        {/* Precio actual */}
        <div className="text-sm text-center">
          {infoCripto ? (
            <div>
              <h3 className="text-gray-400 italic">
                1 {infoCripto.symbol} ≈ {infoCripto.quote.EUR.price.toFixed(2)} €
              </h3>
              <div className="flex justify-center space-x-6 text-sm mt-2">
                <p className="flex items-center space-x-1">
                  <span>Cambios 24h:</span>
                  <span
                    className={`font-semibold flex items-center ${
                      infoCripto.quote.EUR.percent_change_24h >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {infoCripto.quote.EUR.percent_change_24h >= 0 ? "⬈" : "⬊"}{" "}
                    {infoCripto.quote.EUR.percent_change_24h.toFixed(2)}%
                  </span>
                </p>
                <p className="flex items-center space-x-1">
                  <span>Cambios 7d:</span>
                  <span
                    className={`font-semibold flex items-center ${
                      infoCripto.quote.EUR.percent_change_7d >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {infoCripto.quote.EUR.percent_change_7d >= 0 ? "⬈" : "⬊"}{" "}
                    {infoCripto.quote.EUR.percent_change_7d.toFixed(2)}%
                  </span>
                </p>
              </div>
              <h3 className="text-gray-400 mt-2">
                Última actualización: {ultSync}
              </h3>
            </div>
          ) : (
            <div className="flex items-center justify-center h-25">
              <Spinner />
            </div>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-center text-xl font-bold gap-6 mb-4">
          {/* Botón Enviar */}
          <button
              onClick={() => handleNavigate("/inicio/enviar")}
              disabled={saldos[wallet.nombre] ? saldos[wallet.nombre].toNumber() <= 0 : true}
              className={`w-[35%] min-w-[240px] px-6 py-3 rounded-2xl justify-center shadow-md border select-none flex items-center gap-2 transition duration-300
                  ${(saldos[wallet.nombre] ? saldos[wallet.nombre].toNumber() <= 0 : true) 
                      ? "bg-neutral-600 text-gray-300 cursor-not-allowed border-gray-400" 
                      : "border-gray-500 bg-neutral-800 cursor-pointer text-white hover:bg-neutral-700"}`
              }
          >
              <ArrowUp className="w-6 h-6"/>
              Enviar
          </button>
          {/* Botón Recibir */}
          <button
              onClick={() => handleNavigate("/inicio/recibir")}
              className="w-[35%] min-w-[240px] px-6 py-3 rounded-2xl justify-center shadow-md border select-none flex items-center gap-2 transition duration-300
              border-gray-500 bg-neutral-800 cursor-pointer text-white hover:bg-neutral-700"
          >
              <ArrowDown className="w-6 h-6"/>
              Recibir
          </button>
      </div>

      {/* Área para transacciones */}
      <div className="bg-neutral-700 shadow rounded-xl p-4">
        <h3 className="text-xl font-semibold mb-4">Transacciones</h3>
        <div className="text-gray-500 italic">Aquí se listarán las transacciones con paginación...</div>
        {/* Aquí irán los componentes de transacciones paginadas */}
      </div>
    </div>

  );
}

export default CuentaDatos;