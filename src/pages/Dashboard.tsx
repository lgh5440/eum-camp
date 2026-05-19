import { useMemo } from 'react';
import { MapPin, Calendar, Shield, AlertTriangle, UserCheck } from 'lucide-react';
import { calculateChecklistStats } from '../utils/checklistStorage';
import {
  useCheckInMap, useChecklistItems, useParticipants,
  useChurchConfig, useGroupMeta, useRoomConfig,
  useScheduleItems, useSafetyItems,
} from '../hooks/useSharedData';
import { computeStats, computeCheckInStats } from '../utils/dashboardStats';
import { resolveChurchId } from '../utils/churchIdentity';
import { EVENT, computeDday } from '../data/eventInfo';
import { type PageKey } from '../components/Sidebar';
import type { ChecklistItem, Schedule } from '../types';

// ── 정적 데이터 ──────────────────────────────────────────────────────────────

const CARD_PALETTE = ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];
const DAY_ACCENTS = ['#8b5cf6', '#06b6d4', '#3b82f6', '#10b981', '#f59e0b'];
const DOW_KO = ['일', '월', '화', '수', '목', '금', '토'];

const SC: Record<ChecklistItem['status'], { label: string; color: string; bg: string }> = {
  done:       { label: '완료',  color: '#10b981', bg: 'rgba(16,185,129,0.18)' },
  inprogress: { label: '진행중', color: '#06b6d4', bg: 'rgba(6,182,212,0.18)' },
  pending:    { label: '대기',  color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  blocked:    { label: '차단',  color: '#ef4444', bg: 'rgba(239,68,68,0.18)' },
};

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────────────

function DonutChart({ pct }: { pct: number }) {
  const r    = 26;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct === 100 ? '#10b981' : pct >= 60 ? '#06b6d4' : '#f59e0b';
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg width={64} height={64} viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx={32} cy={32} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={7} />
        <circle cx={32} cy={32} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-black" style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
}

function CircuitDecoration() {
  return (
    <svg width="210" height="170" viewBox="0 0 210 170" fill="none" className="opacity-40">
      <line x1="0"   y1="28"  x2="210" y2="28"  stroke="#06b6d4" strokeWidth="1" strokeDasharray="5 5" />
      <line x1="0"   y1="72"  x2="160" y2="72"  stroke="#3b82f6" strokeWidth="1" strokeDasharray="5 5" />
      <line x1="50"  y1="120" x2="210" y2="120" stroke="#06b6d4" strokeWidth="1" strokeDasharray="5 5" />
      <line x1="50"  y1="0"   x2="50"  y2="170" stroke="#06b6d4" strokeWidth="1" strokeDasharray="5 5" />
      <line x1="130" y1="0"   x2="130" y2="90"  stroke="#3b82f6" strokeWidth="1" strokeDasharray="5 5" />
      <line x1="170" y1="70"  x2="170" y2="170" stroke="#06b6d4" strokeWidth="1" strokeDasharray="5 5" />
      {[[50, 28], [130, 72], [170, 120], [50, 120]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3} fill="#06b6d4">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite" />
        </circle>
      ))}
      <rect x="82" y="46" width="56" height="36" rx="5"
        stroke="#06b6d4" strokeWidth="1.5" fill="rgba(6,182,212,0.08)" />
      <text x="110" y="68" textAnchor="middle" fill="#67e8f9" fontSize="9" fontFamily="monospace" fontWeight="bold">AI</text>
      <rect x="18"  y="110" width="10" height="10" rx="2" stroke="#3b82f6" strokeWidth="1" fill="rgba(59,130,246,0.1)" />
      <rect x="185" y="40"  width="12" height="12" rx="2" stroke="#8b5cf6" strokeWidth="1" fill="rgba(139,92,246,0.1)" />
    </svg>
  );
}

function HeroDecoration() {
  return (
    <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
      <div className="relative w-12 h-16">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-2.5 h-full rounded-full"
          style={{
            background: 'linear-gradient(to bottom, rgba(6,182,212,0.95), rgba(59,130,246,0.4))',
            boxShadow: '0 0 20px rgba(6,182,212,0.8), 0 0 40px rgba(6,182,212,0.4)',
          }} />
        <div className="absolute top-4 left-0 w-full h-2.5 rounded-full"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(6,182,212,0.95), transparent)',
            boxShadow: '0 0 20px rgba(6,182,212,0.8), 0 0 40px rgba(6,182,212,0.4)',
          }} />
      </div>

      <div
        className="w-36 h-24 rounded-2xl flex flex-col items-center justify-center gap-2 relative overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(6,182,212,0.4)',
          boxShadow: '0 0 28px rgba(240,188,120,0.28), inset 0 0 20px rgba(6,182,212,0.05)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: 'linear-gradient(to right, transparent, rgba(6,182,212,0.6), transparent)' }} />
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{ background: 'rgba(240,188,120,0.28)', border: '1px solid rgba(6,182,212,0.4)' }}>
          👤
        </div>
        <div className="space-y-1 w-full px-4">
          <div className="h-1.5 rounded-full w-full" style={{ background: 'rgba(6,182,212,0.5)' }} />
          <div className="h-1.5 rounded-full w-3/4"  style={{ background: 'rgba(6,182,212,0.25)' }} />
          <div className="h-1.5 rounded-full w-1/2"  style={{ background: 'rgba(6,182,212,0.15)' }} />
        </div>
      </div>

      <div className="hidden xl:block">
        <CircuitDecoration />
      </div>
    </div>
  );
}

// ── 카드 공통 스타일 ─────────────────────────────────────────────────────────

const CARD = {
  background: 'rgba(255,255,255,0.07)',
  border:     '1px solid rgba(255,255,255,0.12)',
  boxShadow:  '0 4px 24px rgba(0,0,0,0.25)',
} as const;

const CARD_HEADER       = 'flex items-center gap-2 mb-3.5 pb-2.5' as const;
const CARD_HEADER_STYLE = { borderBottom: '1px solid rgba(255,255,255,0.07)' } as const;

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

interface DashboardProps {
  onNavigate: (page: PageKey) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const participants  = useParticipants();
  const stats         = useMemo(() => computeStats(participants), [participants]);
  const checkInMap    = useCheckInMap();
  const ckInStats     = useMemo(() => computeCheckInStats(participants, checkInMap), [participants, checkInMap]);
  const liveItems     = useChecklistItems();
  const ckStats       = useMemo(() => calculateChecklistStats(liveItems), [liveItems]);
  const previewItems  = useMemo(() => liveItems.slice(0, 6), [liveItems]);
  const dday          = useMemo(() => computeDday(), []);

  // ── 실시간 데이터 (참가자 관리/조 편성/방 배정과 동기화) ─────────────────────
  const churchConfigs = useChurchConfig();
  const groupMeta     = useGroupMeta();
  const roomConfig    = useRoomConfig();
  const scheduleItems = useScheduleItems();
  const safetyItems   = useSafetyItems();

  // 교회별 신청 현황 (참가자 status !== cancelled 만 카운트)
  // p.church가 ID 또는 이름으로 저장될 수 있어 resolveChurchId로 정규화 후 카운트
  const churchBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of participants) {
      if (p.status === 'cancelled') continue;
      const cid = resolveChurchId(p.church, churchConfigs);
      counts.set(cid, (counts.get(cid) ?? 0) + 1);
    }
    return churchConfigs.map((c, i) => ({
      id:    c.id,
      name:  c.name,
      count: counts.get(c.id) ?? 0,
      quota: c.quota || 0,
      color: CARD_PALETTE[i % CARD_PALETTE.length],
    }));
  }, [churchConfigs, participants]);

  // 일정 (day별로 그룹핑, 시간순 정렬, 상위 4개)
  const scheduleByDay = useMemo(() => {
    const byDay = new Map<number, Schedule[]>();
    for (const item of scheduleItems) {
      const list = byDay.get(item.day) ?? [];
      list.push(item);
      byDay.set(item.day, list);
    }
    const days = Array.from(byDay.keys()).sort((a, b) => a - b);
    return days.map((dayNum, idx) => {
      const items = (byDay.get(dayNum) ?? [])
        .sort((a, b) => a.time.localeCompare(b.time))
        .slice(0, 4);
      // 행사 시작일 + dayNum-1 일로 날짜 계산
      const [sy, sm, sd] = EVENT.startDate.split('-').map(Number);
      const date = new Date(sy, sm - 1, sd + dayNum - 1);
      const dateLabel = `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}(${DOW_KO[date.getDay()]})`;
      return {
        day:    `${dayNum}일차`,
        date:   dateLabel,
        accent: DAY_ACCENTS[idx % DAY_ACCENTS.length],
        items:  items.map(it => ({ t: it.time, v: it.title })),
      };
    });
  }, [scheduleItems]);

  // 조 편성 현황 (groupMeta + 참가자 groupId로 카운트)
  const groupBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of participants) {
      if (p.status === 'cancelled' || !p.groupId) continue;
      counts.set(p.groupId, (counts.get(p.groupId) ?? 0) + 1);
    }
    const totalAssigned = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    return {
      groups: groupMeta.map((g, i) => ({
        id:     g.id,
        name:   g.name,
        leader: g.leaderName || '-',
        count:  counts.get(g.id) ?? 0,
        color:  g.color || CARD_PALETTE[i % CARD_PALETTE.length],
      })),
      totalAssigned,
    };
  }, [groupMeta, participants]);

  // 방 배정 현황 (roomConfig + 참가자 roomId 카운트)
  const roomBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of participants) {
      if (p.status === 'cancelled' || !p.roomId) continue;
      counts.set(p.roomId, (counts.get(p.roomId) ?? 0) + 1);
    }
    const rooms = roomConfig.slice(0, 4).map(r => ({
      id:       r.id,
      name:     r.name,
      cap:      r.capacity,
      assigned: counts.get(r.id) ?? 0,
    }));
    const totalSlack = roomConfig.reduce((sum, r) => sum + Math.max(0, r.capacity - (counts.get(r.id) ?? 0)), 0);
    return { rooms, totalSlack };
  }, [roomConfig, participants]);

  // 안전 관리 (실 데이터 — 알레르기·복용약은 참가자, 나머지는 safetyItems 상태)
  const safetyBreakdown = useMemo(() => {
    const allergyN = stats.allergyCount;
    const medicationN = participants.filter(p =>
      p.status !== 'cancelled' && (p.dietType === 'allergy' || (p as { medication?: string }).medication)
    ).length - allergyN;
    const safetyDone = safetyItems.filter(s => s.status === 'normal').length;
    const safetyTotal = safetyItems.length;
    return [
      { label: '알레르기',   value: allergyN > 0 ? `${allergyN}명` : '0명',
        color: allergyN > 0 ? '#ef4444' : '#10b981', emoji: '🚨' },
      { label: '복용약',     value: medicationN > 0 ? `${medicationN}명` : '0명',
        color: medicationN > 0 ? '#f59e0b' : '#10b981', emoji: '💊' },
      { label: '응급연락망',  value: stats.total > 0 ? '완료' : '대기',
        color: stats.total > 0 ? '#10b981' : '#94a3b8', emoji: '📞' },
      { label: '안전점검',    value: safetyTotal > 0 ? `${safetyDone}/${safetyTotal}` : '대기',
        color: safetyTotal > 0 && safetyDone === safetyTotal ? '#10b981' : '#06b6d4', emoji: '🛡️' },
    ];
  }, [stats.allergyCount, stats.total, participants, safetyItems]);

  const warnings: { label: string; level: 'warn' | 'danger' }[] = [];
  if (stats.unassignedGroup > 0)   warnings.push({ label: `조 미배정 ${stats.unassignedGroup}명`,     level: 'warn' });
  if (stats.unassignedRoom > 0)    warnings.push({ label: `방 미배정 ${stats.unassignedRoom}명`,      level: 'warn' });
  if (stats.unassignedVehicle > 0) warnings.push({ label: `차량 미배정 ${stats.unassignedVehicle}명`, level: 'warn' });
  if (stats.unpaidFeeCount > 0)    warnings.push({ label: `미납 ${stats.unpaidFeeCount}명`,           level: 'warn' });
  if (stats.allergyCount > 0)      warnings.push({ label: `알레르기 ${stats.allergyCount}명`,          level: 'danger' });

  return (
    <div className="space-y-4">

      {/* ═══════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════ */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(37,99,235,0.25) 45%, rgba(109,40,217,0.2) 80%, rgba(139,92,246,0.12) 100%)',
          border: '1px solid rgba(6,182,212,0.25)',
          boxShadow: '0 0 80px rgba(6,182,212,0.08), inset 0 0 120px rgba(37,99,235,0.06)',
        }}
      >
        <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(240,140,40,0.10) 0%, transparent 65%)' }} />
        <div className="absolute -bottom-20 -left-12 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 60%)' }} />

        <div className="relative z-10 flex items-center justify-between gap-6 px-7 sm:px-10 py-8 sm:py-10">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="px-3 py-1 rounded-full text-[11px] font-bold"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1' }}
              >
                {EVENT.title}
              </span>
              <span
                className="px-3 py-1 rounded-full text-xs font-black tracking-wide"
                style={{ background: dday.bg, border: `1px solid ${dday.border}`, color: dday.color }}
              >
                {dday.text}
              </span>
            </div>

            <h1 className="font-black text-white tracking-tight leading-none mb-2"
              style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
              {EVENT.theme}
            </h1>
            <p className="font-bold" style={{ color: '#F0BC78', fontSize: 'clamp(0.85rem, 2vw, 1.25rem)' }}>
              {EVENT.subTheme}
            </p>

            <div className="flex flex-wrap gap-4 mt-4 text-xs sm:text-sm text-slate-300">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-[color:var(--eum-gold)] flex-shrink-0" />
                {EVENT.venue}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-[color:var(--eum-gold)] flex-shrink-0" />
                {EVENT.dates}
              </span>
            </div>
          </div>

          <HeroDecoration />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          요약 카드 6개 (실데이터)
      ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">

        {[
          { label: '전체 인원',    value: String(stats.total),        unit: '명',  color: '#06b6d4', emoji: '👥' },
          { label: '학생',         value: String(stats.studentCount),  unit: '명',  color: '#10b981', emoji: '🎓' },
          { label: '참여 교회',    value: String(stats.churchCount),   unit: '개',  color: '#3b82f6', emoji: '⛪' },
          { label: '교사/운영진',  value: String(stats.staffCount),    unit: '명',  color: '#f59e0b', emoji: '👤' },
          { label: '조 배정률',    value: String(stats.groupPct),      unit: '%',   color: '#8b5cf6', emoji: '🏷️' },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-2xl p-3 sm:p-4 flex items-center gap-3"
            style={{
              background: `linear-gradient(135deg, ${s.color}14 0%, rgba(255,255,255,0.04) 100%)`,
              border: `1px solid ${s.color}30`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: `${s.color}22` }}>
              {s.emoji}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 whitespace-nowrap">{s.label}</div>
              <div className="font-black leading-tight" style={{ color: s.color, fontSize: '1.35rem' }}>
                {s.value}
                <span className="text-[11px] font-semibold ml-0.5 text-slate-300">{s.unit}</span>
              </div>
            </div>
          </div>
        ))}

        {/* 준비 진행률 도넛 차트 */}
        <div
          className="rounded-2xl p-3 sm:p-4 flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.14) 0%, rgba(255,255,255,0.04) 100%)',
            border: '1px solid rgba(6,182,212,0.3)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          <DonutChart pct={ckStats.pct} />
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400">준비 진행률</div>
            <div className="font-black text-white leading-tight" style={{ fontSize: '1.15rem' }}>
              {ckStats.doneCount}
              <span className="text-xs font-medium text-slate-400">/{ckStats.total}</span>
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
              {ckStats.overdueCount > 0 && (
                <span className="text-[9px] font-semibold" style={{ color: '#ef4444' }}>
                  지남 {ckStats.overdueCount}건
                </span>
              )}
              {ckStats.urgentCount > 0 && (
                <span className="text-[9px] font-semibold" style={{ color: '#f59e0b' }}>
                  임박 {ckStats.urgentCount}건
                </span>
              )}
              {ckStats.overdueCount === 0 && ckStats.urgentCount === 0 && (
                <span className="text-[9px] text-slate-500">마감 여유</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          운영 준비 현황 패널
      ═══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl p-4 sm:p-5" style={CARD}>

        {/* 헤더 + 경고 배지 */}
        <div className="flex flex-wrap items-center gap-2 mb-4 pb-2.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
            style={{ background: 'rgba(240,188,120,0.28)' }}>📊</span>
          <h3 className="text-sm font-bold text-white">운영 준비 현황</h3>

          {warnings.length === 0 ? (
            <span className="ml-1 text-[10px] font-semibold" style={{ color: '#10b981' }}>
              ✓ 모든 배정 완료
            </span>
          ) : (
            <div className="ml-auto flex items-center gap-1.5 flex-wrap justify-end">
              {warnings.map(w => (
                <span
                  key={w.label}
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
                  style={w.level === 'danger'
                    ? { color: '#ef4444', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }
                    : { color: '#f59e0b', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }
                  }
                >
                  {w.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 5개 진행률 바 — 각각 클릭 시 해당 페이지로 이동 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {([
            { label: '조 편성',    current: stats.groupAssigned,   total: stats.groupTotal,   pct: stats.groupPct,   unit: '학생', color: '#8b5cf6', page: 'groups' },
            { label: '방 배정',    current: stats.roomAssigned,    total: stats.roomTotal,    pct: stats.roomPct,    unit: '학생', color: '#10b981', page: 'rooms' },
            { label: '차량 배정',  current: stats.vehicleAssigned, total: stats.vehicleTotal, pct: stats.vehiclePct, unit: '인원', color: '#3b82f6', page: 'vehicles' },
            { label: '참가비 납부', current: stats.feePaid,         total: stats.feeTotal,     pct: stats.feePct,     unit: '인원', color: '#f59e0b', page: 'participants' },
            { label: '체크리스트', current: ckStats.doneCount,     total: ckStats.total,      pct: ckStats.pct,      unit: '건',   color: '#06b6d4', page: 'checklist' },
          ] as const).map(item => {
            const barColor = item.pct === 100 ? '#10b981' : item.pct >= 60 ? item.color : '#f59e0b';
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavigate(item.page as PageKey)}
                className="rounded-xl px-3 py-3 text-left transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                aria-label={`${item.label} 페이지로 이동`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">{item.label}</span>
                  <span className="text-xs font-black tabular-nums" style={{ color: barColor }}>{item.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.pct}%`, background: barColor }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 tabular-nums mt-1.5">
                  {item.current} / {item.total} {item.unit}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          현장 체크인 현황
      ═══════════════════════════════════════════════════════ */}
      {(() => {
        const ci    = ckInStats;
        const pct   = ci.pct;
        const barColor  = pct === 100 ? '#10b981' : pct >= 80 ? '#10b981' : pct >= 50 ? '#06b6d4' : '#f59e0b';
        const panelStyle = pct === 100
          ? { background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(255,255,255,0.04) 100%)', border: '1px solid rgba(16,185,129,0.35)', boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }
          : CARD;

        return (
          <div className="rounded-2xl p-4 sm:p-5" style={panelStyle}>

            {/* ── 헤더 ─────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2 mb-4 pb-2.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(16,185,129,0.2)' }}>
                <UserCheck size={15} className="text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white">현장 체크인 현황</h3>

              {/* 상태 배지 */}
              {pct === 100 ? (
                <span className="text-[11px] font-bold ml-1" style={{ color: '#10b981' }}>
                  🎉 전원 도착 완료!
                </span>
              ) : ci.pending > 0 ? (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={pct < 50
                    ? { color: '#fbbf24', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }
                    : { color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)' }
                  }
                >
                  미도착 {ci.pending}명
                </span>
              ) : null}

              {/* 전체 진행 바 */}
              <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                <div className="w-28 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>
                <span className="text-xs font-black tabular-nums" style={{ color: barColor }}>{pct}%</span>
              </div>
            </div>

            {/* ── 상단 통계 4개 ─────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">

              {/* 체크인 완료 */}
              <div className="rounded-xl px-3 py-3"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="text-[10px] text-slate-400 mb-0.5">체크인 완료</div>
                <div className="font-black tabular-nums leading-tight" style={{ color: '#10b981', fontSize: '1.4rem' }}>
                  {ci.checked}
                  <span className="text-[11px] font-semibold text-slate-400 ml-0.5">명</span>
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">/ 전체 {ci.total}명</div>
              </div>

              {/* 미도착 */}
              <div className="rounded-xl px-3 py-3"
                style={{
                  background: ci.pending === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(245,158,11,0.07)',
                  border: `1px solid ${ci.pending === 0 ? 'rgba(255,255,255,0.07)' : 'rgba(245,158,11,0.22)'}`,
                }}>
                <div className="text-[10px] text-slate-400 mb-0.5">미도착</div>
                <div
                  className="font-black tabular-nums leading-tight"
                  style={{ color: ci.pending === 0 ? '#10b981' : pct < 50 ? '#fbbf24' : '#94a3b8', fontSize: '1.4rem' }}
                >
                  {ci.pending}
                  <span className="text-[11px] font-semibold text-slate-400 ml-0.5">명</span>
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  {ci.pending === 0 ? '전원 도착 ✓' : '아직 미도착'}
                </div>
              </div>

              {/* 학생 체크인 */}
              <div className="rounded-xl px-3 py-3"
                style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)' }}>
                <div className="text-[10px] text-slate-400 mb-0.5">학생 체크인</div>
                <div className="font-black tabular-nums leading-tight text-white" style={{ fontSize: '1.25rem' }}>
                  {ci.stuChecked}
                  <span className="text-sm font-semibold text-slate-400">/{ci.stuTotal}</span>
                  <span className="text-[11px] font-semibold text-slate-400 ml-0.5">명</span>
                </div>
                <div className="h-1 rounded-full mt-1.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${ci.stuTotal > 0 ? Math.round(ci.stuChecked / ci.stuTotal * 100) : 0}%`,
                    background: '#3b82f6',
                  }} />
                </div>
              </div>

              {/* 교사·운영진 체크인 */}
              <div className="rounded-xl px-3 py-3"
                style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)' }}>
                <div className="text-[10px] text-slate-400 mb-0.5">교사·운영진</div>
                <div className="font-black tabular-nums leading-tight text-white" style={{ fontSize: '1.25rem' }}>
                  {ci.staffChecked}
                  <span className="text-sm font-semibold text-slate-400">/{ci.staffTotal}</span>
                  <span className="text-[11px] font-semibold text-slate-400 ml-0.5">명</span>
                </div>
                <div className="h-1 rounded-full mt-1.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${ci.staffTotal > 0 ? Math.round(ci.staffChecked / ci.staffTotal * 100) : 0}%`,
                    background: '#8b5cf6',
                  }} />
                </div>
              </div>
            </div>

            {/* ── 차량별 도착 현황 ──────────────────────────── */}
            {ci.vehicleBreakdown.length > 0 && (
              <div>
                <div className="text-[10px] text-slate-500 font-medium mb-2">차량별 도착 현황</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                  {ci.vehicleBreakdown.map(v => {
                    const vColor = v.pct === 100 ? '#10b981' : v.pct >= 60 ? '#06b6d4' : '#f59e0b';
                    return (
                      <div
                        key={v.label}
                        className="rounded-xl px-3 py-2.5"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-300">{v.label}</span>
                          <span className="text-xs font-black tabular-nums" style={{ color: vColor }}>{v.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${v.pct}%`, background: vColor }} />
                        </div>
                        <div className="text-[10px] text-slate-600 tabular-nums mt-1">
                          {v.checked} / {v.total}명
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 체크인 데이터가 하나도 없을 때 안내 */}
            {ci.checked === 0 && ci.total > 0 && (
              <div className="text-center py-2 text-[11px] text-slate-600">
                체크인 데이터 없음 · 현장 체크인 페이지에서 도착 확인 시 자동 반영됩니다
              </div>
            )}
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════
          중간 패널 (1 | 2 | 1 | 1 → xl:5칸)
      ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">

        {/* 교회별 신청 현황 — 클릭 시 churches 페이지 */}
        <button
          type="button"
          onClick={() => onNavigate('churches')}
          className="rounded-2xl p-4 text-left transition-transform hover:scale-[1.01] active:scale-[0.99]"
          style={CARD}
          aria-label="교회별 신청 현황 페이지로 이동"
        >
          <div className={CARD_HEADER} style={CARD_HEADER_STYLE}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.2)' }}>⛪</span>
            <h3 className="text-sm font-bold text-white">교회별 신청 현황</h3>
            <span className="ml-auto text-[10px] text-slate-500">편집 ›</span>
          </div>
          <div className="space-y-2.5">
            {churchBreakdown.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">
                등록된 교회 없음 — 클릭해서 추가하세요
              </div>
            ) : churchBreakdown.slice(0, 6).map(c => {
              const pct = c.quota > 0 ? Math.round((c.count / c.quota) * 100) : 0;
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-300 font-medium truncate">{c.name}</span>
                    <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color: c.color }}>
                      {c.count}{c.quota > 0 && <span className="text-slate-500">/{c.quota}</span>}명
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/8">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, pct)}%`, background: c.color }} />
                  </div>
                </div>
              );
            })}
            <div className="text-[10px] text-slate-600 pt-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              전체 {churchBreakdown.length}개 교회{churchBreakdown.length > 6 ? ` (상위 6개 표시)` : ''}
            </div>
          </div>
        </button>

        {/* 프로그램 일정 — 클릭 시 schedule 페이지 (xl: 2칸) */}
        <button
          type="button"
          onClick={() => onNavigate('schedule')}
          className="xl:col-span-2 rounded-2xl p-4 text-left transition-transform hover:scale-[1.01] active:scale-[0.99]"
          style={CARD}
          aria-label="일정 관리 페이지로 이동"
        >
          <div className={CARD_HEADER} style={CARD_HEADER_STYLE}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              style={{ background: 'rgba(240,188,120,0.28)' }}>📅</span>
            <h3 className="text-sm font-bold text-white">프로그램 일정</h3>
            <span className="ml-auto text-[10px] text-slate-500">편집 ›</span>
          </div>
          {scheduleByDay.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">
              등록된 일정 없음 — 클릭해서 추가하세요
            </div>
          ) : (
            <div className={`grid gap-2.5 ${scheduleByDay.length === 1 ? 'grid-cols-1' : scheduleByDay.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {scheduleByDay.slice(0, 3).map(day => (
                <div
                  key={day.day}
                  className="rounded-xl p-2.5"
                  style={{
                    background: `${day.accent}0d`,
                    border: `1px solid ${day.accent}28`,
                  }}
                >
                  <div className="text-center mb-2">
                    <div className="text-xs font-bold" style={{ color: day.accent }}>{day.day}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{day.date}</div>
                    <div className="h-px mt-1.5 mx-1" style={{ background: `${day.accent}40` }} />
                  </div>
                  <div className="space-y-1.5">
                    {day.items.length === 0 ? (
                      <div className="text-[10px] text-slate-600 text-center py-2">일정 없음</div>
                    ) : day.items.map(item => (
                      <div key={`${item.t}-${item.v}`} className="flex items-start gap-1">
                        <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: day.accent }} />
                        <div className="text-[10px] text-slate-400 leading-tight">
                          <span className="text-slate-600">{item.t} </span>
                          {item.v}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </button>

        {/* 조 편성 현황 — 클릭 시 groups 페이지 */}
        <button
          type="button"
          onClick={() => onNavigate('groups')}
          className="rounded-2xl p-4 text-left transition-transform hover:scale-[1.01] active:scale-[0.99]"
          style={CARD}
          aria-label="조 편성 페이지로 이동"
        >
          <div className={CARD_HEADER} style={CARD_HEADER_STYLE}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              style={{ background: 'rgba(139,92,246,0.2)' }}>🏷️</span>
            <h3 className="text-sm font-bold text-white">조 편성 현황</h3>
            <span className="ml-auto text-[10px] text-slate-500">편집 ›</span>
          </div>
          <div className="space-y-1.5">
            {groupBreakdown.groups.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">
                등록된 조 없음 — 클릭해서 추가하세요
              </div>
            ) : groupBreakdown.groups.slice(0, 6).map(g => (
              <div
                key={g.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                style={{ background: `${g.color}0a`, border: `1px solid ${g.color}20` }}
              >
                <div className="flex items-center gap-1.5 w-12 flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: g.color }} />
                  <span className="text-xs font-bold text-white truncate">{g.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 flex-1 min-w-0 truncate">{g.leader}</span>
                <span className="text-xs font-bold flex-shrink-0 tabular-nums" style={{ color: g.color }}>
                  {g.count}명
                </span>
              </div>
            ))}
            <div className="text-[10px] text-slate-600 pt-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              전체 {groupBreakdown.groups.length}개 조 · {groupBreakdown.totalAssigned}명 배정
            </div>
          </div>
        </button>

        {/* 방 배정 — 클릭 시 rooms 페이지 */}
        <button
          type="button"
          onClick={() => onNavigate('rooms')}
          className="rounded-2xl p-4 text-left transition-transform hover:scale-[1.01] active:scale-[0.99]"
          style={CARD}
          aria-label="숙소 방 배정 페이지로 이동"
        >
          <div className={CARD_HEADER} style={CARD_HEADER_STYLE}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              style={{ background: 'rgba(16,185,129,0.2)' }}>🛏️</span>
            <h3 className="text-sm font-bold text-white">방 배정</h3>
            <span className="ml-auto text-[10px] text-slate-500">편집 ›</span>
          </div>
          <div className="space-y-1.5">
            {roomBreakdown.rooms.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">
                등록된 방 없음 — 클릭해서 추가하세요
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 text-[9px] text-slate-500 pb-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span>방 번호</span>
                  <span className="text-center">수용</span>
                  <span className="text-center">배정</span>
                  <span className="text-right">상태</span>
                </div>
                {roomBreakdown.rooms.map(r => {
                  const full = r.assigned >= r.cap;
                  return (
                    <div key={r.id} className="grid grid-cols-4 items-center py-0.5">
                      <span className="text-xs font-bold text-white truncate">{r.name}</span>
                      <span className="text-xs text-slate-400 text-center">{r.cap}명</span>
                      <span className="text-xs text-slate-300 text-center">{r.assigned}명</span>
                      <div className="flex justify-end">
                        {full ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                            style={{ color: '#6ee7b7', background: 'rgba(16,185,129,0.18)' }}>
                            배정완료
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                            style={{ color: '#fcd34d', background: 'rgba(245,158,11,0.18)' }}>
                            여유 {r.cap - r.assigned}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            <div className="text-[10px] text-slate-600 pt-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              전체 {roomConfig.length}개 방 · 여유 {roomBreakdown.totalSlack}명
            </div>
          </div>
        </button>

      </div>

      {/* ═══════════════════════════════════════════════════════
          하단 패널 3개
      ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 운영 체크리스트 — 클릭 시 checklist 페이지 */}
        <button
          type="button"
          onClick={() => onNavigate('checklist')}
          className="rounded-2xl p-4 text-left transition-transform hover:scale-[1.01] active:scale-[0.99] w-full"
          style={CARD}
          aria-label="운영 체크리스트 페이지로 이동">
          <div className={CARD_HEADER} style={CARD_HEADER_STYLE}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              style={{ background: 'rgba(240,188,120,0.28)' }}>☑️</span>
            <h3 className="text-sm font-bold text-white">운영 체크리스트</h3>
            <span className="ml-auto text-xs text-slate-500 flex-shrink-0">
              {ckStats.doneCount}/{ckStats.total}
            </span>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] mb-1.5">
              <span className="text-slate-400">전체 완료율</span>
              <span className="font-bold"
                style={{ color: ckStats.pct === 100 ? '#10b981' : ckStats.pct >= 60 ? '#06b6d4' : '#f59e0b' }}>
                {ckStats.pct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/8">
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${ckStats.pct}%`,
                  background: 'linear-gradient(90deg, #06b6d4, #10b981)',
                }} />
            </div>
            {(ckStats.overdueCount > 0 || ckStats.urgentCount > 0) && (
              <div className="flex items-center gap-3 mt-1.5">
                {ckStats.overdueCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold"
                    style={{ color: '#ef4444' }}>
                    <AlertTriangle size={9} />마감 지남 {ckStats.overdueCount}건
                  </span>
                )}
                {ckStats.urgentCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold"
                    style={{ color: '#f59e0b' }}>
                    <AlertTriangle size={9} />마감 임박 {ckStats.urgentCount}건
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {previewItems.map(item => {
              const sc = SC[item.status];
              return (
                <div key={item.id}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sc.color }} />
                  <span className="text-[10px] text-slate-300 truncate flex-1 min-w-0">{item.title}</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 whitespace-nowrap"
                    style={{ color: sc.color, background: sc.bg }}>
                    {sc.label}
                  </span>
                </div>
              );
            })}
          </div>
          {liveItems.length > 6 && (
            <div className="text-[10px] text-slate-600 text-right mt-2">
              외 {liveItems.length - 6}개 항목 →
            </div>
          )}
        </button>

        {/* 특이사항 / 안전 관리 */}
        <button
          type="button"
          onClick={() => onNavigate('safety')}
          className="rounded-2xl p-4 text-left transition-transform hover:scale-[1.01] active:scale-[0.99]"
          style={CARD}
          aria-label="안전 관리 페이지로 이동"
        >
          <div className={CARD_HEADER} style={CARD_HEADER_STYLE}>
            <Shield size={16} className="text-[color:var(--eum-gold)] flex-shrink-0" />
            <h3 className="text-sm font-bold text-white">특이사항 / 안전 관리</h3>
            <span className="ml-auto text-[10px] text-slate-500">편집 ›</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {safetyBreakdown.map(item => (
              <div
                key={item.label}
                className="rounded-xl p-3 flex flex-col items-center text-center gap-1.5"
                style={{ background: `${item.color}0e`, border: `1px solid ${item.color}25` }}
              >
                <span className="text-2xl leading-none">{item.emoji}</span>
                <div className="text-lg font-black leading-none" style={{ color: item.color }}>
                  {item.value}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">{item.label}</div>
              </div>
            ))}
          </div>
          <div
            className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)' }}
          >
            <span className="text-[color:var(--eum-gold)] text-sm flex-shrink-0">ℹ</span>
            <span className="text-[10px] text-slate-400">
              {safetyItems.length === 0
                ? '안전 관리 항목 미등록 — 클릭해서 추가하세요.'
                : `안전 항목 ${safetyItems.length}개 관리 중 — 자세히 보려면 클릭하세요.`}
            </span>
          </div>
        </button>

        {/* 오늘의 말씀 */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden flex flex-col"
          style={{
            background: 'linear-gradient(150deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%)',
            border: '1px solid rgba(59,130,246,0.45)',
            boxShadow: '0 4px 32px rgba(29,78,216,0.25)',
            minHeight: '200px',
          }}
        >
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.07), transparent 60%)' }} />
          <div className="absolute bottom-4 right-5 opacity-12 pointer-events-none">
            <div className="relative w-10 h-14">
              <div className="absolute left-1/2 top-0 -translate-x-1/2 w-2 h-full rounded-full bg-white" />
              <div className="absolute top-3.5 left-0 w-full h-2 rounded-full bg-white" />
            </div>
          </div>

          <div className="relative z-10 flex-1">
            <div className="text-[10px] font-bold text-[color:var(--eum-gold-l)] uppercase tracking-widest mb-3">
              오늘의 말씀
            </div>
            <blockquote className="text-white font-bold leading-snug"
              style={{ fontSize: 'clamp(0.95rem, 2vw, 1.125rem)' }}>
              "너는 하나님의 형상으로 지음 받은 존재입니다"
            </blockquote>
          </div>

          <div className="relative z-10 flex items-end justify-between mt-5">
            <div>
              <div className="text-blue-200 font-bold text-sm">창세기 1:27</div>
              <div className="text-blue-300/60 text-[10px] mt-0.5">{EVENT.theme}</div>
            </div>
            <span style={{ color: 'rgba(147,197,253,0.5)', fontSize: '1.5rem' }}>♥</span>
          </div>
        </div>

      </div>
    </div>
  );
}
