import { useEffect, useState } from 'react';
import { Bus, Wand2, AlertTriangle, UserCheck } from 'lucide-react';
import { churches } from '../data/mockData';
import type { Participant } from '../types';
import { saveParticipants } from '../utils/participantStorage';
import { useParticipants } from '../hooks/useSharedData';
import { GROUP_CONFIG, isStudent } from '../utils/groupAssignment';
import {
  VEHICLE_CONFIG, VEHICLE_IDS, INDIVIDUAL_ID,
  getParticipantRole,
} from '../utils/vehicleAssignment';
import VehicleAssignModal from '../components/VehicleAssignModal';

const ROLE_COLOR: Record<string, string> = {
  '학생': '#64748b', '교사': '#8b5cf6', '학부모': '#f59e0b', '운영진': '#10b981',
};

const ASSIGNMENT_OPTIONS = [
  { value: '', label: '미배정' },
  ...VEHICLE_CONFIG.map(vehicle => ({ value: vehicle.id, label: vehicle.label })),
  { value: INDIVIDUAL_ID, label: INDIVIDUAL_ID },
];

function getAssignmentValue(p: Participant): string {
  if (p.busId === INDIVIDUAL_ID) return INDIVIDUAL_ID;
  if (p.busId && VEHICLE_IDS.includes(p.busId)) return p.busId;
  return '';
}

function AssignmentSelect({
  participant,
  onChange,
}: {
  participant: Participant;
  onChange: (participantId: string, nextBusId: string) => void;
}) {
  return (
    <select
      value={getAssignmentValue(participant)}
      onChange={e => onChange(participant.id, e.target.value)}
      className="h-7 rounded-lg px-2 text-[11px] font-semibold bg-slate-950/80 text-slate-100 border border-white/10 outline-none focus:border-cyan-400/70"
      title={`${participant.name} 차량 수동 배정`}
    >
      {ASSIGNMENT_OPTIONS.map(option => (
        <option key={option.value || 'unassigned'} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function getVehicleStatus(count: number, capacity: number) {
  if (count > capacity)   return { label: '초과',     color: '#ef4444' };
  if (count === capacity) return { label: '배정완료',  color: '#10b981' };
  if (count > 0)          return { label: '여유 있음', color: '#3B82F6' };
  return                          { label: '미배정',   color: '#475569' };
}

export default function Vehicles() {
  const sharedParticipants = useParticipants();
  const [participantList, setParticipantList] = useState<Participant[]>(sharedParticipants);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setParticipantList(sharedParticipants), 0);
    return () => window.clearTimeout(timer);
  }, [sharedParticipants]);

  const churchMap: Record<string, string> = Object.fromEntries(churches.map(c => [c.id, c.name]));
  const groupNameMap: Record<string, string> = Object.fromEntries(GROUP_CONFIG.map(g => [g.id, g.name]));

  // ─ 차량별 탑승자 (participant.busId 기준) ─
  const vehicleMemberMap: Record<string, Participant[]> = {};
  VEHICLE_IDS.forEach(vid => { vehicleMemberMap[vid] = []; });
  participantList.forEach(p => {
    if (p.busId && vehicleMemberMap[p.busId]) vehicleMemberMap[p.busId].push(p);
  });

  const individualList  = participantList.filter(p => p.busId === INDIVIDUAL_ID);
  const assignedList    = participantList.filter(p => p.busId && VEHICLE_IDS.includes(p.busId));
  const unassignedList  = participantList.filter(p => p.busId !== INDIVIDUAL_ID && (!p.busId || !VEHICLE_IDS.includes(p.busId)));

  const remainingSeats = VEHICLE_CONFIG.reduce(
    (s, v) => s + Math.max(0, v.capacity - (vehicleMemberMap[v.id]?.length ?? 0)),
    0,
  );

  function handleApply(updated: Participant[]) {
    setParticipantList(updated);
    saveParticipants(updated);
    setShowModal(false);
  }

  function handleManualAssign(participantId: string, nextBusId: string) {
    const target = participantList.find(p => p.id === participantId);
    if (!target) return;
    if (getAssignmentValue(target) === nextBusId) return;

    const targetVehicle = VEHICLE_CONFIG.find(vehicle => vehicle.id === nextBusId);
    if (targetVehicle) {
      const currentCount = participantList.filter(
        p => p.id !== participantId && p.busId === targetVehicle.id,
      ).length;
      if (currentCount >= targetVehicle.capacity) {
        const ok = window.confirm(
          `${targetVehicle.label} 정원 ${targetVehicle.capacity}석을 초과합니다. 그래도 배정할까요?`,
        );
        if (!ok) return;
      }
    }

    const updated = participantList.map(p =>
      p.id === participantId
        ? { ...p, busId: nextBusId || undefined }
        : p,
    );
    setParticipantList(updated);
    saveParticipants(updated);
  }

  return (
    <div className="space-y-5">

      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1B3A5C]">차량 배정</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            총 {VEHICLE_CONFIG.length}대 · 수용 {VEHICLE_CONFIG.reduce((s, v) => s + v.capacity, 0)}명
          </p>
          <p className="text-xs text-slate-500 mt-1">
            참가자 줄의 선택 박스로 차량을 직접 변경할 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#1B3A5C] transition-all active:scale-95 flex-shrink-0"
          style={{ background: 'linear-gradient(90deg, #1B3A5C, #93C5FD)', boxShadow: '0 4px 16px rgba(37, 99, 235,0.25)' }}
        >
          <Wand2 size={15} />
          자동 차량 배정
        </button>
      </div>

      {/* 요약 통계 7칸 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: '전체 인원',   value: participantList.length,                                              color: '#64748b' },
          { label: '배정 완료',   value: assignedList.length,                                                 color: '#10b981' },
          { label: '미배정',      value: unassignedList.length,  color: unassignedList.length  > 0 ? '#f59e0b' : '#64748b' },
          { label: '개별이동',    value: individualList.length,  color: individualList.length  > 0 ? '#3B82F6' : '#64748b' },
          { label: '1호차',       value: vehicleMemberMap['1호차']?.length ?? 0,                              color: '#3B82F6' },
          { label: '2호차',       value: vehicleMemberMap['2호차']?.length ?? 0,                              color: '#3b82f6' },
          { label: '잔여 좌석',   value: remainingSeats,                                                      color: '#8b5cf6' },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-xl p-3 text-center"
            style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}
          >
            <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 미배정 경고 */}
      {unassignedList.length > 0 && (
        <div
          className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.22)' }}
        >
          <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300 leading-relaxed">
            차량 미배정 인원 <span className="font-semibold">{unassignedList.length}명</span>이 있습니다.
            &nbsp;'자동 차량 배정'을 실행하거나 각 참가자의 차량을 직접 지정해 주세요.
          </p>
        </div>
      )}

      {/* 차량 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {VEHICLE_CONFIG.map(vehicle => {
          const members  = vehicleMemberMap[vehicle.id] ?? [];
          const color    = vehicle.color;
          const fillRate = Math.min(100, Math.round((members.length / vehicle.capacity) * 100));
          const status   = getVehicleStatus(members.length, vehicle.capacity);

          // 역할별 집계
          const roleCounts: Record<string, number> = {};
          members.forEach(p => {
            const r = getParticipantRole(p);
            roleCounts[r] = (roleCounts[r] ?? 0) + 1;
          });

          // 교회별 집계
          const churchCounts: Record<string, number> = {};
          members.forEach(p => {
            const cName = churchMap[p.church] ?? p.church;
            churchCounts[cName] = (churchCounts[cName] ?? 0) + 1;
          });

          // 조별 집계 (학생만)
          const groupCounts: Record<string, number> = {};
          members.filter(isStudent).forEach(p => {
            if (p.groupId) {
              const gShort = (groupNameMap[p.groupId] ?? p.groupId).split(' ')[0];
              groupCounts[gShort] = (groupCounts[gShort] ?? 0) + 1;
            }
          });

          return (
            <div
              key={vehicle.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}25` }}
            >
              {/* 카드 헤더 */}
              <div
                className="px-5 py-4"
                style={{ background: `${color}12`, borderBottom: `1px solid ${color}20` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}25`, border: `1px solid ${color}40` }}
                    >
                      <Bus size={18} style={{ color }} />
                    </div>
                    <div>
                      <div className="font-bold text-[#1B3A5C] text-base">{vehicle.label}</div>
                      <div className="text-xs text-slate-400">최대 {vehicle.capacity}명</div>
                    </div>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: `${status.color}20`, color: status.color }}
                  >
                    {status.label}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* 충원율 */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-bold text-[#1B3A5C]">
                      {members.length}명
                      <span className="text-xs font-normal text-slate-500 ml-1">/ {vehicle.capacity}석</span>
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: fillRate >= 100 ? '#ef4444' : fillRate >= 80 ? '#f59e0b' : '#10b981' }}
                    >
                      {fillRate}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${fillRate}%`,
                        background: fillRate >= 100 ? '#ef4444' : fillRate >= 80 ? '#f59e0b' : color,
                      }}
                    />
                  </div>
                </div>

                {/* 역할 구성 */}
                {Object.keys(roleCounts).length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1.5">역할 구성</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(roleCounts).map(([role, cnt]) => (
                        <span
                          key={role}
                          className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: `${ROLE_COLOR[role] ?? '#64748b'}18`, color: ROLE_COLOR[role] ?? '#94a3b8' }}
                        >
                          {role} {cnt}명
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 교회 + 조 분포 */}
                <div className="flex flex-col gap-2">
                  {Object.keys(churchCounts).length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1.5">교회 구성</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(churchCounts)
                          .sort((a, b) => b[1] - a[1])
                          .map(([cName, cnt]) => (
                            <span
                              key={cName}
                              className="text-[10px] px-1.5 py-0.5 rounded-md"
                              style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}
                            >
                              {cName} {cnt}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                  {Object.keys(groupCounts).length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1.5">조 구성</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(groupCounts)
                          .sort((a, b) => b[1] - a[1])
                          .map(([gShort, cnt]) => (
                            <span
                              key={gShort}
                              className="text-[10px] px-1.5 py-0.5 rounded-md"
                              style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}
                            >
                              {gShort} {cnt}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 탑승자 목록 */}
                <div>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1.5">탑승자 목록</p>
                  {members.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-3">배정된 인원이 없습니다</p>
                  ) : (
                    <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                      {members.map(member => {
                        const role  = getParticipantRole(member);
                        const rColor = ROLE_COLOR[role] ?? '#64748b';
                        return (
                          <div
                            key={member.id}
                            className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                              style={{
                                background: member.gender === 'M' ? 'rgba(59,130,246,0.2)' : 'rgba(236,72,153,0.2)',
                                color: member.gender === 'M' ? '#60a5fa' : '#f472b6',
                              }}
                            >
                              {member.name.charAt(0)}
                            </div>
                            <span className="text-xs text-slate-200 font-medium flex-1 min-w-0 truncate">
                              {member.name}
                            </span>
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-md flex-shrink-0"
                              style={{ background: `${rColor}15`, color: rColor }}
                            >
                              {role === '학생' ? member.grade : role}
                            </span>
                            <span className="text-[10px] text-slate-600 flex-shrink-0 hidden sm:block truncate max-w-16">
                              {churchMap[member.church] ?? member.church}
                            </span>
                            <AssignmentSelect
                              participant={member}
                              onChange={handleManualAssign}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 개별이동 섹션 */}
      {individualList.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(37, 99, 235,0.05)', border: '1px solid rgba(37, 99, 235,0.15)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <UserCheck size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-cyan-300">개별이동 ({individualList.length}명)</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {individualList.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                style={{ background: 'rgba(37, 99, 235,0.1)', border: '1px solid rgba(37, 99, 235,0.2)' }}
              >
                <span className="text-xs font-medium text-[#1B3A5C]">{p.name}</span>
                <span className="text-[10px] text-slate-400">
                  {getParticipantRole(p) === '학생' ? p.grade : getParticipantRole(p)}
                </span>
                <AssignmentSelect
                  participant={p}
                  onChange={handleManualAssign}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 미배정 섹션 */}
      {unassignedList.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold text-amber-300">미배정 ({unassignedList.length}명)</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassignedList.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <span className="text-xs font-medium text-amber-100">{p.name}</span>
                <span className="text-[10px] text-amber-400">
                  {getParticipantRole(p) === '학생' ? p.grade : getParticipantRole(p)}
                </span>
                <AssignmentSelect
                  participant={p}
                  onChange={handleManualAssign}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 자동 차량 배정 모달 */}
      {showModal && (
        <VehicleAssignModal
          participants={participantList}
          churchMap={churchMap}
          onApply={handleApply}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
