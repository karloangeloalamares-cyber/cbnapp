import { supabase } from './supabaseClient';
import { SavedItem, SavedTargetType } from '../types';

export const savedItemsService = {
    getAllForUser: async (userId: string): Promise<SavedItem[]> => {
        const { data, error } = await supabase
            .from('cbn_app_saved_items')
            .select('id, target_type, target_id, user_id, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((item: any) => ({
            ...item,
            id: item.id.toString(),
            target_id: item.target_id.toString(),
            user_id: item.user_id.toString(),
        })) as SavedItem[];
    },
    getForTargets: async (
        userId: string,
        targetType: SavedTargetType,
        targetIds: string[]
    ): Promise<SavedItem[]> => {
        if (targetIds.length === 0) return [];

        const { data, error } = await supabase
            .from('cbn_app_saved_items')
            .select('id, target_type, target_id, user_id, created_at')
            .eq('user_id', userId)
            .eq('target_type', targetType)
            .in('target_id', targetIds);

        if (error) throw error;

        return (data || []).map((item: any) => ({
            ...item,
            id: item.id.toString(),
            target_id: item.target_id.toString(),
            user_id: item.user_id.toString(),
        })) as SavedItem[];
    },
    add: async (targetType: SavedTargetType, targetId: string, userId: string): Promise<void> => {
        const { error } = await supabase
            .from('cbn_app_saved_items')
            .insert([{
                target_type: targetType,
                target_id: targetId,
                user_id: userId,
            }]);

        if (error) throw error;
    },
    remove: async (targetType: SavedTargetType, targetId: string, userId: string): Promise<void> => {
        const { error } = await supabase
            .from('cbn_app_saved_items')
            .delete()
            .eq('target_type', targetType)
            .eq('target_id', targetId)
            .eq('user_id', userId);

        if (error) throw error;
    },
};
