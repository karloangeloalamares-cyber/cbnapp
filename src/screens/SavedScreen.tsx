import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, RefreshControl, Alert } from 'react-native';
// safe area handled by Header in MainNavigator tab wrapper
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { savedItemsService } from '../services/savedItemsService';
import { newsService } from '../services/newsService';
import { announcementService } from '../services/announcementService';
import { postViewsService } from '../services/postViewsService';
import { Announcement, NewsArticle, SavedItem } from '../types';
import { MessageCard } from '../components/MessageCard';
import { SavedIcon } from '../components/Icons';
import { PostOptionsModal } from '../components/PostOptionsModal';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';


type SavedFeedItem =
    | {
        savedId: string;
        targetId: string;
        type: 'news';
        article: NewsArticle;
    }
    | {
        savedId: string;
        targetId: string;
        type: 'announcement';
        announcement: Announcement;
    };

const buildSavedFeed = (
    savedItems: SavedItem[],
    newsMap: Record<string, NewsArticle>,
    announcementMap: Record<string, Announcement>
): SavedFeedItem[] => {
    const result: SavedFeedItem[] = [];

    savedItems.forEach((saved) => {
        if (saved.target_type === 'news') {
            const article = newsMap[saved.target_id];
            if (article) {
                result.push({
                    savedId: saved.id,
                    targetId: saved.target_id,
                    type: 'news',
                    article,
                });
            }
            return;
        }

        const announcement = announcementMap[saved.target_id];
        if (announcement) {
            result.push({
                savedId: saved.id,
                targetId: saved.target_id,
                type: 'announcement',
                announcement,
            });
        }
    });

    return result;
};

export const SavedScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const isAdmin = authService.isAdmin(user);
    const canTrackView = !!user && !isAdmin;
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [items, setItems] = useState<SavedFeedItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [longPressedItem, setLongPressedItem] = useState<SavedFeedItem | null>(null);

    const loadSavedItems = useCallback(async () => {
        if (!user || isAdmin) {
            setItems([]);
            return;
        }

        try {
            const saved = await savedItemsService.getAllForUser(user.id);
            const newsIds = saved.filter((item) => item.target_type === 'news').map((item) => item.target_id);
            const announcementIds = saved
                .filter((item) => item.target_type === 'announcement')
                .map((item) => item.target_id);

            const [news, announcements] = await Promise.all([
                newsService.getByIds(newsIds),
                announcementService.getByIds(announcementIds),
            ]);

            const newsMap = news.reduce<Record<string, NewsArticle>>((acc, article) => {
                acc[article.id] = article;
                return acc;
            }, {});
            const announcementMap = announcements.reduce<Record<string, Announcement>>((acc, announcement) => {
                acc[announcement.id] = announcement;
                return acc;
            }, {});

            setItems(buildSavedFeed(saved, newsMap, announcementMap));
        } catch (error) {
            console.warn('Failed to load saved items', error);
            Alert.alert('Error', 'Failed to load saved items.');
        }
    }, [user, isAdmin]);

    useFocusEffect(
        useCallback(() => {
            loadSavedItems();
        }, [loadSavedItems])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadSavedItems();
        setRefreshing(false);
    };

    const handleUnsave = async (item: SavedFeedItem) => {
        if (!user) return;

        setItems((prev) => prev.filter((existing) => existing.savedId !== item.savedId));
        try {
            await savedItemsService.remove(item.type, item.targetId, user.id);
        } catch (error) {
            Alert.alert('Error', 'Failed to remove saved item.');
            await loadSavedItems();
        }
    };

    const handleOpenItem = async (item: SavedFeedItem) => {
        if (!user) return;

        try {
            if (item.type === 'news') {
                if (canTrackView) {
                    try {
                        await postViewsService.add('news', item.article.id, user.id);
                    } catch (error: any) {
                        if (error?.code !== '23505') {
                            console.warn('Failed to add news view', error);
                        }
                    }
                }

                const views = await postViewsService.getForTargets('news', [item.article.id]);
                navigation.navigate('NewsDetail', { article: item.article, viewCount: views.length });
                return;
            }

            if (canTrackView) {
                try {
                    await postViewsService.add('announcement', item.announcement.id, user.id);
                } catch (error: any) {
                    if (error?.code !== '23505') {
                        console.warn('Failed to add announcement view', error);
                    }
                }
            }

            const views = await postViewsService.getForTargets('announcement', [item.announcement.id]);
            navigation.navigate('AnnouncementDetail', {
                announcement: item.announcement,
                viewCount: views.length,
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to open saved item.');
        }
    };


    const handleCopy = async () => {
        if (!longPressedItem) return;
        const content = longPressedItem.type === 'news'
            ? `${longPressedItem.article.headline}\n\n${longPressedItem.article.content}`
            : `${longPressedItem.announcement.title || 'Announcement'}\n\n${longPressedItem.announcement.content}`;

        await Clipboard.setStringAsync(content);
        Alert.alert('Copied', 'Content copied to clipboard');
        setLongPressedItem(null);
    };

    const handleForward = async () => {
        if (!longPressedItem) return;
        const content = longPressedItem.type === 'news'
            ? `${longPressedItem.article.headline}\n\n${longPressedItem.article.content}`
            : `${longPressedItem.announcement.title || 'Announcement'}\n\n${longPressedItem.announcement.content}`;

        try {
            await Share.share({
                message: content,
                title: 'Share Content'
            });
            setLongPressedItem(null);
        } catch (error) {
            Alert.alert('Error', 'Failed to share content.');
        }
    };

    const renderItem = ({ item }: { item: SavedFeedItem }) => {
        if (item.type === 'news') {
            return (
                <MessageCard
                    content={item.article.content || ''}
                    image_url={item.article.image_url}
                    video_url={item.article.video_url}
                    link_url={item.article.link_url}
                    link_text={item.article.link_text}
                    created_at={item.article.created_at}
                    author_name={item.article.author_name || 'CBN Admin'}
                    onPress={() => handleOpenItem(item)}
                    onLongPress={() => setLongPressedItem(item)}
                />
            );
        }

        return (
            <MessageCard
                title={item.announcement.title || undefined}
                content={item.announcement.content}
                created_at={item.announcement.created_at}
                author_name={item.announcement.author_name || 'Announcement'}
                variant="announcement"
                onPress={() => handleOpenItem(item)}
                onLongPress={() => setLongPressedItem(item)}
            />
        );
    };

    if (!user || isAdmin) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>Saved items are available for users only.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={{ flex: 1 }}>
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.savedId}
                    renderItem={renderItem}
                    contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.iconWrap}>
                                <SavedIcon size={22} color={theme.colors.primary} strokeWidth={1.8} />
                            </View>
                            <Text style={styles.emptyTitle}>No saved items yet</Text>
                            <Text style={styles.emptyBody}>
                                Tap the bookmark icon on any news post or announcement to save it here.
                            </Text>
                        </View>
                    }
                />
            </View>

            <PostOptionsModal
                visible={!!longPressedItem}
                onClose={() => setLongPressedItem(null)}
                isSaved={true}
                onSave={() => {
                    if (longPressedItem) {
                        handleUnsave(longPressedItem);
                        setLongPressedItem(null);
                    }
                }}
                onCopy={handleCopy}
                onForward={handleForward}
            />
        </View>
    );
};

const createStyles = (theme: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        list: {
            paddingHorizontal: 8,
            paddingVertical: 12,
            flexGrow: 1,
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
        },
        iconWrap: {
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.primary + '14',
            marginBottom: 12,
        },
        emptyTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            fontFamily: 'Inter',
            marginBottom: 6,
            textAlign: 'center',
        },
        emptyBody: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            fontFamily: 'Inter',
            textAlign: 'center',
            lineHeight: 20,
        },
        navigationContainer: {
            paddingHorizontal: 16,
            paddingTop: 8,
            backgroundColor: theme.colors.background,
        },
    });
