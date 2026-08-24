import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { cloudSyncEnabled } from './cloudConfig';
import { CLOUD_EVENT_ID, firestoreDb } from './firebase';
import { toastBus } from '../components/ToastProvider';

// cloud sync 실패 알림 — 같은 에러를 반복 노출하지 않게 디바운스
let lastSyncErrorAt = 0;
function notifySyncFailure(action: string) {
  const now = Date.now();
  if (now - lastSyncErrorAt < 30_000) return; // 30초 내 중복 차단
  lastSyncErrorAt = now;
  toastBus.showToast(
    `클라우드 ${action} 실패 — 변경 사항은 이 기기에 보관되며, 연결되면 자동 재전송합니다.`,
    'warning',
  );
}

export type CloudStateKey =
  | 'participants'
  | 'checklistStatus'
  | 'checklistItems'
  | 'checkIn'
  | 'churchConfig'
  | 'churchConfirm'
  | 'groupMeta'
  | 'roomConfig'
  | 'noticeItems'
  | 'noticeTargetConfig'
  | 'safetyItems'
  | 'scheduleCategories'
  | 'scheduleItems'
  | 'applicationQueue'
  | 'changeLog'
  | 'dailyWord'
  | 'eventConfig'
  | 'menuVisibility';

interface CloudStateDoc<T> {
  value?: T;
  version?: number;
  updatedAt?: unknown;
}

const PENDING_CLOUD_WRITES_KEY = 'eum-camp:cloud:pending-writes';

type PendingWrites = Partial<Record<CloudStateKey, unknown>>;

function getStateDoc(key: CloudStateKey) {
  if (!firestoreDb) throw new Error('Firebase is not configured.');
  return doc(firestoreDb, 'retreats', CLOUD_EVENT_ID, 'state', key);
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => stripUndefined(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, stripUndefined(entryValue)]),
    ) as T;
  }

  return value;
}

export function isCloudSyncEnabled(): boolean {
  return cloudSyncEnabled && !!firestoreDb;
}

export function subscribeCloudState<T>(
  key: CloudStateKey,
  onValue: (value: T | undefined) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!isCloudSyncEnabled()) return () => {};

  return onSnapshot(
    getStateDoc(key),
    snapshot => {
      if (!snapshot.exists()) {
        onValue(undefined);
        return;
      }
      const data = snapshot.data() as CloudStateDoc<T>;
      onValue(data.value);
    },
    error => onError?.(error),
  );
}

export async function saveCloudState<T>(key: CloudStateKey, value: T): Promise<boolean> {
  if (!isCloudSyncEnabled()) return false;
  await setDoc(
    getStateDoc(key),
    { value: stripUndefined(value), version: 1, updatedAt: serverTimestamp() },
    { merge: true },
  );
  return true;
}

export async function seedCloudState<T>(key: CloudStateKey, value: T): Promise<boolean> {
  if (!isCloudSyncEnabled()) return false;
  const ref = getStateDoc(key);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) return false;
  await setDoc(ref, {
    value: stripUndefined(value),
    version: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return true;
}

/** 구독 없이 1회만 읽는다 — 게이트 판정처럼 "지금 클라우드에 뭐가 있나"만 필요할 때 쓴다. */
export async function fetchCloudStateOnce<T>(key: CloudStateKey): Promise<T | undefined> {
  if (!isCloudSyncEnabled()) return undefined;
  const snapshot = await getDoc(getStateDoc(key));
  if (!snapshot.exists()) return undefined;
  const data = snapshot.data() as CloudStateDoc<T>;
  return data.value;
}

export async function deleteCloudState(key: CloudStateKey): Promise<boolean> {
  if (!isCloudSyncEnabled()) return false;
  await deleteDoc(getStateDoc(key));
  return true;
}

export function queueCloudSave<T>(key: CloudStateKey, value: T): void {
  void saveCloudState(key, value).catch(error => {
    console.warn(`[cloud sync] ${key} save failed`, error);
    savePendingCloudWrite(key, value);
    notifySyncFailure('저장');
  });
}

export function queueCloudDelete(key: CloudStateKey): void {
  void deleteCloudState(key).catch(error => {
    console.warn(`[cloud sync] ${key} delete failed`, error);
    notifySyncFailure('삭제');
  });
}

function loadPendingCloudWrites(): PendingWrites {
  try {
    const raw = localStorage.getItem(PENDING_CLOUD_WRITES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? parsed as PendingWrites
      : {};
  } catch {
    return {};
  }
}

function savePendingCloudWrites(writes: PendingWrites): void {
  try {
    localStorage.setItem(PENDING_CLOUD_WRITES_KEY, JSON.stringify(writes));
  } catch {
    // Ignore storage failures; the app still keeps the current local state.
  }
}

/**
 * 미전송 쓰기 큐를 비운다.
 * 데모 초기화처럼 클라우드 상태를 통째로 되돌린 직후, 남아 있던 큐가 flush 되어
 * 옛 값이 되살아나는 것을 막기 위해 쓴다.
 */
export function clearPendingCloudWrites(): void {
  try {
    localStorage.removeItem(PENDING_CLOUD_WRITES_KEY);
  } catch {
    // 저장소를 못 써도 앱은 계속 돌아야 한다.
  }
}

function savePendingCloudWrite<T>(key: CloudStateKey, value: T): void {
  if (!isCloudSyncEnabled()) return;
  const writes = loadPendingCloudWrites();
  writes[key] = stripUndefined(value);
  savePendingCloudWrites(writes);
}

export async function flushPendingCloudWrites(): Promise<void> {
  if (!isCloudSyncEnabled()) return;
  const writes = loadPendingCloudWrites();
  const entries = Object.entries(writes) as Array<[CloudStateKey, unknown]>;
  if (entries.length === 0) return;

  for (const [key, value] of entries) {
    await saveCloudState(key, value);
    delete writes[key];
    savePendingCloudWrites(writes);
  }
}

export function initCloudWriteFlush(): () => void {
  if (!isCloudSyncEnabled() || typeof window === 'undefined') return () => {};

  const flush = () => {
    void flushPendingCloudWrites().catch(error => {
      console.warn('[cloud sync] pending write flush failed', error);
    });
  };

  flush();
  window.addEventListener('online', flush);
  return () => window.removeEventListener('online', flush);
}
