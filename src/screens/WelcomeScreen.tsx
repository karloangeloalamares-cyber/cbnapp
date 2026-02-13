import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable, Platform } from 'react-native';
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
        <View style={styles.container}>
            {/* Background Image Placeholder - using a dark gradient-like view for now */}
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
                    >
                        <Text style={styles.signUpButtonText}>SIGN UP FOR FREE</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => navigation.navigate('Login')}
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
                    >
                        <GoogleIcon size={20} />
                        <Text style={styles.googleButtonText}>Sign in with Google</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const createStyles = (theme: any, insets: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#000000', // Deep black background
        },
        backgroundOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.6)', // Darken background image if we had one
        },
        content: {
            flex: 1,
            justifyContent: 'space-between',
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 100,
            paddingHorizontal: 24,
        },
        logoContainer: {
            alignItems: 'center',
            marginTop: 40,
        },
        logo: {
            width: 80,
            height: 80,
            marginBottom: 20,
            tintColor: '#FF0000', // Red logo as per mockup? Or keep original. Mockup showed red.
        },
        title: {
            fontSize: 32,
            fontWeight: '700',
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: 8,
            fontFamily: 'Inter',
        },
        tagline: {
            fontSize: 12,
            fontWeight: '600',
            color: '#888888',
            textAlign: 'center',
            letterSpacing: 2,
            marginBottom: 16,
            fontFamily: 'Inter',
            textTransform: 'uppercase',
        },
        description: {
            fontSize: 16,
            color: '#CCCCCC',
            textAlign: 'center',
            lineHeight: 24,
            fontFamily: 'Inter',
        },
        buttonContainer: {
            width: '100%',
            gap: 16,
        },
        signUpButton: {
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
        },
        signUpButtonText: {
            color: '#000000',
            fontSize: 16,
            fontWeight: '700',
            fontFamily: 'Inter',
            letterSpacing: 0.5,
        },
        loginButton: {
            backgroundColor: 'transparent',
            borderRadius: 12,
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#333333',
        },
        loginButtonText: {
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '600',
            fontFamily: 'Inter',
            letterSpacing: 0.5,
        },
        dividerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 8,
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
            borderRadius: 4, // More standardized google button radius often squarish, but 20 is pill. 4-8 is card. Let's try 8 or keep 12 to match theme if consistent. Screenshot looked almost sharp. I will use 8.
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            marginTop: 8,
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
            color: 'rgba(0, 0, 0, 0.54)', // Official Google text color often used
            fontSize: 16,
            fontWeight: '600',
            fontFamily: 'Roboto', // If available, fallback to system.
            marginLeft: 12, // Gap between icon and text
        },
    });
