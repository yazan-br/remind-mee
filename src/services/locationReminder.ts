import * as BackgroundTask from "expo-background-task";
import { Platform } from "react-native";

const TASK_NAME = "location-reminder-check";

export async function unregisterLocationReminderTask(): Promise<void> {
  if (Platform.OS === "web") return;
  await BackgroundTask.unregisterTaskAsync(TASK_NAME);
}
