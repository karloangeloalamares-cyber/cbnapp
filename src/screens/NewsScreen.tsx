import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Pressable,
    RefreshControl,
    Platform,
    Alert,
    Modal,
    TouchableWithoutFeedback,
    Share,
    KeyboardAvoidingView,
    Keyboard,
    TextInput
} from 'react-native';
import { newsService } from '../services/newsService';
import { announcementService } from '../services/announcementService';
import { reactionService } from '../services/reactionService';
import { postViewsService } from '../services/postViewsService';
import { savedItemsService } from '../services/savedItemsService';
import { NewsArticle, ReactionType } from '../types';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { MessageCard } from '../components/MessageCard';
import { SelectionHeader } from '../components/SelectionHeader';
import { FormattingHeader } from '../components/FormattingHeader';
import { Composer, PostType } from '../components/Composer';
import * as Clipboard from 'expo-clipboard';
import { downloadAsync, cacheDirectory } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { PostOptionsModal } from '../components/PostOptionsModal';

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

const DateSeparator = ({ label, theme, styles }: { label: string; theme: any; styles: any }) => (
    <View style={styles.dateSeparatorContainer}>
        <View style={[styles.dateSeparatorBadge, { backgroundColor: theme.dark ? theme.colors.surface : theme.colors.surface }]}>
            <Text style={[styles.dateSeparatorText, { color: theme.colors.textSecondary }]}>{label}</Text>
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
    const { theme } = useTheme();
    const themedStyles = useMemo(() => createStyles(theme), [theme]);

    // Background Pattern (Placeholder for Doodle)
    // We can use the theme background which is now Beige #EFE7DE

    const [news, setNews] = useState<NewsArticle[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [reactionSummary, setReactionSummary] = useState<Record<string, ReactionSummary>>({});
    const [viewSummary, setViewSummary] = useState<Record<string, ViewSummary>>({});
    const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set());
    const [reactionPickerTargetId, setReactionPickerTargetId] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [longPressedItemId, setLongPressedItemId] = useState<string | null>(null);
    const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
    const [editText, setEditText] = useState('');
    const { user } = useAuth();
    const isAdmin = authService.isAdmin(user);
    const canTrackView = !!user && !isAdmin;
    const canSave = !!user && !isAdmin;
    const showViewCount = isAdmin;

    // Formatting state
    const [isFormatting, setIsFormatting] = useState(false);
    const composerRef = React.useRef<any>(null); // Use ComposerRef type if imported

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
        await loadSavedItems(articles);
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

    const loadSavedItems = async (articles: NewsArticle[]) => {
        if (!canSave || !user) {
            setSavedItemIds(new Set());
            return;
        }

        try {
            const saved = await savedItemsService.getForTargets(
                user.id,
                'news',
                articles.map((item) => item.id)
            );
            setSavedItemIds(new Set(saved.map((item) => item.target_id)));
        } catch (error) {
            console.warn('Failed to load saved items', error);
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

    const handleSingleDelete = (id: string) => {
        Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setNews(prev => prev.filter(item => item.id !== id));
                        try {
                            await newsService.delete(id);
                        } catch (error) {
                            console.error('Failed to delete:', error);
                            Alert.alert('Error', 'Failed to delete post.');
                        }
                    }
                }
            ]
        );
    };

    const handleEditStart = (article: NewsArticle) => {
        setEditingArticle(article);
        setEditText(article.content);
    };

    const handleEditSave = async () => {
        if (!editingArticle) return;
        const trimmed = editText.trim();
        if (!trimmed) return;

        // Optimistic update
        setNews(prev => prev.map(item =>
            item.id === editingArticle.id ? { ...item, content: trimmed } : item
        ));
        setEditingArticle(null);

        try {
            await newsService.update(editingArticle.id, trimmed);
        } catch (error) {
            console.error('Failed to update:', error);
            Alert.alert('Error', 'Failed to update post.');
            // Revert
            setNews(prev => prev.map(item =>
                item.id === editingArticle.id ? { ...item, content: editingArticle.content } : item
            ));
        }
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
                await savedItemsService.remove('news', targetId, user.id);
            } else {
                await savedItemsService.add('news', targetId, user.id);
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

    const closeReactionPicker = () => {
        setReactionPickerTargetId(null);
    };

    const listData = useMemo<ListItem[]>(() => {
        const result: ListItem[] = [];
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

        // Since we are NOT inverted, we want headers to appear BEFORE the items of that day.
        // But the loop above pushes item THEN header? 
        // If sortedNews is [Latest, ..., Oldest] (Desc)
        // We iterate: Item 1 (Today) -> Push Item -> Next is Today -> Continue
        // Item 2 (Today) -> Push Item -> Next is Yesterday -> Push Header (Today)?? NO.

        // Standard List (Top to Bottom):
        // Date Header (Today)
        // Item 1
        // Item 2
        // Date Header (Yesterday)
        // Item 3

        // We need to group by Date.
        // Let's rewrite the loop to insert headers correctly for standard list.

        const finalResult: ListItem[] = [];
        let currentDateGroup = '';

        for (const article of sortedNews) {
            const dateLabel = formatDateLabel(article.created_at);
            if (dateLabel !== currentDateGroup) {
                currentDateGroup = dateLabel;
                finalResult.push({
                    type: 'date',
                    label: dateLabel,
                    key: `date-${getDateKey(article.created_at)}`
                });
            }
            finalResult.push({
                type: 'article',
                article,
                key: article.id
            });
        }

        return finalResult;
    }, [news]);

    const renderItem = ({ item }: { item: ListItem }) => {
        if (item.type === 'date') {
            return <DateSeparator label={item.label} theme={theme} styles={themedStyles} />;
        }

        const reactionData = reactionSummary[item.article.id];
        const reactionContent = (
            <View style={themedStyles.bubbleReactions}>
                {REACTIONS.filter((r) => (reactionData?.counts?.[r.key] || 0) > 0).map((r) => (
                    <Text key={r.key} style={themedStyles.reactionEmojiSmall}>
                        {r.emoji} <Text style={themedStyles.reactionCountText}>{reactionData?.counts?.[r.key]}</Text>
                    </Text>
                ))}
            </View>
        );

        const isSelected = selectedItems.has(item.article.id);

        return (
            <MessageCard
                content={item.article.content || ''}
                image_url={item.article.image_url}
                link_url={item.article.link_url}
                link_text={item.article.link_text}
                created_at={item.article.created_at}
                author_name={item.article.author_name || 'CBN Admin'}
                showViewCount={showViewCount}
                viewCount={viewSummary[item.article.id]?.count || 0}
                reactions={reactionContent}
                isSelected={isSelected}

                onLongPress={() => setLongPressedItemId(item.article.id)}
                onPress={() => handleOpenDetail(item.article)}
            />
        );
    };

    const performForward = async (articles: NewsArticle[]) => {
        // For a single item with an image, share the image file + text
        if (articles.length === 1 && articles[0].image_url) {
            const article = articles[0];
            try {
                const localFile = `${cacheDirectory}share_${article.id}.jpg`;
                const { uri } = await downloadAsync(article.image_url!, localFile);

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
        const textToShare = articles.map((item) => {
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

    const handleForward = async () => {
        const selectedArticles = news.filter((item) => selectedItems.has(item.id));
        await performForward(selectedArticles);
    };

    return (
        <View style={[themedStyles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[themedStyles.wallpaper, { backgroundColor: theme.colors.background, opacity: theme.dark ? 0.3 : 0.06 }]} />

            <KeyboardAvoidingView
                style={[
                    { flex: 1 },
                    Platform.OS === 'android' && keyboardHeight > 0 && { paddingBottom: keyboardHeight }
                ]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Text Formatting Header */}
                {isFormatting && (
                    <FormattingHeader
                        onFormat={(marker) => composerRef.current?.applyFormat(marker)}
                        onClear={() => {
                            // Ideally clear selection in composer, but we can't force it easily without another ref method.
                            // For now just hide the header. The user can tap elsewhere to clear selection.
                            // Actually, let's just ignore the "back" for now or make it dismiss keyboard?
                            Keyboard.dismiss();
                        }}
                    />
                )}

                {/* Message Selection Header */}
                {selectedItems.size > 0 && !isFormatting && (
                    <SelectionHeader
                        selectedCount={selectedItems.size}
                        onClearSelection={clearSelection}
                        onDelete={handleDelete}
                        onCopy={handleCopy}
                        onForward={handleForward}
                    // Explicitly NO Reply button as requested
                    />
                )}

                <FlatList
                    data={listData}
                    keyExtractor={(item) => item.key}
                    renderItem={renderItem}
                    contentContainerStyle={[themedStyles.listContent, { paddingBottom: 100 }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.primary}
                        />
                    }
                />

                {/* Admin Composer */}
                {isAdmin && (
                    <Composer
                        ref={composerRef}
                        onSelectionChange={(sel) => {
                            setIsFormatting(sel.start !== sel.end);
                        }}
                        onSend={async (text, imageUri, postType: PostType) => {
                            if (postType === 'announcement') {
                                // Post as announcement
                                try {
                                    await announcementService.create(
                                        '',
                                        text,
                                        user!.id,
                                        user!.display_name
                                    );
                                    Alert.alert('Success', 'Announcement posted.');
                                } catch (error) {
                                    console.error('Failed to post announcement:', error);
                                    Alert.alert('Error', 'Failed to post announcement.');
                                }
                                return;
                            }

                            // Post as news (optimistic update)
                            const tempId = Math.random().toString();
                            const newArticle: NewsArticle = {
                                id: tempId,
                                headline: '',
                                content: text,
                                image_url: imageUri || undefined,
                                author_id: user!.id,
                                author_name: user!.display_name,
                                created_at: new Date().toISOString(),
                            };

                            setNews(prev => [newArticle, ...prev]);

                            try {
                                const created = await newsService.create(
                                    '',
                                    text,
                                    user!.id,
                                    user!.display_name,
                                    imageUri || undefined
                                );
                                setNews(prev => prev.map(a => a.id === tempId ? created : a));
                            } catch (error) {
                                console.error('Failed to post news:', error);
                                Alert.alert('Error', 'Failed to post news.');
                                setNews(prev => prev.filter(a => a.id !== tempId));
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
                    const item = news.find(n => n.id === longPressedItemId);
                    if (item) {
                        performForward([item]);
                        setLongPressedItemId(null);
                    }
                }}
                onCopy={async () => {
                    const article = news.find(n => n.id === longPressedItemId);
                    if (article) {
                        const parts: string[] = [];
                        if (article.content) parts.push(article.content);
                        if (article.image_url) parts.push(article.image_url);
                        if (article.link_url) parts.push(article.link_url);
                        await Clipboard.setStringAsync(parts.join('\n'));
                        Alert.alert('Copied', 'Message copied to clipboard');
                    }
                    setLongPressedItemId(null);
                }}
                onEdit={() => {
                    const article = news.find(n => n.id === longPressedItemId);
                    if (article) {
                        handleEditStart(article);
                    }
                    setLongPressedItemId(null);
                }}
                onDelete={() => {
                    if (longPressedItemId) {
                        handleSingleDelete(longPressedItemId);
                    }
                    setLongPressedItemId(null);
                }}
                isSaved={longPressedItemId ? savedItemIds.has(longPressedItemId) : false}
                isAdmin={isAdmin}
            />

            {/* Edit Modal */}
            <Modal
                visible={!!editingArticle}
                transparent
                animationType="slide"
                onRequestClose={() => setEditingArticle(null)}
            >
                <TouchableWithoutFeedback onPress={() => setEditingArticle(null)}>
                    <View style={themedStyles.editOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={[themedStyles.editContainer, { backgroundColor: theme.colors.surface }]}>
                                <Text style={[themedStyles.editTitle, { color: theme.colors.text }]}>Edit Post</Text>
                                <TextInput
                                    style={[themedStyles.editInput, {
                                        backgroundColor: theme.colors.inputBackground,
                                        color: theme.colors.text,
                                        borderColor: theme.colors.border,
                                    }]}
                                    value={editText}
                                    onChangeText={setEditText}
                                    multiline
                                    autoFocus
                                    placeholder="Edit your post..."
                                    placeholderTextColor={theme.colors.textSecondary}
                                />
                                <View style={themedStyles.editButtons}>
                                    <Pressable
                                        style={[themedStyles.editButton, { backgroundColor: theme.colors.border }]}
                                        onPress={() => setEditingArticle(null)}
                                    >
                                        <Text style={[themedStyles.editButtonText, { color: theme.colors.text }]}>Cancel</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[themedStyles.editButton, { backgroundColor: theme.colors.primary }]}
                                        onPress={handleEditSave}
                                    >
                                        <Text style={[themedStyles.editButtonText, { color: '#FFFFFF' }]}>Save</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    wallpaper: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.06,
        backgroundColor: theme.colors.background,
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
        backgroundColor: theme.dark ? theme.colors.surface : `${theme.colors.primary}1A`,
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
        color: theme.colors.textSecondary,
        fontWeight: '500',
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
    editOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    editContainer: {
        width: '100%',
        borderRadius: 16,
        padding: 20,
    },
    editTitle: {
        fontSize: 18,
        fontWeight: '700' as '700',
        fontFamily: 'Inter',
        marginBottom: 12,
    },
    editInput: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        fontSize: 16,
        fontFamily: 'Inter',
        minHeight: 100,
        maxHeight: 200,
        textAlignVertical: 'top',
    },
    editButtons: {
        flexDirection: 'row' as 'row',
        gap: 10,
        marginTop: 12,
    },
    editButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center' as 'center',
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: '600' as '600',
        fontFamily: 'Inter',
    },
});
