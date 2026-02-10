import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Image, Pressable, Linking, RefreshControl, Platform, Alert, Modal, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { newsService } from '../services/newsService';
import { reactionService } from '../services/reactionService';
import { postViewsService } from '../services/postViewsService';
import { NewsArticle, ReactionType } from '../types';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { FormattedText } from '../components/FormattedText';
import { theme } from '../theme';

const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

const formatDateLabel = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time for comparison
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

const getDateKey = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

// Date separator component
const DateSeparator = ({ label }: { label: string }) => (
    <View style={styles.dateSeparatorContainer}>
        <View style={styles.dateSeparatorLine} />
        <View style={styles.dateSeparatorBadge}>
            <Text style={styles.dateSeparatorText}>{label}</Text>
        </View>
        <View style={styles.dateSeparatorLine} />
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

const NewsCard = ({
    article,
    onPress,
    onLongPress,
    reactionSummary,
    onReact,
    onOpenPicker,
    canReact,
    viewCount,
    showViewCount,
}: {
    article: NewsArticle;
    onPress?: () => void;
    onLongPress?: () => void;
    reactionSummary?: ReactionSummary;
    onReact?: (reaction: ReactionType) => void;
    onOpenPicker?: () => void;
    canReact: boolean;
    viewCount: number;
    showViewCount: boolean;
}) => {
    const handleLinkPress = () => {
        if (article.link_url) {
            Linking.openURL(article.link_url);
        }
    };

    return (
        <Pressable
            style={styles.card}
            onPress={onPress}
            onLongPress={onLongPress}
            delayLongPress={350}
            disabled={!onLongPress && !onPress}
        >
            {/* Image */}
            {article.image_url && (
                <Image
                    source={{ uri: article.image_url }}
                    style={styles.heroImage}
                    resizeMode="cover"
                />
            )}

            {/* Content */}
            <View style={styles.contentContainer}>
                {/* Rich text content with bold markers */}
                {article.content ? (
                    <FormattedText text={article.content} style={styles.contentText} />
                ) : null}

                {/* Link section */}
                {article.link_url && (
                    <Pressable
                        onPress={(e) => {
                            e.stopPropagation();
                            handleLinkPress();
                        }}
                        style={styles.linkContainer}
                    >
                        <Text style={styles.linkUrl}>{article.link_url}</Text>
                    </Pressable>
                )}

                {/* Reactions */}
                <View style={styles.reactionRow}>
                    <View style={styles.reactionBar}>
                        {REACTIONS.filter((reaction) => (reactionSummary?.counts?.[reaction.key] || 0) > 0).map((reaction) => {
                        const count = reactionSummary?.counts?.[reaction.key] || 0;
                        const isActive = reactionSummary?.userReaction === reaction.key;
                        return (
                            <Pressable
                                key={reaction.key}
                                style={[
                                    styles.reactionChip,
                                    isActive && styles.reactionChipActive,
                                    !canReact && styles.reactionChipDisabled,
                                ]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onReact?.(reaction.key);
                                }}
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
                            <Pressable
                                style={styles.addReactionChip}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onOpenPicker?.();
                                }}
                            >
                                <Text style={styles.addReactionText}>+</Text>
                            </Pressable>
                        )}
                    </View>
                    {showViewCount && (
                        <View style={styles.viewCountChip}>
                            <Text style={styles.viewCountText}>👁 {viewCount}</Text>
                        </View>
                    )}
                </View>

                {/* Timestamp */}
                <Text style={styles.timestamp}>{formatTime(article.created_at)}</Text>
            </View>
        </Pressable>
    );
};

type ListItem =
    | { type: 'date'; label: string; key: string }
    | { type: 'article'; article: NewsArticle; key: string };

export const NewsScreen = () => {
    const navigation = useNavigation<any>();
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [reactionSummary, setReactionSummary] = useState<Record<string, ReactionSummary>>({});
    const [viewSummary, setViewSummary] = useState<Record<string, ViewSummary>>({});
    const [reactionPickerTargetId, setReactionPickerTargetId] = useState<string | null>(null);
    const lastLongPressId = useRef<string | null>(null);
    const { user } = useAuth();
    const isAdmin = authService.isAdmin(user);
    const canReact = !!user && !isAdmin;
    const canTrackView = !!user && !isAdmin;
    const showViewCount = isAdmin;

    const markLongPress = (id: string) => {
        lastLongPressId.current = id;
        setTimeout(() => {
            if (lastLongPressId.current === id) {
                lastLongPressId.current = null;
            }
        }, 400);
    };

    const loadNews = async () => {
        const articles = await newsService.getAll();
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

    const handleOpenDetail = async (article: NewsArticle) => {
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

        const currentCount = viewSummary[article.id]?.count || 0;
        const nextCount = canTrackView && !viewSummary[article.id]?.hasViewed ? currentCount + 1 : currentCount;
        navigation.navigate('NewsDetail', { article, viewCount: nextCount });
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
            if (confirmFn && confirmFn('Delete this news post?')) onConfirm();
            return;
        }
        Alert.alert('Delete Post', 'Delete this news post?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onConfirm },
        ]);
    };

    const handleDelete = (id: string) => {
        confirmDelete(async () => {
            try {
                await newsService.delete(id);
                setNews((prev) => prev.filter((item) => item.id !== id));
                setReactionSummary((prev) => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
                setViewSummary((prev) => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
            } catch (error) {
                Alert.alert('Error', 'Failed to delete. Please try again.');
            }
        });
    };

    // Group articles with date separators
    const listData = useMemo<ListItem[]>(() => {
        const result: ListItem[] = [];
        let lastDateKey = '';

        news.forEach((article) => {
            const dateKey = getDateKey(article.created_at);
            if (dateKey !== lastDateKey) {
                result.push({
                    type: 'date',
                    label: formatDateLabel(article.created_at),
                    key: `date-${dateKey}`,
                });
                lastDateKey = dateKey;
            }
            result.push({
                type: 'article',
                article,
                key: article.id,
            });
        });

        return result;
    }, [news]);

    const renderItem = ({ item }: { item: ListItem }) => {
        if (item.type === 'date') {
            return <DateSeparator label={item.label} />;
        }
        return (
            <NewsCard
                article={item.article}
                onPress={() => {
                    if (lastLongPressId.current === item.article.id) {
                        lastLongPressId.current = null;
                        return;
                    }
                    handleOpenDetail(item.article);
                }}
                onLongPress={
                    isAdmin
                        ? () => {
                            markLongPress(item.article.id);
                            handleDelete(item.article.id);
                        }
                        : canReact
                            ? () => {
                                markLongPress(item.article.id);
                                openReactionPicker(item.article.id);
                            }
                            : undefined
                }
                reactionSummary={reactionSummary[item.article.id]}
                onReact={(reaction) => handleReact(item.article.id, reaction)}
                onOpenPicker={() => openReactionPicker(item.article.id)}
                canReact={canReact}
                viewCount={viewSummary[item.article.id]?.count || 0}
                showViewCount={showViewCount}
            />
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={listData}
                keyExtractor={(item) => item.key}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No news articles yet</Text>
                    </View>
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
        backgroundColor: '#E8E8E8',
    },
    listContent: {
        padding: 10,
        paddingBottom: 100,
    },
    // Date separator styles
    dateSeparatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        paddingHorizontal: 20,
    },
    dateSeparatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#D0D0D0',
    },
    dateSeparatorBadge: {
        backgroundColor: '#D9E8EC',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        marginHorizontal: 10,
    },
    dateSeparatorText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#4A90A4',
    },
    // Card styles
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    imageContainer: {
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: 200,
    },
    playOverlay: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -25 }, { translateY: -25 }],
        width: 50,
        height: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: {
        color: '#FFF',
        fontSize: 20,
        marginLeft: 4,
    },
    contentContainer: {
        padding: 12,
    },
    headline: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    contentText: {
        fontSize: 14,
        color: '#303030',
        lineHeight: 20,
    },
    linkContainer: {
        marginTop: 12,
    },
    linkLabel: {
        fontSize: 14,
        color: '#303030',
    },
    linkText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#303030',
    },
    linkUrl: {
        fontSize: 14,
        color: '#4A90A4',
        textDecorationLine: 'underline',
    },
    reactionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
        marginTop: 12,
        marginBottom: 4,
    },
    reactionBar: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
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
    viewCountChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginLeft: 6,
        marginBottom: 6,
    },
    viewCountText: {
        fontSize: 12,
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
    timestamp: {
        fontSize: 11,
        color: '#8696A0',
        textAlign: 'right',
        marginTop: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        color: '#8696A0',
        fontSize: 16,
    },
});
