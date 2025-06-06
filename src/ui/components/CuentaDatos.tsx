import {  useLocation, useNavigate } from "react-router-dom";
import type { WalletInfo } from "../../types/BituraStore";
import btcIcon from "../../assets/crypto/bitcoin.png";
import ethIcon from "../../assets/crypto/ether.png";
import { useEffect, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import Spinner from "./Spinner";
import type { CryptoAPIResponse } from "../../types/CryptoPrices";
import { consultarDireccion, getAllWallets, getMnemonic, getRedSeleccionada, listarPrecios, updateWallet } from "../../services/apiService";
import { ArrowDown, ArrowUp, ArrowLeft, RefreshCw, Settings, ArrowRight } from "lucide-react";
import { useWallets } from "../../context/WalletContext";
import { useAuth } from "../../context/AuthContext";
import { obtenerTxsBtc, verificarFondosDireccionesBtc } from "../../services/walletService";
import { type ParsedEthResponse, parseEthResponse, type EthResponse } from "../../types/EthBalance";
import { type BtcTransactionFormatted } from "../../types/BtcBalance";
import TransiccionPagina from "./TransiccionPagina";
import { useToast } from "./Toast";
import { AlertTriangle } from "lucide-react";

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
  const [modoOffline, setModoOffline] = useState<boolean>(false);
  const navigate = useNavigate();

  const { showToast } = useToast();

  const isCancelled = useRef(false);

  if (!wallet || !saldos) return <Spinner/>;

  // Función para navegar a otra página pasando como valor a la página la wallet
  const handleNavigate = async (path: string) => {
    navigate(path, { state: { wallet } });
  }

  // Función para saber si se accede a uno de los dos botones desde Cuenta Datos
  // y si es así, hacer que la flecha de Volver devuelva a Cuenta Datos y no
  // a la raíz de Enviar o Recibir
  const handleNavigateEnviarRecibir = async (path: string) => {
    navigate(path, { state: { wallet, backCuentaDatos: true } });
  }

  // Función para cargar los precios y los balances de la cuenta
  const loadPricesYBalances = async () => {
    try {
      setSaldos({});
      setFondosEth(undefined);
      setSaldoEur(-1);
      setDatosPrecioActCrypto(null);
      setIsTxsLoaded(false);
      setModoOffline(false);

      const datos = await listarPrecios(); // Llamada a API Java
      if (isCancelled.current) return;

      if (!datos) {
        setModoOffline(true);
        setIsTxsLoaded(true);
        showToast("No se ha podido recuperar datos. Se muestran datos guardados.", "error");
        return;
      }

      const criptoFiltrada = Object.values(datos.data).find(
        (crypto) => crypto.symbol === wallet?.tipoMoneda
      ); // Elegimos solo la cripto de la cuenta asociada

      if (!criptoFiltrada || isCancelled.current) {
        setModoOffline(true);
        setIsTxsLoaded(true);
        showToast("No se ha podido recuperar datos. Se muestran datos guardados.", "error");
        return;
      }

      const nuevaRespuesta: CryptoAPIResponse = {
        ...datos,
        data: {
          [wallet.tipoMoneda]: criptoFiltrada,
        },
      };
      setDatosPrecioActCrypto(nuevaRespuesta);
      const precioMoneda = criptoFiltrada.quote.EUR.price; // Precio actual cripto
      setPrecioActCrypto(precioMoneda);

      if (wallet?.tipoMoneda === 'BTC') { // Caso BTC para cargar fondos
        const mnemonic = await getMnemonic(password!);
        if (isCancelled.current) return;

        const fondosBtc = await verificarFondosDireccionesBtc(mnemonic, wallet, wallet.red!);
        if (isCancelled.current || !fondosBtc || fondosBtc.error) {
          setModoOffline(true);
          setIsTxsLoaded(true);
          return;
        }

        setSaldos(prev => ({ ...prev, [wallet.nombre]: fondosBtc.totalBtc }));
        // Solo actualiza los datos locales si hay conexión
        wallet.ultSaldoGuardado = fondosBtc.totalBtc.toFixed(7);

        const totalEur = fondosBtc.totalBtc.toNumber() * precioMoneda;
        setSaldoEur(totalEur);
        wallet.ultSaldoGuardadoEur = totalEur;

        // Solo actualiza en localStorage si hay conexión
        const walletActualizada = await updateWallet(wallet.nombre, wallet, wallet.red);
        if (isCancelled.current) return;
        if (walletActualizada) {
          const allWallets = await getAllWallets();
          setWallets(allWallets);
        } else {
          console.error('Error al actualizar la wallet en localStorage.');
        }

        loadTransaccionesBtc();
      } else { // Caso ETH para cargar fondos
        let testnet = redSeleccionada === 'testnet' ? true : false;
        const result = await consultarDireccion(wallet.direccionPublica, paginaTxEth.toString(), testnet);

        if (isCancelled.current) return;

        if (!result) {
          setModoOffline(true);
          setIsTxsLoaded(true);
          showToast("No se ha podido recuperar los saldos. Se muestran datos guardados.", "error");
          return;
        }

        const fondosEth = parseEthResponse(result as EthResponse);

        setFondosEth(fondosEth);
        setSaldos(prev => ({ ...prev, [wallet.nombre]: fondosEth.balanceEth }));
        wallet.ultSaldoGuardado = fondosEth.balanceEth.toFixed(7);

        const totalEur = fondosEth.balanceEth.toNumber() * precioMoneda;
        setSaldoEur(totalEur);
        wallet.ultSaldoGuardadoEur = totalEur;

        setIsTxsLoaded(true);

        // Solo actualiza en localStorage si hay conexión
        const walletActualizada = await updateWallet(wallet.nombre, wallet, wallet.red);
        if (isCancelled.current) return;
        if (walletActualizada) {
          const allWallets = await getAllWallets();
          setWallets(allWallets);
        } else {
          console.error('Error al actualizar la wallet en localStorage.');
        }
      }
    } catch (err) {
      setModoOffline(true);
      setIsTxsLoaded(true);
      showToast("No se ha podido recuperar datos. Se muestran datos guardados.", "error");
      console.error("Error al cargar precios o balances:", err);
    }
  };

  // Función para cargar las transacciones de BTC de la cuenta
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

  // De momento solo para Ethereum
  // Handles para ir a la página anterior o siguiente
  const handlePaginaAnterior = () => {
    if (fondosEth && fondosEth.page > 1) {
      setPaginaTxEth(prev => prev - 1);
    }
  }

  const handlePaginaSiguiente = () => {
    setPaginaTxEth(prev => prev + 1);
  }

  // Efectos React
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

  useEffect(() => {
    if (isTxsLoaded) { // Evitar carga inicial duplicada
      loadPricesYBalances();
    }
  }, [paginaTxEth]);  // Cuando cambia la página de las Tx de ETH, se ejecuta el effect

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
              disabled={!isTxsLoaded}
              className="flex items-center gap-2 text-sm px-4 py-2 select-none rounded-lg 
              border border-gray-500 cursor-pointer text-white bg-neutral-800 hover:bg-neutral-700 
              transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-neutral-800"
            >
              <RefreshCw className={`w-4 h-4 text-green-500 ${!isTxsLoaded ? 'animate-spin' : ''}`} />
              <span className="font-semibold">Sincronizar</span>
            </button>
          </div>
          
        </div>
        {/* Aviso de modo offline justo debajo del header */}
        {modoOffline && (
          <div className="flex items-center justify-center mb-4 p-3 bg-yellow-900/80 border border-yellow-600 rounded-lg text-yellow-300 font-semibold gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <span>
              Mostrando datos guardados. No se ha podido conectar para obtener datos en tiempo real.
            </span>
          </div>
        )}
        {/* Info de saldo */}
        <div className="bg-neutral-700 shadow max-w-4xl mx-auto rounded-xl text-left p-5 pl-10 pr-10 mb-4">
        {/* Saldo y euros en línea */}
        <div className="flex justify-between items-center mb-2">
          {/* Saldo BTC (o moneda) con spinner si no cargado */}
          <div className="text-lg font-semibold text-white flex items-center gap-2">
            {saldos[wallet.nombre] == null && !modoOffline ? (
              <>
                <Spinner small size={18} />
                <span>{wallet.ultSaldoGuardado} {wallet.tipoMoneda}</span>
              </>
            ) : modoOffline ? (
              <>
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
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
            {saldoEur == -1 && !modoOffline ? (
              <>
                <Spinner small size={18} />
                <span className="font-medium">{wallet.ultSaldoGuardadoEur.toFixed(2)} €</span>
              </>
            ) : modoOffline ? (
              <>
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
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
            {infoCripto && !modoOffline ? (
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
            ) : modoOffline ? (
              <div className="flex flex-col items-center justify-center text-yellow-300">
                <AlertTriangle className="w-6 h-6 mb-1" />
                <span className="font-semibold">No se pudo actualizar el precio actual. Mostrando datos guardados.</span>
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
                onClick={() => handleNavigateEnviarRecibir("/inicio/enviar")}
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
                onClick={() => handleNavigateEnviarRecibir("/inicio/recibir")}
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
                {/* Transacciones de Bitcoin */}
                {txsBtc.length === 0 ? (
                  <p className="text-gray-400">No se encontraron transacciones en esta cuenta.</p>
                ) : (
                  txsBtc.map((tx, idx) => {
                    const direccion = tx.address;
                    
                    // Determinar el tipo de transacción
                    const esRecibido = tx.vout.some(vout => vout.scriptpubkey_address === direccion);
                    const esEnviado = tx.vin.some(vin => vin.prevout.scriptpubkey_address === direccion);
                    const esCambio = tx.vout.some(vout => vout.scriptpubkey_address === direccion && vout.esCambio && 
                      tx.vin.some(vin => vin.prevout.scriptpubkey_address !== direccion)
                    );
                    
                    const tipo = esCambio ? "Transferencia interna" : 
                                esEnviado ? "Enviado" :
                                esRecibido ? "Recibido" : "Enviado";

                    return (
                      <div
                        key={`${idx}`}
                        className={`rounded-xl p-4 mb-4 shadow bg-neutral-800 border-l-4 ${
                          tipo === "Recibido" ? "border-green-500" :
                          tipo === "Enviado" ? "border-red-500" :
                          "border-yellow-500"
                        }`}
                      >
                        {/* Encabezado de la transacción */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {tipo === "Recibido" ? (
                              <ArrowDown className="text-green-400" />
                            ) : tipo === "Enviado" ? (
                              <ArrowUp className="text-red-400" />
                            ) : (
                              <ArrowUp className="text-yellow-400 rotate-90" />
                            )}
                            <span className="font-semibold text-white">{tipo}</span>
                            {esCambio && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-600 text-white rounded-full">
                                Cambio
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {tx.status.confirmed ? tx.status.block_time_formatted : "No confirmado"}
                          </span>
                        </div>

                        {/* ID de transacción */}
                        <div className="text-sm text-gray-300 break-all mb-3">
                          <a
                            href={`https://mempool.space/${redSeleccionada === "mainnet" ? "" : "testnet/"}tx/${tx.txid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 underline hover:text-blue-300 transition"
                          >
                            {tx.txid}
                          </a>
                        </div>

                        {/* Detalles de entradas (inputs) */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">Entradas:</h4>
                          {tx.vin
                            .map((vin, i) => (
                              <div
                                key={`vin-${i}`}
                                className="text-sm flex flex-col sm:flex-row sm:justify-between mb-2 bg-red-800/30 p-2 rounded-lg"
                              >
                                <span className="text-red-400 font-medium">-{vin.prevout.valueBtc} BTC</span>
                                <span className="text-gray-400 text-xs mt-1 sm:mt-0 break-all">
                                  <span className="font-semibold text-white">Desde:</span> {vin.prevout.scriptpubkey_address}
                                </span>
                              </div>
                            ))}
                        </div>
                        
                        {/* Detalles de salidas (outputs) */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">Salidas:</h4>
                          {tx.vout
                          .map((vout, i) => {
                            const esDestino = vout.scriptpubkey_address === direccion;
                            const esCambio = vout.esCambio;

                            return (
                              <div
                                key={`vout-${i}`}
                                className={`text-sm flex flex-col sm:flex-row sm:justify-between mb-2 p-2 rounded-lg ${
                                  esDestino ? "bg-green-900/30" : "bg-neutral-700/40"
                                }`}
                              >
                                <span className={esDestino ? "text-green-400 font-medium" : "text-gray-300 font-medium"}>
                                  {esDestino ? "+" : "-"}
                                  {vout.valueBtc} BTC
                                </span>
                                <span className="text-gray-400 text-xs mt-1 sm:mt-0 break-all">
                                  {esDestino ? (
                                    <span><span className="font-semibold text-white">A tu dirección</span></span>
                                  ) : esCambio ? (
                                    <span><span className="font-semibold text-white">Cambio:</span> {vout.scriptpubkey_address}</span>
                                  ) : (
                                    <span><span className="font-semibold text-white">A:</span> {vout.scriptpubkey_address}</span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Resumen y fee */}
                        <div className="flex flex-col gap-1 text-sm pt-3 border-t border-neutral-700 mt-2">
                          {/* Total enviado o recibido */}
                          <div className={`flex justify-between ${
                            tipo === "Enviado" ? "text-red-400" :
                            tipo === "Transferencia interna" ? "text-yellow-400" :
                            "text-green-400"
                          } font-semibold`}>
                            <span>
                              {(() => {
                                if (tipo === "Enviado") {
                                  const totalEnviado = tx.vout
                                    .filter(vout => vout.scriptpubkey_address !== direccion && !vout.esCambio)
                                    .reduce((sum, vout) => sum + Number(vout.valueBtc), 0);
                                  return `-${totalEnviado.toFixed(7)} BTC ≈ ${(totalEnviado * precioActCrypto).toFixed(2)} EUR`;
                                } else {
                                  const totalRecibido = tx.vout
                                    .filter(vout => vout.scriptpubkey_address === direccion)
                                    .reduce((sum, vout) => sum + Number(vout.valueBtc), 0);
                                  return `+${totalRecibido.toFixed(7)} BTC ≈ ${(totalRecibido * precioActCrypto).toFixed(2)} EUR`;
                                }
                              })()}
                            </span>
                            {/* Fee */}
                            {tipo !== "Transferencia interna" && (
                                <span className="flex justify-between text-gray-400 text-xs font-medium">Comisión: {tx.feeBtc} BTC ≈ {(Number(tx.feeBtc) * precioActCrypto).toFixed(2)} EUR</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
              ) : (
                <>
                  {/* Transacciones de Ethereum */}
                  {fondosEth?.page === 1 && fondosEth.transactions.length === 0 ? (
                    <p className="text-gray-400">No se encontraron transacciones en esta cuenta.</p>
                  ) : (
                    fondosEth?.transactions.map((tx, idx) => {
                      const direccion = fondosEth.address.toLowerCase();
                      const recibido = tx.to === direccion;
                      // const enviado = tx.from === direccion;

                      const tipo = recibido ? 'Recibido' : 'Enviado';

                      const icon =
                        tipo === "Recibido" ? <ArrowDown className={`text-green-400`} />
                        : <ArrowUp className={`text-red-400`} />
                      
                      return (
                        <div
                          key={`${idx}`}
                          className={`rounded-xl p-4 mb-4 shadow bg-neutral-800 border-l-4 ${
                            tipo === "Recibido"
                              ? "border-green-500"
                              : "border-red-500"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              {icon}
                              <span className="font-semibold text-white">{tipo}</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {Number(tx.confirmations) > 5 && tx.txreceipt_status === "1"
                                ? tx.fecha
                                : "No confirmado"}
                            </span>
                          </div>

                          <div className="text-sm text-gray-300 break-all mb-4">
                              <div className="text-[13px] mb-1">
                                {tipo === 'Enviado' ? `Hacia: ${tx.to}` : `De: ${tx.from}`}
                              </div>
                            <a
                              href={`https://${
                                redSeleccionada === "mainnet" ? "" : "sepolia."
                              }etherscan.io/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 underline hover:text-blue-300 transition"
                            >
                              {tx.hash}
                            </a>
                          </div>

                          <div className="flex justify-between text-sm border-t pt-3 border-neutral-700">
                              <div
                                className={`${
                                  tipo === "Enviado"
                                    ? "text-red-400"
                                    : "text-green-500"
                                }`}
                              >
                                {tipo === "Enviado" ? "-" : "+"}
                                {tx.valueEth.toFixed(7)} ETH ≈{" "}
                                {(Number(tx.valueEth) * precioActCrypto).toFixed(2)} EUR
                              </div>
                              <div>
                                <strong>Comisión:</strong> {tx.feeEth.toFixed(7)} ETH ≈{" "}
                                {(Number(tx.feeEth) * precioActCrypto).toFixed(2)} EUR
                              </div>
                          </div>
                        </div>
                      );
                    }) 
                  )}
                  {/* Botones para elegir página de Txs de Ethereum */}
                  {!fondosEth || !(fondosEth.transactions.length === 0 && fondosEth.page === 1) && (
                    <div className="flex justify-between items-center mt-6">
                      <button
                        disabled={!fondosEth || (fondosEth.transactions.length === 0 && fondosEth.page === 1) || fondosEth.page === 1}
                        onClick={handlePaginaAnterior}
                        className="text-white px-4 py-2 bg-neutral-700 rounded-lg border-gray-500 border hover:bg-neutral-600 transition cursor-pointer
                        disabled:hover:bg-neutral-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-300"                   
                      >
                        <ArrowLeft className="w-4 h-6"/>
                      </button>

                      <span className="text-gray-300 font-medium">
                        Página {fondosEth?.page}
                      </span>

                      <button
                        disabled={!fondosEth || fondosEth.transactions.length < 15}
                        onClick={handlePaginaSiguiente}
                        className="text-white px-4 py-2 bg-neutral-700 border border-gray-500 rounded-lg hover:bg-neutral-600 transition cursor-pointer
                        disabled:hover:bg-neutral-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-300"
                      >
                        <ArrowRight className="w-4 h-6"/>
                      </button>
                    </div>
                  )}
                  {fondosEth?.transactions.length === 0 && fondosEth.page !== 1 &&
                    <p className="text-gray-400">No se encontraron transacciones en esta página.</p>
                  }
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