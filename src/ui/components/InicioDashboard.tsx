import { DoorClosedLocked } from "lucide-react";

interface InicioDashboardProps {
    logOut: () => void;
}


function InicioDashboard({ logOut }: InicioDashboardProps) {    

    return (
        <div>
            <button
                onClick={logOut}
                className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-900 cursor-pointer text-white 
                font-semibold py-8 px-10 rounded-xl shadow-md border border-gray-500 transition duration-300
                text-xl min-w-[300px] h-[60px] justify-center"
            >
                <DoorClosedLocked className="w-6 h-6 relative top-[2px]" />
                Cerrar sesión
            </button>
        </div>
    )
}

export default InicioDashboard;