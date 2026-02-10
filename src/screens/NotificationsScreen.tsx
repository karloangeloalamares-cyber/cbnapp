import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { notificationService } from '../services/notificationService';
import { newsService } from '../services/newsService';
import { announcementService } from '../services/announcementService';
import { postViewsService } from '../services/postViewsService';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { AppNotification } from '../types';
import { theme } from '../theme';

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

export const NotificationsScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
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
        return (
            <Pressable style={[styles.card, isUnread && styles.cardUnread]} onPress={() => handleOpenNotification(item)}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.title, isUnread && styles.titleUnread]}>{item.title}</Text>
                    {isUnread && <View style={styles.unreadDot} />}
                </View>
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
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>&lt; Back</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 60 }} />
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
                ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet.</Text>}
            />
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.colors.header,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },
    list: {
        padding: 16,
        paddingBottom: 40,
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
        borderColor: theme.colors.primary,
        backgroundColor: '#F0F7FA',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: '600',
    },
    titleUnread: {
        color: theme.colors.primary,
    },
    body: {
        marginTop: 6,
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    date: {
        marginTop: 8,
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        fontSize: 16,
    },
});
