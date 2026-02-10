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

    create: async (
        headline: string,
        content: string,
        authorId: string,
        authorName: string,
        imageUrl?: string,
        linkUrl?: string,
        linkText?: string
    ): Promise<NewsArticle> => {
        // Upload image if it's a local URI
        let finalImageUrl = imageUrl;

        // Simple check if it's a local file (starts with file:// or content://)
        // In a real app, we'd upload this to Supabase Storage here.
        // For this demo step, we'll skip the upload implementation logic 
        // and just store the string if it's remote, or null if local (to prevent broken links)
        // unless we implement the upload.

        // IMPLEMENTING UPLOAD:
        if (imageUrl && (imageUrl.startsWith('file://') || imageUrl.startsWith('content://'))) {
            try {
                // 1. Read file (Expo FileSystem needed, or just FormData)
                const formData = new FormData();
                const filename = imageUrl.split('/').pop() || `upload-${Date.now()}.jpg`;
                const ext = filename.split('.').pop();
                const path = `${Date.now()}.${ext}`;

                formData.append('file', {
                    uri: imageUrl,
                    name: filename,
                    type: `image/${ext === 'jpg' ? 'jpeg' : ext}`
                } as any);

                const { data, error } = await supabase.storage
                    .from('cbn_app_media')
                    .upload(path, formData, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` });

                if (!error && data) {
                    const publicUrl = supabase.storage.from('cbn_app_media').getPublicUrl(path).data.publicUrl;
                    finalImageUrl = publicUrl;
                }
            } catch (e) {
                console.error('Upload failed', e);
                // Fallback: don't save image if upload fails
                finalImageUrl = undefined;
            }
        }

        const { data, error } = await supabase
            .from('cbn_app_news')
            .insert([{
                headline,
                content,
                image_url: finalImageUrl,
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
    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('cbn_app_news')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
