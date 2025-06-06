import type { WalletInfo } from "../../types/BituraStore";
import { useWallets } from "../../context/WalletContext";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import btcIcon from "../../assets/crypto/bitcoin.png";
import ethIcon from "../../assets/crypto/ether.png";
import BigNumber from "bignumber.js";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { consultarDireccion, getAllWallets, getMnemonic, getRedSeleccionada, updateWallet } from "../../services/apiService";
import { verificarFondosDireccionesBtc } from "../../services/walletService";
import Spinner from "../components/Spinner";
import { parseEthResponse, type EthResponse } from "../../types/EthBalance";
import { useToast } from "../components/Toast";
import { AlertTriangle } from "lucide-react";

function Cuentas() {
    const { password } = useAuth();
    const { wallets, setWallets } = useWallets();
    const { showToast } = useToast();
    const [saldos, setSaldos] = useState<Record<string, BigNumber>>({});
    const navigate = useNavigate();
    const [redSeleccionada, setRedSeleccionada] = useState<'mainnet' | 'testnet' | null>(null);
    const [cuentasOffline, setCuentasOffline] = useState<string[]>([]);

    // Efectos React
    useEffect(() => {
        const detectarRedSeleccionada = async () => {
            setRedSeleccionada(await getRedSeleccionada());
        }
        detectarRedSeleccionada();
    }, []);

    // Efecto encargado de cargar los fondos para mostrarlos en la
    // vista previa de cada una de las cuentas al iniciar el componente
    useEffect(() => {
        if (!password) {
            navigate("/");
            return;
        }
        if (!redSeleccionada) return;

        let isCancelled = false;

        const obtenerSaldoBtc = async () => {
            const mnemonic = await getMnemonic(password);

            for (const wallet of wallets.filter(w => w.tipoMoneda === "BTC" && w.red === redSeleccionada)) {
                const fondosBtc = await verificarFondosDireccionesBtc(mnemonic, wallet, redSeleccionada);

                if (isCancelled) return;

                // Si hay error o no hay conexión, NO actualizar datos locales, solo mostrar alerta y modo offline
                if (!fondosBtc || fondosBtc.error) {
                    setCuentasOffline(prev => [...prev, wallet.nombre]);
                    showToast(`No se ha podido recuperar los saldos de ${wallet.nombre}. Se mostrarán datos guardados.`, "error");
                    continue;
                }

                setSaldos(prev => ({ ...prev, [wallet.nombre]: fondosBtc.totalBtc }));
                wallet.ultSaldoGuardado = fondosBtc.totalBtc.toFixed(7);

                const walletActualizada = await updateWallet(wallet.nombre, wallet, redSeleccionada);

                if (walletActualizada) {
                    const allWallets = await getAllWallets();
                    setWallets(allWallets);
                } else {
                    console.error('Error al actualizar la wallet en localStorage.');
                }
            }
        }
        
        const obtenerSaldoEth = async () => {
            for (const wallet of wallets.filter(w => w.tipoMoneda === "ETH")) {
                let testnet = redSeleccionada === 'testnet' ? true : false;
                const result = await consultarDireccion(wallet.direccionPublica, '1', testnet);

                if (isCancelled) return;

                if (!result) {
                    setCuentasOffline(prev => [...prev, wallet.nombre]);
                    showToast(`No se ha podido recuperar los saldos de ${wallet.nombre}. Se mostrarán datos guardados.`, "error");
                    continue;
                }

                const fondosEth = parseEthResponse(result as EthResponse);

                setSaldos(prev => ({ ...prev, [wallet.nombre]: fondosEth.balanceEth }));
                wallet.ultSaldoGuardado = fondosEth.balanceEth.toFixed(7);

                const walletActualizada = await updateWallet(wallet.nombre, wallet);

                if (walletActualizada) {
                    const allWallets = await getAllWallets();
                    setWallets(allWallets);
                } else {
                    console.error('Error al actualizar la wallet en localStorage.');
                }
            }
        }
        // Llamada a las funciones para obtener los saldos
        obtenerSaldoBtc();
        obtenerSaldoEth();

        return () => {
            isCancelled = true;
        };
    }, [password, redSeleccionada]);

    // Función handler para dirigirnos a los datos de una cuenta de la wallet clickada
    const handleClickWallet = (wallet: WalletInfo) => {
        navigate('/inicio/cuentas/datos-cuenta', { state: { wallet } });
    };

    // Wallets filtradas para mejor uso
    const walletsBTC = wallets.filter(wallet => wallet.tipoMoneda === 'BTC' && wallet.red === redSeleccionada);
    const walletsETH = wallets.filter(wallet => wallet.tipoMoneda === 'ETH');

    return (
        <div className="flex flex-col items-center h-full p-4 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-5">Cuentas</h1>
        {/* Aviso de modo offline debajo del header */}
        {(cuentasOffline.length > 0) && (
            <div className="flex items-center justify-center mb-4 p-3 bg-yellow-900/80 border border-yellow-600 rounded-lg text-yellow-300 font-semibold gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span>
                    Mostrando datos guardados. No se ha podido conectar para obtener datos en tiempo real
                    {cuentasOffline.length === walletsBTC.length + walletsETH.length
                        ? " de ninguna cuenta."
                        : cuentasOffline.length === 1
                            ? " de una cuenta."
                            : ` de ${cuentasOffline.length} cuentas.`}
                </span>
            </div>
        )}
        {walletsBTC.length === 0 && walletsETH.length === 0 ? (
            <h1 className="text-white bg-neutral-700 mb-2 rounded-xl px-6 py-4 flex text-xl">
            Todavía no hay cuentas creadas. Añada una para empezar.
            </h1>
        ) : (
            <>
            {walletsBTC.length > 0 && (
            <div className="w-full max-w-6xl mb-6 select-none">
                <h2 className="text-xl font-semibold mb-2 text-left">Bitcoin (BTC)</h2>
                <ul className="space-y-3">
                    {walletsBTC.map(wallet => (
                    <li key={wallet.nombre}>
                        <div
                        className="flex items-center justify-between bg-neutral-700 text-white px-5 py-3 rounded-xl cursor-pointer hover:bg-neutral-600 transition"
                        onClick={() => handleClickWallet(wallet)}
                        >
                        <div className="flex items-center gap-3.5">
                            <img src={btcIcon} alt={wallet.nombre} draggable="false" className="w-6.5 h-6.5" />
                            <span className="font-medium text-lg">{wallet.nombre}</span>
                            {wallet.tipoDireccion === "native" && 
                            <span className="text-green-500 text-xs border border-green-500 px-2 py-0.5 rounded-full font-medium">
                                Native SegWit
                            </span>
                            }
                            {wallet.tipoDireccion === "segwit" && 
                            <span className="text-yellow-400 text-xs border border-yellow-400 px-2 py-0.5 rounded-full font-medium">
                                SegWit
                            </span>
                            }
                            {wallet.tipoDireccion === "legacy" && 
                            <span className="text-red-400 text-xs border border-red-400 px-2 py-0.5 rounded-full font-medium">
                                Legacy
                            </span>
                            }
                            {wallet.red === "testnet" && 
                            <span className="text-yellow-500 text-xs border border-yellow-500 px-2 py-0.5 rounded-full font-medium">
                                testnet
                            </span>
                            }
                        </div>
                            <span className="text-sm text-gray-300 flex items-center gap-1">
                            {saldos[wallet.nombre] == null && !cuentasOffline.includes(wallet.nombre)
                                ? (
                                <>
                                    <Spinner small size={16}/>
                                    <span>{wallet.ultSaldoGuardado} BTC</span>
                                </>
                                )
                                : cuentasOffline.includes(wallet.nombre) ? (
                                    <>
                                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                        <span>{wallet.ultSaldoGuardado} BTC</span>
                                    </>
                                )
                                : <span>{saldos[wallet.nombre].toFixed(7)} BTC</span>
                            }
                            </span>
                        </div>
                    </li>
                    ))}
                </ul>
            </div>
            )}

            {walletsETH.length > 0 && (
                <div className="w-full max-w-6xl mb-6 select-none">
                <h2 className="text-xl font-semibold mb-2 text-left">Ethereum (ETH)</h2>
                <ul className="space-y-3">
                    {walletsETH.map(wallet => (
                    <li key={wallet.nombre}>
                        <div
                        className="flex items-center justify-between bg-neutral-700 text-white px-5 py-3 rounded-xl cursor-pointer hover:bg-neutral-600 transition"
                        onClick={() => handleClickWallet(wallet)}
                        >
                        <div className="flex items-center gap-3.5">
                            <img src={ethIcon} alt={wallet.nombre} draggable="false" className="w-6.5 h-6.5" />
                            <span className="font-medium text-lg">{wallet.nombre}</span>
                            {redSeleccionada === "testnet" && 
                            <span className="text-yellow-500 text-xs border border-yellow-500 px-2 py-0.5 rounded-full font-medium">
                                testnet Sepolia
                            </span>
                            }
                        </div>
                        <span className="text-sm text-gray-300 flex items-center gap-1">
                        {saldos[wallet.nombre] == null && !cuentasOffline.includes(wallet.nombre)
                            ? (
                            <>
                                <Spinner small size={16}/>
                                <span>{wallet.ultSaldoGuardado} ETH</span>
                            </>
                            )
                            : cuentasOffline.includes(wallet.nombre) ? (
                                <>
                                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                    <span>{wallet.ultSaldoGuardado} ETH</span>
                                </>
                            )
                            : <span>{saldos[wallet.nombre].toFixed(7)} ETH</span>
                        }
                        </span>
                        </div>
                    </li>
                    ))}
                </ul>
                </div>
            )}
            </>
        )}

        <button
            type="button"
            className="flex items-center gap-3 border-2 mt-5 border-gray-500 border-dotted 
            rounded-xl px-6 py-4 hover:bg-neutral-700 transition-colors cursor-pointer
            w-5/6 text-center justify-center"
            onClick={() => navigate('agregar')}
        >
            <Plus className="w-6 h-6" />
            <span className="text-lg font-semibold select-none">Agregar una nueva cuenta</span>
        </button>
        </div>
    );
}

export default Cuentas;