// 글로벌 토스트 시스템 — 백그라운드 실패·시스템 알림용.
// 페이지 인라인 메시지(setError/setMessage)는 그대로 유지하고, 이건 cross-cutting 알림 전용.

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'warning' | 'error' | 'info';

interface ToastEntry {
  id:   string;
  tone: ToastTone;
  text: string;
}

interface ToastContextValue {
  showToast: (text: string, tone?: ToastTone, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // 안전 fallback — provider 외부에서 호출되어도 콘솔 로깅
    return {
      showToast: (text, tone = 'info') => {
        console.log(`[toast:${tone}]`, text);
      },
    };
  }
  return ctx;
}

const TONE: Record<ToastTone, { icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
  success: { icon: CheckCircle2,  color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)' },
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)' },
  error:   { icon: XCircle,       color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)'  },
  info:    { icon: Info,          color: '#3B82F6', bg: 'rgba(37, 99, 235,0.15)',  border: 'rgba(37, 99, 235,0.4)'  },
};

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const showToast = useCallback((text: string, tone: ToastTone = 'info', durationMs = 4000) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { id, tone, text }]);
    if (durationMs > 0) {
      window.setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, durationMs);
    }
  }, []);

  function dismiss(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        style={{ maxWidth: 'calc(100vw - 32px)' }}
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map(t => {
          const cfg = TONE[t.tone];
          const Icon = cfg.icon;
          return (
            <div
              key={t.id}
              className="rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 shadow-lg pointer-events-auto"
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                color: cfg.color,
                backdropFilter: 'blur(8px)',
                minWidth: 240,
                maxWidth: 420,
              }}
              role="alert"
            >
              <Icon size={15} className="flex-shrink-0 mt-0.5" />
              <span className="text-xs font-semibold leading-relaxed flex-1">{t.text}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                aria-label="닫기"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// Provider 외부(서비스 모듈 등)에서 토스트 발생용.
// AppShell이 마운트 시 setShowToastImpl 등록 → 어디서나 toastBus.showToast() 호출 가능.
let externalShow: ((text: string, tone?: ToastTone) => void) | null = null;

// eslint-disable-next-line react-refresh/only-export-components
export const toastBus = {
  showToast(text: string, tone: ToastTone = 'info') {
    if (externalShow) externalShow(text, tone);
    else console.log(`[toast:${tone}]`, text);
  },
};

// eslint-disable-next-line react-refresh/only-export-components
export function registerToastBus(fn: (text: string, tone?: ToastTone) => void) {
  externalShow = fn;
}
