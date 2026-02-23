// ... (imports remain same but double check them in implementation)
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator, Keyboard } from 'react-native';
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
import { Avatar } from '../components/Avatar';
import * as Haptics from 'expo-haptics';

export const AdminPostScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const { user } = useAuth();
    const { theme } = useTheme();

    const ACCENT_RED = '#FF3B30';

    const initialType = route.params?.type || 'news';
    const [postType, setPostType] = useState<'news' | 'announcement'>(initialType);
    const isNews = postType === 'news';

    const [message, setMessage] = useState('');
    const [title, setTitle] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageAspectRatio, setImageAspectRatio] = useState(1.5);
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [videoAspectRatio, setVideoAspectRatio] = useState(1.77);
    const [sending, setSending] = useState(false);
    const messageInputRef = useRef<TextInput>(null);

    const imageSource = useMemo(() => imageUri ? { uri: imageUri } : undefined, [imageUri]);

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
        if (status !== 'granted') return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
            setVideoUri(null);
        }
    };

    const pickVideo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setVideoUri(result.assets[0].uri);
            setImageUri(null);
        }
    };

    const removeMedia = () => {
        setImageUri(null);
        setVideoUri(null);
    };

    const handleSend = async () => {
        if (isNews && !message.trim() && !imageUri) return;
        if (!isNews && (!title.trim() || !message.trim())) return;

        setSending(true);
        try {
            let finalImageUri = imageUri;
            if (videoUri && !imageUri) {
                try {
                    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { quality: 0.7 });
                    finalImageUri = uri;
                } catch (e) { console.warn(e); }
            }

            if (isNews) {
                await newsService.create('', message.trim(), user!.id, user!.display_name, finalImageUri || undefined, videoUri || undefined);
            } else {
                await announcementService.create(title.trim(), message.trim(), user!.id, user!.display_name, finalImageUri || undefined, videoUri || undefined);
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.goBack();
        } catch (error: any) {
            showAlert('Error', `Failed to save post: ${error.message || 'Unknown error'}`);
        } finally {
            setSending(false);
        }
    };

    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const hideSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#000000', // Reference shows solid black
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingBottom: 12,
        },
        backButton: {
            padding: 12,
            minWidth: 44,
            minHeight: 44,
            justifyContent: 'center',
        },
        backArrow: {
            fontSize: 24,
            color: '#FFFFFF',
        },
        segmentedContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: '#333333',
            borderRadius: 20,
            padding: 2,
        },
        segmentButton: {
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: 18,
            minWidth: 80,
            alignItems: 'center',
        },
        segmentButtonActive: {
            backgroundColor: ACCENT_RED,
        },
        segmentText: {
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '600',
            fontFamily: 'Inter',
        },
        content: {
            flex: 1,
        },
        composerRow: {
            flexDirection: 'row',
            paddingTop: 20,
            paddingHorizontal: 16,
        },
        avatarCol: {
            marginRight: 12,
        },
        inputCol: {
            flex: 1,
        },
        inputTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: 8,
            fontFamily: 'Inter',
        },
        inputMessage: {
            fontSize: 18,
            color: '#FFFFFF',
            minHeight: 100,
            fontFamily: 'Inter',
            lineHeight: 26,
            textAlignVertical: 'top',
        },
        mediaPreview: {
            marginTop: 16,
            borderRadius: 14,
            overflow: 'hidden',
            backgroundColor: '#111',
            borderWidth: 1,
            borderColor: '#222',
        },
        removeBtn: {
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.6)',
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
        },
        footer: {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: '#222',
        },
        actionRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 12,
        },
        postBtn: {
            backgroundColor: ACCENT_RED,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            gap: 6,
        },
        postBtnDisabled: {
            opacity: 0.5,
        },
        postBtnText: {
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: 15,
            fontFamily: 'Inter',
        },
        toolbar: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#000',
        },
        toolbarIcons: {
            flexDirection: 'row',
            gap: 20,
        },
    }), [theme]);

    return (
        <View style={styles.container}>
            <View style={{ height: insets.top, backgroundColor: '#000' }} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior="padding"
                enabled={true}
                keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
                        <Text style={styles.backArrow}>←</Text>
                    </Pressable>

                    <View style={styles.segmentedContainer}>
                        <Pressable
                            style={[styles.segmentButton, isNews && styles.segmentButtonActive]}
                            onPress={() => setPostType('news')}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: isNews }}
                            accessibilityLabel="Post"
                        >
                            <Text style={styles.segmentText}>Post</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.segmentButton, !isNews && styles.segmentButtonActive]}
                            onPress={() => setPostType('announcement')}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: !isNews }}
                            accessibilityLabel="Announcement"
                        >
                            <Text style={styles.segmentText}>Announcement</Text>
                        </Pressable>
                    </View>
                    <View style={{ width: 32 }} />
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.composerRow}>
                        <View style={styles.avatarCol}>
                            <Avatar
                                url={user?.avatar_url}
                                name={user?.display_name || 'Admin'}
                                size={44}
                            />
                        </View>
                        <View style={styles.inputCol}>
                            {!isNews && (
                                <TextInput
                                    style={styles.inputTitle}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="Announcement Title"
                                    placeholderTextColor="#666"
                                    accessibilityLabel="Announcement title"
                                    returnKeyType="next"
                                />
                            )}
                            <TextInput
                                ref={messageInputRef}
                                style={styles.inputMessage}
                                value={message}
                                onChangeText={setMessage}
                                placeholder={isNews ? "What's happening?" : "Announcement details..."}
                                placeholderTextColor="#666"
                                multiline
                                autoFocus
                            />

                            {(imageUri || videoUri) && (
                                <View style={styles.mediaPreview}>
                                    <Pressable style={styles.removeBtn} onPress={removeMedia} accessibilityRole="button" accessibilityLabel="Remove media">
                                        <Text style={{ color: '#fff', fontSize: 12 }}>✕</Text>
                                    </Pressable>
                                    {imageUri ? (
                                        <ExpoImage
                                            source={{ uri: imageUri }}
                                            style={{ width: '100%', aspectRatio: imageAspectRatio }}
                                            contentFit="cover"
                                            onLoad={e => setImageAspectRatio(e.source.width / e.source.height)}
                                        />
                                    ) : (
                                        <Video
                                            source={{ uri: videoUri! }}
                                            style={{ width: '100%', aspectRatio: videoAspectRatio }}
                                            useNativeControls
                                            resizeMode={ResizeMode.CONTAIN}
                                            onReadyForDisplay={e => setVideoAspectRatio(e.naturalSize.width / e.naturalSize.height)}
                                        />
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>

                {/* Footer (Pinned to bottom of flex container) */}
                <View style={styles.footer}>
                    {/* Action Row (Post Button) */}
                    <View style={styles.actionRow}>
                        <View />
                        <Pressable
                            style={[styles.postBtn, (sending || (!message.trim() && !imageUri && !title.trim())) && styles.postBtnDisabled]}
                            onPress={handleSend}
                            disabled={sending || (!message.trim() && !imageUri && !title.trim())}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.postBtnText}>Post</Text>
                                    <SendPlaneIcon size={14} color="#FFFFFF" strokeWidth={3} />
                                </>
                            )}
                        </Pressable>
                    </View>

                    {/* Toolbar */}
                    <View style={styles.toolbar}>
                        <View style={styles.toolbarIcons}>
                            <Pressable onPress={pickImage} accessibilityRole="button" accessibilityLabel="Add image" hitSlop={8}><ComposerGalleryIcon size={24} color="#FFFFFF" /></Pressable>
                            <Pressable accessibilityRole="button" accessibilityLabel="Add GIF" hitSlop={8}><ComposerGifIcon size={24} color="#FFFFFF" /></Pressable>
                            <Pressable onPress={pickVideo} accessibilityRole="button" accessibilityLabel="Add video" hitSlop={8}><ComposerVideoIcon size={24} color="#FFFFFF" /></Pressable>
                            <Pressable accessibilityRole="button" accessibilityLabel="Add chart" hitSlop={8}><ComposerChartIcon size={24} color="#FFFFFF" /></Pressable>
                        </View>
                        <Pressable accessibilityRole="button" accessibilityLabel="Record audio" hitSlop={8}><ComposerMicIcon size={24} color="#FFFFFF" /></Pressable>
                    </View>
                    {Platform.OS === 'ios' && !isKeyboardVisible && <View style={{ height: insets.bottom }} />}
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};
