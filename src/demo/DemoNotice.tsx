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

export default function DemoNotice({ variant }: { variant: 'login' | 'setup' | 'dashboard' }) {
  if (!DEMO_MODE) return null;

  if (variant === 'dashboard') {
    return (
      <span className="rounded-md bg-[#2F73F2] px-2 py-0.5 text-[10px] font-black tracking-wider text-white" aria-label="데모 버전">
        DEMO
      </span>
    );
  }

  // 데모 설명은 최초 진입에서만 길게 보여주고, 로그인 화면에는 상태를 알리는 작은 배지만 남긴다.
  if (variant === 'login') {
    return (
      <div className="mb-4 flex justify-center" aria-label="데모 버전">
        <span className="rounded-md bg-[#2F73F2] px-2 py-0.5 text-[10px] font-black tracking-wider text-white">DEMO</span>
      </div>
    );
  }

  // 초기 설정 화면: '지금 체험판'이라는 사실 자체는 처음 들어오자마자 항상 보여야 하므로
  // 카드 위 최상단에 작은 배지로 항상 노출한다(숨기지 않음). 새벽 4시 초기화 같은 상세
  // 설명 3줄만 접이식으로 감춰 제목·입력·버튼을 가리지 않게 한다.
  if (variant === 'setup') {
    return (
      <details
        className="mb-4 rounded-xl text-[11px] leading-relaxed [&::-webkit-details-marker]:hidden"
        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#3A4568' }}
      >
        <summary
          className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 font-bold"
          style={{ color: '#1F5FD9' }}
        >
          <span className="rounded-md bg-[#2F73F2] px-2 py-0.5 text-[10px] font-black tracking-wider text-white">DEMO</span>
          <Info size={12} aria-hidden="true" />
          지금 체험판입니다 — 자세히
        </summary>
        <ul className="space-y-1 px-3 pb-3 pt-0.5">
          <li>아래 값은 체험용 기본값입니다. 그대로 두고 시작하셔도 됩니다.</li>
          <li>여기서 정한 비밀번호·PIN 은 이 브라우저에만 저장됩니다.</li>
          <li>{DEMO_RESET_LABEL}</li>
        </ul>
      </details>
    );
  }

  return (
    <div
      className="rounded-xl p-3.5 mb-4 text-[11px] leading-relaxed"
      style={{
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        color: '#3A4568',
      }}
    >
      <div className="flex items-center gap-1.5 mb-2 font-bold text-sm" style={{ color: '#1F5FD9' }}>
        <span className="rounded-md bg-[#2F73F2] px-2 py-0.5 text-xs font-black tracking-wider text-white">DEMO</span>
        <Info size={13} aria-hidden="true" />
        강의 체험용 데모 사이트입니다
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-[#BFDBFE] bg-white p-2.5">
          <div className="font-bold text-[#1F5FD9]">전체 편집</div>
          <div className="text-[10px] text-[#5C6A93]">진행위원 비밀번호</div>
          <code className="mt-1 block select-all rounded bg-[#EFF6FF] px-2 py-1 text-center font-mono text-sm font-bold tracking-wide text-[#101A3D]">{DEMO_CREDENTIALS.adminPassword}</code>
        </div>
        <div className="rounded-lg border border-[#BFDBFE] bg-white p-2.5">
          <div className="font-bold text-[#1F5FD9]">둘러보기</div>
          <div className="text-[10px] text-[#5C6A93]">조회용 PIN · 읽기 전용</div>
          <code className="mt-1 block select-all rounded bg-[#EFF6FF] px-2 py-1 text-center font-mono text-sm font-bold tracking-wide text-[#101A3D]">{DEMO_CREDENTIALS.committeePin}</code>
        </div>
      </div>
      <div className="mt-2 text-[#3A4568]">이름은 선택 입력입니다. 기본값을 그대로 두셨다면 위 값을 사용하세요.</div>
      <details className="mt-2 text-[#3A4568]">
        <summary className="cursor-pointer font-semibold">추가 안내</summary>
        <ul className="mt-1 space-y-1 pl-4">
          <li>5회 연속 틀리면 5분간 잠깁니다.</li>
          <li>{DEMO_RESET_LABEL}</li>
        </ul>
      </details>
    </div>
  );
}
