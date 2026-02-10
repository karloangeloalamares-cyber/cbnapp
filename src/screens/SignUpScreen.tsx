import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform, Alert, Pressable, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export const SignUpScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { signUp, loading } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const showAlert = (title: string, msg: string, onOk?: () => void) => {
        if (Platform.OS === 'web') {
            const alertFn = (globalThis as any)?.alert as ((message: string) => void) | undefined;
            if (alertFn) alertFn(msg);
            onOk?.();
            return;
        }
        Alert.alert(title, msg, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    };

    const handleSignUp = async () => {
        if (!displayName.trim() || !email.trim() || !password.trim()) {
            showAlert('Missing info', 'Please fill all fields.');
            return;
        }
        if (password.length < 6) {
            showAlert('Weak password', 'Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            showAlert('Passwords do not match', 'Please re-enter your password.');
            return;
        }

        const result = await signUp(email.trim(), password, displayName.trim());
        if (result.success && result.needsEmailConfirmation) {
            showAlert('Check your email', 'We sent a confirmation link. Please verify, then log in.', () => {
                navigation.goBack();
            });
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
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join CBN Unfiltered</Text>

                <TextInput
                    style={styles.input}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Display name"
                    placeholderTextColor={theme.colors.textSecondary}
                    autoCapitalize="words"
                />

                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor={theme.colors.textSecondary}
                    secureTextEntry
                />

                <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password"
                    placeholderTextColor={theme.colors.textSecondary}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSignUp}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </Text>
                </TouchableOpacity>

                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.linkText}>Already have an account? Log in</Text>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
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
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 30,
    },
    logoImage: {
        width: 120,
        height: 80,
        alignSelf: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: theme.colors.text,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    button: {
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    linkText: {
        marginTop: 20,
        fontSize: 14,
        color: theme.colors.primary,
        textAlign: 'center',
    }
});
