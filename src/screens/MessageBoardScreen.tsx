import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert, Platform, Pressable, Modal, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { announcementService } from '../services/announcementService';
import { reactionService } from '../services/reactionService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Announcement, ReactionType } from '../types';
import { theme } from '../theme';

const REACTIONS: { key: ReactionType; emoji: string }[] = [
    { key: 'like', emoji: '👍' },
    { key: 'love', emoji: '❤️' },
    { key: 'laugh', emoji: '😂' },
    { key: 'wow', emoji: '😮' },
    { key: 'sad', emoji: '😢' },
    { key: 'thanks', emoji: '🙏' },
];

const emptyReactionCounts = (): Record<ReactionType, number> => ({
    like: 0,
    love: 0,
    laugh: 0,
    wow: 0,
    sad: 0,
    thanks: 0,
});

type ReactionSummary = { counts: Record<ReactionType, number>; userReaction?: ReactionType };

interface Props {
    embedded?: boolean;
}

export const MessageBoardScreen = ({ embedded = false }: Props) => {
    const navigation = useNavigation<any>();
    const { user, logout } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [reactionSummary, setReactionSummary] = useState<Record<string, ReactionSummary>>({});
    const [reactionPickerTargetId, setReactionPickerTargetId] = useState<string | null>(null);

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        const data = await announcementService.getAll();
        setAnnouncements(data);
        await loadReactions(data);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAnnouncements();
        setRefreshing(false);
    };

    const isAdmin = authService.isAdmin(user);
    const canReact = !!user && !isAdmin;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const loadReactions = async (items: Announcement[]) => {
        try {
            const reactions = await reactionService.getForTargets('announcement', items.map((item) => item.id));
            const summary: Record<string, ReactionSummary> = {};

            reactions.forEach((reaction) => {
                if (!summary[reaction.target_id]) {
                    summary[reaction.target_id] = {
                        counts: emptyReactionCounts(),
                        userReaction: undefined,
                    };
                }

                summary[reaction.target_id].counts[reaction.reaction] += 1;
                if (reaction.user_id === user?.id) {
                    summary[reaction.target_id].userReaction = reaction.reaction;
                }
            });

            setReactionSummary(summary);
        } catch (error) {
            console.warn('Failed to load reactions', error);
        }
    };

    const updateReactionSummary = (targetId: string, nextReaction?: ReactionType, prevReaction?: ReactionType) => {
        setReactionSummary((prev) => {
            const existing = prev[targetId] || { counts: emptyReactionCounts(), userReaction: undefined };
            const counts = { ...existing.counts };

            if (prevReaction) counts[prevReaction] = Math.max(0, counts[prevReaction] - 1);
            if (nextReaction) counts[nextReaction] = (counts[nextReaction] || 0) + 1;

            return {
                ...prev,
                [targetId]: {
                    counts,
                    userReaction: nextReaction,
                },
            };
        });
    };

    const handleReact = async (targetId: string, reaction: ReactionType) => {
        if (!user) return;
        const currentReaction = reactionSummary[targetId]?.userReaction;

        try {
            if (currentReaction === reaction) {
                await reactionService.remove('announcement', targetId, user.id);
                updateReactionSummary(targetId, undefined, currentReaction);
                return;
            }

            if (currentReaction) {
                await reactionService.remove('announcement', targetId, user.id);
            }

            await reactionService.add('announcement', targetId, user.id, reaction);
            updateReactionSummary(targetId, reaction, currentReaction);
        } catch (error) {
            Alert.alert('Error', 'Failed to update reaction. Please try again.');
        }
    };

    const openReactionPicker = (targetId: string) => {
        if (!canReact) return;
        setReactionPickerTargetId(targetId);
    };

    const closeReactionPicker = () => {
        setReactionPickerTargetId(null);
    };

    const confirmDelete = (onConfirm: () => void) => {
        if (Platform.OS === 'web') {
            const confirmFn = (globalThis as any)?.confirm as ((message: string) => boolean) | undefined;
            if (confirmFn && confirmFn('Delete this announcement?')) onConfirm();
            return;
        }
        Alert.alert('Delete Announcement', 'Delete this announcement?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onConfirm },
        ]);
    };

    const handleDelete = (id: string) => {
        confirmDelete(async () => {
            try {
                await announcementService.delete(id);
                setAnnouncements((prev) => prev.filter((item) => item.id !== id));
                setReactionSummary((prev) => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
            } catch (error) {
                Alert.alert('Error', 'Failed to delete. Please try again.');
            }
        });
    };

    const renderItem = ({ item }: { item: Announcement }) => (
        <Pressable
            style={styles.card}
            onLongPress={
                isAdmin
                    ? () => handleDelete(item.id)
                    : canReact
                        ? () => openReactionPicker(item.id)
                        : undefined
            }
            delayLongPress={350}
            disabled={!isAdmin && !canReact}
        >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardContent}>{item.content}</Text>
            <View style={styles.reactionBar}>
                {REACTIONS.filter((reaction) => (reactionSummary[item.id]?.counts?.[reaction.key] || 0) > 0).map((reaction) => {
                    const summary = reactionSummary[item.id];
                    const count = summary?.counts?.[reaction.key] || 0;
                    const isActive = summary?.userReaction === reaction.key;
                    return (
                        <Pressable
                            key={reaction.key}
                            style={[
                                styles.reactionChip,
                                isActive && styles.reactionChipActive,
                                !canReact && styles.reactionChipDisabled,
                            ]}
                            onPress={() => handleReact(item.id, reaction.key)}
                            disabled={!canReact}
                        >
                            <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                            <Text style={[styles.reactionCount, isActive && styles.reactionCountActive]}>
                                {count}
                            </Text>
                        </Pressable>
                    );
                })}
                {canReact && (
                    <Pressable style={styles.addReactionChip} onPress={() => openReactionPicker(item.id)}>
                        <Text style={styles.addReactionText}>+</Text>
                    </Pressable>
                )}
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.cardAuthor}>📢 {item.author_name}</Text>
                <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            </View>
        </Pressable>
    );



    return (
        <View style={styles.container}>
            {/* Header - only show if not embedded */}
            {!embedded && (
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>CBN Announcements</Text>
                        <Text style={styles.headerSubtitle}>Welcome, {user?.display_name}</Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Admin Button - only show if not embedded */}
            {!embedded && isAdmin && (
                <TouchableOpacity
                    style={styles.adminButton}
                    onPress={() => navigation.navigate('AdminPost')}
                >
                    <Text style={styles.adminButtonText}>+ New Announcement</Text>
                </TouchableOpacity>
            )}

            {/* Announcements List */}
            <FlatList
                data={announcements}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No announcements yet.</Text>
                }
            />

            <Modal
                visible={!!reactionPickerTargetId}
                transparent
                animationType="fade"
                onRequestClose={closeReactionPicker}
            >
                <TouchableWithoutFeedback onPress={closeReactionPicker}>
                    <View style={styles.reactionPickerOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.reactionPickerCard}>
                                <View style={styles.reactionPickerRow}>
                                    {REACTIONS.map((reaction) => (
                                        <Pressable
                                            key={reaction.key}
                                            style={styles.reactionPickerButton}
                                            onPress={() => {
                                                if (reactionPickerTargetId) {
                                                    handleReact(reactionPickerTargetId, reaction.key);
                                                }
                                                closeReactionPicker();
                                            }}
                                        >
                                            <Text style={styles.reactionPickerEmoji}>{reaction.emoji}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        backgroundColor: theme.colors.header,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    logoutBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: theme.colors.surface,
    },
    logoutText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    adminButton: {
        backgroundColor: theme.colors.primary,
        margin: 16,
        marginBottom: 8,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    adminButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    list: {
        padding: 16,
        paddingTop: 8,
        paddingBottom: 100, // Extra space for Android nav + FAB
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
    },
    cardContent: {
        fontSize: 15,
        color: theme.colors.text,
        lineHeight: 22,
        marginBottom: 12,
    },
    reactionBar: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    reactionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 14,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginRight: 6,
        marginBottom: 6,
    },
    reactionChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    reactionChipDisabled: {
        opacity: 0.6,
    },
    reactionEmoji: {
        fontSize: 14,
    },
    reactionCount: {
        marginLeft: 4,
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    reactionCountActive: {
        color: '#FFFFFF',
    },
    addReactionChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginRight: 6,
        marginBottom: 6,
    },
    addReactionText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    reactionPickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reactionPickerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 16,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    reactionPickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reactionPickerButton: {
        padding: 6,
        marginHorizontal: 6,
    },
    reactionPickerEmoji: {
        fontSize: 24,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: 10,
    },
    cardAuthor: {
        fontSize: 13,
        color: theme.colors.primary,
    },
    cardDate: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginTop: 40,
        fontSize: 16,
    }
});
