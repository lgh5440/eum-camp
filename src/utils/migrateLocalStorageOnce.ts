// localStorage 키 prefix 마이그레이션 (youth-retreat-* → eum-camp:*).
//
// 배경: 이음캠프는 마이리얼ID(youth-retreat-2026) 코드에서 fork된 generic 템플릿.
// fork 직후 두 종류의 잔재 키가 코드에 남아 있었음:
//   (1) 'youth-retreat-2026:*'  — 콜론 포함, 22개 키
//   (2) 'youth-retreat-*-v1'    — 콜론 없음, 6개 정확 키(참가자·체크인·체크리스트·교회확인·신청큐·변경로그)
// 두 종류를 모두 'eum-camp:*'로 통일하면서, 기존 사용자의 데이터를 보존하는 1회 마이그레이션.
//
// 안전 정책:
//   1. 신 키가 이미 있으면 덮어쓰지 않음 (사용자가 신 키로 작업한 데이터 보호)
//   2. 구 키는 즉시 삭제하지 않음 (롤백 안전망 — 다음 메이저 버전에서 정리 예정)
//   3. 마이그레이션 완료 플래그로 중복 실행 방지

const PREFIX_OLD = 'youth-retreat-2026:';
const PREFIX_NEW = 'eum-camp:';
const MIGRATION_FLAG_KEY = 'eum-camp:_migrated_from_yr2026';

/** 콜론 없는 구 키 → 신 키 정확 매핑 (의도치 않은 prefix 충돌 방지를 위해 명시적 테이블) */
const EXACT_KEY_MAP: Readonly<Record<string, string>> = {
  'youth-retreat-application-queue-v1':   'eum-camp:applications:queue:v1',
  'youth-retreat-change-log-v1':          'eum-camp:change-log:v1',
  'youth-retreat-checkin-v1':             'eum-camp:checkin:v1',
  'youth-retreat-checklist-status-v1':    'eum-camp:checklist:status:v1',
  'youth-retreat-church-confirm-v1':      'eum-camp:church-confirm:v1',
  'youth-retreat-participants-v1':        'eum-camp:participants:v1',
};

export function migrateLocalStorageOnce(): { migrated: number; skipped: number } | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    if (localStorage.getItem(MIGRATION_FLAG_KEY)) return null; // 이미 완료

    let migrated = 0;
    let skipped  = 0;

    // 후보 키 목록을 먼저 모음 (순회 중 변경하면 인덱스가 흔들림)
    const candidates: Array<{ oldKey: string; newKey: string }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      // (1) prefix 매칭
      if (k.startsWith(PREFIX_OLD)) {
        candidates.push({ oldKey: k, newKey: PREFIX_NEW + k.slice(PREFIX_OLD.length) });
        continue;
      }
      // (2) 정확 매핑
      const mapped = EXACT_KEY_MAP[k];
      if (mapped) candidates.push({ oldKey: k, newKey: mapped });
    }

    for (const { oldKey, newKey } of candidates) {
      const value = localStorage.getItem(oldKey);
      if (value === null) continue;

      // 신 키가 이미 있으면 사용자 데이터 보호 차원에서 덮어쓰지 않음
      if (localStorage.getItem(newKey) !== null) {
        skipped++;
        continue;
      }

      localStorage.setItem(newKey, value);
      migrated++;
      // 구 키는 보존 (롤백 안전망). 다음 메이저 버전에서 cleanup.
    }

    localStorage.setItem(MIGRATION_FLAG_KEY, new Date().toISOString());
    return { migrated, skipped };
  } catch {
    return null; // 마이그레이션 실패가 앱 부팅을 막아서는 안 됨
  }
}
