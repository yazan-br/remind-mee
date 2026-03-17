import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { log } from "./src/services/logger";
import { Task, getTaskEmoji, isUrgent } from "./src/shared/types";
import {
  addTask,
  completeTask,
  getAllTasks,
  getCompletedTasks,
  getNextTask,
  snoozeTask,
} from "./src/services/tasks";
import { updateWidget } from "./src/services/widgetBridge";
import {
  requestAllPermissions,
  setupNotifications,
} from "./src/services/permissions";

const BANNER_IMAGES = [
  require("./assets/do-it/sddefault.jpg"),
  require("./assets/do-it/maxresdefault.jpg"),
  require("./assets/do-it/mqdefault.jpg"),
  require("./assets/do-it/hqdefault.jpg"),
  require("./assets/do-it/wallpaper2you_54615.png"),
  require("./assets/do-it/desktop-wallpaper-shia-labeouf-s-intense-motivational-speech-just-do-it-thumbnail.jpg"),
  require("./assets/do-it/19-196232_shia-labeouf-just-do-it-png-transparent-png.png"),
  require("./assets/do-it/images.jpeg"),
  require("./assets/do-it/61ThvjyXp8L.png"),
  require("./assets/do-it/205030145a1abcaed4efe27133eb23c6.340x255x61.gif"),
];

const DONE_SOUND = require("./assets/do-it/done-sound.mp3");

const MOTIVATION_PHRASES = [
  "Carol, Your husband is proud of you.",
  "Carol, Being your husband is my greatest honor, but watching the woman you've become is my greatest joy. I don't just love you; I am in awe of you.",
  "Carol, The world sees your grace, but I see your strength. I am so deeply proud to stand by your side and call myself your husband.",
  "Carol, You are my greatest pride. Every day, you give me a thousand new reasons to be proud that I am yours.",
  "Carol, I see the things you do when no one is looking—the kindness, the resilience, the heart. Your husband sees it all, and he couldn't be prouder.",
  "Carol, you are the breath in my lungs and the quiet in my soul. If my heart stops, I will find peace; but if I lose you, the world itself would break, and no hand could ever mend the pieces of who I used to be.",
];

function getPhraseForNow(): string {
  const idx = Math.floor(Date.now() / 7000) % MOTIVATION_PHRASES.length;
  return MOTIVATION_PHRASES[idx];
}

export default function App() {
  const donePlayer = useAudioPlayer(DONE_SOUND);
  const [nextTask, setNextTask] = useState<Task | null>(null);
  const [completed, setCompleted] = useState<Task[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [refreshing, setRefreshing] = useState(0);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setBannerIndex((i) => (i + 1) % BANNER_IMAGES.length);
      setPhraseIndex((i) => (i + 1) % MOTIVATION_PHRASES.length);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    updateWidget(null, null, false, "🌱", "[]", null, getPhraseForNow());
  }, []);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
    log("App started");
    setupNotifications()
      .then(() => log("Notification channel created"))
      .catch((e) => log("Notification setup failed: " + String(e)));
    requestAllPermissions()
      .then((r) => log("Permissions: notifications=" + r.notifications))
      .catch((e) => log("Permission request failed: " + String(e)));
  }, []);

  const refresh = useCallback(async () => {
    const [task, completedList, allTasks] = await Promise.all([
      getNextTask(),
      getCompletedTasks(),
      getAllTasks(),
    ]);
    setNextTask(task);
    setCompleted(completedList);
    const json = JSON.stringify(allTasks);
    const phrase = task ? null : getPhraseForNow();
    updateWidget(
      task?.instruction ?? null,
      task?.id ?? null,
      task ? isUrgent(task) : false,
      task ? getTaskEmoji(task) : "🌱",
      json,
      task?.createdAt ?? null,
      phrase,
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshing]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!nextTask) refresh();
    }, 7000);
    return () => clearInterval(interval);
  }, [nextTask, refresh]);

  const handleDone = async () => {
    if (!nextTask) return;
    donePlayer.seekTo(0);
    donePlayer.play();
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
    log("Adding task: " + text);
    await addTask(text, urgent);
    setInput("");
    setUrgent(false);
    setShowInput(false);
    setRefreshing((r) => r + 1);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const today = now.toDateString();
    const taskDay = d.toDateString();
    if (taskDay === today)
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
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
              <View style={styles.actions}>
                <Pressable
                  style={[styles.button, styles.done]}
                  onPress={handleDone}
                  testID="task-done"
                >
                  <Text style={styles.buttonText}>DONE</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.snooze]}
                  onPress={handleSnooze}
                  testID="task-snooze"
                >
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
                placeholder="Do it"
                placeholderTextColor="#999"
                value={input}
                onChangeText={setInput}
                testID="task-input"
                onSubmitEditing={handleAdd}
                autoFocus
                returnKeyType="done"
              />
              <Pressable
                style={[styles.urgentToggle, urgent && styles.urgentToggleOn]}
                onPress={() => setUrgent((u) => !u)}
                testID="urgent-toggle"
              >
                <Text
                  style={[
                    styles.urgentToggleText,
                    urgent && styles.urgentToggleTextOn,
                  ]}
                >
                  Urgent
                </Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.done]}
                onPress={handleAdd}
                testID="add-task-btn"
              >
                <Text style={styles.buttonText}>ADD</Text>
              </Pressable>
              <Image
                source={BANNER_IMAGES[bannerIndex]}
                style={styles.bannerImage}
                resizeMode="contain"
              />
              <Text style={styles.phraseText}>
                {MOTIVATION_PHRASES[phraseIndex]}
              </Text>
            </View>
          ) : (
            <>
              <Pressable
                style={styles.addTrigger}
                onPress={() => setShowInput(true)}
                testID="add-task-trigger"
              >
                <Text style={styles.addTriggerText}>+ Add task</Text>
              </Pressable>
              <Image
                source={BANNER_IMAGES[bannerIndex]}
                style={styles.bannerImage}
                resizeMode="contain"
              />
              <Text style={styles.phraseText}>
                {MOTIVATION_PHRASES[phraseIndex]}
              </Text>
            </>
          )}
          <Pressable
            style={styles.historyTrigger}
            onPress={() => setShowHistory((h) => !h)}
            testID="history-trigger"
          >
            <Text style={styles.historyTriggerText}>
              {showHistory ? "Hide" : "Show"} history ({completed.length})
            </Text>
          </Pressable>
          {showHistory && completed.length > 0 && (
            <View style={styles.history}>
              {completed.slice(0, 20).map((t) => (
                <View key={t.id} style={styles.historyItem}>
                  <Text style={styles.historyEmoji}>✓</Text>
                  <Text style={styles.historyTask}>{t.instruction}</Text>
                  <Text style={styles.historyDate}>
                    {t.completedAt ? formatDate(t.completedAt) : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    letterSpacing: 1,
    marginBottom: 16,
  },
  instruction: {
    fontSize: 28,
    fontWeight: "500",
    color: "#fff",
    lineHeight: 38,
    marginBottom: 8,
  },
  empty: {
    fontSize: 20,
    color: "#444",
    marginBottom: 32,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  done: {
    backgroundColor: "#22c55e",
  },
  snooze: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#444",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  snoozeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  taskEmoji: {
    fontSize: 24,
  },
  urgentBadge: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  inputSection: {
    marginTop: 24,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  addTrigger: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  addTriggerText: {
    fontSize: 14,
    color: "#666",
  },
  bannerImage: {
    width: "100%",
    height: 220,
    marginTop: 24,
    borderRadius: 8,
    overflow: "hidden",
  },
  phraseText: {
    fontSize: 14,
    color: "#888",
    marginTop: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
  urgentToggle: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  urgentToggleOn: {
    borderColor: "#dc2626",
    backgroundColor: "#dc262620",
  },
  urgentToggleText: {
    fontSize: 14,
    color: "#666",
  },
  urgentToggleTextOn: {
    color: "#dc2626",
    fontWeight: "600",
  },
  historyTrigger: {
    marginTop: 8,
    paddingVertical: 8,
  },
  historyTriggerText: {
    fontSize: 13,
    color: "#555",
  },
  history: {
    marginTop: 12,
    gap: 8,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
  },
  historyEmoji: {
    fontSize: 14,
    marginRight: 10,
  },
  historyTask: {
    fontSize: 14,
    color: "#aaa",
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
});
