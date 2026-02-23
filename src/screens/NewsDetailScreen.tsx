import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { safeOpenURL } from '../utils/safeOpenURL';
import { Image as ExpoImage } from 'expo-image';
import { Video, ResizeMode, VideoFullscreenUpdate, VideoFullscreenUpdateEvent } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';
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
    const [imageAspectRatio, setImageAspectRatio] = useState(1.5);
    const [videoPlaying, setVideoPlaying] = useState(false);
    const videoRef = useRef<any>(null);

    // Generate thumbnail from video if no image_url exists
    const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
    useEffect(() => {
        if (article?.video_url && !article?.image_url) {
            VideoThumbnails.getThumbnailAsync(article.video_url, { quality: 0.7 })
                .then(({ uri }) => setGeneratedThumbnail(uri))
                .catch(() => { });
        }
    }, [article?.video_url, article?.image_url]);

    // Poster source: prefer image_url, fallback to generated thumbnail
    const posterUri = article?.image_url || generatedThumbnail;
    const posterSource = useMemo(() => posterUri ? { uri: posterUri } : undefined, [posterUri]);

    const handleFullscreen = useCallback(async () => {
        if (videoRef.current) {
            try {
                await videoRef.current.playAsync();
                setVideoPlaying(true);
                await videoRef.current.presentFullscreenPlayer();
            } catch (e) {
                console.warn('Fullscreen failed:', e);
            }
        }
    }, []);

    const handleFullscreenUpdate = useCallback((event: VideoFullscreenUpdateEvent) => {
        if (event.fullscreenUpdate === VideoFullscreenUpdate.PLAYER_DID_DISMISS) {
            setVideoPlaying(false);
        }
    }, []);

    const openLink = async () => {
        if (!article?.link_url) return;
        try {
            await safeOpenURL(article.link_url);
        } catch (error) {
            console.warn('Failed to open article link', error);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={{ padding: 8, minHeight: 44, justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel="Go back">
                    <Text style={styles.backText}>&lt; Back</Text>
                </Pressable>
                <Text style={styles.headerTitle}>News</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    {/* Show image only if there's no video, or as poster before video plays */}
                    {posterSource && !article?.video_url && (
                        <ExpoImage
                            source={posterSource}
                            style={[styles.image, { aspectRatio: imageAspectRatio }]}
                            contentFit="cover"
                            onLoad={(e) => {
                                if (e.source.width && e.source.height) {
                                    setImageAspectRatio(e.source.width / e.source.height);
                                }
                            }}
                        />
                    )}

                    {article?.video_url && !videoPlaying && (
                        <Pressable
                            style={[styles.videoContainer, { aspectRatio: imageAspectRatio }]}
                            onPress={() => setVideoPlaying(true)}
                            accessibilityRole="button"
                            accessibilityLabel="Play video"
                        >
                            {posterSource && (
                                <ExpoImage
                                    source={posterSource}
                                    style={StyleSheet.absoluteFill}
                                    contentFit="cover"
                                    onLoad={(e) => {
                                        if (e.source.width && e.source.height) {
                                            setImageAspectRatio(e.source.width / e.source.height);
                                        }
                                    }}
                                />
                            )}
                            <View style={styles.playOverlay}>
                                <View style={styles.playButton}>
                                    <Text style={styles.playIcon}>▶</Text>
                                </View>
                            </View>
                        </Pressable>
                    )}

                    {article?.video_url && videoPlaying && (
                        <View style={[styles.videoContainer, { aspectRatio: videoAspectRatio }]}>
                            <Video
                                ref={videoRef}
                                source={{ uri: article.video_url }}
                                style={StyleSheet.absoluteFill}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                shouldPlay
                                isLooping={false}
                                onReadyForDisplay={(videoData) => {
                                    if (videoData.naturalSize.width && videoData.naturalSize.height) {
                                        setVideoAspectRatio(videoData.naturalSize.width / videoData.naturalSize.height);
                                    }
                                }}
                                onFullscreenUpdate={handleFullscreenUpdate}
                            />
                            {/* Fullscreen expand button — top-right corner */}
                            <Pressable
                                style={styles.fullscreenButton}
                                onPress={handleFullscreen}
                                hitSlop={10}
                                accessibilityRole="button"
                                accessibilityLabel="Fullscreen video"
                            >
                                <Text style={styles.fullscreenIcon}>⛶</Text>
                            </Pressable>
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
        playOverlay: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.3)',
        },
        playButton: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: 'rgba(255,255,255,0.9)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        playIcon: {
            fontSize: 28,
            color: '#000',
            marginLeft: 4,
        },
        fullscreenButton: {
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 8,
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
        },
        fullscreenIcon: {
            color: '#FFFFFF',
            fontSize: 18,
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
