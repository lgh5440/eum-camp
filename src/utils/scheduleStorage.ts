import { schedules as initialSchedules } from '../data/mockData';
import type { Schedule } from '../types';
import { queueCloudSave } from '../services/cloudStore';
import { publishStorageChange } from './storageEvents';

export const SCHEDULE_STORAGE_KEY = 'youth-retreat-2026:schedules:v1';

export function loadScheduleItems(): Schedule[] {
  try {
    const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Schedule[]) : initialSchedules;
  } catch {
    return initialSchedules;
  }
}

export function saveScheduleItems(items: Schedule[]): void {
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(items));
    publishStorageChange(SCHEDULE_STORAGE_KEY);
    queueCloudSave('scheduleItems', items);
  } catch { /* ignore storage errors */ }
}

export function resetScheduleItems(): void {
  localStorage.removeItem(SCHEDULE_STORAGE_KEY);
  publishStorageChange(SCHEDULE_STORAGE_KEY);
  queueCloudSave('scheduleItems', initialSchedules);
}
