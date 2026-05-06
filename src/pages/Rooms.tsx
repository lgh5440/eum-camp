import { useEffect, useState } from 'react';
import { BedDouble, Wand2, AlertTriangle, Pencil, Check, X, Plus, Trash2 } from 'lucide-react';
import type { Participant, Room } from '../types';
import { saveParticipants } from '../utils/participantStorage';
import { saveRoomConfig } from '../utils/roomConfigStorage';
import { useChurchConfig, useGroupMeta, useParticipants, useRoomConfig } from '../hooks/useSharedData';
import { GROUP_CONFIG, isStudent } from '../utils/groupAssignment';
import { consumeEditRequest } from '../utils/pageEditRequest';
import RoomAssignModal from '../components/RoomAssignModal';

const TYPE_COLOR: Record<string, string> = { male: '#3b82f6', female: '#ec4899', staff: '#8b5cf6' };
const TYPE_LABEL: Record<string, string> = { male: '남자', female: '여자', staff: '교사/스탭' };

function getRoomStatus(count: number, capacity: number) {
  if (count > capacity)   return { label: '초과',     color: '#ef4444' };
  if (count === capacity) return { label: '배정완료',  color: '#10b981' };
  if (count > 0)          return { label: '여유 있음', color: '#06b6d4' };
  return                         { label: '미배정',    color: '#475569' };
}

export default function Rooms() {
  const sharedParticipants = useParticipants();
  const roomConfig = useRoomConfig();
  const churchConfig = useChurchConfig();
  const groupMeta = useGroupMeta();

  const [participantList, setParticipantList] = useState<Participant[]>(sharedParticipants);
  const [showModal, setShowModal]             = useState(false);

  const [editMode, setEditMode]               = useState(false);
  const [editRooms, setEditRooms]             = useState<Room[]>([]);
  const [editParticipants, setEditParticipants] = useState<Participant[]>([]);
  const [openDropdown, setOpenDropdown]       = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setParticipantList(sharedParticipants), 0);
    return () => window.clearTimeout(timer);
  }, [sharedParticipants]);

  const churchMap: Record<string, string>    = Object.fromEntries(churchConfig.map(c => [c.id, c.name]));
  const groupNameMap: Record<string, string> = Object.fromEntries(
    groupMeta.map(g => [g.id, g.name ?? GROUP_CONFIG.find(base => base.id === g.id)?.name ?? g.id]),
  );

  const activeRooms        = editMode ? editRooms        : roomConfig;
  const activeParticipants = editMode ? editParticipants : participantList;

  // 방별 입주자 (participant.roomId 기준)
  const roomMemberMap: Record<string, Participant[]> = {};
  activeRooms.forEach(r => { roomMemberMap[r.id] = []; });
  activeParticipants.forEach(p => {
    if (p.roomId && roomMemberMap[p.roomId]) roomMemberMap[p.roomId].push(p);
  });

  const maleRooms    = activeRooms.filter(r => r.type === 'male');
  const femaleRooms  = activeRooms.filter(r => r.type === 'female');
  const studentRooms = activeRooms.filter(r => r.type !== 'staff');
  const validRoomIds = new Set(studentRooms.map(r => r.id));

  const students           = activeParticipants.filter(isStudent);
  const assignedStudents   = students.filter(p => p.roomId && validRoomIds.has(p.roomId));
  const unassignedStudents = students.filter(p => !p.roomId || !validRoomIds.has(p.roomId));
  const remainingSeats     = studentRooms.reduce(
    (s, r) => s + Math.max(0, r.capacity - (roomMemberMap[r.id]?.length ?? 0)), 0,
  );

  const buildings = [...new Set(activeRooms.map(r => r.building))].sort();

  // ── 편집 모드 함수 ────────────────────────────────────────────────────────────

  function enterEditMode() {
    setEditRooms(roomConfig.map(r => ({ ...r })));
    setEditParticipants(participantList.map(p => ({ ...p })));
    setOpenDropdown(null);
    setEditMode(true);
  }

  useEffect(() => {
    if (editMode) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (consumeEditRequest('rooms', 'rooms')) enterEditMode();
  }, [editMode, participantList, roomConfig]);

  function cancelEdit() {
    setEditMode(false);
    setOpenDropdown(null);
  }

  function saveEdit() {
    saveRoomConfig(editRooms);
    saveParticipants(editParticipants);
    setParticipantList(editParticipants);
    setEditMode(false);
    setOpenDropdown(null);
  }

  function updateRoom(id: string, patch: Partial<Room>) {
    setEditRooms(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }

  function deleteRoom(id: string) {
    setEditParticipants(prev => prev.map(p => p.roomId === id ? { ...p, roomId: undefined } : p));
    setEditRooms(prev => prev.filter(r => r.id !== id));
    if (openDropdown === id) setOpenDropdown(null);
  }

  function addRoom() {
    const lastBuilding = editRooms.length > 0 ? editRooms[editRooms.length - 1].building : '미지정';
    setEditRooms(prev => [...prev, {
      id: `r_new_${Date.now()}`,
      name: '새 호실',
      building: lastBuilding,
      floor: 1,
      capacity: 4,
      type: 'male',
      assignedIds: [],
    }]);
  }

  function removeMember(participantId: string) {
    setEditParticipants(prev => prev.map(p =>
      p.id === participantId ? { ...p, roomId: undefined } : p,
    ));
  }

  function assignMember(roomId: string, participantId: string) {
    setEditParticipants(prev => prev.map(p =>
      p.id === participantId ? { ...p, roomId } : p,
    ));
    setOpenDropdown(null);
  }

  function getEligible(room: Room): Participant[] {
    return editParticipants
      .filter(p => {
        if (p.roomId) return false;
        if (room.type === 'male')   return p.gender === 'M';
        if (room.type === 'female') return p.gender === 'F';
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }

  function handleAutoAssignApply(updated: Participant[]) {
    setParticipantList(updated);
    saveParticipants(updated);
    setShowModal(false);
  }

  // ── 렌더 ──────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5" onClick={() => setOpenDropdown(null)}>

      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">숙소 / 방 배정</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            총 {activeRooms.length}개 방 · 수용 {activeRooms.reduce((s, r) => s + r.capacity, 0)}명
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {editMode ? (
            <>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <X size={13} /> 취소
              </button>
              <button
                onClick={saveEdit}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(90deg,#059669,#10b981)', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
              >
                <Check size={13} /> 저장
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <Wand2 size={13} /> 자동 배정
              </button>
              <button
                onClick={enterEditMode}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(90deg,#0891b2,#0ea5e9)', boxShadow: '0 2px 8px rgba(6,182,212,0.25)' }}
              >
                <Pencil size={13} /> 수동 배정
              </button>
            </>
          )}
        </div>
      </div>

      {/* 편집 모드 툴바 */}
      {editMode && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <p className="text-xs text-emerald-300">수동 배정 중 — 호실·인원을 편집한 뒤 저장하세요.</p>
          <button
            onClick={e => { e.stopPropagation(); addRoom(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex-shrink-0"
            style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.28)', color: '#22d3ee' }}
          >
            <Plus size={12} /> 호실 추가
          </button>
        </div>
      )}

      {/* 요약 통계 6칸 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: '전체 학생',  value: students.length,           color: '#64748b' },
          { label: '배정 완료',  value: assignedStudents.length,   color: '#10b981' },
          { label: '미배정',     value: unassignedStudents.length, color: unassignedStudents.length > 0 ? '#f59e0b' : '#64748b' },
          { label: '남학생 방',  value: maleRooms.length,          color: '#3b82f6' },
          { label: '여학생 방',  value: femaleRooms.length,        color: '#ec4899' },
          { label: '잔여 자리',  value: remainingSeats,            color: '#06b6d4' },
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
      {!editMode && unassignedStudents.length > 0 && (
        <div
          className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.22)' }}
        >
          <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300 leading-relaxed">
            미배정 학생 <span className="font-semibold">{unassignedStudents.length}명</span>이 있습니다.
            &nbsp;'자동 배정'을 실행하거나 '수동 배정'으로 직접 지정해 주세요.
          </p>
        </div>
      )}

      {/* 동별 그룹 */}
      {buildings.map(building => {
        const bRooms    = activeRooms.filter(r => r.building === building);
        const bCapacity = bRooms.reduce((s, r) => s + r.capacity, 0);
        const bAssigned = bRooms.reduce((s, r) => s + (roomMemberMap[r.id]?.length ?? 0), 0);
        const isStaffBuilding = bRooms.every(r => r.type === 'staff');

        return (
          <div key={building}>
            {/* 건물 헤더 */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
              <h3 className="text-base font-bold text-cyan-300">{building}</h3>
              {isStaffBuilding && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}
                >
                  교사/스탭
                </span>
              )}
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {bAssigned}/{bCapacity}명
                {bCapacity > 0 ? ` (${Math.round((bAssigned / bCapacity) * 100)}%)` : ''}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-white/10 max-w-32 min-w-12">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${bCapacity > 0 ? Math.min(100, (bAssigned / bCapacity) * 100) : 0}%`,
                    background: '#06b6d4',
                  }}
                />
              </div>
            </div>

            {/* 방 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {bRooms.map(room => {
                const members  = roomMemberMap[room.id] ?? [];
                const color    = TYPE_COLOR[room.type] ?? '#64748b';
                const fillRate = room.capacity > 0
                  ? Math.min(100, Math.round((members.length / room.capacity) * 100))
                  : 0;
                const status   = getRoomStatus(members.length, room.capacity);
                const eligible = editMode ? getEligible(room) : [];

                const churchCounts: Record<string, number> = {};
                members.forEach(p => {
                  const cName = churchMap[p.church] ?? p.church;
                  churchCounts[cName] = (churchCounts[cName] ?? 0) + 1;
                });

                const groupCounts: Record<string, number> = {};
                members.filter(isStudent).forEach(p => {
                  if (p.groupId) {
                    const gShort = (groupNameMap[p.groupId] ?? p.groupId).split(' ')[0];
                    groupCounts[gShort] = (groupCounts[gShort] ?? 0) + 1;
                  }
                });

                return (
                  <div
                    key={room.id}
                    className="relative rounded-2xl overflow-visible"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}25` }}
                  >
                    {/* 방 헤더 */}
                    <div
                      className="px-4 py-3 rounded-t-2xl"
                      style={{ background: `${color}12`, borderBottom: `1px solid ${color}20` }}
                    >
                      {editMode ? (
                        <div className="space-y-2">
                          {/* 이름 + 삭제 */}
                          <div className="flex items-center gap-2">
                            <BedDouble size={14} style={{ color }} className="flex-shrink-0" />
                            <input
                              value={room.name}
                              onChange={e => updateRoom(room.id, { name: e.target.value })}
                              onClick={e => e.stopPropagation()}
                              className="flex-1 min-w-0 text-sm font-bold bg-transparent border-b border-white/20 text-white outline-none focus:border-cyan-400 px-0.5"
                              placeholder="호실명"
                            />
                            <button
                              onClick={e => { e.stopPropagation(); deleteRoom(room.id); }}
                              className="flex-shrink-0 p-1 rounded text-slate-600 hover:text-red-400 transition-colors"
                              title="호실 삭제"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          {/* 타입 + 건물 + 정원 */}
                          <div className="flex items-center gap-2">
                            <select
                              value={room.type}
                              onChange={e => updateRoom(room.id, { type: e.target.value as Room['type'] })}
                              onClick={e => e.stopPropagation()}
                              className="text-xs rounded px-2 py-0.5 outline-none cursor-pointer flex-shrink-0"
                              style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
                            >
                              <option value="male">남자</option>
                              <option value="female">여자</option>
                              <option value="staff">교사/스탭</option>
                            </select>
                            <input
                              value={room.building}
                              onChange={e => updateRoom(room.id, { building: e.target.value })}
                              onClick={e => e.stopPropagation()}
                              className="flex-1 min-w-0 text-xs bg-transparent border-b border-white/15 text-slate-300 outline-none focus:border-cyan-400 px-0.5"
                              placeholder="건물명"
                            />
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-[10px] text-slate-500">정원</span>
                              <input
                                type="number"
                                min={members.length}
                                max={20}
                                value={room.capacity}
                                onChange={e =>
                                  updateRoom(room.id, {
                                    capacity: Math.max(members.length, parseInt(e.target.value) || 1),
                                  })
                                }
                                onClick={e => e.stopPropagation()}
                                className="w-10 text-xs text-center bg-transparent border-b border-white/15 text-white outline-none focus:border-cyan-400"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BedDouble size={15} style={{ color }} />
                            <span className="font-bold text-white text-sm">{room.name}</span>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ background: `${color}20`, color }}
                            >
                              {TYPE_LABEL[room.type]}
                            </span>
                          </div>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: `${status.color}20`, color: status.color }}
                          >
                            {status.label}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      {/* 충원율 */}
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-slate-400">{members.length}/{room.capacity}명</span>
                        <span
                          className="text-xs font-bold"
                          style={{ color: fillRate >= 100 ? '#ef4444' : fillRate >= 75 ? '#f59e0b' : '#10b981' }}
                        >
                          {fillRate}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 mb-3">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${fillRate}%`,
                            background: fillRate >= 100 ? '#ef4444' : fillRate >= 75 ? '#f59e0b' : color,
                          }}
                        />
                      </div>

                      {/* 입주자 목록 */}
                      <div className="space-y-1">
                        {members.map(member => (
                          <div key={member.id} className="flex items-center gap-2 py-1">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                              style={{
                                background: member.gender === 'M' ? 'rgba(59,130,246,0.2)' : 'rgba(236,72,153,0.2)',
                                color: member.gender === 'M' ? '#60a5fa' : '#f472b6',
                              }}
                            >
                              {member.name.charAt(0)}
                            </div>
                            <span className="text-xs text-slate-300 flex-1 min-w-0 truncate">{member.name}</span>
                            <span className="text-[10px] text-slate-500 flex-shrink-0">{member.grade}</span>
                            {editMode && (
                              <button
                                onClick={e => { e.stopPropagation(); removeMember(member.id); }}
                                className="flex-shrink-0 p-0.5 rounded text-slate-600 hover:text-red-400 transition-colors"
                                title="배정 해제"
                              >
                                <X size={11} />
                              </button>
                            )}
                          </div>
                        ))}

                        {/* 빈 자리 (조회 모드) */}
                        {!editMode && Array.from({ length: Math.max(0, room.capacity - members.length) }).map((_, i) => (
                          <div key={`empty-${i}`} className="hidden sm:flex items-center gap-2 py-1">
                            <div
                              className="w-5 h-5 rounded-full border border-dashed flex-shrink-0"
                              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                            />
                            <span className="text-[10px] text-slate-700">빈 자리</span>
                          </div>
                        ))}

                        {/* 배정 버튼 (편집 모드, 빈 자리 있을 때) */}
                        {editMode && members.length < room.capacity && (
                          <div className="mt-1">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setOpenDropdown(openDropdown === room.id ? null : room.id);
                              }}
                              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px dashed rgba(255,255,255,0.12)',
                                color: '#64748b',
                              }}
                            >
                              <Plus size={11} />
                              참가자 배정
                              <span className="text-[10px] ml-0.5">
                                (빈 자리 {room.capacity - members.length}석)
                              </span>
                            </button>

                            {openDropdown === room.id && (
                              <div
                                className="mt-2 rounded-xl overflow-hidden"
                                style={{
                                  background: '#1e293b',
                                  border: '1px solid rgba(255,255,255,0.12)',
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.32)',
                                  maxHeight: '220px',
                                  overflowY: 'auto',
                                }}
                                onClick={e => e.stopPropagation()}
                              >
                                {eligible.length === 0 ? (
                                  <div className="px-3 py-3 text-xs text-slate-500 text-center">
                                    배정 가능한 인원이 없습니다
                                  </div>
                                ) : (
                                  eligible.map(p => (
                                    <button
                                      key={p.id}
                                      onClick={() => assignMember(room.id, p.id)}
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-left transition-colors"
                                    >
                                      <div
                                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                        style={{
                                          background: p.gender === 'M' ? 'rgba(59,130,246,0.2)' : 'rgba(236,72,153,0.2)',
                                          color: p.gender === 'M' ? '#60a5fa' : '#f472b6',
                                        }}
                                      >
                                        {p.name.charAt(0)}
                                      </div>
                                      <span className="text-xs text-white flex-1 min-w-0 truncate">{p.name}</span>
                                      <span className="text-[10px] text-slate-500 flex-shrink-0">{p.grade}</span>
                                      <span className="text-[10px] text-slate-600 truncate max-w-[4rem]">
                                        {churchMap[p.church] ?? p.church}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 교회 + 조 분포 배지 (조회 모드만) */}
                      {!editMode && Object.keys(churchCounts).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
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
                          {Object.keys(groupCounts).length > 0 && (
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
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 자동 방 배정 모달 */}
      {showModal && (
        <RoomAssignModal
          participants={participantList}
          rooms={roomConfig}
          churchMap={churchMap}
          onApply={handleAutoAssignApply}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
