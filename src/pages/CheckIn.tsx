import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  UserCheck, Search, CheckCircle2, XCircle, AlertTriangle, Users, Clock,
} from 'lucide-react';
import {
  saveCheckInMap, toggleCheckIn,
  type CheckInMap, type CheckInEntry,
} from '../utils/checkInStorage';
import { useCheckInMap, useParticipants, useChurchConfig } from '../hooks/useSharedData';
import { isStudent, GROUP_CONFIG } from '../utils/groupAssignment';
import { VEHICLE_CONFIG, INDIVIDUAL_ID } from '../utils/vehicleAssignment';
import { churches as masterChurches, rooms as masterRooms } from '../data/mockData';
import { isCorruptChurchValue } from '../utils/churchIdentity';
import type { Participant } from '../types';

// ── 정적 룩업 맵 ──────────────────────────────────────────────────────────────────
const CHURCH_MAP = new Map(masterChurches.map(c => [c.id, c.name]));
const GROUP_MAP  = new Map<string, string>(GROUP_CONFIG.map(g => [g.id, g.name]));
const ROOM_MAP   = new Map(masterRooms.map(r => [r.id, `${r.building} ${r.name}`]));

// ── 타입 ─────────────────────────────────────────────────────────────────────────
type PrimaryFilter = 'all' | 'checkedIn' | 'pending' | 'students' | 'staff';

const PRIMARY_FILTERS: { key: PrimaryFilter; label: string }[] = [
  { key: 'all',       label: '전체' },
  { key: 'checkedIn', label: '체크인 완료' },
  { key: 'pending',   label: '미도착' },
  { key: 'students',  label: '학생' },
  { key: 'staff',     label: '교사/운영진' },
];

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────────
function getRoleLabel(p: Participant): string {
  if (p.role) return p.role;
  if (p.grade === '교사' || p.grade === '학부모' || p.grade === '운영진') return p.grade;
  return '학생';
}

function formatTime(iso: string): string {
  return iso.slice(11, 16); // "HH:MM"
}

// ── 참가자 카드 ───────────────────────────────────────────────────────────────────
interface CardProps {
  p: Participant;
  entry: CheckInEntry | undefined;
  onToggle: (id: string) => void;
}

function ParticipantCard({ p, entry, onToggle }: CardProps) {
  const churches = useChurchConfig();
  const isCheckedIn = !!entry?.checkedIn;
  // churchConfig 매칭 entry 우선 — ID가 길어도 등록된 entry면 정상 표시
  const matchedChurchName = churches.find(c => c.id === p.church)?.name;
  const churchName  = matchedChurchName
    ?? (isCorruptChurchValue(p.church) ? '(확인 필요)' : (CHURCH_MAP.get(p.church) ?? p.church));
  const role        = getRoleLabel(p);
  const groupName   = p.groupId ? (GROUP_MAP.get(p.groupId) ?? '-') : '-';
  const roomName    = p.roomId  ? (ROOM_MAP.get(p.roomId)  ?? '-') : '-';
  const vehicle     = p.busId   ?? '-';
  const hasAllergy  = p.dietType === 'allergy';
  const hasNotes    = !!(p.notes && p.notes.trim());
  const feeIssue    = p.fee === 'unpaid' || p.fee === 'partial';
  const isStud      = isStudent(p);

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        background: isCheckedIn ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isCheckedIn ? 'rgba(16,185,129,0.28)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">

        {/* ── 좌측: 참가자 정보 ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* 이름 + 배지 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: isCheckedIn ? '#10b981' : '#475569' }}
            />
            <span className="text-base font-bold text-[#101A3D]">{p.name}</span>

            {/* 구분 배지 */}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                background: isStud ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                color: isStud ? '#93c5fd' : '#c4b5fd',
              }}
            >
              {role}
            </span>

            {/* 참가비 배지 */}
            {feeIssue && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}
              >
                {p.fee === 'unpaid' ? '미납' : '부분납'}
              </span>
            )}

            {/* 알레르기 배지 */}
            {hasAllergy && (
              <span
                className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
              >
                <AlertTriangle size={9} />알레르기
              </span>
            )}
          </div>

          {/* 교회 · 학년 · 성별 */}
          <div className="text-[12px] text-slate-400 mt-1.5">
            <span className="text-slate-300 font-medium">{churchName}</span>
            {' · '}{p.grade} · {p.gender === 'M' ? '남' : '여'}
          </div>

          {/* 조 · 방 · 차량 */}
          <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-x-3">
            <span>조: {groupName}</span>
            <span>방: {roomName}</span>
            <span>차량: {vehicle}</span>
          </div>

          {/* 연락처 */}
          <div className="text-[11px] text-slate-500 mt-0.5">
            📞 {p.phone || '—'}
            {isStud && p.parentPhone && p.parentPhone !== p.phone && (
              <span className="ml-2 text-slate-600">보호자: {p.parentPhone}</span>
            )}
          </div>

          {/* 특이사항 */}
          {(hasNotes || (hasAllergy && p.allergies)) && (
            <div className="text-[10px] text-slate-600 mt-0.5">
              {hasAllergy && p.allergies ? `⚠ ${p.allergies}` : ''}{hasAllergy && p.allergies && hasNotes ? ' / ' : ''}{hasNotes ? p.notes : ''}
            </div>
          )}

          {/* 체크인 완료 시간 */}
          {isCheckedIn && entry && (
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle2 size={12} className="text-green-400" />
              <span className="text-[12px] text-green-400 font-semibold">
                {formatTime(entry.checkedInAt)} 도착 완료
              </span>
            </div>
          )}
        </div>

        {/* ── 우측: 체크인 버튼 ──────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          {isCheckedIn ? (
            <>
              <div
                className="w-16 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.4)',
                }}
              >
                <CheckCircle2 size={20} className="text-green-400" />
              </div>
              <button
                onClick={() => onToggle(p.id)}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
              >
                취소
              </button>
            </>
          ) : (
            <button
              onClick={() => onToggle(p.id)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-[#101A3D] transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg,#10b981,#059669)',
                boxShadow: '0 2px 10px rgba(16,185,129,0.35)',
                minWidth: '72px',
              }}
            >
              체크인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function CheckIn() {
  const sharedCheckInMap = useCheckInMap();
  const [checkInMap, setCheckInMap] = useState<CheckInMap>(sharedCheckInMap);
  const [search,     setSearch]     = useState('');
  const [primary,    setPrimary]    = useState<PrimaryFilter>('all');
  const [churchFilter,  setChurchFilter]  = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');

  // ── 데이터 로드 ────────────────────────────────────────────────────────────
  const allParticipants = useParticipants();

  useEffect(() => {
    const timer = window.setTimeout(() => setCheckInMap(sharedCheckInMap), 0);
    return () => window.clearTimeout(timer);
  }, [sharedCheckInMap]);
  const active = useMemo(
    () => allParticipants.filter(p => p.status !== 'cancelled'),
    [allParticipants],
  );

  // ── 요약 통계 ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const checked      = active.filter(p => !!checkInMap[p.id]?.checkedIn).length;
    const stuTotal     = active.filter(isStudent).length;
    const stuChecked   = active.filter(p => isStudent(p) && !!checkInMap[p.id]?.checkedIn).length;
    const staffTotal   = active.filter(p => !isStudent(p)).length;
    const staffChecked = active.filter(p => !isStudent(p) && !!checkInMap[p.id]?.checkedIn).length;

    const vehicleBreakdown = VEHICLE_CONFIG.map(v => ({
      label:   v.id as string,
      total:   active.filter(p => p.busId === v.id).length,
      checked: active.filter(p => p.busId === v.id && !!checkInMap[p.id]?.checkedIn).length,
    }));
    const indTotal   = active.filter(p => p.busId === INDIVIDUAL_ID).length;
    const indChecked = active.filter(p => p.busId === INDIVIDUAL_ID && !!checkInMap[p.id]?.checkedIn).length;

    return {
      total: active.length,
      checked,
      pending: active.length - checked,
      stuTotal, stuChecked,
      staffTotal, staffChecked,
      vehicleBreakdown,
      indTotal, indChecked,
    };
  }, [active, checkInMap]);

  // ── 2차 필터 옵션 ─────────────────────────────────────────────────────────
  const churchOptions = useMemo(() => {
    const ids = [...new Set(active.map(p => p.church))].sort();
    return ids.map(id => ({ id, name: CHURCH_MAP.get(id) ?? id }));
  }, [active]);

  const vehicleOptions = useMemo(() => {
    const ids = [...new Set(active.map(p => p.busId).filter(Boolean))] as string[];
    return ids.sort();
  }, [active]);

  // ── 필터 적용 ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = active;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (CHURCH_MAP.get(p.church) ?? p.church).toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.parentPhone && p.parentPhone.includes(q)),
      );
    }

    switch (primary) {
      case 'checkedIn': list = list.filter(p => !!checkInMap[p.id]?.checkedIn); break;
      case 'pending':   list = list.filter(p => !checkInMap[p.id]?.checkedIn);  break;
      case 'students':  list = list.filter(isStudent);                           break;
      case 'staff':     list = list.filter(p => !isStudent(p));                  break;
    }

    if (churchFilter)  list = list.filter(p => p.church === churchFilter);
    if (vehicleFilter) list = list.filter(p => p.busId  === vehicleFilter);

    return list;
  }, [search, primary, churchFilter, vehicleFilter, active, checkInMap]);

  // ── 핸들러 ────────────────────────────────────────────────────────────────
  const handleToggle = useCallback((id: string) => {
    setCheckInMap(prev => {
      const next = toggleCheckIn(id, prev);
      saveCheckInMap(next);
      return next;
    });
  }, []);

  const handleBatchCheckIn = useCallback(() => {
    const targets = filtered.filter(p => !checkInMap[p.id]?.checkedIn);
    if (targets.length === 0) return;
    if (!window.confirm(`현재 표시된 미도착 ${targets.length}명을 모두 체크인 처리할까요?`)) return;
    const now = new Date().toISOString().slice(0, 19);
    setCheckInMap(prev => {
      const next = { ...prev };
      targets.forEach(p => { next[p.id] = { checkedIn: true, checkedInAt: now }; });
      saveCheckInMap(next);
      return next;
    });
  }, [filtered, checkInMap]);

  const handleBatchCancel = useCallback(() => {
    const targets = filtered.filter(p => !!checkInMap[p.id]?.checkedIn);
    if (targets.length === 0) return;
    if (!window.confirm(`현재 표시된 체크인 완료 ${targets.length}명의 체크인을 모두 취소할까요?`)) return;
    setCheckInMap(prev => {
      const next = { ...prev };
      targets.forEach(p => { delete next[p.id]; });
      saveCheckInMap(next);
      return next;
    });
  }, [filtered, checkInMap]);

  // ── 계산값 ────────────────────────────────────────────────────────────────
  const pct = stats.total > 0 ? Math.round(stats.checked / stats.total * 100) : 0;
  const hasFilters = primary !== 'all' || !!churchFilter || !!vehicleFilter || !!search;

  const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(240,188,120,0.28)',
    borderRadius: '10px',
    color: '#94a3b8',
    padding: '6px 10px',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer',
  };

  const STAT_BASE = 'rounded-xl p-3 flex flex-col gap-1';

  // ── 렌더 ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* ── 페이지 헤더 ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 0 14px rgba(16,185,129,0.35)' }}
          >
            <UserCheck size={18} className="text-[#101A3D]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#101A3D] leading-tight">현장 체크인</h1>
            <p className="text-[11px] text-slate-400">참가자 도착 여부 확인 · 실시간 현황</p>
          </div>
        </div>

        {/* 전체 진행률 */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">체크인 진행률</div>
            <div className="text-xl font-bold text-[#101A3D]">
              {stats.checked}<span className="text-sm text-slate-400 font-normal"> / {stats.total}명</span>
            </div>
          </div>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: `conic-gradient(#10b981 ${pct * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
              boxShadow: '0 0 0 3px rgba(255,255,255,0.05)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: '#EAF3FF' }}
            >
              <span className="text-[11px] font-bold text-green-400">{pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 검색창 (대형) ────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="이름, 교회, 연락처로 빠르게 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
          className="w-full pl-12 pr-12 py-4 rounded-2xl text-[#101A3D] placeholder-slate-500 outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(37, 99, 235,0.3)',
            fontSize: '16px',
            boxShadow: search ? '0 0 0 2px rgba(240,188,120,0.28)' : 'none',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#101A3D] transition-colors"
          >
            <XCircle size={18} />
          </button>
        )}
      </div>

      {/* ── 요약 통계 카드 ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">

        {/* 전체 인원 */}
        <div className={STAT_BASE} style={{ background: 'rgba(37, 99, 235,0.08)', border: '1px solid rgba(240,188,120,0.28)' }}>
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-[color:var(--eum-gold)]" />
            <span className="text-[11px] text-slate-400">전체 인원</span>
          </div>
          <span className="text-2xl font-bold text-[#101A3D]">{stats.total}</span>
          <span className="text-[10px] text-slate-500">취소 제외</span>
        </div>

        {/* 체크인 완료 */}
        <div className={STAT_BASE} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-green-400" />
            <span className="text-[11px] text-slate-400">체크인 완료</span>
          </div>
          <span className="text-2xl font-bold text-green-400">{stats.checked}</span>
          <div className="w-full h-1 rounded-full mt-0.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: '#10b981' }} />
          </div>
        </div>

        {/* 미도착 */}
        <div
          className={STAT_BASE}
          style={{
            background: stats.pending > 0 ? 'rgba(100,116,139,0.1)' : 'rgba(16,185,129,0.05)',
            border: `1px solid ${stats.pending > 0 ? 'rgba(100,116,139,0.2)' : 'rgba(16,185,129,0.15)'}`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-slate-400" />
            <span className="text-[11px] text-slate-400">미도착</span>
          </div>
          <span className="text-2xl font-bold text-slate-300">{stats.pending}</span>
          <span className="text-[10px] text-slate-500">대기 중</span>
        </div>

        {/* 학생 체크인 */}
        <div className={STAT_BASE} style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-blue-400" />
            <span className="text-[11px] text-slate-400">학생</span>
          </div>
          <span className="text-2xl font-bold text-[#101A3D]">
            {stats.stuChecked}<span className="text-sm text-slate-400 font-normal">/{stats.stuTotal}</span>
          </span>
          <span className="text-[10px] text-slate-500">체크인 완료</span>
        </div>

        {/* 교사/운영진 체크인 */}
        <div className={STAT_BASE} style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <div className="flex items-center gap-1.5">
            <UserCheck size={13} className="text-violet-400" />
            <span className="text-[11px] text-slate-400">교사/운영진</span>
          </div>
          <span className="text-2xl font-bold text-[#101A3D]">
            {stats.staffChecked}<span className="text-sm text-slate-400 font-normal">/{stats.staffTotal}</span>
          </span>
          <span className="text-[10px] text-slate-500">체크인 완료</span>
        </div>
      </div>

      {/* ── 차량별 도착 현황 ─────────────────────────────────────────────────── */}
      <div
        className="rounded-xl px-4 py-3 flex flex-wrap gap-3 items-center"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <span className="text-[11px] text-slate-500 font-medium">차량별 도착</span>
        {stats.vehicleBreakdown.map(v => (
          <div key={v.label} className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">{v.label}</span>
            <span className="text-[11px] font-bold text-[#101A3D]">{v.checked}</span>
            <span className="text-[10px] text-slate-600">/ {v.total}명</span>
            <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-1 rounded-full transition-all"
                style={{
                  width: v.total > 0 ? `${Math.round(v.checked / v.total * 100)}%` : '0%',
                  background: '#3B82F6',
                }}
              />
            </div>
          </div>
        ))}
        {stats.indTotal > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">개별이동</span>
            <span className="text-[11px] font-bold text-[#101A3D]">{stats.indChecked}</span>
            <span className="text-[10px] text-slate-600">/ {stats.indTotal}명</span>
          </div>
        )}
      </div>

      {/* ── 필터 영역 ────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* 1차 버튼 필터 */}
        <div className="flex flex-wrap gap-2">
          {PRIMARY_FILTERS.map(f => {
            const isActive = primary === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setPrimary(f.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: isActive ? 'rgba(16,185,129,0.2)'  : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isActive ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  color:  isActive ? '#6ee7b7' : '#94a3b8',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* 2차 드롭다운 */}
        <div className="flex flex-wrap gap-2">
          <select style={selectStyle} value={churchFilter} onChange={e => setChurchFilter(e.target.value)}>
            <option value="">교회 전체</option>
            {churchOptions.map(c => (
              <option key={c.id} value={c.id} style={{ background: '#F8FBFF' }}>{c.name}</option>
            ))}
          </select>

          <select style={selectStyle} value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)}>
            <option value="">차량 전체</option>
            {vehicleOptions.map(v => (
              <option key={v} value={v} style={{ background: '#F8FBFF' }}>{v}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={() => { setPrimary('all'); setChurchFilter(''); setVehicleFilter(''); setSearch(''); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* ── 결과 수 + 일괄 처리 ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[12px] text-slate-500">
          <span className="text-[color:var(--eum-gold)] font-bold">{filtered.length}</span>명 표시
          {filtered.length !== active.length && ` (전체 ${active.length}명 중)`}
        </div>

        <div className="flex gap-2">
          {/* 일괄 체크인 */}
          {filtered.some(p => !checkInMap[p.id]?.checkedIn) && (
            <button
              onClick={handleBatchCheckIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7' }}
            >
              <CheckCircle2 size={12} />
              현재 목록 전체 체크인
            </button>
          )}

          {/* 일괄 취소 */}
          {filtered.some(p => !!checkInMap[p.id]?.checkedIn) && (
            <button
              onClick={handleBatchCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
            >
              <XCircle size={12} />
              체크인 취소
            </button>
          )}
        </div>
      </div>

      {/* ── 참가자 카드 목록 ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div
          className="py-20 rounded-2xl text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Search size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            {search ? `"${search}"에 해당하는 참가자가 없습니다.` : '해당 조건의 참가자가 없습니다.'}
          </p>
          {hasFilters && (
            <button
              onClick={() => { setPrimary('all'); setChurchFilter(''); setVehicleFilter(''); setSearch(''); }}
              className="mt-3 text-xs text-[color:var(--eum-gold)] hover:underline"
            >
              필터 초기화
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(p => (
            <ParticipantCard
              key={p.id}
              p={p}
              entry={checkInMap[p.id]}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* ── 전체 완료 메시지 ─────────────────────────────────────────────────── */}
      {stats.pending === 0 && stats.total > 0 && (
        <div
          className="rounded-2xl py-5 text-center"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          <CheckCircle2 size={28} className="text-green-400 mx-auto mb-2" />
          <p className="text-green-300 font-bold text-base">전원 도착 완료!</p>
          <p className="text-green-500 text-sm mt-1">{stats.total}명 전원 체크인 완료</p>
        </div>
      )}
    </div>
  );
}
