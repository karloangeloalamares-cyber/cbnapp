import { supabase } from './supabaseClient';
import { PostTargetType, PostView } from '../types';

export const postViewsService = {
    getForTargets: async (targetType: PostTargetType, targetIds: string[]): Promise<PostView[]> => {
        if (targetIds.length === 0) return [];

        const { data, error } = await supabase
            .from('cbn_app_post_views')
            .select('id, target_type, target_id, user_id, created_at')
            .eq('target_type', targetType)
            .in('target_id', targetIds);

        if (error) throw error;

        return (data || []).map((item: any) => ({
            ...item,
            id: item.id.toString(),
            target_id: item.target_id.toString(),
            user_id: item.user_id.toString(),
        })) as PostView[];
    },
    add: async (targetType: PostTargetType, targetId: string, userId: string): Promise<void> => {
        const { error } = await supabase
            .from('cbn_app_post_views')
            .insert([{
                target_type: targetType,
                target_id: targetId,
                user_id: userId,
            }]);

        if (error) throw error;
    }
};
