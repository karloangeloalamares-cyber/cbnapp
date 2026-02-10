import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Linking, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NewsArticle } from '../types';
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

export const NewsDetailScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const article = route.params?.article as NewsArticle;
    const viewCount: number = route.params?.viewCount ?? 0;
    const { user } = useAuth();
    const isAdmin = authService.isAdmin(user);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>&lt; Back</Text>
                </Pressable>
                <Text style={styles.headerTitle}>News</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {article?.image_url && (
                    <Image source={{ uri: article.image_url }} style={styles.image} resizeMode="cover" />
                )}

                {article?.content ? <FormattedText text={article.content} style={styles.contentText} /> : null}

                {article?.link_url && (
                    <Pressable onPress={() => Linking.openURL(article.link_url)} style={styles.linkContainer}>
                        <Text style={styles.linkText}>{article.link_url}</Text>
                    </Pressable>
                )}

                <View style={styles.metaRow}>
                    {isAdmin && <Text style={styles.metaText}>👁 {viewCount}</Text>}
                    <Text style={styles.metaText}>{formatDateTime(article.created_at)}</Text>
                </View>
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
    image: {
        width: '100%',
        height: 220,
        borderRadius: 12,
        marginBottom: 16,
    },
    contentText: {
        fontSize: 16,
        color: theme.colors.text,
        lineHeight: 24,
    },
    linkContainer: {
        marginTop: 16,
    },
    linkText: {
        color: theme.colors.primary,
        textDecorationLine: 'underline',
        fontSize: 14,
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
});
