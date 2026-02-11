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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const showAlert = (title: string, msg: string, onOk?: () => void) => {
        if (Platform.OS === 'web') {
            const alertFn = (globalThis as any)?.alert as ((message: string) => void) | undefined;
            if (alertFn) alertFn(msg);
            onOk?.();
            return;
        }
        Alert.alert(title, msg, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    };

    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;

    const handleSignUp = async () => {
        if (!displayName.trim() || !email.trim() || !password.trim()) {
            showAlert('Missing info', 'Please fill all fields.');
            return;
        }
        if (!isPasswordValid) {
            showAlert('Weak password', 'Password must meet all requirements listed below.');
            return;
        }
        if (password !== confirmPassword) {
            showAlert('Passwords do not match', 'Please re-enter your password.');
            return;
        }

        await signUp(email.trim(), password, displayName.trim());
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

                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        placeholderTextColor={theme.colors.textSecondary}
                        secureTextEntry={!showPassword}
                    />
                    <Pressable style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                        <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </Pressable>
                </View>

                {password.length > 0 && (
                    <View style={styles.requirementsBox}>
                        <Text style={[styles.reqItem, hasMinLength && styles.reqMet]}>
                            {hasMinLength ? '\u2713' : '\u2022'} At least 8 characters
                        </Text>
                        <Text style={[styles.reqItem, hasUppercase && styles.reqMet]}>
                            {hasUppercase ? '\u2713' : '\u2022'} One uppercase letter (A-Z)
                        </Text>
                        <Text style={[styles.reqItem, hasLowercase && styles.reqMet]}>
                            {hasLowercase ? '\u2713' : '\u2022'} One lowercase letter (a-z)
                        </Text>
                        <Text style={[styles.reqItem, hasNumber && styles.reqMet]}>
                            {hasNumber ? '\u2713' : '\u2022'} One number (0-9)
                        </Text>
                        <Text style={[styles.reqItem, hasSymbol && styles.reqMet]}>
                            {hasSymbol ? '\u2713' : '\u2022'} One symbol (!@#$...)
                        </Text>
                    </View>
                )}

                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm password"
                        placeholderTextColor={theme.colors.textSecondary}
                        secureTextEntry={!showConfirmPassword}
                    />
                    <Pressable style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Text style={styles.eyeText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                    </Pressable>
                </View>

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
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 16,
    },
    passwordInput: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: theme.colors.text,
    },
    eyeButton: {
        paddingHorizontal: 14,
        paddingVertical: 16,
    },
    eyeText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    requirementsBox: {
        backgroundColor: theme.colors.surface,
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    reqItem: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    reqMet: {
        color: '#2E7D32',
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
