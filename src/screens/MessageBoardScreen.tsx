import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Platform,
    Pressable,
    Modal,
    TouchableWithoutFeedback,
    Share,
    Alert,
    KeyboardAvoidingView,
    Keyboard
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { announcementService } from '../services/announcementService';
import { reactionService } from '../services/reactionService';
import { postViewsService } from '../services/postViewsService';
import { savedItemsService } from '../services/savedItemsService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Announcement, ReactionType } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { MessageCard } from '../components/MessageCard';
import { SelectionHeader } from '../components/SelectionHeader';
import { FormattingHeader } from '../components/FormattingHeader';
import { Composer } from '../components/Composer';
import * as Clipboard from 'expo-clipboard';
import { PostOptionsModal } from '../components/PostOptionsModal';

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
    const { theme } = useTheme();
    const themedStyles = useMemo(() => createStyles(theme), [theme]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [reactionSummary, setReactionSummary] = useState<Record<string, ReactionSummary>>({});
    const [viewSummary, setViewSummary] = useState<Record<string, ViewSummary>>({});
    const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set());
    const [reactionPickerTargetId, setReactionPickerTargetId] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [longPressedItemId, setLongPressedItemId] = useState<string | null>(null);

    const isAdmin = authService.isAdmin(user);
    const canTrackView = !!user && !isAdmin;
    const canSave = !!user && !isAdmin;
    const showViewCount = isAdmin;

    // Formatting state
    const [isFormatting, setIsFormatting] = useState(false);
    const composerRef = React.useRef<any>(null);

    // Manual keyboard height tracking for Android (Expo Go doesn't support adjustResize)
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    useEffect(() => {
        if (Platform.OS !== 'android') return;
        const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
        });
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        const data = await announcementService.getAll();
        setAnnouncements(data);
        await loadReactions(data);
        await loadViews(data);
        await loadSavedItems(data);
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

    const loadSavedItems = async (items: Announcement[]) => {
        if (!canSave || !user) {
            setSavedItemIds(new Set());
            return;
        }

        try {
            const saved = await savedItemsService.getForTargets(
                user.id,
                'announcement',
                items.map((item) => item.id)
            );
            setSavedItemIds(new Set(saved.map((item) => item.target_id)));
        } catch (error) {
            console.warn('Failed to load saved announcements', error);
        }
    };

    const updateViewSummary = (targetId: string) => {
        setViewSummary((prev) => {
            const existing = prev[targetId] || { count: 0, hasViewed: false };
            if (existing.hasViewed) return prev;

            return {
                ...prev,
                [targetId]: {
                    count: existing.count + 1,
                    hasViewed: true,
                },
            };
        });
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
        const textToCopy = selectedAnnouncements
            .map((item) => (item.title ? `${item.title}\n\n${item.content}` : item.content))
            .join('\n\n');
        await Clipboard.setStringAsync(textToCopy);
        Alert.alert('Copied', 'Announcements copied to clipboard');
        clearSelection();
    };

    const performForward = async (items: Announcement[]) => {
        const textToShare = items
            .map((item) => `${item.title || 'Announcement'}\n\n${item.content}`)
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

    const handleForward = async () => {
        const selectedAnnouncements = announcements.filter((item) => selectedItems.has(item.id));
        await performForward(selectedAnnouncements);
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

    const handleOpenAnnouncement = async (announcement: Announcement) => {
        if (selectedItems.size > 0) {
            toggleSelection(announcement.id);
            return;
        }

        if (canTrackView && user && !viewSummary[announcement.id]?.hasViewed) {
            try {
                await postViewsService.add('announcement', announcement.id, user.id);
                updateViewSummary(announcement.id);
            } catch (error: any) {
                if (error?.code !== '23505') {
                    console.warn('Failed to add announcement view', error);
                }
            }
        }
    };

    const handleToggleSaved = async (targetId: string) => {
        if (!canSave || !user) return;

        const isSaved = savedItemIds.has(targetId);
        setSavedItemIds((prev) => {
            const next = new Set(prev);
            if (isSaved) {
                next.delete(targetId);
            } else {
                next.add(targetId);
            }
            return next;
        });

        try {
            if (isSaved) {
                await savedItemsService.remove('announcement', targetId, user.id);
            } else {
                await savedItemsService.add('announcement', targetId, user.id);
            }
        } catch (error) {
            console.error('Failed to toggle save:', error);
            setSavedItemIds((prev) => {
                const next = new Set(prev);
                if (isSaved) {
                    next.add(targetId);
                } else {
                    next.delete(targetId);
                }
                return next;
            });
            Alert.alert('Error', 'Failed to update saved items.');
        }
    };

    const renderItem = ({ item }: { item: Announcement }) => {
        const reactionData = reactionSummary[item.id];
        const reactionContent = (
            <View style={themedStyles.bubbleReactions}>
                {REACTIONS.filter((r) => (reactionData?.counts?.[r.key] || 0) > 0).map((r) => (
                    <Text key={r.key} style={themedStyles.reactionEmojiSmall}>
                        {r.emoji} <Text style={themedStyles.reactionCountText}>{reactionData?.counts?.[r.key]}</Text>
                    </Text>
                ))}
            </View>
        );

        const isSelected = selectedItems.has(item.id);

        return (
            <MessageCard
                title={item.title || undefined}
                content={item.content}
                created_at={item.created_at}
                author_name={item.author_name || 'Announcement'}
                variant="announcement"
                showViewCount={showViewCount}
                viewCount={viewSummary[item.id]?.count || 0}
                reactions={reactionContent}
                isSelected={isSelected}
                isSaved={savedItemIds.has(item.id)}
                showSaveButton={canSave && selectedItems.size === 0}
                onToggleSave={() => handleToggleSaved(item.id)}
                onLongPress={() => setLongPressedItemId(item.id)}
                onPress={() => handleOpenAnnouncement(item)}
            />
        );
    };

    return (
        <View style={[themedStyles.container, { backgroundColor: theme.colors.background }]}>
            <KeyboardAvoidingView
                style={[
                    { flex: 1 },
                    Platform.OS === 'android' && keyboardHeight > 0 && { paddingBottom: keyboardHeight }
                ]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Header - only show if not embedded (e.g. standalone screen) */}
                {!embedded && selectedItems.size === 0 && (
                    <View style={[themedStyles.header, { backgroundColor: theme.colors.header, borderBottomColor: theme.colors.border }]}>
                        <View>
                            <Text style={[themedStyles.headerTitle, { color: theme.colors.text }]}>CBN Announcements</Text>
                            <Text style={[themedStyles.headerSubtitle, { color: theme.colors.textSecondary }]}>Welcome, {user?.display_name}</Text>
                        </View>
                        <TouchableOpacity onPress={logout} style={[themedStyles.logoutBtn, { backgroundColor: theme.colors.surface }]}>
                            <Text style={[themedStyles.logoutText, { color: theme.colors.textSecondary }]}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Text Formatting Header */}
                {isFormatting && (
                    <FormattingHeader
                        onFormat={(marker) => composerRef.current?.applyFormat(marker)}
                        onClear={() => {
                            Keyboard.dismiss();
                        }}
                    />
                )}

                {selectedItems.size > 0 && !isFormatting && (
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
                        style={[themedStyles.adminButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => navigation.navigate('AdminPost')}
                    >
                        <Text style={themedStyles.adminButtonText}>+ New Announcement</Text>
                    </TouchableOpacity>
                )}

                <FlatList
                    data={announcements}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        themedStyles.list,
                        {
                            paddingTop: insets.bottom + 10,
                            paddingBottom: 100 // Space for composer + tab bar
                        }
                    ]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                    }
                    ListEmptyComponent={
                        <Text style={[themedStyles.emptyText, { color: theme.colors.textSecondary }]}>No announcements yet.</Text>
                    }
                />

                {/* Admin Composer */}
                {isAdmin && (
                    <Composer
                        ref={composerRef}
                        type="announcement"
                        onSelectionChange={(sel) => {
                            setIsFormatting(sel.start !== sel.end);
                        }}
                        onSend={async (text, _) => {
                            const content = text.trim();

                            // Optimistic Update
                            const tempId = Math.random().toString();
                            const newAnnouncement: Announcement = {
                                id: tempId,
                                title: '',
                                content,
                                author_id: user!.id,
                                author_name: user!.display_name,
                                created_at: new Date().toISOString(),
                            };

                            setAnnouncements(prev => [newAnnouncement, ...prev]);

                            try {
                                const created = await announcementService.create(
                                    '',
                                    content,
                                    user!.id,
                                    user!.display_name
                                );
                                // Replace temp with real
                                setAnnouncements(prev => prev.map(a => a.id === tempId ? created : a));
                            } catch (error) {
                                console.error('Failed to post announcement:', error);
                                Alert.alert('Error', 'Failed to post announcement.');
                                setAnnouncements(prev => prev.filter(a => a.id !== tempId));
                            }
                        }}
                    />
                )}
            </KeyboardAvoidingView>

            <Modal
                visible={!!reactionPickerTargetId}
                transparent
                animationType="fade"
                onRequestClose={closeReactionPicker}
            >
                <TouchableWithoutFeedback onPress={closeReactionPicker}>
                    <View style={themedStyles.reactionPickerOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={[themedStyles.reactionPickerCard, { backgroundColor: theme.colors.surface }]}>
                                <View style={themedStyles.reactionPickerRow}>
                                    {REACTIONS.map((reaction) => (
                                        <Pressable
                                            key={reaction.key}
                                            style={themedStyles.reactionPickerButton}
                                            onPress={() => {
                                                if (reactionPickerTargetId) {
                                                    handleReact(reactionPickerTargetId, reaction.key);
                                                }
                                                closeReactionPicker();
                                            }}
                                        >
                                            <Text style={themedStyles.reactionPickerEmoji}>{reaction.emoji}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <PostOptionsModal
                visible={!!longPressedItemId}
                onClose={() => setLongPressedItemId(null)}
                onSave={async () => {
                    if (longPressedItemId) {
                        await handleToggleSaved(longPressedItemId);
                        setLongPressedItemId(null);
                    }
                }}
                onForward={() => {
                    const item = announcements.find(a => a.id === longPressedItemId);
                    if (item) {
                        performForward([item]);
                        setLongPressedItemId(null);
                    }
                }}
                onCopy={async () => {
                    const item = announcements.find(a => a.id === longPressedItemId);
                    if (item) {
                        const text = item.title ? `${item.title}\n\n${item.content}` : item.content;
                        await Clipboard.setStringAsync(text);
                        Alert.alert('Copied', 'Announcement copied to clipboard');
                    }
                    setLongPressedItemId(null);
                }}
                isSaved={longPressedItemId ? savedItemIds.has(longPressedItemId) : false}
            />
        </View>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
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
        fontFamily: 'Inter',
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 2,
        fontFamily: 'Inter',
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
        fontFamily: 'Inter',
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
        fontFamily: 'Inter',
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
        fontFamily: 'Inter',
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
        color: theme.colors.textSecondary,
    },
    reactionPickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reactionPickerCard: {
        backgroundColor: theme.colors.surface,
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
