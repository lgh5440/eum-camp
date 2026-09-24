// 데모 배포본 표시 배지.
//
// ⚠ DEMO_MODE 가 꺼져 있으면(=기본값, 복사해 간 교회의 실제 운영 배포본) 아무것도 렌더하지 않는다.
//    체험용 문구가 실제 교회 화면에 찍히면 안 된다.
//
// 데모 배포본은 로그인·초기 설정 화면을 건너뛰고 대시보드로 바로 들어가므로(authGatePolicy),
// 지금 쓰이는 곳은 대시보드 헤더의 작은 DEMO 배지 하나뿐이다.

import { DEMO_MODE } from './demoConfig';

export default function DemoNotice({ variant }: { variant: 'dashboard' }) {
  if (!DEMO_MODE || variant !== 'dashboard') return null;

  return (
    <span className="rounded-md bg-[#2F73F2] px-2 py-0.5 text-[10px] font-black tracking-wider text-white" aria-label="데모 버전">
      DEMO
    </span>
  );
}
