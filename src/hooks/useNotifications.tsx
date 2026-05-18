import { useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { updatePushToken } from '@/services';
import { useAuth } from '@/hooks/useAuth';

type NotificationsModule = typeof import('expo-notifications');
type Subscription = { remove(): void };

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'InstaJobs',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F97316',
    });
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return token.data;
  } catch {
    return null;
  }
}

export function useNotifications(navigation: any) {
  const { user } = useAuth();
  const responseListener = useRef<Subscription | null>(null);

  useEffect(() => {
    getNotificationsModule().then(Notifications => {
      if (!Notifications) return;
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    registerForPushNotificationsAsync().then(token => {
      if (token) updatePushToken(user.id, token);
    });

    let cancelled = false;
    getNotificationsModule().then(Notifications => {
      if (!Notifications || cancelled) return;
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data as any;
        if (!data?.screen) return;
        if (data.screen === 'JobApplications' && data.jobId) {
          navigation.navigate('JobApplications', {
            jobId: data.jobId,
            jobTitle: data.jobTitle ?? '',
          });
        } else if (data.screen === 'MyApplications') {
          navigation.navigate('MyApplications');
        }
      });
    });

    return () => {
      cancelled = true;
      responseListener.current?.remove();
      responseListener.current = null;
    };
  }, [user?.id]);
}
