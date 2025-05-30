import { useLocation, useNavigate } from "react-router-dom";
import type { WalletInfo } from "../../types/BituraStore";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import { useWallets } from "../../context/WalletContext";
import { getMnemonic, getRedSeleccionada } from "../../services/apiService";
import btcIcon from "../../assets/crypto/bitcoin.png";
import ethIcon from "../../assets/crypto/ether.png";
import QRCode from 'qrcode';
import { useAuth } from "../../context/AuthContext";
import { crearDireccionPublicaBtc } from "../../services/walletService";
import { ArrowLeft, Copy } from "lucide-react";

function RecibirCrypto() {
    const location = useLocation();
    const navigate = useNavigate();
    const { password } = useAuth();
    const [wallet, setWallet] = useState<WalletInfo | undefined>(location.state?.wallet);
    const { wallets } = useWallets();
    const [walletReceived, setWalletReceived] = useState<boolean>(false);
    const [redSeleccionada, setRedSeleccionada] = useState<'mainnet' | 'testnet' | null>(null);
    const [direccionPublica, setDireccionPublica] = useState<string>("");
    const [qrBase64, setQrBase64] = useState<string>('');
    const [copiado, setCopiado] = useState(false);

    const walletsBTC = wallets.filter(w => w.tipoMoneda === "BTC" && w.red === redSeleccionada);
    const walletsETH = wallets.filter(w => w.tipoMoneda === "ETH");

    useEffect(() => {
        if (!password) {
            navigate("/");
            return;
        }

        if (!wallet) {
            setWalletReceived(false);
        } else {
            setWalletReceived(true);
            if (!redSeleccionada) return;
            handlePublicAddress();
        }
    }, [wallet, redSeleccionada]);

    useEffect(() => {
        const cargarRed = async () => setRedSeleccionada(await getRedSeleccionada());
        cargarRed();
    }, []);

    const handleChooseWallet = (chosenWallet: WalletInfo) => {
        setWallet(chosenWallet);
    };

    const handlePublicAddress = async () => {
        setDireccionPublica(wallet!.direccionPublica);
        generarQR(wallet!.direccionPublica).then(setQrBase64);
        if (wallet?.tipoMoneda === 'BTC') {
            if (!password) return;
            try {
                const mnemonic = await getMnemonic(password);
                await crearDireccionPublicaBtc(mnemonic, wallet);
            } catch (err) {
                console.error('Error al actualizar la dirección pública: ', err);
            }
        }
    }

    async function generarQR(direccion: string): Promise<string> {
        try {
            const qrBase64 = await QRCode.toDataURL(direccion, {
                errorCorrectionLevel: 'H',
                margin: 2,
                scale: 6,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                },
            });
            return qrBase64;
        } catch (error) {
            console.error('Error generando el QR:', error);
            return '';
        }
    }

    const copiarDireccion = () => {
        navigator.clipboard.writeText(wallet?.direccionPublica!);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1500);
    };

    const resetVariables = () => {
        setWallet(undefined);
        setWalletReceived(false);
        setQrBase64('');
        setDireccionPublica('');
    }
    
    // Función para mostrar el cuadro de la wallet
    const renderWalletItem = (w: WalletInfo, icon: string) => {
        const baseStyle = "flex items-center justify-between px-5 py-3 rounded-xl transition";
        const bgStyle = "bg-neutral-700 hover:bg-neutral-600 cursor-pointer border border-neutral-600";
        const textStyle = "text-white";

        return (
            <li key={w.nombre}>
                <div
                    className={`${baseStyle} ${bgStyle} ${textStyle}`}
                    onClick={() => handleChooseWallet(w)}
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
                    {/* Para ETH */}
                    {w.tipoMoneda === "ETH" && redSeleccionada === 'testnet' && (
                        <span className="text-yellow-500 text-xs border border-yellow-500 px-2 py-0.5 rounded-full font-medium">
                        testnet Sepolia
                        </span>
                    )}
                    </div>
                </div>
            </li>
        );
    };

    return(
        <div className="flex flex-col items-center justify-start min-h-[400px] p-6">
            <h1 className="text-2xl font-bold mb-5">Recibir</h1>
            {!walletReceived ? (
                <>
                    <p className="text-sm text-gray-300 mb-4 text-center">Seleccione una cuenta para recibir fondos:</p>

                    <div className="bg-gradient-to-r from-neutral-900/50 to-neutral-700/30 rounded-xl border-1 border-gray-500 p-4 w-full max-w-[950px] min-w-[300px] max-h-[430px] overflow-y-auto shadow-lg">

                        {(walletsBTC.length + walletsETH.length === 0) ? (
                            <h1 className="text-white bg-neutral-700 mb-2 rounded-xl px-6 py-4 flex text-center align-center justify-center text-xl">
                                No se han encontrado cuentas. Cree una para recibir fondos.
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
                </>
            ) : (
            <div className="flex relative w-full">
                {/* Flecha de volver */}
                <div className="absolute -left-5 -top-15">
                    <ArrowLeft
                    onClick={() => resetVariables()}
                    className="w-7 h-7 text-gray-400 hover:text-green-500 transition duration-200 cursor-pointer"
                    />
                </div>

                
                {/* Tarjeta con datos de la wallet */}
                <div className="bg-neutral-700 max-w-4xl mx-auto text-white rounded-2xl p-6 w-full text-center space-y-4">
                    {/* Título con icono */}
                    <div className="flex items-center justify-center gap-3">
                        <img
                            src={wallet?.tipoMoneda === 'BTC' ? btcIcon : ethIcon}
                            alt={wallet!.nombre}
                            draggable="false"
                            className="w-10 h-10 select-none"
                        />
                        <h2 className="text-3xl font-bold">{wallet!.nombre}</h2>
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
                        {/* Para ETH */}
                        {wallet?.tipoMoneda === "ETH" && redSeleccionada === 'testnet' && (
                            <span className="text-yellow-500 text-xs border border-yellow-500 px-2 py-0.5 rounded-full font-medium">
                            testnet Sepolia
                            </span>
                        )}
                    </div>
                    <div className="flex items-center justify-center mb-5">
                        <div
                            className={`flex items-center border px-3 py-1 rounded-lg bg-neutral-800 transition-colors duration-300 ${
                            copiado ? "border-green-500" : "border-gray-400"
                            }`}
                        >
                            <p className="text-base text-gray-300 break-words">{direccionPublica}</p>
                            <button
                            onClick={copiarDireccion}
                            className="ml-2 text-gray-400 cursor-pointer hover:text-white transition"
                            >
                            <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-center items-center">
                        {qrBase64 === '' ? (
                        <Spinner size={32} />
                        ) : (
                        <img src={qrBase64} alt="QR Wallet" draggable="false" className="w-70 h-70" />
                        )}
                    </div>

                    <p className="text-base text-gray-300">
                        ¡Recuerde! Solo envíe fondos desde la red de {wallet?.tipoMoneda} a esta dirección
                    </p>
                </div>
            </div>
            )}
        </div>          
    )
}

export default RecibirCrypto;