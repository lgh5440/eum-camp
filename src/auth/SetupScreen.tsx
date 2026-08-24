// 첫 실행 시 1회만 표시되는 관리자 비밀번호 + 운영위원 PIN 등록 화면.
// 이후에는 LoginScreen이 표시된다.

import { useId, useState } from 'react';
import { ShieldCheck, Eye, EyeOff, KeyRound, UserCog } from 'lucide-react';
import { useAuth } from './useAuth';
import { EVENT } from '../data/eventInfo';
import DemoNotice from '../demo/DemoNotice';
import { DEMO_MODE } from '../demo/demoConfig';
import { DEMO_CREDENTIALS } from '../demo/demoInfo';

// 체험용 기본값은 데모 배포본에서만 채운다.
// 이 저장소를 복사해 실제 운영에 쓰는 교회의 설정 화면에 'demo1234' 가 남아 있으면 안 된다.
// (VITE_DEMO_MODE 기본 OFF → 아래는 전부 빈 문자열로 접힌다.)
const PREFILL = DEMO_MODE
  ? {
      adminName: DEMO_CREDENTIALS.adminName,
      adminPw: DEMO_CREDENTIALS.adminPassword,
      pin: DEMO_CREDENTIALS.committeePin,
    }
  : { adminName: '', adminPw: '', pin: '' };

export default function SetupScreen() {
  const { setup } = useAuth();
  const adminNameId = useId();
  const adminPwId   = useId();
  const adminPw2Id  = useId();
  const pinId       = useId();
  const pin2Id      = useId();
  const errorId     = useId();

  const [adminName, setAdminName]   = useState(PREFILL.adminName);
  const [adminPw, setAdminPw]       = useState(PREFILL.adminPw);
  const [adminPw2, setAdminPw2]     = useState(PREFILL.adminPw);
  const [pin, setPin]               = useState(PREFILL.pin);
  const [pin2, setPin2]             = useState(PREFILL.pin);
  const [showPw, setShowPw]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  function validate(): string | null {
    if (!adminName.trim())                            return '관리자 표시명을 입력해 주세요.';
    if (adminPw.length < 8)                            return '관리자 비밀번호는 최소 8자 이상이어야 합니다.';
    if (adminPw !== adminPw2)                          return '관리자 비밀번호 확인이 일치하지 않습니다.';
    if (!/^\d{4,6}$/.test(pin))                        return '운영위원 PIN은 숫자 4~6자리로 입력해 주세요.';
    if (pin !== pin2)                                  return '운영위원 PIN 확인이 일치하지 않습니다.';
    if (adminPw === pin)                               return '관리자 비밀번호와 운영위원 PIN은 서로 달라야 합니다.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setError(null);
    setSubmitting(true);
    try {
      await setup({ adminPassword: adminPw, committeePin: pin, adminName });
    } catch (err) {
      setError(err instanceof Error ? err.message : '설정 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(135deg,#020818 0%,#0a1628 60%,#0f2040 100%)' }}
    >
      <div
        className="max-w-xl w-full rounded-2xl p-7"
        style={{
          background: 'rgba(2,12,28,0.85)',
          border: '1px solid rgba(240,188,120,0.22)',
          boxShadow: '0 0 40px rgba(240,140,40,0.12)',
        }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg,#F08C28,#C9962B)',
              boxShadow: '0 0 16px rgba(240,140,40,0.45)',
            }}
          >
            <ShieldCheck size={22} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">초기 설정</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {EVENT.title ? `${EVENT.title} — ` : ''}관리자 비밀번호와 운영위원 공유 PIN을 설정합니다
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-3 mb-5 text-xs leading-relaxed"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: '#fde68a' }}
        >
          <div className="font-semibold text-amber-200 mb-1">한 번만 진행되는 설정입니다</div>
          이 비밀번호와 PIN은 이 브라우저에 SHA-256 해시로 저장됩니다. 운영위원에게는
          <strong className="text-amber-100"> PIN만 </strong>
          공유하시고, 관리자 비밀번호는 절대 공유하지 마세요.
        </div>

        {/* 데모 배포본에서만 노출되는 체험 안내 (VITE_DEMO_MODE) */}
        <DemoNotice variant="setup" />

        <form onSubmit={handleSubmit} aria-describedby={error ? errorId : undefined}>
          {/* 관리자 표시명 */}
          <Field label="관리자 표시명" htmlFor={adminNameId} icon={<UserCog size={14} aria-hidden="true" />}>
            <input
              id={adminNameId}
              type="text"
              autoComplete="name"
              value={adminName}
              onChange={e => setAdminName(e.target.value)}
              className="w-full bg-transparent outline-none text-sm text-white placeholder:text-slate-500"
              placeholder="예: 김○○ 목사 / 운영팀장"
              required
            />
          </Field>

          {/* 관리자 비밀번호 */}
          <Field label="관리자 비밀번호 (최소 8자)" htmlFor={adminPwId} icon={<ShieldCheck size={14} aria-hidden="true" />}>
            <input
              id={adminPwId}
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              value={adminPw}
              onChange={e => setAdminPw(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-slate-500"
              placeholder="알파벳·숫자·기호 조합 권장"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="ml-2 text-slate-400 hover:text-[color:var(--eum-gold-l)]"
              aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </Field>

          <Field label="관리자 비밀번호 확인" htmlFor={adminPw2Id} icon={<ShieldCheck size={14} aria-hidden="true" />}>
            <input
              id={adminPw2Id}
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              value={adminPw2}
              onChange={e => setAdminPw2(e.target.value)}
              className="w-full bg-transparent outline-none text-sm text-white"
              required
              minLength={8}
            />
          </Field>

          {/* 운영위원 PIN */}
          <Field label="운영위원 공유 PIN (숫자 4~6자리)" htmlFor={pinId} icon={<KeyRound size={14} aria-hidden="true" />}>
            <input
              id={pinId}
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4,6}"
              autoComplete="off"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full bg-transparent outline-none text-sm text-white tracking-widest"
              placeholder="예: 0726"
              required
            />
          </Field>

          <Field label="운영위원 PIN 확인" htmlFor={pin2Id} icon={<KeyRound size={14} aria-hidden="true" />}>
            <input
              id={pin2Id}
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4,6}"
              autoComplete="off"
              value={pin2}
              onChange={e => setPin2(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full bg-transparent outline-none text-sm text-white tracking-widest"
              required
            />
          </Field>

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

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg,#F08C28,#C9962B)',
              boxShadow: '0 0 16px rgba(240,140,40,0.45)',
            }}
          >
            {submitting ? '설정 저장 중…' : '설정 완료 후 로그인 화면으로 이동'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label, htmlFor, icon, children,
}: {
  label: string;
  htmlFor: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label htmlFor={htmlFor} className="block text-[11px] font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <span style={{ color: 'var(--eum-gold-l)' }} className="flex-shrink-0">{icon}</span>
        {children}
      </div>
    </div>
  );
}
