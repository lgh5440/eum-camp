import { queueCloudSave } from '../services/cloudStore';
import { logChange } from './changeLogStorage';
import { publishStorageChange } from './storageEvents';

export const CHECKIN_KEY = 'eum-camp:checkin:v1';

export interface CheckInEntry {
  checkedIn: boolean;
  checkedInAt: string;
}

export type CheckInMap = Record<string, CheckInEntry>;

export function loadCheckInMap(): CheckInMap {
  try {
    const raw = localStorage.getItem(CHECKIN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return parsed as CheckInMap;
  } catch {
    return {};
  }
}

export function saveCheckInMap(map: CheckInMap): void {
  try {
    localStorage.setItem(CHECKIN_KEY, JSON.stringify(map));
    publishStorageChange(CHECKIN_KEY);
  } catch {
    // ignore quota errors
  }
  queueCloudSave('checkIn', map);
  logChange('현장 체크인', `체크인 기록 ${Object.keys(map).length}건으로 갱신`);
}

export function toggleCheckIn(id: string, map: CheckInMap): CheckInMap {
  const current = map[id];
  if (current?.checkedIn) {
    const next = { ...map };
    delete next[id];
    return next;
  }
  return {
    ...map,
    [id]: {
      checkedIn:   true,
      checkedInAt: new Date().toISOString().slice(0, 19),
    },
  };
}
