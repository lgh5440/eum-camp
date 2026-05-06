import { GROUP_CONFIG } from './groupAssignment';
import { queueCloudSave } from '../services/cloudStore';
import { publishStorageChange } from './storageEvents';

export interface GroupMeta {
  id: string;
  name: string;
  leaderName: string;
  color?: string;
}

export const GROUP_META_KEY = 'youth-retreat-2026:group-meta:v1';

export const GROUP_COLOR_PALETTE = [
  '#06b6d4', '#3b82f6', '#8b5cf6', '#10b981',
  '#f59e0b', '#ec4899', '#ef4444', '#14b8a6',
  '#a855f7', '#f97316', '#84cc16', '#0ea5e9',
];

function defaultMeta(): GroupMeta[] {
  return GROUP_CONFIG.map(g => ({
    id: g.id,
    name: g.name,
    leaderName: g.leaderName,
    color: g.color,
  }));
}

export function loadGroupMeta(): GroupMeta[] {
  try {
    const raw = localStorage.getItem(GROUP_META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GroupMeta[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(m => ({
          ...m,
          color: m.color ?? GROUP_CONFIG.find(g => g.id === m.id)?.color ?? GROUP_COLOR_PALETTE[0],
        }));
      }
    }
  } catch { /* ignore */ }
  return defaultMeta();
}

export function saveGroupMeta(meta: GroupMeta[]): void {
  try {
    localStorage.setItem(GROUP_META_KEY, JSON.stringify(meta));
    publishStorageChange(GROUP_META_KEY);
    queueCloudSave('groupMeta', meta);
  } catch { /* ignore */ }
}

export function nextGroupId(meta: GroupMeta[]): string {
  const usedNums = new Set(
    meta
      .map(g => parseInt(g.id.replace(/^g0*/, ''), 10))
      .filter(n => !Number.isNaN(n)),
  );
  let n = 1;
  while (usedNums.has(n)) n++;
  return `g${n.toString().padStart(2, '0')}`;
}

export function nextGroupColor(meta: GroupMeta[]): string {
  const used = new Set(meta.map(g => g.color).filter(Boolean) as string[]);
  return GROUP_COLOR_PALETTE.find(c => !used.has(c)) ?? GROUP_COLOR_PALETTE[meta.length % GROUP_COLOR_PALETTE.length];
}
