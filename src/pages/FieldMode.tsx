import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Activity, RefreshCw, AlertTriangle, CheckCircle2,
  Users, Phone, UserCheck, Printer, Bus, BedDouble, HardDrive, PhoneCall,
} from 'lucide-react';
import { getDayDiff } from '../utils/checklistStorage';
import { useCheckInMap, useChecklistItems, useParticipants } from '../hooks/useSharedData';
import { computeCheckInStats } from '../utils/dashboardStats';
import { isStudent, GROUP_CONFIG } from '../utils/groupAssignment';
import { churches as masterChurches, rooms as masterRooms } from '../data/mockData';
import type { Participant, ChecklistItem } from '../types';
import type { PageKey } from '../components/Sidebar';

// ── 룩업 맵 ──────────────────────────────────────────────────────────────────────
const CHURCH_MAP = new Map(masterChurches.map(c => [c.id, c.name]));
const GROUP_MAP  = new Map<string, string>(GROUP_CONFIG.map(g => [g.id, g.name]));
const ROOM_MAP   = new Map(masterRooms.map(r => [r.id, `${r.building} ${r.name}`]));

// ── Props ──────────────────────────────────────────────────────────────────────
interface FieldModeProps {
  onNavigate: (page: PageKey) => void;
}

// ── 빠른 이동 설정 ──────────────────────────────────────────────────────────────
const QUICK_NAV: { key: PageKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'checkin',     label: '현장 체크인', icon: <UserCheck size={20} />, color: '#10b981' },
  { key: 'emergency',   label: '비상연락망',  icon: <PhoneCall size={20} />, color: '#ef4444' },
  { key: 'printcenter', label: '출력 센터',   icon: <Printer   size={20} />, color: '#3B82F6' },
  { key: 'vehicles',    label: '차량 배정',   icon: <Bus       size={20} />, color: '#f59e0b' },
  { key: 'rooms',       label: '방 배정',     icon: <BedDouble size={20} />, color: '#8b5cf6' },
  { key: 'datamanager', label: '데이터 백업', icon: <HardDrive size={20} />, color: '#3b82f6' },
];

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────
function getRoleLabel(p: Participant): string {
  if (p.role) return p.role;
  if (p.grade === '교사' || p.grade === '학부모' || p.grade === '운영진') return p.grade;
  return '학생';
}

function formatClock(d: Date): string {
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':');
}

function formatShort(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function isMissingContact(p: Participant): boolean {
  return isStudent(p)
    ? !p.parentPhone || p.parentPhone.trim() === ''
    : !p.phone || p.phone.trim() === '';
}

function hasSpecial(p: Participant): boolean {
  return p.dietType === 'allergy' || !!(p.notes && p.notes.trim());
}

// 체크리스트 항목 우선순위 색상
function ckItemColor(item: ChecklistItem): string {
  const d = getDayDiff(item.dueDate);
  if (d < 0) return '#ef4444';                   // 마감 지남 — red
  if (d <= 3) return '#f59e0b';                   // 임박 — amber
  if (item.status === 'inprogress') return '#3B82F6'; // 진행중 — cyan
  if (item.status === 'blocked')    return '#dc2626';  // 차단 — rose
  return '#64748b';                               // 대기 — slate
}

function ckItemTag(item: ChecklistItem): string {
  const d = getDayDiff(item.dueDate);
  if (d < 0) return `마감 ${Math.abs(d)}일 지남`;
  if (d === 0) return '오늘 마감';
  if (d <= 3) return `${d}일 후 마감`;
  if (item.status === 'inprogress') return '진행중';
  if (item.status === 'blocked')    return '차단됨';
  return '대기';
}

// 패널 공통 스타일
const PANEL = {
  background: 'rgba(255,255,255,0.05)',
  border:     '1px solid rgba(255,255,255,0.1)',
  boxShadow:  '0 4px 20px rgba(31,95,217,0.2)',
} as const;

const PANEL_HDR = 'flex items-center gap-2 mb-3 pb-2.5' as const;
const PANEL_HDR_BORDER = { borderBottom: '1px solid rgba(255,255,255,0.07)' } as const;

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
export default function FieldMode({ onNavigate }: FieldModeProps) {
  const [,            setTick]        = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [now,         setNow]         = useState(() => new Date());

  // ── 시계 (1초마다) ───────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── 자동 갱신 (30초) ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      setTick(t => t + 1);
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  // ── 수동 갱신 ────────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    setTick(t => t + 1);
    setLastUpdated(new Date());
  }, []);

  // ── 데이터 로드 (tick 변경 시 재실행) ────────────────────────────────────────
  const participants = useParticipants();
  const checkInMap   = useCheckInMap();
  const liveItems    = useChecklistItems();

  const active = useMemo(
    () => participants.filter(p => p.status !== 'cancelled'),
    [participants],
  );

  const ckInStats = useMemo(
    () => computeCheckInStats(participants, checkInMap),
    [participants, checkInMap],
  );

  // ── 미도착 명단 ───────────────────────────────────────────────────────────────
  const pendingList = useMemo(
    () => active.filter(p => !checkInMap[p.id]?.checkedIn),
    [active, checkInMap],
  );

  // ── 안전 주의 명단 ────────────────────────────────────────────────────────────
  const specialList  = useMemo(() => active.filter(hasSpecial),         [active]);
  const missingList  = useMemo(() => active.filter(isMissingContact),   [active]);
  const safetyCount  = useMemo(
    () => new Set([...specialList.map(p => p.id), ...missingList.map(p => p.id)]).size,
    [specialList, missingList],
  );

  // ── 체크리스트 주의 항목 ──────────────────────────────────────────────────────
  const attentionItems = useMemo(() => {
    return liveItems
      .filter(i => i.status !== 'done')
      .sort((a, b) => {
        const da = getDayDiff(a.dueDate);
        const db = getDayDiff(b.dueDate);
        const rankA = da < 0 ? 0 : da <= 3 ? 1 : 2;
        const rankB = db < 0 ? 0 : db <= 3 ? 1 : 2;
        if (rankA !== rankB) return rankA - rankB;
        return da - db;
      });
  }, [liveItems]);

  const overdueCount = useMemo(
    () => attentionItems.filter(i => getDayDiff(i.dueDate) < 0).length,
    [attentionItems],
  );
  const urgentCount = useMemo(
    () => attentionItems.filter(i => { const d = getDayDiff(i.dueDate); return d >= 0 && d <= 3; }).length,
    [attentionItems],
  );
  const todayNeedCount = overdueCount + urgentCount;

  // ── 상태 카드 색상 ────────────────────────────────────────────────────────────
  const pct = ckInStats.pct;
  const checkinColor = pct === 100 ? '#10b981' : pct >= 80 ? '#10b981' : pct >= 50 ? '#3B82F6' : '#f59e0b';

  // ── 렌더 ──────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* ══════ 헤더 ══════════════════════════════════════════════════════════════ */}
      <div
        className="rounded-2xl p-4 sm:p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235,0.12) 0%, rgba(37,99,235,0.1) 100%)',
          border: '1px solid rgba(37, 99, 235,0.25)',
        }}
      >
        {/* 제목 행 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#3B82F6,#2563eb)', boxShadow: '0 0 18px rgba(37, 99, 235,0.4)' }}
            >
              <Activity size={22} className="text-[#101A3D]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#101A3D] leading-tight">현장 운영 모드</h1>
              <p className="text-[11px] text-[color:var(--eum-gold)] mt-0.5">수련회 현장 실시간 운영 현황</p>
            </div>
          </div>

          {/* 시계 */}
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-black text-[#101A3D] tabular-nums">{formatClock(now)}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {now.getFullYear()}.{String(now.getMonth()+1).padStart(2,'0')}.{String(now.getDate()).padStart(2,'0')}
            </div>
          </div>
        </div>

        {/* 갱신 컨트롤 행 */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-[11px] text-slate-400">
            마지막 갱신: <span className="text-[color:var(--eum-gold)] font-semibold">{formatShort(lastUpdated)}</span>
          </span>

          {/* 수동 갱신 버튼 */}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: 'rgba(37, 99, 235,0.15)', border: '1px solid rgba(37, 99, 235,0.3)', color: 'var(--eum-gold)' }}
          >
            <RefreshCw size={12} />
            지금 갱신
          </button>

          {/* 자동 갱신 토글 */}
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: autoRefresh ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${autoRefresh ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: autoRefresh ? '#6ee7b7' : '#64748b',
            }}
          >
            <div
              className="w-7 h-3.5 rounded-full relative transition-all"
              style={{ background: autoRefresh ? '#10b981' : 'rgba(255,255,255,0.15)' }}
            >
              <div
                className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all"
                style={{ left: autoRefresh ? '14px' : '2px' }}
              />
            </div>
            30초 자동갱신
          </button>
        </div>
      </div>

      {/* ══════ 상황 카드 (5개) ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">

        {/* 전체 인원 */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(37, 99, 235,0.08)', border: '1px solid rgba(47,115,242,0.28)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-[color:var(--eum-gold)]" />
            <span className="text-[11px] text-slate-400">전체 인원</span>
          </div>
          <div className="text-3xl font-black text-[#101A3D] tabular-nums">{ckInStats.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">취소 제외</div>
        </div>

        {/* 체크인 완료 */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-green-400" />
            <span className="text-[11px] text-slate-400">체크인 완료</span>
          </div>
          <div className="text-3xl font-black tabular-nums" style={{ color: checkinColor }}>{ckInStats.checked}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{pct}% 도착</div>
        </div>

        {/* 미도착 */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: ckInStats.pending === 0 ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.1)',
            border: `1px solid ${ckInStats.pending === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.25)'}`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className={ckInStats.pending === 0 ? 'text-green-400' : 'text-amber-400'} />
            <span className="text-[11px] text-slate-400">미도착</span>
          </div>
          <div className="text-3xl font-black tabular-nums" style={{ color: ckInStats.pending === 0 ? '#10b981' : '#fbbf24' }}>
            {ckInStats.pending}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{ckInStats.pending === 0 ? '전원 도착!' : '아직 미도착'}</div>
        </div>

        {/* 오늘 확인 필요 */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: todayNeedCount === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(245,158,11,0.1)',
            border: `1px solid ${todayNeedCount === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(245,158,11,0.28)'}`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className={todayNeedCount > 0 ? 'text-amber-400' : 'text-slate-500'} />
            <span className="text-[11px] text-slate-400">오늘 확인 필요</span>
          </div>
          <div className="text-3xl font-black tabular-nums" style={{ color: todayNeedCount > 0 ? '#fbbf24' : '#94a3b8' }}>
            {todayNeedCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {overdueCount > 0 ? `지남 ${overdueCount}건` : ''}{overdueCount > 0 && urgentCount > 0 ? ' / ' : ''}{urgentCount > 0 ? `임박 ${urgentCount}건` : ''}
            {todayNeedCount === 0 ? '이상 없음' : ''}
          </div>
        </div>

        {/* 주의 인원 */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: safetyCount === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${safetyCount === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.25)'}`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Phone size={14} className={safetyCount > 0 ? 'text-red-400' : 'text-slate-500'} />
            <span className="text-[11px] text-slate-400">주의 인원</span>
          </div>
          <div className="text-3xl font-black tabular-nums" style={{ color: safetyCount > 0 ? '#f87171' : '#94a3b8' }}>
            {safetyCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">알레르기·연락처 누락</div>
        </div>
      </div>

      {/* ══════ 메인 2단 그리드 ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* ── 왼쪽 컬럼 ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* 패널: 등록 현황 */}
          <div className="rounded-2xl p-4" style={PANEL}>
            <div className={PANEL_HDR} style={PANEL_HDR_BORDER}>
              <CheckCircle2 size={16} className="text-green-400" />
              <h3 className="text-sm font-bold text-[#101A3D]">등록 현황</h3>
              <span className="ml-auto text-lg font-black tabular-nums" style={{ color: checkinColor }}>
                {pct}%
              </span>
            </div>

            {/* 전체 진행 바 */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">전체 체크인</span>
                <span className="font-semibold text-[#101A3D] tabular-nums">{ckInStats.checked} / {ckInStats.total}명</span>
              </div>
              <div className="h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${checkinColor}, ${pct === 100 ? '#34d399' : checkinColor})` }}
                />
              </div>
            </div>

            {/* 학생 / 교사 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: '학생', checked: ckInStats.stuChecked, total: ckInStats.stuTotal, color: '#3b82f6' },
                { label: '교사·운영진', checked: ckInStats.staffChecked, total: ckInStats.staffTotal, color: '#8b5cf6' },
              ].map(g => (
                <div key={g.label} className="rounded-xl px-3 py-2.5"
                  style={{ background: `${g.color}10`, border: `1px solid ${g.color}25` }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] text-slate-400">{g.label}</span>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: g.color }}>
                      {g.total > 0 ? Math.round(g.checked / g.total * 100) : 0}%
                    </span>
                  </div>
                  <div className="text-base font-black text-[#101A3D] tabular-nums">
                    {g.checked}<span className="text-slate-400 text-xs font-normal">/{g.total}명</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 차량별 */}
            {ckInStats.vehicleBreakdown.length > 0 && (
              <div>
                <div className="text-[10px] text-slate-500 mb-2">차량별 도착</div>
                <div className="space-y-2">
                  {ckInStats.vehicleBreakdown.map(v => (
                    <div key={v.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">{v.label}</span>
                        <span className="tabular-nums text-slate-400">{v.checked}/{v.total}명 · <span style={{ color: v.pct === 100 ? '#10b981' : '#f59e0b' }}>{v.pct}%</span></span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${v.pct}%`, background: v.pct === 100 ? '#10b981' : '#3B82F6' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 패널: 미도착 명단 */}
          <div className="rounded-2xl p-4" style={PANEL}>
            <div className={PANEL_HDR} style={PANEL_HDR_BORDER}>
              <AlertTriangle size={16} className={pendingList.length > 0 ? 'text-amber-400' : 'text-green-400'} />
              <h3 className="text-sm font-bold text-[#101A3D]">미도착 명단</h3>
              <span
                className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                style={pendingList.length > 0
                  ? { color: '#fbbf24', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }
                  : { color: '#10b981', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }
                }
              >
                {pendingList.length}명
              </span>
            </div>

            {pendingList.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 size={28} className="text-green-400 mx-auto mb-2" />
                <p className="text-green-300 font-bold">전원 도착 완료!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {pendingList.map(p => {
                  const churchName = CHURCH_MAP.get(p.church) ?? p.church;
                  const role       = getRoleLabel(p);
                  const isStud     = isStudent(p);
                  const groupName  = p.groupId ? (GROUP_MAP.get(p.groupId) ?? '-') : '-';
                  const roomName   = p.roomId  ? (ROOM_MAP.get(p.roomId)  ?? '-') : '-';
                  const vehicle    = p.busId ?? '미배정';
                  const phone      = isStud ? p.parentPhone : p.phone;
                  return (
                    <div
                      key={p.id}
                      className="rounded-xl px-3 py-2.5"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-bold text-[#101A3D]">{p.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                              style={{
                                background: isStud ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                                color:      isStud ? '#93c5fd' : '#c4b5fd',
                              }}>
                              {role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {churchName} · {vehicle} · 조: {groupName} · 방: {roomName}
                          </div>
                        </div>
                        {phone && phone.trim() && (
                          <a
                            href={`tel:${phone}`}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold flex-shrink-0 transition-all hover:opacity-80"
                            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }}
                          >
                            <Phone size={11} />
                            전화
                          </a>
                        )}
                      </div>
                      {phone && phone.trim() && (
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">{phone}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── 오른쪽 컬럼 ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* 패널: 안전 주의 명단 */}
          <div className="rounded-2xl p-4" style={PANEL}>
            <div className={PANEL_HDR} style={PANEL_HDR_BORDER}>
              <AlertTriangle size={16} className={safetyCount > 0 ? 'text-red-400' : 'text-slate-500'} />
              <h3 className="text-sm font-bold text-[#101A3D]">안전 주의 명단</h3>
              <span
                className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                style={safetyCount > 0
                  ? { color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)' }
                  : { color: '#64748b', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }
                }
              >
                {safetyCount}명
              </span>
            </div>

            {safetyCount === 0 ? (
              <div className="py-6 text-center text-slate-500 text-sm">주의 인원 없음</div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {/* 알레르기/특이사항 */}
                {specialList.length > 0 && (
                  <div>
                    <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1.5">
                      알레르기 / 특이사항 ({specialList.length}명)
                    </div>
                    <div className="space-y-1.5">
                      {specialList.map(p => (
                        <div key={p.id} className="rounded-xl px-3 py-2"
                          style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#101A3D]">{p.name}</span>
                            <span className="text-[10px] text-slate-400">{CHURCH_MAP.get(p.church) ?? p.church}</span>
                          </div>
                          {p.dietType === 'allergy' && (
                            <div className="text-[11px] text-amber-400 mt-0.5">
                              ⚠ 알레르기{p.allergies ? `: ${p.allergies}` : ''}
                            </div>
                          )}
                          {p.notes && p.notes.trim() && (
                            <div className="text-[11px] text-slate-400 mt-0.5">📝 {p.notes}</div>
                          )}
                          {isStudent(p) && p.parentPhone && (
                            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">보호자: {p.parentPhone}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 연락처 누락 */}
                {missingList.length > 0 && (
                  <div>
                    <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1.5">
                      연락처 누락 ({missingList.length}명)
                    </div>
                    <div className="space-y-1.5">
                      {missingList.map(p => {
                        const isStud = isStudent(p);
                        const role   = getRoleLabel(p);
                        const phone  = isStud ? p.parentPhone : p.phone;
                        return (
                          <div key={p.id} className="rounded-xl px-3 py-2"
                            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-[#101A3D]">{p.name}</span>
                              <span className="text-[10px] text-slate-400">{CHURCH_MAP.get(p.church) ?? p.church}</span>
                              <span className="text-[10px] px-1 py-0.5 rounded"
                                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                                {role}
                              </span>
                            </div>
                            <div className="text-[11px] text-red-400 mt-0.5">
                              {isStud ? '보호자 연락처 누락' : '본인 연락처 누락'}
                            </div>
                            {phone && phone.trim() && (
                              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">{phone}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 패널: 체크리스트 미완료 */}
          <div className="rounded-2xl p-4" style={PANEL}>
            <div className={PANEL_HDR} style={PANEL_HDR_BORDER}>
              <Users size={16} className={overdueCount > 0 ? 'text-red-400' : urgentCount > 0 ? 'text-amber-400' : 'text-slate-400'} />
              <h3 className="text-sm font-bold text-[#101A3D]">체크리스트 미완료</h3>
              <span className="ml-auto text-xs text-slate-400 font-semibold tabular-nums">
                {attentionItems.length}건
              </span>
            </div>

            {attentionItems.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle2 size={24} className="text-green-400 mx-auto mb-2" />
                <p className="text-green-300 text-sm font-semibold">모든 항목 완료!</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {attentionItems.map(item => {
                  const color = ckItemColor(item);
                  const tag   = ckItemTag(item);
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl px-3 py-2.5"
                      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}30` }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-semibold text-[#101A3D] truncate">{item.title}</span>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                              style={{ color, background: `${color}18`, border: `1px solid ${color}35` }}
                            >
                              {tag}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            담당: {item.assignee}
                            <span className="mx-1.5">·</span>
                            마감: {item.dueDate}
                            {item.category && <><span className="mx-1.5">·</span>{item.category}</>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════ 빠른 이동 ════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl p-4" style={PANEL}>
        <div className={PANEL_HDR} style={PANEL_HDR_BORDER}>
          <Activity size={15} className="text-[color:var(--eum-gold)]" />
          <h3 className="text-sm font-bold text-[#101A3D]">빠른 이동</h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_NAV.map(item => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className="flex flex-col items-center gap-2 px-3 py-4 rounded-xl transition-all hover:opacity-80 active:scale-95"
              style={{
                background: `${item.color}12`,
                border: `1px solid ${item.color}30`,
              }}
            >
              <span style={{ color: item.color }}>{item.icon}</span>
              <span className="text-[11px] font-semibold text-slate-300 text-center leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
