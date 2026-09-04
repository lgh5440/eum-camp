// localStorage 기반 인증 스토리지.
// 비밀번호/PIN은 평문이 아닌 SHA-256 해시로 저장한다.
// ⚠ 인증 해시(authCreds)는 이 기기 localStorage 에만 보관하고 클라우드로 동기화하지 않는다.
//   (익명 인증 환경에서 Firestore 에 올리면 외부인이 그대로 읽어 오프라인으로 PIN 을
//    복원할 수 있으므로 — firestore.rules 도 authCreds 접근을 전면 차단한다.)
// (※ 클라이언트 단독 인증은 본질적으로 약함 — 추후 서버 인증(custom claim)으로 교체할 어댑터 자리)

import type { AuthCreds, Session } from './types';
import { publishStorageChange } from '../utils/storageEvents';

export const CREDS_KEY   = 'eum-camp:auth:creds';
export const SESSION_KEY = 'eum-camp:auth:session';
const ATTEMPT_KEY = 'eum-camp:auth:attempts';

const CRED_VERSION = 2;
const PBKDF2_PREFIX = 'pbkdf2-sha256';
const PBKDF2_ITERATIONS = 120_000;
const PBKDF2_SALT_BYTES = 16;
const PBKDF2_KEY_BYTES = 32;

// ── SHA-256 해시 (Web Crypto) ─────────────────────────────────────────────────
export async function hash(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function deriveCredential(value: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(value),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new Uint8Array(salt).buffer as ArrayBuffer, iterations, hash: 'SHA-256' },
    key,
    PBKDF2_KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

/** New credentials use a random salt and PBKDF2-SHA-256. */
export async function hashCredential(value: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const derived = await deriveCredential(value, salt, PBKDF2_ITERATIONS);
  return `${PBKDF2_PREFIX}$${PBKDF2_ITERATIONS}$${encodeBase64Url(salt)}$${encodeBase64Url(derived)}`;
}

/** Verify both current PBKDF2 records and legacy SHA-256 records. */
export async function verifyCredential(value: string, stored: string): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (!stored.startsWith(`${PBKDF2_PREFIX}$`)) {
    const legacyHash = await hash(value);
    const valid = constantTimeEqual(legacyHash, stored);
    return { valid, needsRehash: valid };
  }
  const [, iterationText, saltText, expectedText] = stored.split('$');
  const iterations = Number(iterationText);
  if (!Number.isSafeInteger(iterations) || iterations < 1 || !saltText || !expectedText) {
    return { valid: false, needsRehash: false };
  }
  try {
    const actual = encodeBase64Url(await deriveCredential(value, decodeBase64Url(saltText), iterations));
    return { valid: constantTimeEqual(actual, expectedText), needsRehash: false };
  } catch {
    return { valid: false, needsRehash: false };
  }
}

// ── creds (관리자 hash + 위원 hash) ───────────────────────────────────────────
export function loadCreds(): AuthCreds | null {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as AuthCreds;
    if (!obj.adminHash) return null;
    return obj;
  } catch {
    return null;
  }
}

export async function saveCreds(args: {
  adminPassword: string;
  committeePin?: string;
  adminName: string;
}): Promise<AuthCreds> {
  const creds: AuthCreds = {
    adminHash:     await hashCredential(args.adminPassword),
    committeeHash: args.committeePin ? await hashCredential(args.committeePin) : null,
    adminName:     args.adminName.trim() || '관리자',
    setupAt:       new Date().toISOString(),
    version:       CRED_VERSION,
  };
  localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
  publishStorageChange(CREDS_KEY);
  return creds;
}

export async function rotateCreds(args: Partial<{
  adminPassword: string;
  committeePin: string;
  adminName: string;
}>): Promise<AuthCreds | null> {
  const cur = loadCreds();
  if (!cur) return null;
  return updateCreds(cur, args);
}

/** Upgrade a legacy credential immediately after a successful login. */
export async function upgradeCreds(args: Partial<{
  adminPassword: string;
  committeePin: string;
}>): Promise<AuthCreds | null> {
  const cur = loadCreds();
  if (!cur) return null;
  return updateCreds(cur, args);
}

async function updateCreds(cur: AuthCreds, args: Partial<{
  adminPassword: string;
  committeePin: string;
  adminName: string;
}>): Promise<AuthCreds> {
  const next: AuthCreds = {
    ...cur,
    adminName: args.adminName !== undefined ? args.adminName.trim() || cur.adminName : cur.adminName,
    adminHash:     args.adminPassword ? await hashCredential(args.adminPassword) : cur.adminHash,
    committeeHash: args.committeePin  ? await hashCredential(args.committeePin)  : cur.committeeHash,
  };
  localStorage.setItem(CREDS_KEY, JSON.stringify(next));
  publishStorageChange(CREDS_KEY);
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
