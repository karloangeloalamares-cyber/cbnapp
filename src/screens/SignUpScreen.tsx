import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform, Alert, Pressable, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GoogleIcon } from '../components/Icons';

export const SignUpScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { signUp, loading, googleLogin } = useAuth();
    const { theme } = useTheme();
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const styles = React.useMemo(() => createStyles(theme), [theme]);

    const handleSignUp = async () => {
        setError('');
        if (!displayName.trim() || !email.trim() || !password.trim()) {
            setError('Please fill all fields.');
            return;
        }
        if (password.length < 6) {
            setError('Password should be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const result = await signUp(email.trim(), password, displayName.trim());
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
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Back to Login</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.welcomeText}>Welcome to CBN Unfiltered</Text>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={displayName}
                            onChangeText={(text) => {
                                setDisplayName(text);
                                setError('');
                            }}
                            placeholder="Full Name"
                            placeholderTextColor={theme.colors.textSecondary}
                            autoCapitalize="words"
                        />
                    </View>

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
                        />
                        <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.passwordToggle}>
                            <Text style={styles.passwordToggleText}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
                        </Pressable>
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                setError('');
                            }}
                            placeholder="Confirm Password"
                            placeholderTextColor={theme.colors.textSecondary}
                            secureTextEntry
                        />
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.createButton, loading && { opacity: 0.7 }]}
                        onPress={handleSignUp}
                        disabled={loading}
                    >
                        <Text style={styles.createButtonText}>{loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</Text>
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
                    >
                        <GoogleIcon size={20} />
                        <Text style={styles.googleButtonText}>Sign up with Google</Text>
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
            padding: 8,
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
            paddingTop: 24,
            paddingBottom: 100,
        },
        welcomeText: {
            fontSize: 24,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: 32,
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
        createButton: {
            backgroundColor: theme.colors.primary,
            borderRadius: 12,
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 16,
        },
        createButtonText: {
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

