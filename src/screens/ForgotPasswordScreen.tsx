import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, ScrollView, Platform, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../context/ThemeContext';

export const ForgotPasswordScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { theme } = useTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme]);

    const showAlert = (title: string, msg: string, onOk?: () => void) => {
        if (Platform.OS === 'web') {
            const alertFn = (globalThis as any)?.alert as ((message: string) => void) | undefined;
            if (alertFn) alertFn(msg);
            onOk?.();
            return;
        }
        Alert.alert(title, msg, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    };

    const handleReset = async () => {
        if (!email.trim()) {
            showAlert('Missing Email', 'Please enter your email address.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: 'cbnapp://reset-password', // Deep link if app supports it, or generic
            });

            if (error) {
                throw error;
            }

            showAlert(
                'Check your email',
                'We have sent a password reset link to your email.',
                () => navigation.goBack()
            );
        } catch (error: any) {
            showAlert('Error', error.message || 'Failed to send reset link.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={insets.top + 12}
        >
            <Pressable
                style={[styles.backButton, { top: insets.top + 8 }]}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backText}>&lt; Back</Text>
            </Pressable>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                keyboardShouldPersistTaps="handled"
            >
                <Image
                    source={require('../../assets/CBN_Logo-removebg-preview.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>Enter your email to receive a reset link</Text>

                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleReset}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const createStyles = (theme: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        backButton: {
            position: 'absolute',
            left: 16,
            zIndex: 1,
            paddingVertical: 6,
            paddingHorizontal: 8,
        },
        backText: {
            fontSize: 14,
            color: theme.colors.primary,
            fontWeight: '600',
            fontFamily: 'Inter',
        },
        content: {
            flexGrow: 1,
            justifyContent: 'center',
            padding: 30,
        },
        logoImage: {
            width: 100,
            height: 60,
            alignSelf: 'center',
            marginBottom: 16,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: 8,
            fontFamily: 'Inter',
        },
        subtitle: {
            fontSize: 16,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginBottom: 32,
            fontFamily: 'Inter',
        },
        input: {
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            color: theme.colors.text,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: theme.colors.border,
            fontFamily: 'Inter',
        },
        button: {
            backgroundColor: theme.colors.primary,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
        },
        buttonDisabled: {
            opacity: 0.6,
        },
        buttonText: {
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: '600',
            fontFamily: 'Inter',
        },
    });
