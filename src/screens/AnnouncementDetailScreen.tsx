import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Announcement } from '../types';
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

export const AnnouncementDetailScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const announcement = route.params?.announcement as Announcement;
    const viewCount: number = route.params?.viewCount ?? 0;
    const { user } = useAuth();
    const isAdmin = authService.isAdmin(user);
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const createdAtLabel = announcement?.created_at ? formatDateTime(announcement.created_at) : '';

    const [imageAspectRatio, setImageAspectRatio] = useState(1.5);
    const [videoAspectRatio, setVideoAspectRatio] = useState(1.77);
    const [videoPlaying, setVideoPlaying] = useState(false);

    // Generate thumbnail from video if no image_url exists
    const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
    useEffect(() => {
        if (announcement?.video_url && !announcement?.image_url) {
            VideoThumbnails.getThumbnailAsync(announcement.video_url, { quality: 0.7 })
                .then(({ uri }) => setGeneratedThumbnail(uri))
                .catch(() => { });
        }
    }, [announcement?.video_url, announcement?.image_url]);

    const posterUri = announcement?.image_url || generatedThumbnail;
    const posterSource = useMemo(() => posterUri ? { uri: posterUri } : undefined, [posterUri]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={{ padding: 8, minHeight: 44, justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel="Go back">
                    <Text style={styles.backText}>&lt; Back</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Announcement</Text>
                <View style={{ width: 80 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    {announcement?.title ? (
                        <FormattedText text={announcement.title} style={styles.title} />
                    ) : null}

                    {/* Show image only if there's no video */}
                    {posterSource && !announcement?.video_url && (
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

                    {announcement?.video_url && !videoPlaying && (
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

                    {announcement?.video_url && videoPlaying && (
                        <View style={[styles.videoContainer, { aspectRatio: videoAspectRatio }]}>
                            <Video
                                source={{ uri: announcement.video_url }}
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
                            />
                        </View>
                    )}

                    <FormattedText text={announcement?.content || ''} style={styles.body} />

                    <View style={styles.metaRow}>
                        {isAdmin && <Text style={styles.metaText}>Viewers {viewCount}</Text>}
                        <Text style={styles.metaText}>{createdAtLabel}</Text>
                    </View>

                    {announcement?.author_name ? (
                        <Text style={styles.authorText}>Posted by {announcement.author_name}</Text>
                    ) : null}
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
        title: {
            ...theme.typography.postTextBold,
            color: theme.colors.text,
            fontFamily: 'Inter',
            marginBottom: 12,
            lineHeight: 22,
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
        body: {
            ...theme.typography.postTextRegular,
            color: theme.colors.text,
            fontFamily: 'Inter',
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
            fontFamily: 'Inter',
        },
        authorText: {
            marginTop: 8,
            fontSize: 12,
            color: theme.colors.textSecondary,
            fontFamily: 'Inter',
        },
    });
