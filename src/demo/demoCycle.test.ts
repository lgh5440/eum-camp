import { describe, expect, it } from 'vitest';
import { cycleStartOf, decideClaim, DAY_MS, STALE_CLAIM_MS } from './demoCycle';

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

  // ── 완료 표식은 절대적 정지 신호 ────────────────────────────────────────────
  //
  // 완료 표식은 18개 문서 교체와 같은 writeBatch 로 쓰인다(demoReset.ts restoreSeed).
  // 따라서 "completedAt 존재 ⇔ 데이터 교체 완료" 이고, 있으면 무조건 재실행하지 않는다.
  // 재실행하면 새벽 4시 이후 실사용 중 입력된 내용을 전부 날린다.

  it('완료 표식이 있으면 얼마가 지났든 절대 재실행하지 않는다', () => {
    const claimedAt = kst('2026-08-24T04:00:05');
    const completedAt = kst('2026-08-24T04:00:09');
    for (const at of [
      kst('2026-08-24T04:01:00'), // 직후
      kst('2026-08-24T09:00:00'), // 강의 중
      kst('2026-08-24T23:59:59'), // 같은 주기 끝
      kst('2026-08-25T03:59:59'), // 주기 경계 직전
    ]) {
      expect(cycleStartOf(at)).toBe(today); // 같은 주기임을 확인
      expect(decideClaim({ cycleStart: today, claimedAt, completedAt }, at)).toBe('skip');
    }
  });

  it('완료 표식이 있으면 클레임이 아무리 묵어도 건너뛴다', () => {
    // 클레임 경과 시간은 판정에 아무 영향을 주지 않는다 — 완료 표식만 본다.
    expect(
      decideClaim(
        { cycleStart: today, claimedAt: today, completedAt: today + 1000 },
        now,
      ),
    ).toBe('skip');
  });

  // ── 미완료 표식 = 교체가 일어나지 않았음이 확정 → 언제든 안전하게 이어받는다 ──

  it('중단된 클레임은 몇 시간이 지나도 이어받는다', () => {
    // 04:00:05 에 선점하고 데이터 교체 전에 끊긴 상태. 표식이 없으므로 교체는 확실히 안 됐다.
    const claimedAt = kst('2026-08-24T04:00:05');
    const later = kst('2026-08-24T09:00:00');
    expect(cycleStartOf(later)).toBe(cycleStartOf(claimedAt)); // 같은 주기임을 확인
    expect(decideClaim({ cycleStart: today, claimedAt, completedAt: null }, later)).toBe('claim');
  });

  it('STALE 경계 — 직전은 기다리고 직후는 이어받는다', () => {
    expect(
      decideClaim(
        { cycleStart: today, claimedAt: now - STALE_CLAIM_MS + 1, completedAt: null },
        now,
      ),
    ).toBe('skip');
    expect(
      decideClaim({ cycleStart: today, claimedAt: now - STALE_CLAIM_MS, completedAt: null }, now),
    ).toBe('claim');
  });

  it('completedAt 이 0/undefined 여도 완료로 오인하지 않는다', () => {
    expect(decideClaim({ cycleStart: today, claimedAt: today }, now)).toBe('claim');
    expect(decideClaim({ cycleStart: today, claimedAt: today, completedAt: 0 }, now)).toBe('claim');
  });

  it('중단된 표식이 남아 있어도 다음 주기에는 정상 초기화된다', () => {
    const tomorrow = now + DAY_MS;
    expect(
      decideClaim({ cycleStart: today, claimedAt: now, completedAt: null }, tomorrow),
    ).toBe('claim');
  });
});
