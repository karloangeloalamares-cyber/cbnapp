import React, { useEffect } from 'react';
import { Alert, StatusBar, View, ActivityIndicator } from 'react-native';
import {
  NavigationContainer,
  createNavigationContainerRef,
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext'; // Ensure this is imported
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { MainNavigator } from './src/navigation/MainNavigator';
import { AdminPostScreen } from './src/screens/AdminPostScreen';
import { NewsDetailScreen } from './src/screens/NewsDetailScreen';
import { AnnouncementDetailScreen } from './src/screens/AnnouncementDetailScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { pushNotificationService } from './src/services/pushNotificationService';
import { newsService } from './src/services/newsService';
import { announcementService } from './src/services/announcementService';
import { postViewsService } from './src/services/postViewsService';
import { authService } from './src/services/authService';
// Removed theme import as we useTheme content now, but keeping for reference if needed elsewhere

const Stack = createStackNavigator();
const navigationRef = createNavigationContainerRef<any>();

const AppWithNotifications = () => {
  const { user, loading } = useAuth();
  const isAdmin = authService.isAdmin(user);
  const { theme } = useTheme();
  const navigationTheme = theme.dark ? NavigationDarkTheme : NavigationDefaultTheme;

  // Push Notification Registration
  useEffect(() => {
    if (!user || isAdmin) return;
    let active = true;

    (async () => {
      const result = await pushNotificationService.registerForPushNotifications(user.id);
      if (!active) return;
      if (result.error) {
        console.warn('Push registration failed', result.error);
        // Alert.alert('Push Setup Error', result.error); // Optional: silent fail in prod
        return;
      }
      console.log('Push token registered successfully');
    })().catch((error) => {
      console.warn('Push registration failed', error);
    });

    return () => {
      active = false;
    };
  }, [user, isAdmin]);

  // Notification Handling
  useEffect(() => {
    if (!user) return;
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      try {
        if (!navigationRef.isReady()) return;

        const data = response.notification.request.content.data as {
          target_type?: 'news' | 'announcement';
          target_id?: string;
        };

        if (!data?.target_type || !data?.target_id) return;

        if (data.target_type === 'news') {
          const article = await newsService.getById(data.target_id);
          if (!article) return;

          if (!isAdmin) {
            try {
              await postViewsService.add('news', article.id, user.id);
            } catch (ignore) { }
          }
          const views = await postViewsService.getForTargets('news', [article.id]);
          navigationRef.navigate('NewsDetail', { article, viewCount: views.length });
        }

        if (data.target_type === 'announcement') {
          const announcement = await announcementService.getById(data.target_id);
          if (!announcement) return;

          if (!isAdmin) {
            try {
              await postViewsService.add('announcement', announcement.id, user.id);
            } catch (ignore) { }
          }
          const views = await postViewsService.getForTargets('announcement', [announcement.id]);
          navigationRef.navigate('AnnouncementDetail', { announcement, viewCount: views.length });
        }
      } catch (error) {
        console.warn('Failed to handle notification', error);
      }
    });

    return () => subscription.remove();
  }, [user, isAdmin]);

  // Loading State - Rendered after hooks
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        ...navigationTheme,
        dark: theme.dark,
        colors: {
          ...navigationTheme.colors,
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.primary,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen
              name="AdminPost"
              component={AdminPostScreen}
              options={{
                presentation: 'modal',
                headerShown: false
              }}
            />
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
            <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const AppContent = () => {
  const { theme } = useTheme();
  return (
    <>
      <StatusBar
        barStyle={theme.dark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.header}
      />
      <AppWithNotifications />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
