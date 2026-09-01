// 잠금 / 로그인 화면.
// 비밀번호와 PIN을 같은 입력 필드에서 받고 서버 측에서 hash 비교한다.

import { useEffect, useId, useState } from 'react';
import { Lock, LogIn, Eye, EyeOff, Phone, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from './useAuth';
import { EVENT } from '../data/eventInfo';

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
  const isFirstRun = !state.creds;

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
    if (!name.trim() && isFirstRun) { setError('처음 로그인하는 관리자 이름을 입력해 주세요.'); return; }
    if (!input) { setError(isFirstRun ? '관리자 비밀번호를 입력해 주세요.' : '비밀번호 또는 PIN을 입력해 주세요.'); return; }
    if (isFirstRun && input.length < 8) { setError('관리자 비밀번호는 8자 이상이어야 합니다.'); return; }
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
      style={{ background: 'linear-gradient(180deg,#CFE6FF 0%,#EAF3FF 45%,#F8FBFF 100%)' }}
    >
      <div className="max-w-md w-full">
        {/* E:UM 로고 + 행사 헤더 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 rounded-2xl px-4 py-3 bg-white/80 border border-blue-200/80 shadow-[0_10px_24px_rgba(31,95,217,0.12)]">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#2F73F2] to-[#1F5FD9] shadow-[0_8px_18px_rgba(31,95,217,0.32)]">
              <UserRound size={24} className="text-white" aria-hidden="true" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-extrabold tracking-[0.18em] text-[#1F5FD9]">E:UM CAMP</div>
              <div className="text-[10px] font-medium text-[#5C6A93]">안전한 운영 공간</div>
            </div>
          </div>
          <div className="text-[11px] font-bold tracking-wider mt-4 text-[#1F5FD9]">{EVENT.district}</div>
          <h1 className="text-[26px] font-extrabold text-[#101A3D] mt-1 leading-tight tracking-[-0.01em]">{EVENT.title}</h1>
          <div className="text-xs text-[#5C6A93] mt-1">
            {EVENT.theme} · {EVENT.dates}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[29px] pt-[30px] px-[28px] pb-[28px]"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(31,95,217,0.24)',
            boxShadow: '0 20px 44px rgba(27,58,92,0.14), 0 3px 8px rgba(31,95,217,0.08)',
          }}
          aria-describedby={error ? errorId : undefined}
        >
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(31,95,217,0.12)', border: '1px solid rgba(31,95,217,0.32)' }}
            >
              <ShieldCheck size={17} className="text-[#1F5FD9]" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#101A3D]">운영 시스템 접속</div>
              <div className="text-[11px] text-[#5C6A93]">아래 안내에서 접속 방법을 고른 뒤 값을 입력하세요.</div>
            </div>
          </div>

          {/* 구분선 — 이음카드 .rule 기준(1px #E5EEFB, margin 24px 0 20px) */}
          <div className="flex items-center gap-2 mb-5" aria-hidden="true">
            <div className="h-px flex-1 bg-blue-100" />
            <span className="text-[10px] font-bold tracking-[0.16em] text-[#6FA7FF]">ACCESS</span>
            <div className="h-px flex-1 bg-blue-100" />
          </div>

          {/* 표시명 (조회 사용자가 본인 이름 적게) */}
          <label htmlFor={nameId} className="block text-[11px] font-medium text-[#3A4568] mb-1.5">
              {isFirstRun ? '관리자 이름' : '본인 이름 (선택 — 활동 로그에 표시)'}
          </label>
          <input
            id={nameId}
            type="text"
            autoComplete="name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full mb-4 px-3 py-2.5 rounded-xl text-sm text-[#101A3D] outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:border-[#1F5FD9]"
            style={{ background: '#F8FBFF', border: '1px solid rgba(31,95,217,0.24)', boxShadow: 'inset 0 1px 2px rgba(31,95,217,0.04)' }}
            placeholder={isFirstRun ? '예: 홍길동 목사' : '예: 김교사'}
            disabled={isLocked || submitting}
          />

          {/* 비밀번호 / PIN */}
          <label htmlFor={inputId} className="block text-[11px] font-medium text-[#3A4568] mb-1.5">
            {isFirstRun ? '관리자 비밀번호 (8자 이상)' : '비밀번호 또는 PIN'}
          </label>
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
            style={{ background: '#F8FBFF', border: '1px solid rgba(31,95,217,0.24)', boxShadow: 'inset 0 1px 2px rgba(31,95,217,0.04)' }}
          >
            <Lock size={14} className="text-[#1F5FD9] flex-shrink-0" aria-hidden="true" />
            <input
              id={inputId}
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              inputMode="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-[#101A3D] tracking-widest focus-visible:ring-2 focus-visible:ring-blue-300"
              placeholder={isLocked ? '잠금 해제 후 시도' : (isFirstRun ? '이 브라우저의 관리자 비밀번호' : '입력 후 Enter')}
              disabled={isLocked || submitting}
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="text-[#5C6A93] hover:text-[#1F5FD9]"
              aria-label={showPw ? '입력 숨기기' : '입력 보기'}
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {!isLocked && error && (
            <div
              id={errorId}
              role="alert"
              className="rounded-lg p-3 mb-4 text-xs"
              style={{ background: '#FFF1F2', border: '1px solid #FDA4AF', color: '#9F1239' }}
            >
              {error}
            </div>
          )}

          {isLocked && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg p-3 mb-4 text-xs text-center"
              style={{ background: 'rgba(31,95,217,0.08)', border: '1px solid rgba(31,95,217,0.28)', color: '#17439C' }}
            >
              5회 연속 실패로 잠금되었습니다. {formatRemaining(lockedMs)} 후 다시 시도하세요.
            </div>
          )}

          <button
            type="submit"
            disabled={isLocked || submitting}
            className="w-full py-4 px-[18px] rounded-2xl text-[15px] font-bold text-white transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg,#2F73F2,#1F5FD9)',
              boxShadow: '0 14px 26px -12px rgba(47,115,242,0.5)',
            }}
          >
            <LogIn size={14} aria-hidden="true" />
            {submitting ? '확인 중…' : '로그인'}
          </button>
        </form>


        {/* 행사·문의 정보 */}
        <div className="mt-6 text-[11px] text-[#5C6A93] leading-relaxed text-center space-y-1.5">
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
                className="text-[#1F5FD9] hover:text-[#17439C] underline underline-offset-2"
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
