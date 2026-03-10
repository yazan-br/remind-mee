import * as BackgroundTask from 'expo-background-task';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { log } from './logger';
import { completeTask, getTasksWithLocation, getTasksWithLocationForBackground } from './tasks';

const NOTIFICATION_CHANNEL = 'reminders';
const TASK_NAME = 'location-reminder-check';
const RADIUS_METERS = 1200;
const START_HOUR = 6;
const END_HOUR = 22;

async function notifyForTask(task: { id: string; instruction: string }, fromBackground: boolean): Promise<void> {
  log('Sending notification for task: ' + task.instruction.slice(0, 30));
  const content = {
    title: 'Next',
    body: task.instruction,
    sound: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
    ...(Platform.OS === 'android' && { channelId: NOTIFICATION_CHANNEL }),
  };
  if (fromBackground && Platform.OS === 'android') {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { seconds: 2, channelId: NOTIFICATION_CHANNEL },
    });
  } else {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: null,
    });
  }
  await completeTask(task.id);
  log('Notification sent, task marked complete');
}

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
    const { status: notifStatus } = await Notifications.getPermissionsAsync();
    if (notifStatus !== 'granted') {
      return BackgroundTask.BackgroundTaskResult.Success;
    }
    const { status } = await Location.getBackgroundPermissionsAsync();
    if (status !== 'granted') {
      const { status: fg } = await Location.getForegroundPermissionsAsync();
      if (fg !== 'granted') return BackgroundTask.BackgroundTaskResult.Success;
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
        await notifyForTask(task, true);
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
    minimumInterval: 30,
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

export async function checkLocationAndNotifyImmediately(): Promise<void> {
  if (Platform.OS === 'web') return;
  log('Location check: fetching tasks with location');
  const tasks = await getTasksWithLocationForBackground();
  if (tasks.length === 0) {
    log('Location check: no tasks with location');
    return;
  }
  log('Location check: ' + tasks.length + ' task(s) to check');
  try {
    let { status: notifStatus } = await Notifications.getPermissionsAsync();
    if (notifStatus !== 'granted') {
      log('Location check: notification permission not granted, requesting');
      const { status: requested } = await Notifications.requestPermissionsAsync();
      notifStatus = requested;
    }
    if (notifStatus !== 'granted') {
      log('Location check: notification permission denied');
      return;
    }
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      log('Location check: location permission denied');
      return;
    }
    log('Location check: getting current position');
    let pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    if (!pos) {
      log('Location check: getCurrentPosition failed, trying lastKnown');
      pos = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
    }
    if (!pos) {
      log('Location check: no position available');
      return;
    }
    const { latitude, longitude } = pos.coords;
    log('Location check: at ' + latitude.toFixed(4) + ', ' + longitude.toFixed(4));
    for (const task of tasks) {
      const lr = task.locationReminder;
      if (!lr) continue;
      const radius = lr.radiusMeters ?? RADIUS_METERS;
      const dist = haversineDistance(latitude, longitude, lr.lat, lr.lng);
      log('Location check: task "' + task.instruction.slice(0, 20) + '..." dist=' + Math.round(dist) + 'm radius=' + radius + 'm');
      if (dist <= radius) {
        log('Location check: WITHIN RANGE - sending notification');
        await notifyForTask(task, false);
        break;
      }
    }
  } catch (e) {
    log('Location check ERROR: ' + String(e));
  }
}
