import { useEffect, useState } from 'react';
import { Check, Pencil, Wand2, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import type { Participant } from '../types';
import { GROUP_CONFIG, isStudent } from '../utils/groupAssignment';
import { saveParticipants } from '../utils/participantStorage';
import { useChurchConfig, useParticipants, useGroupMeta } from '../hooks/useSharedData';
import GroupAssignModal from '../components/GroupAssignModal';
import {
  saveGroupMeta,
  type GroupMeta,
  GROUP_COLOR_PALETTE,
  nextGroupId,
  nextGroupColor,
} from '../utils/groupConfigStorage';
import { consumeEditRequest } from '../utils/pageEditRequest';
import { useAuth } from '../auth/useAuth';

function colorOf(meta: GroupMeta): string {
  return meta.color ?? GROUP_CONFIG.find(g => g.id === meta.id)?.color ?? '#06b6d4';
}

export default function Groups() {
  const sharedParticipants = useParticipants();
  const groupMeta = useGroupMeta();
  const churchConfig = useChurchConfig();
  const { isAdmin } = useAuth();
  const [participantList, setParticipantList] = useState<Participant[]>(sharedParticipants);
  const [showModal, setShowModal] = useState(false);
  const [editingGroups, setEditingGroups] = useState(false);
  const [groupDraft, setGroupDraft] = useState<GroupMeta[]>([]);
  const [participantDraft, setParticipantDraft] = useState<Participant[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setParticipantList(sharedParticipants), 0);
    return () => window.clearTimeout(timer);
  }, [sharedParticipants]);

  const churchMap = Object.fromEntries(churchConfig.map(c => [c.id, c.name]));

  // 활성 조 목록 (편집 중에는 draft, 평소엔 저장된 meta)
  const activeGroups: GroupMeta[] = editingGroups ? groupDraft : groupMeta;
  const activeParticipants = editingGroups ? participantDraft : participantList;
  const activeIds = new Set(activeGroups.map(g => g.id));

  const students = activeParticipants.filter(isStudent);
  const assigned = students.filter(p => p.groupId && activeIds.has(p.groupId));
  const unassigned = students.filter(p => !p.groupId || !activeIds.has(p.groupId));

  const groupMembers: Record<string, Participant[]> = {};
  activeGroups.forEach(g => { groupMembers[g.id] = []; });
  assigned.forEach(p => {
    if (p.groupId && groupMembers[p.groupId]) groupMembers[p.groupId].push(p);
  });

  function handleApply(updated: Participant[]) {
    setParticipantList(updated);
    saveParticipants(updated);
    setShowModal(false);
  }

  function openGroupEdit() {
    setGroupDraft(groupMeta.map(group => ({ ...group })));
    setParticipantDraft(participantList.map(participant => ({ ...participant })));
    setEditingGroups(true);
  }

  useEffect(() => {
    if (!isAdmin || editingGroups) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (consumeEditRequest('groups', 'groups')) openGroupEdit();
  }, [editingGroups, groupMeta, isAdmin]);

  function saveGroupEdit() {
    const normalizedGroups = groupDraft.map(group => ({
      ...group,
      name: group.name.trim() || group.id,
      leaderName: group.leaderName.trim() || '미배정',
      color: group.color || nextGroupColor(groupDraft),
    }));
    saveGroupMeta(normalizedGroups);
    saveParticipants(participantDraft);
    setParticipantList(participantDraft);
    setGroupDraft([]);
    setParticipantDraft([]);
    setEditingGroups(false);
  }

  function cancelGroupEdit() {
    setGroupDraft([]);
    setParticipantDraft([]);
    setEditingGroups(false);
  }

  function addGroup() {
    const id = nextGroupId(groupDraft);
    const color = nextGroupColor(groupDraft);
    const num = id.replace(/^g0*/, '');
    setGroupDraft([
      ...groupDraft,
      { id, name: `${num}조`, leaderName: '미배정', color },
    ]);
  }

  function removeGroup(id: string) {
    const target = groupDraft.find(g => g.id === id);
    if (!target) return;
    const memberCount = participantDraft.filter(p => p.groupId === id).length;
    const msg = memberCount > 0
      ? `'${target.name}'에 ${memberCount}명이 배정되어 있습니다.\n삭제하면 해당 학생들은 미배정 상태가 됩니다.\n계속하시겠습니까?`
      : `'${target.name}'을(를) 삭제하시겠습니까?`;
    if (!window.confirm(msg)) return;

    setGroupDraft(prev => prev.filter(g => g.id !== id));
    setParticipantDraft(prev => prev.map(p =>
      p.groupId === id ? { ...p, groupId: undefined } : p,
    ));
  }

  const avgPerGroup = assigned.length > 0 && activeGroups.length > 0
    ? (assigned.length / activeGroups.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-5">
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">조 편성</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            총 {activeGroups.length}개 조 · 학생 {students.length}명
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {isAdmin && editingGroups && (
            <button
              type="button"
              onClick={cancelGroupEdit}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex-shrink-0"
              style={{ color: '#94a3b8', background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.25)' }}
            >
              취소
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={editingGroups ? saveGroupEdit : openGroupEdit}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex-shrink-0"
              style={editingGroups
                ? { color: '#6ee7b7', background: 'rgba(16,185,129,0.16)', border: '1px solid rgba(16,185,129,0.35)' }
                : { color: '#67e8f9', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)' }
              }
            >
              {editingGroups ? <Check size={13} /> : <Pencil size={13} />}
              {editingGroups ? '조 정보 저장' : '조 정보 편집'}
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 flex-shrink-0"
            style={{ background: 'linear-gradient(90deg, #0891b2, #0ea5e9)', boxShadow: '0 4px 16px rgba(6,182,212,0.25)' }}
          >
            <Wand2 size={15} />
            자동 조 편성
          </button>
        </div>
      </div>

      {editingGroups && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(6,182,212,0.22)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {groupDraft.map((group, index) => {
              const color = colorOf(group);
              const num = group.id.replace(/^g0*/, '');
              return (
                <div
                  key={group.id}
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: `${color}10`, border: `1px solid ${color}30` }}
                >
                  <span className="w-7 text-xs font-black text-center flex-shrink-0" style={{ color }}>
                    {num}
                  </span>
                  <input
                    value={group.name}
                    onChange={e => {
                      const next = [...groupDraft];
                      next[index] = { ...group, name: e.target.value };
                      setGroupDraft(next);
                    }}
                    className="flex-1 min-w-0 bg-transparent text-xs text-white outline-none border-b border-white/10 focus:border-cyan-400 py-1"
                    placeholder="조 이름"
                  />
                  <input
                    value={group.leaderName}
                    onChange={e => {
                      const next = [...groupDraft];
                      next[index] = { ...group, leaderName: e.target.value };
                      setGroupDraft(next);
                    }}
                    className="w-20 bg-transparent text-xs text-slate-300 outline-none border-b border-white/10 focus:border-cyan-400 py-1"
                    placeholder="리더"
                  />
                  <div className="relative flex-shrink-0">
                    <input
                      type="color"
                      value={color}
                      onChange={e => {
                        const next = [...groupDraft];
                        next[index] = { ...group, color: e.target.value };
                        setGroupDraft(next);
                      }}
                      className="w-6 h-6 rounded-full bg-transparent cursor-pointer"
                      aria-label="조 색상"
                      title="색상 변경"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeGroup(group.id);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-300 hover:bg-red-500/15 transition-colors flex-shrink-0"
                    aria-label={`${group.name} 삭제`}
                    title="조 삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={addGroup}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{ color: '#67e8f9', background: 'rgba(6,182,212,0.12)', border: '1px dashed rgba(6,182,212,0.45)' }}
            >
              <Plus size={13} />
              조 추가
            </button>
            <div className="flex items-center gap-1.5 flex-wrap">
              {GROUP_COLOR_PALETTE.slice(0, 6).map(c => (
                <span
                  key={c}
                  className="w-3 h-3 rounded-full"
                  style={{ background: c, opacity: 0.55 }}
                  title={c}
                />
              ))}
              <span className="text-[10px] text-slate-500 ml-1">색상 자동 배정</span>
            </div>
          </div>
        </div>
      )}

      {/* 요약 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '전체 학생', value: students.length, color: '#64748b' },
          { label: '배정 완료', value: assigned.length, color: '#10b981' },
          { label: '미배정', value: unassigned.length, color: unassigned.length > 0 ? '#f59e0b' : '#64748b' },
          { label: '조별 평균', value: avgPerGroup, color: '#06b6d4' },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-xl p-3 text-center"
            style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}
          >
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 미배정 경고 */}
      {unassigned.length > 0 && (
        <div
          className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.22)' }}
        >
          <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300 leading-relaxed">
            미배정 학생 <span className="font-semibold">{unassigned.length}명</span>이 있습니다.
            &nbsp;'자동 조 편성'을 실행하거나 각 참가자의 조를 직접 지정해 주세요.
          </p>
        </div>
      )}

      {/* 조별 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {activeGroups.map(group => {
          const color = colorOf(group);
          const members = groupMembers[group.id] ?? [];
          const mCount = members.filter(p => p.gender === 'M').length;
          const fCount = members.filter(p => p.gender === 'F').length;

          const teacher = participantList.find(
            p => p.groupId === group.id && (p.grade === '교사' || p.role === '교사'),
          );
          const leaderName = teacher?.name ?? group.leaderName;

          const churchCounts: Record<string, number> = {};
          members.forEach(p => {
            const cName = churchMap[p.church] ?? p.church;
            churchCounts[cName] = (churchCounts[cName] ?? 0) + 1;
          });
          const churchEntries = Object.entries(churchCounts).sort((a, b) => b[1] - a[1]);

          const groupNum = group.id.replace(/^g0*/, '');

          return (
            <div
              key={group.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}30` }}
            >
              {/* 조 헤더 */}
              <div
                className="px-5 py-4"
                style={{ background: `${color}15`, borderBottom: `1px solid ${color}25` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
                      style={{ background: `${color}30`, color }}
                    >
                      {groupNum}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{group.name}</div>
                      <div className="text-xs text-slate-400">
                        리더: {leaderName}
                        {teacher && <span className="text-slate-600"> (교사)</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black" style={{ color }}>{members.length}명</div>
                    <div className="text-[10px] text-slate-400">남{mCount}/여{fCount}</div>
                  </div>
                </div>
              </div>

              {/* 멤버 목록 */}
              <div className="p-4 space-y-1.5">
                {members.length === 0 ? (
                  <p className="text-xs text-slate-600 py-2 text-center">배정된 학생이 없습니다</p>
                ) : (
                  members.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: member.gender === 'M' ? 'rgba(59,130,246,0.2)' : 'rgba(236,72,153,0.2)',
                          color: member.gender === 'M' ? '#60a5fa' : '#f472b6',
                        }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-white">{member.name}</span>
                        <span className="text-xs text-slate-500 ml-2">{member.grade}</span>
                      </div>
                      <span className="text-xs text-slate-500 truncate max-w-[5rem] sm:max-w-24">
                        {churchMap[member.church] ?? member.church}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* 교회 분포 배지 */}
              {churchEntries.length > 0 && (
                <div className="px-4 pb-4 flex flex-wrap gap-1">
                  {churchEntries.map(([cName, cnt]) => (
                    <span
                      key={cName}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}
                    >
                      {cName} {cnt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 자동 조 편성 모달 */}
      {showModal && (
        <GroupAssignModal
          participants={participantList}
          churchMap={churchMap}
          onApply={handleApply}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
