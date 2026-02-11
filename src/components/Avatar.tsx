import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface AvatarProps {
    url?: string | null;
    name?: string;
    size?: number;
}

export const Avatar = ({ url, name, size = 40 }: AvatarProps) => {
    const getInitials = (name?: string) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Generate a consistent color based on the name
    const getBackgroundColor = (name?: string) => {
        if (!name) return '#ccc';
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
            '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
        ];
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: url ? 'transparent' : getBackgroundColor(name) }]}>
            {url ? (
                <Image
                    source={{ uri: url }}
                    style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
                    resizeMode="cover"
                />
            ) : (
                <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
                    {getInitials(name)}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    image: {
        // Dimensions handled via inline styles for dynamic sizing
    },
    initials: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});
