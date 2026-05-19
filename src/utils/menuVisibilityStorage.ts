// 사이드바 메뉴 표시 여부 저장 — 관리자가 EventSettings에서 토글할 수 있음.
// 필수 메뉴(대시보드·설정·매뉴얼)는 항상 노출되어 잠김 상태를 회피할 수 있다.

import type { PageKey } from '../components/Sidebar';
import { publishStorageChange } from './storageEvents';
import { queueCloudSave } from '../services/cloudStore';

export const MENU_VISIBILITY_KEY = 'eum-camp:ui:menu-visibility';

export type MenuVisibility = Partial<Record<PageKey, boolean>>;

// 항상 노출되는 필수 메뉴 (관리자가 끌 수 없음)
export const ALWAYS_VISIBLE: ReadonlyArray<PageKey> = [
  'dashboard',
  'eventsettings',
  'userguide',
];

export function isAlwaysVisible(key: PageKey): boolean {
  return ALWAYS_VISIBLE.includes(key);
}

export function loadMenuVisibility(): MenuVisibility {
  try {
    const raw = localStorage.getItem(MENU_VISIBILITY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as MenuVisibility;
  } catch {
    return {};
  }
}

export function isMenuVisible(key: PageKey, visibility: MenuVisibility): boolean {
  if (isAlwaysVisible(key)) return true;
  // 저장값이 없으면 기본 노출(true). false인 경우만 숨김.
  return visibility[key] !== false;
}

export function saveMenuVisibility(next: MenuVisibility): void {
  try {
    localStorage.setItem(MENU_VISIBILITY_KEY, JSON.stringify(next));
    publishStorageChange(MENU_VISIBILITY_KEY);
  } catch { /* ignore */ }
  queueCloudSave('menuVisibility', next);
}
