import { useEffect, useState } from "react";
import { getRedSeleccionada, listarPrecios } from "../../services/apiService";
import btcIcon from "../../assets/crypto/bitcoin.png";
import ethIcon from "../../assets/crypto/ether.png";
import type { CryptoAPIResponse, CryptoData } from "../../types/CryptoPrices";
import Spinner from "./Spinner";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Sparkles, ChartLine } from "lucide-react";

function InicioDashboard() {
    const [redBtcSeleccionada, setRedBtcSeleccionada] = useState<'mainnet' | 'testnet'>('mainnet');
    const [datosPrecioActCrypto, setDatosPrecioActCrypto] = useState<CryptoAPIResponse | null>(null);
    const [ultSync, setUltSync] = useState<string>("Cargando...");

    const obtenerPrecios = async () => {
        setDatosPrecioActCrypto(null);
        const datos = await listarPrecios();
        if (datos) {
            setDatosPrecioActCrypto(datos);
            const fecha = new Date();
            setUltSync(fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit'})); 
        }
    };

    useEffect(() => {
        const detectarRedBtcSeleccionada = async () => {
            setRedBtcSeleccionada(await getRedSeleccionada());
        };
        detectarRedBtcSeleccionada();
        obtenerPrecios();

        console.log(redBtcSeleccionada); // TODO: Temporal para que deje compilar simplemente

        // Actualizar precios cada 60 segundos
        const interval = setInterval(obtenerPrecios, 60000);
        return () => clearInterval(interval);
    }, []);

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

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                        <span className="bg-gradient-to-r flex gap-2 from-cyan-600 to-blue-500 p-2 rounded-lg mr-3 shadow-md">
                            <ChartLine className="h-7 w-7"/> Portal de Precios
                        </span>
                    </h2>
                    <div className="text-xs text-gray-400 bg-neutral-800 px-3 py-1 rounded-full">
                        Última actualización: {ultSync}
                    </div>
                    <div className="text-xs text-gray-400 bg-neutral-800 px-3 py-1 rounded-full">
                        Actualización automática cada 60s
                    </div>
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