import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';


interface HeaderProps {
  title?: string;
  avatar?: string;
  onAvatarPress?: () => void;
}

export const Header = ({
  title = 'CBN Unfiltered',
  avatar,
  onAvatarPress,
}: HeaderProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const bgColor = theme.colors.header;
  const textColor = theme.colors.text;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: bgColor,
      paddingTop: insets.top + 8,
      paddingBottom: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    logo: {
      width: 31,
      height: 29,
      borderRadius: 6,
      marginRight: 8,
    },
    titleText: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      fontFamily: 'Inter',
    },
    profileAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Image
          source={require('../../assets/CBN_Logo-removebg-preview.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.titleText}>{title}</Text>
      </View>
      <View style={styles.rightSection}>

        {avatar && (
          <Pressable onPress={onAvatarPress} accessibilityRole="button" accessibilityLabel="Open profile">
            <Image source={{ uri: avatar }} style={styles.profileAvatar} />
          </Pressable>
        )}
      </View>
    </View>
  );
};
