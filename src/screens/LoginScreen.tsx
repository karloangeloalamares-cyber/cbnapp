import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Pressable, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GoogleIcon } from '../components/Icons';

export const LoginScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { login, loading, googleLogin } = useAuth();
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const styles = React.useMemo(() => createStyles(theme), [theme]);

    const handleLogin = async () => {
        setError('');
        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password');
            return;
        }
        const result = await login(email.trim(), password.trim());
        if (!result.success && result.error) {
            setError(result.error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            navigation.navigate('Welcome');
                        }
                    }}
                    style={styles.backButton}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Log in</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.welcomeText}>Welcome Back</Text>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setError('');
                            }}
                            placeholder="Email"
                            placeholderTextColor={theme.colors.textSecondary}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            textContentType="emailAddress"
                            autoComplete="email"
                            returnKeyType="next"
                            accessibilityLabel="Email address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setError('');
                            }}
                            placeholder="Password"
                            placeholderTextColor={theme.colors.textSecondary}
                            secureTextEntry={!showPassword}
                            textContentType="password"
                            autoComplete="password"
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
                            accessibilityLabel="Password"
                        />
                        <Pressable
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.passwordToggle}
                            accessibilityRole="button"
                            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                            hitSlop={8}
                        >
                            <Text style={styles.passwordToggleText}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
                        </Pressable>
                    </View>

                    {error ? <Text style={styles.errorText} accessibilityRole="alert" accessibilityLiveRegion="assertive">{error}</Text> : null}

                    <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                        <Text style={styles.forgotPassword}>Forgot password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.loginButton, loading && { opacity: 0.7 }]}
                        onPress={handleLogin}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel={loading ? 'Logging in' : 'Log in'}
                        accessibilityState={{ disabled: loading, busy: loading }}
                    >
                        <Text style={styles.loginButtonText}>{loading ? 'LOGGING IN...' : 'LOG IN'}</Text>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={async () => {
                            setError('');
                            const result = await googleLogin();
                            if (!result.success && result.error) {
                                setError(result.error);
                            }
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Sign in with Google"
                    >
                        <GoogleIcon size={20} />
                        <Text style={styles.googleButtonText}>Sign in with Google</Text>
                    </TouchableOpacity>
                </View>
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
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingBottom: 20,
        },
        backButton: {
            padding: 12,
            minWidth: 44,
            minHeight: 44,
            justifyContent: 'center',
        },
        backArrow: {
            color: theme.colors.text,
            fontSize: 24,
        },
        headerTitle: {
            color: theme.colors.text,
            fontSize: 16,
            fontFamily: 'Inter',
            fontWeight: '500',
        },
        content: {
            paddingHorizontal: 24,
            paddingTop: 40,
        },
        welcomeText: {
            fontSize: 32,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: 40,
            fontFamily: 'Inter',
            fontWeight: '600',
        },
        form: {
            gap: 16,
        },
        inputContainer: {
            backgroundColor: theme.colors.inputBackground,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
            height: 56,
            justifyContent: 'center',
            paddingHorizontal: 16,
        },
        input: {
            color: theme.colors.text,
            fontSize: 16,
            fontFamily: 'Inter',
            flex: 1,
        },
        passwordToggle: {
            position: 'absolute',
            right: 16,
        },
        passwordToggleText: {
            color: theme.colors.primary,
            fontSize: 12,
            fontWeight: '700',
            fontFamily: 'Inter',
        },
        forgotPassword: {
            color: theme.colors.textSecondary,
            fontSize: 14,
            fontFamily: 'Inter',
            marginTop: 4,
            marginBottom: 24,
        },
        loginButton: {
            backgroundColor: theme.colors.primary,
            borderRadius: 12,
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
        },
        loginButtonText: {
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 'bold',
            fontFamily: 'Inter',
            letterSpacing: 0.5,
        },
        dividerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 16,
        },
        dividerLine: {
            flex: 1,
            height: 1,
            backgroundColor: theme.colors.border,
        },
        dividerText: {
            color: theme.colors.textSecondary,
            paddingHorizontal: 16,
            fontSize: 14,
            fontFamily: 'Inter',
        },
        googleButton: {
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 1,
            },
            shadowOpacity: 0.20,
            shadowRadius: 1.41,
            elevation: 2,
        },
        googleButtonText: {
            color: 'rgba(0, 0, 0, 0.54)',
            fontSize: 16,
            fontWeight: '600',
            fontFamily: 'Roboto',
            marginLeft: 12,
        },
        errorText: {
            color: theme.colors.danger || '#FF4444',
            fontSize: 14,
            fontFamily: 'Inter',
            textAlign: 'center',
            marginBottom: 12,
        },
    });

