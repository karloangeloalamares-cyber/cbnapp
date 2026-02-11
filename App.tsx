import React, { useEffect } from 'react';
import { Alert, StatusBar, View, ActivityIndicator } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { AdminPostScreen } from './src/screens/AdminPostScreen';
import { NewsDetailScreen } from './src/screens/NewsDetailScreen';
import { AnnouncementDetailScreen } from './src/screens/AnnouncementDetailScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { pushNotificationService } from './src/services/pushNotificationService';
import { newsService } from './src/services/newsService';
import { announcementService } from './src/services/announcementService';
import { postViewsService } from './src/services/postViewsService';
import { authService } from './src/services/authService';
import { theme } from './src/theme';

const Stack = createStackNavigator();
const navigationRef = createNavigationContainerRef<any>();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen
            name="AdminPost"
            component={AdminPostScreen}
            options={{
              presentation: 'modal',
              headerShown: false
            }}
          />
          <Stack.Screen
            name="NewsDetail"
            component={NewsDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AnnouncementDetail"
            component={AnnouncementDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const AppWithNotifications = () => {
  const { user } = useAuth();
  const isAdmin = authService.isAdmin(user);

  useEffect(() => {
    if (!user || isAdmin) return;
    let active = true;

    (async () => {
      const result = await pushNotificationService.registerForPushNotifications(user.id);
      if (!active) return;

      if (result.error) {
        console.warn('Push registration failed', result.error);
        Alert.alert('Push Setup Error', result.error);
        return;
      }

      console.log('Push token registered successfully');
    })().catch((error) => {
      console.warn('Push registration failed', error);
      Alert.alert('Push Setup Error', String(error));
    });

    return () => {
      active = false;
    };
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user) return;

    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      if (!navigationRef.isReady()) return;
      const data = response.notification.request.content.data as {
        target_type?: 'news' | 'announcement';
        target_id?: string;
      };

      if (!data?.target_type || !data?.target_id) return;

      try {
        if (data.target_type === 'news') {
          const article = await newsService.getById(data.target_id);
          if (!article) return;
          if (!isAdmin) {
            try {
              await postViewsService.add('news', article.id, user.id);
            } catch (error: any) {
              if (error?.code !== '23505') {
                console.warn('Failed to add view', error);
              }
            }
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
            } catch (error: any) {
              if (error?.code !== '23505') {
                console.warn('Failed to add view', error);
              }
            }
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

  return <AppNavigator />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.header} />
      <AuthProvider>
        <NavigationContainer
          ref={navigationRef}
          theme={{
            dark: false,
            colors: {
              primary: theme.colors.primary,
              background: theme.colors.background,
              card: theme.colors.surface,
              text: theme.colors.text,
              border: theme.colors.border,
              notification: theme.colors.primary,
            },
            fonts: {
              regular: { fontFamily: 'System', fontWeight: '400' as const },
              medium: { fontFamily: 'System', fontWeight: '500' as const },
              bold: { fontFamily: 'System', fontWeight: '700' as const },
              heavy: { fontFamily: 'System', fontWeight: '900' as const },
            },
          }}
        >
          <AppWithNotifications />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
