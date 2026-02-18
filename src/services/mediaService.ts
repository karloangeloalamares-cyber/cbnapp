import { supabase } from './supabaseClient';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export const mediaService = {
    uploadMedia: async (uri: string): Promise<string | undefined> => {
        if (!uri.startsWith('file://') && !uri.startsWith('content://')) return uri;

        try {
            console.log(`[MediaService] Starting robust upload for: ${uri}`);

            // 0. Pre-check file size to avoid memory crashes
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (!fileInfo.exists) {
                throw new Error('File does not exist');
            }

            const MAX_SIZE_MB = 50;
            const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

            if (fileInfo.size > MAX_SIZE_BYTES) {
                const sizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
                throw new Error(`File is too large (${sizeMB}MB). Limit is ${MAX_SIZE_MB}MB.`);
            }

            // 1. Read file as Base64 string
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            // 2. Convert Base64 to ArrayBuffer
            const arrayBuffer = decode(base64);

            console.log(`[MediaService] File read successfully. Buffer size: ${arrayBuffer.byteLength}`);

            if (arrayBuffer.byteLength === 0) {
                throw new Error('File size is 0 bytes');
            }

            // 3. Generate filename
            const filename = uri.split('/').pop() || `upload-${Date.now()}`;
            const ext = filename.split('.').pop()?.toLowerCase() || '';
            const path = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;

            // 4. Determine Content-Type
            let contentType = 'application/octet-stream';
            if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
                contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            } else if (['mp4', 'mov', 'm4v', '3gp', 'mkv'].includes(ext)) {
                if (ext === 'mov') contentType = 'video/quicktime';
                else if (ext === 'm4v') contentType = 'video/x-m4v';
                else contentType = `video/${ext}`;
            }

            // 5. Upload ArrayBuffer to Supabase
            console.log(`[MediaService] Uploading to ${path}...`);
            const { data, error } = await supabase.storage
                .from('cbn_app_media')
                .upload(path, arrayBuffer, {
                    contentType,
                    upsert: true,
                });

            if (error) {
                console.error('[MediaService] Supabase upload error:', error);
                throw error;
            }

            if (data) {
                const publicUrl = supabase.storage.from('cbn_app_media').getPublicUrl(path).data.publicUrl;
                console.log(`[MediaService] Upload successful! Public URL: ${publicUrl}`);
                return publicUrl;
            }

        } catch (e: any) {
            console.error('[MediaService] Upload failed:', e);
            // Fallback for huge files or memory issues:
            // return undefined to let the UI know it failed
        }
        return undefined;
    }
};
