import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { announcementService } from '../services/announcementService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Announcement } from '../types';
import { theme } from '../theme';

interface Props {
    embedded?: boolean;
}

export const MessageBoardScreen = ({ embedded = false }: Props) => {
    const navigation = useNavigation<any>();
    const { user, logout } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        const data = await announcementService.getAll();
        setAnnouncements(data);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAnnouncements();
        setRefreshing(false);
    };

    const isAdmin = authService.isAdmin(user);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderItem = ({ item }: { item: Announcement }) => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardContent}>{item.content}</Text>
            <View style={styles.cardFooter}>
                <Text style={styles.cardAuthor}>📢 {item.author_name}</Text>
                <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            </View>
        </View>
    );

    const Container = embedded ? View : SafeAreaView;

    return (
        <Container style={styles.container}>
            {/* Header - only show if not embedded */}
            {!embedded && (
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>CBN Announcements</Text>
                        <Text style={styles.headerSubtitle}>Welcome, {user?.display_name}</Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Admin Button - only show if not embedded */}
            {!embedded && isAdmin && (
                <TouchableOpacity
                    style={styles.adminButton}
                    onPress={() => navigation.navigate('AdminPost')}
                >
                    <Text style={styles.adminButtonText}>+ New Announcement</Text>
                </TouchableOpacity>
            )}

            {/* Announcements List */}
            <FlatList
                data={announcements}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No announcements yet.</Text>
                }
            />
        </Container>
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
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 2,
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
    },
    list: {
        padding: 16,
        paddingTop: 8,
        paddingBottom: 100, // Extra space for Android nav + FAB
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
    },
    cardContent: {
        fontSize: 15,
        color: theme.colors.text,
        lineHeight: 22,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: 10,
    },
    cardAuthor: {
        fontSize: 13,
        color: theme.colors.primary,
    },
    cardDate: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginTop: 40,
        fontSize: 16,
    }
});
