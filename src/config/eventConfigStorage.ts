// EventConfig 영속화 — localStorage(+ cloudStore) 어댑터.
//
// • load()  : localStorage에서 override를 읽고 DEFAULT와 머지
// • save()  : override 저장 + cross-tab 통지 + 클라우드 큐 적재
// • reset() : override 삭제 → DEFAULT로 복귀
// • subscribe(): override 변경 시 콜백 (cross-tab 동기화)

import {
  DEFAULT_EVENT_CONFIG,
  mergeEventConfig,
  type EventConfig,
} from './eventConfig';
import { publishStorageChange, listenStorageChange } from '../utils/storageEvents';
import { queueCloudSave } from '../services/cloudStore';

export const EVENT_CONFIG_KEY = 'youth-retreat-2026:eventConfig';

export function loadEventConfig(): EventConfig {
  try {
    const raw = localStorage.getItem(EVENT_CONFIG_KEY);
    if (!raw) return { ...DEFAULT_EVENT_CONFIG };
    const parsed = JSON.parse(raw) as Partial<EventConfig>;
    return mergeEventConfig(parsed);
  } catch {
    return { ...DEFAULT_EVENT_CONFIG };
  }
}

export function saveEventConfig(next: EventConfig): EventConfig {
  const merged = mergeEventConfig(next);
  localStorage.setItem(EVENT_CONFIG_KEY, JSON.stringify(merged));
  publishStorageChange(EVENT_CONFIG_KEY);
  queueCloudSave('eventConfig', merged);
  return merged;
}

export function resetEventConfig(): EventConfig {
  localStorage.removeItem(EVENT_CONFIG_KEY);
  publishStorageChange(EVENT_CONFIG_KEY);
  queueCloudSave('eventConfig', { ...DEFAULT_EVENT_CONFIG });
  return { ...DEFAULT_EVENT_CONFIG };
}

export function subscribeEventConfig(callback: () => void): () => void {
  return listenStorageChange(EVENT_CONFIG_KEY, callback);
}
