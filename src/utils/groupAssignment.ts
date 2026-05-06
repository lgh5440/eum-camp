import type { Participant } from '../types';

// mockData groups(5개)를 확장한 6조 기준 정적 설정
// mockData.ts 원본 미수정 — 이 파일이 권위 기준
export const GROUP_CONFIG = [
  { id: 'g01', name: '1조 빛의 자녀',    color: '#06b6d4', leaderName: '김영수' },
  { id: 'g02', name: '2조 진리의 길',     color: '#3b82f6', leaderName: '이미선' },
  { id: 'g03', name: '3조 생명의 말씀',   color: '#8b5cf6', leaderName: '박준호' },
  { id: 'g04', name: '4조 소망의 별',     color: '#10b981', leaderName: '최지영' },
  { id: 'g05', name: '5조 하나님의 사랑', color: '#f59e0b', leaderName: '정현우' },
  { id: 'g06', name: '6조 은혜의 강',     color: '#ec4899', leaderName: '미배정' },
] as const;

export type GroupConfig = typeof GROUP_CONFIG[number];

// 자동 배정 대상 학생 판별 (교사·학부모·운영진 제외)
// 학생 = 명시된 비학생 역할이 아닌 모든 사람.
// 비학생: 교사, 학부모, 운영진, 찬양팀, 자원봉사, 진행위원
const NON_STUDENT_ROLES = ['교사', '학부모', '운영진', '찬양팀', '자원봉사', '진행위원'];

export function isStudent(p: Participant): boolean {
  if (p.role && NON_STUDENT_ROLES.includes(p.role)) return false;
  if (NON_STUDENT_ROLES.includes(p.grade)) return false;
  return true;
}

// ── 자동 조 배정 알고리즘 ──────────────────────────────────────────────────────
// mode: 'unassigned' = 미배정 학생만 / 'all' = 전체 재배정
// groupIds: 사용자가 추가한 조까지 포함한 활성 조 ID 목록 (생략 시 GROUP_CONFIG 기본값)
// 반환: 업데이트된 전체 participants 배열 (deep copy)
export function autoAssign(
  participants: Participant[],
  mode: 'unassigned' | 'all',
  groupIds?: string[],
): Participant[] {
  const gids = (groupIds && groupIds.length > 0
    ? groupIds
    : GROUP_CONFIG.map(g => g.id)) as string[];

  // ─ 1. 전체 deep copy ─
  const result = participants.map(p => ({ ...p }));
  const map    = new Map(result.map(p => [p.id, p]));

  // ─ 2. 'all' 모드: 모든 학생의 groupId 초기화 ─
  if (mode === 'all') {
    result.filter(isStudent).forEach(s => { map.get(s.id)!.groupId = undefined; });
  }

  // ─ 3. 배정 대상 결정 ─
  const toAssign = result.filter(
    p => isStudent(p) && (!p.groupId || !gids.includes(p.groupId)),
  );

  if (toAssign.length === 0) return result;

  // ─ 4. 기존 배정 현황 집계 ─
  const toAssignIds = new Set(toAssign.map(p => p.id));
  const cnt:     Record<string, number>              = Object.fromEntries(gids.map(id => [id, 0]));
  const church:  Record<string, Record<string, number>> = Object.fromEntries(gids.map(id => [id, {}]));

  result
    .filter(p => isStudent(p) && p.groupId && gids.includes(p.groupId) && !toAssignIds.has(p.id))
    .forEach(p => {
      cnt[p.groupId!]++;
      church[p.groupId!][p.church] = (church[p.groupId!][p.church] ?? 0) + 1;
    });

  // ─ 5. 교회별로 그룹화 + 내부에서 남/여 교번 정렬 ─
  const byChurch: Record<string, Participant[]> = {};
  toAssign.forEach(p => { (byChurch[p.church] ??= []).push(p); });

  Object.values(byChurch).forEach(arr => {
    const M = arr.filter(p => p.gender === 'M');
    const F = arr.filter(p => p.gender === 'F');
    arr.length = 0;
    for (let i = 0; i < Math.max(M.length, F.length); i++) {
      if (M[i]) arr.push(M[i]);
      if (F[i]) arr.push(F[i]);
    }
  });

  // ─ 6. 교회 간 라운드로빈으로 섞기 (교회 쏠림 방지) ─
  const queues  = Object.values(byChurch);
  const shuffled: Participant[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    queues.forEach(q => {
      if (q.length > 0) { shuffled.push(q.shift()!); changed = true; }
    });
  }

  // ─ 7. 탐욕 배정: 인원 최소 → 교회 집중 최소 ─
  shuffled.forEach(s => {
    let best = gids[0], bestScore = Infinity;
    gids.forEach(gid => {
      // 조 전체 인원(가중치 100) + 같은 교회 인원(가중치 10)
      const score = cnt[gid] * 100 + (church[gid][s.church] ?? 0) * 10;
      if (score < bestScore) { bestScore = score; best = gid; }
    });
    map.get(s.id)!.groupId = best;
    cnt[best]++;
    church[best][s.church] = (church[best][s.church] ?? 0) + 1;
  });

  return result;
}
