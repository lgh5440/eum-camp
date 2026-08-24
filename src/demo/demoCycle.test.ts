import { describe, expect, it } from 'vitest';
import { cycleStartOf, decideClaim, ABANDONED_CLAIM_MS, DAY_MS, STALE_CLAIM_MS } from './demoCycle';

/** KST 벽시계 문자열을 UTC epoch 로 바꾼다. */
function kst(iso: string): number {
  return Date.parse(`${iso}+09:00`);
}

describe('cycleStartOf', () => {
  it('04:00 KST 를 주기 시작으로 삼는다', () => {
    expect(cycleStartOf(kst('2026-08-24T04:00:00'))).toBe(kst('2026-08-24T04:00:00'));
  });

  it('04:00 직전은 전날 주기에 속한다', () => {
    expect(cycleStartOf(kst('2026-08-24T03:59:59'))).toBe(kst('2026-08-23T04:00:00'));
  });

  it('04:00 직후는 당일 주기에 속한다', () => {
    expect(cycleStartOf(kst('2026-08-24T04:00:01'))).toBe(kst('2026-08-24T04:00:00'));
  });

  it('같은 주기 안의 모든 시각은 같은 값을 준다', () => {
    const a = cycleStartOf(kst('2026-08-24T04:00:00'));
    const b = cycleStartOf(kst('2026-08-24T13:30:00'));
    const c = cycleStartOf(kst('2026-08-25T03:59:59'));
    expect(b).toBe(a);
    expect(c).toBe(a);
  });

  it('하루가 지나면 정확히 24시간 뒤 주기가 된다', () => {
    const a = cycleStartOf(kst('2026-08-24T10:00:00'));
    const b = cycleStartOf(kst('2026-08-25T10:00:00'));
    expect(b - a).toBe(DAY_MS);
  });

  it('접속자 타임존과 무관하다 — 같은 순간이면 같은 주기', () => {
    // 같은 순간을 UTC 로 표현해도 결과가 같아야 한다.
    const moment = Date.parse('2026-08-23T20:00:00Z'); // = 2026-08-24 05:00 KST
    expect(cycleStartOf(moment)).toBe(kst('2026-08-24T04:00:00'));
  });
});

describe('decideClaim', () => {
  const now = kst('2026-08-24T10:00:00');
  const today = cycleStartOf(now);
  const yesterday = today - DAY_MS;

  it('표식이 없으면 초기화를 시도한다', () => {
    expect(decideClaim(null, now)).toBe('claim');
  });

  it('지난 주기 표식만 있으면 초기화를 시도한다', () => {
    expect(decideClaim({ cycleStart: yesterday, completedAt: yesterday + 1000 }, now)).toBe('claim');
  });

  it('이번 주기가 이미 완료됐으면 건너뛴다', () => {
    expect(decideClaim({ cycleStart: today, claimedAt: now - 5000, completedAt: now - 4000 }, now))
      .toBe('skip');
  });

  it('이번 주기를 방금 다른 접속자가 잡았으면 건너뛴다', () => {
    expect(decideClaim({ cycleStart: today, claimedAt: now - 1000, completedAt: null }, now))
      .toBe('skip');
  });

  it('클레임만 남고 중단된 지 오래면 이어받는다', () => {
    expect(
      decideClaim({ cycleStart: today, claimedAt: now - STALE_CLAIM_MS - 1, completedAt: null }, now),
    ).toBe('claim');
  });

  it('저장된 주기가 미래면(다른 접속자 시계가 빠름) 건드리지 않는다', () => {
    expect(decideClaim({ cycleStart: today + DAY_MS, completedAt: null }, now)).toBe('skip');
  });

  // ── 이어받기 창의 위쪽 끝 — "강의 중 데이터 손실" 방지 ──────────────────────
  //
  // 완료 표시(setDoc)만 실패한 표식은 "데이터 교체 전 중단"과 구별되지 않는다.
  // 몇 시간 묵은 표식을 이어받으면 새벽 4시 이후 입력된 내용을 전부 날린다.

  it('미완료 표식이 ABANDONED 임계를 넘으면 이어받지 않는다', () => {
    expect(
      decideClaim(
        { cycleStart: today, claimedAt: now - ABANDONED_CLAIM_MS, completedAt: null },
        now,
      ),
    ).toBe('skip');
  });

  it('새벽 4시 클레임을 강의 중(09:00) 접속자가 이어받지 않는다', () => {
    // 04:00:05 에 선점 → restoreSeed 는 끝났지만 완료 표시만 실패한 상태.
    const claimedAt = kst('2026-08-24T04:00:05');
    const duringLecture = kst('2026-08-24T09:00:00');
    expect(cycleStartOf(duringLecture)).toBe(cycleStartOf(claimedAt)); // 같은 주기임을 확인
    expect(decideClaim({ cycleStart: today, claimedAt, completedAt: null }, duringLecture))
      .toBe('skip');
  });

  it('이어받기 창 안(STALE~ABANDONED)에서는 여전히 이어받는다', () => {
    const claimedAt = now - (STALE_CLAIM_MS + ABANDONED_CLAIM_MS) / 2;
    expect(decideClaim({ cycleStart: today, claimedAt, completedAt: null }, now)).toBe('claim');
  });

  it('임계 직전은 이어받고, 임계에 닿으면 포기한다', () => {
    expect(
      decideClaim(
        { cycleStart: today, claimedAt: now - ABANDONED_CLAIM_MS + 1, completedAt: null },
        now,
      ),
    ).toBe('claim');
    expect(
      decideClaim(
        { cycleStart: today, claimedAt: now - ABANDONED_CLAIM_MS - 1, completedAt: null },
        now,
      ),
    ).toBe('skip');
  });

  it('묵은 표식을 포기해도 다음 주기에는 정상 초기화된다', () => {
    // 오늘 주기를 포기한 표식이 그대로 남아 있어도, 내일 주기에는 저장값이 과거가 되므로 claim.
    const tomorrow = now + DAY_MS;
    expect(
      decideClaim({ cycleStart: today, claimedAt: now - ABANDONED_CLAIM_MS, completedAt: null }, tomorrow),
    ).toBe('claim');
  });
});
