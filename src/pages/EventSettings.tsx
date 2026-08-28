// 관리자 전용 통합 설정 페이지.
//   섹션 A — 관리자 인증 설정 (이름·비밀번호·운영위원 PIN 회전)
//   섹션 B — 행사 메타 (제목·주제·기간·장소·강사·문의)
//   섹션 C — 전체 데이터 백업 다운로드
//   섹션 D — 새 행사 시작 (기본값으로 초기화)
//
// 변경 후 EVENT 정적 상수가 갱신되도록 1초 토스트 후 자동 새로고침.

import { useId, useState } from 'react';
import {
  Settings as SettingsIcon, Download, RefreshCw, Save,
  CheckCircle2, AlertTriangle, MapPin, Calendar, Mic,
  Users as UsersIcon, Phone, Sparkles, Eye, EyeOff, Lock,
  Plus, X,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import AdminAuthSettings from '../auth/AdminAuthSettings';
import {
  loadEventConfig, saveEventConfig, resetEventConfig,
} from '../config/eventConfigStorage';
import { DEFAULT_EVENT_CONFIG, type EventConfig, type PersonRef } from '../config/eventConfig';
import { downloadFullBackup } from '../utils/fullBackup';
import { navItems, type PageKey } from '../components/Sidebar';
import { useMenuVisibility } from '../hooks/useSharedData';
import {
  saveMenuVisibility, isAlwaysVisible, isMenuVisible, type MenuVisibility,
} from '../utils/menuVisibilityStorage';

export default function EventSettings() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div
        className="rounded-2xl p-6 text-sm text-slate-300 max-w-2xl"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
        role="alert"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 text-red-300 flex-shrink-0" aria-hidden="true" />
          <div>
            <div className="font-bold text-red-200 mb-1">접근 권한 없음</div>
            이 페이지는 관리자만 사용할 수 있습니다. 운영위원 권한으로 로그인된 상태입니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* 페이지 제목 */}
      <div>
        <h2 className="text-lg font-bold text-[#1B3A5C] mb-0.5 flex items-center gap-2">
          <SettingsIcon size={18} className="text-cyan-400" aria-hidden="true" />
          행사·운영 설정 (관리자 전용)
        </h2>
        <p className="text-xs text-slate-400">
          관리자 인증·행사 메타정보·전체 데이터 백업 등 시스템 설정을 한 곳에서 관리합니다.
        </p>
      </div>

      {/* 섹션 A — 관리자 인증 (기존 컴포넌트 재사용) */}
      <AdminAuthSettings />

      {/* 섹션 B — 행사 메타 */}
      <EventMetaEditor />

      {/* 섹션 B-2 — 사이드바 메뉴 선택 */}
      <MenuVisibilitySection />

      {/* 섹션 C — 전체 데이터 백업 */}
      <FullBackupSection />

      {/* 섹션 D — 새 행사 시작 */}
      <NewEventSection />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 섹션 B — 행사 메타 편집
// ═══════════════════════════════════════════════════════════════════════════

function EventMetaEditor() {
  const [draft, setDraft] = useState<EventConfig>(() => loadEventConfig());
  const [busy, setBusy]   = useState(false);
  const [ok, setOk]       = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof EventConfig>(key: K, value: EventConfig[K]) {
    setDraft(d => ({ ...d, [key]: value }));
  }
  function updatePerson<K extends 'worshipTeam' | 'inquiry'>(
    key: K, field: 'name' | 'role' | 'phone', value: string
  ) {
    setDraft(d => ({ ...d, [key]: { ...d[key], [field]: value } }));
  }

  // ── 강사 목록 핸들러 ───────────────────────────────────────────────
  function updateSpeaker(idx: number, field: 'name' | 'role', value: string) {
    setDraft(d => {
      const next = d.speakers.map((s, i) => i === idx ? { ...s, [field]: value } : s);
      return { ...d, speakers: next };
    });
  }
  function addSpeaker() {
    setDraft(d => ({ ...d, speakers: [...d.speakers, { role: '', name: '' } as PersonRef] }));
  }
  function removeSpeaker(idx: number) {
    setDraft(d => ({ ...d, speakers: d.speakers.filter((_, i) => i !== idx) }));
  }

  function validate(): string | null {
    if (!draft.title.trim())     return '행사명을 입력해 주세요.';
    if (!draft.theme.trim())     return '메인 텍스트(주제)를 입력해 주세요.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.startDate)) return '시작일 형식이 올바르지 않습니다 (YYYY-MM-DD).';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.endDate))   return '종료일 형식이 올바르지 않습니다 (YYYY-MM-DD).';
    if (draft.startDate > draft.endDate)               return '시작일이 종료일보다 늦습니다.';
    if (!draft.venue.trim())                           return '장소명을 입력해 주세요.';
    if (draft.totalQuota < 1)                          return '총원은 1명 이상이어야 합니다.';
    if (draft.feeAmount < 0)                           return '참가비는 0원 이상이어야 합니다.';
    return null;
  }

  function handleSave() {
    const v = validate();
    if (v) { setError(v); return; }
    setBusy(true);
    setError(null);
    try {
      saveEventConfig(draft);
      setOk(true);
      // 1.2초 후 새로고침해서 EVENT 정적 상수 재계산
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.');
      setBusy(false);
    }
  }

  return (
    <section
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(37, 99, 235,0.05)',
        border: '1px solid rgba(37, 99, 235,0.2)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}
      aria-labelledby="meta-heading"
    >
      <header className="flex items-start gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(37, 99, 235,0.2)' }}
        >
          <Sparkles size={18} className="text-cyan-400" aria-hidden="true" />
        </div>
        <div>
          <h3 id="meta-heading" className="text-sm font-bold text-cyan-300">행사 메타정보</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            메인 텍스트·주제·날짜·장소·강사·문의를 변경합니다. 저장하면 페이지가 자동 새로고침되어 모든 화면에 반영됩니다.
          </p>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="행사명" colSpan={2}>
          <Input
            value={draft.title}
            onChange={v => update('title', v)}
            placeholder="예: 2027 ○○교회 여름 수련회"
          />
        </Field>

        <Field label="메인 텍스트 (대시보드 큰 문구)">
          <Input value={draft.theme} onChange={v => update('theme', v)} placeholder="예: GO! · 부흥 · LIGHT" />
        </Field>
        <Field label="부제 (메인 텍스트 아래 작은 문구)">
          <Input value={draft.subTheme} onChange={v => update('subTheme', v)} placeholder="주제 부연 설명을 입력하세요" />
        </Field>

        <Field label="지방회 / 주최">
          <Input value={draft.district} onChange={v => update('district', v)} placeholder="예: ○○교회 청년부, ○○지방회" />
        </Field>
        <Field label="앱 헤더 표시명">
          <Input value={draft.appName} onChange={v => update('appName', v)} placeholder="수련회 운영 시스템" />
        </Field>

        <Field label="시작일" icon={<Calendar size={14} aria-hidden="true" />}>
          <Input type="date" value={draft.startDate} onChange={v => update('startDate', v)} />
        </Field>
        <Field label="종료일" icon={<Calendar size={14} aria-hidden="true" />}>
          <Input type="date" value={draft.endDate} onChange={v => update('endDate', v)} />
        </Field>

        <Field label="장소명" icon={<MapPin size={14} aria-hidden="true" />}>
          <Input value={draft.venue} onChange={v => update('venue', v)} placeholder="예: ○○ 수양관 / ○○ 청소년수련원" />
        </Field>
        <Field label="장소 주소" icon={<MapPin size={14} aria-hidden="true" />}>
          <Input value={draft.venueAddress} onChange={v => update('venueAddress', v)} placeholder="예: 경기도 ○○시 ○○면 ○○로 123" />
        </Field>

        <Field label="총원 (정원)" icon={<UsersIcon size={14} aria-hidden="true" />}>
          <Input type="number" value={String(draft.totalQuota)}
            onChange={v => update('totalQuota', Math.max(0, Number(v) || 0))} />
        </Field>
        <Field label="참가비 (원)">
          <Input type="number" value={String(draft.feeAmount)}
            onChange={v => update('feeAmount', Math.max(0, Number(v) || 0))} />
        </Field>

        {/* 강사 / 진행팀 */}
        <Subheader>강사 · 진행팀</Subheader>

        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400 inline-flex items-center gap-1.5">
              <Mic size={14} aria-hidden="true" /> 강사 ({draft.speakers.length}명)
            </label>
            <button
              type="button"
              onClick={addSpeaker}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10 transition-colors"
              style={{ border: '1px solid rgba(37, 99, 235,0.3)' }}
            >
              <Plus size={12} aria-hidden="true" /> 강사 추가
            </button>
          </div>

          {draft.speakers.length === 0 ? (
            <div
              className="rounded-lg px-3 py-3 text-[11px] text-slate-500 text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}
            >
              등록된 강사가 없습니다. "강사 추가" 버튼으로 등록할 수 있습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {draft.speakers.map((sp, idx) => (
                <div
                  key={idx}
                  className="grid gap-2 md:grid-cols-[1fr_1.4fr_auto] items-center rounded-lg p-2"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Input
                    value={sp.role ?? ''}
                    onChange={v => updateSpeaker(idx, 'role', v)}
                    placeholder="역할 (예: 저녁집회 강사)"
                  />
                  <Input
                    value={sp.name}
                    onChange={v => updateSpeaker(idx, 'name', v)}
                    placeholder="강사명 (예: ○○○ 목사)"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpeaker(idx)}
                    aria-label={`${sp.name || `${idx + 1}번 강사`} 삭제`}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Field label="찬양과 경배" colSpan={2}>
          <Input value={draft.worshipTeam.name}
            onChange={v => updatePerson('worshipTeam', 'name', v)}
            placeholder="예: ○○ 음악선교단 / ○○교회 찬양팀" />
        </Field>

        {/* 문의 */}
        <Subheader>문의 연락처</Subheader>

        <Field label="문의 담당자" icon={<Phone size={14} aria-hidden="true" />}>
          <Input value={draft.inquiry.name}
            onChange={v => updatePerson('inquiry', 'name', v)}
            placeholder="예: ○○○ 목사 / 운영팀장" />
        </Field>
        <Field label="문의 전화 (010-XXXX-XXXX)" icon={<Phone size={14} aria-hidden="true" />}>
          <Input value={draft.inquiry.phone ?? ''}
            onChange={v => updatePerson('inquiry', 'phone', v)}
            placeholder="010-0000-0000" />
        </Field>
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-lg p-3 text-xs"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fecaca' }}>
          {error}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#1B3A5C] disabled:opacity-50 transition-opacity"
          style={{
            background: 'linear-gradient(135deg,#3B82F6,#2563eb)',
            boxShadow: '0 0 14px rgba(37, 99, 235,0.3)',
          }}
        >
          <Save size={14} aria-hidden="true" />
          {busy ? '저장 후 새로고침…' : '행사 정보 저장'}
        </button>
        <button
          type="button"
          onClick={() => setDraft(loadEventConfig())}
          className="px-4 py-2.5 rounded-xl text-xs text-slate-300 hover:text-[#1B3A5C] hover:bg-white/5 transition-colors"
        >
          변경사항 되돌리기
        </button>
        {ok && (
          <span role="status" className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
            <CheckCircle2 size={12} aria-hidden="true" /> 저장 완료 — 새로고침 중
          </span>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 섹션 C — 전체 데이터 백업
// ═══════════════════════════════════════════════════════════════════════════

function FullBackupSection() {
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ filename: string; bytes: number; keyCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleDownload() {
    setBusy(true);
    setError(null);
    try {
      const result = downloadFullBackup();
      setLast(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '백업 생성에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(34,197,94,0.04)',
        border: '1px solid rgba(34,197,94,0.2)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}
      aria-labelledby="backup-heading"
    >
      <header className="flex items-start gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(34,197,94,0.2)' }}
        >
          <Download size={18} className="text-emerald-400" aria-hidden="true" />
        </div>
        <div>
          <h3 id="backup-heading" className="text-sm font-bold text-emerald-300">전체 데이터 백업</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            현재 브라우저에 저장된 모든 데이터(참가자·신청·체크인·체크리스트·교회·조·방·일정·공지·안전·행사 설정 등)를 하나의 JSON 파일로 다운로드합니다.
          </p>
        </div>
      </header>

      <ul
        className="rounded-xl px-4 py-3 mb-4 space-y-1 text-xs text-slate-400 list-disc list-inside"
        style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.14)' }}
      >
        <li>참가자·교회·조·방·차량·일정·공지·체크리스트·체크인 등 모든 운영 데이터</li>
        <li>행사 메타정보 (제목·주제·날짜·장소·강사·문의)</li>
        <li>온라인 신청 대기열·교회별 확인 상태</li>
        <li>관리자 인증 해시 (비밀번호 평문은 포함되지 않음)</li>
        <li>※ 인증 시도 횟수 등 일시 데이터는 제외</li>
      </ul>

      {error && (
        <div role="alert" className="mb-3 rounded-lg p-3 text-xs"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fecaca' }}>
          {error}
        </div>
      )}
      {last && (
        <div role="status" className="mb-3 rounded-lg p-3 text-xs"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#86efac' }}>
          <div className="flex items-center gap-1.5 font-semibold mb-1">
            <CheckCircle2 size={12} aria-hidden="true" />
            백업 파일이 저장되었습니다
          </div>
          <div className="text-emerald-200/80 break-all">
            {last.filename} · {(last.bytes / 1024).toFixed(1)} KB · {last.keyCount}개 키
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#1B3A5C] disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg,#10b981,#059669)',
          boxShadow: '0 0 14px rgba(16,185,129,0.3)',
        }}
      >
        <Download size={14} aria-hidden="true" />
        {busy ? '백업 생성 중…' : '전체 데이터 백업 다운로드'}
      </button>

      <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
        💡 권장: 행사 전(D-7), 행사 첫째 날 저녁, 행사 종료 직후 — 최소 3회 백업하시고 USB·이메일 등 별도 위치에 보관하세요.
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 섹션 D — 새 행사 시작
// ═══════════════════════════════════════════════════════════════════════════

function NewEventSection() {
  const [busy, setBusy] = useState(false);

  function handleReset() {
    const ok = window.confirm(
      '행사 메타정보를 기본값으로 되돌립니다.\n\n' +
      '※ 참가자·체크인 등 운영 데이터는 영향받지 않습니다.\n' +
      '※ 운영 데이터까지 모두 초기화하려면 [데이터 관리] 페이지를 이용하세요.\n\n' +
      '계속할까요?'
    );
    if (!ok) return;
    setBusy(true);
    resetEventConfig();
    setTimeout(() => window.location.reload(), 800);
  }

  return (
    <section
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(245,158,11,0.04)',
        border: '1px solid rgba(245,158,11,0.2)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}
      aria-labelledby="reset-meta-heading"
    >
      <header className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(245,158,11,0.2)' }}
        >
          <RefreshCw size={18} className="text-amber-400" aria-hidden="true" />
        </div>
        <div>
          <h3 id="reset-meta-heading" className="text-sm font-bold text-amber-300">행사 정보 기본값으로 복원</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            관리자가 변경한 행사 메타정보를 코드 기본값(<strong className="text-amber-200">{DEFAULT_EVENT_CONFIG.title}</strong>)으로 되돌립니다.
          </p>
        </div>
      </header>

      <button
        type="button"
        onClick={handleReset}
        disabled={busy}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-amber-100 disabled:opacity-50"
        style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)' }}
      >
        <RefreshCw size={12} aria-hidden="true" />
        {busy ? '복원 중…' : '메타정보를 기본값으로 되돌리기'}
      </button>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 공용 폼 부품
// ═══════════════════════════════════════════════════════════════════════════

function Field({
  label, icon, colSpan, children,
}: {
  label: string;
  icon?: React.ReactNode;
  colSpan?: 1 | 2;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className={colSpan === 2 ? 'md:col-span-2' : ''}>
      <label htmlFor={id} className="block text-[11px] font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {icon && <span className="text-cyan-400 flex-shrink-0">{icon}</span>}
        {/* children에 id 주입을 위해 cloneElement 대신 sub-id를 useId 동기화 */}
        <SlotInput id={id}>{children}</SlotInput>
      </div>
    </div>
  );
}

function SlotInput({ id, children }: { id: string; children: React.ReactNode }) {
  // React.cloneElement는 props 타입 호환이 까다로우므로 children에 ref/id를 사용자 의무로
  // 여기서는 id를 부모-자식 외관 일치만 위해 aria-labelledby로 연결
  return <div className="flex-1 min-w-0" aria-labelledby={id}>{children}</div>;
}

function Input({
  value, onChange, type = 'text', placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'date' | 'number';
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent outline-none text-sm text-[#1B3A5C] placeholder:text-slate-500"
    />
  );
}

function Subheader({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:col-span-2 mt-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400/70">
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 섹션 B-2 — 사이드바 메뉴 표시 선택
// ═══════════════════════════════════════════════════════════════════════════

function MenuVisibilitySection() {
  const visibility = useMenuVisibility();
  const [draft, setDraft] = useState<MenuVisibility>(() => visibility);
  const [savedOnce, setSavedOnce] = useState(false);

  // 외부(다른 기기·다른 탭) 변경이 들어오면 미저장 상태가 아닌 경우에만 draft 동기화
  // (저장 직후 visibility가 갱신되면 draft도 자동 일치하므로 불일치는 사용자 편집 중일 때만 발생)

  function toggle(key: PageKey) {
    if (isAlwaysVisible(key)) return;
    setDraft(prev => ({ ...prev, [key]: prev[key] === false ? true : false }));
  }

  function applyAll(visible: boolean) {
    const next: MenuVisibility = { ...draft };
    navItems.forEach(it => {
      if (!isAlwaysVisible(it.key)) next[it.key] = visible;
    });
    setDraft(next);
  }

  function saveDraft() {
    saveMenuVisibility(draft);
    setSavedOnce(true);
    window.setTimeout(() => setSavedOnce(false), 1600);
  }

  const visibleCount = navItems.filter(it => isMenuVisible(it.key, draft)).length;
  const totalCount = navItems.length;
  const isDirty = navItems.some(it =>
    isMenuVisible(it.key, draft) !== isMenuVisible(it.key, visibility),
  );

  return (
    <section
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.25)' }}
      aria-labelledby="menu-vis-heading"
    >
      <header className="flex items-start gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
        >
          <Eye size={16} className="text-violet-300" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 id="menu-vis-heading" className="text-sm font-bold text-violet-300">
            사이드바 메뉴 선택
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            현장에서 사용할 메뉴만 켜두면 사이드바가 깔끔해져 운영자도, 담당교사도 헷갈리지 않습니다.
            <br/>
            <span className="text-violet-300/70">대시보드·매뉴얼·행사 설정</span>은 항상 표시됩니다 (잠김).
          </p>
        </div>
      </header>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-slate-400">
          현재 노출 <span className="font-bold text-violet-300">{visibleCount}</span> / {totalCount}개
        </span>
        <div className="ml-auto flex gap-1.5">
          <button
            type="button"
            onClick={() => applyAll(true)}
            className="text-[11px] px-2.5 py-1 rounded-lg font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10"
          >
            전체 켜기
          </button>
          <button
            type="button"
            onClick={() => applyAll(false)}
            className="text-[11px] px-2.5 py-1 rounded-lg font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10"
          >
            전체 끄기
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {navItems.map(it => {
          const locked  = isAlwaysVisible(it.key);
          const visible = isMenuVisible(it.key, draft);
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => toggle(it.key)}
              disabled={locked}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors"
              style={{
                background: visible ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${visible ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.08)'}`,
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.7 : 1,
              }}
            >
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: visible ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.05)' }}
              >
                {it.icon}
              </span>
              <span className={`text-xs font-semibold flex-1 ${visible ? 'text-[#1B3A5C]' : 'text-slate-500'}`}>
                {it.label}
              </span>
              {locked ? (
                <Lock size={13} className="text-slate-500 flex-shrink-0" aria-label="항상 표시" />
              ) : visible ? (
                <Eye size={13} className="text-violet-300 flex-shrink-0" aria-label="표시" />
              ) : (
                <EyeOff size={13} className="text-slate-500 flex-shrink-0" aria-label="숨김" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {savedOnce && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300">
            <CheckCircle2 size={13}/> 저장 완료
          </span>
        )}
        <button
          type="button"
          onClick={saveDraft}
          disabled={!isDirty}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
          style={isDirty
            ? { color: '#c4b5fd', background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.4)' }
            : { color: '#475569', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'not-allowed' }
          }
        >
          <Save size={13}/> 메뉴 설정 저장
        </button>
      </div>
    </section>
  );
}
