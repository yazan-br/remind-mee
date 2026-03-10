import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LocationInput } from './LocationInput';
import { LogBox } from './src/components/LogBox';
import { MapOverlay } from './MapOverlay';
import { log } from './src/services/logger';
import { LocationReminder, Task, getTaskEmoji, isUrgent } from './src/shared/types';
import {
  addTask,
  completeTask,
  getAllTasks,
  getCompletedTasks,
  getNextTask,
  snoozeTask,
} from './src/services/tasks';
import { updateWidget } from './src/services/widgetBridge';
import * as Location from 'expo-location';
import { geocodeAddress } from './src/services/geocoding';
import * as Notifications from 'expo-notifications';
import { requestAllPermissions, setupNotifications } from './src/services/permissions';
import { checkLocationAndNotifyImmediately, updateLocationTaskRegistration } from './src/services/locationReminder';

export default function App() {
  const [nextTask, setNextTask] = useState<Task | null>(null);
  const [completed, setCompleted] = useState<Task[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [refreshing, setRefreshing] = useState(0);
  const [locationAddress, setLocationAddress] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showMapOverlay, setShowMapOverlay] = useState(false);
  const [mapInitialRegion, setMapInitialRegion] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    log('App started');
    setupNotifications()
      .then(() => log('Notification channel created'))
      .catch((e) => log('Notification setup failed: ' + String(e)));
    requestAllPermissions()
      .then((r) => log('Permissions: location=' + r.location + ', notifications=' + r.notifications))
      .catch((e) => log('Permission request failed: ' + String(e)));
  }, []);

  const refresh = useCallback(async () => {
    const [task, completedList, allTasks] = await Promise.all([
      getNextTask(),
      getCompletedTasks(),
      getAllTasks(),
    ]);
    setNextTask(task);
    setCompleted(completedList);
    await updateLocationTaskRegistration();
    const json = JSON.stringify(allTasks);
    updateWidget(
      task?.instruction ?? null,
      task?.id ?? null,
      task ? isUrgent(task) : false,
      task ? getTaskEmoji(task) : '🌱',
      json,
      task?.createdAt ?? null
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshing]);

  const handleDone = async () => {
    if (!nextTask) return;
    await completeTask(nextTask.id);
    setRefreshing((r) => r + 1);
  };

  const handleSnooze = async () => {
    if (!nextTask) return;
    await snoozeTask(nextTask.id);
    setRefreshing((r) => r + 1);
  };

  const handleAdd = async () => {
    const text = input.trim();
    if (!text) return;
    setLocationError(null);
    let locationReminder: LocationReminder | undefined;
    if (locationAddress.trim()) {
      let coords = locationCoords;
      if (!coords) {
        let bias: { lat: number; lng: number } | undefined;
        try {
          const pos = await Location.getLastKnownPositionAsync({ maxAge: 300000 });
          if (pos) bias = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch {}
        coords = await geocodeAddress(locationAddress, bias);
      }
      if (!coords) {
        setLocationError('Could not find address');
        return;
      }
      locationReminder = {
        address: locationAddress.trim(),
        lat: coords.lat,
        lng: coords.lng,
        radiusMeters: 1200,
      };
    }
    log('Adding task: ' + text);
    await addTask(text, urgent, locationReminder);
    setInput('');
    setUrgent(false);
    setLocationAddress('');
    setLocationCoords(null);
    setLocationError(null);
    setShowInput(false);
    await updateLocationTaskRegistration();
    if (locationReminder) {
      log('Task has location - running immediate check');
      checkLocationAndNotifyImmediately().catch((e) => log('Immediate check error: ' + String(e)));
      setTimeout(() => {
        log('Running delayed location check (3s)');
        checkLocationAndNotifyImmediately().catch((e) => log('Delayed check error: ' + String(e)));
      }, 3000);
    }
    setRefreshing((r) => r + 1);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const today = now.toDateString();
    const taskDay = d.toDateString();
    if (taskDay === today) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.content}>
          <Text style={styles.label}>NEXT</Text>
          {nextTask ? (
            <>
              <View style={styles.taskHeader}>
                <Text style={styles.taskEmoji}>{getTaskEmoji(nextTask)}</Text>
                {isUrgent(nextTask) && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>URGENT</Text>
                  </View>
                )}
              </View>
              <Text style={styles.instruction}>{nextTask.instruction}</Text>
              {nextTask.locationReminder && (
                <Text style={styles.locationHint}>
                  At: {nextTask.locationReminder.address}
                </Text>
              )}
              <View style={styles.actions}>
                <Pressable style={[styles.button, styles.done]} onPress={handleDone} testID="task-done">
                  <Text style={styles.buttonText}>DONE</Text>
                </Pressable>
                <Pressable style={[styles.button, styles.snooze]} onPress={handleSnooze} testID="task-snooze">
                  <Text style={styles.snoozeText}>5m</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.empty}>What is the next action?</Text>
          )}
          {showInput ? (
            <View style={styles.inputSection}>
              <TextInput
                style={styles.input}
                placeholder="Open laptop → write first paragraph"
                placeholderTextColor="#999"
                value={input}
                onChangeText={setInput}
                testID="task-input"
                onSubmitEditing={handleAdd}
                autoFocus
                returnKeyType="done"
              />
              <Text style={styles.locationLabel}>Location (optional)</Text>
              <LocationInput
                value={locationAddress}
                onChange={(addr, coords) => {
                  setLocationAddress(addr);
                  setLocationCoords(coords ?? null);
                }}
                onError={setLocationError}
                onOpenMap={(region) => {
                  setMapInitialRegion(region);
                  setShowMapOverlay(true);
                }}
              />
              {locationError && (
                <Text style={styles.errorText}>{locationError}</Text>
              )}
              <Pressable
                style={[styles.urgentToggle, urgent && styles.urgentToggleOn]}
                onPress={() => setUrgent((u) => !u)}
                testID="urgent-toggle"
              >
                <Text style={[styles.urgentToggleText, urgent && styles.urgentToggleTextOn]}>
                  Urgent
                </Text>
              </Pressable>
              <Pressable style={[styles.button, styles.done]} onPress={handleAdd} testID="add-task-btn">
                <Text style={styles.buttonText}>ADD</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.addTrigger} onPress={() => setShowInput(true)} testID="add-task-trigger">
              <Text style={styles.addTriggerText}>+ Add task</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.testNotifTrigger}
            onPress={async () => {
              log('Test notification tapped');
              try {
                log('Step 1: Checking notification permission');
                const { status } = await Notifications.getPermissionsAsync();
                log('Step 2: Current permission status = ' + status);
                if (status !== 'granted') {
                  log('Step 3: Permission not granted, requesting...');
                  const { status: s } = await Notifications.requestPermissionsAsync();
                  log('Step 4: Request result = ' + s);
                  if (s !== 'granted') {
                    log('FAILED: User denied notification permission');
                    return;
                  }
                }
                log('Step 5: Scheduling notification (trigger: null = show now)');
                const id = await Notifications.scheduleNotificationAsync({
                  content: {
                    title: 'Next',
                    body: 'Test notification',
                    sound: true,
                    ...(Platform.OS === 'android' && { channelId: 'reminders' }),
                  },
                  trigger: null,
                });
                log('Step 6: Notification scheduled, id=' + id);
                log('SUCCESS: Notification should appear in status bar');
              } catch (e) {
                log('ERROR: ' + String(e));
              }
            }}
          >
            <Text style={styles.historyTriggerText}>Test notification</Text>
          </Pressable>
          <Pressable
            style={styles.historyTrigger}
            onPress={() => setShowHistory((h) => !h)}
            testID="history-trigger"
          >
            <Text style={styles.historyTriggerText}>
              {showHistory ? 'Hide' : 'Show'} history ({completed.length})
            </Text>
          </Pressable>
          <LogBox />
          {showHistory && completed.length > 0 && (
            <View style={styles.history}>
              {completed.slice(0, 20).map((t) => (
                <View key={t.id} style={styles.historyItem}>
                  <Text style={styles.historyEmoji}>✓</Text>
                  <Text style={styles.historyTask}>{t.instruction}</Text>
                  <Text style={styles.historyDate}>
                    {t.completedAt ? formatDate(t.completedAt) : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      {showMapOverlay && mapInitialRegion && (
        <MapOverlay
          initialRegion={mapInitialRegion}
          onSelect={(addr, coords) => {
            setLocationAddress(addr);
            setLocationCoords(coords);
            setShowMapOverlay(false);
          }}
          onCancel={() => setShowMapOverlay(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 16,
  },
  instruction: {
    fontSize: 28,
    fontWeight: '500',
    color: '#fff',
    lineHeight: 38,
    marginBottom: 8,
  },
  locationHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 24,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    marginTop: -8,
  },
  empty: {
    fontSize: 20,
    color: '#444',
    marginBottom: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  done: {
    backgroundColor: '#22c55e',
  },
  snooze: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#444',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  snoozeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  taskEmoji: {
    fontSize: 24,
  },
  urgentBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  inputSection: {
    marginTop: 24,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  addTrigger: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addTriggerText: {
    fontSize: 14,
    color: '#666',
  },
  urgentToggle: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  urgentToggleOn: {
    borderColor: '#dc2626',
    backgroundColor: '#dc262620',
  },
  urgentToggleText: {
    fontSize: 14,
    color: '#666',
  },
  urgentToggleTextOn: {
    color: '#dc2626',
    fontWeight: '600',
  },
  testNotifTrigger: {
    marginTop: 24,
    paddingVertical: 8,
  },
  historyTrigger: {
    marginTop: 8,
    paddingVertical: 8,
  },
  historyTriggerText: {
    fontSize: 13,
    color: '#555',
  },
  history: {
    marginTop: 12,
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  historyEmoji: {
    fontSize: 14,
    marginRight: 10,
  },
  historyTask: {
    fontSize: 14,
    color: '#aaa',
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
});
