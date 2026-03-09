import * as BackgroundTask from 'expo-background-task';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { getTasksWithLocation, getTasksWithLocationForBackground } from './tasks';

const NOTIFICATION_CHANNEL = 'reminders';
const TASK_NAME = 'location-reminder-check';
const RADIUS_METERS = 150;
const START_HOUR = 6;
const END_HOUR = 22;

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isWithinActiveHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= START_HOUR && hour < END_HOUR;
}

TaskManager.defineTask(TASK_NAME, async () => {
  if (!isWithinActiveHours()) {
    return BackgroundTask.BackgroundTaskResult.Success;
  }
  const locationTasks = await getTasksWithLocationForBackground();
  if (locationTasks.length === 0) {
    return BackgroundTask.BackgroundTaskResult.Success;
  }
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      return BackgroundTask.BackgroundTaskResult.Success;
    }
    let pos = await Location.getLastKnownPositionAsync({
      maxAge: 60 * 60 * 1000,
    });
    if (!pos) {
      pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    }
    if (!pos) return BackgroundTask.BackgroundTaskResult.Success;
    const { latitude, longitude } = pos.coords;
    for (const task of locationTasks) {
      const lr = task.locationReminder;
      if (!lr) continue;
      const radius = lr.radiusMeters ?? RADIUS_METERS;
      const dist = haversineDistance(latitude, longitude, lr.lat, lr.lng);
      if (dist <= radius) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Next',
            body: task.instruction,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL } : null,
        });
      }
    }
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
  return BackgroundTask.BackgroundTaskResult.Success;
});

export async function registerLocationReminderTask(): Promise<void> {
  if (Platform.OS === 'web') return;
  await BackgroundTask.registerTaskAsync(TASK_NAME, {
    minimumInterval: 45,
  });
}

export async function unregisterLocationReminderTask(): Promise<void> {
  if (Platform.OS === 'web') return;
  await BackgroundTask.unregisterTaskAsync(TASK_NAME);
}

export async function updateLocationTaskRegistration(): Promise<void> {
  const tasks = await getTasksWithLocation();
  if (tasks.length > 0) {
    await registerLocationReminderTask();
  } else {
    await unregisterLocationReminderTask();
  }
}
