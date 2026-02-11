import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Platform, Linking } from 'react-native';
import { theme } from '../theme';
import { FormattedText } from './FormattedText';
import { Avatar } from './Avatar';

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
    isAdmin = false,
    selected = false,
}: MessageBubbleProps) => {

    const handleLinkPress = () => {
        if (link_url) {
            Linking.openURL(link_url);
        }
    };

    return (
        <View style={[
            styles.wrapper,
            isAdmin ? styles.wrapperReceived : styles.wrapperSent
        ]}>
            {/* Avatar for Admin/Received messages */}
            {isAdmin && (
                <View style={styles.avatarContainer}>
                    <Avatar
                        name={author_name || "Admin"}
                        size={30}
                    />
                </View>
            )}

            <Pressable
                style={[
                    styles.container,
                    isAdmin ? styles.receivedContainer : styles.sentContainer,
                    selected && styles.selectedContainer
                ]}
                onLongPress={onLongPress}
                onPress={onPress}
                delayLongPress={300}
            >
                {/* Tail */}
                {isAdmin ? (
                    <View style={[styles.tail, styles.tailLeft]} />
                ) : (
                    <View style={[styles.tail, styles.tailRight]} />
                )}

                {/* Author Name for Admin posts (inside bubble, colorful) */}
                {isAdmin && author_name && (
                    <Text style={[styles.authorName, { color: '#E54242' }]}>{author_name}</Text>
                )}

                {/* Image Attachment */}
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
                    <FormattedText text={content} style={styles.messageText} />

                    {/* Link Preview (Simple) */}
                    {link_url && (
                        <Pressable onPress={handleLinkPress} style={styles.linkContainer}>
                            <Text style={styles.linkText} numberOfLines={1}>{link_url}</Text>
                        </Pressable>
                    )}
                </View>

                {/* Footer: Time & Status */}
                <View style={styles.footer}>
                    {reactions && <View style={styles.reactionsContainer}>{reactions}</View>}
                    <View style={styles.metaContainer}>
                        {showViewCount && (
                            <Text style={styles.viewCount}>👁 {viewCount}</Text>
                        )}
                        <Text style={styles.timeText}>{formatTime(created_at)}</Text>
                    </View>
                </View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        marginVertical: 4,
        marginHorizontal: 8,
        alignItems: 'flex-end', // Avatar at bottom
    },
    wrapperReceived: {
        justifyContent: 'flex-start',
    },
    wrapperSent: {
        justifyContent: 'flex-end',
    },
    avatarContainer: {
        marginRight: 4,
        marginBottom: 2,
    },
    container: {
        maxWidth: '80%',
        borderRadius: 12,
        padding: 6,
        paddingBottom: 4,
        marginVertical: 4,
        marginHorizontal: 4, // Reduced because wrapper handles outer margin
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 1,
        minWidth: 100,
    },
    receivedContainer: {
        alignSelf: 'flex-start',
        borderTopLeftRadius: 0,
        backgroundColor: '#FFFFFF',
        marginLeft: 8, // Reduced space for tail
    },
    sentContainer: {
        alignSelf: 'flex-end',
        borderTopRightRadius: 0,
        backgroundColor: '#E7FFDB',
        marginRight: 8, // Reduced space for tail
    },
    selectedContainer: {
        backgroundColor: '#C8E6C9', // Selection highlight
    },
    tail: {
        position: 'absolute',
        top: 0,
        width: 12,
        height: 12,
        backgroundColor: 'transparent',
        borderTopWidth: 12,
        borderStyle: 'solid',
    },
    tailLeft: {
        left: -8,
        borderTopColor: '#FFFFFF',
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderLeftWidth: 12,
        transform: [{ rotate: '90deg' }],
        borderTopWidth: 0,
        borderRightWidth: 12,
        borderBottomWidth: 12,
        borderLeftWidth: 0,
        borderRightColor: '#FFFFFF',
        borderBottomColor: 'transparent',
        top: 0,
    },
    tailRight: {
        right: -8,
        borderTopWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 12,
        borderLeftWidth: 12,
        borderLeftColor: '#E7FFDB',
        borderBottomColor: 'transparent',
        top: 0,
    },
    authorName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#E54242',
        marginBottom: 4,
        marginHorizontal: 4,
        marginTop: 2,
    },
    imageContainer: {
        marginBottom: 4,
        borderRadius: 8,
        overflow: 'hidden',
        minHeight: 150,
        backgroundColor: '#f0f0f0',
    },
    image: {
        width: '100%',
        height: 200,
    },
    contentContainer: {
        marginBottom: 2,
        paddingHorizontal: 4,
    },
    messageText: {
        fontSize: 15.5,
        color: '#111827',
        lineHeight: 21,
    },
    linkContainer: {
        marginTop: 4,
        padding: 8,
        backgroundColor: '#F7F7F7',
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#008069',
    },
    linkText: {
        color: '#53BDEB',
        fontSize: 13,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 2,
        paddingRight: 2,
        paddingBottom: 2,
    },
    reactionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginRight: 'auto',
        maxWidth: '70%',
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewCount: {
        fontSize: 10,
        color: '#667781',
        marginRight: 4,
    },
    timeText: {
        fontSize: 11,
        color: '#667781',
        marginLeft: 4,
        marginBottom: 1,
    },
});
