import type { Session } from '../auth/types';
import { SESSION_KEY } from '../auth/storage';
import { queueCloudSave } from '../services/cloudStore';
import { publishStorageChange } from './storageEvents';

export const CHANGE_LOG_KEY = 'youth-retreat-change-log-v1';
const MAX_LOG_ENTRIES = 200;

export interface ChangeLogEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}

function getActor(): string {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return '알 수 없음';
    const session = JSON.parse(raw) as Session;
    return session.displayName || session.role || '알 수 없음';
  } catch {
    return '알 수 없음';
  }
}

export function loadChangeLog(): ChangeLogEntry[] {
  try {
    const raw = localStorage.getItem(CHANGE_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as ChangeLogEntry[] : [];
  } catch {
    return [];
  }
}

export function saveChangeLog(entries: ChangeLogEntry[]): void {
  const next = entries.slice(0, MAX_LOG_ENTRIES);
  try {
    localStorage.setItem(CHANGE_LOG_KEY, JSON.stringify(next));
    publishStorageChange(CHANGE_LOG_KEY);
  } catch {
    // Keep the main operation working even if logging cannot be written.
  }
  queueCloudSave('changeLog', next);
}

export function logChange(action: string, detail: string): void {
  const entry: ChangeLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    actor: getActor(),
    action,
    detail,
  };
  saveChangeLog([entry, ...loadChangeLog()]);
}

export function clearChangeLog(): void {
  saveChangeLog([]);
}
