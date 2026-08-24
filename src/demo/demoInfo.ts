// 데모 배포본 안내에 쓰는 문자열.
//
// ⚠ 여기 값은 "안내"일 뿐 인증에 쓰이지 않는다.
//    이 앱의 비밀번호·PIN 은 접속자 브라우저의 localStorage 에 SHA-256 해시로 저장되고,
//    첫 접속 시 설정 화면에서 접속자가 직접 정한다(기본값이 아래와 같이 채워져 있다).
//    따라서 이 상수를 바꿔도 로그인 동작은 달라지지 않는다 — 설정 화면 기본값과 맞춰만 둔다.

export const DEMO_CREDENTIALS = {
  adminName: '체험용 관리자',
  adminPassword: 'demo1234',
  committeePin: '1234',
} as const;

export const DEMO_RESET_LABEL =
  '체험 중 입력·수정한 내용은 매일 새벽 4시(KST)에 처음 상태로 자동 초기화됩니다.';
