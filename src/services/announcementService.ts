import { supabase } from './supabaseClient';
import { Announcement } from '../types';
import { mediaService } from './mediaService';

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
    getByIds: async (ids: string[]): Promise<Announcement[]> => {
        if (ids.length === 0) return [];

        const { data, error } = await supabase
            .from('cbn_app_announcements')
            .select('*')
            .in('id', ids);

        if (error) throw error;

        return (data || []).map((item: any) => ({
            ...item,
            id: item.id.toString(),
            author_name: item.author_name || '',
        })) as Announcement[];
    },

    create: async (
        title: string,
        content: string,
        authorId: string,
        authorName: string,
        imageUrl?: string,
        videoUrl?: string
    ): Promise<Announcement> => {
        let finalImageUrl = imageUrl;
        let finalVideoUrl = videoUrl;

        // Parallelize uploads if both are present
        console.log('[AnnouncementService] Starting uploads...');
        const [uploadImage, uploadVideo] = await Promise.all([
            imageUrl ? mediaService.uploadMedia(imageUrl) : Promise.resolve(imageUrl),
            videoUrl ? mediaService.uploadMedia(videoUrl) : Promise.resolve(videoUrl)
        ]);

        finalImageUrl = uploadImage;
        finalVideoUrl = uploadVideo;

        console.log('[AnnouncementService] Saving announcement with media:', { finalImageUrl, finalVideoUrl });

        const { data, error } = await supabase
            .from('cbn_app_announcements')
            .insert([{
                title,
                content,
                image_url: finalImageUrl,
                video_url: finalVideoUrl,
                author_id: authorId
            }])
            .select()
            .single();

        if (error) {
            console.error('[AnnouncementService] Create error:', error);
            throw error;
        }

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
