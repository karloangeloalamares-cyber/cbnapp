import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Platform, Image, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { newsService } from '../services/newsService';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

import { useRoute } from '@react-navigation/native';
import { announcementService } from '../services/announcementService';

export const AdminPostScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { user } = useAuth();

    // Default to 'news' if not specified
    const postType = route.params?.type || 'news';
    const isNews = postType === 'news';

    const [message, setMessage] = useState('');
    const [title, setTitle] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [messageSelection, setMessageSelection] = useState({ start: 0, end: 0 });
    const [messageInputHeight, setMessageInputHeight] = useState(44);
    const [inputFocused, setInputFocused] = useState(false);
    const messageInputRef = useRef<TextInput>(null);

    const MIN_INPUT_HEIGHT = 44;
    const MAX_INPUT_HEIGHT = 160;

    const showAlert = (title: string, msg: string, onOk?: () => void) => {
        if (Platform.OS === 'web') {
            window.alert(msg);
            onOk?.();
        } else {
            Alert.alert(title, msg, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permission Required', 'Please allow access to photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
        }
    };

    const removeImage = () => setImageUri(null);

    const applyFormatting = (marker: string) => {
        const start = Math.min(messageSelection.start, messageSelection.end);
        const end = Math.max(messageSelection.start, messageSelection.end);
        const before = message.slice(0, start);
        const selected = message.slice(start, end);
        const after = message.slice(end);
        const markerLength = marker.length;

        if (selected.length === 0) {
            const nextMessage = `${before}${marker}${marker}${after}`;
            const cursor = start + markerLength;
            setMessage(nextMessage);
            const nextSelection = { start: cursor, end: cursor };
            setMessageSelection(nextSelection);
            requestAnimationFrame(() => {
                messageInputRef.current?.setNativeProps({ selection: nextSelection });
            });
            return;
        }

        const hasPrefix = before.slice(-markerLength) === marker;
        const hasSuffix = after.slice(0, markerLength) === marker;

        if (hasPrefix && hasSuffix) {
            const nextMessage = `${before.slice(0, -markerLength)}${selected}${after.slice(markerLength)}`;
            setMessage(nextMessage);
            const nextSelection = { start: start - markerLength, end: end - markerLength };
            setMessageSelection(nextSelection);
            requestAnimationFrame(() => {
                messageInputRef.current?.setNativeProps({ selection: nextSelection });
            });
            return;
        }

        const nextMessage = `${before}${marker}${selected}${marker}${after}`;
        setMessage(nextMessage);
        const nextSelection = { start: start + markerLength, end: end + markerLength };
        setMessageSelection(nextSelection);
        requestAnimationFrame(() => {
            messageInputRef.current?.setNativeProps({ selection: nextSelection });
        });
    };

    const handleSend = async () => {
        if (isNews && !message.trim() && !imageUri) {
            showAlert('Error', 'Please add a message or image.');
            return;
        }

        if (!isNews && (!title.trim() || !message.trim())) {
            showAlert('Error', 'Please add a title and details.');
            return;
        }

        setSending(true);
        try {
            if (isNews) {
                await newsService.create(
                    '', // No headline
                    message.trim(),
                    user!.id,
                    user!.display_name,
                    imageUri || undefined
                );
            } else {
                await announcementService.create(
                    title.trim(),
                    message.trim(),
                    user!.id,
                    user!.display_name
                );
            }

            showAlert('Sent!', 'Your post has been created.', () => {
                // Force refresh on go back? 
                // Ideally screens should listen to focus or context, but for now just go back.
                navigation.goBack();
            });
        } catch (error) {
            console.error(error);
            showAlert('Error', 'Failed to send. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const hasSelection = Math.abs(messageSelection.end - messageSelection.start) > 0;

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={insets.top + 12}
        >
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>← Back</Text>
                </Pressable>
                <Text style={styles.headerTitle}>
                    {isNews ? 'New Post' : 'New Announcement'}
                </Text>
                <View style={{ width: 50 }} />
            </View>

            {/* Content Area */}
            <View style={styles.content}>
                {/* Image Preview - Only for News */}
                {isNews && imageUri && (
                    <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                        <Pressable style={styles.removeButton} onPress={removeImage}>
                            <Text style={styles.removeButtonText}>✕</Text>
                        </Pressable>
                    </View>
                )}

                {/* Title Input - Only for Announcements */}
                {!isNews && (
                    <TextInput
                        style={styles.titleInput}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Announcement Title"
                        placeholderTextColor={theme.colors.textSecondary}
                    />
                )}

            </View>

            {/* Composer */}
            <View style={[styles.composerContainer, { paddingBottom: insets.bottom + 10 }]}>
                {hasSelection && inputFocused && (
                    <View style={styles.formatToolbar}>
                        <Pressable style={styles.formatButton} onPress={() => applyFormatting('*')}>
                            <Text style={styles.formatButtonTextBold}>B</Text>
                        </Pressable>
                        <Pressable style={styles.formatButton} onPress={() => applyFormatting('_')}>
                            <Text style={styles.formatButtonTextItalic}>I</Text>
                        </Pressable>
                    </View>
                )}

                <View style={styles.composerRow}>
                    <TextInput
                        ref={messageInputRef}
                        style={[
                            styles.messageInput,
                            { height: Math.min(Math.max(messageInputHeight, MIN_INPUT_HEIGHT), MAX_INPUT_HEIGHT) },
                        ]}
                        value={message}
                        onChangeText={setMessage}
                        placeholder={isNews ? 'Type a message...' : 'Announcement details...'}
                        placeholderTextColor={theme.colors.textSecondary}
                        multiline
                        textAlignVertical="top"
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        onSelectionChange={(event) => {
                            const nextSelection = event.nativeEvent.selection;
                            setMessageSelection(nextSelection);
                        }}
                        onContentSizeChange={(event) => {
                            const nextHeight = event.nativeEvent.contentSize.height;
                            setMessageInputHeight(Math.min(Math.max(nextHeight, MIN_INPUT_HEIGHT), MAX_INPUT_HEIGHT));
                        }}
                    />
                {isNews && (
                    <Pressable style={styles.attachButton} onPress={pickImage}>
                        <Text style={styles.attachIcon}>📷</Text>
                    </Pressable>
                )}

                <Pressable
                    style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={sending}
                >
                    <Text style={styles.sendButtonText}>
                        {sending ? '...' : '>'}
                    </Text>
                </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
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
        padding: 16,
        backgroundColor: theme.colors.header,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },
    cancelText: {
        fontSize: 16,
        color: theme.colors.primary,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    formatToolbar: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 18,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    formatButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    formatButtonTextBold: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.textSecondary,
    },
    formatButtonTextItalic: {
        fontSize: 12,
        fontStyle: 'italic',
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    imagePreviewContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 12,
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    messageInput: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 16,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minHeight: 44,
    },
    titleInput: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 16,
    },
    composerContainer: {
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: theme.colors.header,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    composerRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    attachButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachIcon: {
        fontSize: 20,
    },
    sendButton: {
        width: 42,
        height: 42,
        backgroundColor: theme.colors.primary,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.6,
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});

