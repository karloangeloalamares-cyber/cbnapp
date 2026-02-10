import React, { useState } from 'react';
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

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

                {/* Message Input */}
                <TextInput
                    style={styles.messageInput}
                    value={message}
                    onChangeText={setMessage}
                    placeholder={isNews ? "Type a message..." : "Announcement details..."}
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                />
            </View>

            {/* Bottom Bar */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
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
                        {sending ? 'Sending...' : (isNews ? 'Post News' : 'Post Announcement')}
                    </Text>
                </Pressable>
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
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minHeight: 120,
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
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
        backgroundColor: theme.colors.header,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    attachButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachIcon: {
        fontSize: 24,
    },
    sendButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        borderRadius: 24,
        paddingVertical: 14,
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.6,
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
