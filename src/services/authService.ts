import { supabase } from './supabaseClient';
import { User } from '../types';

export const authService = {
    login: async (email: string, password?: string): Promise<{ user: User | null; error: string | null }> => {
        try {
            // 1. Authenticate with Supabase Auth (Checks password)
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password: password || '', // Password is now required for real auth
            });

            if (authError) return { user: null, error: authError.message };
            if (!authData.user) return { user: null, error: 'No user returned from auth' };

            // 2. Fetch Profile Details (Role, Display Name)
            const { data: profile, error: profileError } = await supabase
                .from('cbn_app_profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            if (profileError || !profile) {
                return { user: null, error: 'Profile not found. Please contact support.' };
            }

            const user: User = {
                id: profile.id,
                email: profile.email,
                display_name: profile.display_name || email.split('@')[0],
                role: profile.role as 'admin' | 'user',
                avatar_url: profile.avatar_url
            };

            return { user, error: null };
        } catch (e: any) {
            return { user: null, error: e.message };
        }
    },
    signUp: async (
        email: string,
        password: string,
        displayName: string
    ): Promise<{ user: User | null; error: string | null }> => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName,
                    },
                },
            });

            if (error) return { user: null, error: error.message };
            if (!data.user || !data.session) return { user: null, error: 'Sign up failed. Please try again.' };

            const { data: profile, error: profileError } = await supabase
                .from('cbn_app_profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            const user: User = profile && !profileError ? {
                id: profile.id,
                email: profile.email,
                display_name: profile.display_name || displayName || email.split('@')[0],
                role: profile.role as 'admin' | 'user',
                avatar_url: profile.avatar_url
            } : {
                id: data.user.id,
                email,
                display_name: displayName || email.split('@')[0],
                role: 'user'
            };

            return { user, error: null };
        } catch (e: any) {
            return { user: null, error: e.message };
        }
    },

    logout: async () => {
        await supabase.auth.signOut();
    },

    // Temporary helper for "Demo Login" to actually create a session if using RLS
    // NOTE: RLS requires a real auth session. 
    // If you want true RLS, we need to sign in. 
    // To keep it simple as requested "like mock but with DB", we might need to bypass RLS or use a service key (not recommended on client).
    // BETTER APPROACH for Demo: 
    // 1. Allow 'anon' to read/write (less secure)
    // 2. OR Implement real Auth (Magic Link).

    // User requested "isolate data". 
    // Let's implement a "Simulated Auth" where we just trust the email for now? 
    // NO, RLS won't work that way.

    // DECISION: We will use Supabase Auth. 
    // But since the UI adds "Login with Email" (no password), we should use Magic Link.

    signInWithEmail: async (email: string) => {
        return supabase.auth.signInWithOtp({ email });
    },

    isAdmin: (user: User | null): boolean => {
        return user?.role === 'admin';
    }
};
