import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Platform, Image, KeyboardAvoidingView, ScrollView, Keyboard, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { newsService } from '../services/newsService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { Image as ExpoImage } from 'expo-image';

import { useTheme } from '../context/ThemeContext';
import { ComposerGalleryIcon, ComposerGifIcon, ComposerVideoIcon, ComposerChartIcon, ComposerMicIcon, SendPlaneIcon } from '../components/Icons';

import { useRoute } from '@react-navigation/native';
import { announcementService } from '../services/announcementService';
import * as Haptics from 'expo-haptics';

export const AdminPostScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const { user } = useAuth();
    const { theme } = useTheme();

    // Default to 'news' if not specified, but allow local toggling
    const initialType = route.params?.type || 'news';
    const [postType, setPostType] = useState<'news' | 'announcement'>(initialType);
    const isNews = postType === 'news';

    const [message, setMessage] = useState('');
    const [title, setTitle] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [videoAspectRatio, setVideoAspectRatio] = useState(1.77);
    const [sending, setSending] = useState(false);
    const [messageSelection, setMessageSelection] = useState({ start: 0, end: 0 });
    const [inputFocused, setInputFocused] = useState(false);
    const messageInputRef = useRef<TextInput>(null);

    // Manual keyboard height tracking
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const imageSource = useMemo(() => imageUri ? { uri: imageUri } : undefined, [imageUri]);

    React.useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

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
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
            setVideoUri(null); // Clear video if image picked
        }
    };

    const pickVideo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permission Required', 'Please allow access to gallery.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setVideoUri(result.assets[0].uri);
            setImageUri(null); // Clear image if video picked
        }
    };

    const removeMedia = () => {
        setImageUri(null);
        setVideoUri(null);
    };

    const buildPushBody = (value: string, fallback: string) => {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed.slice(0, 140) : fallback;
    };

    const sendPush = async (payload: {
        type: 'news_posted' | 'announcement_posted';
        title: string;
        body: string;
        target_type: 'news' | 'announcement';
        target_id: string;
    }): Promise<{ ok: boolean; warning: string | null }> => {
        try {
            await supabase.auth.refreshSession();
            const { data, error } = await supabase.functions.invoke('send-push', { body: payload });
            if (error) {
                return { ok: false, warning: error.message || 'Unknown push error.' };
            }

            const failed = typeof (data as any)?.failed === 'number' ? (data as any).failed : 0;
            if (failed > 0) {
                const label = failed === 1 ? 'notification' : 'notifications';
                return { ok: false, warning: `${failed} ${label} failed to send.` };
            }

            return { ok: true, warning: null };
        } catch (error: any) {
            return { ok: false, warning: error?.message ?? 'Push request failed.' };
        }
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
            // Generate thumbnail if video exists and no image selected
            let finalImageUri = imageUri;
            if (videoUri && !imageUri) {
                try {
                    console.log('Generating thumbnail for video...');
                    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
                        quality: 0.7,
                    });
                    finalImageUri = uri;
                } catch (e) {
                    console.warn('Failed to generate thumbnail:', e);
                }
            }

            let pushResult: { ok: boolean; warning: string | null } = { ok: true, warning: null };
            if (isNews) {
                const created = await newsService.create(
                    '', // No headline
                    message.trim(),
                    user!.id,
                    user!.display_name,
                    finalImageUri || undefined,
                    videoUri || undefined
                );
                pushResult = await sendPush({
                    type: 'news_posted',
                    title: 'News Update',
                    body: buildPushBody(message, 'New photo update posted.'),
                    target_type: 'news',
                    target_id: created.id,
                });
            } else {
                const created = await announcementService.create(
                    title.trim(),
                    message.trim(),
                    user!.id,
                    user!.display_name,
                    finalImageUri || undefined,
                    videoUri || undefined
                );
                pushResult = await sendPush({
                    type: 'announcement_posted',
                    title: `Announcement: ${title.trim()}`,
                    body: buildPushBody(message, 'Open the app to view the full announcement.'),
                    target_type: 'announcement',
                    target_id: created.id,
                });
            }

            if (pushResult.ok) {
                if (pushResult.warning) {
                    console.warn('Push warning:', pushResult.warning);
                }
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showAlert('Success', `${isNews ? 'News' : 'Announcement'} posted!`, () => navigation.goBack());
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showAlert('Posted with Push Issues', `Your post was created, but push failed: ${pushResult.warning}`, () => {
                    navigation.goBack();
                });
            }
        } catch (error: any) {
            console.error('Failed to post:', error);
            showAlert('Error', `Failed to save post: ${error.message || 'Unknown error'}`);
        } finally {
            setSending(false);
        }
    };

    const composerPaddingBottom = insets.bottom + 10;

    // Floating button position calculation
    // Bottom value should be keyboardHeight + toolbar height + slight gap
    // On iOS, keyboardHeight already starts from the bottom of the screen.
    const floatingBottom = keyboardHeight > 0
        ? keyboardHeight + 60
        : composerPaddingBottom + 60;

    const avatarUrl = user?.avatar_url;

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: theme.colors.header,
            zIndex: 10,
        },
        backButton: {
            padding: 8,
        },
        backArrow: {
            fontSize: 28,
            color: theme.colors.text,
            fontWeight: '300',
        },
        segmentedControl: {
            flexDirection: 'row',
            backgroundColor: theme.dark ? '#1E1E1E' : '#E5E5EA',
            borderRadius: 19,
            padding: 4,
            height: 38,
            alignItems: 'center',
        },
        segment: {
            borderRadius: 15,
            paddingVertical: 4,
            paddingHorizontal: 16,
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
        },
        segmentActive: {
            backgroundColor: theme.colors.primary,
        },
        segmentText: {
            color: theme.colors.textSecondary,
            fontSize: 14,
            fontWeight: '500',
        },
        segmentTextActive: {
            color: '#FFFFFF',
            fontWeight: '600',
        },
        contentContainer: {
            flex: 1,
            paddingHorizontal: 16,
            paddingTop: 16,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'flex-start',
        },
        avatarContainer: {
            marginRight: 12,
            paddingTop: 4,
        },
        avatarPlaceholder: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.border,
        },
        avatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
        },
        inputWrapper: {
            flex: 1,
        },
        inputTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 8,
            padding: 0,
        },
        inputMessage: {
            fontSize: 18,
            color: theme.colors.text,
            minHeight: 100,
            padding: 0,
            textAlignVertical: 'top',
        },
        imagePreviewContainer: {
            marginTop: 12,
            position: 'relative',
            borderRadius: 16,
            overflow: 'hidden',
        },
        imagePreview: {
            width: '100%',
            height: 200,
            borderRadius: 16,
            backgroundColor: theme.colors.border,
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
            fontSize: 16,
            fontWeight: 'bold',
        },
        toolbarContainer: {
            backgroundColor: 'transparent',
            paddingHorizontal: 16,
            paddingTop: 8,
            overflow: 'hidden', // Required for blur radius if we had one, but good practice
        },
        toolbarBlur: {
            paddingHorizontal: 16,
            paddingTop: 8,
        },
        divider: {
            height: 1,
            backgroundColor: theme.colors.border,
            marginBottom: 12,
        },
        toolbarRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        iconsRow: {
            flexDirection: 'row',
            gap: 24, // Increased gap for better touch targets and premium feel
            alignItems: 'center',
        },
        iconButton: {
            padding: 4,
        },
        floatingActionContainer: {
            position: 'absolute',
            right: 16,
            alignItems: 'flex-end',
            zIndex: 20,
        },
        postButton: {
            backgroundColor: theme.colors.primary,
            borderRadius: 20,
            paddingVertical: 8,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        postButtonDisabled: {
            opacity: 0.5,
        },
        postButtonText: {
            color: '#FFFFFF',
            fontWeight: '600',
            fontSize: 16,
        },
    }), [theme]);

    return (
        <KeyboardAvoidingView
            style={[
                styles.container,
                { paddingTop: insets.top },
            ]}
            behavior={undefined}
        >
            {/* Custom Header with Segmented Control */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backArrow}>←</Text>
                </Pressable>

                <View style={styles.segmentedControl}>
                    <Pressable
                        style={[styles.segment, isNews && styles.segmentActive]}
                        onPress={() => setPostType('news')}
                    >
                        <Text style={[styles.segmentText, isNews && styles.segmentTextActive]}>Post</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.segment, !isNews && styles.segmentActive]}
                        onPress={() => setPostType('announcement')}
                    >
                        <Text style={[styles.segmentText, !isNews && styles.segmentTextActive]}>Announcement</Text>
                    </Pressable>
                </View>

                {/* Spacer to balance back button */}
                <View style={{ width: 44 }} />
            </View>

            {/* Content Area */}
            <ScrollView
                style={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 100 }} // Space for floating button
            >
                <View style={styles.row}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder} />
                        )}
                    </View>

                    {/* Input Area */}
                    <View style={styles.inputWrapper}>
                        {/* Title Input - Only for Announcements */}
                        {!isNews && (
                            <TextInput
                                style={styles.inputTitle}
                                value={title}
                                onChangeText={setTitle}

                                placeholder="Announcement Title"
                                placeholderTextColor={theme.colors.textSecondary}
                            />
                        )}

                        <TextInput
                            ref={messageInputRef}
                            style={styles.inputMessage}
                            value={message}
                            onChangeText={setMessage}

                            placeholder={isNews ? "What's happening?" : "Announcement details..."}
                            placeholderTextColor={theme.colors.textSecondary}
                            multiline
                            textAlignVertical="top"
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            onSelectionChange={(event) => {
                                setMessageSelection(event.nativeEvent.selection);
                            }}
                        />

                        {/* Media Preview inside input area */}
                        {(imageUri || videoUri) && (
                            <View style={styles.imagePreviewContainer}>
                                {imageSource ? (
                                    <ExpoImage
                                        source={imageSource}
                                        style={styles.imagePreview}
                                        contentFit="contain"
                                    />
                                ) : (
                                    <Video
                                        source={{ uri: videoUri! }}
                                        style={[styles.imagePreview, { aspectRatio: videoAspectRatio }]}
                                        useNativeControls
                                        resizeMode={ResizeMode.CONTAIN}
                                        isLooping={false}
                                        onReadyForDisplay={(videoData) => {
                                            if (videoData.naturalSize.width && videoData.naturalSize.height) {
                                                setVideoAspectRatio(videoData.naturalSize.width / videoData.naturalSize.height);
                                            }
                                        }}
                                    />

                                )}
                                <Pressable style={styles.removeButton} onPress={removeMedia}>
                                    <Text style={styles.removeButtonText}>✕</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            <View style={[
                styles.floatingActionContainer,
                { bottom: floatingBottom }
            ]}>
                <Pressable
                    style={[styles.postButton, (sending || (!message.trim() && !imageUri && !title.trim())) && styles.postButtonDisabled]}
                    onPress={handleSend}
                    disabled={sending || (!message.trim() && !imageUri && !title.trim())}
                >
                    {sending && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 4 }} />}
                    <Text style={styles.postButtonText}>
                        {sending ? (imageUri || videoUri ? 'Uploading...' : 'Posting...') : 'Post'}
                    </Text>
                    {!sending && <SendPlaneIcon size={16} color="#FFFFFF" strokeWidth={2.5} />}
                </Pressable>
            </View>

            {/* Composer Toolbar */}
            <View style={[
                styles.toolbarContainer,
                {
                    paddingBottom: keyboardHeight > 0 ? (Platform.OS === 'ios' ? keyboardHeight : keyboardHeight) : composerPaddingBottom
                }
            ]}>
                <BlurView
                    intensity={Platform.OS === 'ios' ? 50 : 20}
                    tint={theme.dark ? 'dark' : 'light'}
                    style={{
                        paddingBottom: keyboardHeight > 0 ? (Platform.OS === 'ios' ? 10 : 10) : 0,
                    }}
                >
                    <View style={[styles.toolbarBlur, { backgroundColor: theme.dark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }]}>
                        {/* Horizontal Divider Line */}
                        <View style={styles.divider} />

                        <View style={styles.toolbarRow}>
                            <View style={styles.iconsRow}>
                                <Pressable style={styles.iconButton} onPress={pickImage}>
                                    <ComposerGalleryIcon size={24} color={theme.colors.primary} />
                                </Pressable>
                                <Pressable style={styles.iconButton} onPress={() => showAlert('Coming Soon', 'GIF support coming soon!')}>
                                    <ComposerGifIcon size={24} color={theme.colors.primary} />
                                </Pressable>
                                <Pressable style={styles.iconButton} onPress={pickVideo}>
                                    <ComposerVideoIcon size={24} color={theme.colors.primary} />
                                </Pressable>
                                <Pressable style={styles.iconButton} onPress={() => showAlert('Coming Soon', 'Polls support coming soon!')}>
                                    <ComposerChartIcon size={24} color={theme.colors.primary} />
                                </Pressable>
                            </View>

                            {/* Microphone on the right */}
                            <Pressable style={styles.iconButton} onPress={() => showAlert('Coming Soon', 'Voice support coming soon!')}>
                                <ComposerMicIcon size={24} color={theme.colors.primary} />
                            </Pressable>
                        </View>
                    </View>
                </BlurView>
            </View>
        </KeyboardAvoidingView>
    );
};
