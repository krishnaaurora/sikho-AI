import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../utils/api';

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  bio?: string;
  profileImage?: string;
  walletAddress?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  onboardingCompleted?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { 
    fullName: string; 
    email: string; 
    password: string; 
    confirmPassword: string;
    country?: string;
    educationLevel?: string;
    interests?: string[];
    currentSkills?: string[];
    targetRole?: string;
    experienceLevel?: string;
    preferredLanguage?: string;
    whatAreYouHereToDo?: string[];
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  checkAuth: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const response = await authApi.getCurrentUser();
      if (response && response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    if (response && response.success && response.data?.user) {
      setUser(response.data.user);
    }
  };

  const register = async (data: any) => {
    await authApi.register(data);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
};

