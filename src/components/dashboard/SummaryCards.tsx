// 대시보드 요약 카드 6개 (전체 인원·학생·참여 교회·교사/운영·조 배정률·준비 진행률)
import { Users, GraduationCap, Church, UserCog, Tag } from 'lucide-react';
import type { ComponentType } from 'react';
import type { PageKey } from '../Sidebar';
import type { DashboardStats, CheckInStats } from '../../utils/dashboardStats';

// ★색상 정리(v2, 2026-08-31): 타일마다 다른 색(금·초록·하늘·주황·보라)을 쓰던 것을
// "강한 색은 최대 2개" 규칙 위반으로 판단해 전부 브랜드 블루 한 가지로 통일한다.
// 이모지(👥🎓⛪👤🏷️)는 OS 폰트가 자체 색을 입혀 CSS color로 바뀌지 않으므로
// 단색 처리가 가능한 lucide 아이콘으로 교체한다(문서 §3 "단색 아이콘" 요구 대응).
const BRAND_BLUE = '#1F5FD9';

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
  const items: { label: string; value: string; unit: string; color: string; Icon: ComponentType<{ size?: number; style?: React.CSSProperties }>; page: PageKey }[] = [
    { label: '전체 인원',   value: String(stats.total),        unit: '명', color: BRAND_BLUE, Icon: Users,         page: 'participants' },
    { label: '학생',        value: String(stats.studentCount),  unit: '명', color: BRAND_BLUE, Icon: GraduationCap, page: 'participants' },
    { label: '참여 교회',   value: String(churchCount),         unit: '개', color: BRAND_BLUE, Icon: Church,        page: 'churches'     },
    { label: '교사/운영진', value: String(stats.staffCount),    unit: '명', color: BRAND_BLUE, Icon: UserCog,       page: 'participants' },
    { label: '조 배정률',   value: String(stats.groupPct),      unit: '%',  color: BRAND_BLUE, Icon: Tag,           page: 'groups'       },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
      {items.map(s => (
        <div key={s.label} role="button" tabIndex={0}
          onClick={() => onNavigate?.(s.page)}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onNavigate?.(s.page)}
          className="rounded-2xl p-4 sm:p-5 flex items-center gap-3 cursor-pointer transition-all min-h-[76px] active:scale-[0.98] hover:brightness-110"
          style={{ background: `linear-gradient(135deg, ${s.color}1a 0%, rgba(255,255,255,0.04) 100%)`, border: `1px solid ${s.color}38` }}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${s.color}26` }}><s.Icon size={20} style={{ color: s.color }} /></div>
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
        className="rounded-2xl p-4 sm:p-5 flex items-center gap-3 cursor-pointer transition-all min-h-[76px] active:scale-[0.98] hover:brightness-110"
        style={{ background: 'linear-gradient(135deg, rgba(31,95,217,0.14) 0%, rgba(255,255,255,0.04) 100%)', border: '1px solid rgba(31,95,217,0.32)' }}>
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
