import React, { useState, useRef, forwardRef } from 'react';
import { View, TextInput, StyleSheet, Pressable, Text, Image, ActivityIndicator, Platform, NativeSyntheticEvent, TextInputSelectionChangeEventData } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export interface ComposerRef {
    applyFormat: (marker: string) => void;
}

export type PostType = 'news' | 'announcement';

interface ComposerProps {
    onSend: (text: string, imageUri: string | null, postType: PostType) => Promise<void>;
    placeholder?: string;
    onSelectionChange?: (selection: { start: number; end: number }) => void;
}

export const Composer = forwardRef<ComposerRef, ComposerProps>(({ onSend, placeholder, onSelectionChange }, ref) => {
    const [text, setText] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [inputHeight, setInputHeight] = useState(40);
    const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
    const [showTypePicker, setShowTypePicker] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    const hasContent = text.trim() || imageUri;

    const handleSend = async (postType: PostType) => {
        if (!hasContent) return;

        setShowTypePicker(false);
        setSending(true);
        try {
            await onSend(text.trim(), imageUri, postType);
            setText('');
            setImageUri(null);
            setInputHeight(40);
        } catch (error) {
            console.error('Failed to send:', error);
        } finally {
            setSending(false);
        }
    };

    const handleSendPress = () => {
        if (!hasContent) return;
        setShowTypePicker(prev => !prev);
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!');
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

    const applyFormat = (marker: string) => {
        const start = Math.min(selection.start, selection.end);
        const end = Math.max(selection.start, selection.end);
        const selected = text.slice(start, end);

        const before = text.slice(0, start);
        const after = text.slice(end);
        const alreadyWrapped =
            before.endsWith(marker) && after.startsWith(marker);

        let newText: string;
        let newCursorEnd: number;

        if (alreadyWrapped) {
            newText =
                before.slice(0, -marker.length) +
                selected +
                after.slice(marker.length);
            newCursorEnd = start - marker.length + selected.length;
        } else {
            newText = before + marker + selected + marker + after;
            newCursorEnd = start + marker.length + selected.length;
        }

        setText(newText);
        const newStart = alreadyWrapped ? start - marker.length : start + marker.length;
        setTimeout(() => {
            setSelection({ start: newStart, end: newCursorEnd });
            inputRef.current?.focus();
        }, 50);
    };

    const handleSelectionChange = (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
        setSelection(e.nativeEvent.selection);
        if (onSelectionChange) {
            onSelectionChange(e.nativeEvent.selection);
        }
    };

    React.useImperativeHandle(ref, () => ({
        applyFormat
    }));

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            {/* Post Type Picker */}
            {showTypePicker && (
                <View style={[styles.typePickerContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <Pressable
                        style={[styles.typeOption, { backgroundColor: theme.colors.primary }]}
                        onPress={() => handleSend('news')}
                    >
                        <Text style={styles.typeOptionText}>Post as News</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.typeOption, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.primary }]}
                        onPress={() => handleSend('announcement')}
                    >
                        <Text style={[styles.typeOptionText, { color: theme.colors.primary }]}>Post as Announcement</Text>
                    </Pressable>
                </View>
            )}

            {/* Image Preview */}
            {imageUri && (
                <View style={[styles.imagePreviewContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    <Pressable
                        style={[styles.removeImageButton, { backgroundColor: theme.colors.textSecondary }]}
                        onPress={() => setImageUri(null)}
                    >
                        <Text style={styles.removeImageText}>✕</Text>
                    </Pressable>
                </View>
            )}

            <View style={styles.inputContainer}>
                <Pressable style={[styles.attachButton, { backgroundColor: theme.colors.surface }]} onPress={pickImage}>
                    <Text style={styles.attachIcon}>📷</Text>
                </Pressable>

                <TextInput
                    ref={inputRef}
                    style={[
                        styles.input,
                        {
                            height: Math.min(Math.max(40, inputHeight), 100),
                            backgroundColor: theme.colors.inputBackground,
                            color: theme.colors.text,
                            borderColor: theme.colors.border,
                        }
                    ]}
                    value={text}
                    onChangeText={(t) => {
                        setText(t);
                        if (showTypePicker) setShowTypePicker(false);
                    }}
                    placeholder={placeholder || "Type a news update..."}
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
                    onSelectionChange={handleSelectionChange}
                    selection={selection}
                />

                <Pressable
                    style={[styles.sendButton, { backgroundColor: theme.colors.primary }, !hasContent && { opacity: 0.5 }]}
                    onPress={handleSendPress}
                    disabled={sending || !hasContent}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.sendIcon}>➤</Text>
                    )}
                </Pressable>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 8,
        paddingTop: 8,
        backgroundColor: 'transparent',
    },
    typePickerContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
        padding: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    typeOption: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: 'center',
    },
    typeOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'Inter',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    attachButton: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        width: 44,
        height: 44,
    },
    attachIcon: {
        fontSize: 20,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        paddingTop: 10,
        fontSize: 16,
        fontFamily: 'Inter',
        maxHeight: 100,
        maxWidth: 650, // Strict reading length constraint (approx. 65ch)
        borderWidth: 1,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendIcon: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginLeft: 2,
    },
    imagePreviewContainer: {
        flexDirection: 'row',
        marginBottom: 8,
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    imagePreview: {
        width: 60,
        height: 60,
        borderRadius: 6,
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        left: 54,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    removeImageText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
