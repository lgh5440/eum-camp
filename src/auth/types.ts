// 권한 / 역할 타입 정의
//
// admin     : 시스템 관리자 (홍길동 목사) — 모든 데이터 변경/삭제, 사용자 관리
// committee : 운영위원       — 데이터 입력/수정 가능, 삭제·시스템 설정 불가
// 비로그인  : 잠금화면 (LoginScreen)에서 차단

export type Role = 'admin' | 'committee';

export interface AuthCreds {
  /** 관리자 비밀번호 SHA-256 해시 (hex) */
  adminHash: string;
  /** 운영위원 공유 PIN SHA-256 해시 (hex) */
  committeeHash: string;
  /** 관리자 표시명 (헤더에 표시) */
  adminName: string;
  /** 첫 설정 시각 (ISO) */
  setupAt: string;
  /** 데이터 스키마 버전 — 향후 변경 시 마이그레이션 hook */
  version: number;
}

export interface Session {
  role: Role;
  /** 표시명. admin이면 adminName, committee면 입력한 이름 */
  displayName: string;
  /** 로그인 시각 (ISO) */
  loginAt: string;
}

export interface AuthState {
  creds: AuthCreds | null;     // null = 첫 실행 (Setup 필요)
  session: Session | null;     // null = 잠금 (Login 필요)
  failedAttempts: number;
  lockedUntil: number | null;  // ms epoch — 일시 잠금 해제 시각
}
