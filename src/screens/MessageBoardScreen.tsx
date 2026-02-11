import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Platform, Pressable, Modal, TouchableWithoutFeedback, Share, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { announcementService } from '../services/announcementService';
import { reactionService } from '../services/reactionService';
import { postViewsService } from '../services/postViewsService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Announcement, ReactionType } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { MessageBubble } from '../components/MessageBubble';
import { SelectionHeader } from '../components/SelectionHeader';
import * as Clipboard from 'expo-clipboard';

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
type ViewSummary = { count: number; hasViewed: boolean };

interface Props {
    embedded?: boolean;
}

export const MessageBoardScreen = ({ embedded = false }: Props) => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [reactionSummary, setReactionSummary] = useState<Record<string, ReactionSummary>>({});
    const [viewSummary, setViewSummary] = useState<Record<string, ViewSummary>>({});
    const [reactionPickerTargetId, setReactionPickerTargetId] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    const isAdmin = authService.isAdmin(user);
    const canReact = !!user && !isAdmin;
    const canTrackView = !!user && !isAdmin;
    const showViewCount = isAdmin;

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        const data = await announcementService.getAll();
        setAnnouncements(data);
        await loadReactions(data);
        await loadViews(data);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAnnouncements();
        setRefreshing(false);
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

    const loadViews = async (items: Announcement[]) => {
        try {
            const views = await postViewsService.getForTargets('announcement', items.map((item) => item.id));
            const summary: Record<string, ViewSummary> = {};

            items.forEach((item) => {
                summary[item.id] = { count: 0, hasViewed: false };
            });

            views.forEach((view) => {
                if (!summary[view.target_id]) {
                    summary[view.target_id] = { count: 0, hasViewed: false };
                }
                summary[view.target_id].count += 1;
                if (view.user_id === user?.id) {
                    summary[view.target_id].hasViewed = true;
                }
            });

            setViewSummary(summary);
        } catch (error) {
            console.warn('Failed to load views', error);
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
            console.warn('Reaction error', error);
        }
    };

    const openReactionPicker = (targetId: string) => {
        if (selectedItems.size > 0) return;
        if (!canReact) return;
        setReactionPickerTargetId(targetId);
    };

    const closeReactionPicker = () => {
        setReactionPickerTargetId(null);
    };

    const toggleSelection = (id: string) => {
        setSelectedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const clearSelection = () => {
        setSelectedItems(new Set());
    };

    const handleCopy = async () => {
        const selectedAnnouncements = announcements.filter((item) => selectedItems.has(item.id));
        const textToCopy = selectedAnnouncements.map((item) => item.content).join('\n\n');
        await Clipboard.setStringAsync(textToCopy);
        Alert.alert('Copied', 'Announcements copied to clipboard');
        clearSelection();
    };

    const handleForward = async () => {
        const selectedAnnouncements = announcements.filter((item) => selectedItems.has(item.id));
        const textToShare = selectedAnnouncements
            .map((item) => `${item.title}\n\n${item.content}`)
            .join('\n\n----------------\n\n');

        try {
            await Share.share({
                message: textToShare,
                title: 'Share Announcements'
            });
            clearSelection();
        } catch (error) {
            Alert.alert('Error', 'Failed to share content.');
        }
    };

    const handleDelete = async () => {
        if (!isAdmin) {
            Alert.alert('Permission Denied', 'Only admins can delete announcements.');
            return;
        }

        Alert.alert(
            'Delete Announcements',
            `Are you sure you want to delete ${selectedItems.size} announcement(s)?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        // Optimistic update
                        const idsToDelete = Array.from(selectedItems);
                        setAnnouncements((prev) => prev.filter((item) => !selectedItems.has(item.id)));
                        clearSelection();

                        // Actual delete calls
                        for (const id of idsToDelete) {
                            await announcementService.delete(id);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Announcement }) => {
        const reactionData = reactionSummary[item.id];
        const reactionContent = (
            <View style={styles.bubbleReactions}>
                {REACTIONS.filter((r) => (reactionData?.counts?.[r.key] || 0) > 0).map((r) => (
                    <Text key={r.key} style={styles.reactionEmojiSmall}>{r.emoji} <Text style={styles.reactionCountText}>{reactionData?.counts?.[r.key]}</Text></Text>
                ))}
            </View>
        );

        const isSelected = selectedItems.has(item.id);

        return (
            <MessageBubble
                content={`**${item.title}**\n\n${item.content}`}
                created_at={item.created_at}
                author_name={'Announcement'} // Or item.author_name if available
                isAdmin={true}
                showViewCount={showViewCount}
                viewCount={viewSummary[item.id]?.count || 0}
                reactions={reactionContent}
                selected={isSelected}
                onLongPress={() => toggleSelection(item.id)}
                onPress={() => {
                    if (selectedItems.size > 0) {
                        toggleSelection(item.id);
                    }
                }}
            />
        );
    };

    return (
        <View style={styles.container}>
            {/* Header - only show if not embedded (e.g. standalone screen) */}
            {!embedded && selectedItems.size === 0 && (
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

            {selectedItems.size > 0 && (
                <SelectionHeader
                    selectedCount={selectedItems.size}
                    onClearSelection={clearSelection}
                    onDelete={handleDelete}
                    onCopy={handleCopy}
                    onForward={handleForward}
                />
            )}

            {/* Admin Button */}
            {!embedded && isAdmin && (
                <TouchableOpacity
                    style={styles.adminButton}
                    onPress={() => navigation.navigate('AdminPost')}
                >
                    <Text style={styles.adminButtonText}>+ New Announcement</Text>
                </TouchableOpacity>
            )}

            <FlatList
                data={announcements}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.list,
                    {
                        paddingTop: insets.bottom + 10,
                        paddingBottom: insets.top + 10
                    }
                ]}
                inverted
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
        backgroundColor: '#EFE7DE', // Same background
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
        paddingVertical: 10,
        paddingHorizontal: 6,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginTop: 40,
        fontSize: 16,
    },
    bubbleReactions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    reactionEmojiSmall: {
        fontSize: 12,
    },
    reactionCountText: {
        fontSize: 10,
        color: '#777',
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
});
