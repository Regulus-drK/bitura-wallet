import { useEffect } from 'react';

export function useWindowSize(options?: {
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable?: boolean;
}, dependency?: boolean) {
  useEffect(() => {
    if (!options) return;

    const sizeOptions = {
      width: options.width || 800,
      height: options.height || 600,
      minWidth: options.minWidth || options.width || 800,
      minHeight: options.minHeight || options.height || 600,
      maxWidth: options.maxWidth ?? 999999,
      maxHeight: options.maxHeight ?? 999999,
      resizable: options.resizable || false
    };

    window.api.setWindowSize(sizeOptions);

    // Al desmontar el componente y detectar un cambio en la dependencia
    // (el booleano se actualiza), se ejecuta el cleanup y resetea el tamaño de la ventana.
    return () => {
      if (!options.resizable) {
        window.api.resetWindowSize().catch(() => {});
      }
    };
  }, [dependency ?? true]); // Se puede añadir como [dependency ?? true] si en algun momento no hay dependencia
}