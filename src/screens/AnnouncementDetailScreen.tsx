import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Announcement } from '../types';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { FormattedText } from '../components/FormattedText';
import { theme } from '../theme';

const formatDateTime = (dateString: string): string => {
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

export const AnnouncementDetailScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const announcement = route.params?.announcement as Announcement;
    const viewCount: number = route.params?.viewCount ?? 0;
    const { user } = useAuth();
    const isAdmin = authService.isAdmin(user);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>&lt; Back</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Announcement</Text>
                <View style={{ width: 80 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{announcement?.title}</Text>
                <FormattedText text={announcement?.content || ''} style={styles.body} />

                <View style={styles.metaRow}>
                    {isAdmin && <Text style={styles.metaText}>👁 {viewCount}</Text>}
                    <Text style={styles.metaText}>{formatDateTime(announcement.created_at)}</Text>
                </View>

                {announcement?.author_name ? (
                    <Text style={styles.authorText}>Posted by {announcement.author_name}</Text>
                ) : null}
            </ScrollView>
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
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 12,
    },
    body: {
        fontSize: 16,
        color: theme.colors.text,
        lineHeight: 24,
    },
    metaRow: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: 12,
    },
    metaText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    authorText: {
        marginTop: 8,
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
});
