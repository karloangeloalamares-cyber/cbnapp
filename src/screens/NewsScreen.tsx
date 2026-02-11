import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Image, Pressable, Linking, RefreshControl, Platform, Alert, Modal, TouchableWithoutFeedback, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { newsService } from '../services/newsService';
import { reactionService } from '../services/reactionService';
import { postViewsService } from '../services/postViewsService';
import { NewsArticle, ReactionType } from '../types';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { MessageBubble } from '../components/MessageBubble';
import { SelectionHeader } from '../components/SelectionHeader';
import * as Clipboard from 'expo-clipboard';
import { downloadAsync, cacheDirectory } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const getDateKey = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const formatDateLabel = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
        return 'Today';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    }
};

const DateSeparator = ({ label }: { label: string }) => (
    <View style={styles.dateSeparatorContainer}>
        <View style={styles.dateSeparatorBadge}>
            <Text style={styles.dateSeparatorText}>{label}</Text>
        </View>
    </View>
);

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

type ListItem =
    | { type: 'date'; label: string; key: string }
    | { type: 'article'; article: NewsArticle; key: string };

export const NewsScreen = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    // Background Pattern (Placeholder for Doodle)
    // We can use the theme background which is now Beige #EFE7DE

    const [news, setNews] = useState<NewsArticle[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [reactionSummary, setReactionSummary] = useState<Record<string, ReactionSummary>>({});
    const [viewSummary, setViewSummary] = useState<Record<string, ViewSummary>>({});
    const [reactionPickerTargetId, setReactionPickerTargetId] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const { user } = useAuth();
    const isAdmin = authService.isAdmin(user);
    const canReact = !!user && !isAdmin;
    const canTrackView = !!user && !isAdmin;
    const showViewCount = isAdmin;

    const loadNews = async () => {
        const articles = await newsService.getAll();
        // Reverse for inverted list (oldest first in array -> becomes top of inverted list)
        // Wait, inverted list means bottom is index 0. So latest should be index 0. 
        // newsService.getAll() returns latest first (ORDER BY created_at DESC).
        // So index 0 is latest. Inverted list renders index 0 at the bottom.
        // So we want the array to be [Latest, ..., Oldest]. 
        setNews(articles);
        await loadReactions(articles);
        await loadViews(articles);
    };

    useEffect(() => {
        loadNews();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNews();
        setRefreshing(false);
    };

    const loadReactions = async (articles: NewsArticle[]) => {
        try {
            const reactions = await reactionService.getForTargets('news', articles.map((item) => item.id));
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

    const loadViews = async (articles: NewsArticle[]) => {
        try {
            const views = await postViewsService.getForTargets('news', articles.map((item) => item.id));
            const summary: Record<string, ViewSummary> = {};

            articles.forEach((article) => {
                summary[article.id] = { count: 0, hasViewed: false };
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
                await reactionService.remove('news', targetId, user.id);
                updateReactionSummary(targetId, undefined, currentReaction);
                return;
            }

            if (currentReaction) {
                await reactionService.remove('news', targetId, user.id);
            }

            await reactionService.add('news', targetId, user.id, reaction);
            updateReactionSummary(targetId, reaction, currentReaction);
        } catch (error) {
            Alert.alert('Error', 'Failed to update reaction. Please try again.');
        }
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
        const selectedArticles = news.filter((item) => selectedItems.has(item.id));
        const textToCopy = selectedArticles.map((item) => {
            const parts: string[] = [];
            if (item.content) parts.push(item.content);
            if (item.image_url) parts.push(item.image_url);
            if (item.link_url) parts.push(item.link_url);
            return parts.join('\n');
        }).join('\n\n');
        await Clipboard.setStringAsync(textToCopy);
        Alert.alert('Copied', 'Messages copied to clipboard');
        clearSelection();
    };

    const handleDelete = async () => {
        if (!isAdmin) {
            Alert.alert('Permission Denied', 'Only admins can delete messages.');
            return;
        }

        Alert.alert(
            'Delete Messages',
            `Are you sure you want to delete ${selectedItems.size} message(s)?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        // Optimistic update
                        const idsToDelete = Array.from(selectedItems);
                        setNews((prev) => prev.filter((item) => !selectedItems.has(item.id)));
                        clearSelection();

                        // Actual delete calls
                        for (const id of idsToDelete) {
                            await newsService.delete(id);
                        }
                    }
                }
            ]
        );
    };

    const handleOpenDetail = async (article: NewsArticle) => {
        if (selectedItems.size > 0) {
            toggleSelection(article.id);
            return;
        }

        if (canTrackView && user && !viewSummary[article.id]?.hasViewed) {
            try {
                await postViewsService.add('news', article.id, user.id);
                updateViewSummary(article.id);
            } catch (error: any) {
                if (error?.code !== '23505') {
                    console.warn('Failed to add view', error);
                }
            }
        }
        // No detail view needed for WhatsApp style usually, but keeping logic just in case
        // The user said "no need to long press a content to view it". 
        // Maybe we just don't do anything on press?
    };

    const openReactionPicker = (targetId: string) => {
        if (selectedItems.size > 0) return;
        if (!canReact) return;
        setReactionPickerTargetId(targetId);
    };

    const closeReactionPicker = () => {
        setReactionPickerTargetId(null);
    };

    const listData = useMemo<ListItem[]>(() => {
        const result: ListItem[] = [];
        let lastDateKey = '';

        // For inverted list, we want the "latest" at the bottom.
        // The `news` array is sorted by DESC (latest first).
        // FlatList inverted renders index 0 at the BOTTOM. 
        // So passing `news` directly to inverted list will put the LATEST item at the BOTTOM. Correct.
        // However, we need to insert Date Headers.
        // In an inverted list, headers appear "above" the items they precede in the source array?
        // No, visual top is end of list. 
        // Let's iterate normally through the sorted (DESC) array.
        // Today, Yesterday, etc.
        // [Latest Post (Today), ..., Oldest Post (Last Week)]
        // Rendered Inverted: Oldest ... Latest.

        // Date headers need to be inserted.
        // If we have [Post A (Today), Post B (Today), Post C (Yesterday)]
        // Inverted Rendering (Visual Bottom to Top):
        // Post A
        // Post B
        // Date Header (Today)
        // Post C
        // Date Header (Yesterday)

        // So we iterate through `news` and when date changes, we insert a header AFTER the group?
        // Actually, let's keep it simple.

        const sortedNews = [...news]; // Latest first

        for (let i = 0; i < sortedNews.length; i++) {
            const article = sortedNews[i];
            const dateKey = getDateKey(article.created_at);

            result.push({
                type: 'article',
                article,
                key: article.id,
            });

            // Check if next item has different date, or if this is the last item
            const nextArticle = sortedNews[i + 1];
            const nextDateKey = nextArticle ? getDateKey(nextArticle.created_at) : '';

            if (dateKey !== nextDateKey) {
                result.push({
                    type: 'date',
                    label: formatDateLabel(article.created_at),
                    key: `date-${dateKey}`,
                });
            }
        }

        return result;
    }, [news]);

    const renderItem = ({ item }: { item: ListItem }) => {
        if (item.type === 'date') {
            return <DateSeparator label={item.label} />;
        }

        const reactionData = reactionSummary[item.article.id];
        const reactionContent = (
            <View style={styles.bubbleReactions}>
                {REACTIONS.filter((r) => (reactionData?.counts?.[r.key] || 0) > 0).map((r) => (
                    <Text key={r.key} style={styles.reactionEmojiSmall}>{r.emoji} <Text style={styles.reactionCountText}>{reactionData?.counts?.[r.key]}</Text></Text>
                ))}
            </View>
        );

        const isSelected = selectedItems.has(item.article.id);

        return (
            <MessageBubble
                content={item.article.content || ''}
                image_url={item.article.image_url}
                link_url={item.article.link_url}
                created_at={item.article.created_at}
                author_name={item.article.author_name || 'Admin'}
                isAdmin={true} // All news are admin posts
                showViewCount={showViewCount}
                viewCount={viewSummary[item.article.id]?.count || 0}
                reactions={reactionContent}
                selected={isSelected}
                onLongPress={() => toggleSelection(item.article.id)}
                onPress={() => handleOpenDetail(item.article)}
            />
        );
    };

    const handleForward = async () => {
        const selectedArticles = news.filter((item) => selectedItems.has(item.id));

        // For a single item with an image, share the image file + text
        if (selectedArticles.length === 1 && selectedArticles[0].image_url) {
            const article = selectedArticles[0];
            try {
                const localFile = `${cacheDirectory}share_${article.id}.jpg`;
                const { uri } = await downloadAsync(article.image_url, localFile);

                if (await Sharing.isAvailableAsync()) {
                    // Copy caption to clipboard so user can paste it after sharing the image
                    const captionParts = [article.content, article.link_url].filter(Boolean);
                    if (captionParts.length > 0) {
                        await Clipboard.setStringAsync(captionParts.join('\n'));
                    }
                    await Sharing.shareAsync(uri, {
                        dialogTitle: article.content?.slice(0, 60) || 'Share News',
                        mimeType: 'image/jpeg',
                        UTI: 'public.jpeg',
                    });
                    if (captionParts.length > 0) {
                        Alert.alert('Tip', 'Caption copied to clipboard — paste it in your message.');
                    }
                } else {
                    const parts = [article.content, article.image_url, article.link_url].filter(Boolean);
                    await Share.share({ message: parts.join('\n\n'), title: 'Share News' });
                }
                clearSelection();
                return;
            } catch (error: any) {
                Alert.alert('Image share failed', error?.message || String(error));
            }
        }

        // Text-only share (multiple items or no image)
        const textToShare = selectedArticles.map((item) => {
            const parts: string[] = [];
            if (item.content) parts.push(item.content);
            if (item.image_url) parts.push(item.image_url);
            if (item.link_url) parts.push(item.link_url);
            return parts.join('\n');
        }).join('\n\n----------------\n\n');

        try {
            await Share.share({ message: textToShare, title: 'Share News' });
            clearSelection();
        } catch (error) {
            Alert.alert('Error', 'Failed to share content.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.wallpaper} />
            {selectedItems.size > 0 && (
                <SelectionHeader
                    selectedCount={selectedItems.size}
                    onClearSelection={clearSelection}
                    onDelete={handleDelete}
                    onCopy={handleCopy}
                    onForward={handleForward}
                />
            )}
            <FlatList
                data={listData}
                keyExtractor={(item) => item.key}
                renderItem={renderItem}
                contentContainerStyle={[styles.listContent, { paddingTop: insets.bottom + 80 }]}
                inverted
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                    />
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
        backgroundColor: '#EFE7DE', // WhatsApp-like background
    },
    wallpaper: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.06,
        backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', // Placeholder pattern if web, won't work in RN native directly without ImageBackground but good enough for now
        backgroundColor: '#E5DDD5',
    },
    listContent: {
        paddingVertical: 10,
        paddingHorizontal: 6,
    },
    dateSeparatorContainer: {
        alignItems: 'center',
        marginVertical: 8,
        marginBottom: 12,
    },
    dateSeparatorBadge: {
        backgroundColor: '#E1F2FB',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },
    dateSeparatorText: {
        fontSize: 12,
        color: '#555',
        fontWeight: '500',
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
