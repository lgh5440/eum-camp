// useAuth 훅과 AuthAction 권한 단위.
// AuthContext.tsx와 분리하여 react-refresh 규칙을 만족시킨다.

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './authContextValue';

/** 권한 단위 — UI에서 분기 시 사용 */
export type AuthAction =
  | 'edit:participants'
  | 'delete:participants'
  | 'delete:duplicate-applications'
  | 'edit:checklist'
  | 'edit:checkin'
  | 'edit:notices'
  | 'export:data'
  | 'manage:auth'
  | 'wipe:data';

// 진행위원(admin)만 쓰기 권한, 그 외 로그인 사용자는 조회 전용.
// committee 역할은 어떠한 쓰기 작업도 수행할 수 없도록 전부 차단.
export const COMMITTEE_ALLOWED: ReadonlySet<AuthAction> = new Set<AuthAction>([]);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
