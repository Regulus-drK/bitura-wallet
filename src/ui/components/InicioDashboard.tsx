import { useEffect, useRef, useState } from "react";
import { consultarDireccion, getAllWallets, getMnemonic, getPortfolio, getRedSeleccionada, listarPrecios, updatePortfolio, updateWallet } from "../../services/apiService";
import btcIcon from "../../assets/crypto/bitcoin.png";
import ethIcon from "../../assets/crypto/ether.png";
import type { CryptoAPIResponse, CryptoData } from "../../types/CryptoPrices";
import Spinner from "./Spinner";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Sparkles, ChartLine, PiggyBank, RefreshCw, Landmark } from "lucide-react";
import { useWallets } from "../../context/WalletContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { verificarFondosDireccionesBtc } from "../../services/walletService";
import { parseEthResponse, type EthResponse } from "../../types/EthBalance";
import type { PortfolioData } from "../../types/BituraStore";

function InicioDashboard() {
    const { password } = useAuth();
    const { wallets, setWallets } = useWallets();
    const navigate = useNavigate();
    const [redSeleccionada, setRedSeleccionada] = useState<'mainnet' | 'testnet'>('mainnet');
    const [datosPrecioActCrypto, setDatosPrecioActCrypto] = useState<CryptoAPIResponse | null>(null);
    const [ultSync, setUltSync] = useState<string>("Cargando...");
    const [portfolio, setPortfolio] = useState<PortfolioData>();
    const [btcPercentage, setBtcPercentage] = useState('0');
    const [ethPercentage, setEthPercentage] = useState('0');
    const [isRefreshing, setIsRefreshing] = useState<boolean>(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const obtenerPrecios = async () => {
        setDatosPrecioActCrypto(null);
        const datos = await listarPrecios();
        if (datos) {
            setDatosPrecioActCrypto(datos);
        }
    };

    // Función para actualizar los porcentajes
    const updatePorcentajes = () => {
        if (!portfolio) return;
        if (portfolio.valorTotal > 0) {
            const btcPct = (portfolio.btc.valor / portfolio.valorTotal * 100).toFixed(1);
            const ethPct = (portfolio.eth.valor / portfolio.valorTotal * 100).toFixed(1);
            
            setBtcPercentage(btcPct);
            setEthPercentage(ethPct);
        }
    };

    const sincronizarManual = async () => {
        // Limpiar el intervalo existente
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        
        // Ejecutar sincronización inmediata
        await obtenerPrecios();
        
        // Reiniciar el intervalo
        intervalRef.current = setInterval(obtenerPrecios, 300000);
    };

    useEffect(() => {
        const detectarRedSeleccionada = async () => {
            setRedSeleccionada(await getRedSeleccionada());
        };
        const recuperarPortfolio = async () => {
            setPortfolio(await getPortfolio());
        };

        detectarRedSeleccionada();
        recuperarPortfolio();
        obtenerPrecios();

        // Actualizar precios cada 5 min
        // Configurar el intervalo y guardar la referencia
        intervalRef.current = setInterval(obtenerPrecios, 300000);
        // No es necesario llamar a otras funciones dentro del useEffect de
        // obtenerSaldos ya que tiene de dependencia datosPrecioActCrypto, entonces se ejecutará
        // también cuando el valor de este cambie, haciendo todo en cadena

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Actualizar porcentajes cuando cambie el portfolio
    useEffect(() => {
        if (!portfolio) return;
        updatePorcentajes();
    }, [portfolio]);


    useEffect(() => {
        if (!password) {
            navigate("/");
            return;
        }
        if (!redSeleccionada || !datosPrecioActCrypto) return;

        let isCancelled = false;

        setIsRefreshing(true);

        const obtenerSaldosBtc = async () => {
            const mnemonic = await getMnemonic(password);

            let datosBtc: {cantidad: number, valor: number} = {cantidad: 0, valor: 0};
            for (const wallet of wallets.filter(w => w.tipoMoneda === "BTC" && w.red === redSeleccionada)) {
                const fondosBtc = await verificarFondosDireccionesBtc(mnemonic, wallet, redSeleccionada);

                if (isCancelled) return datosBtc;

                if (fondosBtc) {
                    const precioBtc = datosPrecioActCrypto.data["BTC"].quote.EUR.price;
                    const valorBtc = Number(fondosBtc.totalBtc) * precioBtc;

                    datosBtc.cantidad += Number(fondosBtc.totalBtc);
                    datosBtc.valor += valorBtc;

                    wallet.ultSaldoGuardado = fondosBtc.totalBtc.toFixed(7);
                    wallet.ultSaldoGuardadoEur = valorBtc;

                    const walletActualizada = await updateWallet(wallet.nombre, wallet, redSeleccionada);

                    if (walletActualizada) {
                        const allWallets = await getAllWallets();
                        setWallets(allWallets);
                    } else {
                        console.error('Error al actualizar la wallet en localStorage.');
                    }
                } else {
                    console.error("Error al obtener los saldos de BTC");
                }
            }
            return datosBtc;
        }

        const obtenerSaldosEth = async () => {
            let datosEth: {cantidad: number, valor: number} = {cantidad: 0, valor: 0};
            for (const wallet of wallets.filter(w => w.tipoMoneda === "ETH")) {
                let testnet = redSeleccionada === 'testnet' ? true : false;
                const result = await consultarDireccion(wallet.direccionPublica, '1', testnet);

                if (isCancelled) return datosEth;

                if (result) {
                    const fondosEth = parseEthResponse(result as EthResponse);

                    const precioEth = datosPrecioActCrypto.data["ETH"].quote.EUR.price;
                    const valorEth = Number(fondosEth.balanceEth) * precioEth;

                    datosEth.cantidad += Number(fondosEth.balanceEth) ? Number(fondosEth.balanceEth) : 0;
                    datosEth.valor += valorEth ? valorEth : 0;

                    wallet.ultSaldoGuardado = fondosEth.balanceEth.toFixed(7);
                    wallet.ultSaldoGuardadoEur = valorEth;
                    
                    const walletActualizada = await updateWallet(wallet.nombre, wallet);

                    if (walletActualizada) {
                        const allWallets = await getAllWallets();
                        setWallets(allWallets);
                    } else {
                        console.error('Error al actualizar la wallet en localStorage.');
                    }
                } else {
                    console.error('Error cargando los saldos de ', wallet.nombre);
                }
            }
            return datosEth;
        }

        const cargarDatosPortfolio = async () => {
            const saldosBtc = await obtenerSaldosBtc();
            if (isCancelled) return;

            const saldosEth = await obtenerSaldosEth();
            if (isCancelled) return;

            const datosActuales = {
                valorTotal: saldosBtc.valor + saldosEth.valor,
                btc: saldosBtc,
                eth: saldosEth
            };

            if (!isCancelled) {
                setPortfolio(datosActuales);
                await updatePortfolio(datosActuales);
                const fecha = new Date();
                setUltSync(fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit'})); 
                setIsRefreshing(false);
            }
        }

        if (wallets.length !== 0) {
            cargarDatosPortfolio();
        } else {
            const fecha = new Date();
            setUltSync(fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit'})); 
            setIsRefreshing(false);
        }

        return () => {
            isCancelled = true;
        };
    }, [password, redSeleccionada, datosPrecioActCrypto]); // Cuando cambie el valor de datosPrecio, se actualiza todo de nuevo también

    const renderChangeIndicator = (value: number, timeframe: string) => {
        const isPositive = value >= 0;
        const timeframes = {
            '1h': '1h',
            '24h': '24h',
            '7d': '7d',
            '30d': '30d'
        };
        
        return (
            <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                <div className="flex items-center justify-center space-x-1">
                    {isPositive ? (
                        <ArrowUp size={14} className="text-green-400" />
                    ) : (
                        <ArrowDown size={14} className="text-red-400" />
                    )}
                    <span className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {Math.abs(value).toFixed(2)}%
                    </span>
                </div>
                <div className="text-[12px] text-gray-400 mt-1 text-center">
                    {timeframes[timeframe as keyof typeof timeframes]}
                </div>
            </div>
        );
    };

    const renderCryptoBox = (data: CryptoData, icon: string) => {
        const { name, symbol, quote } = data;
        const isPositive24h = quote.EUR.percent_change_24h >= 0;
        const price = quote.EUR.price.toLocaleString('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Formateador de números grandes
        const formatearNumeroGrande = (num: number) => {
            if (num >= 1_000_000_000) {
                return (num / 1_000_000_000).toFixed(2) + 'B';
            }
            return num.toLocaleString('es-ES');
        };
        
        return (
            <div 
                className={`bg-gradient-to-br ${isPositive24h ? 'from-green-800/20 to-neutral-900/30 hover:bg-green-900/20' : 'from-red-800/20 to-neutral-900/30 hover:bg-red-900/20'} 
                rounded-2xl w-full max-w-5xl p-6 mb-5 shadow-lg border ${isPositive24h ? 'border-green-500/40' : 'border-red-500/40'} 
                transition-all duration-300 hover:shadow-xl`}
            >
                <div className="flex items-start justify-between">
                    {/* Lado izquierdo - Icono y nombre */}
                    <div className="flex items-center">
                        <div className="relative">
                            <img src={icon} alt={name} className="w-14 h-14 mr-4 select-none" draggable="false" />
                            {isPositive24h ? (
                                <div className="absolute -top-1 right-1.5 bg-green-500 rounded-full p-1">
                                    <Sparkles size={12} className="text-white" />
                                </div>
                            ) : (
                                <div className="absolute -top-1 right-1.5 bg-red-500 rounded-full p-1">
                                    <TrendingDown size={12} className="text-white" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">{name}</h3>
                            <span className="text-gray-400 text-sm font-mono">{symbol}</span>
                        </div>
                    </div>

                    {/* Lado derecho - Precio y cambios */}
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white mb-2 font-mono">
                            {price}
                            <span className={`text-xs ml-2 ${isPositive24h ? 'text-green-400' : 'text-red-400'}`}>
                                {isPositive24h ? '▲' : '▼'} {Math.abs(quote.EUR.percent_change_24h).toFixed(2)}%
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-end space-x-2">
                            {renderChangeIndicator(quote.EUR.percent_change_1h, '1h')}
                            {renderChangeIndicator(quote.EUR.percent_change_24h, '24h')}
                            {renderChangeIndicator(quote.EUR.percent_change_7d, '7d')}
                            {renderChangeIndicator(quote.EUR.percent_change_30d, '30d')}
                        </div>
                    </div>
                </div>

                {/* Indicador de tendencia */}
                <div className={`mt-4 pt-3 border-t ${isPositive24h ? 
                    'border-green-500/30' : 'border-red-400/30'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center">
                            {isPositive24h ? (
                                <>
                                    <TrendingUp className="text-green-400 mr-2" size={20} />
                                    <span className="text-sm text-green-400 font-medium">
                                        Tendencia alcista
                                    </span>
                                </>
                            ) : (
                                <>
                                    <TrendingDown className="text-red-400 mr-2" size={20} />
                                    <span className="text-sm text-red-400 font-medium">
                                        Tendencia bajista
                                    </span>
                                </>
                            )}
                        </div>
                        
                        <div className="text-sm text-gray-300">
                            <span className="font-medium">Volumen 24h:</span> {formatearNumeroGrande(quote.EUR.volume_24h)} € • 
                            <span className="font-medium ml-2">Cap. mercado:</span> {formatearNumeroGrande(quote.EUR.market_cap)} €
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center w-full px-4 py-6">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        ¡Bienvenido a 
                        <span 
                            className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-400"
                        >
                           {' '} Bitura
                        </span>!
                    </h1>
                    <p className="text-gray-400">Tu billetera cripto para lo que de verdad importa</p>
                </div>

                {/* Sección Portfolio */}
                <div className="grid grid-cols-3 items-center mb-6">
                    {/* Izquierda */}
                    <div className="text-left">
                        <h2 className="text-xl font-semibold text-white flex items-center">
                            <span className="bg-gradient-to-r flex gap-2 from-orange-500/90 to-yellow-600 p-2 rounded-lg mr-3 shadow-md">
                                <PiggyBank className="h-7 w-7" /> Portfolio
                            </span>
                        </h2>
                    </div>

                    <div className="text-center">
                        <div className="text-xs text-gray-400 bg-neutral-800 px-3 py-1 rounded-full inline-block">
                        Última actualización: {ultSync}
                        </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                        <div className="text-xs text-gray-400 bg-neutral-800 px-3 py-1 rounded-full inline-block">
                        Actualización automática cada 5 min
                        </div>
                        <button 
                            onClick={sincronizarManual}
                            disabled={isRefreshing}
                            className={`p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Sincronizar ahora"
                        >
                            <RefreshCw size={14} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {wallets.length === 0 ? (
                    <div className="mb-5 bg-gradient-to-br from-purple-900/20 to-neutral-900/30 rounded-2xl p-8 text-center border border-dashed border-purple-500/40 transition-all duration-300 hover:shadow-lg">
                        <div className="max-w-md mx-auto">
                            <div className="flex justify-center mb-4">
                                <Landmark className="w-16 h-16 text-purple-400" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Portfolio vacío</h3>
                            <p className="text-gray-300 mb-6">Aún no has creado ninguna cuenta. Comienza tu viaje cripto ahora mismo.</p>
                            <button 
                                className="bg-gradient-to-r select-none from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-medium py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer"
                                onClick={() => navigate("/inicio/cuentas/agregar")}
                            >
                                Crear mi primera wallet
                            </button>
                            <p className="text-xs text-gray-400 mt-4">Gestiona todas tus criptomonedas en un solo lugar</p>
                        </div>
                    </div>
                ) : (      
                    <>             
                        {/* Caja grande de valor total */}
                        <div className="bg-gradient-to-br from-purple-900/30 to-neutral-900/30 rounded-2xl w-full p-6 mb-5 shadow-lg border border-purple-500/40 transition-all duration-300 hover:shadow-xl">
                            <div className="flex flex-col md:flex-row md:items-center justify-between">
                                <div>
                                    <h3 className="text-xl text-gray-300 mb-1">Valor total del portfolio</h3>
                                    <div className="text-4xl font-bold text-white font-mono flex items-center gap-2 flex-row">
                                        {isRefreshing && (
                                            <Spinner small size={25}/>
                                        )}
                                        {portfolio?.valorTotal.toLocaleString('es-ES', {
                                            style: 'currency',
                                            currency: 'EUR',
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </div>
                                </div>
                                
                                <div className="mt-4 md:mt-0">
                                    <h4 className="text-sm text-gray-400 mb-2">Distribución de activos</h4>
                                    <div className="flex items-center space-x-12.5">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-orange-400">{btcPercentage}%</div>
                                            <div className="text-xs text-gray-400">BTC</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-blue-400">{ethPercentage}%</div>
                                            <div className="text-xs text-gray-400">ETH</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {/* Caja BTC */}
                            <div className="relative bg-gradient-to-br from-orange-900/20 to-neutral-900/30 rounded-2xl p-5 shadow-lg border border-orange-500/40 transition-all duration-300 hover:shadow-xl">
                                {isRefreshing && (
                                <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-2xl">
                                    <Spinner small size={50} />
                                </div>
                                )}
                                <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <img src={btcIcon} alt="Bitcoin" draggable="false" className="w-10 h-10 mr-3 select-none" />
                                    <div>
                                    <h3 className="text-lg font-bold text-white">Bitcoin</h3>
                                    <span className="text-gray-400 text-sm">BTC</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-white font-mono">
                                    {portfolio?.btc.cantidad.toFixed(8)} BTC
                                    </div>
                                    <div className="text-sm text-gray-300">
                                    {portfolio?.btc.valor.toLocaleString('es-ES', {
                                        style: 'currency',
                                        currency: 'EUR',
                                    })}
                                    </div>
                                </div>
                                </div>
                            </div>

                            {/* Caja ETH */}
                            <div className="relative bg-gradient-to-br from-blue-900/20 to-neutral-900/30 rounded-2xl p-5 shadow-lg border border-blue-500/40 transition-all duration-300 hover:shadow-xl">
                                {isRefreshing && (
                                <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-2xl">
                                    <Spinner small size={50} />
                                </div>
                                )}
                                <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <img src={ethIcon} alt="Ethereum" draggable="false" className="w-10 h-10 mr-3 select-none" />
                                    <div>
                                    <h3 className="text-lg font-bold text-white">Ethereum</h3>
                                    <span className="text-gray-400 text-sm">ETH</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-white font-mono">
                                    {portfolio?.eth.cantidad.toFixed(6)} ETH
                                    </div>
                                    <div className="text-sm text-gray-300">
                                    {portfolio?.eth.valor.toLocaleString('es-ES', {
                                        style: 'currency',
                                        currency: 'EUR',
                                    })}
                                    </div>
                                </div>
                                </div>
                            </div>
                        </div>
                        </> 
                    )
                }



                {/* Precios Cripto en tiempo real */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                        <span className="bg-gradient-to-r flex gap-2 from-cyan-600 to-blue-500 p-2 rounded-lg mr-3 shadow-md">
                            <ChartLine className="h-7 w-7"/> Portal de Precios
                        </span>
                    </h2>
                </div>

                {datosPrecioActCrypto ? (
                    <div className="space-y-6">
                        {datosPrecioActCrypto.data["BTC"] && renderCryptoBox(datosPrecioActCrypto.data["BTC"], btcIcon)}
                        {datosPrecioActCrypto.data["ETH"] && renderCryptoBox(datosPrecioActCrypto.data["ETH"], ethIcon)}
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center bg-neutral-900/50 rounded-2xl">
                        <Spinner small size={48} />
                        <span className="mt-4 text-gray-400 animate-pulse">Cargando datos de mercado...</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default InicioDashboard;