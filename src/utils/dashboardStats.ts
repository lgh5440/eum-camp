import type { Participant } from '../types';
import { isStudent, GROUP_CONFIG } from './groupAssignment';
import { VALID_ROOM_IDS } from './roomAssignment';
import { VEHICLE_IDS, VEHICLE_CONFIG, INDIVIDUAL_ID } from './vehicleAssignment';
import type { CheckInMap } from './checkInStorage';

export interface DashboardStats {
  total: number;
  studentCount: number;
  staffCount: number;
  churchCount: number;

  groupAssigned: number;
  groupTotal: number;
  groupPct: number;

  roomAssigned: number;
  roomTotal: number;
  roomPct: number;

  vehicleAssigned: number;
  vehicleTotal: number;
  vehiclePct: number;

  feePaid: number;
  feeTotal: number;
  feePct: number;

  allergyCount: number;
  unpaidFeeCount: number;

  unassignedGroup: number;
  unassignedRoom: number;
  unassignedVehicle: number;
}

// ── 체크인 통계 ───────────────────────────────────────────────────────────────────

export interface VehicleCheckInStat {
  label: string;
  total: number;
  checked: number;
  pct: number;
}

export interface CheckInStats {
  total: number;
  checked: number;
  pending: number;
  pct: number;
  stuTotal: number;
  stuChecked: number;
  staffTotal: number;
  staffChecked: number;
  vehicleBreakdown: VehicleCheckInStat[];
}

export function computeCheckInStats(
  participants: Participant[],
  checkInMap: CheckInMap,
): CheckInStats {
  const active       = participants.filter(p => p.status !== 'cancelled');
  const checked      = active.filter(p => !!checkInMap[p.id]?.checkedIn).length;
  const stuTotal     = active.filter(isStudent).length;
  const stuChecked   = active.filter(p => isStudent(p) && !!checkInMap[p.id]?.checkedIn).length;
  const staffTotal   = active.filter(p => !isStudent(p)).length;
  const staffChecked = active.filter(p => !isStudent(p) && !!checkInMap[p.id]?.checkedIn).length;

  const raw: Omit<VehicleCheckInStat, 'pct'>[] = [
    ...VEHICLE_CONFIG.map(v => ({
      label:   v.id as string,
      total:   active.filter(p => p.busId === v.id).length,
      checked: active.filter(p => p.busId === v.id && !!checkInMap[p.id]?.checkedIn).length,
    })),
    {
      label:   INDIVIDUAL_ID,
      total:   active.filter(p => p.busId === INDIVIDUAL_ID).length,
      checked: active.filter(p => p.busId === INDIVIDUAL_ID && !!checkInMap[p.id]?.checkedIn).length,
    },
    {
      label:   '미배정',
      total:   active.filter(p => !p.busId).length,
      checked: active.filter(p => !p.busId && !!checkInMap[p.id]?.checkedIn).length,
    },
  ];

  const vehicleBreakdown = raw
    .filter(v => v.total > 0)
    .map(v => ({ ...v, pct: Math.round((v.checked / v.total) * 100) }));

  return {
    total: active.length,
    checked,
    pending: active.length - checked,
    pct: active.length > 0 ? Math.round((checked / active.length) * 100) : 0,
    stuTotal, stuChecked,
    staffTotal, staffChecked,
    vehicleBreakdown,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────

export function computeStats(
  participants: Participant[],
  validRoomIdsOverride?: Set<string>,
  validGroupIdsOverride?: Set<string>,
): DashboardStats {
  const gids    = validGroupIdsOverride ?? new Set(GROUP_CONFIG.map(g => g.id) as string[]);
  const active   = participants.filter(p => p.status !== 'cancelled');
  const students = active.filter(isStudent);

  const staffCount  = active.filter(p => !isStudent(p)).length;
  const churchCount = new Set(active.map(p => p.church)).size;

  const groupAssigned = students.filter(p => p.groupId && gids.has(p.groupId)).length;
  const groupTotal    = students.length;

  const roomIds      = validRoomIdsOverride ?? VALID_ROOM_IDS;
  const roomAssigned = students.filter(p => p.roomId && roomIds.has(p.roomId)).length;
  const roomTotal    = students.length;

  const vehicleAssigned = active.filter(
    p => p.busId && (VEHICLE_IDS.includes(p.busId) || p.busId === INDIVIDUAL_ID)
  ).length;
  const vehicleTotal = active.length;

  const feePaid  = active.filter(p => p.fee === 'paid').length;
  const feeTotal = active.length;

  const allergyCount   = students.filter(p => p.dietType === 'allergy').length;
  const unpaidFeeCount = active.filter(p => p.fee === 'unpaid').length;

  return {
    total: active.length,
    studentCount: students.length,
    staffCount,
    churchCount,

    groupAssigned,
    groupTotal,
    groupPct: groupTotal > 0 ? Math.round((groupAssigned / groupTotal) * 100) : 0,

    roomAssigned,
    roomTotal,
    roomPct: roomTotal > 0 ? Math.round((roomAssigned / roomTotal) * 100) : 0,

    vehicleAssigned,
    vehicleTotal,
    vehiclePct: vehicleTotal > 0 ? Math.round((vehicleAssigned / vehicleTotal) * 100) : 0,

    feePaid,
    feeTotal,
    feePct: feeTotal > 0 ? Math.round((feePaid / feeTotal) * 100) : 0,

    allergyCount,
    unpaidFeeCount,

    unassignedGroup:   groupTotal   - groupAssigned,
    unassignedRoom:    roomTotal    - roomAssigned,
    unassignedVehicle: vehicleTotal - vehicleAssigned,
  };
}
