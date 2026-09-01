import React, { useMemo, useState, useRef } from 'react';
import { Download, Upload, Trash2, AlertTriangle, CheckCircle, XCircle, RotateCcw, History, CreditCard } from 'lucide-react';
import { loadParticipants, saveParticipants, resetParticipants } from '../utils/participantStorage';
import { loadChecklistStatusMap, saveChecklistStatusMap, resetChecklistStatusMap } from '../utils/checklistStorage';
import { loadCheckInMap, saveCheckInMap } from '../utils/checkInStorage';
import { loadChurchConfirmMap, saveChurchConfirmMap } from '../utils/churchConfirmStorage';
import { loadApplications, saveApplications, type ApplicationRecord } from '../utils/applicationsStorage';
import { clearChangeLog, loadChangeLog, saveChangeLog, type ChangeLogEntry } from '../utils/changeLogStorage';
import { useChangeLog } from '../hooks/useSharedData';
import { EVENT } from '../data/eventInfo';
import { AdminOnly } from '../auth/AuthContext';
import AdminAuthSettings from '../auth/AdminAuthSettings';
import type { StatusMap } from '../utils/checklistStorage';
import type { CheckInMap } from '../utils/checkInStorage';
import type { ChurchConfirmMap } from '../utils/churchConfirmStorage';
import type { Participant } from '../types';
import { feeStageDerive, FEE_STAGES } from '../utils/feeLabels';
import { logChange } from '../utils/changeLogStorage';

// 봉사자(회비 면제 대상) — 일괄 처리에서 제외
const NON_FEE_ROLES = ['운영진', '자원봉사', '찬양팀', '진행위원'];
function isVolunteer(p: Participant): boolean {
  if (p.role && NON_FEE_ROLES.includes(p.role)) return true;
  if (NON_FEE_ROLES.includes(p.grade)) return true;
  return false;
}

// ── 상수 ─────────────────────────────────────────────────────────────────────

const APP_NAME   = 'eum-camp';
const BACKUP_VER = 1;

// ── 타입 ─────────────────────────────────────────────────────────────────────

interface BackupPayload {
  app: string;
  eventName: string;
  theme: string;
  backupAt: string;
  version: number;
  participants: Participant[];
  checklistStatus: StatusMap;
  checkInMap?: CheckInMap;
  churchConfirmMap?: ChurchConfirmMap;
  applications?: ApplicationRecord[];
  changeLog?: ChangeLogEntry[];
}

interface RestorePreview {
  participantCount: number;
  checklistCount: number;
  checkInCount: number;
  churchConfirmCount: number;
  applicationCount: number;
  backupAt: string;
  eventName: string;
  payload: BackupPayload;
}

// ── 헬퍼: 백업 빌드 + 다운로드 ───────────────────────────────────────────────

function buildBackupPayload(): { payload: BackupPayload; filename: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;

  const payload: BackupPayload = {
    app:              APP_NAME,
    eventName:        EVENT.title,
    theme:            EVENT.theme,
    backupAt:         now.toISOString().slice(0, 19),
    version:          BACKUP_VER,
    participants:     loadParticipants(),
    checklistStatus:  loadChecklistStatusMap(),
    checkInMap:       loadCheckInMap(),
    churchConfirmMap: loadChurchConfirmMap(),
    applications:     loadApplications(),
    changeLog:        loadChangeLog(),
  };

  return { payload, filename: `eum-camp-backup-${date}-${time}.json` };
}

function triggerJsonDownload(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── 헬퍼: 백업 파일 검증 ────────────────────────────────────────────────────

type ValidateResult =
  | { ok: true;  preview: RestorePreview }
  | { ok: false; error: string };

function validateBackup(raw: unknown): ValidateResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'JSON 형식이 올바르지 않습니다.' };
  }

  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.participants)) {
    return { ok: false, error: '참가자 데이터(participants)가 배열이 아닙니다.' };
  }

  if (
    typeof obj.checklistStatus !== 'object' ||
    obj.checklistStatus === null ||
    Array.isArray(obj.checklistStatus)
  ) {
    return { ok: false, error: '체크리스트 상태(checklistStatus)가 올바른 객체가 아닙니다.' };
  }

  const isPlainObject = (v: unknown) =>
    typeof v === 'object' && v !== null && !Array.isArray(v);

  const payload: BackupPayload = {
    app:              typeof obj.app       === 'string' ? obj.app       : APP_NAME,
    eventName:        typeof obj.eventName === 'string' ? obj.eventName : EVENT.title,
    theme:            typeof obj.theme     === 'string' ? obj.theme     : EVENT.theme,
    backupAt:         typeof obj.backupAt  === 'string' ? obj.backupAt  : '',
    version:          typeof obj.version   === 'number' ? obj.version   : 0,
    participants:     obj.participants as Participant[],
    checklistStatus:  obj.checklistStatus as StatusMap,
    checkInMap:       isPlainObject(obj.checkInMap)       ? obj.checkInMap as CheckInMap       : undefined,
    churchConfirmMap: isPlainObject(obj.churchConfirmMap) ? obj.churchConfirmMap as ChurchConfirmMap : undefined,
  };

  return {
    ok: true,
    preview: {
      participantCount:  payload.participants.length,
      checklistCount:    Object.keys(payload.checklistStatus).length,
      checkInCount:      payload.checkInMap       ? Object.keys(payload.checkInMap).length       : 0,
      churchConfirmCount: payload.churchConfirmMap ? Object.keys(payload.churchConfirmMap).length : 0,
      applicationCount:  payload.applications ? payload.applications.length : 0,
      backupAt:          payload.backupAt || '알 수 없음',
      eventName:         payload.eventName,
      payload,
    },
  };
}

// ── 스타일 상수 ───────────────────────────────────────────────────────────────

const CARD = {
  background: 'rgba(255,255,255,0.07)',
  border:     '1px solid rgba(255,255,255,0.12)',
  boxShadow:  '0 4px 24px rgba(31,95,217,0.25)',
} as const;

const BTN_CYAN = {
  background: 'linear-gradient(135deg,#3B82F6,#2563eb)',
  boxShadow:  '0 4px 14px rgba(37, 99, 235,0.3)',
  color:      '#fff',
} as const;

const BTN_AMBER = {
  background: 'linear-gradient(135deg,#d97706,#f59e0b)',
  boxShadow:  '0 4px 14px rgba(245,158,11,0.3)',
  color:      '#fff',
} as const;

const BTN_RED = {
  background: 'linear-gradient(135deg,#dc2626,#ef4444)',
  boxShadow:  '0 4px 14px rgba(239,68,68,0.3)',
  color:      '#fff',
} as const;

// ── 공통 소형 컴포넌트 ────────────────────────────────────────────────────────

function SuccessBanner({ children, onReload }: { children: React.ReactNode; onReload?: () => void }) {
  return (
    <div className="rounded-xl px-4 py-3 space-y-2"
      style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
      <div className="flex items-center gap-2 text-xs font-bold" style={{ color: '#10b981' }}>
        <CheckCircle size={14} />
        {children}
      </div>
      <p className="text-xs text-slate-400">
        다른 페이지로 이동하거나 새로고침하면 변경 내용이 반영됩니다.
      </p>
      {onReload && (
        <button
          onClick={onReload}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          지금 새로고침
        </button>
      )}
    </div>
  );
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold"
      style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
      <XCircle size={13} className="flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function Stat({ label, value, color, highlight }: { label: string; value: number; color: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2"
      style={{
        background: highlight ? `${color}1f` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${highlight ? color + '55' : 'rgba(255,255,255,0.06)'}`,
      }}>
      <span className="text-slate-400">{label}</span>
      <span className="font-bold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function DataManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const changeLog = useChangeLog();

  const [preview,    setPreview]    = useState<RestorePreview | null>(null);
  const [fileError,  setFileError]  = useState('');
  const [restoreMsg, setRestoreMsg] = useState<'idle' | 'success' | 'error'>('idle');
  const [backupMsg,  setBackupMsg]  = useState('');
  const [resetDone,  setResetDone]  = useState(false);
  const [feeBulkMsg, setFeeBulkMsg] = useState<string | null>(null);

  // ── 참가비 일괄 처리 미리보기 ─────────────────────────────────────────────
  const feeBulkPreview = useMemo(() => {
    const all = loadParticipants();
    const active = all.filter(p => p.status !== 'cancelled');
    const volunteers = active.filter(isVolunteer);
    const target = active.filter(p => !isVolunteer(p));
    const breakdown = {
      pre:    target.filter(p => p.feeStage === 'pre').length,
      first:  target.filter(p => p.feeStage === 'first').length,
      second: target.filter(p => p.feeStage === 'second').length,
      unpaid: target.filter(p => p.feeStage === 'unpaid' || (!p.feeStage && p.fee === 'unpaid')).length,
      other:  target.filter(p => !p.feeStage && p.fee !== 'unpaid').length,
    };
    return { totalActive: active.length, volunteers: volunteers.length, target: target.length, breakdown };
  }, [feeBulkMsg]); // feeBulkMsg가 바뀌면(처리 후) 다시 계산

  function applyFeeBulk(mode: 'unpaid-only' | 'all') {
    const list = loadParticipants();
    const stage = feeStageDerive('pre');
    let changed = 0;
    const next = list.map(p => {
      if (p.status === 'cancelled') return p;
      if (isVolunteer(p)) return p;
      if (mode === 'unpaid-only') {
        const isUnpaid = p.feeStage === 'unpaid' || (!p.feeStage && p.fee === 'unpaid');
        if (!isUnpaid) return p;
      }
      // 'all' 모드는 1차·2차 등록자도 가등록(2만원)으로 재설정
      if (p.feeStage === 'pre' && p.fee === stage.bucket && p.feeAmount === stage.amount) return p;
      changed++;
      return { ...p, feeStage: 'pre' as const, fee: stage.bucket, feeAmount: stage.amount };
    });
    if (changed === 0) {
      setFeeBulkMsg('변경할 대상이 없습니다.');
      window.setTimeout(() => setFeeBulkMsg(null), 3000);
      return;
    }
    saveParticipants(next);
    const label = mode === 'unpaid-only' ? '미입금자' : '봉사자 외 전원';
    logChange('참가비 일괄 처리', `${label} ${changed}명을 가등록(2만원)으로 일괄 처리`);
    setFeeBulkMsg(`${changed}명을 가등록(2만원)으로 처리했습니다.`);
    window.setTimeout(() => setFeeBulkMsg(null), 4500);
  }

  // ── 1. 백업 다운로드 ────────────────────────────────────────────────────────

  function handleDownload() {
    try {
      const { payload, filename } = buildBackupPayload();
      triggerJsonDownload(JSON.stringify(payload, null, 2), filename);
      setBackupMsg(filename);
      setTimeout(() => setBackupMsg(''), 6000);
    } catch {
      setBackupMsg('ERROR');
    }
  }

  // ── 2a. 파일 선택 → 파싱 → 미리보기 ────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError('');
    setPreview(null);
    setRestoreMsg('idle');

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw    = JSON.parse(ev.target?.result as string);
        const result = validateBackup(raw);
        if (result.ok) {
          setPreview(result.preview);
        } else {
          setFileError(result.error);
        }
      } catch {
        setFileError('파일을 파싱할 수 없습니다. 올바른 JSON 파일인지 확인하세요.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // 같은 파일 재선택 허용
  }

  // ── 2b. 복원 실행 ───────────────────────────────────────────────────────────

  function handleRestore() {
    if (!preview) return;
    try {
      saveParticipants(preview.payload.participants);
      saveChecklistStatusMap(preview.payload.checklistStatus, '백업 파일에서 복원');
      if (preview.payload.checkInMap) {
        saveCheckInMap(preview.payload.checkInMap);
      }
      if (preview.payload.churchConfirmMap) {
        saveChurchConfirmMap(preview.payload.churchConfirmMap);
      }
      if (preview.payload.applications) {
        saveApplications(preview.payload.applications, '백업 파일에서 신청 대기함 복원');
      }
      if (preview.payload.changeLog) {
        saveChangeLog(preview.payload.changeLog);
      }
      setPreview(null);
      setRestoreMsg('success');
    } catch {
      setRestoreMsg('error');
    }
  }

  // ── 3. 전체 초기화 ──────────────────────────────────────────────────────────

  function handleReset() {
    const first = window.confirm(
      '정말 모든 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
    );
    if (!first) return;
    const second = window.confirm(
      '초기화하면 모든 참가자 데이터와 체크리스트 상태가 삭제됩니다.\n계속하시겠습니까?',
    );
    if (!second) return;
    resetParticipants();
    resetChecklistStatusMap();
    saveCheckInMap({});
    saveChurchConfirmMap({});
    saveApplications([], '신청 대기함 초기화');
    clearChangeLog();
    setResetDone(true);
    setPreview(null);
  }

  // ── 렌더 ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-3xl">

      {/* 페이지 제목 */}
      <div>
        <h2 className="text-lg font-bold text-[#101A3D] mb-0.5">데이터 관리</h2>
        <p className="text-xs text-slate-400">
          참가자 데이터와 체크리스트 상태를 JSON 파일로 백업하거나 복원합니다.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════
          관리자 인증 설정 (관리자에게만 표시)
      ══════════════════════════════════════════════════ */}
      <AdminAuthSettings />

      <section className="rounded-2xl p-5" style={CARD}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(20,184,166,0.18)' }}
            >
              <History size={18} className="text-teal-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#101A3D]">변경 내역</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                참가자, 신청 대기함, 체크리스트, 교회 확인 변경을 최근 순으로 남깁니다.
              </p>
            </div>
          </div>
          <AdminOnly fallback={null}>
            <button
              onClick={() => {
                if (window.confirm('변경 내역을 모두 비울까요?')) clearChangeLog();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10"
            >
              비우기
            </button>
          </AdminOnly>
        </div>

        {changeLog.length === 0 ? (
          <div className="text-xs text-slate-500 rounded-xl px-4 py-3 bg-white/[0.03] border border-white/[0.06]">
            아직 기록된 변경 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {changeLog.slice(0, 8).map(entry => (
              <div
                key={entry.id}
                className="rounded-xl px-4 py-3 text-xs bg-white/[0.035] border border-white/[0.07]"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-slate-200">{entry.action}</span>
                  <span className="text-slate-500">{new Date(entry.at).toLocaleString('ko-KR')}</span>
                </div>
                <div className="mt-1 text-slate-400">{entry.detail}</div>
                <div className="mt-1 text-[11px] text-slate-500">작업자: {entry.actor}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════
          참가비 일괄 처리 (봉사자 제외)
      ══════════════════════════════════════════════════ */}
      <AdminOnly fallback={null}>
        <section className="rounded-2xl p-5" style={{ ...CARD, borderColor: 'rgba(14,165,233,0.3)' }}>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(14,165,233,0.2)' }}>
              <CreditCard size={18} className="text-sky-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#101A3D]">참가비 일괄 처리 (가등록 2만원)</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                봉사자(운영진·자원봉사·찬양팀·진행위원)를 제외한 모든 신청자를 가등록(2만원)으로 일괄 변경합니다.
                <br/>이미 6만원·7만원 입금하신 분의 데이터는 두 번째 옵션을 선택해야 변경됩니다.
              </p>
            </div>
          </div>

          {/* 현재 상태 미리보기 */}
          <div className="rounded-xl p-3 mb-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[11px] text-slate-400 mb-2 font-bold">현재 신청자 분포</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <Stat label="전체 인원"            value={feeBulkPreview.totalActive} color="#3B82F6" />
              <Stat label="봉사자 (제외)"        value={feeBulkPreview.volunteers}  color="#8b5cf6" />
              <Stat label="처리 대상"            value={feeBulkPreview.target}      color="#93C5FD" highlight />
              <Stat label="가등록 (2만)"         value={feeBulkPreview.breakdown.pre}    color={FEE_STAGES[0].color} />
              <Stat label="1차 등록 (6만)"       value={feeBulkPreview.breakdown.first}  color={FEE_STAGES[1].color} />
              <Stat label="2차 등록 (7만)"       value={feeBulkPreview.breakdown.second} color={FEE_STAGES[2].color} />
              <Stat label="미입금"               value={feeBulkPreview.breakdown.unpaid} color={FEE_STAGES[3].color} />
              {feeBulkPreview.breakdown.other > 0 && (
                <Stat label="기타 (레거시)" value={feeBulkPreview.breakdown.other} color="#94a3b8" />
              )}
            </div>
          </div>

          {/* 처리 옵션 2가지 */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`미입금자 ${feeBulkPreview.breakdown.unpaid}명을 가등록(2만원)으로 변경합니다. 계속하시겠습니까?`)) {
                  applyFeeBulk('unpaid-only');
                }
              }}
              disabled={feeBulkPreview.breakdown.unpaid === 0}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all"
              style={feeBulkPreview.breakdown.unpaid === 0
                ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#475569', cursor: 'not-allowed' }
                : { background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.4)', color: '#7dd3fc' }
              }
            >
              <span className="flex items-center gap-2">
                <CheckCircle size={14}/> ① 미입금자만 가등록 처리 <span className="text-[11px] font-normal opacity-70">(권장 — 안전)</span>
              </span>
              <span className="text-[11px] opacity-80">{feeBulkPreview.breakdown.unpaid}명 변경</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const willChange = feeBulkPreview.target - feeBulkPreview.breakdown.pre;
                if (willChange === 0) {
                  setFeeBulkMsg('이미 모두 가등록 상태입니다.');
                  window.setTimeout(() => setFeeBulkMsg(null), 3000);
                  return;
                }
                const ok = window.confirm(
                  `봉사자 외 전원(${feeBulkPreview.target}명)을 가등록(2만원)으로 재설정합니다.\n` +
                  `기존 1차(${feeBulkPreview.breakdown.first}명)·2차(${feeBulkPreview.breakdown.second}명) 입금 정보가 가등록으로 덮어쓰기됩니다.\n\n계속하시겠습니까?`,
                );
                if (ok) applyFeeBulk('all');
              }}
              disabled={feeBulkPreview.target === 0}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all"
              style={feeBulkPreview.target === 0
                ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#475569', cursor: 'not-allowed' }
                : { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', color: '#fbbf24' }
              }
            >
              <span className="flex items-center gap-2">
                <AlertTriangle size={14}/> ② 전원 가등록으로 재설정 <span className="text-[11px] font-normal opacity-70">(1차·2차 입금자 포함)</span>
              </span>
              <span className="text-[11px] opacity-80">{feeBulkPreview.target}명 변경</span>
            </button>
          </div>

          {feeBulkMsg && (
            <div className="mt-3 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7' }}>
              <CheckCircle size={13}/> {feeBulkMsg}
            </div>
          )}
        </section>
      </AdminOnly>

      {/* ══════════════════════════════════════════════════
          섹션 1 — 백업 다운로드
      ══════════════════════════════════════════════════ */}
      <section className="rounded-2xl p-5" style={CARD}>
        {/* 헤더 */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(37, 99, 235,0.2)' }}>
            <Download size={18} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#101A3D]">백업 파일 다운로드</h3>
            <p className="text-xs text-slate-400 mt-0.5">현재 데이터를 JSON 파일로 저장합니다.</p>
          </div>
        </div>

        {/* 포함 항목 안내 */}
        <ul
          className="rounded-xl px-4 py-3 mb-4 space-y-1 text-xs text-slate-400 list-disc list-inside"
          style={{ background: 'rgba(37, 99, 235,0.07)', border: '1px solid rgba(37, 99, 235,0.14)' }}
        >
          <li>참가자 목록 (이름, 교회, 조, 방, 차량, 참가비 등)</li>
          <li>체크리스트 완료 상태</li>
          <li>현장 체크인 기록</li>
          <li>교회별 최종 확인 상태</li>
          <li>백업 일시 · 수련회명 · 앱 버전</li>
        </ul>

        {/* 상태 메시지 */}
        {backupMsg && backupMsg !== 'ERROR' && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ color: '#10b981', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <CheckCircle size={13} />
            백업 파일이 저장되었습니다 ({backupMsg})
          </div>
        )}
        {backupMsg === 'ERROR' && (
          <div className="mb-3"><ErrorBanner>백업 파일 생성 중 오류가 발생했습니다.</ErrorBanner></div>
        )}

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 hover:brightness-110 active:scale-95"
          style={BTN_CYAN}
        >
          <Download size={15} />
          백업 파일 다운로드
        </button>
      </section>

      {/* ══════════════════════════════════════════════════
          섹션 2 — 백업 복원
      ══════════════════════════════════════════════════ */}
      <section className="rounded-2xl p-5" style={CARD}>
        {/* 헤더 */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.2)' }}>
            <Upload size={18} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#101A3D]">백업 복원</h3>
            <p className="text-xs text-slate-400 mt-0.5">JSON 백업 파일을 불러와 데이터를 복원합니다.</p>
          </div>
        </div>

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* 파일 선택 버튼 (미리보기·성공 상태가 아닐 때만 표시) */}
        {!preview && restoreMsg !== 'success' && (
          <button
            onClick={() => { setFileError(''); fileInputRef.current?.click(); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 hover:brightness-110 active:scale-95"
            style={BTN_AMBER}
          >
            <Upload size={15} />
            백업 파일 불러오기
          </button>
        )}

        {/* 파싱 오류 */}
        {fileError && (
          <div className="mt-3"><ErrorBanner>{fileError}</ErrorBanner></div>
        )}

        {/* 복원 미리보기 */}
        {preview && (
          <div className="mt-3 space-y-3">
            {/* 미리보기 카드 */}
            <div className="rounded-xl p-4"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <div className="text-xs font-bold text-amber-400 mb-3">📋 백업 파일 미리보기</div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                <div>
                  <div className="text-slate-500 mb-0.5">수련회명</div>
                  <div className="text-slate-200 font-medium text-[11px] leading-snug">{preview.eventName}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-0.5">백업 일시</div>
                  <div className="text-slate-200 font-medium">{preview.backupAt.replace('T', ' ')}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-0.5">참가자 수</div>
                  <div className="font-black text-lg leading-none" style={{ color: '#3B82F6' }}>
                    {preview.participantCount}
                    <span className="text-xs font-semibold text-slate-400 ml-0.5">명</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-0.5">체크리스트 항목</div>
                  <div className="font-black text-lg leading-none" style={{ color: '#10b981' }}>
                    {preview.checklistCount}
                    <span className="text-xs font-semibold text-slate-400 ml-0.5">개</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-0.5">체크인 기록</div>
                  <div className="font-black text-lg leading-none" style={{ color: '#f59e0b' }}>
                    {preview.checkInCount}
                    <span className="text-xs font-semibold text-slate-400 ml-0.5">명</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-0.5">교회별 확인</div>
                  <div className="font-black text-lg leading-none" style={{ color: '#8b5cf6' }}>
                    {preview.churchConfirmCount}
                    <span className="text-xs font-semibold text-slate-400 ml-0.5">교회</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 덮어쓰기 경고 */}
            <div className="rounded-xl px-3 py-2.5 flex items-start gap-2 text-xs"
              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-400">
                복원하면 현재 저장된 데이터가 백업 파일 내용으로{' '}
                <strong className="text-red-400">덮어쓰기</strong>됩니다.
              </span>
            </div>

            {/* 복원 / 취소 버튼 */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleRestore}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 hover:brightness-110 active:scale-95"
                style={BTN_AMBER}
              >
                <RotateCcw size={15} />
                복원하기
              </button>
              <button
                onClick={() => { setPreview(null); setFileError(''); }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 복원 성공 */}
        {restoreMsg === 'success' && (
          <div className="mt-3">
            <SuccessBanner onReload={() => window.location.reload()}>
              복원이 완료되었습니다.
            </SuccessBanner>
            <button
              onClick={() => { setRestoreMsg('idle'); setFileError(''); }}
              className="mt-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              다른 파일 복원하기 →
            </button>
          </div>
        )}

        {/* 복원 오류 */}
        {restoreMsg === 'error' && (
          <div className="mt-3">
            <ErrorBanner>복원 중 오류가 발생했습니다. 다시 시도하세요.</ErrorBanner>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════
          섹션 3 — 전체 초기화 (관리자 전용)
      ══════════════════════════════════════════════════ */}
      <AdminOnly fallback={
        <div
          className="rounded-2xl p-4 text-xs text-slate-400"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}
          role="note"
        >
          전체 데이터 초기화는 관리자만 수행할 수 있습니다.
        </div>
      }>
      <section
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(239,68,68,0.05)',
          border:     '1px solid rgba(239,68,68,0.18)',
          boxShadow:  '0 4px 24px rgba(31,95,217,0.25)',
        }}
      >
        {/* 헤더 */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.2)' }}>
            <Trash2 size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: '#f87171' }}>전체 데이터 초기화</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              참가자·체크리스트·체크인 데이터를 삭제하고 초기 상태로 돌아갑니다.
            </p>
          </div>
        </div>

        {/* 위험 경고 */}
        <div className="rounded-xl px-3 py-2.5 mb-4 flex items-start gap-2 text-xs"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-slate-400">
            이 작업은 <strong className="text-red-400">되돌릴 수 없습니다</strong>.
            초기화 전에 반드시 백업 파일을 다운로드하세요.
          </span>
        </div>

        {resetDone ? (
          <SuccessBanner onReload={() => window.location.reload()}>
            초기화가 완료되었습니다.
          </SuccessBanner>
        ) : (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 hover:brightness-110 active:scale-95"
            style={BTN_RED}
          >
            <Trash2 size={15} />
            전체 데이터 초기화
          </button>
        )}
      </section>
      </AdminOnly>

    </div>
  );
}
