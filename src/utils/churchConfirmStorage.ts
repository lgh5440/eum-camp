import { queueCloudSave } from '../services/cloudStore';
import { logChange } from './changeLogStorage';
import { publishStorageChange } from './storageEvents';

export const CHURCH_CONFIRM_KEY = 'youth-retreat-church-confirm-v1';

export interface ChurchConfirmEntry {
  confirmed: boolean;
  confirmedAt: string;
}

export type ChurchConfirmMap = Record<string, ChurchConfirmEntry>;

export function loadChurchConfirmMap(): ChurchConfirmMap {
  try {
    const raw = localStorage.getItem(CHURCH_CONFIRM_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return parsed as ChurchConfirmMap;
  } catch {
    return {};
  }
}

export function saveChurchConfirmMap(map: ChurchConfirmMap): void {
  try {
    localStorage.setItem(CHURCH_CONFIRM_KEY, JSON.stringify(map));
    publishStorageChange(CHURCH_CONFIRM_KEY);
  } catch {
    // ignore quota errors
  }
  queueCloudSave('churchConfirm', map);
  logChange('교회별 확인', `교회 확인 상태 ${Object.keys(map).length}건으로 갱신`);
}

export function toggleChurchConfirm(
  churchKey: string,
  map: ChurchConfirmMap,
): ChurchConfirmMap {
  const current = map[churchKey];
  if (current?.confirmed) {
    const next = { ...map };
    delete next[churchKey];
    return next;
  }
  return {
    ...map,
    [churchKey]: {
      confirmed:   true,
      confirmedAt: new Date().toISOString().slice(0, 19),
    },
  };
}
