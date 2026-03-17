import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { log } from "./logger";

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
  if (Platform.OS !== "android") return;
  log('Creating notification channel "reminders"');
  await Notifications.setNotificationChannelAsync("reminders", {
    name: "Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    enableVibrate: true,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function requestAllPermissions(): Promise<{
  notifications: boolean;
}> {
  const notifications = await requestNotificationPermission();
  return { notifications };
}
