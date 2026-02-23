import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Platform, useWindowDimensions } from 'react-native';
import { safeOpenURL } from '../utils/safeOpenURL';
import { useTheme } from '../context/ThemeContext';
import { FormattedText } from './FormattedText';

interface MessageBubbleProps {
    content: string;
    image_url?: string | null;
    link_url?: string | null;
    created_at: string;
    author_name?: string;
    reactions?: React.ReactNode;
    onLongPress?: () => void;
    onPress?: () => void;
    viewCount?: number;
    showViewCount?: boolean;
    isAdmin?: boolean;
    selected?: boolean;
}

const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

export const MessageBubble = ({
    content,
    image_url,
    link_url,
    created_at,
    author_name,
    reactions,
    onLongPress,
    onPress,
    viewCount,
    showViewCount,
    isAdmin = false, // We'll keep the prop but it won't affect layout as much anymore
    selected = false,
}: MessageBubbleProps) => {
    const { theme } = useTheme();

    const handleLinkPress = () => {
        if (link_url) {
            safeOpenURL(link_url);
        }
    };

    return (
        <View style={styles.wrapper}>
            <Pressable
                style={[
                    styles.container,
                    { backgroundColor: theme.colors.surface },
                    selected && styles.selectedContainer
                ]}
                onLongPress={onLongPress}
                onPress={onPress}
                delayLongPress={300}
            >
                {/* Feed Card Header */}
                {isAdmin && (
                    <View style={styles.headerContainer}>
                        <Image
                            source={require('../../assets/CBN_Logo-removebg-preview.png')}
                            style={styles.headerIcon}
                            resizeMode="contain"
                        />
                        <View>
                            <Text style={[styles.headerTitle, { color: theme.colors.danger }]}>CBN Unfiltered</Text>
                            {author_name && author_name !== 'Admin' && author_name !== 'CBN Unfiltered' && (
                                <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>{author_name}</Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Author Name for non-admin/sent messages if needed, usually just for group chats */}
                {!isAdmin && author_name && (
                    <Text style={[styles.authorName, { color: theme.colors.primary }]}>{author_name}</Text>
                )}

                {/* Image Attachment - Full Width */}
                {image_url && (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: image_url }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    </View>
                )}

                {/* Text Content */}
                <View style={styles.contentContainer}>
                    <FormattedText text={content} style={[styles.messageText, { color: theme.colors.text }]} />

                    {/* Link Preview (Simple) */}
                    {link_url && (
                        <Pressable onPress={handleLinkPress} style={styles.linkContainer}>
                            <Text style={styles.linkLabel}>Link to CBN FILTERED</Text>
                            <Text style={[styles.linkText, { color: theme.colors.primary }]} numberOfLines={1}>{link_url}</Text>
                        </Pressable>
                    )}
                </View>

                {/* Footer: Time & Status */}
                <View style={styles.footer}>
                    {reactions && <View style={styles.reactionsContainer}>{reactions}</View>}
                    <View style={styles.metaContainer}>
                        {showViewCount && (
                            <Text style={[styles.viewCount, { color: theme.colors.textSecondary }]}>👁 {viewCount}</Text>
                        )}
                        <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>{formatTime(created_at)}</Text>
                    </View>
                </View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        paddingHorizontal: 0, // Parent handles padding
        marginVertical: 4,
    },
    container: {
        width: '100%', // Uniform full width
        borderRadius: 12,
        padding: 12,
        paddingBottom: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 1,
    },
    selectedContainer: {
        backgroundColor: '#C8E6C9', // Selection highlight
        opacity: 0.9,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerIcon: {
        width: 24,
        height: 24,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 11,
    },
    authorName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    imageContainer: {
        marginBottom: 8,
        borderRadius: 8,
        overflow: 'hidden',
        minHeight: 200,
        backgroundColor: '#2A3942', // Placeholder color
    },
    image: {
        width: '100%',
        height: 200,
    },
    contentContainer: {
        marginBottom: 6,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    linkContainer: {
        marginTop: 8,
    },
    linkLabel: {
        fontSize: 11,
        color: '#8696A0',
        marginBottom: 2,
        fontWeight: '600',
    },
    linkText: {
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 4,
    },
    reactionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        maxWidth: '70%',
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto', // Push to right if reactions exist
    },
    viewCount: {
        fontSize: 11,
        marginRight: 6,
    },
    timeText: {
        fontSize: 11,
    },
});
