import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, Modal, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NewsScreen } from './NewsScreen';
import { MessageBoardScreen } from './MessageBoardScreen';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';
import { theme } from '../theme';

type TabType = 'news' | 'announcements';

export const HomeScreen = () => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<TabType>('news');
    const [showPostOptions, setShowPostOptions] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigation = useNavigation<any>();
    const { user, logout } = useAuth();
    const isAdmin = authService.isAdmin(user);
    const canNotify = !!user && !isAdmin;

    const handleNewPost = (type: 'news' | 'announcement') => {
        setShowPostOptions(false);
        navigation.navigate('AdminPost', { type });
    };

    const loadUnreadCount = useCallback(async () => {
        if (!canNotify || !user) {
            setUnreadCount(0);
            return;
        }
        try {
            const count = await notificationService.getUnreadCount(user.id);
            setUnreadCount(count);
        } catch (error) {
            console.warn('Failed to load unread count', error);
        }
    }, [canNotify, user]);

    useEffect(() => {
        loadUnreadCount();
    }, [loadUnreadCount]);

    useFocusEffect(
        useCallback(() => {
            loadUnreadCount();
        }, [loadUnreadCount])
    );

    useEffect(() => {
        if (!canNotify || !user) return;

        const channel = supabase
            .channel(`cbn-app-notification-badge-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'cbn_app_notifications',
                    filter: `recipient_id=eq.${user.id}`,
                },
                (payload) => {
                    if (!payload.new.read_at) {
                        setUnreadCount((prev) => prev + 1);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [canNotify, user]);

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoRow}>
                    <Image
                        source={require('../../assets/CBN_Logo-removebg-preview.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.headerTitle}>CBN Unfiltered</Text>
                </View>
                <View style={styles.headerActions}>
                    {canNotify && (
                        <Pressable
                            style={styles.bellButton}
                            onPress={() => navigation.navigate('Notifications')}
                        >
                            <Text style={styles.bellIcon}>🔔</Text>
                            {unreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </Pressable>
                    )}
                    <Pressable
                        style={styles.profileButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Image
                            source={{
                                uri: user?.avatar_url || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'
                            }}
                            style={styles.avatarImage}
                        />
                    </Pressable>
                </View>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <Pressable
                    style={[styles.tab, activeTab === 'news' && styles.activeTab]}
                    onPress={() => setActiveTab('news')}
                >
                    <Text style={[styles.tabText, activeTab === 'news' && styles.activeTabText]}>
                        📰 News
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'announcements' && styles.activeTab]}
                    onPress={() => setActiveTab('announcements')}
                >
                    <Text style={[styles.tabText, activeTab === 'announcements' && styles.activeTabText]}>
                        📋 Announcements
                    </Text>
                </Pressable>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {activeTab === 'news' ? <NewsScreen /> : <MessageBoardScreen embedded />}
            </View>

            {/* Admin FAB */}
            {isAdmin && (
                <>
                    <Pressable
                        style={[styles.fab, { bottom: insets.bottom + 20 }]}
                        onPress={() => setShowPostOptions(true)}
                    >
                        <Text style={styles.fabText}>+</Text>
                    </Pressable>

                    <Modal
                        visible={showPostOptions}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setShowPostOptions(false)}
                    >
                        <TouchableWithoutFeedback onPress={() => setShowPostOptions(false)}>
                            <View style={styles.modalOverlay}>
                                <View style={[styles.optionsContainer, { paddingBottom: insets.bottom + 20 }]}>
                                    <Text style={styles.optionsTitle}>Create New</Text>

                                    <Pressable
                                        style={styles.optionButton}
                                        onPress={() => handleNewPost('news')}
                                    >
                                        <Text style={styles.optionIcon}>📰</Text>
                                        <View>
                                            <Text style={styles.optionText}>News Post</Text>
                                            <Text style={styles.optionSubtext}>Share updates with images</Text>
                                        </View>
                                    </Pressable>

                                    <Pressable
                                        style={styles.optionButton}
                                        onPress={() => handleNewPost('announcement')}
                                    >
                                        <Text style={styles.optionIcon}>📢</Text>
                                        <View>
                                            <Text style={styles.optionText}>Announcement</Text>
                                            <Text style={styles.optionSubtext}>Official notices & alerts</Text>
                                        </View>
                                    </Pressable>

                                    <Pressable
                                        style={styles.cancelButton}
                                        onPress={() => setShowPostOptions(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </Modal>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8, // Reduced from 12 for compact feel
        backgroundColor: theme.colors.header,
        // Elevation for Android to separate from content if white
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginLeft: 8,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 36,
        height: 36,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bellButton: {
        paddingHorizontal: 6,
        paddingVertical: 6,
        backgroundColor: 'transparent',
        borderRadius: 20,
        marginRight: 4,
    },
    bellIcon: {
        fontSize: 20,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    profileButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginRight: 0,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.colors.textSecondary,
    },
    activeTabText: {
        color: theme.colors.primary,
    },
    content: {
        flex: 1,
    },
    fab: {
        position: 'absolute',
        right: 20,
        // Bottom is handled dynamically inline
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 10,
    },
    fabText: {
        fontSize: 28,
        color: '#FFFFFF',
        fontWeight: '300',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    optionsContainer: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    optionsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    optionIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    optionSubtext: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    cancelButton: {
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        color: theme.colors.secondary,
        fontWeight: '500',
    },
});
