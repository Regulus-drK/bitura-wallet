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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
};
