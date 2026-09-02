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
      style={{ background: 'linear-gradient(180deg,#CFE6FF 0%,#EAF3FF 45%,#F8FBFF 100%)' }}
    >
      <div
        className="max-w-xl w-full rounded-[29px] p-7"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(31,95,217,0.24)',
          boxShadow: '0 20px 44px rgba(27,58,92,0.14), 0 3px 8px rgba(31,95,217,0.08)',
        }}
      >
        <div className="text-[10px] font-extrabold tracking-[0.16em] text-[#1F5FD9] mb-3">
          2단계 / 행사 기본 정보
        </div>
        <header className="flex items-center gap-3 mb-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg,#2F73F2,#1F5FD9)',
              boxShadow: '0 6px 16px rgba(31,95,217,0.35)',
            }}
          >
            <Sparkles size={22} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#101A3D]">우리 교회 행사를 등록해 주세요</h1>
            <p className="text-xs text-[#5C6A93] mt-0.5">
              행사명과 일정만 먼저 입력해도 시작할 수 있습니다. 나머지 정보는 나중에 설정에서 채울 수 있습니다.
            </p>
          </div>
        </header>

        <div
          className="rounded-xl p-3 mb-5 text-xs leading-relaxed"
          style={{ background: 'rgba(31,95,217,0.08)', border: '1px solid rgba(31,95,217,0.3)', color: '#1F5FD9' }}
        >
          입력한 내용은 로그인 화면과 운영 대시보드에 표시되며 <strong className="text-[#101A3D]">설정 → 행사 기본 정보</strong>에서 언제든 변경할 수 있습니다.
          먼저 행사명과 시작일·종료일을 입력하세요. 주제·장소·주관 단체·문의 담당자는 필요할 때 추가하면 됩니다.
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="행사명" icon={<Sparkles size={14} />} required>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 2027 ○○교회 여름 수련회"
              className="w-full bg-transparent outline-none text-sm text-[#101A3D] placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-300"
              autoFocus
            />
          </Field>

          <Field label="주제·테마 (선택)" icon={<Sparkles size={14} />}>
            <input
              type="text"
              value={theme}
              onChange={e => setTheme(e.target.value)}
              placeholder="예: GO! · 부흥 · LIGHT"
              className="w-full bg-transparent outline-none text-sm text-[#101A3D] placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-300"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="시작일" icon={<CalendarDays size={14} />} required>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-[#101A3D] focus-visible:ring-2 focus-visible:ring-blue-300"
              />
            </Field>
            <Field label="종료일" icon={<CalendarDays size={14} />} required>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-[#101A3D] focus-visible:ring-2 focus-visible:ring-blue-300"
              />
            </Field>
          </div>

          <Field label="장소 (선택)" icon={<MapPin size={14} />}>
            <input
              type="text"
              value={venue}
              onChange={e => setVenue(e.target.value)}
              placeholder="예: ○○ 수양관"
              className="w-full bg-transparent outline-none text-sm text-[#101A3D] placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-300"
            />
          </Field>

          <Field label="주관 단체 (선택)" icon={<Sparkles size={14} />}>
            <input
              type="text"
              value={district}
              onChange={e => setDistrict(e.target.value)}
              placeholder="예: ○○교회 청년부, ○○지방회"
              className="w-full bg-transparent outline-none text-sm text-[#101A3D] placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-300"
            />
          </Field>

          <div className="grid grid-cols-[1fr_1.2fr] gap-3">
            <Field label="문의 담당자 (선택)" icon={<Phone size={14} />}>
              <input
                type="text"
                value={inquiryName}
                onChange={e => setInquiryName(e.target.value)}
                placeholder="예: 김○○ 목사"
                className="w-full bg-transparent outline-none text-sm text-[#101A3D] placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-300"
              />
            </Field>
            <Field label="문의 연락처 (선택)" icon={<Phone size={14} />}>
              <input
                type="tel"
                value={inquiryPhone}
                onChange={e => setInquiryPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full bg-transparent outline-none text-sm text-[#101A3D] placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-300"
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
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg,#2F73F2,#1F5FD9)',
              boxShadow: '0 6px 16px rgba(31,95,217,0.35)',
            }}
          >
            {submitting ? '저장 중…' : <>행사 정보 저장하고 운영 화면 열기 <ChevronRight size={16} /></>}
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
      <label className="block text-[11px] font-medium text-[#3A4568] mb-1.5">
        {label}{required && <span className="text-rose-500"> *</span>}
      </label>
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: '#F8FBFF', border: '1px solid rgba(31,95,217,0.24)', boxShadow: 'inset 0 1px 2px rgba(31,95,217,0.04)' }}
      >
        <span className="text-[#1F5FD9] flex-shrink-0">{icon}</span>
        {children}
      </div>
    </div>
  );
}
