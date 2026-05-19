// 대시보드 정적 카드 데이터 — localStorage 영속화

export interface ChurchRow  { name: string; count: number; quota: number; color: string }
export interface ScheduleItem { t: string; v: string }
export interface ScheduleDay  { day: string; date: string; accent: string; items: ScheduleItem[] }
export interface GroupRow    { name: string; count: number; leader: string; color: string }
export interface RoomRow     { name: string; cap: number; assigned: number }
export interface SafetyRow   { label: string; value: string; color: string; emoji: string }

const K = (s: string) => `eum-camp:dashboard:${s}`;

export const PALETTE = [
  '#06b6d4','#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6',
];

// ── 기본값 ────────────────────────────────────────────────────────────────────

const DEFAULT_CHURCHES: ChurchRow[] = [
  { name: '은혜교회', count: 12, quota: 14, color: '#06b6d4' },
  { name: '소망교회', count: 10, quota: 12, color: '#3b82f6' },
  { name: '사랑교회', count:  8, quota: 10, color: '#8b5cf6' },
  { name: '비전교회', count:  7, quota: 10, color: '#10b981' },
  { name: '주향교회', count:  6, quota:  8, color: '#f59e0b' },
];

const DEFAULT_SCHEDULE: ScheduleDay[] = [
  {
    day: '1일차', date: '07.26(주일)', accent: '#8b5cf6',
    items: [
      { t: '13:00', v: '등록' },
      { t: '14:00', v: '개회예배' },
      { t: '15:30', v: '아이스브레이킹' },
      { t: '19:00', v: '찬양과 교제' },
    ],
  },
  {
    day: '2일차', date: '07.27(월)', accent: '#06b6d4',
    items: [
      { t: '09:30', v: '아침묵상' },
      { t: '11:00', v: 'Real ID 카드' },
      { t: '14:00', v: 'Identity Quest' },
      { t: '19:30', v: '그룹 나눔' },
    ],
  },
  {
    day: '3일차', date: '07.28(화)', accent: '#3b82f6',
    items: [
      { t: '09:30', v: '결단예배' },
      { t: '11:00', v: '조별발표' },
      { t: '13:00', v: '마음카드' },
      { t: '14:00', v: '폐회 및 귀가' },
    ],
  },
];

const DEFAULT_GROUPS: GroupRow[] = [
  { name: '1조', count: 8, leader: '박진우 목사',   color: '#06b6d4' },
  { name: '2조', count: 8, leader: '최지수 목사',   color: '#3b82f6' },
  { name: '3조', count: 8, leader: '김지현 진도사', color: '#8b5cf6' },
  { name: '4조', count: 7, leader: '조이은 목사',   color: '#10b981' },
  { name: '5조', count: 8, leader: '한승국 목사',   color: '#f59e0b' },
  { name: '6조', count: 7, leader: '김주현 목사',   color: '#ef4444' },
];

const DEFAULT_ROOMS: RoomRow[] = [
  { name: '101호', cap: 8, assigned: 8 },
  { name: '102호', cap: 8, assigned: 8 },
  { name: '201호', cap: 8, assigned: 7 },
  { name: '202호', cap: 8, assigned: 7 },
];

const DEFAULT_SAFETY: SafetyRow[] = [
  { label: '알레르기',      value: '3명',  color: '#ef4444', emoji: '🚨' },
  { label: '복용약',        value: '2명',  color: '#f59e0b', emoji: '💊' },
  { label: '응급연락망',    value: '완료', color: '#10b981', emoji: '📞' },
  { label: '안전담당 배치', value: '완료', color: '#06b6d4', emoji: '🛡️' },
];

// ── 유틸 ─────────────────────────────────────────────────────────────────────

function load<T>(key: string, def: T): T {
  try {
    const raw = localStorage.getItem(K(key));
    return raw ? (JSON.parse(raw) as T) : def;
  } catch {
    return def;
  }
}

function save<T>(key: string, val: T) {
  localStorage.setItem(K(key), JSON.stringify(val));
}

// ── 공개 API ─────────────────────────────────────────────────────────────────

export const loadChurches  = () => load<ChurchRow[]>  ('churches', DEFAULT_CHURCHES);
export const loadSchedule  = () => load<ScheduleDay[]>('schedule', DEFAULT_SCHEDULE);
export const loadGroups    = () => load<GroupRow[]>   ('groups',   DEFAULT_GROUPS);
export const loadRooms     = () => load<RoomRow[]>    ('rooms',    DEFAULT_ROOMS);
export const loadSafety    = () => load<SafetyRow[]>  ('safety',   DEFAULT_SAFETY);

export const saveChurches  = (v: ChurchRow[])  => save('churches', v);
export const saveSchedule  = (v: ScheduleDay[]) => save('schedule', v);
export const saveGroups    = (v: GroupRow[])   => save('groups', v);
export const saveRooms     = (v: RoomRow[])    => save('rooms', v);
export const saveSafety    = (v: SafetyRow[])  => save('safety', v);
