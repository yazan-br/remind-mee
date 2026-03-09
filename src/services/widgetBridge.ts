import { NativeModules, Platform } from 'react-native';

const { WidgetBridge } = NativeModules;

export function updateWidget(
  task: string | null,
  taskId: string | null,
  isUrgent: boolean,
  emoji: string,
  tasksJson: string,
  createdAt: number | null
): void {
  try {
    if (Platform.OS === 'android' && WidgetBridge) {
      WidgetBridge.setTasks(tasksJson);
      WidgetBridge.updateWidget(task, taskId ?? '', isUrgent, emoji, createdAt ? createdAt : 0);
    }
  } catch (_) {}
}
