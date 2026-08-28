import { useMemo, useState, useEffect } from 'react';
import { X, Bus, AlertTriangle, Users } from 'lucide-react';
import type { Participant } from '../types';
import { GROUP_CONFIG } from '../utils/groupAssignment';
import {
  VEHICLE_CONFIG, VEHICLE_IDS, INDIVIDUAL_ID,
  autoAssignVehicles, getParticipantRole,
} from '../utils/vehicleAssignment';

interface Props {
  participants: Participant[];
  churchMap: Record<string, string>;
  onApply: (updated: Participant[]) => void;
  onClose: () => void;
}

const ROLE_COLOR: Record<string, string> = {
  '학생': '#64748b', '교사': '#8b5cf6', '학부모': '#f59e0b', '운영진': '#10b981',
  '찬양팀': '#ec4899', '자원봉사': '#06b6d4', '진행위원': '#10b981',
};

export default function VehicleAssignModal({ participants, churchMap, onApply, onClose }: Props) {
  const [mode, setMode] = useState<'unassigned' | 'all'>('unassigned');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const preview = useMemo(
    () => autoAssignVehicles(participants, mode),
    [participants, mode],
  );

  // 차량별 탑승자
  const vehicleMembers = useMemo(() => {
    const map: Record<string, Participant[]> = {};
    VEHICLE_IDS.forEach(vid => { map[vid] = []; });
    preview.forEach(p => { if (p.busId && map[p.busId]) map[p.busId].push(p); });
    return map;
  }, [preview]);

  const totalAssigned = useMemo(
    () => preview.filter(p => p.busId && VEHICLE_IDS.includes(p.busId)).length,
    [preview],
  );
  const unassignedList = useMemo(
    () => preview.filter(p => p.busId !== INDIVIDUAL_ID && (!p.busId || !VEHICLE_IDS.includes(p.busId))),
    [preview],
  );
  const remainingSeats = VEHICLE_CONFIG.reduce(
    (s, v) => s + Math.max(0, v.capacity - (vehicleMembers[v.id]?.length ?? 0)),
    0,
  );

  const groupNameMap: Record<string, string> = Object.fromEntries(
    GROUP_CONFIG.map(g => [g.id, g.name]),
  );

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#E4ECF7] backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="자동 차량 배정"
          className="pointer-events-auto w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh]"
          style={{
            background: 'linear-gradient(160deg, #0f1e3a 0%, #091525 100%)',
            border: '1px solid rgba(37, 99, 235,0.2)',
            boxShadow: '0 32px 72px rgba(0,0,0,0.75)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 px-5 pt-4 pb-4 flex-shrink-0 rounded-t-3xl sm:rounded-t-2xl"
            style={{
              background: 'linear-gradient(160deg, #0f1e3a 0%, #091525 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="sm:hidden w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(37, 99, 235,0.15)', border: '1px solid rgba(37, 99, 235,0.25)' }}
                >
                  <Bus size={15} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1B3A5C]">자동 차량 배정 미리보기</h3>
                  <p className="text-xs text-slate-500 mt-0.5">배정 결과를 확인 후 적용해 주세요</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setMode('unassigned')}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                style={
                  mode === 'unassigned'
                    ? { background: 'rgba(37, 99, 235,0.18)', border: '1px solid rgba(37, 99, 235,0.5)', color: '#22d3ee' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b' }
                }
              >
                미배정만 채우기
              </button>
              <button
                onClick={() => setMode('all')}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                style={
                  mode === 'all'
                    ? { background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.5)', color: '#fbbf24' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b' }
                }
              >
                전체 재배정
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">

            {mode === 'all' && (
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
              >
                <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300 leading-relaxed">
                  기존 차량 배정이 모두 초기화되고 전체 인원이 새로 배정됩니다.
                  개별이동 인원은 유지됩니다.
                </p>
              </div>
            )}

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '총 배정',   value: totalAssigned,         color: '#10b981' },
                { label: '미배정',    value: unassignedList.length, color: unassignedList.length > 0 ? '#f59e0b' : '#64748b' },
                { label: '잔여 좌석', value: remainingSeats,        color: '#06b6d4' },
              ].map(s => (
                <div
                  key={s.label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}35` }}
                >
                  <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Vehicle preview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {VEHICLE_CONFIG.map(vehicle => {
                const members = vehicleMembers[vehicle.id] ?? [];
                const color   = vehicle.color;

                // Role breakdown
                const roleCounts: Record<string, number> = {};
                members.forEach(p => {
                  const r = getParticipantRole(p);
                  roleCounts[r] = (roleCounts[r] ?? 0) + 1;
                });

                // Church distribution
                const churchCounts: Record<string, number> = {};
                members.forEach(p => {
                  const cName = churchMap[p.church] ?? p.church;
                  churchCounts[cName] = (churchCounts[cName] ?? 0) + 1;
                });

                // Group distribution (students only)
                const groupCounts: Record<string, number> = {};
                members.forEach(p => {
                  if (p.groupId) {
                    const gShort = (groupNameMap[p.groupId] ?? p.groupId).split(' ')[0];
                    groupCounts[gShort] = (groupCounts[gShort] ?? 0) + 1;
                  }
                });

                return (
                  <div
                    key={vehicle.id}
                    className="rounded-xl p-4 flex flex-col gap-3"
                    style={{ background: `${color}10`, border: `1px solid ${color}30` }}
                  >
                    {/* Name + count */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bus size={14} style={{ color }} />
                        <span className="font-bold text-[#1B3A5C]">{vehicle.label}</span>
                      </div>
                      <span className="text-lg font-black" style={{ color }}>
                        {members.length}
                        <span className="text-xs font-normal text-slate-500">/{vehicle.capacity}</span>
                      </span>
                    </div>

                    {/* Role breakdown */}
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(roleCounts).map(([role, cnt]) => (
                        <span
                          key={role}
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${ROLE_COLOR[role] ?? '#64748b'}20`, color: ROLE_COLOR[role] ?? '#94a3b8' }}
                        >
                          {role} {cnt}
                        </span>
                      ))}
                    </div>

                    {/* Church distribution */}
                    {Object.keys(churchCounts).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(churchCounts)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 4)
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
                    )}

                    {/* Group distribution */}
                    {Object.keys(groupCounts).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(groupCounts)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 4)
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
                    )}

                    {members.length === 0 && (
                      <span className="text-xs text-slate-600">배정 없음</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Unassigned */}
            {unassignedList.length > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Users size={13} className="text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">
                    미배정 ({unassignedList.length}명) — 차량 정원 초과
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {unassignedList.map(p => (
                    <span
                      key={p.id}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(245,158,11,0.12)', color: '#fcd34d' }}
                    >
                      {p.name} ({getParticipantRole(p)})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="sticky bottom-0 px-5 py-4 flex items-center gap-2 flex-shrink-0"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.07)',
              background: 'linear-gradient(160deg, #0f1e3a 0%, #091525 100%)',
            }}
          >
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-[#1B3A5C] hover:bg-white/10 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.10)' }}
            >
              취소
            </button>
            <div className="flex-1" />
            <button
              onClick={() => onApply(preview)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#1B3A5C] transition-all active:scale-95"
              style={{ background: 'linear-gradient(90deg, #0891b2, #0ea5e9)', boxShadow: '0 4px 16px rgba(37, 99, 235,0.3)' }}
            >
              적용 ({totalAssigned}명)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
