import React from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, TouchableOpacity, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon } from '../components/Icons';

export const WelcomeScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const { googleLogin } = useAuth();

    const styles = React.useMemo(() => createStyles(theme, insets), [theme, insets]);

    return (
        <ImageBackground
            source={require('../../assets/welcome-bg.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={styles.backgroundOverlay} />

            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/CBN_Logo-removebg-preview.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>CBN Unfiltered</Text>
                    <Text style={styles.tagline}>JEWISH NEWS YOU CAN TRUST</Text>
                    <Text style={styles.description}>
                        News, Community, Listings,{'\n'}Entertainment & More
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.signUpButton}
                        onPress={() => navigation.navigate('SignUp')}
                        accessibilityRole="button"
                        accessibilityLabel="Sign up for free"
                    >
                        <Text style={styles.signUpButtonText}>SIGN UP FOR FREE</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => navigation.navigate('Login')}
                        accessibilityRole="button"
                        accessibilityLabel="Log in"
                    >
                        <Text style={styles.loginButtonText}>LOG IN</Text>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={googleLogin}
                        accessibilityRole="button"
                        accessibilityLabel="Sign in with Google"
                    >
                        <GoogleIcon size={20} />
                        <Text style={styles.googleButtonText}>Sign in with Google</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ImageBackground>
    );
};

const createStyles = (theme: any, insets: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#161616',
            width: '100%',
            height: '100%',
        },
        backgroundOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(22, 22, 22, 0.95)',
        },
        content: {
            flex: 1,
            justifyContent: 'space-between',
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: 27,
        },
        logoContainer: {
            alignItems: 'center',
            marginTop: 20,
        },
        logo: {
            width: 62,
            height: 59,
            marginBottom: 20,
            tintColor: '#FF0000',
        },
        title: {
            fontSize: 28,
            fontWeight: '700',
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: 8,
            fontFamily: 'Inter',
        },
        tagline: {
            fontSize: 12,
            fontWeight: '600',
            color: '#BDBDBD',
            textAlign: 'center',
            letterSpacing: 2,
            marginBottom: 16,
            fontFamily: 'Inter',
            textTransform: 'uppercase',
        },
        description: {
            fontSize: 16,
            color: '#BDBDBD',
            textAlign: 'center',
            lineHeight: 24,
            fontFamily: 'Inter',
        },
        buttonContainer: {
            width: '100%',
            gap: 12,
        },
        signUpButton: {
            backgroundColor: '#FFFFFF',
            borderRadius: 6,
            height: 66,
            justifyContent: 'center',
            alignItems: 'center',
        },
        signUpButtonText: {
            color: '#000000',
            fontSize: 14,
            fontWeight: '600',
            fontFamily: 'Inter',
            letterSpacing: 1.5,
        },
        loginButton: {
            backgroundColor: 'transparent',
            borderRadius: 6,
            height: 66,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#FFFFFF',
        },
        loginButtonText: {
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '600',
            fontFamily: 'Inter',
            letterSpacing: 1.5,
        },
        dividerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 4,
        },
        dividerLine: {
            flex: 1,
            height: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.23)',
        },
        dividerText: {
            color: '#FFFFFF',
            paddingHorizontal: 16,
            fontSize: 14,
            fontFamily: 'Inter',
        },
        googleButton: {
            backgroundColor: '#EEEEEE',
            borderRadius: 6,
            height: 52,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
        },
        googleButtonText: {
            color: '#1F1F1F',
            fontSize: 16,
            fontWeight: '600',
            fontFamily: 'Roboto',
            marginLeft: 12,
        },
    });
