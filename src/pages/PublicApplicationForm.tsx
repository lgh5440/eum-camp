import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clipboard, Edit3, Send } from 'lucide-react';
import { useApplications, useChurchConfig, useParticipants } from '../hooks/useSharedData';
import { saveParticipants } from '../utils/participantStorage';
import {
  buildApplicationRecord,
  saveApplications,
  type ApplicationRecord,
} from '../utils/applicationsStorage';
import { resolveChurchId } from '../utils/churchIdentity';
import type { Participant } from '../types';
import { EUM_BRAND, EUM_COLORS } from '../data/eumBrand';
import { EVENT } from '../data/eventInfo';
import EumFamilyFooter from '../components/EumFamilyFooter';

// 학년: 학생용 옵션. "구분"이 학생일 때만 노출, 그 외 구분은 자동으로 grade='해당없음'.
const STUDENT_GRADES = ['초등4', '초등5', '초등6', '중1', '중2', '중3', '고1', '고2', '고3', '청년', '장년'];
const ROLES = ['학생', '교사', '학부모', '찬양팀', '자원봉사', '진행위원'] as const;
type Role = typeof ROLES[number];

type FeeStage = NonNullable<Participant['feeStage']>;

interface FeeOption {
  value: FeeStage;
  label: string;
  hint: string;
  amount: number;
  bucket: Participant['fee'];
}

// 5단계 참가비 — 라벨은 쉽게 풀어서. amount/bucket으로 내부 fee 모델에 자동 매핑.
const FEE_OPTIONS: FeeOption[] = [
  { value: 'pre',    label: '가등록 (2만원 입금)',          hint: '1차 마감 전 미리 입금하면 1차 등록(6만원) 혜택 적용',  amount: 20000, bucket: 'partial' },
  { value: 'first',  label: '1차 등록 (6만원 완납)',        hint: '6월 30일까지 완납 — 가장 저렴한 등록',                  amount: 60000, bucket: 'paid'    },
  { value: 'second', label: '2차 등록 (7만원 완납)',        hint: '7월 26일까지 완납',                                     amount: 70000, bucket: 'paid'    },
  { value: 'unpaid', label: '아직 입금 전',                   hint: '신청만 먼저 — 입금은 나중에',                           amount: 0,     bucket: 'unpaid'  },
  { value: 'exempt', label: '회비 면제 (자원봉사·찬양팀·진행팀)', hint: '봉사자는 회비를 내지 않습니다',                        amount: 0,     bucket: 'paid'    },
];

interface FormState {
  name: string;
  church: string;
  churchOther: string;
  role: Role;
  grade: string;
  gender: 'M' | 'F';
  phone: string;
  parentPhone: string;
  dietType: Participant['dietType'];
  allergies: string;
  feeStage: FeeStage;
  notes: string;
  insuranceConfirmed: boolean;
  phoneConsent: boolean;
}

const initialForm: FormState = {
  name: '',
  church: '',
  churchOther: '',
  role: '학생',
  grade: '중1',
  gender: 'M',
  phone: '',
  parentPhone: '',
  dietType: 'normal',
  allergies: '',
  feeStage: 'unpaid',
  notes: '',
  insuranceConfirmed: false,
  phoneConsent: false,
};

function parseHashParams(): URLSearchParams {
  const query = window.location.hash.split('?')[1] ?? '';
  return new URLSearchParams(query);
}

function makeToken(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function makeParticipantId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function deriveFeeStage(p: Participant): FeeStage {
  if (p.feeStage) return p.feeStage;
  if (p.fee === 'unpaid') return 'unpaid';
  if (p.fee === 'partial') return 'pre';
  return 'first'; // paid (legacy)
}

function participantToForm(participant: Participant): FormState {
  const role = (ROLES as readonly string[]).includes(participant.role ?? '')
    ? (participant.role as Role)
    : '학생';
  return {
    name: participant.name,
    church: participant.church,
    churchOther: '',
    role,
    grade: STUDENT_GRADES.includes(participant.grade) ? participant.grade : '중1',
    gender: participant.gender,
    phone: participant.phone,
    parentPhone: participant.parentPhone,
    dietType: participant.dietType,
    allergies: participant.allergies ?? '',
    feeStage: deriveFeeStage(participant),
    notes: participant.notes ?? '',
    insuranceConfirmed: participant.insuranceConfirmed ?? false,
    phoneConsent: participant.phoneConsent ?? false,
  };
}

function mergeParticipant(current: Participant, incoming: Participant): Participant {
  return {
    ...current,
    ...incoming,
    id: current.id,
    registeredAt: current.registeredAt,
    status: current.status,
    groupId: incoming.groupId ?? current.groupId,
    roomId: incoming.roomId ?? current.roomId,
    busId: incoming.busId ?? current.busId,
    applicationToken: current.applicationToken ?? incoming.applicationToken,
  };
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d]/g, '');
}

function buildEditUrl(id: string, editToken: string): string {
  const url = new URL(window.location.href);
  url.hash = `/apply?id=${encodeURIComponent(id)}&token=${encodeURIComponent(editToken)}`;
  return url.toString();
}

export default function PublicApplicationForm() {
  const participants = useParticipants();
  const applications = useApplications();
  const churches = useChurchConfig();
  const params = parseHashParams();
  const editId = params.get('id') ?? '';
  const editToken = params.get('token') ?? '';

  const existingApplication = useMemo(
    () => applications.find(record =>
      Boolean(editToken) &&
      record.participant.applicationToken === editToken &&
      (!editId || record.id === editId || record.participant.id === editId),
    ),
    [applications, editId, editToken],
  );

  const existingParticipant = useMemo(
    () => participants.find(participant =>
      Boolean(editToken) &&
      participant.applicationToken === editToken &&
      (!editId || participant.id === editId || !existingApplication),
    ),
    [participants, editId, editToken, existingApplication],
  );

  const target = existingApplication?.participant ?? existingParticipant;
  const [form, setForm] = useState<FormState>(() => target ? participantToForm(target) : initialForm);
  const [doneUrl, setDoneUrl] = useState('');
  const [message, setMessage] = useState('');
  const isComplete = Boolean(doneUrl);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (target && !doneUrl) setForm(participantToForm(target));
  }, [target, doneUrl]);

  const selectedChurchName = churches.find(church => church.id === form.church)?.name ?? form.church;
  const isStudent = form.role === '학생';
  const feeOption = FEE_OPTIONS.find(o => o.value === form.feeStage) ?? FEE_OPTIONS[3];

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function toParticipant(nextToken: string): Participant {
    const rawChurch = form.church === '__other__'
      ? form.churchOther.trim()
      : form.church.trim();
    const church = resolveChurchId(rawChurch, churches);
    const stage = FEE_OPTIONS.find(o => o.value === form.feeStage) ?? FEE_OPTIONS[3];
    // 학생이 아니면 grade는 역할명/해당없음으로 자동 처리 (기존 운영 페이지 호환)
    const grade = isStudent ? form.grade : (form.role || '해당없음');

    return {
      id: target?.id ?? makeParticipantId(),
      name: form.name.trim(),
      church,
      grade,
      gender: form.gender,
      phone: normalizePhone(form.phone),
      parentPhone: normalizePhone(form.parentPhone),
      dietType: form.dietType,
      allergies: form.dietType === 'allergy' ? form.allergies.trim() || undefined : undefined,
      registeredAt: target?.registeredAt ?? new Date().toISOString().slice(0, 10),
      status: target?.status ?? 'pending',
      fee: stage.bucket,
      feeAmount: stage.amount,
      feeStage: stage.value,
      role: form.role,
      notes: form.notes.trim() || undefined,
      applicationToken: nextToken,
      insuranceConfirmed: form.insuranceConfirmed,
      phoneConsent: form.phoneConsent,
    };
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isComplete) return;

    const church = form.church === '__other__' ? form.churchOther.trim() : form.church.trim();
    if (!form.name.trim() || !church || !form.phone.trim()) {
      setMessage('이름, 교회, 연락처는 반드시 입력해야 합니다.');
      return;
    }
    if (isStudent && !form.parentPhone.trim()) {
      setMessage('학생은 보호자 연락처가 필요합니다.');
      return;
    }
    if (!form.insuranceConfirmed) {
      setMessage('여행자 보험 안내를 확인해 주세요.');
      return;
    }
    if (!form.phoneConsent) {
      setMessage('휴대폰 관리 정책에 동의해 주세요.');
      return;
    }

    const nextToken = target?.applicationToken ?? (editToken || makeToken());
    const incoming = toParticipant(nextToken);

    if (existingParticipant) {
      const next = participants.map(participant =>
        participant.id === existingParticipant.id ? mergeParticipant(participant, incoming) : participant,
      );
      saveParticipants(next);
      setDoneUrl(buildEditUrl(existingParticipant.id, nextToken));
      setMessage('이미 명단에 추가된 신청 정보를 수정했습니다.');
      return;
    }

    if (existingApplication) {
      const next = applications.map(record =>
        record.id === existingApplication.id
          ? {
              ...record,
              participant: { ...incoming, id: record.participant.id },
              receivedAt: record.receivedAt,
              memo: '신청자가 수정 링크로 응답을 갱신함',
            }
          : record,
      );
      saveApplications(next, `${incoming.name} 신청자가 응답을 수정`);
      setDoneUrl(buildEditUrl(existingApplication.id, nextToken));
      setMessage('신청 대기함의 응답을 수정했습니다.');
      return;
    }

    const record: ApplicationRecord = {
      ...buildApplicationRecord(incoming, participants, 'manual'),
      participant: incoming,
    };
    saveApplications([record, ...applications], `${incoming.name} 공개 신청 접수`);
    setDoneUrl(buildEditUrl(record.id, nextToken));
    setMessage('신청이 접수되었습니다. 아래 수정 링크를 저장해 주세요.');
  }

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: 'linear-gradient(180deg,#CFE6FF 0%,#EAF3FF 45%,#F8FBFF 100%)' }}>
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <header className="space-y-4">
          {/* E:um 브랜드 영역 */}
          <div
            className="rounded-2xl px-5 py-5 flex items-center gap-4"
            style={{
              background: `linear-gradient(135deg, ${EUM_COLORS.orange}1A 0%, rgba(15,37,64,0.5) 100%)`,
              border: `1px solid ${EUM_COLORS.orangeL}33`,
            }}
          >
            <img
              src={EUM_BRAND.logoUrl}
              alt={EUM_BRAND.name}
              className="flex-shrink-0"
              style={{
                width: 72, height: 72,
                filter: `drop-shadow(0 0 12px ${EUM_COLORS.goldL}45)`,
              }}
            />
            <div className="min-w-0">
              <div
                className="text-sm font-bold leading-snug"
                style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: '0.3px' }}
              >
                {EUM_BRAND.sloganLine1}<br/>
                {EUM_BRAND.sloganLine2}
              </div>
              <div
                className="text-[10px] mt-1 font-semibold tracking-wider"
                style={{ color: EUM_COLORS.orangeL }}
              >
                GOD TO PEOPLE · PEOPLE TO PEOPLE
              </div>
            </div>
          </div>

          {EVENT.theme && (
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold"
              style={{
                color: EUM_COLORS.orangeL,
                background: `${EUM_COLORS.orange}15`,
                border: `1px solid ${EUM_COLORS.orangeL}40`,
              }}
            >
              {EVENT.theme}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-[#101A3D]">
            {EVENT.title ? `${EVENT.title} 등록 신청서` : '등록 신청서'}
          </h1>
          {(EVENT.dates || EVENT.venue || EVENT.theme || EVENT.district) && (
            <div className="rounded-2xl p-4 text-sm text-slate-200 space-y-1.5" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.18)' }}>
              {EVENT.dates && <p>📅 {EVENT.dates}</p>}
              {EVENT.venue && (
                <p>📍 장소: {EVENT.venue}{EVENT.venueAddress ? ` (${EVENT.venueAddress})` : ''}</p>
              )}
              {EVENT.theme && (
                <p>🎙️ 주제: <span className="font-bold text-cyan-200">{EVENT.theme}</span>{EVENT.subTheme ? ` — ${EVENT.subTheme}` : ''}</p>
              )}
              {EVENT.district && <p>⛪ 주관: {EVENT.district}</p>}
            </div>
          )}
          <p className="text-xs text-slate-500">✏️ 아래 항목을 차근차근 작성해 주세요. 약 2분이면 완료됩니다.</p>
        </header>

        <form onSubmit={submit} className="rounded-2xl p-5 sm:p-6 space-y-5" style={{ background: 'rgba(15,23,42,0.86)', border: '1px solid rgba(148,163,184,0.18)' }}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="이름" required>
              <input value={form.name} onChange={e => set('name', e.target.value)} className="input" />
            </Field>

            <Field label="성별" required>
              <select value={form.gender} onChange={e => set('gender', e.target.value as FormState['gender'])} className="input">
                <option value="M">남</option>
                <option value="F">여</option>
              </select>
            </Field>

            <Field label="교회" required>
              <select value={form.church} onChange={e => set('church', e.target.value)} className="input">
                <option value="">선택</option>
                {churches.map(church => <option key={church.id} value={church.id}>{church.name}</option>)}
                <option value="__other__">직접 입력</option>
              </select>
              {form.church === '__other__' && (
                <input value={form.churchOther} onChange={e => set('churchOther', e.target.value)} placeholder="교회 이름" className="input mt-2" />
              )}
            </Field>

            <Field label="구분" required>
              <select value={form.role} onChange={e => set('role', e.target.value as Role)} className="input">
                {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </Field>

            <Field label="학년" required hint={isStudent ? undefined : '학생만 선택, 그 외는 자동으로 「해당없음」'}>
              <select
                value={isStudent ? form.grade : '해당없음'}
                onChange={e => set('grade', e.target.value)}
                className="input"
                disabled={!isStudent}
              >
                {isStudent
                  ? STUDENT_GRADES.map(grade => <option key={grade} value={grade}>{grade}</option>)
                  : <option value="해당없음">해당없음</option>}
              </select>
            </Field>

            <Field label="연락처" required hint="010-0000-0000 형식 (본인 핸드폰)">
              <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input" placeholder="010-0000-0000" />
            </Field>

            <Field
              label="보호자 연락처"
              required={isStudent}
              hint={isStudent ? '학생은 필수 입력' : '학생이 아니면 비워두세요'}
            >
              <input value={form.parentPhone} onChange={e => set('parentPhone', e.target.value)} className="input" placeholder="010-0000-0000" />
            </Field>

            <Field label="식단/알레르기" required>
              <select value={form.dietType} onChange={e => set('dietType', e.target.value as Participant['dietType'])} className="input">
                <option value="normal">일반</option>
                <option value="vegetarian">채식</option>
                <option value="allergy">알레르기 있음</option>
              </select>
            </Field>

            {form.dietType === 'allergy' && (
              <Field label="알레르기 상세" hint="예: 땅콩, 견과류, 갑각류">
                <input value={form.allergies} onChange={e => set('allergies', e.target.value)} className="input" />
              </Field>
            )}
          </div>

          <Field label="참가비 납부 단계" required hint={feeOption.hint}>
            <select value={form.feeStage} onChange={e => set('feeStage', e.target.value as FeeStage)} className="input">
              {FEE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>

          <Field label="특이사항" hint="운영팀에 미리 알리고 싶은 내용 (선택)">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="input min-h-24 resize-y" />
          </Field>

          <div className="space-y-3 pt-2 border-t border-white/10">
            <ConsentCheckbox
              checked={form.insuranceConfirmed}
              onChange={v => set('insuranceConfirmed', v)}
              title="여행자 보험 안내 확인"
              body="여행자 보험은 개교회에서 주관하셔서 수련회 전에, 참여하는 모든 교사와 학생들이 수련회 기간(7월 26일–28일) 중에 가입되도록 협력 부탁드립니다."
            />
            <ConsentCheckbox
              checked={form.phoneConsent}
              onChange={v => set('phoneConsent', v)}
              title="휴대폰 관리 정책 동의"
              body="수련회 기간 중에는 허락된 시간 외에는 핸드폰을 조장에게 맡겨야 합니다."
            />
          </div>

          <button
            type="submit"
            disabled={isComplete}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-[#101A3D] transition-all"
            style={isComplete
              ? { background: `${EUM_COLORS.orangeD}99`, cursor: 'not-allowed' }
              : {
                  background: `linear-gradient(135deg, ${EUM_COLORS.orange} 0%, ${EUM_COLORS.orangeD} 100%)`,
                  boxShadow: `0 4px 20px ${EUM_COLORS.orange}45`,
                }}
          >
            {isComplete ? <CheckCircle2 size={16} /> : target ? <Edit3 size={16} /> : <Send size={16} />}
            {isComplete ? '완료' : target ? '신청 내용 수정' : '신청서 제출'}
          </button>
        </form>

        {message && (
          <section className="rounded-2xl p-4 space-y-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-100">
            <div className="flex items-center gap-2 text-sm font-bold">
              <CheckCircle2 size={16} />
              {message}
            </div>
            {doneUrl && (
              <div className="space-y-2">
                <p className="text-xs text-emerald-200/80">수정할 때 쓸 링크입니다.</p>
                <div className="flex gap-2">
                  <input readOnly value={doneUrl} className="input flex-1 text-xs" />
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard?.writeText(doneUrl)}
                    className="px-3 rounded-xl bg-white/10 border border-white/15 text-[#101A3D]"
                    title="수정 링크 복사"
                  >
                    <Clipboard size={15} />
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {selectedChurchName && form.church !== '__other__' && (
          <p className="text-xs text-slate-500">선택 교회: {selectedChurchName}</p>
        )}

        <EumFamilyFooter currentApp="myrealid" variant={message ? 'cta' : 'footer'} />
      </div>
    </main>
  );
}

function Field({
  label, required, hint, children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-slate-300">
        {label}{required && <span className="text-rose-300"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500 leading-relaxed">{hint}</span>}
    </label>
  );
}

function ConsentCheckbox({
  checked, onChange, title, body,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  body: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 accent-emerald-500"
      />
      <span className="space-y-1">
        <span className="block text-sm font-bold text-[#101A3D]">
          {title}<span className="text-rose-300"> *</span>
        </span>
        <span className="block text-xs text-slate-400 leading-relaxed">{body}</span>
      </span>
    </label>
  );
}
