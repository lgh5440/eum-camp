import type { ReactNode } from 'react';
import { MessageSquare, Phone } from 'lucide-react';

interface ContactLinksProps {
  phone?: string;
  label?: string;
  compact?: boolean;
  empty?: ReactNode;
  className?: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export function normalizeDialNumber(value: string | undefined): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return '';
  const prefix = trimmed.startsWith('+') ? '+' : '';
  return `${prefix}${trimmed.replace(/\D/g, '')}`;
}

export default function ContactLinks({
  phone,
  label = '연락처',
  compact = false,
  empty = <span className="text-slate-600">-</span>,
  className = '',
}: ContactLinksProps) {
  const display = (phone ?? '').trim();
  const dial = normalizeDialNumber(display);

  if (!display || !dial) return <>{empty}</>;

  const buttonBase = compact
    ? 'h-7 w-7 rounded-lg justify-center'
    : 'h-8 px-2.5 rounded-lg gap-1.5';
  const iconSize = compact ? 13 : 14;

  return (
    <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`}>
      <span className="font-mono text-slate-200 truncate">{display}</span>
      <span className="inline-flex items-center gap-1 flex-shrink-0">
        <a
          href={`tel:${dial}`}
          onClick={e => e.stopPropagation()}
          aria-label={`${label} 전화 걸기`}
          title="전화 걸기"
          className={`inline-flex items-center text-emerald-200 bg-emerald-500/12 border border-emerald-400/25 hover:bg-emerald-500/20 transition-colors ${buttonBase}`}
        >
          <Phone size={iconSize} />
          {!compact && <span className="text-xs font-semibold">전화</span>}
        </a>
        <a
          href={`sms:${dial}`}
          onClick={e => e.stopPropagation()}
          aria-label={`${label} 문자 보내기`}
          title="문자 보내기"
          className={`inline-flex items-center text-cyan-200 bg-cyan-500/12 border border-cyan-400/25 hover:bg-cyan-500/20 transition-colors ${buttonBase}`}
        >
          <MessageSquare size={iconSize} />
          {!compact && <span className="text-xs font-semibold">문자</span>}
        </a>
      </span>
    </span>
  );
}
