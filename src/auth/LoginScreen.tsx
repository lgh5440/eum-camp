// 잠금 / 로그인 화면.
// 비밀번호와 PIN을 같은 입력 필드에서 받고 서버 측에서 hash 비교한다.

import { useEffect, useId, useState } from 'react';
import { Lock, LogIn, Eye, EyeOff, Phone, MapPin } from 'lucide-react';
import { useAuth } from './useAuth';
import { EVENT } from '../data/eventInfo';
import { EUM_BRAND } from '../data/eumBrand';
import DemoNotice from '../demo/DemoNotice';

function formatRemaining(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}분 ${r.toString().padStart(2, '0')}초`;
}

export default function LoginScreen() {
  const { state, login } = useAuth();
  const inputId   = useId();
  const nameId    = useId();
  const errorId   = useId();

  const [input, setInput]           = useState('');
  const [name, setName]             = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // 잠금 카운트다운 표시
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!state.lockedUntil) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.lockedUntil]);

  const lockedMs = state.lockedUntil ? state.lockedUntil - now : 0;
  const isLocked = lockedMs > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return;
    if (!input) { setError('비밀번호 또는 PIN을 입력해 주세요.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const role = await login(input, name);
      if (!role) {
        const remaining = Math.max(0, 5 - (state.failedAttempts + 1));
        setError(
          remaining > 0
            ? `로그인 실패 — 남은 시도 ${remaining}회 (5회 실패 시 5분 잠금)`
            : '로그인 실패 — 5분간 잠금됩니다.'
        );
        setInput('');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(135deg,#EAF3FF 0%,#F8FBFF 60%,#FFFFFF 100%)' }}
    >
      <div className="max-w-md w-full">
        {/* E:UM 로고 + 행사 헤더 */}
        <div className="text-center mb-6">
          <img
            src={EUM_BRAND.logoUrl}
            alt={EUM_BRAND.name}
            className="w-20 h-20 mx-auto mb-3 object-contain"
            style={{ filter: 'drop-shadow(0 0 18px rgba(240,188,120,0.5))' }}
          />
          <div className="text-[11px] font-bold tracking-wider" style={{ color: 'var(--eum-gold-l)' }}>{EVENT.district}</div>
          <h1 className="text-xl font-bold text-[#1B3A5C] mt-1 leading-tight">{EVENT.title}</h1>
          <div className="text-xs text-slate-400 mt-1">
            {EVENT.theme} · {EVENT.dates}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(2,12,28,0.85)',
            border: '1px solid rgba(240,188,120,0.22)',
            boxShadow: '0 0 40px rgba(240,140,40,0.12)',
          }}
          aria-describedby={error ? errorId : undefined}
        >
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(240,140,40,0.15)', border: '1px solid rgba(240,188,120,0.32)' }}
            >
              <Lock size={16} style={{ color: 'var(--eum-gold-l)' }} aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1B3A5C]">운영 시스템 접속</div>
              <div className="text-[11px] text-slate-400">진행위원 비밀번호(읽기·쓰기) 또는 조회용 PIN(읽기 전용)을 입력하세요</div>
            </div>
          </div>

          {/* 데모 배포본에서만 노출되는 체험 안내 (VITE_DEMO_MODE) */}
          <DemoNotice variant="login" />

          {/* 표시명 (조회 사용자가 본인 이름 적게) */}
          <label htmlFor={nameId} className="block text-[11px] font-medium text-slate-300 mb-1.5">
            본인 이름 (선택 — 활동 로그에 표시)
          </label>
          <input
            id={nameId}
            type="text"
            autoComplete="name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full mb-4 px-3 py-2.5 rounded-xl text-sm text-[#1B3A5C] outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            placeholder="예: 김교사"
            disabled={isLocked || submitting}
          />

          {/* 비밀번호 / PIN */}
          <label htmlFor={inputId} className="block text-[11px] font-medium text-slate-300 mb-1.5">
            비밀번호 또는 PIN
          </label>
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Lock size={14} style={{ color: 'var(--eum-gold-l)' }} className="flex-shrink-0" aria-hidden="true" />
            <input
              id={inputId}
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              inputMode="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-[#1B3A5C] tracking-widest"
              placeholder={isLocked ? '잠금 해제 후 시도' : '입력 후 Enter'}
              disabled={isLocked || submitting}
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="text-slate-400 hover:text-[color:var(--eum-gold-l)]"
              aria-label={showPw ? '입력 숨기기' : '입력 보기'}
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {error && (
            <div
              id={errorId}
              role="alert"
              className="rounded-lg p-3 mb-4 text-xs"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fecaca' }}
            >
              {error}
            </div>
          )}

          {isLocked && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg p-3 mb-4 text-xs text-center"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fde68a' }}
            >
              5회 연속 실패로 잠금되었습니다. {formatRemaining(lockedMs)} 후 다시 시도하세요.
            </div>
          )}

          <button
            type="submit"
            disabled={isLocked || submitting}
            className="w-full py-3 rounded-xl text-sm font-semibold text-[#1B3A5C] transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg,#F08C28,#C9962B)',
              boxShadow: '0 0 16px rgba(240,140,40,0.45)',
            }}
          >
            <LogIn size={14} aria-hidden="true" />
            {submitting ? '확인 중…' : '로그인'}
          </button>
        </form>

        {/* 행사·문의 정보 */}
        <div className="mt-6 text-[11px] text-slate-400 leading-relaxed text-center space-y-1.5">
          <div className="flex items-center justify-center gap-1.5">
            <MapPin size={11} aria-hidden="true" className="text-slate-500" />
            {EVENT.venue} · {EVENT.venueAddress}
          </div>
          {EVENT.inquiry.phone && (
            <div className="flex items-center justify-center gap-1.5">
              <Phone size={11} aria-hidden="true" className="text-slate-500" />
              {EVENT.inquiry.role} {EVENT.inquiry.name}{' '}
              <a
                href={`tel:${EVENT.inquiry.phone.replace(/-/g, '')}`}
                className="text-[color:var(--eum-gold-l)] hover:brightness-125 underline"
              >
                {EVENT.inquiry.phone}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
