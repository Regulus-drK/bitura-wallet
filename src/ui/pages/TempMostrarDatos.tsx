import logoBitura from '../../assets/LogotipoBituraPng.png'
import { LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWindowSize } from "../../hooks/useWindowSize";
import { walletShouldBeConfigured } from "../../hooks/walletShouldBeConfigured";
import { enableMenu, getMnemonic, listarPrecios, consultarDireccion } from "../../services/apiService";
import { createWallets } from "../../services/walletService";
import { type ParsedBtcResponse, parseBtcResponse, type BtcResponse } from "../../types/BtcBalance";
import type { CryptoAPIResponse } from "../../types/CryptoPrices";
import { type ParsedEthResponse, parseEthResponse, type EthResponse } from "../../types/EthBalance";
import Spinner from "../components/Spinner";

function TempMostrarDatos() {
      const { password } = useAuth(); // Password global guardada en context
  const [bitcoinAddress, setBitcoinAddress] = useState<string | null>(null);
  const [ethereumAddress, setEthereumAddress] = useState<string | null>(null);
  const [precios, setPrecios] = useState<CryptoAPIResponse | null>(null);

  // Nuevos estados para datos de direcciones
  const [btcData, setBtcData] = useState<ParsedBtcResponse | null>(null);
  const [ethData, setEthData] = useState<ParsedEthResponse | null>(null);
  const [loadingBtc, setLoadingBtc] = useState(false);
  const [loadingEth, setLoadingEth] = useState(false);
  const [errorBtc, setErrorBtc] = useState<string | null>(null);
  const [errorEth, setErrorEth] = useState<string | null>(null);
  const navigate = useNavigate();
  
  walletShouldBeConfigured(true);

  const logOut = () => {
    navigate("/");
  };

  useEffect(() => {
    if (!password) return;

    enableMenu();

    const loadWallets = async () => {
      try {
        const mnemonic = await getMnemonic(password);
        const wallets = createWallets(mnemonic, 0);
        if (wallets) {
          setBitcoinAddress(wallets.bitcoin.address);
          setEthereumAddress(wallets.ethereum.address);

          // Direcciones de ejemplo para mostrar valores
          setBitcoinAddress("bc1q6zh3262pt8hf2dz20e0yt2l3atc7z3pv6cz0n0");
          setEthereumAddress("0xE1435BC2373a7CA71f201B910f6F43137bc231EB");
        }
      } catch (err) {
        console.error('Error al cargar la wallet:', err);
      }
    };
    const loadPrices = async () => {
      try {
        const datos = await listarPrecios();
        setPrecios(datos);
      } catch (err) {
        console.error('Error al cargar los precios: ', err);
      }
    }

    loadWallets();
    loadPrices();
  }, [password]);

  // Cuando tenemos las direcciones, cargamos los datos de las direcciones
  useEffect(() => {
    if (!bitcoinAddress && !ethereumAddress) return;

    const fetchBtcData = async () => {
      if (!bitcoinAddress) return;
      setLoadingBtc(true);
      setErrorBtc(null);
      try {
        const datosRaw = await consultarDireccion(bitcoinAddress, "1");
        const datosParseados = parseBtcResponse(datosRaw as BtcResponse);
        setBtcData(datosParseados);
      } catch (e) {
        setErrorBtc("Error cargando datos BTC");
      } finally {
        setLoadingBtc(false);
      }
    };

    const fetchEthData = async () => {
      if (!ethereumAddress) return;
      setLoadingEth(true);
      setErrorEth(null);
      try {
        const datosRaw = await consultarDireccion(ethereumAddress, "1");
        const datosParseados = parseEthResponse(datosRaw as EthResponse);
        setEthData(datosParseados);
      } catch (e) {
        setErrorEth("Error cargando datos ETH");
      } finally {
        setLoadingEth(false);
      }
    };

    fetchBtcData();
    fetchEthData();

  }, [bitcoinAddress, ethereumAddress]);

  useWindowSize({
      width: 1200,
      height: 850,
      minWidth: 750,
      minHeight: 550,
      resizable: true
  });
    return(
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-800">
        <div className="flex justify-center mt-6 select-none">
        <img 
            src={logoBitura} 
            alt="Logo Bitura" 
            className="w-28 h-20 object-contain"
        />
        </div>

        <h1 className="text-3xl font-bold mt-6 mb-1 text-neutral-100">¡Bienvenido a la aplicación de criptomonedas!</h1>
        <p className="text-neutral-300 mb-6">Ha iniciado sesión correctamente.</p>

        {bitcoinAddress && (
        <p className="text-lg font-medium text-blue-400 mb-1">
            <strong>Bitcoin:</strong> {bitcoinAddress}
        </p>
        )}
        {ethereumAddress && (
        <p className="text-lg font-medium text-purple-400 mb-4">
            <strong>Ethereum:</strong> {ethereumAddress}
        </p>
        )}

        {/* Datos Bitcoin */}
        <div className="border border-neutral-700 rounded-lg w-full max-w-md min-h-[250px] p-5 mt-4 bg-neutral-700 shadow-sm">
        <h2 className="text-xl font-semibold mb-3 text-blue-300">Datos Bitcoin</h2>
        {loadingBtc ? (
            <div className="flex items-center justify-center h-25">
            <Spinner />
            </div>
        ) : errorBtc ? (
            <p className="text-red-600 font-semibold">{errorBtc}</p>
        ) : btcData ? (
            <>
            <p className="mb-2">
                <strong>Saldo BTC:</strong>{" "}
                <span className="text-green-400 font-semibold">
                {btcData.confirmedBtc.toFixed(8)} BTC
                </span>
            </p>
            <p className="mb-2 font-semibold text-neutral-100">Transacciones en página {btcData.page}:</p>
            {btcData.transactions.length > 0 ? (
                <ul className="list-disc ml-6 max-h-52 overflow-auto text-sm text-neutral-300">
                {btcData.transactions.map((tx, i) => (
                    <li key={i} className="mb-3">
                    <div><strong>TxID:</strong> {tx.txid}</div>
                    <div><strong>Confirmado:</strong> {tx.status.confirmed ? "Sí" : "No"}</div>

                    <div className="mt-1">
                        <strong>De (vin):</strong>
                        <ul className="ml-4 list-decimal">
                        {tx.vin.map((input, j) => (
                            <li key={j}>
                            {input.prevout.scriptpubkey_address} — {input.prevout.value.dividedBy(1e8).toFixed(8)} BTC
                            </li>
                        ))}
                        </ul>
                    </div>

                    <div className="mt-1">
                        <strong>A (vout):</strong>
                        <ul className="ml-4 list-decimal">
                        {tx.vout.map((output, k) => (
                            <li key={k}>
                            {output.scriptpubkey_address} — {output.value.dividedBy(1e8).toFixed(8)} BTC
                            </li>
                        ))}
                        </ul>
                    </div>

                    <div className="mt-1 font-semibold text-green-400">
                        Fee: {tx.feeBtc.toFixed(8)} BTC
                    </div>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-neutral-300">No hay transacciones en esta página.</p>
            )}
            </>
        ) : (
            <p className="text-neutral-300">No hay datos BTC.</p>
        )}
        </div>

        {/* Datos Ethereum */}
        <div className="border border-neutral-700 rounded-lg w-full max-w-md min-h-[250px] p-5 mt-6 bg-neutral-700 shadow-sm">
        <h2 className="text-xl font-semibold mb-3 text-purple-300">Datos Ethereum</h2>
        {loadingEth ? (
            <div className="flex items-center justify-center h-25">
            <Spinner />
            </div>
        ) : errorEth ? (
            <p className="text-red-600 font-semibold">{errorEth}</p>
        ) : ethData ? (
            <>
            <p className="mb-2">
                <strong>Saldo ETH:</strong>{" "}
                <span className="text-green-400 font-semibold">
                {ethData.balanceEth.toFixed(8)} ETH
                </span>
            </p>
            <p className="mb-2 font-semibold text-neutral-100">Transacciones en página {ethData.page}:</p>
            {ethData.transactions.length > 0 ? (
                <ul className="list-disc ml-6 max-h-52 overflow-auto text-sm text-neutral-300">
                {ethData.transactions.map((tx, i) => (
                    <li key={i} className="mb-2">
                    <div><strong>TxHash:</strong> {tx.hash}</div>
                    <div><strong>Bloque:</strong> {tx.blockNumber}</div>
                    <div><strong>De:</strong> {tx.from}</div>
                    <div><strong>A:</strong> {tx.to}</div>
                    <div><strong>Cantidad: {tx.valueEth.toFixed(8)}</strong></div>
                    <div><strong>Tipo: {tx.input}</strong></div>
                    <div className="font-semibold text-green-400">Fee: {tx.feeEth.toFixed(8)} ETH</div>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-neutral-300">No hay transacciones en esta página.</p>
            )}
            </>
        ) : (
            <p className="text-neutral-300">No hay datos ETH.</p>
        )}
        </div>

        {/* Precios Cripto */}
        <div className="border border-neutral-700 rounded-lg w-full max-w-md min-h-[250px] p-5 mt-6 bg-neutral-700 shadow-sm">
        <h2 className="text-xl font-semibold mb-3 text-neutral-100">Precios Cripto</h2>
        {precios ? (
            Object.entries(precios.data).map(([symbol, info]) => (
            <div key={symbol} className="mb-4">
                <h3 className="text-lg font-semibold text-neutral-200">
                {info.name} ({info.symbol})
                </h3>
                <p>Precio: <span className="font-semibold">{info.quote.EUR.price.toFixed(2)}€</span></p>
                <p>Market Cap: <span className="font-semibold">{info.quote.EUR.market_cap.toLocaleString()}€</span></p>
                <p>
                Cambios 24h:{" "}
                <span className={`font-semibold ${
                    info.quote.EUR.percent_change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                    {info.quote.EUR.percent_change_24h.toFixed(2)}%
                </span>
                </p>
            </div>
            ))
        ) : (
            <div className="flex items-center justify-center h-25">
            <Spinner />
            </div>
        )}
        </div>

        <button
        onClick={logOut}
        className="px-5 py-2 mt-8 rounded-xl shadow-md border border-neutral-600 flex items-center gap-3 transition duration-300 hover:bg-neutral-600 active:scale-95 cursor-pointer text-neutral-100"
        >
        <LogOut className="w-5 h-5 text-neutral-100"/>
        Cerrar sesión
        </button>
    </div>

    )
}

export default TempMostrarDatos;