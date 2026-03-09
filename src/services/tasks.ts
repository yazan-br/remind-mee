import { Task } from '../shared/types';
import { loadTasks, saveTasks } from './storage';

const SNOOZE_MS = 5 * 60 * 1000;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function getAllTasks(): Promise<Task[]> {
  const json = await loadTasks();
  return JSON.parse(json);
}

export async function getTasks(): Promise<Task[]> {
  const tasks = await getAllTasks();
  const now = Date.now();
  return tasks
    .filter((t) => {
      if (t.status === 'completed') return false;
      if (t.status === 'snoozed' && t.snoozedUntil !== null && t.snoozedUntil > now)
        return false;
      return true;
    })
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getCompletedTasks(): Promise<Task[]> {
  const tasks = await getAllTasks();
  return tasks
    .filter((t) => t.status === 'completed')
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
}

export async function addTask(instruction: string, urgent = false): Promise<Task> {
  const json = await loadTasks();
  const tasks: Task[] = JSON.parse(json);
  const task: Task = {
    id: generateId(),
    instruction: instruction.trim(),
    status: 'pending',
    snoozedUntil: null,
    createdAt: Date.now(),
    completedAt: null,
    urgent,
  };
  tasks.push(task);
  await saveTasks(JSON.stringify(tasks));
  return task;
}

export async function completeTask(id: string): Promise<void> {
  const json = await loadTasks();
  const tasks: Task[] = JSON.parse(json);
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return;
  tasks[idx].status = 'completed';
  tasks[idx].completedAt = Date.now();
  await saveTasks(JSON.stringify(tasks));
}

export async function snoozeTask(id: string): Promise<void> {
  const json = await loadTasks();
  const tasks: Task[] = JSON.parse(json);
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return;
  tasks[idx].status = 'snoozed';
  tasks[idx].snoozedUntil = Date.now() + SNOOZE_MS;
  await saveTasks(JSON.stringify(tasks));
}

export async function getNextTask(): Promise<Task | null> {
  const tasks = await getTasks();
  const now = Date.now();
  const ready = tasks.filter(
    (t) => t.status === 'pending' || (t.snoozedUntil !== null && t.snoozedUntil <= now)
  );
  if (ready.length === 0) return null;
  const next = ready[0];
  if (next.snoozedUntil !== null && next.snoozedUntil <= now) {
    const json = await loadTasks();
    const all: Task[] = JSON.parse(json);
    const idx = all.findIndex((t) => t.id === next.id);
    if (idx !== -1) {
      all[idx].status = 'pending';
      all[idx].snoozedUntil = null;
      await saveTasks(JSON.stringify(all));
    }
  }
  return { ...next, status: 'pending' as const, snoozedUntil: null };
}
