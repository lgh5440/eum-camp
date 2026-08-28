// 관리자 전용 — 비밀번호 / 운영위원 PIN 회전 UI.
// DataManager 페이지 상단에 임베드해서 사용한다.

import { useId, useState } from 'react';
import { KeyRound, ShieldCheck, UserCog, CheckCircle2 } from 'lucide-react';
import { AdminOnly } from './AuthContext';
import { useAuth } from './useAuth';

export default function AdminAuthSettings() {
  return (
    <AdminOnly>
      <Inner />
    </AdminOnly>
  );
}

function Inner() {
  const { state, rotate } = useAuth();
  const adminNameId = useId();
  const adminPwId   = useId();
  const pinId       = useId();

  const [adminName, setAdminName] = useState(state.creds?.adminName ?? '');
  const [adminPw, setAdminPw]     = useState('');
  const [pin, setPin]             = useState('');
  const [busy, setBusy]           = useState(false);
  const [ok, setOk]               = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    const args: Parameters<typeof rotate>[0] = {};
    if (adminName !== state.creds?.adminName) args.adminName = adminName;
    if (adminPw)                              args.adminPassword = adminPw;
    if (pin)                                  args.committeePin  = pin;

    if (!args.adminName && !args.adminPassword && !args.committeePin) {
      setError('변경할 항목을 하나 이상 입력하세요.');
      return;
    }
    if (args.adminPassword && args.adminPassword.length < 8) {
      setError('진행위원 비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    if (args.committeePin && !/^\d{4,6}$/.test(args.committeePin)) {
      setError('조회용 PIN은 숫자 4~6자리여야 합니다.');
      return;
    }

    setBusy(true);
    const result = await rotate(args);
    setBusy(false);
    if (result) {
      setOk(true);
      setAdminPw('');
      setPin('');
      setTimeout(() => setOk(false), 4000);
    } else {
      setError('변경에 실패했습니다. 진행위원 권한을 확인해 주세요.');
    }
  }

  return (
    <section
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(245,158,11,0.05)',
        border: '1px solid rgba(245,158,11,0.2)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}
      aria-labelledby="admin-auth-heading"
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(245,158,11,0.2)' }}
        >
          <ShieldCheck size={18} className="text-amber-400" aria-hidden="true" />
        </div>
        <div>
          <h3 id="admin-auth-heading" className="text-sm font-bold text-amber-300">
            진행위원 인증 설정
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            진행위원(읽기·쓰기) 비밀번호와 일반 사용자(읽기 전용)용 PIN을 변경합니다. 변경하지 않을 항목은 비워두세요.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3">
        <Field label="진행위원 표시명" htmlFor={adminNameId} icon={<UserCog size={14} aria-hidden="true" />}>
          <input
            id={adminNameId}
            type="text"
            value={adminName}
            onChange={e => setAdminName(e.target.value)}
            className="w-full bg-transparent outline-none text-sm text-[#1B3A5C]"
            autoComplete="name"
          />
        </Field>

        <Field label="새 진행위원 비밀번호" htmlFor={adminPwId} icon={<ShieldCheck size={14} aria-hidden="true" />}>
          <input
            id={adminPwId}
            type="password"
            value={adminPw}
            onChange={e => setAdminPw(e.target.value)}
            className="w-full bg-transparent outline-none text-sm text-[#1B3A5C]"
            placeholder="(미변경 시 빈칸)"
            minLength={8}
            autoComplete="new-password"
          />
        </Field>

        <Field label="새 조회용 PIN (숫자 4~6자리)" htmlFor={pinId} icon={<KeyRound size={14} aria-hidden="true" />}>
          <input
            id={pinId}
            type="text"
            inputMode="numeric"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full bg-transparent outline-none text-sm text-[#1B3A5C] tracking-widest"
            placeholder="(미변경 시 빈칸)"
            autoComplete="off"
          />
        </Field>

        <div className="md:col-span-3 flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#1B3A5C] disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg,#f59e0b,#d97706)',
              boxShadow: '0 0 14px rgba(245,158,11,0.3)',
            }}
          >
            {busy ? '변경 중…' : '인증 정보 변경'}
          </button>
          {ok && (
            <span role="status" className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
              <CheckCircle2 size={12} aria-hidden="true" /> 변경 완료
            </span>
          )}
          {error && (
            <span role="alert" className="text-xs text-red-300">{error}</span>
          )}
        </div>
      </form>
    </section>
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
    <div>
      <label htmlFor={htmlFor} className="block text-[11px] font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <span className="text-amber-400 flex-shrink-0">{icon}</span>
        {children}
      </div>
    </div>
  );
}
