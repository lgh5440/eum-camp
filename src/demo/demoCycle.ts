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
 * 이 시간이 지난 미완료 클레임은 이어받지 않는다(= 이번 주기는 포기한다).
 *
 * 미완료 표식(completedAt 없음)은 두 가지를 똑같이 나타낸다.
 *   (A) 승자가 데이터 교체 전에 끊겼다  → 이어받아야 초기화가 된다.
 *   (B) 승자가 데이터 교체를 끝내고 완료 표시(setDoc)만 실패했다 → 이미 초기화는 됐다.
 * 표식만 봐서는 둘을 구별할 수 없으므로, "얼마나 지났는가"로 갈라야 한다.
 * 갓 중단된 것은 (A)일 가능성이 크지만, 몇 시간 묵은 것은 (B)로 봐야 안전하다 —
 * (B)를 (A)로 오판해 이어받으면 새벽 4시 이후 강의 중에 입력된 내용을 전부 날린다.
 * 초기화를 한 주기 건너뛰는 손해가, 실사용 중 데이터를 지우는 사고보다 훨씬 싸다.
 */
export const ABANDONED_CLAIM_MS = 60 * 60 * 1000;

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
 * - 이어받기는 STALE_CLAIM_MS ~ ABANDONED_CLAIM_MS 사이의 "방금 끊긴" 클레임에만 허용한다.
 *   그보다 오래된 미완료 표식은 초기화가 이미 실행된 것으로 간주하고 이번 주기를 포기한다.
 */
export function decideClaim(mark: DemoResetMark | null, nowMs: number): ClaimDecision {
  const cycleStart = cycleStartOf(nowMs);
  const storedCycle = typeof mark?.cycleStart === 'number' ? mark.cycleStart : 0;

  if (storedCycle > cycleStart) return 'skip';
  if (storedCycle === cycleStart) {
    if (mark?.completedAt) return 'skip';
    const claimedAt = typeof mark?.claimedAt === 'number' ? mark.claimedAt : 0;
    const age = nowMs - claimedAt;
    // 진행 중으로 보이는 동안은 기다린다.
    if (age < STALE_CLAIM_MS) return 'skip';
    // 이어받기 창을 지나 묵어버린 표식은 이어받지 않는다 — 위 ABANDONED_CLAIM_MS 주석 참고.
    if (age >= ABANDONED_CLAIM_MS) return 'skip';
  }
  return 'claim';
}
