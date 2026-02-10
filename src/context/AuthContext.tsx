import React, { createContext, useState, useContext } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password?: string) => Promise<boolean>;
    signUp: (email: string, password: string, displayName: string) => Promise<{ success: boolean; needsEmailConfirmation: boolean }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    const login = async (email: string, password?: string): Promise<boolean> => {
        setLoading(true);
        const { user: u, error } = await authService.login(email, password);
        setLoading(false);
        if (u) {
            setUser(u);
            return true;
        } else {
            alert(error || 'Login failed');
            return false;
        }
    };

    const signUp = async (email: string, password: string, displayName: string) => {
        setLoading(true);
        const { user: u, error, needsEmailConfirmation } = await authService.signUp(email, password, displayName);
        setLoading(false);
        if (error) {
            alert(error);
            return { success: false, needsEmailConfirmation: false };
        }
        if (u) {
            setUser(u);
            return { success: true, needsEmailConfirmation: false };
        }
        return { success: true, needsEmailConfirmation };
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signUp, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
