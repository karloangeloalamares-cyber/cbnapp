import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NewsScreen } from './NewsScreen';
import { MessageBoardScreen } from './MessageBoardScreen';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { theme } from '../theme';

type TabType = 'news' | 'announcements';

export const HomeScreen = () => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<TabType>('news');
    const navigation = useNavigation<any>();
    const { user, logout } = useAuth();
    const isAdmin = authService.isAdmin(user);

    const handleNewPost = () => {
        navigation.navigate('AdminPost', { type: activeTab === 'news' ? 'news' : 'announcement' });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
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
                <Pressable onPress={logout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Logout</Text>
                </Pressable>
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
                <Pressable style={[styles.fab, { bottom: insets.bottom + 20 }]} onPress={handleNewPost}>
                    <Text style={styles.fabText}>+</Text>
                </Pressable>
            )}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.colors.header,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
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
    logoutButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: theme.colors.surface,
        borderRadius: 6,
    },
    logoutText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
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
        bottom: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    fabText: {
        fontSize: 28,
        color: '#FFFFFF',
        fontWeight: '300',
    },
});
