import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../context/ThemeContext';

interface AvatarProps {
    url?: string | null;
    name?: string;
    size?: number;
}

export const Avatar = ({ url, name, size = 40 }: AvatarProps) => {
    const { theme } = useTheme();

    const getInitials = (name?: string) => {
        if (!name) return '?';
        return name
            .split(' ')
            .filter(part => part.length > 0)
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Generate a consistent color based on the name
    const getBackgroundColor = (name?: string) => {
        if (!name) return theme.colors.border;
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = [
            '#FF6060', '#50D0C0', '#40B0E0', '#90D0B0',
            '#FFD070', '#E0A0A0', '#A060C0', '#40A0E0'
        ];
        return colors[Math.abs(hash) % colors.length];
    };

    const bgColor = getBackgroundColor(name);

    const [imgError, setImgError] = React.useState(false);

    // Reset error state if url changes
    React.useEffect(() => {
        setImgError(false);
    }, [url]);

    return (
        <View style={[
            styles.container,
            {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: bgColor
            }
        ]}>
            {url && !imgError ? (
                <Image
                    source={{ uri: url }}
                    style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                    onError={() => setImgError(true)}
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
        overflow: 'hidden',
    },
    image: {
        // Dimensions handled via inline styles for dynamic sizing
    },
    initials: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontFamily: 'Inter',
    },
});
