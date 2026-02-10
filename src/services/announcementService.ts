import { supabase } from './supabaseClient';
import { Announcement } from '../types';

export const announcementService = {
    getAll: async (): Promise<Announcement[]> => {
        // Return sorted by date (newest first)
        const { data, error } = await supabase
            .from('cbn_app_announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((item: any) => ({
            ...item,
            id: item.id.toString(),
        })) as Announcement[];
    },

    create: async (title: string, content: string, authorId: string, authorName: string): Promise<Announcement> => {
        const { data, error } = await supabase
            .from('cbn_app_announcements')
            .insert([{
                title,
                content,
                author_id: authorId
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            id: data.id.toString(),
            author_name: authorName
        } as Announcement;
    },
    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('cbn_app_announcements')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
