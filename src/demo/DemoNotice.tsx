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
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-[#BFDBFE] bg-white p-2.5">
              <div className="font-bold text-[#1B3A5C]">전체 편집</div>
              <div className="text-[10px] text-slate-400">진행위원 비밀번호</div>
              <code className="mt-1 block select-all rounded bg-[#EFF6FF] px-2 py-1 text-center font-mono text-sm font-bold tracking-wide text-[#101A3D]">{DEMO_CREDENTIALS.adminPassword}</code>
            </div>
            <div className="rounded-lg border border-[#BFDBFE] bg-white p-2.5">
              <div className="font-bold text-[#1B3A5C]">둘러보기</div>
              <div className="text-[10px] text-slate-400">조회용 PIN · 읽기 전용</div>
              <code className="mt-1 block select-all rounded bg-[#EFF6FF] px-2 py-1 text-center font-mono text-sm font-bold tracking-wide text-[#101A3D]">{DEMO_CREDENTIALS.committeePin}</code>
            </div>
          </div>
          <div className="mt-2 text-slate-300">이름은 선택 입력입니다. 기본값을 그대로 두셨다면 위 값을 사용하세요.</div>
          <details className="mt-2 text-slate-300">
            <summary className="cursor-pointer font-semibold">추가 안내</summary>
            <ul className="mt-1 space-y-1 pl-4">
              <li>5회 연속 틀리면 5분간 잠깁니다.</li>
              <li>{DEMO_RESET_LABEL}</li>
            </ul>
          </details>
        </>
      ) : (
        <ul className="space-y-1">
          <li>아래 값은 체험용 기본값입니다. 그대로 두고 시작하셔도 됩니다.</li>
          <li className="text-slate-300">
            여기서 정한 비밀번호·PIN 은 이 브라우저에만 저장됩니다.
          </li>
          <li className="text-slate-300">{DEMO_RESET_LABEL}</li>
        </ul>
      )}
    </div>
  );
}
