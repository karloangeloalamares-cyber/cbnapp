import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Pressable, Alert, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export const ProfileScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { user, logout, refreshProfile } = useAuth();

    const [displayName, setDisplayName] = useState(user?.display_name || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const showAlert = (title: string, msg: string) => {
        if (Platform.OS === 'web') {
            const alertFn = (globalThis as any)?.alert as ((message: string) => void) | undefined;
            if (alertFn) alertFn(msg);
            return;
        }
        Alert.alert(title, msg);
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setAvatarUrl(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            showAlert('Error', 'Failed to pick image');
        }
    };

    const uploadAvatar = async (uri: string): Promise<string | null> => {
        if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
            return uri; // Already a remote URL
        }

        try {
            const formData = new FormData();
            const filename = uri.split('/').pop() || `avatar-${Date.now()}.jpg`;
            const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
            const path = `avatars/${user?.id}/${Date.now()}.${ext}`;

            formData.append('file', {
                uri,
                name: filename,
                type: `image/${ext === 'jpg' ? 'jpeg' : ext}`
            } as any);

            const { data, error } = await supabase.storage
                .from('cbn_app_media')
                .upload(path, formData, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage.from('cbn_app_media').getPublicUrl(path);
            return publicUrl;
        } catch (error: any) {
            console.error('Upload failed:', error);
            throw new Error(error.message || 'Failed to upload avatar');
        }
    };

    const handleUpdate = async () => {
        if (!user) return;
        if (!displayName.trim()) {
            showAlert('Error', 'Display name cannot be empty');
            return;
        }

        setLoading(true);
        try {
            let finalAvatarUrl = user.avatar_url;

            if (avatarUrl && avatarUrl !== user.avatar_url) {
                setUploading(true);
                const uploadedUrl = await uploadAvatar(avatarUrl);
                if (uploadedUrl) {
                    finalAvatarUrl = uploadedUrl;
                }
                setUploading(false);
            }

            const { error } = await supabase
                .from('cbn_app_profiles')
                .update({
                    display_name: displayName.trim(),
                    avatar_url: finalAvatarUrl
                })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile(); // Refresh context
            showAlert('Success', 'Profile updated successfully.');
        } catch (error: any) {
            showAlert('Error', error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>&lt; Back</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 60 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                        <Image
                            source={{
                                uri: avatarUrl || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'
                            }}
                            style={styles.avatar}
                        />
                        <View style={styles.editIconContainer}>
                            <Text style={styles.editIcon}>📷</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.changePhotoText}>Tap to change photo</Text>
                </View>

                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, styles.disabledInput]}
                        value={user?.email || ''}
                        editable={false}
                    />
                </View>

                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Display Name</Text>
                    <TextInput
                        style={styles.input}
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="Enter display name"
                        placeholderTextColor={theme.colors.textSecondary}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleUpdate}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={async () => {
                        await logout();
                        // Context update will trigger navigation change automatically
                    }}
                >
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                        showAlert('Delete Account', 'Please contact an administrator to request account deletion.');
                    }}
                >
                    <Text style={styles.deleteText}>Delete Account</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.header,
    },
    backButton: {
        padding: 8,
    },
    backText: {
        fontSize: 16,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },
    content: {
        padding: 20,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarWrapper: {
        position: 'relative',
        width: 100,
        height: 100,
        marginBottom: 8,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
    editIcon: {
        fontSize: 16,
    },
    changePhotoText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '500',
    },
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    disabledInput: {
        backgroundColor: theme.colors.background,
        color: theme.colors.textSecondary,
    },
    button: {
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 24,
    },
    logoutButton: {
        padding: 16,
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        marginBottom: 12,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    deleteButton: {
        padding: 16,
        alignItems: 'center',
    },
    deleteText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
    },
});
