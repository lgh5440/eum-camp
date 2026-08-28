import type { Notice, Schedule } from '../types';
import { queueCloudSave } from '../services/cloudStore';
import { publishStorageChange } from './storageEvents';

export interface ScheduleCategoryConfig {
  key: Schedule['category'];
  label: string;
  color: string;
  icon: string;
}

export interface NoticeTargetConfig {
  key: Notice['target'];
  label: string;
  color: string;
}

export const SCHEDULE_CATEGORY_CONFIG_KEY = 'eum-camp:schedule-categories:v1';
export const NOTICE_TARGET_CONFIG_KEY = 'eum-camp:notice-targets:v1';

export const DEFAULT_SCHEDULE_CATEGORY_CONFIG: ScheduleCategoryConfig[] = [
  { key: 'worship', label: '예배/강의', color: '#8b5cf6', icon: '✝️' },
  { key: 'program', label: '프로그램', color: '#3B82F6', icon: '🎯' },
  { key: 'meal', label: '식사', color: '#10b981', icon: '🍽️' },
  { key: 'free', label: '자유시간', color: '#f59e0b', icon: '🌞' },
  { key: 'sleep', label: '취침', color: '#64748b', icon: '🌙' },
  { key: 'move', label: '이동/등록', color: '#3b82f6', icon: '🚌' },
];

export const DEFAULT_NOTICE_TARGET_CONFIG: NoticeTargetConfig[] = [
  { key: 'all', label: '전체', color: '#3B82F6' },
  { key: 'staff', label: '운영진', color: '#8b5cf6' },
  { key: 'church', label: '교회 담당자', color: '#10b981' },
];

function safeParse<T>(raw: string | null): T[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : null;
  } catch {
    return null;
  }
}

function mergeByKey<T extends { key: string }>(defaults: T[], saved: T[] | null): T[] {
  if (!saved) return defaults;
  const savedMap = new Map(saved.map(item => [item.key, item]));
  return defaults.map(item => ({ ...item, ...savedMap.get(item.key) }));
}

export function loadScheduleCategoryConfig(): ScheduleCategoryConfig[] {
  const saved = safeParse<ScheduleCategoryConfig>(localStorage.getItem(SCHEDULE_CATEGORY_CONFIG_KEY));
  return mergeByKey(DEFAULT_SCHEDULE_CATEGORY_CONFIG, saved);
}

export function saveScheduleCategoryConfig(config: ScheduleCategoryConfig[]): void {
  try {
    localStorage.setItem(SCHEDULE_CATEGORY_CONFIG_KEY, JSON.stringify(config));
    publishStorageChange(SCHEDULE_CATEGORY_CONFIG_KEY);
    queueCloudSave('scheduleCategories', config);
  } catch { /* ignore storage errors */ }
}

export function loadNoticeTargetConfig(): NoticeTargetConfig[] {
  const saved = safeParse<NoticeTargetConfig>(localStorage.getItem(NOTICE_TARGET_CONFIG_KEY));
  return mergeByKey(DEFAULT_NOTICE_TARGET_CONFIG, saved);
}

export function saveNoticeTargetConfig(config: NoticeTargetConfig[]): void {
  try {
    localStorage.setItem(NOTICE_TARGET_CONFIG_KEY, JSON.stringify(config));
    publishStorageChange(NOTICE_TARGET_CONFIG_KEY);
    queueCloudSave('noticeTargetConfig', config);
  } catch { /* ignore storage errors */ }
}
