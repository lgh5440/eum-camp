import { checklistItems as initialItems } from '../data/mockData';
import type { ChecklistItem } from '../types';
import { queueCloudSave } from '../services/cloudStore';
import { logChange } from './changeLogStorage';
import { publishStorageChange } from './storageEvents';

export const CHECKLIST_STORAGE_KEY = 'eum-camp:checklist:status:v1';
export type StatusMap = Record<string, ChecklistItem['status']>;

const VALID_STATUSES = new Set<ChecklistItem['status']>([
  'done', 'inprogress', 'pending', 'blocked',
]);

/** localStorage에서 { id: status } 맵 로드. 오류·없음·형식 오류 시 빈 객체 반환 */
export function loadChecklistStatusMap(): StatusMap {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return parsed as StatusMap;
  } catch {
    return {};
  }
}

export function saveChecklistStatusMap(map: StatusMap, logDetail?: string): void {
  try {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(map));
    publishStorageChange(CHECKLIST_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
  queueCloudSave('checklistStatus', map);
  if (logDetail) logChange('체크리스트', logDetail);
}

export function resetChecklistStatusMap(): void {
  saveChecklistStatusMap({}, '체크리스트 상태 초기화');
}

/** mockData + localStorage를 병합한 ChecklistItem 배열 반환 */
export function mergeChecklistWithSavedStatus(): ChecklistItem[] {
  const saved = loadChecklistStatusMap();
  return initialItems.map(item => {
    const s = saved[item.id];
    return { ...item, status: s && VALID_STATUSES.has(s) ? s : item.status };
  });
}

/** dueDate('YYYY-MM-DD') → 오늘 기준 남은 일수 (음수 = 마감 지남). UTC 시간대 버그 방지 */
export function getDayDiff(dueDate: string): number {
  const [y, m, d] = dueDate.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export interface ChecklistStats {
  total: number;
  doneCount: number;
  pct: number;
  overdueCount: number; // 미완료 중 마감 지남 (diff < 0)
  urgentCount: number;  // 미완료 중 마감 임박 (0 ≤ diff ≤ 3)
}

/**
 * 체크리스트 집계 통계 반환.
 * items를 직접 넘기면 그 배열을 사용, 없으면 localStorage 병합값을 사용.
 */
export function calculateChecklistStats(items?: ChecklistItem[]): ChecklistStats {
  const list = items ?? mergeChecklistWithSavedStatus();
  const total = list.length;
  const doneCount = list.filter(c => c.status === 'done').length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const notDone = list.filter(c => c.status !== 'done');
  const overdueCount = notDone.filter(c => getDayDiff(c.dueDate) < 0).length;
  const urgentCount = notDone.filter(c => {
    const d = getDayDiff(c.dueDate);
    return d >= 0 && d <= 3;
  }).length;
  return { total, doneCount, pct, overdueCount, urgentCount };
}

// ── Full item list (add / edit / delete support) ──────────────────────────────

export const CHECKLIST_FULL_KEY = 'eum-camp:checklist:full:v1';

/** 전체 항목 로드 — 커스텀 항목 포함, 없으면 status-merged 기본값 */
export function loadFullChecklistItems(): ChecklistItem[] {
  try {
    const raw = localStorage.getItem(CHECKLIST_FULL_KEY);
    if (raw) return JSON.parse(raw) as ChecklistItem[];
    return mergeChecklistWithSavedStatus();
  } catch {
    return mergeChecklistWithSavedStatus();
  }
}

/** 전체 항목 저장 — status map도 동시 갱신 (하위 호환) */
export function saveFullChecklistItems(items: ChecklistItem[], logDetail?: string): void {
  try {
    localStorage.setItem(CHECKLIST_FULL_KEY, JSON.stringify(items));
    publishStorageChange(CHECKLIST_FULL_KEY);
    // sync status map so cloud sync + backward-compat hooks still work
    const map: StatusMap = {};
    for (const item of items) map[item.id] = item.status;
    saveChecklistStatusMap(map);
    queueCloudSave('checklistItems', items);
  } catch { /* ignore */ }
  if (logDetail) logChange('체크리스트', logDetail);
}

/** 전체 초기화 (커스텀 항목 + status 모두 제거) */
export function resetFullChecklistItems(): void {
  localStorage.removeItem(CHECKLIST_FULL_KEY);
  publishStorageChange(CHECKLIST_FULL_KEY);
  resetChecklistStatusMap();
  queueCloudSave('checklistItems', mergeChecklistWithSavedStatus());
}
