import { useEffect, useState } from "react";
import { closeApp, disableMenu, validatePassword } from "../../services/apiService";
import logoBitura from '../../assets/LogotipoBituraPng.png'
import { useWindowSize } from "../../hooks/useWindowSize";
import { Eye, EyeOff, LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { walletShouldBeConfigured } from "../../hooks/walletShouldBeConfigured";

function Login() {
    const [loginSuccessful, setLoginSuccessful] = useState<boolean | undefined>(undefined);
    const [password, setPassword] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    walletShouldBeConfigured(true);

    useEffect(() => {
        disableMenu();
    });

    const handleVerifyLogin = async () => {
        if (await validatePassword(password!)) {
            setLoginSuccessful(true);
            setTimeout(() => {
                navigate("/inicio");
            }, 1500)
        } else {
            setLoginSuccessful(false);
        }
    }

    const handleCloseApp = () => {
        closeApp();
    }

    useWindowSize({
        width: 800,
        height: 650,
        minWidth: 600,
        minHeight: 450,
        resizable: false
    });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-2">
        {/* Imagen centrada en la parte superior */}
        <div className="flex justify-center select-none">
            <img 
                src={logoBitura} 
                alt="Logo Bitura" 
                className="w-115 h-40" // Ajusta el tamaño según necesites
            />
        </div>

        <div className="flex flex-col items-center mt-5">
            {/* Contraseña */}
            <h2 className="text-xl font-bold text-white text-center">
                Introduzca su contraseña
            </h2>
            <div className="relative mt-3 w-full max-w-xs">
                <input
                    type={showPassword ? "text" : "password"}
                    value={password || ""}
                    disabled={loginSuccessful}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setLoginSuccessful(undefined);
                    }}
                    className={`w-full gap-2 bg-neutral-800 hover:bg-neutral-900 
                    text-white font-semibold py-1 px-6 rounded-xl shadow-md 
                    transition duration-300
                        ${(loginSuccessful)
                            ? "border-green-500 border-2"
                            : "border-gray-500 border"
                        }`}
                />
                <button 
                    className="absolute inset-y-0 right-2 flex items-center 
                    justify-center text-gray-300 hover:text-white cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeOff/> : <Eye/>}
                </button>
            </div>
        </div>
        {/* Botones */}
        <div className="mt-5 flex gap-6">
            {/* Botón Salir */}
            <button
                onClick={handleCloseApp}
                disabled={loginSuccessful}
                className={`px-4 py-2 rounded-xl shadow-md border flex items-center gap-2 transition duration-300
                    ${(loginSuccessful) 
                        ? "bg-neutral-600 text-gray-300 cursor-not-allowed border-gray-400" 
                        : "border-gray-500 bg-neutral-800 cursor-pointer text-white hover:bg-neutral-900"}`
                }
            >
                <LogOut className="w-5 h-5"/>
                Salir
            </button>
            {/* Botón Entrar */}
            <button
                onClick={handleVerifyLogin}
                disabled={loginSuccessful || !password}
                className={`px-4 py-2 rounded-xl shadow-md border flex items-center gap-2 transition duration-300
                    ${(loginSuccessful || !password) 
                        ? "bg-neutral-600 text-gray-300 cursor-not-allowed border-gray-400" 
                        : "border-gray-500 bg-neutral-800 cursor-pointer text-white hover:bg-neutral-900"}`
                }
            >
                <LogIn className="w-5 h-5"/>
                Entrar
            </button>
        </div>
        {/* Info. estado contraseñas introducidas */}
        {loginSuccessful === false && (
            <h2 className="text-center mt-4 text-lg font-semibold text-red-500">
                Contraseña incorrecta
            </h2>
        )}
    </div>
  );
}

export default Login;