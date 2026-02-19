import { supabase } from './supabaseClient';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import * as ImageManipulator from 'expo-image-manipulator';

const compressImage = async (uri: string): Promise<string> => {
    try {
        const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1080 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        return result.uri;
    } catch (error) {
        console.warn('[MediaService] Image compression failed, using original:', error);
        return uri;
    }
};

export const mediaService = {
    uploadMedia: async (uri: string): Promise<string | undefined> => {
        if (!uri.startsWith('file://') && !uri.startsWith('content://')) return uri;

        try {
            console.log(`[MediaService] Starting robust upload for: ${uri}`);

            let uploadUri = uri;

            // Check if it's likely an image to compress
            const isImage = /\.(jpg|jpeg|png|heic|bmp|webp)$/i.test(uri);
            if (isImage) {
                console.log('[MediaService] Detected image, attempting compression...');
                uploadUri = await compressImage(uri);
            }

            // 0. Pre-check file size to avoid memory crashes
            const fileInfo = await FileSystem.getInfoAsync(uploadUri);
            if (!fileInfo.exists) {
                // If compressed file doesn't exist (weird), fallback to original? 
                // Checks should be robust.
                throw new Error('File does not exist');
            }

            // If we compressed it, it should be small. If it's a video, check limit.
            const MAX_SIZE_MB = 50;
            const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

            if (fileInfo.size > MAX_SIZE_BYTES) {
                const sizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
                throw new Error(`File is too large (${sizeMB}MB). Limit is ${MAX_SIZE_MB}MB.`);
            }

            // 1. Read file as Base64 string
            const base64 = await FileSystem.readAsStringAsync(uploadUri, {
                encoding: 'base64',
            });

            // 2. Convert Base64 to ArrayBuffer
            const arrayBuffer = decode(base64);

            console.log(`[MediaService] File read successfully. Buffer size: ${arrayBuffer.byteLength}`);

            if (arrayBuffer.byteLength === 0) {
                throw new Error('File size is 0 bytes');
            }

            // 3. Generate filename
            // Use original extension if possible or jpg if compressed
            const originalExt = uri.split('.').pop()?.toLowerCase() || '';
            const finalExt = isImage ? 'jpg' : originalExt;
            const path = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${finalExt}`;

            // 4. Determine Content-Type
            let contentType = 'application/octet-stream';
            if (isImage) {
                contentType = 'image/jpeg'; // Since we convert to JPEG
            } else if (['mp4', 'mov', 'm4v', '3gp', 'mkv'].includes(originalExt)) {
                if (originalExt === 'mov') contentType = 'video/quicktime';
                else if (originalExt === 'm4v') contentType = 'video/x-m4v';
                else contentType = `video/${originalExt}`;
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
