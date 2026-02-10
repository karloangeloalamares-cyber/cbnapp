import { supabase } from './supabaseClient';
import { Reaction, ReactionTargetType, ReactionType } from '../types';

export const reactionService = {
    getForTargets: async (targetType: ReactionTargetType, targetIds: string[]): Promise<Reaction[]> => {
        if (targetIds.length === 0) return [];

        const { data, error } = await supabase
            .from('cbn_app_reactions')
            .select('id, target_type, target_id, user_id, reaction, created_at')
            .eq('target_type', targetType)
            .in('target_id', targetIds);

        if (error) throw error;

        return (data || []).map((item: any) => ({
            ...item,
            id: item.id.toString(),
            target_id: item.target_id.toString(),
            user_id: item.user_id.toString(),
        })) as Reaction[];
    },
    add: async (targetType: ReactionTargetType, targetId: string, userId: string, reaction: ReactionType): Promise<void> => {
        const { error } = await supabase
            .from('cbn_app_reactions')
            .insert([{
                target_type: targetType,
                target_id: targetId,
                user_id: userId,
                reaction,
            }]);

        if (error) throw error;
    },
    remove: async (targetType: ReactionTargetType, targetId: string, userId: string): Promise<void> => {
        const { error } = await supabase
            .from('cbn_app_reactions')
            .delete()
            .eq('target_type', targetType)
            .eq('target_id', targetId)
            .eq('user_id', userId);

        if (error) throw error;
    }
};
