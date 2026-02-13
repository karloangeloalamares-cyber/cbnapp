import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, RefreshControl, Alert } from 'react-native';
// safe area handled by Header in MainNavigator tab wrapper
import { useNavigation } from '@react-navigation/native';
import { notificationService } from '../services/notificationService';
import { newsService } from '../services/newsService';
import { announcementService } from '../services/announcementService';
import { postViewsService } from '../services/postViewsService';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { AppNotification } from '../types';
import { useTheme } from '../context/ThemeContext';
import { AnnouncementIcon, NewsIcon } from '../components/Icons';


const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

const mapNotification = (item: any): AppNotification => ({
    ...item,
    id: item.id.toString(),
    recipient_id: item.recipient_id.toString(),
    target_id: item.target_id.toString(),
});

const withAlpha = (hex: string, alphaHex: string) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        return `${hex}${alphaHex}`;
    }
    return hex;
};

export const NotificationsScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const isAdmin = authService.isAdmin(user);
    const canTrackView = !!user && !isAdmin;
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = useCallback(async () => {
        if (!user || isAdmin) {
            setNotifications([]);
            return;
        }
        const data = await notificationService.getAll(user.id);
        setNotifications(data);
    }, [user, isAdmin]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    useEffect(() => {
        if (!user || isAdmin) return;

        const channel = supabase
            .channel(`cbn-app-notifications-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'cbn_app_notifications',
                    filter: `recipient_id=eq.${user.id}`,
                },
                (payload) => {
                    const newItem = mapNotification(payload.new);
                    setNotifications((prev) => [newItem, ...prev]);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'cbn_app_notifications',
                    filter: `recipient_id=eq.${user.id}`,
                },
                (payload) => {
                    const updated = mapNotification(payload.new);
                    setNotifications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, isAdmin]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    const markReadLocal = (id: string) => {
        setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read_at: new Date().toISOString() } : item)));
    };

    const handleOpenNotification = async (notification: AppNotification) => {
        if (!user) return;

        try {
            if (!notification.read_at) {
                await notificationService.markRead(notification.id);
                markReadLocal(notification.id);
            }

            if (notification.target_type === 'news') {
                const article = await newsService.getById(notification.target_id);
                if (!article) {
                    Alert.alert('Not found', 'This news post is no longer available.');
                    return;
                }
                if (canTrackView) {
                    try {
                        await postViewsService.add('news', article.id, user.id);
                    } catch (error: any) {
                        if (error?.code !== '23505') {
                            console.warn('Failed to add view', error);
                        }
                    }
                }
                const views = await postViewsService.getForTargets('news', [article.id]);
                navigation.navigate('NewsDetail', { article, viewCount: views.length });
                return;
            }

            if (notification.target_type === 'announcement') {
                const announcement = await announcementService.getById(notification.target_id);
                if (!announcement) {
                    Alert.alert('Not found', 'This announcement is no longer available.');
                    return;
                }
                if (canTrackView) {
                    try {
                        await postViewsService.add('announcement', announcement.id, user.id);
                    } catch (error: any) {
                        if (error?.code !== '23505') {
                            console.warn('Failed to add view', error);
                        }
                    }
                }
                const views = await postViewsService.getForTargets('announcement', [announcement.id]);
                navigation.navigate('AnnouncementDetail', { announcement, viewCount: views.length });
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open notification.');
        }
    };

    const renderItem = ({ item }: { item: AppNotification }) => {
        const isUnread = !item.read_at;
        const isNews = item.target_type === 'news';
        const badgeLabel = isNews ? 'News' : 'Announcement';
        const iconColor = isUnread ? theme.colors.primary : theme.colors.textSecondary;
        return (
            <Pressable style={[styles.card, isUnread && styles.cardUnread]} onPress={() => handleOpenNotification(item)}>
                <View style={styles.cardTopRow}>
                    <View style={styles.iconWrap}>
                        {isNews ? (
                            <NewsIcon size={18} color={iconColor} strokeWidth={1.8} />
                        ) : (
                            <AnnouncementIcon size={18} color={iconColor} strokeWidth={1.8} />
                        )}
                    </View>
                    <View style={styles.badgeWrap}>
                        <Text style={styles.badgeText}>{badgeLabel}</Text>
                    </View>
                    {isUnread && <View style={styles.unreadDot} />}
                </View>
                <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.date}>{formatDateTime(item.created_at)}</Text>
            </Pressable>
        );
    };

    if (!user || isAdmin) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Notifications are available for users only.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={{ flex: 1 }}>
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet.</Text>}
                />
            </View>
        </View>
    );
};

const createStyles = (theme: any) => {
    const unreadBg = withAlpha(theme.colors.primary, theme.dark ? '1F' : '12');
    const unreadBorder = withAlpha(theme.colors.primary, '66');
    const badgeBg = withAlpha(theme.colors.primary, theme.dark ? '33' : '1A');

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        list: {
            padding: 16,
            paddingBottom: 20,
            flexGrow: 1,
        },
        card: {
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 14,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        cardUnread: {
            borderColor: unreadBorder,
            backgroundColor: unreadBg,
        },
        cardTopRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
        },
        iconWrap: {
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.cardBackground || theme.colors.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
        },
        badgeWrap: {
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
            backgroundColor: badgeBg,
        },
        badgeText: {
            fontSize: 11,
            color: theme.colors.primary,
            fontWeight: '600',
            fontFamily: 'Inter',
        },
        title: {
            fontSize: 16,
            color: theme.colors.text,
            fontWeight: '600',
            fontFamily: 'Inter',
            lineHeight: 21,
        },
        titleUnread: {
            color: theme.colors.primary,
        },
        body: {
            marginTop: 6,
            fontSize: 14,
            color: theme.colors.textSecondary,
            fontFamily: 'Inter',
            lineHeight: 20,
        },
        date: {
            marginTop: 10,
            fontSize: 12,
            color: theme.colors.textSecondary,
            fontFamily: 'Inter',
            alignSelf: 'flex-end',
        },
        unreadDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.primary,
            marginLeft: 'auto',
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
            backgroundColor: theme.colors.background,
        },
        emptyText: {
            textAlign: 'center',
            color: theme.colors.textSecondary,
            fontSize: 16,
            fontFamily: 'Inter',
            lineHeight: 22,
        },
        navigationContainer: {
            paddingHorizontal: 16,
            paddingTop: 8,
            backgroundColor: theme.colors.background,
        },
    });
};
