import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface SelectionHeaderProps {
    selectedCount: number;
    onClearSelection: () => void;
    onDelete?: () => void;
    onReply?: () => void;
    onForward?: () => void;
    onCopy?: () => void;
    onStar?: () => void;
}

export const SelectionHeader = ({
    selectedCount,
    onClearSelection,
    onDelete,
    onReply,
    onForward,
    onCopy,
    onStar,
}: SelectionHeaderProps) => {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();

    const handleAction = (actionName: string, action?: () => void) => {
        if (action) {
            action();
        } else {
            Alert.alert('Coming Soon', `${actionName} is not yet implemented.`);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.primary }]}>
            <View style={styles.content}>
                <View style={styles.leftSection}>
                    <Pressable onPress={onClearSelection} style={styles.iconButton}>
                        <Text style={styles.icon}>←</Text>
                    </Pressable>
                    <Text style={styles.countText}>{selectedCount}</Text>
                </View>

                <View style={styles.rightSection}>
                    <Pressable onPress={() => handleAction('Forward', onForward)} style={styles.iconButton}>
                        <Text style={styles.icon}>↪️</Text>
                    </Pressable>
                    <Pressable onPress={() => handleAction('Star', onStar)} style={styles.iconButton}>
                        <Text style={styles.icon}>⭐</Text>
                    </Pressable>
                    <Pressable onPress={() => handleAction('Delete', onDelete)} style={styles.iconButton}>
                        <Text style={styles.icon}>🗑️</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#20B65E', // Overridden dynamically with theme.colors.primary
        width: '100%',
        position: 'absolute',
        top: 0,
        zIndex: 1000,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44, // Reduced to minimum touch value
        paddingHorizontal: 8,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: 4, // More compact
        marginHorizontal: 2,
    },
    icon: {
        fontSize: 20,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    countText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginLeft: 10,
    },
});
