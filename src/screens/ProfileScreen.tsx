import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Pressable,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../services/supabaseClient';
import { SettingsIcon } from '../components/Icons';

export const ProfileScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { user, refreshProfile } = useAuth();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [loading, setLoading] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        setDisplayName(user.display_name || '');
        setAvatarUrl(user.avatar_url || null);
    }, [user]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets.length > 0) {
            setAvatarUrl(result.assets[0].uri);
        }
    };

    const handleUpdate = async () => {
        if (!user) return;
        const nextDisplayName = displayName.trim();

        if (!nextDisplayName) {
            Alert.alert('Display name required', 'Please enter a display name before saving.');
            return;
        }

        setLoading(true);
        try {
            const { error: profileError } = await supabase
                .from('cbn_app_profiles')
                .update({
                    display_name: nextDisplayName,
                    avatar_url: avatarUrl,
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Keep auth metadata aligned for any downstream consumers.
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    display_name: nextDisplayName,
                    avatar_url: avatarUrl,
                },
            });

            if (authError) {
                console.warn('Failed to update auth metadata', authError);
            }

            await refreshProfile();
            Alert.alert('Success', 'Profile updated successfully.');
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        displayName || user?.display_name || 'User'
    )}&background=333333&color=fff`;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    {/* Using a text arrow for now, but could be an icon */}
                    <Text style={styles.backText}>←</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <Pressable onPress={() => navigation.navigate('Main', { screen: 'Settings' })} style={styles.settingsButton}>
                    <SettingsIcon size={20} color={theme.colors.text} strokeWidth={1.8} />
                </Pressable>
            </View>

            <View style={styles.content}>
                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                        <Image
                            source={{ uri: avatarUrl || fallbackAvatar }}
                            style={styles.avatar}
                        />
                        <View style={styles.editBadge}>
                            <Text style={styles.editBadgeText}>Edit</Text>
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
                        placeholderTextColor={theme.colors.textSecondary}
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
                    <Text style={styles.buttonText}>{loading ? 'SAVING...' : 'SAVE CHANGES'}</Text>
                </TouchableOpacity>
            </View>
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
            paddingHorizontal: 20,
            paddingBottom: 20,
            paddingTop: 10,
        },
        backButton: {
            padding: 8,
        },
        settingsButton: {
            padding: 8,
        },
        backText: {
            fontSize: 24,
            color: theme.colors.text,
            fontFamily: 'Inter',
        },
        headerTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            fontFamily: 'Inter',
        },
        content: {
            padding: 24,
        },
        avatarContainer: {
            alignItems: 'center',
            marginBottom: 32,
        },
        avatarWrapper: {
            position: 'relative',
            width: 104,
            height: 104,
            marginBottom: 12,
        },
        avatar: {
            width: 104,
            height: 104,
            borderRadius: 52,
            backgroundColor: theme.colors.surface,
        },
        editBadge: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            backgroundColor: theme.colors.primary,
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderWidth: 2,
            borderColor: theme.colors.background,
        },
        editBadgeText: {
            fontSize: 10,
            fontWeight: '700',
            color: '#FFFFFF',
            fontFamily: 'Inter',
            textTransform: 'uppercase',
        },
        changePhotoText: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            fontFamily: 'Inter',
        },
        fieldContainer: {
            marginBottom: 20,
        },
        label: {
            fontSize: 14,
            marginBottom: 8,
            color: theme.colors.textSecondary,
            fontFamily: 'Inter',
        },
        input: {
            backgroundColor: theme.colors.inputBackground,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
            height: 56,
            justifyContent: 'center',
            paddingHorizontal: 16,
            color: theme.colors.text,
            fontSize: 16,
            fontFamily: 'Inter',
        },
        disabledInput: {
            opacity: 0.7,
            color: theme.colors.textSecondary,
        },
        button: {
            backgroundColor: theme.colors.primary,
            borderRadius: 12,
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 24,
        },
        buttonDisabled: {
            opacity: 0.7,
        },
        buttonText: {
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 'bold',
            fontFamily: 'Inter',
            letterSpacing: 0.5,
        },
    });

