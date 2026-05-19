import { notices as initialNotices } from '../data/mockData';
import type { Notice } from '../types';
import { queueCloudSave } from '../services/cloudStore';
import { publishStorageChange } from './storageEvents';

export const NOTICE_ITEMS_KEY = 'eum-camp:notices:v1';

// 한 번만 자동 시드할 공지 ID 목록 (mockData 신규 항목)
// 사용자가 의도적으로 삭제한 경우 다시 추가하지 않도록 SEED_FLAG_KEY로 추적
const SEED_NOTICE_IDS = ['n00'] as const;
const SEED_FLAG_KEY = 'eum-camp:notices:seeded-v1';

function seedMissingNotices(items: Notice[]): Notice[] {
  if (localStorage.getItem(SEED_FLAG_KEY) === '1') return items;

  const existingIds = new Set(items.map(n => n.id));
  const toAdd = SEED_NOTICE_IDS
    .map(id => initialNotices.find(n => n.id === id))
    .filter((n): n is Notice => Boolean(n) && !existingIds.has(n!.id));

  localStorage.setItem(SEED_FLAG_KEY, '1');

  if (toAdd.length === 0) return items;
  const merged = [...toAdd, ...items];
  localStorage.setItem(NOTICE_ITEMS_KEY, JSON.stringify(merged));
  publishStorageChange(NOTICE_ITEMS_KEY);
  queueCloudSave('noticeItems', merged);
  return merged;
}

export function loadNoticeItems(): Notice[] {
  try {
    const raw = localStorage.getItem(NOTICE_ITEMS_KEY);
    if (!raw) return initialNotices;
    const parsed = JSON.parse(raw) as Notice[];
    return seedMissingNotices(parsed);
  } catch {
    return initialNotices;
  }
}

export function saveNoticeItems(items: Notice[]): void {
  try {
    localStorage.setItem(NOTICE_ITEMS_KEY, JSON.stringify(items));
    publishStorageChange(NOTICE_ITEMS_KEY);
    queueCloudSave('noticeItems', items);
  } catch {
    // Keep the current screen usable even if storage is temporarily unavailable.
  }
}

export function resetNoticeItems(): void {
  localStorage.removeItem(NOTICE_ITEMS_KEY);
  publishStorageChange(NOTICE_ITEMS_KEY);
  queueCloudSave('noticeItems', initialNotices);
}
