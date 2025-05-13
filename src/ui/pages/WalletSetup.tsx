import { Import, SquarePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import logoBitura from '../../assets/LogotipoBituraPng.png'
import { useWindowSize } from '../../hooks/useWindowSize';
import { useWalletConfig } from '../../hooks/useWalletConfig';
import React, { Suspense } from 'react';
import Spinner from '../components/Spinner';
import { disableMenu } from '../../services/apiService';
import { walletShouldBeConfigured } from '../../hooks/walletShouldBeConfigured';

const WalletImportar = React.lazy(() => import('../components/WalletImportar'));
const WalletCrear = React.lazy(() => import('../components/WalletCrear'));
const WalletCrearVerificacion = React.lazy(() => import('../components/WalletCrearVerificacion'));
const WalletCrearPassword = React.lazy(() => import('../components/WalletCrearPassword'));

function WalletSetup() {
    const [mnemonic, setMnemonic] = useState<string[] | null>(null);
    const [mnemonicImportado, setMnemonicImportado] = useState<string[] | null>(null);
    const [mode, setMode] = useState<
    'opciones' | 'importar' | 'crear' | 'verificacion' | 'password'
    >('opciones');
    const [origenPassword, setOrigenPassword] = useState<'importar' | 'verificacion' | null>(null);

    const isConfigured = useWalletConfig();
    walletShouldBeConfigured(false);

    useEffect(() => {
        disableMenu();
    }, []);

    useWindowSize({
        width: 800,
        height: 650,
        minWidth: 600,
        minHeight: 450,
        resizable: false
    }, isConfigured);

    return (
    <div className="min-h-screen flex flex-col p-4">
        {mode === 'opciones' && (
        <>
            {/* Imagen centrada en la parte superior */}
            <div className="flex justify-center mt-4 select-none">
                <img 
                    src={logoBitura} 
                    alt="Logo Bitura" 
                    className="w-115 h-40" // Ajusta el tamaño según necesites
                />
            </div>

            {/* Contenido principal en columnas (centrado verticalmente) */}
            <div className="flex flex-col items-center justify-center gap-6"> 

                <div className="text-center space-y-4 mb-8">
                    <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-700 
                    py-3 px-6 rounded-lg shadow-lg inline-block m-6 mb-10">
                        Bienvenido a la ventana de creación de su wallet
                    </h1>
                    
                    <h2 className="text-xl text-gray-300 font-medium max-w-2xl mx-auto leading-relaxed">
                        Seleccione una de las opciones para continuar con la configuración.
                    </h2>
                </div>

                <div className='flex gap-6'>
                    {/* Botones Ajustar cartera */}
                    <button
                        onClick={() => setMode('importar')}
                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-900 cursor-pointer text-white 
                        font-semibold py-8 px-10 rounded-xl shadow-md border border-gray-500 transition duration-300
                        text-xl min-w-[300px] h-[60px] justify-center"
                    >
                        <Import className="w-6 h-6 relative top-[2px]" />
                        Importar cartera
                    </button>
                    <button
                        onClick={() => setMode('crear')}
                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-900 cursor-pointer text-white 
                        font-semibold py-8 px-10 rounded-xl shadow-md border border-gray-500 transition duration-300
                        text-xl min-w-[300px] h-[60px] justify-center"
                    >
                        <SquarePlus className="w-6 h-6 relative top-[2px]" />
                        Crear cartera
                    </button>
                </div>
            </div>
        </>
        )}

        {mode === 'importar' && (
            <Suspense fallback={<Spinner/>}>
                <WalletImportar 
                    onBack={() => setMode('opciones')}
                    onNext={() => {
                        setOrigenPassword('importar');
                        setMode('password')
                    }}
                    setMnemonicImportado={setMnemonicImportado}
                />
            </Suspense>
        )}
        {mode === 'crear' && (
            <Suspense fallback={<Spinner/>}>
                <WalletCrear 
                    onBack={() => setMode('opciones')}
                    onNext={() => setMode('verificacion')}
                    mnemonic={mnemonic}
                    setMnemonic={setMnemonic}
                />
            </Suspense>
        )}

        {mode === 'verificacion' && (
            <Suspense fallback={<Spinner/>}>
                <WalletCrearVerificacion 
                    onBack={() => setMode('crear')}
                    onNext={() => {
                        setOrigenPassword('verificacion');
                        setMode('password');
                    }}
                    mnemonic={mnemonic}
                />
            </Suspense>
        )}

        {mode === 'password' && (
            <Suspense fallback={<Spinner/>}>
                <WalletCrearPassword
                    onBack={() => {
                        if (origenPassword === 'importar') {
                            setMode('importar');
                        } else {
                            setMode('verificacion');
                        }
                    }}               
                    mnemonic={origenPassword === 'importar' ? mnemonicImportado : mnemonic}
                />
            </Suspense>
        )}
    </div>
    );
}
 
export default WalletSetup;