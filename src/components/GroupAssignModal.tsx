import { useMemo, useState, useEffect } from 'react';
import { X, Wand2, AlertTriangle, Users } from 'lucide-react';
import type { Participant } from '../types';
import { GROUP_CONFIG, autoAssign, isStudent } from '../utils/groupAssignment';
import { useGroupMeta } from '../hooks/useSharedData';

interface Props {
  participants: Participant[];
  churchMap: Record<string, string>;
  onApply: (updated: Participant[]) => void;
  onClose: () => void;
}

export default function GroupAssignModal({ participants, churchMap, onApply, onClose }: Props) {
  const [mode, setMode] = useState<'unassigned' | 'all'>('unassigned');
  const groupMeta = useGroupMeta();
  const groups = useMemo(
    () => groupMeta.map(m => ({
      id: m.id,
      name: m.name,
      color: m.color ?? GROUP_CONFIG.find(g => g.id === m.id)?.color ?? '#3B82F6',
    })),
    [groupMeta],
  );

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

  const groupIds = useMemo(() => groups.map(g => g.id), [groups]);
  const preview = useMemo(
    () => autoAssign(participants, mode, groupIds),
    [participants, mode, groupIds],
  );

  const groupMembers = useMemo(() => {
    const map: Record<string, Participant[]> = {};
    groups.forEach(g => { map[g.id] = []; });
    preview.filter(isStudent).forEach(p => {
      if (p.groupId && map[p.groupId]) map[p.groupId].push(p);
    });
    return map;
  }, [preview, groups]);

  const totalAssigned = useMemo(
    () => preview.filter(p => isStudent(p) && p.groupId).length,
    [preview],
  );
  const unassignedList = useMemo(
    () => preview.filter(p => isStudent(p) && !p.groupId),
    [preview],
  );
  const avgPerGroup = totalAssigned > 0 && groups.length > 0
    ? (totalAssigned / groups.length).toFixed(1)
    : '0';

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#E4ECF7] backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="자동 조 편성"
          className="pointer-events-auto w-full sm:max-w-3xl rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh]"
          style={{
            background: 'var(--eum-modal-background)',
            border: '1px solid rgba(31,95,217,0.2)',
            boxShadow: '0 32px 72px rgba(31,95,217,0.75)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 px-5 pt-4 pb-4 flex-shrink-0 rounded-t-3xl sm:rounded-t-2xl"
            style={{
              background: 'var(--eum-modal-background)',
              borderBottom: '1px solid rgba(31,95,217,0.14)',
            }}
          >
            <div className="sm:hidden w-10 h-1 rounded-full bg-slate-300 mx-auto mb-4" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(31,95,217,0.15)', border: '1px solid rgba(31,95,217,0.25)' }}
                >
                  <Wand2 size={15} className="text-[#1F5FD9]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#101A3D]">자동 조 편성 미리보기</h3>
                  <p className="text-xs text-[#5C6A93] mt-0.5">배정 결과를 확인 후 적용해 주세요</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#5C6A93] hover:text-[#101A3D] hover:bg-[#EAF3FF] transition-colors"
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
                    ? { background: 'rgba(31,95,217,0.18)', border: '1px solid rgba(31,95,217,0.5)', color: '#2563EB' }
                    : { background: 'rgba(31,95,217,0.10)', border: '1px solid rgba(31,95,217,0.16)', color: '#64748b' }
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
                    : { background: 'rgba(31,95,217,0.10)', border: '1px solid rgba(31,95,217,0.16)', color: '#64748b' }
                }
              >
                전체 재배정
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">

            {/* 전체 재배정 경고 */}
            {mode === 'all' && (
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
              >
                <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300 leading-relaxed">
                  기존 배정 내역이 모두 초기화되고 전체 학생이 새로 배정됩니다.
                </p>
              </div>
            )}

            {/* 요약 통계 */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '총 배정', value: totalAssigned, color: '#10b981' },
                { label: '조별 평균', value: avgPerGroup, color: '#3B82F6' },
                { label: '미배정', value: unassignedList.length, color: unassignedList.length > 0 ? '#f59e0b' : '#64748b' },
              ].map(s => (
                <div
                  key={s.label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}35` }}
                >
                  <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-[#5C6A93] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* 조별 카드 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {groups.map(group => {
                const members = groupMembers[group.id] ?? [];
                const mCount = members.filter(p => p.gender === 'M').length;
                const fCount = members.filter(p => p.gender === 'F').length;

                const churchCounts: Record<string, number> = {};
                members.forEach(p => {
                  const cName = churchMap[p.church] ?? p.church;
                  churchCounts[cName] = (churchCounts[cName] ?? 0) + 1;
                });
                const churchEntries = Object.entries(churchCounts).sort((a, b) => b[1] - a[1]);

                return (
                  <div
                    key={group.id}
                    className="rounded-xl p-3 flex flex-col gap-2"
                    style={{
                      background: `${group.color}10`,
                      border: `1px solid ${group.color}30`,
                    }}
                  >
                    {/* 조 이름 + 인원 */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: group.color }}>
                        {group.name}
                      </span>
                      <span
                        className="text-lg font-black"
                        style={{ color: group.color }}
                      >
                        {members.length}
                      </span>
                    </div>

                    {/* 남/여 */}
                    <div className="flex gap-1.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium text-blue-300"
                        style={{ background: 'rgba(59,130,246,0.15)' }}>
                        남 {mCount}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium text-pink-300"
                        style={{ background: 'rgba(236,72,153,0.15)' }}>
                        여 {fCount}
                      </span>
                    </div>

                    {/* 교회 분포 */}
                    {churchEntries.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {churchEntries.slice(0, 3).map(([cName, cnt]) => (
                          <span
                            key={cName}
                            className="text-xs px-1.5 py-0.5 rounded-md"
                            style={{ background: 'rgba(31,95,217,0.14)', color: '#94a3b8' }}
                          >
                            {cName} {cnt}
                          </span>
                        ))}
                        {churchEntries.length > 3 && (
                          <span className="text-xs text-slate-600">+{churchEntries.length - 3}</span>
                        )}
                      </div>
                    )}

                    {members.length === 0 && (
                      <span className="text-xs text-slate-600">배정 없음</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 미배정 목록 */}
            {unassignedList.length > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Users size={13} className="text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">
                    미배정 학생 ({unassignedList.length}명)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {unassignedList.map(p => (
                    <span
                      key={p.id}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(245,158,11,0.12)', color: '#fcd34d' }}
                    >
                      {p.name}
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
              borderTop: '1px solid rgba(31,95,217,0.14)',
              background: 'var(--eum-modal-background)',
            }}
          >
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#5C6A93] hover:text-[#101A3D] hover:bg-[#EAF3FF] transition-colors"
              style={{ border: '1px solid rgba(31,95,217,0.16)' }}
            >
              취소
            </button>
            <div className="flex-1" />
            <button
              onClick={() => onApply(preview)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(90deg, #2F73F2, #1F5FD9)', boxShadow: '0 4px 16px rgba(31,95,217,0.3)' }}
            >
              적용 ({totalAssigned}명)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
