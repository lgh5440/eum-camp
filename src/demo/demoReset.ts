// 데모 배포본 전용 — 매일 새벽 4시(KST) 데이터 자동 초기화.
//
// 동작 요약
//   1) 접속자가 앱을 열면(= CloudSyncProvider 가 구독을 걸기 직전) 이번 주기가 초기화됐는지 본다.
//   2) 안 됐으면 retreats/{eventId}/state/demoReset 문서를 트랜잭션으로 "선점"한다.
//      단일 문서 트랜잭션은 compare-and-set 이므로, 동시에 수십 명이 열어도 승자는 정확히 한 명이다.
//   3) 승자만 18개 state 문서를 스냅샷 값으로 일괄(writeBatch) 교체한다. 배치는 원자적이라
//      절반만 초기화된 상태가 남지 않는다.
//   4) 되돌리는 값이 코드에 고정된 스냅샷이므로 초기화 자체가 멱등이다 —
//      만에 하나 두 접속자가 겹쳐 실행해도 수렴 결과가 같다(트랜잭션은 쓰기 폭증을 막는 최적화).
//
// ⚠ Cloud Functions / Blaze 를 쓰지 않는다. 무료(Spark) 범위의 클라이언트 트랜잭션 + 배치만 쓴다.
//    하루 비용: 읽기 2 + 쓰기 19 남짓.
//
// ⚠ 이 모듈은 DEMO_MODE 가 켜졌을 때만 dynamic import 된다(demoConfig.ts 참고).

import {
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
  type DocumentReference,
} from 'firebase/firestore';
import { CLOUD_EVENT_ID, firestoreDb } from '../services/firebase';
import { clearPendingCloudWrites } from '../services/cloudStoreImpl';
import { MENU_VISIBILITY_KEY } from '../utils/menuVisibilityStorage';
import { publishStorageChange } from '../utils/storageEvents';
import { DEMO_MODE } from './demoConfig';
import { cycleStartOf, decideClaim, type DemoResetMark } from './demoCycle';

const RESET_DOC_KEY = 'demoReset';
/** 이 브라우저가 마지막으로 처리한 주기 — 로컬 뒷정리를 주기당 1회만 하기 위한 표식. */
const LOCAL_CYCLE_KEY = 'eum-camp:demo:last-cycle';

function resetDocRef(): DocumentReference<DocumentData> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');
  return doc(firestoreDb, 'retreats', CLOUD_EVENT_ID, 'state', RESET_DOC_KEY);
}

function stateDocRef(key: string): DocumentReference<DocumentData> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');
  return doc(firestoreDb, 'retreats', CLOUD_EVENT_ID, 'state', key);
}

function readLocalCycle(): number {
  try {
    const raw = localStorage.getItem(LOCAL_CYCLE_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * 이 브라우저에만 남아 있는 지난 주기 찌꺼기를 지운다. 승자/패자 구분 없이 모든 접속자가 한다.
 *  - 미전송 쓰기 큐: 그대로 두면 초기화 직후 flush 되어 옛 값이 되살아난다.
 *  - menuVisibility: 클라우드 구독 바인딩이 없어(단방향) 초기화해도 로컬에 영구히 남는다.
 */
function purgeLocalRemnants(cycleStart: number): void {
  if (readLocalCycle() >= cycleStart) return;
  clearPendingCloudWrites();
  try {
    localStorage.removeItem(MENU_VISIBILITY_KEY);
    publishStorageChange(MENU_VISIBILITY_KEY);
  } catch {
    // 저장소를 못 써도 앱은 계속 돌아야 한다.
  }
  try {
    localStorage.setItem(LOCAL_CYCLE_KEY, String(cycleStart));
  } catch {
    // 표식을 못 남기면 다음 로드에서 한 번 더 지울 뿐이다(무해).
  }
}

/** 트랜잭션으로 이번 주기를 선점한다. 성공하면 되돌리기용 이전 문서 내용을 돌려준다. */
async function claimCycle(
  cycleStart: number,
  nowMs: number,
): Promise<{ claimed: false } | { claimed: true; previous: DocumentData | null }> {
  const ref = resetDocRef();
  let previous: DocumentData | null = null;

  const claimed = await runTransaction(firestoreDb!, async tx => {
    const snap = await tx.get(ref);
    previous = snap.exists() ? snap.data() : null;
    const mark = (previous?.value ?? null) as DemoResetMark | null;

    if (decideClaim(mark, nowMs) === 'skip') return false;

    tx.set(ref, {
      value: { cycleStart, claimedAt: nowMs, completedAt: null },
      version: 1,
      updatedAt: serverTimestamp(),
    });
    return true;
  });

  return claimed ? { claimed: true, previous } : { claimed: false };
}

/**
 * 선점 직후 서버 시각으로 접속자 시계를 검증한다.
 * 브라우저 시계가 하루 어긋난 접속자가 엉뚱한 시점에 데이터를 되돌리는 사고를 막는다.
 * 어긋났으면 표식 문서를 이전 상태로 되돌리고 초기화를 포기한다(데이터는 아직 손대지 않았다).
 */
async function serverClockAgrees(cycleStart: number, previous: DocumentData | null): Promise<boolean> {
  const ref = resetDocRef();
  const snap = await getDoc(ref);
  const stamp = snap.get('updatedAt') as { toMillis?: () => number } | null | undefined;
  const serverMs = typeof stamp?.toMillis === 'function' ? stamp.toMillis() : null;
  if (serverMs === null) return true; // 서버 시각을 못 읽으면 판정을 보류한다(초기화는 멱등).
  if (cycleStartOf(serverMs) === cycleStart) return true;

  console.warn('[demo reset] 브라우저 시계가 서버와 어긋나 초기화를 취소합니다.');
  if (previous) await setDoc(ref, previous);
  else await deleteDoc(ref);
  return false;
}

/** 18개 state 문서를 스냅샷 값으로 원자적으로 교체한다(merge 없음 = 전량 대체). */
async function restoreSeed(): Promise<number> {
  const { DEMO_SEED } = await import('./demoSeed');
  const batch = writeBatch(firestoreDb!);
  let count = 0;

  for (const [key, value] of Object.entries(DEMO_SEED)) {
    const ref = stateDocRef(key);
    if (value === null) {
      // 원본에 문서가 없던 키 — 존재 자체를 되돌린다.
      batch.delete(ref);
    } else {
      // merge 를 쓰지 않는다. merge:true 는 맵 필드를 재귀 병합하므로
      // checkIn/churchConfirm 같은 맵 값을 {} 로 되돌려도 옛 키가 살아남는다.
      batch.set(ref, { value, version: 1, updatedAt: serverTimestamp() });
    }
    count += 1;
  }

  await batch.commit();
  return count;
}

let started = false;

/**
 * 데모 초기화 진입점. 어떤 이유로도 예외를 밖으로 던지지 않는다 —
 * 초기화가 실패해도 앱은 정상 동작해야 한다.
 */
export async function maybeRunDailyDemoReset(): Promise<void> {
  if (!DEMO_MODE) return;
  if (!firestoreDb) return;
  if (started) return;
  started = true;

  const nowMs = Date.now();
  const cycleStart = cycleStartOf(nowMs);

  // 로컬 뒷정리는 클라우드 상태와 무관하게 먼저(동기적으로) 끝낸다.
  purgeLocalRemnants(cycleStart);

  try {
    const claim = await claimCycle(cycleStart, nowMs);
    if (!claim.claimed) return;

    if (!(await serverClockAgrees(cycleStart, claim.previous))) return;

    const count = await restoreSeed();

    await setDoc(resetDocRef(), {
      value: { cycleStart, claimedAt: nowMs, completedAt: Date.now() },
      version: 1,
      updatedAt: serverTimestamp(),
    });
    console.info(`[demo reset] ${count}개 문서를 데모 기준 상태로 되돌렸습니다.`);
  } catch (error) {
    console.warn('[demo reset] 초기화 실패 — 앱은 계속 진행합니다.', error);
  }
}
