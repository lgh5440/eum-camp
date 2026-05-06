import { churches as mockChurches } from '../data/mockData';
import { queueCloudSave } from '../services/cloudStore';
import { publishStorageChange } from './storageEvents';
import { dedupeChurches } from './churchIdentity';

export interface ChurchConfig {
  id: string;
  name: string;
  quota: number;
  district?: string;
  contact?: string;
  teacherName?: string;
  teacherPhone?: string;
}

export const CHURCH_CONFIG_KEY = 'youth-retreat-2026:church-config:v1';

function defaultConfig(): ChurchConfig[] {
  return mockChurches.map(c => ({
    id: c.id,
    name: c.name,
    quota: c.quota,
    district: c.district,
    contact: c.contact,
    teacherName: c.teacherName,
    teacherPhone: c.teacherPhone,
  }));
}

// 기존 사용자(name/quota만 저장된 경우)도 mockData 기본값으로 보강해서 반환
function enrichWithDefaults(stored: ChurchConfig[]): ChurchConfig[] {
  const defaultMap = new Map(defaultConfig().map(c => [c.id, c]));
  return stored.map(c => {
    const base = defaultMap.get(c.id);
    return {
      ...base,
      ...c,
    } as ChurchConfig;
  });
}

export function loadChurchConfig(): ChurchConfig[] {
  try {
    const raw = localStorage.getItem(CHURCH_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChurchConfig[];
      if (Array.isArray(parsed) && parsed.length > 0) return dedupeChurches(enrichWithDefaults(parsed));
    }
  } catch { /* ignore */ }
  return dedupeChurches(defaultConfig());
}

export function saveChurchConfig(config: ChurchConfig[]): void {
  const next = dedupeChurches(config);
  try {
    localStorage.setItem(CHURCH_CONFIG_KEY, JSON.stringify(next));
    publishStorageChange(CHURCH_CONFIG_KEY);
    queueCloudSave('churchConfig', next);
  } catch { /* ignore */ }
}

// 새 교회 추가 시 사용할 고유 ID 생성 (c01, c02 ... c99)
export function nextChurchId(config: ChurchConfig[]): string {
  const usedNums = new Set(
    config
      .map(c => parseInt(c.id.replace(/^c0*/, ''), 10))
      .filter(n => !Number.isNaN(n)),
  );
  let n = 1;
  while (usedNums.has(n)) n++;
  return `c${n.toString().padStart(2, '0')}`;
}
