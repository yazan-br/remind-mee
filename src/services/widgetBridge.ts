import { NativeModules, Platform } from "react-native";
import NextWidget from "../widgets/NextWidget";

const { WidgetBridge } = NativeModules;

export function updateWidget(
  task: string | null,
  taskId: string | null,
  isUrgent: boolean,
  emoji: string,
  tasksJson: string,
  createdAt: number | null,
  phrase: string | null = null,
): void {
  try {
    if (Platform.OS === "android" && WidgetBridge) {
      WidgetBridge.setTasks(tasksJson);
      WidgetBridge.updateWidget(
        task,
        taskId ?? "",
        isUrgent,
        emoji,
        createdAt ? createdAt : 0,
        phrase ?? "",
      );
    }
    if (Platform.OS === "ios") {
      NextWidget.updateSnapshot({
        task,
        taskId,
        isUrgent,
        emoji,
        tasksJson,
        createdAt,
        phrase,
      });
      NextWidget.reload();
    }
  } catch (_) {}
}
