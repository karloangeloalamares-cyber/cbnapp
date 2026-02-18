import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Linking, ScrollView } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NewsArticle } from '../types';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { FormattedText } from '../components/FormattedText';
import { useTheme } from '../context/ThemeContext';

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
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const createdAtLabel = article?.created_at ? formatDateTime(article.created_at) : '';

    const [videoAspectRatio, setVideoAspectRatio] = React.useState(1.77);


    const openLink = async () => {
        if (!article?.link_url) return;
        try {
            await Linking.openURL(article.link_url);
        } catch (error) {
            console.warn('Failed to open article link', error);
        }
    };

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
                <View style={styles.card}>
                    {article?.image_url && (
                        <Image source={{ uri: article.image_url }} style={styles.image} resizeMode="cover" />
                    )}

                    {article?.video_url && (
                        <View style={[styles.videoContainer, { aspectRatio: videoAspectRatio }]}>
                            <Video
                                source={{ uri: article.video_url }}
                                style={StyleSheet.absoluteFill}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                isLooping={false}
                                onReadyForDisplay={(videoData) => {
                                    if (videoData.naturalSize.width && videoData.naturalSize.height) {
                                        setVideoAspectRatio(videoData.naturalSize.width / videoData.naturalSize.height);
                                    }
                                }}
                            />
                        </View>
                    )}


                    {article?.content ? <FormattedText text={article.content} style={styles.contentText} /> : null}

                    {article?.link_url && (
                        <Pressable onPress={openLink} style={styles.linkContainer}>
                            <Text style={styles.linkLabel}>Source Link</Text>
                            <Text style={styles.linkText}>{article.link_url}</Text>
                        </Pressable>
                    )}

                    <View style={styles.metaRow}>
                        {isAdmin && <Text style={styles.metaText}>Viewers {viewCount}</Text>}
                        <Text style={styles.metaText}>{createdAtLabel}</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const createStyles = (theme: any) =>
    StyleSheet.create({
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
            fontFamily: 'Inter',
        },
        headerTitle: {
            ...theme.typography.subHeader,
            color: theme.colors.text,
            fontFamily: 'Inter',
        },
        content: {
            padding: 16,
            paddingBottom: 40,
        },
        card: {
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: 16,
        },
        image: {
            width: '100%',
            height: 220,
            borderRadius: 12,
            marginBottom: 16,
        },
        videoContainer: {
            width: '100%',
            borderRadius: 12,
            backgroundColor: '#000',
            marginBottom: 16,
            overflow: 'hidden',
        },

        contentText: {
            ...theme.typography.postTextRegular,
            color: theme.colors.text,
            fontFamily: 'Inter',
            lineHeight: 24,
        },
        linkContainer: {
            marginTop: 16,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
        },
        linkLabel: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            fontFamily: 'Inter',
            marginBottom: 4,
        },
        linkText: {
            ...theme.typography.postLink,
            color: theme.colors.primary,
            textDecorationLine: 'underline',
            fontFamily: 'Inter',
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
            fontFamily: 'Inter',
        },
    });
