import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthState, Role, Session } from './types';
import {
  clearCreds, clearSession, CREDS_KEY, loadAttempts, loadCreds, loadSession, resetAttempts, SESSION_KEY,
  rotateCreds, saveAttempts, saveCreds, saveSession, hash,
} from './storage';
import { AuthContext, type AuthContextValue } from './authContextValue';
import { COMMITTEE_ALLOWED, useAuth, type AuthAction } from './useAuth';
import { listenStorageChange } from '../utils/storageEvents';

const MAX_FAILED = 5;
const LOCK_MS    = 5 * 60_000; // 5분 잠금

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const a = loadAttempts();
    return {
      creds:          loadCreds(),
      session:        loadSession(),
      failedAttempts: a.count,
      lockedUntil:    a.lockedUntil,
    };
  });

  // 잠금 시간이 지나면 자동으로 카운트 리셋
  useEffect(() => {
    if (!state.lockedUntil) return;
    const ms = Math.max(0, state.lockedUntil - Date.now());
    const t = setTimeout(() => {
      resetAttempts();
      setState(s => ({ ...s, failedAttempts: 0, lockedUntil: null }));
    }, ms);
    return () => clearTimeout(t);
  }, [state.lockedUntil]);

  useEffect(() => {
    const refresh = () => {
      setState(s => ({
        ...s,
        creds: loadCreds(),
        session: loadSession(),
      }));
    };
    const stopCreds = listenStorageChange(CREDS_KEY, refresh);
    const stopSession = listenStorageChange(SESSION_KEY, refresh);
    return () => {
      stopCreds();
      stopSession();
    };
  }, []);

  const setup = useCallback(async (args: { adminPassword: string; committeePin?: string; adminName: string }) => {
    const creds = await saveCreds(args);
    setState(s => ({ ...s, creds }));
  }, []);

  const login = useCallback(async (input: string, displayName: string): Promise<Role | null> => {
    const creds = state.creds;
    if (!creds) return null;
    if (state.lockedUntil && state.lockedUntil > Date.now()) return null;

    const h = await hash(input);
    let role: Role | null = null;
    if (h === creds.adminHash)                              role = 'admin';
    else if (creds.committeeHash && h === creds.committeeHash) role = 'committee';

    if (!role) {
      const next = state.failedAttempts + 1;
      const lock = next >= MAX_FAILED ? Date.now() + LOCK_MS : null;
      saveAttempts({ count: next, lockedUntil: lock });
      setState(s => ({ ...s, failedAttempts: next, lockedUntil: lock }));
      return null;
    }

    const session: Session = {
      role,
      displayName: role === 'admin' ? creds.adminName : (displayName.trim() || '운영위원'),
      loginAt: new Date().toISOString(),
    };
    saveSession(session);
    resetAttempts();
    setState(s => ({ ...s, session, failedAttempts: 0, lockedUntil: null }));
    return role;
  }, [state.creds, state.failedAttempts, state.lockedUntil]);

  const logout = useCallback(() => {
    clearSession();
    setState(s => ({ ...s, session: null }));
  }, []);

  // 데모 체험(자동 설정+로그인)에서 '내 교회로 설정하기'로 전환할 때 씀 — creds까지 지워
  // AuthGate가 SetupScreen부터 다시 보여주게 한다.
  const resetInstallation = useCallback(() => {
    clearCreds();
    setState(s => ({ ...s, creds: null, session: null, failedAttempts: 0, lockedUntil: null }));
  }, []);

  const rotate = useCallback(async (args: Partial<{ adminPassword: string; committeePin: string; adminName: string }>): Promise<boolean> => {
    if (state.session?.role !== 'admin') return false;
    const next = await rotateCreds(args);
    if (!next) return false;
    setState(s => ({ ...s, creds: next }));
    return true;
  }, [state.session?.role]);

  const isAdmin = state.session?.role === 'admin';

  const can = useCallback((action: AuthAction) => {
    const role = state.session?.role;
    if (!role) return false;
    if (role === 'admin') return true;
    return COMMITTEE_ALLOWED.has(action);
  }, [state.session?.role]);

  const value = useMemo<AuthContextValue>(() => ({
    state, setup, login, logout, rotate, resetInstallation, isAdmin, can,
  }), [state, setup, login, logout, rotate, resetInstallation, isAdmin, can]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** 관리자 전용 영역 가드. children을 admin에게만 렌더한다. */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <>{fallback}</>;
}
