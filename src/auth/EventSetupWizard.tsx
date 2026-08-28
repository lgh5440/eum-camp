// 첫 부팅 마법사 — SetupScreen(비밀번호 설정) 후, EVENT.title이 비어 있으면
// 강제로 표시되어 행사 기본 정보를 입력받는다. 이후엔 EventSettings에서 변경 가능.

import { useState } from 'react';
import { CalendarDays, MapPin, Sparkles, Phone, ChevronRight } from 'lucide-react';
import { DEFAULT_EVENT_CONFIG } from '../config/eventConfig';
import { loadEventConfig, saveEventConfig } from '../config/eventConfigStorage';

export default function EventSetupWizard() {
  const current = loadEventConfig();
  const [title, setTitle]               = useState(current.title || '');
  const [theme, setTheme]               = useState(current.theme || '');
  const [startDate, setStartDate]       = useState(current.startDate || '');
  const [endDate, setEndDate]           = useState(current.endDate || '');
  const [venue, setVenue]               = useState(current.venue || '');
  const [district, setDistrict]         = useState(current.district || '');
  const [inquiryName, setInquiryName]   = useState(current.inquiry.name || '');
  const [inquiryPhone, setInquiryPhone] = useState(current.inquiry.phone || '');
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  function validate(): string | null {
    if (!title.trim())          return '행사명을 입력해 주세요.';
    if (!startDate)             return '시작일을 선택해 주세요.';
    if (!endDate)               return '종료일을 선택해 주세요.';
    if (startDate > endDate)    return '종료일은 시작일 이후여야 합니다.';
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setError(null);
    setSubmitting(true);
    try {
      saveEventConfig({
        ...DEFAULT_EVENT_CONFIG,
        ...current,
        title:        title.trim(),
        theme:        theme.trim(),
        startDate,
        endDate,
        venue:        venue.trim(),
        district:     district.trim(),
        inquiry: {
          ...current.inquiry,
          name:  inquiryName.trim(),
          phone: inquiryPhone.trim(),
        },
      });
      // saveEventConfig가 page reload를 트리거 → 다음 부팅에 EVENT 값 갱신됨
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(135deg,#020818 0%,#0a1628 60%,#0f2040 100%)' }}
    >
      <div
        className="max-w-xl w-full rounded-2xl p-7"
        style={{
          background: 'rgba(2,12,28,0.85)',
          border: '1px solid rgba(252,211,77,0.22)',
          boxShadow: '0 0 40px rgba(240,140,40,0.12)',
        }}
      >
        <header className="flex items-center gap-3 mb-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg,#fcd34d,#a16207)',
              boxShadow: '0 0 16px rgba(252,211,77,0.45)',
            }}
          >
            <Sparkles size={22} className="text-[#1B3A5C]" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1B3A5C]">행사 기본 정보 입력</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              이음 캠프를 처음 사용하시는군요. 우선 우리 교회·행사 기본 정보를 입력해 주세요.
            </p>
          </div>
        </header>

        <div
          className="rounded-xl p-3 mb-5 text-xs leading-relaxed"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)', color: '#c7d2fe' }}
        >
          입력한 내용은 <strong className="text-[#1B3A5C]">설정 → 행사 기본 정보</strong>에서 언제든 변경할 수 있습니다.
          강사·찬양팀·정원·참가비 같은 세부 정보는 나중에 천천히 채우세요.
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="행사명" icon={<Sparkles size={14} />} required>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 2027 ○○교회 여름 수련회"
              className="w-full bg-transparent outline-none text-sm text-[#1B3A5C] placeholder:text-slate-500"
              autoFocus
            />
          </Field>

          <Field label="주제·테마 (선택)" icon={<Sparkles size={14} />}>
            <input
              type="text"
              value={theme}
              onChange={e => setTheme(e.target.value)}
              placeholder="예: GO! · 부흥 · LIGHT"
              className="w-full bg-transparent outline-none text-sm text-[#1B3A5C] placeholder:text-slate-500"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="시작일" icon={<CalendarDays size={14} />} required>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-[#1B3A5C]"
              />
            </Field>
            <Field label="종료일" icon={<CalendarDays size={14} />} required>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-[#1B3A5C]"
              />
            </Field>
          </div>

          <Field label="장소 (선택)" icon={<MapPin size={14} />}>
            <input
              type="text"
              value={venue}
              onChange={e => setVenue(e.target.value)}
              placeholder="예: ○○ 수양관"
              className="w-full bg-transparent outline-none text-sm text-[#1B3A5C] placeholder:text-slate-500"
            />
          </Field>

          <Field label="주관 단체 (선택)" icon={<Sparkles size={14} />}>
            <input
              type="text"
              value={district}
              onChange={e => setDistrict(e.target.value)}
              placeholder="예: ○○교회 청년부, ○○지방회"
              className="w-full bg-transparent outline-none text-sm text-[#1B3A5C] placeholder:text-slate-500"
            />
          </Field>

          <div className="grid grid-cols-[1fr_1.2fr] gap-3">
            <Field label="문의 담당자 (선택)" icon={<Phone size={14} />}>
              <input
                type="text"
                value={inquiryName}
                onChange={e => setInquiryName(e.target.value)}
                placeholder="예: 김○○ 목사"
                className="w-full bg-transparent outline-none text-sm text-[#1B3A5C] placeholder:text-slate-500"
              />
            </Field>
            <Field label="문의 연락처 (선택)" icon={<Phone size={14} />}>
              <input
                type="tel"
                value={inquiryPhone}
                onChange={e => setInquiryPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full bg-transparent outline-none text-sm text-[#1B3A5C] placeholder:text-slate-500"
              />
            </Field>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg p-3 text-xs"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fecaca' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-semibold text-[#1B3A5C] transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg,#fcd34d,#a16207)',
              boxShadow: '0 0 16px rgba(252,211,77,0.45)',
            }}
          >
            {submitting ? '저장 중…' : <>저장하고 시작하기 <ChevronRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label, icon, required, children,
}: {
  label: string;
  icon: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
        {label}{required && <span className="text-rose-300"> *</span>}
      </label>
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <span style={{ color: 'var(--eum-gold-l)' }} className="flex-shrink-0">{icon}</span>
        {children}
      </div>
    </div>
  );
}
