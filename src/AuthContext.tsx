import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Simulação simples - usuário não logado por padrão
  useEffect(() => {
    // Simular loading inicial
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Implementação mock
    console.log('Sign in:', email, password);
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    // Implementação mock
    console.log('Sign up:', email, password, name, phone);
  };

  const signOut = async () => {
    setUser(null);
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...data });
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};