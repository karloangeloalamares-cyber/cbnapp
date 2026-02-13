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

    const handleSignUp = async () => {
        if (!displayName.trim() || !email.trim() || !password.trim()) {
            showAlert('Missing info', 'Please fill all fields.');
            return;
        }
        if (password.length < 6) {
            showAlert('Weak Password', 'Password should be at least 6 characters.');
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
                            onChangeText={setDisplayName}
                            placeholder="Full Name"
                            placeholderTextColor="#666666"
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email"
                            placeholderTextColor="#666666"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Password"
                            placeholderTextColor="#666666"
                            secureTextEntry={!showPassword}
                        />
                        <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            {/* Placeholder for eye icon */}
                            <Text style={{ color: '#666', fontSize: 18 }}>👁️</Text>
                        </Pressable>
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm Password"
                            placeholderTextColor="#666666"
                            secureTextEntry
                        />
                    </View>

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
                        onPress={googleLogin}
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
            backgroundColor: '#000000',
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
            color: '#fff',
            fontSize: 24,
        },
        headerTitle: {
            color: '#fff',
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
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: 32,
            fontFamily: 'Inter',
            fontWeight: '600',
        },
        form: {
            gap: 16,
        },
        inputContainer: {
            backgroundColor: '#111111',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#333333',
            height: 56,
            justifyContent: 'center',
            paddingHorizontal: 16,
        },
        input: {
            color: '#FFFFFF',
            fontSize: 16,
            fontFamily: 'Inter',
            flex: 1,
        },
        eyeIcon: {
            position: 'absolute',
            right: 16,
        },
        createButton: {
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 16,
        },
        createButtonText: {
            color: '#000000',
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
            backgroundColor: '#333333',
        },
        dividerText: {
            color: '#666666',
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
    });
