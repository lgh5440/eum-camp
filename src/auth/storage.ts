// localStorage 기반 인증 스토리지.
// 비밀번호/PIN은 평문이 아닌 SHA-256 해시로 저장한다.
// (※ 클라이언트 단독 인증은 본질적으로 약함 — 추후 Supabase 등 서버 인증으로 교체할 어댑터 자리)

import type { AuthCreds, Session } from './types';
import { queueCloudSave } from '../services/cloudStore';
import { publishStorageChange } from '../utils/storageEvents';

export const CREDS_KEY   = 'eum-camp:auth:creds';
export const SESSION_KEY = 'eum-camp:auth:session';
const ATTEMPT_KEY = 'eum-camp:auth:attempts';

const CRED_VERSION = 1;

// ── SHA-256 해시 (Web Crypto) ─────────────────────────────────────────────────
export async function hash(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── creds (관리자 hash + 위원 hash) ───────────────────────────────────────────
export function loadCreds(): AuthCreds | null {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as AuthCreds;
    if (!obj.adminHash || !obj.committeeHash) return null;
    return obj;
  } catch {
    return null;
  }
}

export async function saveCreds(args: {
  adminPassword: string;
  committeePin: string;
  adminName: string;
}): Promise<AuthCreds> {
  const creds: AuthCreds = {
    adminHash:     await hash(args.adminPassword),
    committeeHash: await hash(args.committeePin),
    adminName:     args.adminName.trim() || '관리자',
    setupAt:       new Date().toISOString(),
    version:       CRED_VERSION,
  };
  localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
  publishStorageChange(CREDS_KEY);
  queueCloudSave('authCreds', creds);
  return creds;
}

export async function rotateCreds(args: Partial<{
  adminPassword: string;
  committeePin: string;
  adminName: string;
}>): Promise<AuthCreds | null> {
  const cur = loadCreds();
  if (!cur) return null;
  const next: AuthCreds = {
    ...cur,
    adminName: args.adminName !== undefined ? args.adminName.trim() || cur.adminName : cur.adminName,
    adminHash:     args.adminPassword ? await hash(args.adminPassword) : cur.adminHash,
    committeeHash: args.committeePin  ? await hash(args.committeePin)  : cur.committeeHash,
  };
  localStorage.setItem(CREDS_KEY, JSON.stringify(next));
  publishStorageChange(CREDS_KEY);
  queueCloudSave('authCreds', next);
  return next;
}

export function clearCreds() {
  localStorage.removeItem(CREDS_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ATTEMPT_KEY);
  publishStorageChange(CREDS_KEY);
}

// ── session (현재 로그인 상태) ─────────────────────────────────────────────────
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as Session : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  publishStorageChange(SESSION_KEY);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  publishStorageChange(SESSION_KEY);
}

// ── 시도 횟수 (간이 brute-force 방지) ─────────────────────────────────────────
interface AttemptState { count: number; lockedUntil: number | null; }

export function loadAttempts(): AttemptState {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY);
    return raw ? JSON.parse(raw) as AttemptState : { count: 0, lockedUntil: null };
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

export function saveAttempts(a: AttemptState) {
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(a));
}

export function resetAttempts() {
  localStorage.removeItem(ATTEMPT_KEY);
}
