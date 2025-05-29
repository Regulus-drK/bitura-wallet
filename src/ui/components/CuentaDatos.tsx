import {  useLocation, useNavigate } from "react-router-dom";
import type { WalletInfo } from "../../types/WalletInfo";
import btcIcon from "../../assets/crypto/bitcoin.png";
import ethIcon from "../../assets/crypto/ether.png";
import { useEffect, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import Spinner from "./Spinner";
import type { CryptoAPIResponse } from "../../types/CryptoPrices";
import { consultarDireccion, getAllWallets, getMnemonic, getRedSeleccionada, listarPrecios, updateWallet } from "../../services/apiService";
import { ArrowDown, ArrowUp, ArrowLeft, RefreshCw, Settings } from "lucide-react";
import { useWallets } from "../../context/WalletContext";
import { useAuth } from "../../context/AuthContext";
import { obtenerTxsBtc, verificarFondosDireccionesBtc } from "../../services/walletService";
import { type ParsedEthResponse, parseEthResponse, type EthResponse } from "../../types/EthBalance";
import { type BtcTransactionFormatted } from "../../types/BtcBalance";
import TransiccionPagina from "./TransiccionPagina";

function CuentaDatos() {
  const { password } = useAuth();
  const { setWallets } = useWallets();
  const location = useLocation();
  const wallet: WalletInfo | undefined = location.state?.wallet;
  const [redSeleccionada, setRedSeleccionada] = useState<'mainnet' | 'testnet' | null>(null);
  const [saldos, setSaldos] = useState<Record<string, BigNumber>>({});
  const [saldoEur, setSaldoEur] = useState<number>(-1);
  const [datosPrecioActCrypto, setDatosPrecioActCrypto] = useState<CryptoAPIResponse | null>(null);
  const [precioActCrypto, setPrecioActCrypto] = useState<number>(1);
  const [isTxsLoaded, setIsTxsLoaded] = useState<boolean>(false);
  const [txsBtc, setTxsBtc] = useState<BtcTransactionFormatted[]>([]);
  const [fondosEth, setFondosEth] = useState<ParsedEthResponse>();
  const [paginaTxEth, setPaginaTxEth] = useState<number>(1);
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
      setDatosPrecioActCrypto(null);
      setIsTxsLoaded(false);

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
      setDatosPrecioActCrypto(nuevaRespuesta);
      const precioMoneda = criptoFiltrada.quote.EUR.price;
      setPrecioActCrypto(precioMoneda);

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

        loadTransaccionesBtc();
      } else {
        let testnet = redSeleccionada === 'testnet' ? true : false;
        const result = await consultarDireccion(wallet.direccionPublica, paginaTxEth.toString(), testnet);

        if (isCancelled.current) return;
        
        if (result) {
          const fondosEth = parseEthResponse(result as EthResponse);

          setFondosEth(fondosEth);
          setSaldos(prev => ({ ...prev, [wallet.nombre]: fondosEth.balanceEth }));
          wallet.ultSaldoGuardado = fondosEth.balanceEth.toFixed(7);

          const totalEur = fondosEth.balanceEth.toNumber() * precioMoneda;
          setSaldoEur(totalEur);
          wallet.ultSaldoGuardadoEur = totalEur;

          setIsTxsLoaded(true);
        }
      }
      // Después de sacar los datos y ajustarlos, se actualiza la wallet en el JSON
      const walletActualizada = await updateWallet(wallet.nombre, wallet, wallet.red);
      if (isCancelled.current) return;

      if (walletActualizada) {
        const allWallets = await getAllWallets();
        setWallets(allWallets);
      } else {
        console.error('Error al actualizar la wallet en localStorage.');
      }
    } catch (err) {
      console.error("Error al cargar precios o balances:", err);
    }
  };

  const loadTransaccionesBtc = async () => {
    try {
      const mnemonic = await getMnemonic(password!);
      if (!mnemonic) return;
      const resultados = await obtenerTxsBtc(mnemonic, wallet, redSeleccionada!);
      if (resultados) {
        setTxsBtc(resultados); // [{ direccion, txsFormateadas }]
        setIsTxsLoaded(true);
      }

    } catch (err) {
      console.error("Error cargando transacciones BTC:", err);
      setTxsBtc([]);
      setIsTxsLoaded(true);
    }
  }

  useEffect(() => {
      const cargarRed = async () => setRedSeleccionada(await getRedSeleccionada());
      cargarRed();
  }, []);

  useEffect(() => {
    if (!password) {
      navigate("/");
      return;
    }
    if (!wallet || !redSeleccionada) return;

    isCancelled.current = false;
    loadPricesYBalances();

    return () => {
      isCancelled.current = true;
    };
  }, [wallet, password, redSeleccionada]);

  const iconoCrypto = wallet.tipoMoneda === 'BTC' ? btcIcon : ethIcon;
  const fecha = new Date();
  const ultSync = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});
  const infoCripto = datosPrecioActCrypto?.data[wallet.tipoMoneda];

  return (
    <TransiccionPagina>
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
            {/* Para ETH */}
            {wallet.tipoMoneda === "ETH" && redSeleccionada === 'testnet' && (
              <span className="text-yellow-500 text-xs border border-yellow-500 px-2 py-0.5 rounded-full font-medium">
                testnet Sepolia
              </span>
            )}
          </div>

          <div className="flex justify-end items-center gap-x-3">
            {/* Botón Ajustes cuenta */}
            <button
              onClick={() => handleNavigate("ajustes")}
              className="group flex items-center gap-2 text-sm px-3.5 py-2.5 select-none rounded-lg border border-gray-500 cursor-pointer text-white bg-neutral-800 hover:bg-neutral-700 transition"
            >
              <Settings className="w-4 h-4 transition-colors duration-300 group-hover:text-gray-300" />
            </button>

            {/* Botón sincronizar */}
            <button
              onClick={() => loadPricesYBalances()}
              className="flex items-center gap-2 text-sm px-4 py-2 select-none rounded-lg border border-gray-500 cursor-pointer text-white bg-neutral-800 hover:bg-neutral-700 transition"
            >
              <RefreshCw className="w-4 h-4 text-green-500" />
              <span className="font-semibold">Sincronizar</span>
            </button>
          </div>
          
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
              <div className="h-25 inset-0 flex items-center justify-center pointer-events-none">
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
                        : "group border-gray-500 bg-neutral-800 cursor-pointer text-white hover:bg-neutral-700"}`
                }
            >
                <ArrowUp className="w-6 h-6 transition-colors duration-300 group-hover:text-red-400"/>
                Enviar
            </button>
            {/* Botón Recibir */}
            <button
                onClick={() => handleNavigate("/inicio/recibir")}
                className="group w-[35%] min-w-[240px] px-6 py-3 rounded-2xl justify-center shadow-md border select-none flex items-center gap-2 transition duration-300
                border-gray-500 bg-neutral-800 cursor-pointer text-white hover:bg-neutral-700"
            >
                <ArrowDown className="w-6 h-6 transition-colors duration-300 group-hover:text-green-400"/>
                Recibir
            </button>
        </div>

        {/* Área para transacciones */}
        <div className="bg-neutral-700 shadow rounded-xl p-4">
          <h3 className="text-xl font-semibold mb-4">Transacciones</h3>
          {!isTxsLoaded ? (
            <div className="h-20 inset-0 flex items-center justify-center pointer-events-none">
              <Spinner />
            </div>
          ) : (
            <>
              {wallet.tipoMoneda === 'BTC' ? (
              <>
                {txsBtc.length === 0 ? (
                  <p className="text-gray-400">No se encontraron transacciones en esta cuenta.</p>
                ) : (
                  txsBtc.map((tx, idx) => {
                    const direccion = tx.address;
                    const recibido = tx.vout.some(vout => vout.scriptpubkey_address === direccion);
                    const enviado = tx.vin.some(vin => vin.prevout.scriptpubkey_address === direccion);
                    const hayCambio = tx.vout.some(vout => vout.scriptpubkey_address === direccion && vout.esCambio);

                    // Prioriza "Transferencia interna"
                    const tipo = hayCambio
                      ? "Transferencia interna"
                      : recibido && enviado
                      ? "Enviado a uno mismo"
                      : recibido
                      ? "Recibido"
                      : "Enviado";

                    const icon =
                      tipo === "Recibido" ? (
                        <ArrowDown className={`text-green-400`} />
                      ) : tipo === "Enviado" ? (
                        <ArrowUp className={`text-red-400`} />
                      ) : (
                        <ArrowUp className="text-yellow-400 rotate-90" />
                      );

                    const valorTotal =
                      tipo === "Recibido"
                        ? tx.vout
                            .filter(vout => vout.scriptpubkey_address === direccion)
                            .reduce((sum, v) => sum + Number(v.valueBtc), 0)
                      : tipo === "Transferencia interna"
                        ? tx.vout
                            .filter(vout => vout.scriptpubkey_address === direccion && vout.esCambio)
                            .reduce((sum, v) => sum + Number(v.valueBtc), 0)
                      : // Enviado y Enviado a uno mismo
                        tx.vin
                            .filter(vin => vin.prevout.scriptpubkey_address === direccion)
                            .reduce((sum, v) => sum + Number(v.prevout.valueBtc), 0);

                    return (
                      <div
                        key={`${idx}`}
                        className={`rounded-xl p-4 mb-4 shadow bg-neutral-800 border-l-4 ${
                          tipo === "Recibido"
                            ? "border-green-500"
                            : tipo === "Enviado"
                            ? "border-red-500"
                            : "border-yellow-500"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {icon}
                            <span className="font-semibold text-white">{tipo}</span>
                            {tipo === "Transferencia interna" && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-600 text-white rounded-full">
                                Cambio
                              </span>
                            )}
                            {tipo === "Enviado a uno mismo" && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-600 text-white rounded-full">
                                A ti mismo
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {tx.status.confirmed
                              ? tx.status.block_time_formatted
                              : "No confirmado"}
                          </span>
                        </div>

                        <div className="text-sm text-gray-300 break-all mb-2">
                          <a
                            href={`https://mempool.space/${
                              redSeleccionada === "mainnet" ? "" : "testnet/"
                            }tx/${tx.txid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 underline hover:text-blue-300 transition"
                          >
                            {tx.txid}
                          </a>
                        </div>

                        <div className="flex justify-between text-sm">
                          <div
                            className={`${
                              tipo === "Enviado"
                                ? "text-red-400"
                                : tipo === "Transferencia interna"
                                ? "text-yellow-400"
                                : "text-green-500"
                            }`}
                          >
                            {tipo === "Enviado" ? "-" : "+"}
                            {valorTotal.toFixed(7)} BTC ≈{" "}
                            {(valorTotal * precioActCrypto).toFixed(2)} EUR
                          </div>
                          {tipo !== "Transferencia interna" && (
                            <div>
                              <strong>Fee:</strong> {tx.feeBtc} BTC ≈{" "}
                              {(Number(tx.feeBtc) * precioActCrypto).toFixed(2)} EUR
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </>
              ) : (
                <>
                  {fondosEth?.page === 1 && fondosEth.transactions.length === 0 ? (
                    <p className="text-gray-400">No se encontraron transacciones en esta cuenta.</p>
                  ) : (
                    <h1>TO DO</h1>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </TransiccionPagina>
  );
}

export default CuentaDatos;