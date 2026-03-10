type LogEntry = { ts: string; msg: string; step?: number };

const logs: LogEntry[] = [];
const listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

export function log(msg: string, step?: number) {
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
  logs.push({ ts, msg, step });
  if (logs.length > 100) logs.shift();
  notify();
}

export function getLogs(): LogEntry[] {
  return [...logs];
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function clearLogs() {
  logs.length = 0;
  notify();
}
