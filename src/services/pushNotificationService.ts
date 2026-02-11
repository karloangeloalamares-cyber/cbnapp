import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from './supabaseClient';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

const getProjectId = () => {
    return (
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId ||
        Constants.expoConfig?.extra?.projectId
    );
};

export const pushNotificationService = {
    registerForPushNotifications: async (userId: string) => {
        try {
            if (!Device.isDevice) {
                return { token: null, error: 'Physical device required for push notifications.' };
            }

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                return { token: null, error: 'Notification permission not granted.' };
            }

            const projectId = getProjectId();
            if (!projectId) {
                return {
                    token: null,
                    error: 'Missing Expo projectId in app config. Rebuild the dev client after updating app.json.',
                };
            }

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                    sound: 'default',
                });
            }

            const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                return { token: null, error: `Failed to read auth session: ${sessionError.message}` };
            }

            const sessionUserId = sessionData.session?.user?.id;
            if (!sessionUserId) {
                return { token: null, error: 'No active Supabase session. Please log out and log in again.' };
            }

            if (sessionUserId !== userId) {
                return {
                    token: null,
                    error: 'Session user does not match current profile. Please log out and log in again.',
                };
            }

            const { error } = await supabase
                .from('cbn_app_push_tokens')
                .upsert(
                    {
                        user_id: userId,
                        token,
                        platform: Platform.OS,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'token' }
                );

            if (error) {
                return { token: null, error: `Failed to save push token: ${error.message}` };
            }

            return { token, error: null };
        } catch (error: any) {
            return { token: null, error: error?.message ?? 'Unexpected push registration error.' };
        }
    },
};
