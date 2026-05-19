// 전체 데이터 백업 — 시스템에 저장된 모든 localStorage 키를 스캔해
// 단일 JSON 파일로 묶어서 다운로드한다.
// (개별 페이지의 백업과 별개로, EventSettings의 "전체 데이터 백업"에서도 사용)

import { loadEventConfig } from '../config/eventConfigStorage';

const APP_PREFIX = 'eum-camp:';
const BACKUP_VER = 2;

export interface FullBackupPayload {
  /** 현재 이음캠프는 'eum-camp'로 기록. 과거 fork 흔적인 'youth-retreat-2026'도 후방호환 허용. */
  app: 'eum-camp' | 'youth-retreat-2026';
  schemaVersion: number;
  /** 백업 시각 (ISO 8601) */
  backupAt: string;
  /** 백업 시점의 행사명 — 식별용 */
  eventTitle: string;
  /** 백업 시점의 메인 슬로건 */
  theme: string;
  /** localStorage 전체 스냅샷 (key → JSON.parse된 값) */
  store: Record<string, unknown>;
  /** 사용자 에이전트 — 어느 기기에서 받았는지 추적 */
  userAgent: string;
}

/** localStorage 안의 eum-camp:* 키를 모두 모아 페이로드로 빌드 */
export function buildFullBackup(): { payload: FullBackupPayload; filename: string } {
  const event = loadEventConfig();
  const store: Record<string, unknown> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(APP_PREFIX)) continue;
    // 인증 관련 일부 키는 백업에서 제외 (해시지만 외부 유출 방지)
    if (key.endsWith(':auth:attempts')) continue;
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    try {
      store[key] = JSON.parse(raw);
    } catch {
      // JSON이 아니면 문자열 그대로
      store[key] = raw;
    }
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const safeTitle = event.title.replace(/[^\w가-힣\d]/g, '_').slice(0, 30) || 'event';
  const filename  = `${safeTitle}-fullbackup-${date}-${time}.json`;

  const payload: FullBackupPayload = {
    app:           'eum-camp',
    schemaVersion: BACKUP_VER,
    backupAt:      now.toISOString(),
    eventTitle:    event.title,
    theme:         event.theme,
    store,
    userAgent:     navigator.userAgent,
  };

  return { payload, filename };
}

/** 페이로드를 JSON 파일로 다운로드 트리거 */
export function downloadJsonFile(payload: unknown, filename: string): void {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // revoke는 click 이후 약간의 지연 (Safari 안전)
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 한 번에 빌드 + 다운로드 */
export function downloadFullBackup(): { filename: string; bytes: number; keyCount: number } {
  const { payload, filename } = buildFullBackup();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return {
    filename,
    bytes:    blob.size,
    keyCount: Object.keys(payload.store).length,
  };
}
