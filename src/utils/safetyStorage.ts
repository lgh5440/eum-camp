import { safetyItems as initialSafetyItems } from '../data/mockData';
import type { SafetyItem } from '../types';
import { queueCloudSave } from '../services/cloudStore';
import { publishStorageChange } from './storageEvents';

export const SAFETY_ITEMS_KEY = 'eum-camp:safety-items:v1';

export function loadSafetyItems(): SafetyItem[] {
  try {
    const raw = localStorage.getItem(SAFETY_ITEMS_KEY);
    return raw ? JSON.parse(raw) as SafetyItem[] : initialSafetyItems;
  } catch {
    return initialSafetyItems;
  }
}

export function saveSafetyItems(items: SafetyItem[]): void {
  try {
    localStorage.setItem(SAFETY_ITEMS_KEY, JSON.stringify(items));
    publishStorageChange(SAFETY_ITEMS_KEY);
    queueCloudSave('safetyItems', items);
  } catch { /* ignore storage errors */ }
}

export function resetSafetyItems(): void {
  localStorage.removeItem(SAFETY_ITEMS_KEY);
  publishStorageChange(SAFETY_ITEMS_KEY);
  queueCloudSave('safetyItems', initialSafetyItems);
}
