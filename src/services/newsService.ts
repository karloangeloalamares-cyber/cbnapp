import { supabase } from './supabaseClient';
import { NewsArticle } from '../types';

export const newsService = {
    getAll: async (): Promise<NewsArticle[]> => {
        const { data, error } = await supabase
            .from('cbn_app_news')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((item: any) => ({
            ...item,
            // Ensure ID is string if UUID
            id: item.id.toString(),
        })) as NewsArticle[];
    },
    getById: async (id: string): Promise<NewsArticle | null> => {
        const { data, error } = await supabase
            .from('cbn_app_news')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;

        return {
            ...data,
            id: data.id.toString(),
            author_name: data.author_name || '',
        } as NewsArticle;
    },
    getByIds: async (ids: string[]): Promise<NewsArticle[]> => {
        if (ids.length === 0) return [];

        const { data, error } = await supabase
            .from('cbn_app_news')
            .select('*')
            .in('id', ids);

        if (error) throw error;

        return (data || []).map((item: any) => ({
            ...item,
            id: item.id.toString(),
            author_name: item.author_name || '',
        })) as NewsArticle[];
    },

    create: async (
        headline: string,
        content: string,
        authorId: string,
        authorName: string,
        imageUrl?: string,
        videoUrl?: string,
        linkUrl?: string,
        linkText?: string
    ): Promise<NewsArticle> => {
        // Upload media if it's a local URI
        let finalImageUrl = imageUrl;
        let finalVideoUrl = videoUrl;

        const uploadMedia = async (uri: string) => {
            if (!uri.startsWith('file://') && !uri.startsWith('content://')) return uri;

            try {
                const formData = new FormData();
                const filename = uri.split('/').pop() || `upload-${Date.now()}`;
                const ext = filename.split('.').pop()?.toLowerCase() || '';
                const path = `${Date.now()}.${ext}`;

                let contentType = 'application/octet-stream';
                if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
                    contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
                } else if (['mp4', 'mov', 'm4v'].includes(ext)) {
                    contentType = `video/${ext === 'mov' ? 'quicktime' : (ext === 'm4v' ? 'x-m4v' : ext)}`;
                }

                formData.append('file', {
                    uri,
                    name: filename,
                    type: contentType
                } as any);

                const { data, error } = await supabase.storage
                    .from('cbn_app_media')
                    .upload(path, formData, { contentType });

                if (!error && data) {
                    return supabase.storage.from('cbn_app_media').getPublicUrl(path).data.publicUrl;
                }
                if (error) console.error('Upload error', error);
            } catch (e) {
                console.error('Upload failed', e);
            }
            return undefined;
        };

        if (imageUrl) finalImageUrl = await uploadMedia(imageUrl);
        if (videoUrl) finalVideoUrl = await uploadMedia(videoUrl);

        const { data, error } = await supabase
            .from('cbn_app_news')
            .insert([{
                headline,
                content,
                image_url: finalImageUrl,
                video_url: finalVideoUrl,
                link_url: linkUrl,
                link_text: linkText,
                author_id: authorId
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            id: data.id.toString(),
            author_name: authorName // We might want to join profiles to get this, but for now pass it through
        } as NewsArticle;
    },
    update: async (id: string, content: string): Promise<void> => {
        const { error } = await supabase
            .from('cbn_app_news')
            .update({ content })
            .eq('id', id);

        if (error) throw error;
    },

    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('cbn_app_news')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
