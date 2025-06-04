import { useLocation, useNavigate } from 'react-router-dom';
import logoBitura from '../../assets/LogotipoBituraPng.png'
import { Home, Wallet, Settings, LogOut, ArrowUp, ArrowDown } from "lucide-react";

const SidebarMenu = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLocation = (path: string) => {
        navigate(path);             // Redirige al login
    };

    return (
        <aside className="fixed top-0 left-0 h-screen w-60 bg-neutral-700 rounded-r-2xl shadow-lg flex flex-col p-4 text-white">
            <div className="text-2xl font-bold mb-5 flex justify-center select-none">
                <img 
                    src={logoBitura} 
                    alt="Logo Bitura" 
                    draggable="false"
                    className="w-40 h-20 object-contain"
                />
            </div>

            <nav className="flex-1 flex flex-col gap-3">
                <SidebarButton 
                    icon={<Home size={20}/>} 
                    label="Inicio" 
                    to="/inicio" // Meramente informativo para saber a dónde redirige
                    active={location.pathname === "/inicio"}
                    onClick={() => handleLocation("/inicio")} 
                />
                <SidebarButton 
                    icon={<Wallet size={20} />} 
                    label="Cuentas" 
                    to="/inicio/cuentas" // Meramente informativo para saber a dónde redirige
                    active={location.pathname === "/inicio/cuentas" || 
                        location.pathname === '/inicio/cuentas/agregar' ||
                        location.pathname === '/inicio/cuentas/datos-cuenta' ||
                        location.pathname === '/inicio/cuentas/datos-cuenta/ajustes'}
                    onClick={() => handleLocation("/inicio/cuentas")} 
                />
                <SidebarButton 
                    icon={<ArrowUp size={20}/>} 
                    label="Enviar" 
                    to="/inicio/enviar" // Meramente informativo para saber a dónde redirige
                    active={location.pathname === "/inicio/enviar"}
                    onClick={() => handleLocation("/inicio/enviar")} 
                />            
                <SidebarButton 
                    icon={<ArrowDown size={20}/>} 
                    label="Recibir" 
                    to="/inicio/recibir" // Meramente informativo para saber a dónde redirige
                    active={location.pathname === "/inicio/recibir"}
                    onClick={() => handleLocation("/inicio/recibir")} 
                />
            </nav>

            <div className="mt-auto flex flex-col items-start gap-1.5">
                <SidebarButton 
                    icon={<Settings size={20} />} 
                    label="Ajustes" 
                    to="/inicio/config" // Meramente informativo para saber a dónde redirige
                    active={location.pathname === "/inicio/config"}
                    onClick={() => handleLocation("/inicio/config")}  
                />
                <SidebarButton 
                    icon={<LogOut size={20} />} 
                    label="Salir" 
                    to="/" // Meramente informativo para saber a dónde redirige
                    active={false}
                    onClick={() => handleLocation("/")}  
                />
            </div>
        </aside>
    );
};

const SidebarButton = ({ icon, label, onClick, active }: 
    { icon: React.ReactNode; label: string, to: string, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-2 select-none rounded-xl transition-colors cursor-pointer 
        ${active ? "bg-neutral-600" : "hover:bg-neutral-600"}`}    
    >
        <div className={`${active ? "text-green-500" : "text-white"}`}>
            {icon}
        </div>
        <span className="text-base font-medium">{label}</span>
    </button>
);

export default SidebarMenu;
