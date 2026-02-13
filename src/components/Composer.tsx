import React, { useState, useRef, forwardRef } from 'react';
import { View, TextInput, StyleSheet, Pressable, Text, Image, ActivityIndicator, Platform, NativeSyntheticEvent, TextInputSelectionChangeEventData } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';

export interface ComposerRef {
    applyFormat: (marker: string) => void;
}

interface ComposerProps {
    onSend: (text: string, imageUri: string | null) => Promise<void>;
    type: 'news' | 'announcement';
    placeholder?: string;
    onSelectionChange?: (selection: { start: number; end: number }) => void;
}

export const Composer = forwardRef<ComposerRef, ComposerProps>(({ onSend, type, placeholder, onSelectionChange }, ref) => {
    const [text, setText] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [inputHeight, setInputHeight] = useState(40);
    const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
    const inputRef = useRef<TextInput>(null);
    const { theme } = useTheme();

    const isNews = type === 'news';

    const handleSend = async () => {
        if (!text.trim() && !imageUri) return;

        setSending(true);
        try {
            await onSend(text.trim(), imageUri);
            setText('');
            setImageUri(null);
            setInputHeight(40);
        } catch (error) {
            console.error('Failed to send:', error);
        } finally {
            setSending(false);
        }
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

        // Check if already wrapped with this marker — toggle off
        const before = text.slice(0, start);
        const after = text.slice(end);
        const alreadyWrapped =
            before.endsWith(marker) && after.startsWith(marker);

        let newText: string;
        let newCursorEnd: number;

        if (alreadyWrapped) {
            // Remove markers
            newText =
                before.slice(0, -marker.length) +
                selected +
                after.slice(marker.length);
            newCursorEnd = start - marker.length + selected.length;
        } else {
            // Add markers
            newText = before + marker + selected + marker + after;
            newCursorEnd = start + marker.length + selected.length;
        }

        setText(newText);
        // Move cursor to end of formatted text
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
        <View style={styles.container}>
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
                {isNews && (
                    <Pressable style={[styles.attachButton, { backgroundColor: theme.colors.surface }]} onPress={pickImage}>
                        <Text style={styles.attachIcon}>📷</Text>
                    </Pressable>
                )}

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
                    onChangeText={setText}
                    placeholder={placeholder || (isNews ? "Type a news update..." : "Type an announcement...")}
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
                    onSelectionChange={handleSelectionChange}
                    selection={selection}
                />

                <Pressable
                    style={[styles.sendButton, { backgroundColor: theme.colors.primary }, (!text.trim() && !imageUri) && { opacity: 0.5 }]}
                    onPress={handleSend}
                    disabled={sending || (!text.trim() && !imageUri)}
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
        paddingVertical: 8,
        backgroundColor: 'transparent',
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
