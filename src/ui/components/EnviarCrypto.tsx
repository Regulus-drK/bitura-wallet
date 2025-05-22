import { useLocation, useNavigate } from "react-router-dom";
import { useWallets } from "../../context/WalletContext";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import type { WalletInfo } from "../../types/WalletInfo";
import BigNumber from "bignumber.js";
import { getAllWallets, getMnemonic, getRedBtcSeleccionada, listarPrecios, updateWallet } from "../../services/apiService";
import { enviarBtc, esDireccionBtcValida, esDireccionEthValida, verificarFondosDireccionesBtc } from "../../services/walletService";
import btcIcon from "../../assets/crypto/bitcoin.png";
import ethIcon from "../../assets/crypto/ether.png";
import Spinner from "../components/Spinner";
import { ArrowLeft, ArrowRight, ArrowUp, CircleCheckBig, CircleX, House } from "lucide-react";
import type { BtcAddressUtxo } from "../../types/BtcBalance";

function EnviarCrypto() {
    const location = useLocation();
    const navigate = useNavigate();
    const { wallets, setWallets } = useWallets();
    const { password } = useAuth();
    const [wallet, setWallet] = useState<WalletInfo | undefined>(location.state?.wallet);
    const [walletReceived, setWalletReceived] = useState<boolean>(false);
    const [saldos, setSaldos] = useState<Record<string, BigNumber | null>>({});
    const [redBtcSeleccionada, setRedBtcSeleccionada] = useState<'mainnet' | 'testnet' | null>(null);
    const [receiptAddress, setReceiptAddress] = useState<string>("");
    const [isValidAddress, setIsValidAddress] = useState<boolean | null>(null);
    const [isSameAddress, setIsSameAddress] = useState<boolean>(false);
    const [saldoWalletComprobado, setSaldoWalletComprobado] = useState<boolean | null>(null);
    const [precioActCrypto, setPrecioActCrypto] = useState<number>(0);

    const [cantidadAenviar, setCantidadAenviar] = useState<string>("");
    const [cantidadAenviarEur, setCantidadAenviarEur] = useState<number>(0);
    const [mostrarComision, setMostrarComision] = useState<boolean>(false);
    const [comision, setComision] = useState("");
    const [cantidadComisionEur, setCantidadComisionEur] = useState<number>(0);

    const [fondosBTC, setFondosBTC] = useState<BtcAddressUtxo[] | null>(null);
    const [saldoInsuficiente, setSaldoInsuficiente] = useState<boolean | null>(null);
    const [saldoConFeeInsuficiente, setSaldoConFeeInsuficiente] = useState<boolean | null>(null);
    const [isTransactionSuccessful, setIsTransactionSuccessful] = useState<boolean | null>(null);
    const [txInfo, setTxInfo] = useState({
        txid: '',
        rawTx: '',
        totalInput: new BigNumber(0),
        totalOutput: 0,
        fee: new BigNumber(0)
    });
    const [txError, setTxError] = useState<string>("");

    //TODO: Gestionar el mostrar error en Tx

    const walletsBTC = wallets.filter(w => w.tipoMoneda === "BTC" && w.red === redBtcSeleccionada);
    const walletsETH = wallets.filter(w => w.tipoMoneda === "ETH");

    useEffect(() => {
        if (!wallet) {
            setWalletReceived(false);
        } else {
            setWalletReceived(true);
        }
        cargarPreciosCrypto()
    }, [wallet]);

    useEffect(() => {
        const cargarRed = async () => setRedBtcSeleccionada(await getRedBtcSeleccionada());
        cargarRed();
    }, []);

    useEffect(() => {
        if (!password) {
            navigate("/");
            return;
        }

        if (!redBtcSeleccionada) return;

        let cancelado = false;

        const obtenerSaldos = async () => {
            if (!password) return;
            const mnemonic = await getMnemonic(password);

            for (const w of walletsBTC) {
                const result = await verificarFondosDireccionesBtc(mnemonic, w, redBtcSeleccionada);
                if (cancelado) return;

                if (result) {
                    setSaldos(prev => ({ ...prev, [w.nombre]: result ? result.totalBtc : null }));
                    w.ultSaldoGuardado = result.totalBtc.toFixed(6);
            
                    const walletActualizada = await updateWallet(w.nombre, w);

                    if (walletActualizada) {
                        const allWallets = await getAllWallets();
                        setWallets(allWallets);
                    } else {
                        console.error('Error al actualizar la wallet en localStorage.');
                    }
                } else {
                    console.error('Error cargando los saldos de ', w.nombre)
                }
            }

            for (const w of walletsETH) {
                const saldoETH = new BigNumber(0); // Placeholder
                setSaldos(prev => ({ ...prev, [w.nombre]: saldoETH }));
            }
        };

        if (!wallet) obtenerSaldos();

        return () => { cancelado = true };
    }, [password, redBtcSeleccionada]);

    // Efecto para calcular las conversiones cuando se modifique el valor de la variable
    useEffect(() => {
        calcularConversionEur();
    }, [cantidadAenviar, comision]);

    const handleChooseWallet = (chosenWallet: WalletInfo) => {
        const saldo = saldos[chosenWallet.nombre];
        if (saldo && saldo.isGreaterThan(0)) {
            setWallet(chosenWallet);
        }
    };

    const handleCheckAddress = async () => {
        if (wallet?.direccionPublica === receiptAddress) {
            setIsSameAddress(true);
            return;
        }
        if (wallet?.tipoMoneda === "BTC") {
            const valido = esDireccionBtcValida(receiptAddress, redBtcSeleccionada!);
            if (!valido) {
                setIsValidAddress(false);
                return;
            }
            setIsValidAddress(true);
            await cargarPreciosCrypto();
            reconsultarSaldoCuentaSelec(wallet);
            setComision("500");
        } else {
            const valido = esDireccionEthValida(receiptAddress);
            if (!valido) {
                setIsValidAddress(false);
                return;
            }
            setIsValidAddress(true);
            await cargarPreciosCrypto();
            reconsultarSaldoCuentaSelec(wallet!);
            setComision("5000000"); // TODO: Verificar esto
        }
    };

    const reconsultarSaldoCuentaSelec = async (wallet: WalletInfo) => {
        if (!password) return;
        const mnemonic = await getMnemonic(password);

        if (wallet.tipoMoneda === 'BTC') {
            try {
                const result = await verificarFondosDireccionesBtc(mnemonic, wallet, redBtcSeleccionada!);
                if (result) {
                    setSaldos(prev => ({ ...prev, [wallet.nombre]: result ? result.totalBtc : null }));
                    setFondosBTC(result.direccionesConFondos);
                    setSaldoWalletComprobado(true);
                    return;
                }
                setSaldoWalletComprobado(false);
            } catch (err) {
                console.error('Error comprobando saldos: ', err);
                return;
            }
        } else {

        }
    }

    const cargarPreciosCrypto = async () => {
        const datos = await listarPrecios();
        if (!datos) return;

        const criptoFiltrada = Object.values(datos.data).find(
        (crypto) => crypto.symbol === wallet?.tipoMoneda
        );

        if (!criptoFiltrada) return;

        setPrecioActCrypto(criptoFiltrada.quote.EUR.price);
    }

    const calcularConversionEur = () => {
        if (cantidadAenviar === "" || isNaN(Number(cantidadAenviar))) {
            setCantidadAenviarEur(0);
        } else {
            const conversionEur = Number(cantidadAenviar) * precioActCrypto;
            setCantidadAenviarEur(conversionEur);
        }

        if (comision === "" || isNaN(Number(comision))) {
            setCantidadComisionEur(0);
        } else {
            const fee = Number(comision);
            const feeEur = wallet?.tipoMoneda === 'BTC'
                ? (fee / 100_000_000) * precioActCrypto
                : (fee / 1_000_000_000) * precioActCrypto;
            setCantidadComisionEur(feeEur);
        }
    }

    const comprobarSaldoAEnviar = () => {
        if (wallet?.tipoMoneda === 'BTC') {
            let comisionEnBTC = new BigNumber(Number(comision) / 100_000_000);
            let cantidadAEnviarBN = new BigNumber(Number(cantidadAenviar));
            let saldoActual = saldos[wallet.nombre];
            
            if (!saldoActual) return;

            // ¿Saldo sin fee suficiente?
            if (saldoActual.minus(cantidadAEnviarBN).isLessThanOrEqualTo(0)) {
                setSaldoInsuficiente(true);
                return;
            }

            let totalAEnviar: BigNumber = comisionEnBTC.plus(cantidadAEnviarBN);

            let restoSaldo = saldoActual.minus(totalAEnviar);

            // Menor o igual
            // ¿Saldo con fee suficiente?
            if (restoSaldo.isLessThanOrEqualTo(0)) {
                setSaldoConFeeInsuficiente(true);
                return;
            }

            setSaldoConFeeInsuficiente(false);
            setSaldoInsuficiente(false);
            realizarTransaccion();
        }
    }

    const realizarTransaccion = async () => {
        if (wallet?.tipoMoneda === 'BTC') {
            try {
                const txBtc = await enviarBtc(
                    fondosBTC!, receiptAddress, Number(cantidadAenviar), redBtcSeleccionada!, BigNumber(Number(comision)));
                if (txBtc) {
                    setTxInfo(txBtc);
                    console.log(`Éxito, Input: ${txBtc.totalInput}\nOutput: ${txBtc.totalOutput}\nFee: ${txBtc.fee}\nTxid: ${txBtc.txid}\nRawTx: ${txBtc.rawTx}`)
                    setIsTransactionSuccessful(true);
                } else {
                    console.error('Fallo al enviar BTC.')
                    setIsTransactionSuccessful(false);
                }
            } catch (err) {
                const mensaje = err instanceof Error ? err.message : String(err);
                console.error('Error al realizar la transacción: ', mensaje);
                setTxError(mensaje);
                setIsTransactionSuccessful(false);
            }
        }
    }

    const resetVariables = () => {
        setWallet(undefined);
        setWalletReceived(false);
        setIsValidAddress(null);
        setIsSameAddress(false);
        setSaldoWalletComprobado(null);
        setReceiptAddress("");
        setCantidadAenviar("");
        setCantidadAenviarEur(0);
        setComision("");
        setCantidadComisionEur(0);
        setPrecioActCrypto(0);
        setSaldoInsuficiente(null);
        setSaldoConFeeInsuficiente(null);
        setIsTransactionSuccessful(null);
    }

    // Función para mostrar el cuadro de la wallet
    const renderWalletItem = (w: WalletInfo, icon: string) => {
        const saldo = saldos[w.nombre];
        const isLoading = saldo == null;
        const isEnabled = saldo?.isGreaterThan(0);
        const saldoDisplay = isLoading
            ? <><Spinner small size={16} /> <span>{w.ultSaldoGuardado} {w.tipoMoneda}</span></>
            : `${saldo.toFixed(6)} ${w.tipoMoneda}`;

        const baseStyle = "flex items-center justify-between px-5 py-3 rounded-xl transition";
        const bgStyle = isEnabled ? "bg-neutral-700 hover:bg-neutral-600 cursor-pointer" : "bg-neutral-900 opacity-60 cursor-not-allowed";
        const textStyle = isEnabled ? "text-white" : "text-gray-500";

        return (
            <li key={w.nombre}>
                <div
                    className={`${baseStyle} ${bgStyle} ${textStyle}`}
                    onClick={() => isEnabled && handleChooseWallet(w)}
                >
                    <div className="flex items-center gap-3.5">
                        <img src={icon} alt={w.nombre} draggable="false" className="w-6.5 h-6.5" />
                        <span className="font-medium text-lg">{w.nombre}</span>
                    {w.tipoDireccion === "native" && (
                        <span className="text-green-500 text-xs border border-green-500 px-2 py-0.5 rounded-full font-medium">
                        Native SegWit
                        </span>
                    )}
                    {w.tipoDireccion === "segwit" && (
                        <span className="text-yellow-400 text-xs border border-yellow-400 px-2 py-0.5 rounded-full font-medium">
                        SegWit
                        </span>
                    )}
                    {w.tipoDireccion === "legacy" && (
                        <span className="text-red-400 text-xs border border-red-400 px-2 py-0.5 rounded-full font-medium">
                        Legacy
                        </span>
                    )}
                    {w.red === "testnet" && (
                        <span className="text-yellow-500 text-xs border border-yellow-500 px-2 py-0.5 rounded-full font-medium">
                        testnet
                        </span>
                    )}
                    </div>
                    <span className="text-sm flex items-center gap-1">{saldoDisplay}</span>
                </div>
            </li>
        );
    };

   return (
    <div className="flex flex-col items-center justify-start min-h-[400px] p-6">
        <h1 className="text-2xl font-bold mb-5">Enviar</h1>
        {!(saldoConFeeInsuficiente === false && saldoInsuficiente === false) ? (
            <>
                {!walletReceived ? (
                    <div className="bg-neutral-800 rounded-xl p-4 w-full max-w-[950px] min-w-[300px] max-h-[430px] overflow-y-auto shadow-lg">
                        <p className="text-sm text-gray-300 mb-2 text-center">Seleccione una cuenta con saldo para enviar fondos:</p>

                        {(walletsBTC.length + walletsETH.length === 0) ? (
                            <h1 className="text-white bg-neutral-700 mb-2 rounded-xl px-6 py-4 flex text-center align-center justify-center text-xl">
                                No se han encontrado cuentas. Cree una para enviar fondos.
                            </h1>
                        ) : (
                            <>
                                {walletsBTC.length > 0 && (
                                    <>
                                        <h3 className="text-left text-gray-200 text-sm font-bold mt-2 mb-1">Bitcoin (BTC)</h3>
                                        <ul className="space-y-2 mb-2">
                                            {walletsBTC.map(w => renderWalletItem(w, btcIcon))}
                                        </ul>
                                    </>
                                )}
                                {walletsETH.length > 0 && (
                                    <>
                                        <h3 className="text-left text-gray-200 text-sm font-bold mt-2 mb-1">Ethereum (ETH)</h3>
                                        <ul className="space-y-2">
                                            {walletsETH.map(w => renderWalletItem(w, ethIcon))}
                                        </ul>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="text-white text-center mb-4 w-full">
                        {/* Contenedor de la flecha y título - ahora ocupa todo el ancho */}
                        <div className="flex items-center w-full relative">
                            {/* Flecha izquierda - posicionada absolutamente a la izquierda */}
                            <div className="absolute -top-15 -left-5">
                                <ArrowLeft
                                    onClick={() => resetVariables()}
                                    className="w-7 h-7 text-gray-400 hover:text-green-500 transition duration-200 cursor-pointer ml-4"
                                />
                            </div>

                            {/* Título centrado - ocupa todo el espacio disponible */}
                            <div className="flex-1 text-center">
                                <h2 className="text-xl font-bold">Cuenta seleccionada:</h2>
                            </div>
                        </div>

                        {/* Resto del contenido (logo, nombre, etiquetas) */}
                        <div className="bg-neutral-700 shadow max-w-2xl mx-auto rounded-xl p-3 mt-4 mb-4">
                            <div className="flex items-center justify-center mb-3 space-x-4">
                                <img
                                    src={wallet?.tipoMoneda === 'BTC' ? btcIcon : ethIcon}
                                    alt={`${wallet?.tipoMoneda} logo`}
                                    draggable="false"
                                    className="w-10 h-10 select-none"
                                />
                                <h2 className="text-2xl font-bold">{wallet?.nombre}</h2>

                                {wallet?.tipoDireccion === "native" && (
                                    <span className="text-green-500 text-xs border border-green-500 px-2 py-0.5 rounded-full font-medium">
                                        Native SegWit
                                    </span>
                                )}
                                {wallet?.tipoDireccion === "segwit" && (
                                    <span className="text-yellow-400 text-xs border border-yellow-400 px-2 py-0.5 rounded-full font-medium">
                                        SegWit
                                    </span>
                                )}
                                {wallet?.tipoDireccion === "legacy" && (
                                    <span className="text-red-400 text-xs border border-red-400 px-2 py-0.5 rounded-full font-medium">
                                        Legacy
                                    </span>
                                )}
                                {wallet?.red === "testnet" && (
                                    <span className="text-yellow-500 text-xs border border-yellow-500 px-2 py-0.5 rounded-full font-medium">
                                        testnet
                                    </span>
                                )}
                            </div>
                            <p className="text-md font-medium text-gray-300">
                                Saldo: {saldos[wallet!.nombre] ? saldos[wallet!.nombre]?.toFixed(7) : wallet?.ultSaldoGuardado} {wallet?.tipoMoneda} {' '}
                                ≈ {saldos[wallet!.nombre] ? (saldos[wallet!.nombre]?.multipliedBy(precioActCrypto).toFixed(2)) : wallet?.ultSaldoGuardadoEur.toFixed(2)} €
                            </p>
                        </div>

                        {(!isValidAddress && saldoConFeeInsuficiente !== false && saldoInsuficiente !== false) ? (
                            <>
                                <h2 className="text-xl font-bold text-white text-center">
                                    Introduzca la dirección de recepción
                                </h2>

                                {/* Input centrado */}
                                <div className="flex justify-center mt-5 w-full">
                                    <input
                                        type="text"
                                        value={receiptAddress || ""}
                                        onChange={(e) => {
                                            setReceiptAddress(e.target.value);
                                            setIsValidAddress(null);
                                            setIsSameAddress(false);
                                        }}
                                        className={`w-full max-w-[425px] bg-neutral-800 hover:bg-neutral-900
                                         text-white font-semibold py-1 px-6 rounded-xl shadow-md
                                         transition duration-300 ${
                                            isValidAddress === false || isSameAddress ? "border-red-500 border-2" : "border-gray-500 border"
                                        }`}
                                    />
                                </div>

                                {/* Botón Siguiente */}
                                <div className="mt-7.5 flex flex-col items-center text-center">
                                    <button
                                        onClick={handleCheckAddress}
                                        disabled={receiptAddress.length === 0}
                                        className={`px-4 py-2 rounded-xl shadow-md border flex items-center gap-2 transition duration-300
                                            ${
                                                receiptAddress.length === 0
                                                    ? "bg-neutral-600 text-gray-300 cursor-not-allowed border-gray-400"
                                                    : "border-gray-500 bg-neutral-800 cursor-pointer text-white hover:bg-neutral-900"
                                            }`}
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                        Siguiente
                                    </button>
                                </div>
                                {isValidAddress === false && (
                                    <h2 className="text-center mt-4 text-lg font-semibold text-red-500 select-none">
                                        La dirección introducida no es válida
                                    </h2>
                                )}
                                {isSameAddress && (
                                    <h2 className="text-center mt-4 text-lg font-semibold text-red-500 select-none">
                                        No puedes enviar fondos a tu propia dirección de envío
                                    </h2>
                                )}
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-bold text-white text-center mb-4">
                                    Introduzca la cantidad de {wallet?.tipoMoneda} a enviar
                                </h2>

                                {/* Input de cantidad y visualización en euros */}
                                <div className="flex items-center gap-4 justify-center mb-2">
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder={`Cantidad en ${wallet?.tipoMoneda}`}
                                        value={cantidadAenviar}
                                        onChange={(e) => {
                                            setCantidadAenviar(e.target.value);
                                            setSaldoInsuficiente(null);
                                            setSaldoConFeeInsuficiente(null);
                                        }}
                                        className={`w-full max-w-[205px] bg-neutral-800 hover:bg-neutral-900
                                         text-white font-semibold py-1 px-3 rounded-xl shadow-md
                                         transition duration-300 ${saldoInsuficiente || saldoConFeeInsuficiente
                                            ? "border-red-500 border-2" : "border-gray-500 border"}`}
                                    />
                                    <span className="text-white font-semibold text-md min-w-[40px] text-right">
                                        ≈ {cantidadAenviarEur.toFixed(2)} €
                                    </span>
                                </div>

                                {/* Desplegable para comisión de red */}
                                <div className="text-center relative">
                                    <button
                                        onClick={() => setMostrarComision(prev => !prev)}
                                        className="text-gray-300 hover:text-white cursor-pointer text-sm flex items-center justify-center mx-auto"
                                    >
                                        <span className="mr-1">Comisión de red</span>
                                        <svg
                                            className={`w-4 h-4 transition-transform duration-200 ${mostrarComision ? "rotate-180" : ""}`}
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {mostrarComision && (
                                        <div className="mt-2">
                                            <input
                                                type="number"
                                                step="any"
                                                placeholder="Comisión"
                                                value={comision}
                                                onChange={(e) => {
                                                    setComision(e.target.value);
                                                    setSaldoInsuficiente(null);
                                                    setSaldoConFeeInsuficiente(null);
                                                }}
                                                className={`w-full max-w-[140px] bg-neutral-800 hover:bg-neutral-900
                                                 text-white font-semibold py-1 px-3 rounded-xl shadow-md
                                                 transition duration-300 border-gray-500 border mx-auto`}
                                            />
                                            <span className="text-white text-sm min-w-[80px] text-right">
                                                ≈ {cantidadComisionEur.toFixed(2)} €
                                            </span>
                                            <p className="text-sm text-gray-400 mt-1">
                                                Comisión en {wallet?.tipoMoneda === 'BTC' ? 'sats' : 'gwei'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {/* Botón Enviar */}
                                <div className="mt-7.5 flex flex-col items-center text-center">
                                    <button
                                        onClick={comprobarSaldoAEnviar}
                                        disabled={!saldoWalletComprobado || comision.length === 0 || cantidadAenviar.length === 0}
                                        className={`px-4 py-2 rounded-xl shadow-md border flex items-center gap-2 transition duration-300
                                            ${
                                                !saldoWalletComprobado || comision.length === 0 || cantidadAenviar.length === 0
                                                    ? "bg-neutral-600 text-gray-300 cursor-not-allowed border-gray-400"
                                                    : "border-gray-500 bg-neutral-800 cursor-pointer text-white hover:bg-neutral-900"
                                            }`}
                                    >
                                        <ArrowUp className="w-5 h-5" />
                                        Enviar
                                    </button>
                                </div>
                                {!saldoWalletComprobado && (
                                    <div className="text-lg mt-4 text-white flex items-center gap-4 justify-center font-semibold mb-4">
                                        <Spinner small size={16} />
                                        Recomprobando saldos...
                                    </div>
                                )}
                                {saldoInsuficiente && (
                                    <h2 className="text-center mt-4 text-lg font-semibold text-red-500 select-none">
                                        Saldo insuficiente
                                    </h2>
                                )}
                                {saldoConFeeInsuficiente && (
                                    <h2 className="text-center mt-4 text-lg font-semibold text-red-500 select-none">
                                        Saldo insuficiente, debe tener saldo disponible para pagar la comisión de red
                                    </h2>
                                )}
                            </>
                        )}
                    </div>
                )}
            </>
        ) : (
            // Este bloque se muestra si saldoConFeeInsuficiente y saldoInsuficiente son false (es decir, no hay problemas de saldo)
            <>
                {isTransactionSuccessful === null &&
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Spinner small size={100}/>
                    </div>
                }

                {isTransactionSuccessful &&
                <div className="flex flex-col items-center text-center mt-10 space-y-6">
                    <div className="flex items-center text-green-500 font-bold text-2xl gap-3">
                        <CircleCheckBig className="h-10 w-10" />
                        <h1 className="text-3xl">¡Transferencia realizada con éxito!</h1>
                    </div>
                    <div className="flex flex-col items-center text-white text-base space-y-4">
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-semibold">ID de la transacción:</span>
                            {wallet?.tipoMoneda === 'BTC' ? 
                                <a
                                    href={`https://mempool.space/${redBtcSeleccionada === 'mainnet' ? '' : 'testnet/'}tx/${txInfo.txid}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 underline hover:text-blue-300 transition"
                                >
                                    {txInfo.txid}
                                </a>

                            :
                            
                                // Poner aquí lo necesario para ETH
                                <a
                                    href={`https://mempool.space/${redBtcSeleccionada === 'mainnet' ? '' : 'testnet/'}tx/${txInfo.txid}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 underline hover:text-blue-300 transition"
                                >
                                    {txInfo.txid}
                                </a>
                            }
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-semibold">Enviada desde cuenta:</span>
                            <span className="text-base">{wallet?.nombre}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-semibold">Dirección de destino:</span>
                            <span className="text-base">{receiptAddress}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-semibold">Cantidad enviada:</span>
                            <span className="text-base">{txInfo.totalInput.toFixed(6)} {wallet?.tipoMoneda}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-semibold">Tarifa de red:</span>
                            <span className="text-base">{txInfo.fee.toFixed(6)} {wallet?.tipoMoneda}</span>
                        </div>
                        {/* Botón Home */}
                        <div className="mt-5 flex flex-col items-center text-center">
                            <button
                                onClick={() => navigate("/inicio")}
                                className="px-4 py-2 rounded-xl shadow-md border flex items-center gap-2 transition duration-300 border-gray-500 bg-neutral-800 cursor-pointer text-white hover:bg-neutral-900"
                            >
                                <House className="w-5 h-5" />
                                Volver a Inicio
                            </button>
                        </div>
                    </div>
                </div>
                }

                {isTransactionSuccessful === false &&
                <div className="flex flex-col items-center text-center mt-10 space-y-6">
                    <div className="flex items-center text-red-500 font-bold text-2xl gap-3">
                        <CircleX className="h-10 w-10" />
                        <h1 className="text-3xl">No se ha podido realizar la transferencia.</h1>
                    </div>
                    <div className="text-white text-lg">
                        <h1>{txError}</h1>
                    </div>
                    <div className="text-white text-lg">
                        <h1>Por favor, vuelva a intentarlo.</h1>
                    </div>
                    {/* Botón Home */}
                    <div className="mt-5 flex flex-col items-center text-center">
                        <button
                            onClick={() => navigate("/inicio")}
                            className="px-4 py-2 rounded-xl shadow-md border flex items-center gap-2 transition duration-300 border-gray-500 bg-neutral-800 cursor-pointer text-white hover:bg-neutral-900"
                        >
                            <House className="w-5 h-5" />
                            Volver a Inicio
                        </button>
                    </div>
                </div>
                }
            </>
        )}
    </div>
    );
}

export default EnviarCrypto;
