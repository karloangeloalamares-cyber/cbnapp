import { supabase } from './supabaseClient';
import { AppNotification } from '../types';

export const notificationService = {
    getAll: async (recipientId: string): Promise<AppNotification[]> => {
        const { data, error } = await supabase
            .from('cbn_app_notifications')
            .select('*')
            .eq('recipient_id', recipientId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((item: any) => ({
            ...item,
            id: item.id.toString(),
            recipient_id: item.recipient_id.toString(),
            target_id: item.target_id.toString(),
        })) as AppNotification[];
    },
    getUnreadCount: async (recipientId: string): Promise<number> => {
        const { count, error } = await supabase
            .from('cbn_app_notifications')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', recipientId)
            .is('read_at', null);

        if (error) throw error;

        return count || 0;
    },
    markRead: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('cbn_app_notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },
};
