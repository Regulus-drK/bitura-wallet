import { useLocation, useNavigate } from "react-router-dom";
import { useWallets } from "../../context/WalletContext";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import type { WalletInfo } from "../../types/WalletInfo";
import BigNumber from "bignumber.js";
import { getMnemonic, getRedBtcSeleccionada } from "../../services/apiService";
import { verificarFondosDireccionesBtc } from "../../services/walletService";
import btcIcon from "../../assets/crypto/bitcoin.png";
import ethIcon from "../../assets/crypto/ether.png";
import Spinner from "../components/Spinner";

function EnviarCrypto() {
    const location = useLocation();
    const navigate = useNavigate();
    const { wallets } = useWallets();
    const { password } = useAuth();
    const [wallet, setWallet] = useState<WalletInfo | undefined>(location.state?.wallet);
    const [walletReceived, setWalletReceived] = useState<boolean>(false);
    const [saldos, setSaldos] = useState<Record<string, BigNumber | null>>({});
    const [redBtcSeleccionada, setRedBtcSeleccionada] = useState<'mainnet' | 'testnet'>('mainnet');

    const walletsBTC = wallets.filter(w => w.tipoMoneda === "BTC" && w.red === redBtcSeleccionada);
    const walletsETH = wallets.filter(w => w.tipoMoneda === "ETH");

    useEffect(() => {
        if (!wallet) {
            setWalletReceived(false);
        } else {
            setWalletReceived(true);
        }
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
        let cancelado = false;

        const obtenerSaldos = async () => {
            if (!password) return;
            const mnemonic = await getMnemonic(password);

            for (const w of walletsBTC) {
                const result = await verificarFondosDireccionesBtc(mnemonic, w, redBtcSeleccionada);
                if (cancelado) return;
                setSaldos(prev => ({ ...prev, [w.nombre]: result ? result.totalBtc : null }));
            }

            for (const w of walletsETH) {
                const saldoETH = new BigNumber(0); // Placeholder
                setSaldos(prev => ({ ...prev, [w.nombre]: saldoETH }));
            }
        };

        if (!walletReceived) obtenerSaldos();

        return () => { cancelado = true };
    }, [wallets, password, redBtcSeleccionada]);

    const handleChooseWallet = (chosenWallet: WalletInfo) => {
        const saldo = saldos[chosenWallet.nombre];
        if (saldo && saldo.isGreaterThan(0)) {
            setWallet(chosenWallet);
        }
    };

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
                <div className="text-white text-center">
                    <h2 className="text-2xl font-bold mb-2">Wallet seleccionada:</h2>
                    <p className="text-lg">{wallet?.nombre}</p>
                    <p className="text-sm text-gray-400">{wallet?.tipoMoneda} - {wallet?.red}</p>
                    <p className="mt-2 text-md font-medium">
                        Saldo: {saldos[wallet!.nombre]?.toFixed(6)} {wallet?.tipoMoneda}
                    </p>
                </div>
            )}
        </div>
    );
}

export default EnviarCrypto;
