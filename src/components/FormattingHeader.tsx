import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface FormattingHeaderProps {
    onFormat: (type: string) => void;
    onClear: () => void;
}

export const FormattingHeader = ({ onFormat, onClear }: FormattingHeaderProps) => {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: theme.colors.primary,
                paddingTop: insets.top
            }
        ]}>
            <View style={styles.content}>
                <View style={styles.leftSection}>
                    <Pressable
                        onPress={onClear}
                        style={({ pressed }) => [
                            styles.iconButton,
                            pressed && styles.iconButtonPressed
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Close formatting"
                    >
                        <Text style={styles.backIcon}>&lt;</Text>
                    </Pressable>
                    <Text style={styles.title}>Format</Text>
                </View>

                <View style={styles.rightSection}>
                    <Pressable onPress={() => onFormat('*')} style={styles.formatButton} accessibilityRole="button" accessibilityLabel="Bold">
                        <Text style={[styles.formatText, { fontWeight: 'bold' }]}>B</Text>
                    </Pressable>
                    <Pressable onPress={() => onFormat('_')} style={styles.formatButton} accessibilityRole="button" accessibilityLabel="Italic">
                        <Text style={[styles.formatText, { fontStyle: 'italic', fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif' }]}>I</Text>
                    </Pressable>
                    <Pressable onPress={() => onFormat('~')} style={styles.formatButton} accessibilityRole="button" accessibilityLabel="Strikethrough">
                        <Text style={[styles.formatText, { textDecorationLine: 'line-through' }]}>S</Text>
                    </Pressable>
                    <Pressable onPress={() => onFormat('```')} style={styles.formatButton} accessibilityRole="button" accessibilityLabel="Monospace">
                        <Text style={[styles.formatText, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>M</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        zIndex: 1000,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56, // Standard Android Header Height
        paddingHorizontal: 12,
        paddingBottom: 4,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        padding: 8,
        borderRadius: 20,
        marginRight: 12,
    },
    iconButtonPressed: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    backIcon: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
    },
    title: {
        fontSize: 20, // WhatsApp standard title size
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    formatButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
    },
    formatText: {
        fontSize: 18,
        color: '#FFFFFF',
    },
});
