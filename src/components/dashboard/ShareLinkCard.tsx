// 공유 링크 카드 — 참가자용/운영자용 두 링크의 카톡 미리보기 분리 + 복사·열기·대기함 이동
import { ExternalLink, Clipboard, Check, Inbox } from 'lucide-react';
import type { PageKey } from '../Sidebar';

interface Props {
  applicationUrl: string;
  systemUrl: string;
  pendingAppCount: number;
  copiedKind: 'apply' | 'system' | null;
  onCopy: (kind: 'apply' | 'system') => void;
  onNavigate?: (page: PageKey) => void;
}

export default function ShareLinkCard({
  applicationUrl, systemUrl, pendingAppCount, copiedKind, onCopy, onNavigate,
}: Props) {
  return (
    <div className="rounded-2xl p-4 sm:p-5 space-y-3"
      style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(139,92,246,0.08) 100%)',
        border: '1px solid rgba(16,185,129,0.28)',
      }}>
      <div className="text-[11px] text-slate-400">
        📲 카톡으로 보내면 두 링크는 <span className="text-emerald-300 font-semibold">서로 다른 미리보기</span>로 표시됩니다.
      </div>

      {/* 참가자용 신청서 */}
      <div className="rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3"
        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.20)' }}>📝</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[#1B3A5C]">참가자용 신청서</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-emerald-200 bg-emerald-500/15">학생·교사에게</span>
              {pendingAppCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)', color: '#fbbf24' }}>
                  미처리 {pendingAppCount}건
                </span>
              )}
            </div>
            <div className="text-[10px] text-emerald-300/80 font-mono mt-0.5 truncate">{applicationUrl}</div>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <a href={applicationUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-100 bg-emerald-500/20 border border-emerald-500/35 hover:bg-emerald-500/30 transition-colors">
            <ExternalLink size={13}/> 열기
          </a>
          <button type="button" onClick={() => onCopy('apply')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-100 bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors">
            {copiedKind === 'apply' ? <Check size={13}/> : <Clipboard size={13}/>}
            {copiedKind === 'apply' ? '복사됨' : '복사'}
          </button>
          <button type="button" onClick={() => onNavigate?.('applications')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <Inbox size={13}/> 대기함
          </button>
        </div>
      </div>

      {/* 운영 시스템 */}
      <div className="rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3"
        style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'rgba(139,92,246,0.20)' }}>🛠️</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[#1B3A5C]">운영 시스템</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-violet-200 bg-violet-500/15">운영진·담당교사에게</span>
            </div>
            <div className="text-[10px] text-violet-300/80 font-mono mt-0.5 truncate">{systemUrl}</div>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <a href={systemUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-100 bg-violet-500/20 border border-violet-500/35 hover:bg-violet-500/30 transition-colors">
            <ExternalLink size={13}/> 열기
          </a>
          <button type="button" onClick={() => onCopy('system')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-100 bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors">
            {copiedKind === 'system' ? <Check size={13}/> : <Clipboard size={13}/>}
            {copiedKind === 'system' ? '복사됨' : '복사'}
          </button>
        </div>
      </div>
    </div>
  );
}
