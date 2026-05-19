// 행사 메타정보 — 관리자가 GUI로 편집 가능한 단일 소스.
//
// 기본값(DEFAULT)은 코드에 박혀 있고, 관리자가 EventSettings 페이지에서 변경하면
// localStorage(+ cloudStore)에 override가 저장된다. 앱 부팅 시 두 값을 머지해서
// data/eventInfo.ts의 EVENT 상수가 만들어진다.

export interface PersonRef {
  name: string;
  role?: string;
  phone?: string;
}

export interface EventConfig {
  /** 데이터 스키마 버전. 향후 마이그레이션 hook */
  version: number;

  /** ── 기본 정보 ─────────────────────────────────────────── */
  /** 정식 행사명 (예: "○○○○ 수련회") */
  title: string;
  /** 메인 슬로건 / 메인 텍스트 */
  theme: string;
  /** 부제 (예: "AI 시대 속에서의 정체성") */
  subTheme: string;
  /** 표시용 기간 텍스트 (자동 생성됨, 비워두면 startDate/endDate에서 파생) */
  datesLabel?: string;
  /** D-day 계산 기준 시작일 YYYY-MM-DD */
  startDate: string;
  /** D-day 계산 기준 종료일 YYYY-MM-DD */
  endDate: string;

  /** ── 장소 ──────────────────────────────────────────────── */
  venue: string;
  venueAddress: string;

  /** ── 주최 단체 / 앱 ──────────────────────────────────────── */
  district: string;     // 예: "○○지방회 / ○○교회 청년부"
  appName: string;      // 헤더 표시 (예: "수련회 운영 시스템")

  /** ── 강사·진행팀 ─────────────────────────────────────────── */
  /** 강사 목록 — 0명~N명 자유. v2부터 동적 배열로 관리. */
  speakers: PersonRef[];
  worshipTeam: PersonRef;

  /** ── 문의 (LoginScreen·ErrorBoundary에 노출) ──────────────── */
  inquiry: PersonRef;

  /** ── 운영 수치 ────────────────────────────────────────────── */
  totalQuota: number;
  feeAmount:  number;

  /** ── 메인 이미지 (선택) ─────────────────────────────────────
   * 대시보드 Hero 영역에 표시할 이미지의 base64 data URL.
   * 비어 있으면 기본 HeroDecoration(SVG 일러스트)이 보임.
   * 약 500KB 이하 권장 — Firestore document 1MB 제한 고려.
   */
  heroImage?: string;
}

export const DEFAULT_EVENT_CONFIG: EventConfig = {
  version:      2,
  title:        '',
  theme:        '',
  subTheme:     '',
  startDate:    '',
  endDate:      '',
  venue:        '',
  venueAddress: '',
  district:     '',
  appName:      '이음 캠프 — 수련회·모임 운영 시스템',
  speakers:     [],
  worshipTeam:  { role: '찬양과 경배', name: '' },
  inquiry:      { role: '문의', name: '', phone: '' },
  totalQuota:   0,
  feeAmount:    0,
};

/** 행사 기본 정보가 입력됐는지 — App.tsx에서 EventSetupWizard 표시 여부 결정 */
export function isEventConfigured(cfg: EventConfig): boolean {
  return Boolean(cfg.title.trim() && cfg.startDate && cfg.endDate);
}

// ── 표시 포맷 헬퍼 ──────────────────────────────────────────────────────────

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

function parseDate(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** "07.26~07.28" 같은 짧은 날짜 라벨 */
export function formatDateShort(cfg: EventConfig): string {
  const s = parseDate(cfg.startDate);
  const e = parseDate(cfg.endDate);
  if (!s || !e) return '';
  const f = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  return `${f(s)}~${f(e)}`;
}

/** "7월 26~28일 (주일~화)" 같은 사이드바 라벨 */
export function formatDateBadge(cfg: EventConfig): string {
  const s = parseDate(cfg.startDate);
  const e = parseDate(cfg.endDate);
  if (!s || !e) return '';
  const m = s.getMonth() + 1;
  const sd = s.getDate();
  const ed = e.getDate();
  const sdow = s.getDay() === 0 ? '주일' : DOW[s.getDay()];
  const edow = e.getDay() === 0 ? '주일' : DOW[e.getDay()];
  return `${m}월 ${sd}~${ed}일 (${sdow}~${edow})`;
}

/** "2026.07.26(주일) - 07.28(화)" 같은 풀 날짜 라벨 */
export function formatDatesLabel(cfg: EventConfig): string {
  if (cfg.datesLabel) return cfg.datesLabel;
  const s = parseDate(cfg.startDate);
  const e = parseDate(cfg.endDate);
  if (!s || !e) return '';
  const f = (d: Date) => {
    const dow = d.getDay() === 0 ? '주일' : DOW[d.getDay()];
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}(${dow})`;
  };
  // 연도/월이 같으면 종료일은 월일만 표시
  const eShort = (e.getFullYear() === s.getFullYear())
    ? `${String(e.getMonth() + 1).padStart(2, '0')}.${String(e.getDate()).padStart(2, '0')}(${e.getDay() === 0 ? '주일' : DOW[e.getDay()]})`
    : f(e);
  return `${f(s)} - ${eShort}`;
}

/** v1 스키마 (eveningSpeaker / lectureSpeaker 2개 고정 슬롯) — 마이그레이션 목적의 형태 */
interface EventConfigV1Legacy {
  version?: number;
  eveningSpeaker?: PersonRef;
  lectureSpeaker?: PersonRef;
  speakers?: PersonRef[];
}

/** 입력값 sanitize — 빈 필드는 기본값으로 폴백. v1 데이터는 v2로 자동 마이그레이션. */
export function mergeEventConfig(override: Partial<EventConfig> | null): EventConfig {
  if (!override) return { ...DEFAULT_EVENT_CONFIG, speakers: [...DEFAULT_EVENT_CONFIG.speakers] };

  const merged: EventConfig = {
    ...DEFAULT_EVENT_CONFIG,
    ...override,
    // speakers는 아래에서 별도 처리
    speakers: DEFAULT_EVENT_CONFIG.speakers,
  };

  // ── 강사 목록: v1 마이그레이션 (eveningSpeaker / lectureSpeaker → speakers) ──
  const legacy = override as EventConfigV1Legacy;
  if (Array.isArray(legacy.speakers)) {
    // v2 형식 — speakers 배열 그대로 사용 (빈 배열 허용)
    merged.speakers = legacy.speakers.map(s => ({ ...s }));
  } else if (legacy.eveningSpeaker || legacy.lectureSpeaker) {
    // v1 형식 — 두 슬롯을 합쳐 배열로 (name이 있는 것만)
    const migrated: PersonRef[] = [];
    if (legacy.eveningSpeaker?.name) migrated.push({ ...legacy.eveningSpeaker });
    if (legacy.lectureSpeaker?.name) migrated.push({ ...legacy.lectureSpeaker });
    merged.speakers = migrated;
  } else {
    // override에 강사 정보 자체가 없으면 DEFAULT 복제 (빈 배열)
    merged.speakers = DEFAULT_EVENT_CONFIG.speakers.map(s => ({ ...s }));
  }

  // 단일 객체 필드는 부분 업데이트 허용
  merged.worshipTeam = { ...DEFAULT_EVENT_CONFIG.worshipTeam, ...(override.worshipTeam ?? {}) };
  merged.inquiry     = { ...DEFAULT_EVENT_CONFIG.inquiry,     ...(override.inquiry     ?? {}) };

  // 버전 항상 최신으로
  merged.version = DEFAULT_EVENT_CONFIG.version;

  return merged;
}
