import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password?: string) => Promise<boolean>;
    signUp: (email: string, password: string, displayName: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string, userEmail: string) => {
        try {
            const { data: profile } = await supabase
                .from('cbn_app_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profile) {
                setUser({
                    id: profile.id,
                    email: profile.email,
                    display_name: profile.display_name || userEmail.split('@')[0] || 'User',
                    role: profile.role as 'admin' | 'user',
                    avatar_url: profile.avatar_url
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    useEffect(() => {
        setLoading(true);
        // Check for an existing session on startup
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user) {
                await fetchProfile(session.user.id, session.user.email || '');
            }
            setLoading(false);
        });

        // Listen for auth changes (e.g. token refresh, sign out, generic sign in)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

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
        const { user: u, error } = await authService.signUp(email, password, displayName);
        setLoading(false);
        if (error) {
            alert(error);
            return false;
        }
        if (u) {
            setUser(u);
            return true;
        }
        return false;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    const refreshProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await fetchProfile(session.user.id, session.user.email || '');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signUp, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
