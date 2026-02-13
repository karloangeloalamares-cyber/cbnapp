import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  NewsIcon,
  AnnouncementIcon,
  NotificationIcon,
  SavedIcon,
  SettingsIcon,
} from './Icons';

type NavigationBarItem = 'home' | 'announcements' | 'notifications' | 'saved' | 'settings';

interface NavigationBarProps {
  activeItem?: NavigationBarItem;
  onItemPress?: (item: NavigationBarItem) => void;
  unreadCount?: number; // Added unreadCount prop
}

interface NavItem {
  key: NavigationBarItem;
  name: 'Home' | 'Announcements' | 'Notifications' | 'Saved' | 'Settings';
  route?: string;
  icon: (color: string) => React.ReactNode;
}

export const NavigationBar = ({ activeItem, onItemPress, unreadCount = 0 }: NavigationBarProps) => { // Added unreadCount with default value
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();

  const canNavigateTo = (routeName: string) => {
    const availableRoutes = navigation.getState?.()?.routeNames ?? [];
    return availableRoutes.includes(routeName);
  };

  const isActive = (item: NavItem) => {
    if (activeItem) {
      return item.key === activeItem;
    }
    return item.route ? route.name === item.route : false;
  };

  const navItems: NavItem[] = [
    {
      key: 'home',
      name: 'Home',
      route: 'Home',
      icon: (color: string) => <NewsIcon size={22} color={color} strokeWidth={1.5} />,
    },
    {
      key: 'announcements',
      name: 'Announcements',
      route: 'Announcements',
      icon: (color: string) => (
        <AnnouncementIcon size={22} color={color} strokeWidth={1.5} />
      ),
    },
    {
      key: 'notifications',
      name: 'Notifications',
      route: 'Notifications',
      icon: (color: string) => (
        <NotificationIcon size={22} color={color} strokeWidth={1.5} />
      ),
    },
    {
      key: 'saved',
      name: 'Saved',
      route: 'Saved',
      icon: (color: string) => <SavedIcon size={22} color={color} strokeWidth={1.5} />,
    },
    {
      key: 'settings',
      name: 'Settings',
      route: 'Settings',
      icon: (color: string) => <SettingsIcon size={22} color={color} strokeWidth={1.5} />,
    },
  ];

  // Figma Design: Light grey pill, dark icons (even in dark mode)
  const bgColor = '#E5E7EB'; // Light grey
  const itemBgColor = 'transparent';
  const inactiveColor = '#4B5563'; // Dark grey
  const activeColor = '#000000'; // Black

  const styles = StyleSheet.create({
    container: {
      position: 'absolute', // Ensure it sits on top
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      marginBottom: 0, // Reset margin since we handle positioning
      zIndex: 1000,
    },
    shadowContainer: {
      flexDirection: 'row',
      borderRadius: 100,
      marginHorizontal: 30,
      marginBottom: Platform.OS === 'android' ? 10 : 0, // Slight lift for android
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2, // Increased shadow for better contrast with glass
      shadowRadius: 10,
      elevation: 5,
      backgroundColor: 'transparent', // Important for shadow to show but not block blur? Actually bg needed for shadow usually.
      // For glassmorphism, we usually need a container for shadow and one for blur/overflow
    },
    blurContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 100,
      backgroundColor: theme.dark
        ? 'rgba(28, 28, 30, 0.5)' // Dark mode: Semi-transparent dark
        : 'rgba(229, 231, 235, 0.5)', // Light mode: Semi-transparent light
      overflow: 'hidden', // Required for BlurView radius
      width: '100%',
    },
    navItem: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activeItem: {
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', // Subtle highlight
    },
    badge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: '#EF4444',
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 2,
      borderWidth: 1.5,
      borderColor: 'transparent', // Transparent border for badge
    },
    badgeText: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: '700',
      fontFamily: 'Inter',
    },
  });

  return (
    <View style={styles.shadowContainer}>
      <BlurView
        intensity={Platform.OS === 'android' ? 20 : 50} // Android blur is expensive
        tint={theme.dark ? 'dark' : 'light'}
        style={styles.blurContainer}
      >
        {navItems.map((item) => {
          const active = isActive(item);
          const iconColor = active ? theme.colors.primary : (theme.dark ? '#8696A0' : '#4B5563');

          return (
            <Pressable
              key={item.key}
              style={[styles.navItem, active && styles.activeItem]}
              onPress={() => {
                if (onItemPress) {
                  onItemPress(item.key);
                  return;
                }

                if (item.route && canNavigateTo(item.route)) {
                  navigation.navigate(item.route);
                }
              }}
            >
              {item.icon(iconColor)}
              {item.key === 'notifications' && unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
};
