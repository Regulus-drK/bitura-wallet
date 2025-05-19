import type { WalletInfo } from "../../types/WalletInfo";
import { useWallets } from "../../context/WalletContext";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import btcIcon from "../../assets/crypto/bitcoin.png";
import ethIcon from "../../assets/crypto/ether.png";
import BigNumber from "bignumber.js";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { getMnemonic } from "../../services/apiService";
import { verificarFondosDireccionesBtc } from "../../services/walletService";

function Cuentas() {
    const { password } = useAuth();
    const { wallets } = useWallets();
    const [saldos, setSaldos] = useState<Record<string, BigNumber>>({});
    const navigate = useNavigate();

    useEffect(() => {
        const obtenerSaldoBtc = async () => {
            if (!password) return {};

            const mnemonic = await getMnemonic(password);
            
            for (const wallet of wallets.filter(w => w.tipoMoneda === "BTC")) {
                const fondosBtc = await verificarFondosDireccionesBtc(mnemonic, wallet);
                if (fondosBtc) {
                    setSaldos(prev => ({ ...prev, [wallet.nombre]: fondosBtc.totalBtc }));
                } else {
                    console.error("Error al obtener los saldos de BTC");
                }
            }
        }
        obtenerSaldoBtc();
    }, [wallets, password]);

    const handleClickWallet = (wallet: WalletInfo) => {
        navigate('/inicio/cuentas/datos-cuenta', { state: { wallet } });
    };

    const walletsBTC = wallets.filter(wallet => wallet.tipoMoneda === 'BTC');
    const walletsETH = wallets.filter(wallet => wallet.tipoMoneda === 'ETH');

    return (
        <div className="flex flex-col items-center h-full p-4 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-5">Cuentas</h1>

        {wallets.length === 0 ? (
            <h1 className="text-white bg-neutral-700 mb-2 rounded-xl px-6 py-4 flex text-xl">
            Todavía no hay cuentas creadas. Añada una para empezar.
            </h1>
        ) : (
            <>
            {walletsBTC.length > 0 && (
                <div className="w-full mb-6">
                <h2 className="text-xl font-semibold mb-2 text-left">Bitcoin (BTC)</h2>
                <ul className="space-y-3">
                    {walletsBTC.map(wallet => (
                    <li key={wallet.nombre}>
                        <div
                        className="flex items-center justify-between bg-neutral-700 text-white px-5 py-3 rounded-xl cursor-pointer hover:bg-neutral-600 transition"
                        onClick={() => handleClickWallet(wallet)}
                        >
                        <div className="flex items-center gap-4">
                            <img src={btcIcon} alt={wallet.nombre} draggable="false" className="w-6.5 h-6.5" />
                            <span className="font-medium text-lg">{wallet.nombre}</span>
                        </div>
                        <span className="text-sm text-gray-300">
                            Saldo: {saldos[wallet.nombre] ? saldos[wallet.nombre].toFixed(8) + " BTC" : "Cargando..."}
                        </span>
                        </div>
                    </li>
                    ))}
                </ul>
                </div>
            )}

            {walletsETH.length > 0 && (
                <div className="w-full mb-6">
                <h2 className="text-xl font-semibold mb-2 text-left">Ethereum (ETH)</h2>
                <ul className="space-y-3">
                    {walletsETH.map(wallet => (
                    <li key={wallet.nombre}>
                        <div
                        className="flex items-center justify-between bg-neutral-700 text-white px-5 py-3 rounded-xl cursor-pointer hover:bg-neutral-600 transition"
                        onClick={() => handleClickWallet(wallet)}
                        >
                        <div className="flex items-center gap-4">
                            <img src={ethIcon} alt={wallet.nombre} draggable="false" className="w-6.5 h-6.5" />
                            <span className="font-medium text-lg">{wallet.nombre}</span>
                        </div>
                        <span className="text-sm text-gray-300">Saldo: 0.00000000 ETH</span>
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
            <span className="text-lg font-semibold">Agregar una nueva cuenta</span>
        </button>
        </div>
    );
}

export default Cuentas;
