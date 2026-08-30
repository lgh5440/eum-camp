// 데모 배포본 안내 문구.
//
// ⚠ DEMO_MODE 가 꺼져 있으면(=기본값, 복사해 간 교회의 실제 운영 배포본) 아무것도 렌더하지 않는다.
//    체험용 계정 문구가 실제 교회 로그인 화면에 찍히면 안 된다.
//
// ⚠ 안내만 한다. 입력창 자동 채움·인증 자동 통과 같은 우회는 하지 않는다 —
//    접속자는 반드시 사람이 직접 입력해서 로그인한다.

import { Info } from 'lucide-react';
import { DEMO_MODE } from './demoConfig';
import { DEMO_CREDENTIALS, DEMO_RESET_LABEL } from './demoInfo';

export default function DemoNotice({ variant }: { variant: 'login' | 'setup' }) {
  if (!DEMO_MODE) return null;

  return (
    <div
      className="rounded-xl p-3.5 mb-4 text-[11px] leading-relaxed"
      style={{
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        color: '#3A4568',
      }}
    >
      <div className="flex items-center gap-1.5 mb-2 font-bold text-sm" style={{ color: '#1B3A5C' }}>
        <span className="rounded-md bg-[#1B3A5C] px-2 py-0.5 text-xs font-black tracking-wider text-white">DEMO</span>
        <Info size={13} aria-hidden="true" />
        강의 체험용 데모 사이트입니다
      </div>

      {variant === 'login' ? (
        <ul className="space-y-1">
          <li className="flex items-center gap-2"><span className="font-semibold">이름</span><code className="select-all rounded bg-white px-2 py-0.5 font-mono">{DEMO_CREDENTIALS.adminName}</code></li>
          <li>
            전체 편집 체험 — 진행위원 비밀번호{' '}
            <code className="px-1 py-0.5 rounded bg-white font-mono">{DEMO_CREDENTIALS.adminPassword}</code>
          </li>
          <li>
            둘러보기 전용 — 조회용 PIN{' '}
            <code className="px-1 py-0.5 rounded bg-white font-mono">{DEMO_CREDENTIALS.committeePin}</code>
          </li>
          <li className="text-[#3A4568]">
            접속 정보는 이 브라우저에서 처음 설정할 때 입력한 값입니다.
            기본값을 그대로 두셨다면 위와 같습니다.
          </li>
          <li className="text-[#3A4568]">5회 연속 틀리면 5분간 잠깁니다.</li>
          <li className="text-[#3A4568]">{DEMO_RESET_LABEL}</li>
        </ul>
      ) : (
        <ul className="space-y-1">
          <li>아래 값은 체험용 기본값입니다. 그대로 두고 시작하셔도 됩니다.</li>
          <li className="text-[#3A4568]">
            여기서 정한 비밀번호·PIN 은 이 브라우저에만 저장됩니다.
          </li>
          <li className="text-[#3A4568]">{DEMO_RESET_LABEL}</li>
        </ul>
      )}
    </div>
  );
}
