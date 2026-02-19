import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';

// Screens
import { NewsScreen } from '../screens/NewsScreen';
import { MessageBoardScreen } from '../screens/MessageBoardScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SavedScreen } from '../screens/SavedScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { Header } from '../components/Header';
import { NavigationBar } from '../components/NavigationBar';

const Tab = createBottomTabNavigator();

const fallbackAvatar = (name?: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=0D8ABC&color=fff`;

const HomeTab = ({ navigation }: any) => {
    const { user } = useAuth();
    return (
        <View style={{ flex: 1 }}>
            <Header
                title="CBN Unfiltered"
                avatar={user?.avatar_url || fallbackAvatar(user?.display_name)}
                onAvatarPress={() => navigation.navigate('Profile')}
            />
            <NewsScreen />
        </View>
    );
};

const AnnouncementsTab = ({ navigation }: any) => {
    const { user } = useAuth();
    return (
        <View style={{ flex: 1 }}>
            <Header
                title="Announcements"
                avatar={user?.avatar_url || fallbackAvatar(user?.display_name)}
                onAvatarPress={() => navigation.navigate('Profile')}
            />
            <MessageBoardScreen embedded />
        </View>
    );
};

const NotificationsTab = ({ navigation }: any) => {
    const { user } = useAuth();
    return (
        <View style={{ flex: 1 }}>
            <Header
                title="Notifications"
                avatar={user?.avatar_url || fallbackAvatar(user?.display_name)}
                onAvatarPress={() => navigation.navigate('Profile')}
            />
            <NotificationsScreen />
        </View>
    );
};

const SavedTab = ({ navigation }: any) => {
    const { user } = useAuth();
    return (
        <View style={{ flex: 1 }}>
            <Header
                title="Saved"
                avatar={user?.avatar_url || fallbackAvatar(user?.display_name)}
                onAvatarPress={() => navigation.navigate('Profile')}
            />
            <SavedScreen />
        </View>
    );
};

const SettingsTab = ({ navigation }: any) => {
    const { user } = useAuth();
    return (
        <View style={{ flex: 1 }}>
            <Header
                title="Settings"
                avatar={user?.avatar_url || fallbackAvatar(user?.display_name)}
                onAvatarPress={() => navigation.navigate('Profile')}
            />
            <SettingsScreen />
        </View>
    );
};

const StatsTab = ({ navigation }: any) => {
    const { user } = useAuth();
    return (
        <View style={{ flex: 1 }}>
            <Header
                title="Stats"
                avatar={user?.avatar_url || fallbackAvatar(user?.display_name)}
                onAvatarPress={() => navigation.navigate('Profile')}
            />
            <StatsScreen />
        </View>
    );
};

import { useNotifications } from '../context/NotificationContext';

export const MainNavigator = () => {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { user } = useAuth();
    const isAdmin = authService.isAdmin(user);
    const { unreadCount } = useNotifications(); // Use global state
    // const canNotify = !!user && !isAdmin; // Logic moved to context

    // Removed local loadUnreadCount and subscription effects as they handled in context

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Tab.Navigator
                tabBar={(props) => {
                    // Hide navbar for admin users? NO, we want it now.
                    // if (isAdmin) return null;

                    // Map route names to keys
                    const routeName = props.state.routes[props.state.index].name;
                    let activeKey: any = 'home';
                    if (routeName === 'Home') activeKey = 'home';
                    if (routeName === 'Announcements') activeKey = 'announcements';
                    if (routeName === 'Notifications') activeKey = 'notifications';
                    if (routeName === 'Saved') activeKey = 'saved';
                    if (routeName === 'Settings') activeKey = 'settings';
                    if (routeName === 'Stats') activeKey = 'stats';

                    return (
                        <View style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            paddingBottom: Math.max(insets.bottom, 8),
                            backgroundColor: 'transparent',
                        }}>
                            <NavigationBar
                                activeItem={activeKey}
                                onItemPress={(key) => {
                                    if (key === 'home') props.navigation.navigate('Home');
                                    if (key === 'announcements') props.navigation.navigate('Announcements');
                                    if (key === 'notifications') props.navigation.navigate('Notifications');
                                    if (key === 'saved') props.navigation.navigate('Saved');
                                    if (key === 'settings') props.navigation.navigate('Settings');
                                    if (key === 'stats') props.navigation.navigate('Stats');
                                }}
                                unreadCount={unreadCount}
                                isAdmin={isAdmin}
                                onFabPress={() => props.navigation.navigate('AdminPost')}
                            />
                        </View>
                    );
                }}
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        position: 'absolute',
                        backgroundColor: 'transparent',
                        borderTopWidth: 0,
                        elevation: 0,
                    },
                    // We need to ensure content has padding bottom to not be hidden by tab bar
                    // The custom tab bar is absolute positioned.
                    // We can use safe area insets in screens or content container styles.
                }}
            >
                <Tab.Screen name="Home" component={HomeTab} />
                <Tab.Screen name="Announcements" component={AnnouncementsTab} />
                <Tab.Screen name="Notifications" component={NotificationsTab} />
                <Tab.Screen name="Saved" component={SavedTab} />
                <Tab.Screen name="Stats" component={StatsTab} />
                <Tab.Screen name="Settings" component={SettingsTab} />
            </Tab.Navigator>
        </View>
    );
};
