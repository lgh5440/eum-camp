import type { Participant } from '../types';
import { isStudent } from './groupAssignment';

// ── 차량 정적 설정 ───────────────────────────────────────────────────────────────
export const VEHICLE_CONFIG = [
  { id: '1호차', label: '1호차', capacity: 45, color: '#3B82F6' },
  { id: '2호차', label: '2호차', capacity: 45, color: '#3b82f6' },
] as const;

export type VehicleConfig = typeof VEHICLE_CONFIG[number];
export const VEHICLE_IDS  = VEHICLE_CONFIG.map(v => v.id) as string[];
export const INDIVIDUAL_ID = '개별이동';

// ── 역할 문자열 추출 (role 필드 우선, grade 폴백) ────────────────────────────────
export function getParticipantRole(p: Participant): string {
  if (p.role) return p.role;
  if (p.grade === '교사' || p.grade === '학부모' || p.grade === '운영진') return p.grade;
  return '학생';
}

// ── 자동 차량 배정 알고리즘 ──────────────────────────────────────────────────────
// mode: 'unassigned' = 미배정 인원만 / 'all' = 전체 재배정
// 반환: 업데이트된 전체 participants 배열 (deep copy)
export function autoAssignVehicles(
  participants: Participant[],
  mode: 'unassigned' | 'all',
): Participant[] {
  // ─ 1. Deep copy ─
  const result = participants.map(p => ({ ...p }));
  const pMap   = new Map(result.map(p => [p.id, p]));

  // ─ 2. 'all' 모드: 유효 차량 배정 초기화 (개별이동 유지) ─
  if (mode === 'all') {
    result.forEach(p => {
      const me = pMap.get(p.id)!;
      if (me.busId && VEHICLE_IDS.includes(me.busId)) me.busId = undefined;
    });
  }

  // ─ 3. 배정 대상: 개별이동 아니고 유효 차량 없는 사람 ─
  const toAssign = result.filter(
    p => p.busId !== INDIVIDUAL_ID && (!p.busId || !VEHICLE_IDS.includes(p.busId)),
  );

  if (toAssign.length === 0) return result;

  // ─ 4. 교사/학부모/운영진 vs 학생 분리 ─
  const staff    = toAssign.filter(p => !isStudent(p));
  const students = toAssign.filter(isStudent);

  // ─ 5. 기존 배정 집계 ─
  const toAssignIds = new Set(toAssign.map(p => p.id));
  const cnt:      Record<string, number>                 = {};
  const churchCnt: Record<string, Record<string, number>> = {};

  VEHICLE_IDS.forEach(vid => { cnt[vid] = 0; churchCnt[vid] = {}; });

  result
    .filter(p => p.busId && VEHICLE_IDS.includes(p.busId) && !toAssignIds.has(p.id))
    .forEach(p => {
      cnt[p.busId!]++;
      churchCnt[p.busId!][p.church] = (churchCnt[p.busId!][p.church] ?? 0) + 1;
    });

  // ─ 6. 교사/운영진 먼저: 라운드로빈으로 균등 배분 ─
  staff.forEach((t, i) => {
    const vid     = VEHICLE_IDS[i % VEHICLE_IDS.length];
    const vehicle = VEHICLE_CONFIG.find(v => v.id === vid)!;
    if (cnt[vid] < vehicle.capacity) {
      pMap.get(t.id)!.busId = vid;
      cnt[vid]++;
      churchCnt[vid][t.church] = (churchCnt[vid][t.church] ?? 0) + 1;
    }
  });

  // ─ 7. 학생: 교회 라운드로빈 + 탐욕 배정 ─
  const byChurch: Record<string, Participant[]> = {};
  students.forEach(p => { (byChurch[p.church] ??= []).push(p); });

  const queues = Object.values(byChurch);
  const ordered: Participant[] = [];
  let more = true;
  while (more) {
    more = false;
    queues.forEach(q => { if (q.length > 0) { ordered.push(q.shift()!); more = true; } });
  }

  ordered.forEach(s => {
    let best: string | null = null;
    let bestScore = Infinity;

    VEHICLE_CONFIG.forEach(vehicle => {
      if (cnt[vehicle.id] >= vehicle.capacity) return;
      // 인원 균등(100) + 교회 집중 억제(5)
      const score = cnt[vehicle.id] * 100 + (churchCnt[vehicle.id][s.church] ?? 0) * 5;
      if (score < bestScore) { bestScore = score; best = vehicle.id; }
    });

    if (best !== null) {
      pMap.get(s.id)!.busId = best;
      cnt[best]++;
      churchCnt[best][s.church] = (churchCnt[best][s.church] ?? 0) + 1;
    }
    // best === null: 모든 차량 정원 초과 → 미배정 유지
  });

  return result;
}
