import { useState, useEffect, useMemo } from 'react';
import { X, UserPlus, Pencil } from 'lucide-react';
import type { Participant } from '../types';
import { generateParticipantId } from '../utils/participantStorage';
import { useChurchConfig, useGroupMeta, useRoomConfig } from '../hooks/useSharedData';
import { dedupeChurches, resolveChurchId, isCorruptChurchValue } from '../utils/churchIdentity';
import { FEE_STAGES, feeStageDerive, legacyFeeToStage, type FeeStage } from '../utils/feeLabels';

interface Props {
  mode: 'create' | 'edit';
  initialValue?: Participant;
  onSubmit: (p: Participant) => void;
  onClose: () => void;
}

interface FormData {
  name: string;
  churchId: string;
  role: '학생' | '교사' | '학부모' | '운영진' | '찬양팀' | '자원봉사' | '진행위원';
  grade: string;
  gender: '' | 'M' | 'F';
  phone: string;
  parentPhone: string;
  feeStage: FeeStage;
  groupId: string;
  roomId: string;
  busId: string;
  dietType: 'normal' | 'vegetarian' | 'allergy';
  allergies: string;
  notes: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

type Errors = Partial<Record<keyof FormData, string>>;

const STUDENT_GRADES = ['초등4', '초등5', '초등6', '중1', '중2', '중3', '고1', '고2', '고3', '청년', '장년'];
const GRADES = [...STUDENT_GRADES, '해당없음'];

const BUSES = [
  { value: '', label: '미배정' },
  { value: '1호차', label: '1호차' },
  { value: '2호차', label: '2호차' },
  { value: '개별이동', label: '개별이동' },
];

const BASE_INPUT: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'white',
};
const ERROR_INPUT: React.CSSProperties = {
  ...BASE_INPUT,
  border: '1px solid rgba(239,68,68,0.55)',
};
const OPT_BG = { background: '#F8FBFF' };

const INITIAL: FormData = {
  name: '', churchId: '', role: '학생', grade: '해당없음',
  gender: '', phone: '', parentPhone: '',
  feeStage: 'unpaid', groupId: '', roomId: '', busId: '',
  dietType: 'normal', allergies: '', notes: '', status: 'pending',
};

function participantToFormData(p: Participant): FormData {
  const role: FormData['role'] =
    p.role ?? (p.grade === '교사' ? '교사' : '학생');
  return {
    name: p.name,
    // p.church 그대로 보존. churchConfig 매칭 entry 여부는 useEffect에서 판단.
    churchId: p.church,
    role,
    grade: STUDENT_GRADES.includes(p.grade) ? p.grade : '해당없음',
    gender: p.gender,
    phone: p.phone,
    parentPhone: p.parentPhone,
    feeStage: legacyFeeToStage(p),
    groupId: p.groupId ?? '',
    roomId: p.roomId ?? '',
    busId: p.busId ?? '',
    dietType: p.dietType,
    allergies: p.allergies ?? '',
    notes: p.notes ?? '',
    status: p.status,
  };
}

// ── 모달 외부 정의 헬퍼 컴포넌트 ──────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="col-span-1 sm:col-span-2 flex items-center gap-2.5 mt-1">
      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1" style={{ borderTop: '1px solid rgba(37, 99, 235,0.15)' }} />
    </div>
  );
}

function FieldLabel({ required, children }: { required?: boolean; children: string }) {
  return (
    <p className="text-xs font-medium text-slate-400 mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </p>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-400 mt-1">{msg}</p>;
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function ParticipantFormModal({ mode, initialValue, onSubmit, onClose }: Props) {
  const churches = useChurchConfig();
  const groups = useGroupMeta();
  const rooms = useRoomConfig();
  const [form, setForm] = useState<FormData>(() =>
    mode === 'edit' && initialValue ? participantToFormData(initialValue) : INITIAL
  );
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // churchConfig 데이터 로드/변경 시 1회만 정규화.
  // 1) churchConfig에 정확히 매칭되는 entry가 있으면 그대로 유지 (ID가 길어도)
  // 2) 매칭 안 되고 corrupt 형태(긴 텍스트·콤마 등)면 빈 값으로 — 사용자가 직접 선택하도록
  // 3) 그 외는 resolveChurchId로 정규화 (이름→ID 변환 등)
  useEffect(() => {
    if (churches.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(prev => {
      if (!prev.churchId) return prev;
      const exactMatch = churches.some(c => c.id === prev.churchId);
      if (exactMatch) return prev;
      if (isCorruptChurchValue(prev.churchId)) {
        return { ...prev, churchId: '' };
      }
      const canonical = resolveChurchId(prev.churchId, churches);
      return canonical && canonical !== prev.churchId
        ? { ...prev, churchId: canonical }
        : prev;
    });
  }, [churches]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function set(field: keyof FormData, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Errors = {};
    if (!form.name.trim()) e.name = '이름을 입력하세요';
    if (!form.churchId)    e.churchId = '교회를 선택하세요';
    if (!form.gender)      e.gender = '성별을 선택하세요';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const grade = form.role === '학생' ? (form.grade || '해당없음') : form.role;
    const base = {
      name: form.name.trim(),
      church: resolveChurchId(form.churchId, churches),
      grade,
      gender: form.gender as 'M' | 'F',
      phone: form.phone.trim(),
      parentPhone: form.parentPhone.trim(),
      dietType: form.dietType,
      allergies: form.allergies.trim() || undefined,
      status: form.status,
      ...(() => {
        const d = feeStageDerive(form.feeStage);
        return { fee: d.bucket, feeAmount: d.amount, feeStage: form.feeStage };
      })(),
      groupId: form.groupId || undefined,
      roomId: form.roomId || undefined,
      role: form.role,
      busId: form.busId || undefined,
      notes: form.notes.trim() || undefined,
    };

    // edit: id·registeredAt 유지 / create: 신규 생성
    const result: Participant =
      mode === 'edit' && initialValue
        ? { ...initialValue, ...base }
        : { ...base, id: generateParticipantId(), registeredAt: new Date().toISOString().slice(0, 10) };

    onSubmit(result);
  }

  const toggleBtn = (active: boolean, accentColor: string): React.CSSProperties =>
    active
      ? { background: `${accentColor}26`, border: `1px solid ${accentColor}55`, color: accentColor }
      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#94a3b8' };

  const isEdit = mode === 'edit';
  const churchOptions = useMemo(() => {
    const options = dedupeChurches(churches);
    const canonicalChurchId = resolveChurchId(form.churchId, churches);
    return form.churchId && !options.some(c => c.id === canonicalChurchId)
      ? [...options, { id: form.churchId, name: form.churchId }]
      : options;
  }, [churches, form.churchId]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-[#E4ECF7] backdrop-blur-sm" onClick={onClose} />

      {/* Positioner: 모바일 바텀시트 / 데스크탑 중앙 모달 */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isEdit ? '참가자 수정' : '참가자 추가'}
          className="pointer-events-auto w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
          style={{
            background: 'linear-gradient(160deg, #0f1e3a 0%, #091525 100%)',
            border: '1px solid rgba(37, 99, 235,0.2)',
            boxShadow: '0 32px 72px rgba(0,0,0,0.75)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div
            className="sticky top-0 z-10 px-5 pt-4 pb-4 flex-shrink-0 rounded-t-3xl sm:rounded-t-2xl"
            style={{
              background: 'linear-gradient(160deg, #0f1e3a 0%, #091525 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="sm:hidden w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(37, 99, 235,0.15)', border: '1px solid rgba(37, 99, 235,0.25)' }}
                >
                  {isEdit
                    ? <Pencil size={14} className="text-cyan-400" />
                    : <UserPlus size={15} className="text-cyan-400" />}
                </div>
                <h3 className="text-base font-bold text-[#1B3A5C]">
                  {isEdit ? '참가자 수정' : '참가자 추가'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Scrollable Body ── */}
          <div className="overflow-y-auto flex-1 px-5 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">

              {/* ===== 기본 정보 ===== */}
              <SectionDivider label="기본 정보" />

              {/* 이름 */}
              <div>
                <FieldLabel required>이름</FieldLabel>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={errors.name ? ERROR_INPUT : BASE_INPUT}
                />
                <FieldError msg={errors.name} />
              </div>

              {/* 교회 */}
              <div>
                <FieldLabel required>교회</FieldLabel>
                <select
                  value={form.churchId}
                  onChange={e => set('churchId', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                  style={errors.churchId ? ERROR_INPUT : BASE_INPUT}
                >
                  <option value="" style={OPT_BG}>교회 선택</option>
                  {churchOptions.map(c => (
                    <option key={c.id} value={c.id} style={OPT_BG}>{c.name}</option>
                  ))}
                </select>
                <FieldError msg={errors.churchId} />
              </div>

              {/* 구분 */}
              <div>
                <FieldLabel required>구분</FieldLabel>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['학생', '교사', '학부모', '운영진', '찬양팀', '자원봉사', '진행위원'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set('role', r)}
                      className="py-2 rounded-lg text-xs font-medium transition-all"
                      style={toggleBtn(form.role === r, '#3B82F6')}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* 학년 */}
              <div>
                <FieldLabel>학년</FieldLabel>
                <select
                  value={form.grade}
                  onChange={e => set('grade', e.target.value)}
                  disabled={form.role !== '학생'}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={BASE_INPUT}
                >
                  {GRADES.map(g => <option key={g} value={g} style={OPT_BG}>{g}</option>)}
                </select>
              </div>

              {/* 성별 */}
              <div>
                <FieldLabel required>성별</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {(['M', 'F'] as const).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => set('gender', v)}
                      className="py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={toggleBtn(form.gender === v, v === 'M' ? '#60a5fa' : '#f472b6')}
                    >
                      {v === 'M' ? '남' : '여'}
                    </button>
                  ))}
                </div>
                <FieldError msg={errors.gender} />
              </div>

              {/* 등록 상태 */}
              <div>
                <FieldLabel>등록 상태</FieldLabel>
                <select
                  value={form.status}
                  onChange={e => set('status', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                  style={BASE_INPUT}
                >
                  <option value="pending" style={OPT_BG}>신청</option>
                  <option value="confirmed" style={OPT_BG}>확인완료</option>
                  <option value="cancelled" style={OPT_BG}>취소</option>
                </select>
              </div>

              {/* ===== 배정 정보 ===== */}
              <SectionDivider label="배정 정보" />

              {/* 조 */}
              <div>
                <FieldLabel>조</FieldLabel>
                <select
                  value={form.groupId}
                  onChange={e => set('groupId', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                  style={BASE_INPUT}
                >
                  <option value="" style={OPT_BG}>미배정</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id} style={OPT_BG}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* 방 */}
              <div>
                <FieldLabel>방</FieldLabel>
                <select
                  value={form.roomId}
                  onChange={e => set('roomId', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                  style={BASE_INPUT}
                >
                  <option value="" style={OPT_BG}>미배정</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id} style={OPT_BG}>
                      {r.building ? `${r.building} ${r.name}` : r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 차량 */}
              <div>
                <FieldLabel>차량</FieldLabel>
                <select
                  value={form.busId}
                  onChange={e => set('busId', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                  style={BASE_INPUT}
                >
                  {BUSES.map(b => (
                    <option key={b.value} value={b.value} style={OPT_BG}>{b.label}</option>
                  ))}
                </select>
              </div>

              {/* ===== 연락처 ===== */}
              <SectionDivider label="연락처" />

              {/* 연락처 */}
              <div>
                <FieldLabel>연락처</FieldLabel>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={BASE_INPUT}
                />
              </div>

              {/* 보호자 연락처 */}
              <div>
                <FieldLabel>보호자 연락처</FieldLabel>
                <input
                  type="tel"
                  value={form.parentPhone}
                  onChange={e => set('parentPhone', e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={BASE_INPUT}
                />
              </div>

              {/* ===== 참가비 ===== */}
              <SectionDivider label="참가비" />

              {/* 참가비 단계 (신청서와 동일한 5단계) */}
              <div className="col-span-1 sm:col-span-2">
                <FieldLabel>참가비 납부 단계</FieldLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FEE_STAGES.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => set('feeStage', s.value)}
                      title={s.hint}
                      className="py-2 px-2 rounded-lg text-xs font-medium transition-all text-left"
                      style={toggleBtn(form.feeStage === s.value, s.color)}
                    >
                      <div className="font-bold">{s.shortLabel}</div>
                      <div className="text-[10px] opacity-80">
                        {s.amount > 0 ? `${(s.amount / 10000).toFixed(0)}만원` : '면제·미입금'}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  단계 선택 시 fee 상태와 금액이 자동 책정됩니다.
                </p>
              </div>

              {/* ===== 건강 / 특이사항 ===== */}
              <SectionDivider label="건강 / 특이사항" />

              {/* 식단 */}
              <div>
                <FieldLabel>식단</FieldLabel>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 'normal',     label: '일반식',   color: '#64748b' },
                    { val: 'vegetarian', label: '채식',     color: '#10b981' },
                    { val: 'allergy',    label: '알레르기', color: '#f59e0b' },
                  ].map(({ val, label, color }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => set('dietType', val)}
                      className="py-2 rounded-lg text-xs font-medium transition-all"
                      style={toggleBtn(form.dietType === val, color)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 알레르기 상세 */}
              <div>
                <FieldLabel>알레르기 상세</FieldLabel>
                <input
                  type="text"
                  value={form.allergies}
                  onChange={e => set('allergies', e.target.value)}
                  placeholder={form.dietType === 'allergy' ? '예: 견과류, 유제품' : '알레르기 선택 시 입력'}
                  disabled={form.dietType !== 'allergy'}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                  style={BASE_INPUT}
                />
              </div>

              {/* 특이사항 — full width */}
              <div className="col-span-1 sm:col-span-2">
                <FieldLabel>특이사항</FieldLabel>
                <textarea
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="약 복용, 심리 상태, 기타 특이사항 등"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ ...BASE_INPUT, lineHeight: '1.6' }}
                />
              </div>

            </div>
          </div>

          {/* ── Footer ── */}
          <div
            className="sticky bottom-0 px-5 py-4 flex gap-3 flex-shrink-0"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.07)',
              background: 'linear-gradient(160deg, #0f1e3a 0%, #091525 100%)',
            }}
          >
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-[#1B3A5C] hover:bg-white/10 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.10)' }}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="flex-[2] py-2.5 rounded-xl text-sm font-bold text-[#1B3A5C] transition-all active:scale-95"
              style={{
                background: 'linear-gradient(90deg, #1B3A5C, #93C5FD)',
                boxShadow: '0 4px 16px rgba(37, 99, 235,0.3)',
              }}
            >
              {isEdit ? '수정 저장' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
