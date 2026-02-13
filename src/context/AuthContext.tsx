import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
    signUp: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    googleLogin: () => Promise<{ success: boolean; error?: string }>;
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
        let mounted = true;

        console.log('[AuthContext] Starting session check...');
        setLoading(true);

        // Safety timeout to prevent infinite loading screen
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn('[AuthContext] Session check timed out, forcing app load.');
                setLoading(false);
            }
        }, 5000);

        // Check for an existing session on startup
        supabase.auth.getSession().then(async ({ data: { session }, error }) => {
            console.log('[AuthContext] Session check complete. Session:', !!session, 'Error:', error);
            if (error) {
                console.error('[AuthContext] Session error:', error);
            }

            if (session?.user) {
                console.log('[AuthContext] Fetching profile for user:', session.user.id);
                await fetchProfile(session.user.id, session.user.email || '');
            }
            if (mounted) {
                clearTimeout(safetyTimeout);
                setLoading(false);
            }
        }).catch(err => {
            console.error('[AuthContext] Unexpected error during session check:', err);
            if (mounted) {
                clearTimeout(safetyTimeout);
                setLoading(false);
            }
        });

        // Listen for auth changes (e.g. token refresh, sign out, generic sign in)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setUser(null);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
        setLoading(true);
        const { user: u, error } = await authService.login(email, password);
        setLoading(false);
        if (u) {
            setUser(u);
            return { success: true };
        } else {
            return { success: false, error: error || 'Login failed' };
        }
    };

    const signUp = async (email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
        setLoading(true);
        const { user: u, error } = await authService.signUp(email, password, displayName);
        setLoading(false);
        if (error) {
            return { success: false, error };
        }
        if (u) {
            setUser(u);
            return { success: true };
        }
        return { success: false, error: 'Unknown registration error' };
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

    const googleLogin = async (): Promise<{ success: boolean; error?: string }> => {
        setLoading(true);
        try {
            const { signInWithGoogle } = await import('../utils/AuthUtils');
            const { user: u, error } = await signInWithGoogle();
            if (u) {
                setUser(u);
                return { success: true };
            }
            if (error) {
                console.error('Google login error:', error);
                return { success: false, error };
            }
        } catch (e) {
            console.error('Google login exception:', e);
            return { success: false, error: 'An unexpected error occurred' };
        } finally {
            setLoading(false);
        }
        return { success: false };
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signUp, logout, refreshProfile, googleLogin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
