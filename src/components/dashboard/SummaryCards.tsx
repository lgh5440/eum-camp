// 대시보드 요약 카드 6개 (전체 인원·학생·참여 교회·교사/운영·조 배정률·준비 진행률)
import type { PageKey } from '../Sidebar';
import type { DashboardStats, CheckInStats } from '../../utils/dashboardStats';

interface ChecklistSummary {
  total: number;
  doneCount: number;
  pct: number;
  overdueCount: number;
  urgentCount: number;
}

interface Props {
  stats: DashboardStats;
  ckStats: ChecklistSummary;
  churchCount: number;
  onNavigate?: (page: PageKey) => void;
}

export default function SummaryCards({ stats, ckStats, churchCount, onNavigate }: Props) {
  const items = [
    { label: '전체 인원',   value: String(stats.total),        unit: '명', color: '#FFD98C', emoji: '👥', page: 'participants' as PageKey },
    { label: '학생',        value: String(stats.studentCount),  unit: '명', color: '#10b981', emoji: '🎓', page: 'participants' as PageKey },
    { label: '참여 교회',   value: String(churchCount),         unit: '개', color: '#60a5fa', emoji: '⛪', page: 'churches'     as PageKey },
    { label: '교사/운영진', value: String(stats.staffCount),    unit: '명', color: '#F08C28', emoji: '👤', page: 'participants' as PageKey },
    { label: '조 배정률',   value: String(stats.groupPct),      unit: '%',  color: '#a78bfa', emoji: '🏷️', page: 'groups'       as PageKey },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {items.map(s => (
        <div key={s.label} role="button" tabIndex={0}
          onClick={() => onNavigate?.(s.page)}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onNavigate?.(s.page)}
          className="rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 cursor-pointer transition-all min-h-[72px] active:scale-[0.98] hover:brightness-110"
          style={{ background: `linear-gradient(135deg, ${s.color}1a 0%, rgba(255,255,255,0.04) 100%)`, border: `1px solid ${s.color}38` }}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${s.color}26` }}>{s.emoji}</div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 whitespace-nowrap">{s.label}</div>
            <div className="font-black leading-tight" style={{ color: s.color, fontSize: '1.4rem' }}>
              {s.value}<span className="text-[11px] font-semibold ml-0.5 text-slate-300">{s.unit}</span>
            </div>
          </div>
        </div>
      ))}
      <div role="button" tabIndex={0}
        onClick={() => onNavigate?.('checklist')}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onNavigate?.('checklist')}
        className="rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 cursor-pointer transition-all min-h-[72px] active:scale-[0.98] hover:brightness-110"
        style={{ background: 'linear-gradient(135deg, rgba(240,188,120,0.16) 0%, rgba(255,255,255,0.04) 100%)', border: '1px solid rgba(240,188,120,0.38)' }}>
        <DonutChart pct={ckStats.pct}/>
        <div className="min-w-0">
          <div className="text-[10px] text-slate-400">준비 진행률</div>
          <div className="font-black text-[#101A3D] leading-tight" style={{ fontSize: '1.2rem' }}>
            {ckStats.doneCount}<span className="text-xs font-medium text-slate-400">/{ckStats.total}</span>
          </div>
          <div className="flex flex-wrap gap-x-2 mt-0.5">
            {ckStats.overdueCount > 0 && <span className="text-[9px] font-semibold" style={{ color: '#ef4444' }}>지남 {ckStats.overdueCount}건</span>}
            {ckStats.urgentCount > 0  && <span className="text-[9px] font-semibold" style={{ color: '#F08C28' }}>임박 {ckStats.urgentCount}건</span>}
            {ckStats.overdueCount === 0 && ckStats.urgentCount === 0 && <span className="text-[9px] text-slate-500">마감 여유</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function DonutChart({ pct }: { pct: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#FFD98C' : '#F08C28';
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg width={64} height={64} viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx={32} cy={32} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5}/>
        <circle cx={32} cy={32} r={radius} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.3s ease' }}/>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black tabular-nums" style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
}

// CheckInStats는 사용 안 하지만 향후 확장 위해 import 가능하도록
export type { CheckInStats };
