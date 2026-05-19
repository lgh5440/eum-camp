import type { Participant } from '../types';
import { queueCloudSave } from '../services/cloudStore';
import { logChange } from './changeLogStorage';
import { publishStorageChange } from './storageEvents';

export const PARTICIPANTS_STORAGE_KEY = 'eum-camp:participants:v1';

// 초기 mockData 시드(샘플 17명)의 고정 ID. 실제 등록자는 generateParticipantId()로
// `u{timestamp}_xxxxx` 또는 `app_...` 형태이므로 이 값들과 절대 충돌하지 않음.
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
