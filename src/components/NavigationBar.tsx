import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  NewsIcon,
  AnnouncementIcon,
  NotificationIcon,
  SavedIcon,
  SettingsIcon,
  StatsIcon,
  PlusIcon,
} from './Icons';

type NavigationBarItem = 'home' | 'announcements' | 'notifications' | 'saved' | 'settings' | 'stats';

interface NavigationBarProps {
  activeItem?: NavigationBarItem;
  onItemPress?: (item: NavigationBarItem) => void;
  unreadCount?: number;
  isAdmin?: boolean;
  onFabPress?: () => void;
}

interface NavItem {
  key: NavigationBarItem;
  name: 'Home' | 'Announcements' | 'Notifications' | 'Saved' | 'Settings' | 'Stats';
  route?: string;
  icon: (color: string) => React.ReactNode;
}

export const NavigationBar = ({
  activeItem,
  onItemPress,
  unreadCount = 0,
  isAdmin = false,
  onFabPress
}: NavigationBarProps) => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();

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

  const navItems: NavItem[] = isAdmin ? [
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
        <AnnouncementIcon size={28} color={color} strokeWidth={1.5} />
      ),
    },
    {
      key: 'stats',
      name: 'Stats', // Placeholder name if you want
      route: 'Stats',
      icon: (color: string) => <StatsIcon size={22} color={color} strokeWidth={1.5} />,
    },
    {
      key: 'settings',
      name: 'Settings',
      route: 'Settings',
      icon: (color: string) => <SettingsIcon size={22} color={color} strokeWidth={1.5} />,
    },
  ] : [
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
        <AnnouncementIcon size={28} color={color} strokeWidth={1.5} />
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
      paddingVertical: 17,
      borderRadius: 100,
      backgroundColor: isAdmin ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.2)', // Both seem to use 20% black based on recent feedback/SVG, but user specifically sent black 0.2 for Admin.
      // Actually standard design might be different. Let's explicitly check isAdmin for the style.
      overflow: 'hidden', // Required for BlurView radius
      width: '100%',
    },
    navItem: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activeItem: {
      backgroundColor: '#ED1D26', // Red active circle (from Figma)
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
    // Admin Specific Styles
    adminWrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: insets.bottom + 20, // Dynamic safe area (Edge-to-Edge) + padding
      zIndex: 1000,
    },
    adminNavPill: {
      width: 250,
      height: 84,
      borderRadius: 42,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 25,
      marginRight: 10, // Gap between pill and FAB
    },
    adminFabPill: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fabButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#ED1D26',
      justifyContent: 'center',
      alignItems: 'center',
      // Shadow typically on the red button
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  });

  if (isAdmin) {
    const tint = theme.dark ? 'dark' : 'light';
    const intensity = Platform.OS === 'android' ? 20 : 50;
    const pillBg = theme.dark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)';

    return (
      <View style={styles.adminWrapper}>
        {/* Navigation Pill (250x84) */}
        <View style={[styles.shadowContainer, { marginHorizontal: 0, marginRight: 10 }]}>
          <BlurView
            intensity={intensity}
            tint={tint}
            style={[styles.adminNavPill, { backgroundColor: pillBg }]}
          >
            {navItems.map((item) => {
              const active = isActive(item);
              const iconColor = '#FFFFFF';

              return (
                <Pressable
                  key={item.key}
                  style={[styles.navItem, active && styles.activeItem]}
                  onPress={() => {
                    if (onItemPress) { onItemPress(item.key); return; }
                    if (item.route && canNavigateTo(item.route)) navigation.navigate(item.route);
                  }}
                >
                  {item.icon(iconColor)}
                </Pressable>
              );
            })}
          </BlurView>
        </View>

        {/* FAB Pill (84x84) */}
        <View style={[styles.shadowContainer, { marginHorizontal: 0 }]}>
          <BlurView
            intensity={intensity}
            tint={tint}
            style={[styles.adminFabPill, { backgroundColor: pillBg }]}
          >
            <Pressable
              style={styles.fabButton}
              onPress={onFabPress}
            >
              <PlusIcon size={28} color="#FFFFFF" strokeWidth={1.5} />
            </Pressable>
          </BlurView>
        </View>
      </View>
    );
  }

  // Regular User View (Floating Pill)
  return (
    <View style={styles.shadowContainer}>
      <BlurView
        intensity={Platform.OS === 'android' ? 20 : 50}
        tint={theme.dark ? 'dark' : 'light'}
        style={styles.blurContainer}
      >
        {navItems.map((item) => {
          const active = isActive(item);
          const iconColor = '#FFFFFF'; // All icons white (from Figma)

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
