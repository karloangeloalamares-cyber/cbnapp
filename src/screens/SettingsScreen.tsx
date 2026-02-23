import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Pressable, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LogoutIcon, MoonIcon } from '../components/Icons';


export const SettingsScreen = () => {
    const { theme, isDarkMode, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.container}>
            <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 }]}>
                    <View style={styles.section}>
                        <View style={styles.profileRow}>
                            <Image
                                source={{
                                    uri: user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || 'User')}&background=333333&color=fff`
                                }}
                                style={styles.avatarPlaceholder}
                            />
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileName}>{user?.display_name || 'User'}</Text>
                                <Text style={styles.profileEmail}>{user?.email || ''}</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <View style={styles.section}>
                        <View style={styles.row}>
                            <View style={styles.rowContent}>
                                <View style={styles.iconWrap}>
                                    <MoonIcon size={18} color={theme.colors.textSecondary} strokeWidth={1.8} />
                                </View>
                                <Text style={styles.rowLabel}>Dark Mode</Text>
                            </View>
                            <Switch
                                value={isDarkMode}
                                onValueChange={toggleTheme}
                                accessibilityLabel="Dark mode"
                                trackColor={{
                                    false: theme.dark ? '#4B5563' : '#D1D5DB',
                                    true: `${theme.colors.primary}88`,
                                }}
                                thumbColor={isDarkMode ? '#FFFFFF' : theme.colors.surface}
                            />
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Account</Text>
                    <View style={styles.section}>
                        <Pressable style={styles.row} onPress={logout} accessibilityRole="button" accessibilityLabel="Log out">
                            <View style={styles.rowContent}>
                                <View style={styles.iconWrap}>
                                    <LogoutIcon size={18} color={theme.colors.danger || '#DC2626'} strokeWidth={1.8} />
                                </View>
                                <Text style={styles.logoutLabel}>Logout</Text>
                            </View>
                        </Pressable>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.versionText}>CBN App v1.0.0</Text>
                    </View>
                </ScrollView>
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
        content: {
            padding: 16,
        },
        section: {
            borderRadius: 12,
            marginBottom: 24,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            overflow: 'hidden',
        },
        sectionTitle: {
            fontSize: 12,
            fontWeight: '700',
            marginBottom: 8,
            marginLeft: 12,
            textTransform: 'uppercase',
            color: theme.colors.textSecondary,
            fontFamily: 'Inter',
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
        },
        rowContent: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        iconWrap: {
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.cardBackground || theme.colors.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
        },
        rowLabel: {
            fontSize: 16,
            fontWeight: '500',
            color: theme.colors.text,
            fontFamily: 'Inter',
        },
        logoutLabel: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.danger || '#DC2626',
            fontFamily: 'Inter',
        },
        profileRow: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
        },
        avatarPlaceholder: {
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: theme.dark ? '#334155' : '#E5E7EB',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
        },
        avatarText: {
            fontSize: 24,
            fontWeight: '700',
            color: theme.colors.text,
            fontFamily: 'Inter',
        },
        profileInfo: {
            flex: 1,
        },
        profileName: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.colors.text,
            fontFamily: 'Inter',
        },
        profileEmail: {
            fontSize: 14,
            marginTop: 2,
            color: theme.colors.textSecondary,
            fontFamily: 'Inter',
        },
        footer: {
            alignItems: 'center',
            paddingBottom: 20,
        },
        versionText: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            fontFamily: 'Inter',
        },
    });
