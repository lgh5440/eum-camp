// 운영 준비 현황 — 조 편성·방·차량·참가비·체크리스트 진행률
import type { PageKey } from '../Sidebar';
import type { DashboardStats } from '../../utils/dashboardStats';

interface ChecklistSummary {
  doneCount: number;
  total: number;
  pct: number;
}

interface Warning { label: string; level: 'warn' | 'danger' }

interface Props {
  stats: DashboardStats;
  ckStats: ChecklistSummary;
  warnings: Warning[];
  onNavigate?: (page: PageKey) => void;
}

const CARD = {
  background: 'rgba(255,255,255,0.07)',
  border:     '1px solid rgba(255,255,255,0.12)',
  boxShadow:  '0 4px 24px rgba(0,0,0,0.25)',
} as const;

export default function OperationStatus({ stats, ckStats, warnings, onNavigate }: Props) {
  const items = [
    { label: '조 편성',    current: stats.groupAssigned,   total: stats.groupTotal,   pct: stats.groupPct,   unit: '학생', color: '#8b5cf6', page: 'groups'       as PageKey },
    { label: '방 배정',    current: stats.roomAssigned,    total: stats.roomTotal,    pct: stats.roomPct,    unit: '학생', color: '#10b981', page: 'rooms'        as PageKey },
    { label: '차량 배정',  current: stats.vehicleAssigned, total: stats.vehicleTotal, pct: stats.vehiclePct, unit: '인원', color: '#3b82f6', page: 'vehicles'     as PageKey },
    { label: '참가비 납부', current: stats.feePaid,         total: stats.feeTotal,     pct: stats.feePct,     unit: '인원', color: '#f59e0b', page: 'participants' as PageKey },
    { label: '체크리스트', current: ckStats.doneCount,     total: ckStats.total,      pct: ckStats.pct,      unit: '건',   color: '#06b6d4', page: 'checklist'    as PageKey },
  ];

  return (
    <div className="rounded-2xl p-4 sm:p-5" style={CARD}>
      <div className="flex flex-wrap items-center gap-2 mb-4 pb-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
          style={{ background: 'rgba(37, 99, 235,0.2)' }}>📊</span>
        <h3 className="text-sm font-bold text-[#1B3A5C]">운영 준비 현황</h3>
        {warnings.length === 0
          ? <span className="ml-1 text-[10px] font-semibold" style={{ color: '#10b981' }}>✓ 모든 배정 완료</span>
          : <div className="ml-auto flex items-center gap-1.5 flex-wrap justify-end">
              {warnings.map(w => (
                <span key={w.label} className="text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
                  style={w.level === 'danger'
                    ? { color: '#ef4444', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }
                    : { color: '#f59e0b', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }
                  }>{w.label}</span>
              ))}
            </div>
        }
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {items.map(item => {
          const bc = item.pct === 100 ? '#10b981' : item.pct >= 60 ? item.color : '#f59e0b';
          return (
            <div key={item.label} role="button" tabIndex={0}
              onClick={() => onNavigate?.(item.page)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onNavigate?.(item.page)}
              className="rounded-xl px-3 py-3 cursor-pointer transition-all hover:border-cyan-400/30"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">{item.label}</span>
                <span className="text-xs font-black tabular-nums" style={{ color: bc }}>{item.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.pct}%`, background: bc }}/>
              </div>
              <div className="text-[10px] text-slate-500 tabular-nums mt-1.5">{item.current} / {item.total} {item.unit}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
