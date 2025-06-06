import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle, CircleX } from "lucide-react";

type ToastType = "success" | "error";
type ToastMessage = {
  type: ToastType;
  message: string;
};

type ToastContextType = {
  showToast: (msg: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [animacionEntrada, setAnimacionEntrada] = useState(false);
  const [salidaToast, setSalidaToast] = useState(false);
  const entradaTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const salidaTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ocultarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string, type: ToastType = "success") => {
    setToast({ type, message: msg });
    setAnimacionEntrada(false);
    setSalidaToast(false);

    if (entradaTimeoutRef.current) clearTimeout(entradaTimeoutRef.current);
    if (salidaTimeoutRef.current) clearTimeout(salidaTimeoutRef.current);
    if (ocultarTimeoutRef.current) clearTimeout(ocultarTimeoutRef.current);

    entradaTimeoutRef.current = setTimeout(() => {
      setAnimacionEntrada(true);
    }, 10);

    salidaTimeoutRef.current = setTimeout(() => {
      setSalidaToast(true);
    }, 2000);

    ocultarTimeoutRef.current = setTimeout(() => {
      setToast(null);
      setAnimacionEntrada(false);
      setSalidaToast(false);
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className={`absolute left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-xl z-100
            shadow-lg flex items-center gap-3 text-white transition-all duration-500 ease-in-out
            ${toast.type === "success" ? "bg-emerald-600" : "bg-red-500"}
            ${salidaToast ? "top-0 opacity-0" : animacionEntrada ? "top-6 opacity-100" : "top-0 opacity-0"}`}
          style={{ pointerEvents: "none" }}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-white" />
          ) : (
            <CircleX className="w-5 h-5 text-white" />
          )}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
