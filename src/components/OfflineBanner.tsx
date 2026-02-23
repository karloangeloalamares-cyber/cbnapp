import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export const OfflineBanner = () => {
    const [isOffline, setIsOffline] = useState(false);
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const [animation] = useState(new Animated.Value(0));

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const offline = state.isConnected === false;
            if (offline !== isOffline) {
                setIsOffline(offline);
                Animated.timing(animation, {
                    toValue: offline ? 1 : 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            }
        });
        return unsubscribe;
    }, [isOffline, animation]);

    if (!isOffline && animation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) as any === 0) {
        return null; // hide completely when online and animation is complete
    }

    return (
        <Animated.View style={[
            styles.container,
            {
                paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 8,
                backgroundColor: theme.colors.danger || '#FF3B30',
                transform: [
                    {
                        translateY: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-100, 0],
                        })
                    }
                ]
            }
        ]}>
            <Text style={styles.text}>You're offline — showing cached data</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingBottom: 8,
        paddingHorizontal: 16,
        zIndex: 9999,
        elevation: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter',
        textAlign: 'center',
    },
});
