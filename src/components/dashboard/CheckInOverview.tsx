// 현장 체크인 현황 — 학생/교사·운영진/차량 도착률
import { UserCheck, ChevronRight } from 'lucide-react';
import type { PageKey } from '../Sidebar';
import type { CheckInStats } from '../../utils/dashboardStats';

const CARD = {
  background: 'rgba(255,255,255,0.07)',
  border:     '1px solid rgba(255,255,255,0.12)',
  boxShadow:  '0 4px 24px rgba(31,95,217,0.25)',
} as const;

export default function CheckInOverview({
  ci, onNavigate,
}: {
  ci: CheckInStats;
  onNavigate?: (page: PageKey) => void;
}) {
  const pct = ci.pct;
  const bc  = pct === 100 ? '#10b981' : pct >= 80 ? '#10b981' : pct >= 50 ? '#3B82F6' : '#f59e0b';
  const ps  = pct === 100
    ? { background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(255,255,255,0.04) 100%)', border: '1px solid rgba(16,185,129,0.35)', boxShadow: '0 4px 24px rgba(31,95,217,0.25)' }
    : CARD;

  const pendingPct = ci.total      > 0 ? Math.round(ci.pending      / ci.total      * 100) : 0;
  const stuPct     = ci.stuTotal   > 0 ? Math.round(ci.stuChecked   / ci.stuTotal   * 100) : 0;
  const staffPct   = ci.staffTotal > 0 ? Math.round(ci.staffChecked / ci.staffTotal * 100) : 0;
  const vTotal     = ci.vehicleBreakdown.reduce((s, v) => s + v.total,   0);
  const vChecked   = ci.vehicleBreakdown.reduce((s, v) => s + v.checked, 0);
  const vPct       = vTotal > 0 ? Math.round(vChecked / vTotal * 100) : 0;
  const pendingColor = ci.pending === 0 ? '#10b981' : pct < 50 ? '#fbbf24' : '#94a3b8';

  const items = [
    { label: '체크인 완료', pct,            current: ci.checked,      total: ci.total,      color: '#10b981' },
    { label: '미도착',      pct: pendingPct, current: ci.pending,      total: ci.total,      color: pendingColor },
    { label: '학생 체크인', pct: stuPct,     current: ci.stuChecked,   total: ci.stuTotal,   color: '#3b82f6' },
    { label: '교사·운영진', pct: staffPct,   current: ci.staffChecked, total: ci.staffTotal, color: '#8b5cf6' },
    { label: '차량 도착',   pct: vPct,       current: vChecked,        total: vTotal,        color: '#3B82F6' },
  ];

  return (
    <div className="rounded-2xl p-4 sm:p-5" style={ps}>
      <div className="flex flex-wrap items-center gap-2 mb-4 pb-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(16,185,129,0.2)' }}>
          <UserCheck size={15} className="text-emerald-400"/>
        </div>
        <h3 className="text-sm font-bold text-[#101A3D]">현장 체크인 현황</h3>
        {pct === 100
          ? <span className="text-[11px] font-bold ml-1" style={{ color: '#10b981' }}>🎉 전원 도착 완료!</span>
          : ci.pending > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={pct < 50
                  ? { color: '#fbbf24', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }
                  : { color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)' }
                }>미도착 {ci.pending}명</span>
            )
        }
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <div className="w-28 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: bc }}/>
          </div>
          <span className="text-xs font-black tabular-nums" style={{ color: bc }}>{pct}%</span>
        </div>
        <button type="button" onClick={() => onNavigate?.('checkin')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold"
          style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}>
          체크인 관리 <ChevronRight size={10}/>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {items.map(item => {
          const itemBc = item.pct === 100 ? '#10b981' : item.pct >= 60 ? item.color : '#f59e0b';
          return (
            <div key={item.label} className="rounded-xl px-3 py-3 cursor-pointer transition-all hover:border-cyan-400/30"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">{item.label}</span>
                <span className="text-xs font-black tabular-nums" style={{ color: itemBc }}>{item.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.pct}%`, background: itemBc }}/>
              </div>
              <div className="text-[10px] text-slate-500 tabular-nums mt-1.5">{item.current} / {item.total} 명</div>
            </div>
          );
        })}
      </div>

      {ci.checked === 0 && ci.total > 0 && (
        <div className="text-center py-2 text-[11px] text-slate-600">
          체크인 데이터 없음 · 현장 체크인 페이지에서 도착 확인 시 자동 반영됩니다
        </div>
      )}
    </div>
  );
}
