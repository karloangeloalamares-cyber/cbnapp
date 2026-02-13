import React from 'react';
import { Text, Linking, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface LinkPreviewProps {
    url: string;
}

export const LinkPreview = ({ url }: LinkPreviewProps) => {
    const { theme } = useTheme();

    const handlePress = async () => {
        try {
            await Linking.openURL(url);
        } catch (error) {
            console.warn('Unable to open URL', error);
        }
    };

    return (
        <Pressable onPress={handlePress}>
            <Text
                style={{
                    color: '#20B65E',
                    textDecorationLine: 'underline',
                    fontSize: 14,
                    fontFamily: 'Inter',
                }}
                numberOfLines={2}
                ellipsizeMode="tail"
            >
                {url}
            </Text>
        </Pressable>
    );
};
