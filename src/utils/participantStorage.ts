import type { Participant } from '../types';
import { participants as seedParticipants } from '../data/mockData';
import { queueCloudSave } from '../services/cloudStore';
import { logChange } from './changeLogStorage';
import { publishStorageChange } from './storageEvents';

export const PARTICIPANTS_STORAGE_KEY = 'eum-camp:participants:v1';
const SEEDED_FLAG_KEY = 'eum-camp:participants:seeded:v2';

// 옛 17명 시드의 고정 ID (p001~p015, t001~t002) — self-heal로 청소.
// 새 50명 시드(s001~s025, t101~t108, m001~, e001~, l001~, w001~, v001~, med001)는
// 이 명단과 겹치지 않으므로 자동 청소 대상이 아님.
const LEGACY_MOCK_IDS = new Set<string>([
  'p001', 'p002', 'p003', 'p004', 'p005', 'p006', 'p007', 'p008',
  'p009', 'p010', 'p011', 'p012', 'p013', 'p014', 'p015',
  't001', 't002',
]);

function purgeLegacyMockEntries(list: Participant[]): Participant[] {
  return list.filter(p => !LEGACY_MOCK_IDS.has(p.id));
}

export function loadParticipants(): Participant[] {
  try {
    const raw = localStorage.getItem(PARTICIPANTS_STORAGE_KEY);

    // 시드 조건: 한 번도 시드된 적이 없고(SEEDED_FLAG 없음),
    // 사용자 데이터가 실질적으로 비어있음(raw null 또는 빈 배열).
    // SEEDED_FLAG가 있으면 사용자가 의도적으로 비운 것 → 시드 안 함.
    const neverSeeded = !localStorage.getItem(SEEDED_FLAG_KEY);
    const isEmpty = raw === null || raw === '[]' || raw === '';
    if (neverSeeded && isEmpty) {
      const seeded = [...seedParticipants];
      try {
        localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify(seeded));
        localStorage.setItem(SEEDED_FLAG_KEY, '1');
        publishStorageChange(PARTICIPANTS_STORAGE_KEY);
      } catch { /* ignore */ }
      queueCloudSave('participants', seeded);
      return seeded;
    }

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned = purgeLegacyMockEntries(parsed as Participant[]);
    // 레거시 시드가 발견되면 self-heal: localStorage와 Firestore에서 일괄 제거
    if (cleaned.length !== parsed.length) {
      try {
        localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify(cleaned));
        publishStorageChange(PARTICIPANTS_STORAGE_KEY);
      } catch { /* ignore */ }
      queueCloudSave('participants', cleaned);
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function saveParticipants(list: Participant[]): void {
  try {
    localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify(list));
    publishStorageChange(PARTICIPANTS_STORAGE_KEY);
  } catch {
    // storage quota exceeded or unavailable — silently ignore
  }
  queueCloudSave('participants', list);
  logChange('참가자 명단', `참가자 명단 ${list.length}명으로 갱신`);
}

export function resetParticipants(): void {
  try {
    localStorage.removeItem(PARTICIPANTS_STORAGE_KEY);
    publishStorageChange(PARTICIPANTS_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
  queueCloudSave('participants', []);
}

export function generateParticipantId(): string {
  return `u${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
