import type { Room } from '../types';
import { rooms as mockRooms } from '../data/mockData';
import { queueCloudSave } from '../services/cloudStore';
import { publishStorageChange } from './storageEvents';

export const ROOM_CONFIG_KEY = 'youth-retreat-2026:room-config:v1';

export function loadRoomConfig(): Room[] {
  try {
    const raw = localStorage.getItem(ROOM_CONFIG_KEY);
    if (raw) return JSON.parse(raw) as Room[];
  } catch { /* ignore */ }
  return mockRooms.map(r => ({ ...r }));
}

export function saveRoomConfig(rooms: Room[]): void {
  try {
    localStorage.setItem(ROOM_CONFIG_KEY, JSON.stringify(rooms));
    publishStorageChange(ROOM_CONFIG_KEY);
  } catch { /* ignore */ }
  queueCloudSave('roomConfig', rooms);
}

export function resetRoomConfig(): void {
  localStorage.removeItem(ROOM_CONFIG_KEY);
  publishStorageChange(ROOM_CONFIG_KEY);
}
