import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { log } from './logger';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotifications(): Promise<void> {
  if (Platform.OS !== 'android') return;
  log('Creating notification channel "reminders"');
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    enableVibrate: true,
  });
}

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return false;
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === 'granted';
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function requestAllPermissions(): Promise<{
  location: boolean;
  notifications: boolean;
}> {
  const [location, notifications] = await Promise.all([
    requestLocationPermission(),
    requestNotificationPermission(),
  ]);
  return { location, notifications };
}
