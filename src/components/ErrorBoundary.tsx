import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { EVENT } from '../data/eventInfo';

interface Props {
  children: ReactNode;
  /** 영역 이름. 헤더 표시·로그 식별용 */
  scope?: string;
  /** 페이지 단위 폴백을 쓸지(기본) 작은 인라인 폴백을 쓸지 */
  variant?: 'page' | 'inline';
  /** 새로고침 대신 호출할 콜백(예: 페이지 키 리셋) */
  onReset?: () => void;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
  count: number;
}

const STORE_KEY = 'youth-retreat-2026:errorlog';

function persistError(scope: string, error: Error, info: ErrorInfo) {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const list = raw ? JSON.parse(raw) as unknown[] : [];
    list.unshift({
      at: new Date().toISOString(),
      scope,
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
      ua: navigator.userAgent,
    });
    localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, 30)));
  } catch {
    // localStorage 실패 시 무시 (Safari 시크릿 모드 등)
  }
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null, count: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info });
    persistError(this.props.scope ?? 'global', error, info);
    // 콘솔에도 출력 (개발자 도구에서 즉시 확인용)
    console.error('[ErrorBoundary]', this.props.scope ?? 'global', error, info);
  }

  handleReset = () => {
    this.setState(s => ({ error: null, info: null, count: s.count + 1 }));
    this.props.onReset?.();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error, info } = this.state;
    const { children, variant = 'page', scope } = this.props;

    if (!error) return children;

    if (variant === 'inline') {
      return (
        <div
          role="alert"
          className="rounded-xl p-4 my-3 text-sm"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.35)',
            color: '#fecaca',
          }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-red-200">
                이 영역을 표시하는 중 오류가 발생했습니다{scope ? ` — ${scope}` : ''}
              </div>
              <div className="mt-1 text-xs text-red-300/80 break-words">
                {error.message}
              </div>
              <button
                type="button"
                onClick={this.handleReset}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-100 hover:bg-red-500/20 transition-colors"
                style={{ border: '1px solid rgba(239,68,68,0.4)' }}
              >
                <RotateCcw size={12} aria-hidden="true" /> 다시 시도
              </button>
            </div>
          </div>
        </div>
      );
    }

    // page-level fallback
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg,#020818 0%,#1a0a14 60%,#2a0a14 100%)' }}
      >
        <div
          className="max-w-2xl w-full rounded-2xl p-7"
          style={{
            background: 'rgba(20,8,12,0.85)',
            border: '1px solid rgba(239,68,68,0.4)',
            boxShadow: '0 0 40px rgba(239,68,68,0.15)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}
            >
              <AlertTriangle size={22} className="text-red-300" aria-hidden="true" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">화면을 표시할 수 없습니다</div>
              <div className="text-xs text-red-200/70 mt-0.5">
                {scope ? `영역: ${scope}` : '예상치 못한 오류'}
              </div>
            </div>
          </div>

          <div
            className="rounded-lg p-3 mb-4 text-xs font-mono break-words"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
          >
            {error.message || '알 수 없는 오류'}
          </div>

          <details className="mb-4 text-xs text-red-200/70">
            <summary className="cursor-pointer hover:text-red-200 select-none">
              기술 세부정보 보기 (운영진/개발자용)
            </summary>
            <pre
              className="mt-2 p-3 rounded-lg overflow-x-auto text-[10px] leading-relaxed"
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              {error.stack}
              {info?.componentStack && '\n— Component Stack —' + info.componentStack}
            </pre>
          </details>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}
            >
              <RotateCcw size={14} aria-hidden="true" /> 이 화면만 다시 시도
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.4)' }}
            >
              <Home size={14} aria-hidden="true" /> 전체 새로고침
            </button>
          </div>

          <div className="mt-5 text-[11px] text-slate-400 leading-relaxed">
            오류가 반복되면 <strong className="text-slate-200">{EVENT.inquiry.name}</strong>
            {EVENT.inquiry.phone && (
              <>
                {' ('}
                <a href={`tel:${EVENT.inquiry.phone.replace(/-/g, '')}`} className="text-cyan-300 underline">
                  {EVENT.inquiry.phone}
                </a>
                {')'}
              </>
            )}
            에게 알려주세요. 데이터 관리 → 백업 내보내기로 현재 상태를 먼저 저장하시면 좋습니다.
          </div>
        </div>
      </div>
    );
  }
}
