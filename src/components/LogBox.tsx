import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getLogs, log, subscribe, clearLogs } from '../services/logger';

export function LogBox() {
  const [, setTick] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    return subscribe(() => setTick((n) => n + 1));
  }, []);

  const entries = getLogs();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Log</Text>
        <Pressable
          style={styles.clearBtn}
          onPress={() => {
            clearLogs();
            log('Log cleared');
          }}
        >
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {entries.length === 0 ? (
          <Text style={styles.empty}>No logs yet. Tap Test notification or add a task.</Text>
        ) : (
          entries.map((e, i) => (
            <View key={i} style={styles.entry}>
              <Text style={styles.time}>{e.ts}</Text>
              <Text style={styles.msg}>{e.msg}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    maxHeight: 280,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.5,
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#333',
    borderRadius: 4,
  },
  clearText: {
    fontSize: 11,
    color: '#888',
  },
  scroll: {
    maxHeight: 240,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 24,
  },
  empty: {
    fontSize: 13,
    color: '#444',
    fontStyle: 'italic',
  },
  entry: {
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#111',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#333',
  },
  time: {
    fontSize: 10,
    color: '#555',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  msg: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 18,
  },
});
