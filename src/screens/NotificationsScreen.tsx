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
import { useNotifications } from '../context/NotificationContext'; // Import context
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
    const { notifications, loading, refreshNotifications, markRead } = useNotifications(); // Use context
    // Local refreshing state for UI feedback
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshNotifications();
        setRefreshing(false);
    };



    const handleOpenNotification = async (notification: AppNotification) => {
        if (!user) return;

        // 1. Mark read optimistically (instant UI update, DB in background)
        if (!notification.read_at) {
            markRead(notification.id);
            notificationService.markRead(notification.id).catch(() => { });
        }

        try {
            if (notification.target_type === 'news') {
                const article = await newsService.getById(notification.target_id);
                if (!article) {
                    Alert.alert('Not found', 'This news post is no longer available.');
                    return;
                }
                // Navigate immediately — don't wait for view tracking
                navigation.navigate('NewsDetail', { article, viewCount: 0 });
                // Fire view tracking in background
                if (canTrackView) {
                    postViewsService.add('news', article.id, user.id).catch(() => { });
                }
                return;
            }

            if (notification.target_type === 'announcement') {
                const announcement = await announcementService.getById(notification.target_id);
                if (!announcement) {
                    Alert.alert('Not found', 'This announcement is no longer available.');
                    return;
                }
                navigation.navigate('AnnouncementDetail', { announcement, viewCount: 0 });
                if (canTrackView) {
                    postViewsService.add('announcement', announcement.id, user.id).catch(() => { });
                }
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
            <Pressable style={styles.card} onPress={() => handleOpenNotification(item)}>
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
    // Removed unreadAlpha/Border as they are no longer used for card bg
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
            // Removed border if not needed, or keep subtle
            borderWidth: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
        },
        // cardUnread removed
        cardTopRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
        },
        iconWrap: {
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.dark ? '#2C2C2E' : '#F2F2F7', // Neutral background
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
            fontWeight: '500',
            fontFamily: 'Inter',
            lineHeight: 21,
        },
        titleUnread: {
            fontWeight: '700',
            color: theme.colors.text, // Keep text color standard
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
