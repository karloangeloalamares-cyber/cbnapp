import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Pressable, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export const LoginScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { login, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            alert('Please enter both email and password');
            return;
        }
        await login(email.trim(), password.trim());
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={insets.top + 12}
        >
            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                keyboardShouldPersistTaps="handled"
            >
                <Image
                    source={require('../../assets/CBN_Logo-removebg-preview.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
                <Text style={styles.title}>CBN Unfiltered</Text>
                <Text style={styles.subtitle}>Stay updated with news & announcements</Text>

                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        placeholderTextColor={theme.colors.textSecondary}
                        secureTextEntry={!showPassword}
                    />
                    <Pressable style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                        <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </Pressable>
                </View>

                <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotPasswordButton}>
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </Pressable>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </Text>
                </TouchableOpacity>

                <Pressable onPress={() => navigation.navigate('SignUp')}>
                    <Text style={styles.linkText}>Create an account</Text>
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
        marginBottom: 40,
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
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '500',
    },
    linkText: {
        marginTop: 16,
        fontSize: 14,
        color: theme.colors.primary,
        textAlign: 'center',
    }
});
