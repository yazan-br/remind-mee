import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@next_tasks';
const { WidgetBridge } = NativeModules;

export async function loadTasks(): Promise<string> {
  if (Platform.OS === 'android' && WidgetBridge?.getTasks) {
    const fromWidget = await new Promise<string>((resolve) => {
      WidgetBridge.getTasks((t: string | null) => resolve(t ?? '[]'));
    });
    if (fromWidget && fromWidget !== '[]') {
      await AsyncStorage.setItem(KEY, fromWidget);
      return fromWidget;
    }
  }
  const data = await AsyncStorage.getItem(KEY);
  const json = data ?? '[]';
  if (Platform.OS === 'android' && WidgetBridge?.setTasks && json !== '[]') {
    WidgetBridge.setTasks(json);
  }
  return json;
}

export async function saveTasks(json: string): Promise<void> {
  await AsyncStorage.setItem(KEY, json);
  if (Platform.OS === 'android' && WidgetBridge?.setTasks) {
    WidgetBridge.setTasks(json);
  }
}
