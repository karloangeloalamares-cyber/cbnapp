import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../services/supabaseClient';
import { User } from '../types';

// Ensure WebBrowser can handle the redirect
WebBrowser.maybeCompleteAuthSession();

export const signInWithGoogle = async (): Promise<{ user: User | null; error: string | null }> => {
    try {
        // In Expo Go, don't pass scheme (it uses exp:// automatically)
        // In dev-client/production builds, use the app scheme
        const isExpoGo = Constants.appOwnership === 'expo';
        const redirectUrl = makeRedirectUri({
            ...(isExpoGo ? {} : { scheme: 'cbnapp' }),
            path: 'auth/callback',
        });

        console.log('[GoogleAuth] Redirect URL:', redirectUrl);
        console.log('[GoogleAuth] Make sure this URL is in Supabase -> Auth -> URL Configuration -> Redirect URLs');

        // 2. Start the OAuth flow with Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                skipBrowserRedirect: true,
            },
        });

        if (error) throw error;
        if (!data?.url) throw new Error('No OAuth URL returned from Supabase');

        console.log('[GoogleAuth] Opening browser...');

        // 3. Open the browser for auth
        const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
        );

        console.log('[GoogleAuth] Browser result type:', result.type);

        // 4. Handle the result — PKCE flow returns a code, not tokens
        if (result.type === 'success' && result.url) {
            const url = new URL(result.url);
            const code = url.searchParams.get('code');

            if (!code) throw new Error('No authorization code in callback URL');

            // 5. Exchange code for session — Supabase verifies PKCE challenge
            const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

            if (sessionError) throw sessionError;
            if (!sessionData.user) throw new Error('No user returned after setting session');

            const authUser = sessionData.user;

            // 6. Fetch or create the app profile
            const { data: profile } = await supabase
                .from('cbn_app_profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profile) {
                return {
                    user: {
                        id: profile.id,
                        email: profile.email,
                        display_name: profile.display_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
                        role: profile.role as 'admin' | 'user',
                        avatar_url: profile.avatar_url || authUser.user_metadata?.avatar_url,
                    },
                    error: null,
                };
            }

            // Profile doesn't exist yet — create one for this Google user
            const displayName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
            const avatarUrl = authUser.user_metadata?.avatar_url || null;

            const { data: newProfile, error: insertError } = await supabase
                .from('cbn_app_profiles')
                .insert({
                    id: authUser.id,
                    email: authUser.email,
                    display_name: displayName,
                    avatar_url: avatarUrl,
                    role: 'user',
                })
                .select()
                .single();

            if (insertError) {
                console.warn('[GoogleAuth] Profile insert error:', insertError.message);
                // Return user with Google metadata — a DB trigger may handle profile creation
                return {
                    user: {
                        id: authUser.id,
                        email: authUser.email || '',
                        display_name: displayName,
                        role: 'user',
                        avatar_url: avatarUrl || undefined,
                    },
                    error: null,
                };
            }

            return {
                user: {
                    id: newProfile.id,
                    email: newProfile.email,
                    display_name: newProfile.display_name,
                    role: newProfile.role as 'admin' | 'user',
                    avatar_url: newProfile.avatar_url,
                },
                error: null,
            };
        }

        return { user: null, error: 'User cancelled or failed to sign in' };
    } catch (error: any) {
        console.error('[GoogleAuth] Error:', error);
        return { user: null, error: error.message };
    }
};
