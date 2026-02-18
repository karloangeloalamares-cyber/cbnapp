import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';

export const StatsScreen = () => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.content}>
                <Text style={styles.title}>Admin Stats</Text>
                <Text style={styles.subtitle}>Coming Soon</Text>
                <Text style={styles.description}>
                    This dashboard will display engagement metrics for your posts and announcements.
                </Text>
            </View>
        </View>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
        fontFamily: 'Inter',
    },
    subtitle: {
        fontSize: 18,
        color: theme.colors.primary,
        marginBottom: 16,
        fontWeight: '600',
        fontFamily: 'Inter',
    },
    description: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        fontFamily: 'Inter',
    },
});
