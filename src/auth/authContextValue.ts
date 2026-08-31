// AuthContext의 React.createContext 객체 + 타입.
// (컴포넌트 외 export를 분리해 react-refresh 규칙을 만족)

import { createContext } from 'react';
import type { AuthState, Role } from './types';
import type { AuthAction } from './useAuth';

export interface AuthContextValue {
  state: AuthState;
  setup: (args: { adminPassword: string; committeePin?: string; adminName: string }) => Promise<void>;
  login: (input: string, displayName: string) => Promise<Role | null>;
  logout: () => void;
  rotate: (args: Partial<{ adminPassword: string; committeePin: string; adminName: string }>) => Promise<boolean>;
  /** creds+session을 지워 SetupScreen부터 다시 시작하게 한다 — 데모 체험에서 '내 교회로 설정하기'로 전환할 때 씀. */
  resetInstallation: () => void;
  isAdmin: boolean;
  can: (action: AuthAction) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
