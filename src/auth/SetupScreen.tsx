// 첫 실행 시 1회만 표시되는 관리자 비밀번호 + 운영위원 PIN 등록 화면.
// 이후에는 LoginScreen이 표시된다.

import { useId, useState } from 'react';
import { ShieldCheck, Eye, EyeOff, UserCog, KeyRound } from 'lucide-react';
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
  const errorId     = useId();

  const [adminName, setAdminName]   = useState(PREFILL.adminName);
  const [adminPw, setAdminPw]       = useState(PREFILL.adminPw);
  const [showPw, setShowPw]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  function validate(): string | null {
    if (!adminName.trim())                            return '관리자 표시명을 입력해 주세요.';
    if (adminPw.length < 8)                            return '관리자 비밀번호는 최소 8자 이상이어야 합니다.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setError(null);
    setSubmitting(true);
    try {
      // 운영위원 PIN은 여기서 받지 않는다 — 나중에 관리자가 '진행위원 인증 설정'(AdminAuthSettings)의
      // rotate()로 추가한다. 단, 데모 배포본은 기존처럼 PIN 체험(조회 전용 로그인)이 바로 되어야
      // 하므로 DEMO_MODE에서만 프리필된 데모 PIN을 조용히 함께 전달한다(화면에는 입력칸 없음).
      await setup({
        adminPassword: adminPw,
        adminName,
        ...(DEMO_MODE ? { committeePin: PREFILL.pin } : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '설정 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(180deg,#CFE6FF 0%,#EAF3FF 45%,#F8FBFF 100%)' }}
    >
      <div className="max-w-xl w-full">
        {/* 체험판 배지 — 처음 들어올 때 바로 보이도록 카드 위 최상단에 항상 노출(숨기지 않음).
            상세 설명(새벽 4시 초기화 등) 3줄만 접이식으로 감춘다. */}
        <DemoNotice variant="setup" />

        <div
          className="rounded-[29px] p-7"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(31,95,217,0.24)',
            boxShadow: '0 20px 44px rgba(27,58,92,0.14), 0 3px 8px rgba(31,95,217,0.08)',
          }}
        >
          {/* 화면 정체성 — 가장 눈에 띄게: 큰 아이콘 + 큰 제목 + 1줄 부제 */}
          <div className="flex items-center gap-4 mb-7">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg,#2F73F2,#1F5FD9)',
                boxShadow: '0 6px 16px rgba(31,95,217,0.35)',
              }}
            >
              <ShieldCheck size={26} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#101A3D] leading-tight tracking-tight">초기 설정</h1>
              <p className="text-sm text-[#5C6A93] mt-1">
                {EVENT.title ? `${EVENT.title} — ` : ''}관리자 비밀번호를 설정합니다
              </p>
            </div>
          </div>

          <div
            className="rounded-xl p-3 mb-5 text-xs leading-relaxed"
            style={{ background: 'rgba(31,95,217,0.08)', border: '1px solid rgba(31,95,217,0.28)', color: '#17439C' }}
          >
            <div className="flex items-center gap-2 font-semibold text-[#17439C] mb-1"><KeyRound size={14} aria-hidden="true" />한 번만 진행되는 설정입니다</div>
            이 비밀번호는 이 브라우저에 SHA-256 해시로 저장됩니다. 운영위원과 공유할 조회용 PIN은
            로그인 후 <strong className="text-[#17439C]">'진행위원 인증 설정'</strong>에서 나중에 추가할 수
            있습니다. 관리자 비밀번호는 절대 공유하지 마세요.
          </div>

          <form onSubmit={handleSubmit} aria-describedby={error ? errorId : undefined}>
            {/* 관리자 표시명 */}
            <Field label="관리자 표시명" htmlFor={adminNameId} icon={<UserCog size={14} aria-hidden="true" />}>
              <input
                id={adminNameId}
                type="text"
                autoComplete="name"
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-[#101A3D] placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-300"
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
                className="flex-1 bg-transparent outline-none text-sm text-[#101A3D] placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-300"
                placeholder="알파벳·숫자·기호 조합 권장"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="ml-2 text-slate-400 hover:text-[#1F5FD9]"
                aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
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
                background: 'linear-gradient(135deg,#2F73F2,#1F5FD9)',
                boxShadow: '0 6px 16px rgba(31,95,217,0.35)',
              }}
            >
              {submitting ? '설정 저장 중…' : '설정 완료'}
            </button>

            <a
              href="https://github.com/lgh5440/eum-camp/blob/main/docs/AI_SETUP_GUIDE.md"
              target="_blank"
              rel="noopener"
              className="block text-center mt-3 text-[11px] text-slate-400 hover:text-[#1F5FD9] underline underline-offset-2"
            >
              이 시스템을 다른 교회와 공유하는 방법 보기
            </a>
          </form>
        </div>
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
      <label htmlFor={htmlFor} className="block text-[11px] font-medium text-[#3A4568] mb-1.5">
        {label}
      </label>
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: '#F8FBFF', border: '1px solid rgba(31,95,217,0.24)', boxShadow: 'inset 0 1px 2px rgba(31,95,217,0.04)' }}
      >
        <span className="text-[#1F5FD9] flex-shrink-0">{icon}</span>
        {children}
      </div>
    </div>
  );
}
