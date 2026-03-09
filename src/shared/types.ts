export type TaskStatus = 'pending' | 'snoozed' | 'completed';

export interface LocationReminder {
  address: string;
  lat: number;
  lng: number;
  radiusMeters?: number;
}

export interface Task {
  id: string;
  instruction: string;
  status: TaskStatus;
  snoozedUntil: number | null;
  createdAt: number;
  completedAt: number | null;
  urgent?: boolean;
  locationReminder?: LocationReminder;
}

const OVERDUE_HOURS = 24;

export function isOverdue(task: Task): boolean {
  if (task.status !== 'pending') return false;
  const hours = (Date.now() - task.createdAt) / (1000 * 60 * 60);
  return hours >= OVERDUE_HOURS;
}

export function isUrgent(task: Task): boolean {
  return task.urgent === true || isOverdue(task);
}

const FRESH_HOURS = 2;
const LATE_HOURS = 4;

export function getTaskEmoji(task: Task): string {
  if (task.status === 'completed') return '✓';
  const hours = (Date.now() - task.createdAt) / (1000 * 60 * 60);
  if (hours < FRESH_HOURS) return '🌱';
  if (hours < LATE_HOURS) return '⏰';
  return '💩';
}
