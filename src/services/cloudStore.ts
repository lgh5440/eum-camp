// 경량 진입점.
// 30+ 모듈이 import 하지만 firebase SDK는 끌어오지 않는다.
// 실제 Firestore 호출은 cloudStoreImpl.ts에서 dynamic import로 로드된다.
import { cloudSyncEnabled } from './cloudConfig';
import type { CloudStateKey as CloudStateKeyType } from './cloudStoreImpl';

export type CloudStateKey = CloudStateKeyType;

export function isCloudSyncEnabled(): boolean {
  return cloudSyncEnabled;
}

let implPromise: Promise<typeof import('./cloudStoreImpl')> | null = null;

function getImpl() {
  if (!implPromise) implPromise = import('./cloudStoreImpl');
  return implPromise;
}

export function queueCloudSave<T>(key: CloudStateKey, value: T): void {
  if (!cloudSyncEnabled) return;
  void getImpl().then(m => m.queueCloudSave(key, value));
}

export function queueCloudDelete(key: CloudStateKey): void {
  if (!cloudSyncEnabled) return;
  void getImpl().then(m => m.queueCloudDelete(key));
}
