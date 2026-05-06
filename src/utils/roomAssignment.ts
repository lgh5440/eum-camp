import type { Participant, Room } from '../types';
import { rooms as mockRooms } from '../data/mockData';
import { isStudent } from './groupAssignment';

// 학생 배정 가능 방 (스탭 방 제외) — mockData 기반 정적 설정
export const STUDENT_ROOMS = mockRooms.filter(r => r.type !== 'staff');
export const MALE_ROOMS    = STUDENT_ROOMS.filter(r => r.type === 'male');
export const FEMALE_ROOMS  = STUDENT_ROOMS.filter(r => r.type === 'female');
export const VALID_ROOM_IDS = new Set(STUDENT_ROOMS.map(r => r.id));

// ── 자동 방 배정 알고리즘 ───────────────────────────────────────────────────────
// mode: 'unassigned' = 미배정 학생만 / 'all' = 전체 재배정
// 반환: 업데이트된 전체 participants 배열 (deep copy)
export function autoAssignRooms(
  participants: Participant[],
  mode: 'unassigned' | 'all',
  rooms: Room[] = STUDENT_ROOMS,
): Participant[] {
  const studentRooms = rooms.filter(r => r.type !== 'staff');
  const maleRooms = studentRooms.filter(r => r.type === 'male');
  const femaleRooms = studentRooms.filter(r => r.type === 'female');
  const validRoomIds = new Set(studentRooms.map(r => r.id));

  // ─ 1. Deep copy ─
  const result = participants.map(p => ({ ...p }));
  const pMap   = new Map(result.map(p => [p.id, p]));

  // ─ 2. 'all' 모드: 학생의 유효 방 배정 초기화 ─
  if (mode === 'all') {
    result.filter(isStudent).forEach(s => {
      const p = pMap.get(s.id)!;
      if (p.roomId && validRoomIds.has(p.roomId)) p.roomId = undefined;
    });
  }

  // ─ 3. 배정 대상: 유효 방 없는 학생 ─
  const toAssign = result.filter(
    p => isStudent(p) && (!p.roomId || !validRoomIds.has(p.roomId)),
  );

  if (toAssign.length === 0) return result;

  // ─ 4. 성별 분리 ─
  const maleStudents   = toAssign.filter(p => p.gender === 'M');
  const femaleStudents = toAssign.filter(p => p.gender === 'F');

  // ─ 5. 기존 배정 집계 ─
  const toAssignIds = new Set(toAssign.map(p => p.id));
  const cnt:       Record<string, number>                 = {};
  const churchCnt: Record<string, Record<string, number>> = {};
  const groupCnt:  Record<string, Record<string, number>> = {};

  studentRooms.forEach(r => {
    cnt[r.id]       = 0;
    churchCnt[r.id] = {};
    groupCnt[r.id]  = {};
  });

  result
    .filter(p => isStudent(p) && p.roomId && validRoomIds.has(p.roomId) && !toAssignIds.has(p.id))
    .forEach(p => {
      cnt[p.roomId!]++;
      churchCnt[p.roomId!][p.church]   = (churchCnt[p.roomId!][p.church]   ?? 0) + 1;
      if (p.groupId) groupCnt[p.roomId!][p.groupId] = (groupCnt[p.roomId!][p.groupId] ?? 0) + 1;
    });

  // ─ 6. 탐욕 배정 (공유 카운터 클로저) ─
  function greedyAssign(
    students: Participant[],
    roomList: Room[],
  ) {
    // 교회 라운드로빈으로 배정 순서 결정
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

      roomList.forEach(room => {
        if (cnt[room.id] >= room.capacity) return; // 정원 초과 방 스킵
        // 인원 균등(100) + 교회 집중 억제(10) + 조 분산(5)
        const score =
          cnt[room.id] * 100
          + (churchCnt[room.id][s.church]  ?? 0) * 10
          + (s.groupId ? (groupCnt[room.id][s.groupId] ?? 0) * 5 : 0);
        if (score < bestScore) { bestScore = score; best = room.id; }
      });

      if (best !== null) {
        pMap.get(s.id)!.roomId = best;
        cnt[best]++;
        churchCnt[best][s.church] = (churchCnt[best][s.church] ?? 0) + 1;
        if (s.groupId) groupCnt[best][s.groupId] = (groupCnt[best][s.groupId] ?? 0) + 1;
      }
      // best === null: 모든 방 정원 초과 → 미배정 유지
    });
  }

  greedyAssign(maleStudents,   maleRooms);
  greedyAssign(femaleStudents, femaleRooms);

  return result;
}
