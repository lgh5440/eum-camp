// 데모 초기화 주기 계산 — 순수 함수만 둔다(firebase 의존 없음 = 테스트 가능).
//
// "매일 새벽 4시(KST)" 경계를 UTC epoch 산술만으로 구한다.
// toLocaleString('ko-KR', { timeZone }) 파싱 방식은 브라우저별 출력 포맷 편차가 있어 쓰지 않는다.
// Date.now() 는 타임존과 무관한 UTC epoch 이므로, 아래 계산은 접속자의 브라우저
// 타임존이 무엇이든 동일한 경계를 만든다(시계가 맞다는 전제는 별도로 서버시각으로 검증한다).

export const DAY_MS = 24 * 60 * 60 * 1000;
export const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
export const RESET_HOUR_KST = 4;

/** 클레임만 남기고 중단된 초기화를 다른 접속자가 이어받기까지의 유예. */
export const STALE_CLAIM_MS = 3 * 60 * 1000;

/**
 * 주어진 시각이 속한 "데모 주기"의 시작 시각(UTC epoch ms).
 * 같은 주기에 속한 모든 시각은 같은 값을 돌려준다 → 초기화 1회 판정의 기준이 된다.
 */
export function cycleStartOf(nowMs: number): number {
  // 04:00 KST 가 00:00 이 되도록 옮긴 뒤 날짜 단위로 내림하고, 다시 원래 축으로 되돌린다.
  const shifted = nowMs + KST_OFFSET_MS - RESET_HOUR_KST * 60 * 60 * 1000;
  return Math.floor(shifted / DAY_MS) * DAY_MS + RESET_HOUR_KST * 60 * 60 * 1000 - KST_OFFSET_MS;
}

export interface DemoResetMark {
  cycleStart?: number;
  claimedAt?: number;
  completedAt?: number | null;
}

export type ClaimDecision = 'claim' | 'skip';

/**
 * 저장된 초기화 표식과 현재 시각을 보고 이번 접속자가 초기화를 시도해야 하는지 판정한다.
 * - 저장값이 이번 주기보다 앞서 있으면(다른 접속자의 시계가 빠른 경우 포함) 건드리지 않는다.
 * - 같은 주기가 이미 완료됐으면 건너뛴다.
 * - 같은 주기를 누가 잡아둔 지 STALE_CLAIM_MS 가 지나지 않았으면 진행 중으로 보고 건너뛴다.
 */
export function decideClaim(mark: DemoResetMark | null, nowMs: number): ClaimDecision {
  const cycleStart = cycleStartOf(nowMs);
  const storedCycle = typeof mark?.cycleStart === 'number' ? mark.cycleStart : 0;

  if (storedCycle > cycleStart) return 'skip';
  if (storedCycle === cycleStart) {
    if (mark?.completedAt) return 'skip';
    const claimedAt = typeof mark?.claimedAt === 'number' ? mark.claimedAt : 0;
    if (nowMs - claimedAt < STALE_CLAIM_MS) return 'skip';
  }
  return 'claim';
}
