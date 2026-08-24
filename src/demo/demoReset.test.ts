// 데모 초기화의 ★원자성★ 회귀 테스트.
//
// 지키려는 불변식: "완료 표식(completedAt) 존재 ⇔ 18개 문서 교체 완료".
// 완료 표식이 batch.commit() 뒤 별도 쓰기로 나가면 그 사이 끊겼을 때 모호한 상태가 남고,
// 뒤이은 접속자가 이어받아 실사용 데이터를 덮어쓴다. 그래서 "표식이 같은 배치에 들어 있는가"를
// 구조적으로 못 박아 둔다.
//
// firebase/firestore 를 통째로 대역으로 바꿔 배치에 쌓인 작업을 그대로 들여다본다.

import { beforeEach, describe, expect, it, vi } from 'vitest';

type Ref = { path: string };
type Op = { kind: 'set' | 'delete'; path: string; data?: Record<string, unknown> };

/** 대역이 기록하는 관찰 결과 — 테스트마다 초기화한다. */
const seen = {
  batches: [] as Op[][],
  commits: 0,
  commitShouldFail: false,
  /** 배치 밖에서 나간 쓰기(= 원자성을 깨는 경로). */
  looseWrites: [] as Op[],
  txMark: null as Record<string, unknown> | null,
};

vi.mock('../services/firebase', () => ({
  CLOUD_EVENT_ID: 'test-event',
  firestoreDb: { __fake: true },
}));

vi.mock('../services/cloudStoreImpl', () => ({
  clearPendingCloudWrites: vi.fn(),
}));

vi.mock('./demoConfig', () => ({ DEMO_MODE: true }));

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...segments: string[]) => ({ path: segments.join('/') }) as Ref,
  serverTimestamp: () => 'SERVER_TS',
  getDoc: async () => ({
    // updatedAt 을 못 읽으면 서버시각 판정을 보류한다 → 초기화가 그대로 진행된다.
    get: () => null,
  }),
  runTransaction: async (_db: unknown, fn: (tx: unknown) => Promise<boolean>) =>
    fn({
      get: async () => ({ exists: () => false, data: () => null }),
      set: (_ref: Ref, data: Record<string, unknown>) => {
        seen.txMark = data;
      },
    }),
  setDoc: async (ref: Ref, data: Record<string, unknown>) => {
    seen.looseWrites.push({ kind: 'set', path: ref.path, data });
  },
  deleteDoc: async (ref: Ref) => {
    seen.looseWrites.push({ kind: 'delete', path: ref.path });
  },
  writeBatch: () => {
    const ops: Op[] = [];
    seen.batches.push(ops);
    return {
      set: (ref: Ref, data: Record<string, unknown>) => ops.push({ kind: 'set', path: ref.path, data }),
      delete: (ref: Ref) => ops.push({ kind: 'delete', path: ref.path }),
      commit: async () => {
        seen.commits += 1;
        if (seen.commitShouldFail) throw new Error('network lost');
      },
    };
  },
}));

const RESET_PATH = 'retreats/test-event/state/demoReset';
/** Firestore writeBatch 1회 한계. */
const BATCH_OP_LIMIT = 500;

async function runReset(): Promise<void> {
  vi.resetModules(); // demoReset 의 모듈 수준 `started` 플래그를 매 테스트 초기화한다.
  const { maybeRunDailyDemoReset } = await import('./demoReset');
  await maybeRunDailyDemoReset();
}

describe('maybeRunDailyDemoReset — 완료 표식 원자성', () => {
  beforeEach(() => {
    seen.batches = [];
    seen.commits = 0;
    seen.commitShouldFail = false;
    seen.looseWrites = [];
    seen.txMark = null;
    localStorage.clear();
  });

  it('완료 표식을 데이터 교체와 같은 배치 안에서 쓴다', async () => {
    await runReset();

    expect(seen.batches).toHaveLength(1);
    expect(seen.commits).toBe(1);

    const ops = seen.batches[0];
    const mark = ops.find(op => op.path === RESET_PATH);
    expect(mark, '완료 표식이 배치 안에 없다 — 커밋 뒤 별도 쓰기로 새어 나갔다').toBeDefined();

    const value = mark!.data!.value as { cycleStart: number; completedAt: number };
    expect(typeof value.completedAt).toBe('number');
    expect(value.completedAt).toBeGreaterThan(0);

    // 데이터 문서도 같은 배치에 들어 있어야 한다(= 표식만 따로 도는 배치가 아니다).
    expect(ops.filter(op => op.path !== RESET_PATH).length).toBeGreaterThan(0);
  });

  it('완료 표식이 배치 밖 쓰기로는 절대 나가지 않는다', async () => {
    await runReset();
    expect(seen.looseWrites).toEqual([]);
  });

  it('배치 작업 수가 Firestore 한계(500) 안에 있다', async () => {
    await runReset();
    const ops = seen.batches[0];
    // 18개 state 문서 + 표식 1개 = 19.
    expect(ops).toHaveLength(19);
    expect(ops.length).toBeLessThanOrEqual(BATCH_OP_LIMIT);
  });

  it('커밋이 실패하면 완료 표식도 함께 남지 않는다', async () => {
    seen.commitShouldFail = true;
    await runReset(); // 예외를 밖으로 던지지 않는다.

    expect(seen.commits).toBe(1);
    expect(seen.looseWrites).toEqual([]); // 커밋 실패 뒤 표식을 따로 쓰지 않는다.
    // 선점 표식은 남지만 completedAt 은 비어 있다 → 다음 접속자가 안전하게 이어받는다.
    const claim = seen.txMark!.value as { completedAt: number | null };
    expect(claim.completedAt).toBeNull();
  });

  it('선점 표식(completedAt=null)과 완료 표식의 주기·클레임 시각이 이어진다', async () => {
    await runReset();
    const claim = seen.txMark!.value as { cycleStart: number; claimedAt: number };
    const done = seen.batches[0].find(op => op.path === RESET_PATH)!.data!.value as {
      cycleStart: number;
      claimedAt: number;
    };
    expect(done.cycleStart).toBe(claim.cycleStart);
    expect(done.claimedAt).toBe(claim.claimedAt);
  });
});
