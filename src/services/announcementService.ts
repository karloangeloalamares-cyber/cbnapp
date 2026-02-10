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
    getById: async (id: string): Promise<Announcement | null> => {
        const { data, error } = await supabase
            .from('cbn_app_announcements')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;

        return {
            ...data,
            id: data.id.toString(),
            author_name: data.author_name || '',
        } as Announcement;
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
