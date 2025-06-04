import React, { createContext, useContext, useState } from 'react';

type AuthContextType = {
  password: string | null;
  setPassword: (password: string) => void;
  clearPassword: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [password, setPassword] = useState<string | null>(null);

  const clearPassword = () => setPassword(null);

  return (
    <AuthContext.Provider value={{ password, setPassword, clearPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Función para acceder a los tipos del contexto de autenticación
 * Permite acceder a la contraseña y setter de la contraseña (en memoria) desde otros componentes
 * @returns Devuelve el contexto de Auth (password, setPassword...)
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
};
