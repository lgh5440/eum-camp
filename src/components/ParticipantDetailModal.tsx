import { useEffect } from 'react';
import { X, User, Phone, BedDouble, CreditCard, Utensils, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import type { Participant } from '../types';
import { useChurchConfig, useGroupMeta, useRoomConfig } from '../hooks/useSharedData';
import ContactLinks from './ContactLinks';
import { feeFullLabel, feeShortLabel, feeColor as feeStageColor } from '../utils/feeLabels';
import { useAuth } from '../auth/useAuth';

const statusLabel: Record<Participant['status'], string> = {
  confirmed: '확정', pending: '대기', cancelled: '취소',
};
const statusColor: Record<Participant['status'], string> = {
  confirmed: '#10b981', pending: '#f59e0b', cancelled: '#ef4444',
};

interface Props {
  participant: Participant;
  onClose: () => void;
  onEdit: (p: Participant) => void;
  onDelete: (id: string) => void;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-3 py-2.5"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <span className="text-xs text-slate-500 w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-200 flex-1 min-w-0">{value}</span>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-1">
      <span className="text-cyan-400 flex-shrink-0">{icon}</span>
      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function ParticipantDetailModal({ participant: p, onClose, onEdit, onDelete }: Props) {
  const { isAdmin } = useAuth();
  const churches = useChurchConfig();
  const groups = useGroupMeta();
  const rooms = useRoomConfig();

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

  const churchMap = Object.fromEntries(churches.map(c => [c.id, c.name]));
  const groupMap = Object.fromEntries(groups.map(g => [g.id, g]));
  const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]));
  const group   = p.groupId ? groupMap[p.groupId] : null;
  const room    = p.roomId  ? roomMap[p.roomId]   : null;
  const church  = churchMap[p.church] || p.church;
  const isTeacher   = p.grade === '교사';
  const genderLabel = p.gender === 'M' ? '남성' : '여성';
  const genderColor = p.gender === 'M' ? '#60a5fa' : '#f472b6';
  const dietLabel   =
    p.dietType === 'vegetarian' ? '채식' :
    p.dietType === 'allergy'    ? '알레르기 주의' : '일반식';
  const dietColor   =
    p.dietType === 'vegetarian' ? '#10b981' :
    p.dietType === 'allergy'    ? '#f59e0b' : '#64748b';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-[#E4ECF7] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Positioner */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">

        {/* Modal panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${p.name} 상세 정보`}
          className="pointer-events-auto w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl
                     flex flex-col max-h-[92dvh] sm:max-h-[88vh]"
          style={{
            background: 'linear-gradient(160deg, #0f1e3a 0%, #091525 100%)',
            border: '1px solid rgba(37, 99, 235,0.2)',
            boxShadow: '0 32px 72px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
          onClick={e => e.stopPropagation()}
        >

          {/* ── Sticky header ── */}
          <div
            className="sticky top-0 z-10 px-5 pt-4 pb-4 flex-shrink-0 rounded-t-3xl sm:rounded-t-2xl"
            style={{
              background: 'linear-gradient(160deg, #0f1e3a 0%, #091525 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

            <div className="flex items-start justify-between gap-3">
              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
                  style={{
                    background: p.gender === 'M' ? 'rgba(59,130,246,0.2)' : 'rgba(236,72,153,0.2)',
                    color: genderColor,
                    border: `1px solid ${genderColor}30`,
                  }}
                >
                  {p.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#101A3D] leading-tight">{p.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {church}
                    <span className="text-slate-600 mx-1">·</span>
                    <span style={{ color: genderColor }}>{p.grade}</span>
                  </p>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                aria-label="모달 닫기"
                className="w-8 h-8 rounded-xl flex items-center justify-center
                           text-slate-500 hover:text-slate-200 hover:bg-white/10
                           transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ color: statusColor[p.status], background: `${statusColor[p.status]}20` }}
              >
                {statusLabel[p.status]}
              </span>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ color: feeStageColor(p), background: `${feeStageColor(p)}20` }}
              >
                참가비 {feeShortLabel(p)}
              </span>
              {p.dietType !== 'normal' && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1"
                  style={{ color: dietColor, background: `${dietColor}20` }}
                >
                  {p.dietType === 'allergy' && <AlertTriangle size={10} />}
                  {dietLabel}
                </span>
              )}
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className="overflow-y-auto flex-1 px-5 pb-6">

            {/* 기본 정보 */}
            <SectionHeader icon={<User size={12} />} label="기본 정보" />
            <InfoRow label="교회" value={church} />
            <InfoRow label="학년" value={p.grade} />
            <InfoRow
              label="성별"
              value={<span style={{ color: genderColor }}>{genderLabel}</span>}
            />
            <InfoRow label="구분" value={isTeacher ? '교사 / 스탭' : '학생'} />
            <InfoRow label="등록일" value={p.registeredAt} />
            <InfoRow
              label="등록 상태"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: statusColor[p.status] }} />
                  <span style={{ color: statusColor[p.status] }}>{statusLabel[p.status]}</span>
                </span>
              }
            />

            {/* 배정 정보 */}
            <SectionHeader icon={<BedDouble size={12} />} label="배정 정보" />
            <InfoRow
              label="조"
              value={
                group ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: group.color }} />
                    {group.name}
                  </span>
                ) : <span className="text-slate-600">미배정</span>
              }
            />
            <InfoRow
              label="방"
              value={
                room
                  ? `${room.building} ${room.name}`
                  : <span className="text-slate-600">미배정</span>
              }
            />
            <InfoRow label="차량" value={<span className="text-slate-600">미등록</span>} />

            {/* 연락처 */}
            <SectionHeader icon={<Phone size={12} />} label="연락처" />
            <InfoRow label="본인 연락처" value={<ContactLinks phone={p.phone} label={`${p.name} 본인 연락처`} />} />
            <InfoRow label="보호자 연락처" value={<ContactLinks phone={p.parentPhone} label={`${p.name} 보호자 연락처`} />} />

            {/* 참가비 */}
            <SectionHeader icon={<CreditCard size={12} />} label="참가비" />
            <InfoRow
              label="납부 단계"
              value={
                <span style={{ color: feeStageColor(p) }}>
                  {feeFullLabel(p)}
                </span>
              }
            />
            <InfoRow
              label="납부 금액"
              value={
                <span style={{ color: p.feeAmount > 0 ? '#10b981' : '#64748b' }}>
                  {p.feeAmount.toLocaleString()}원
                </span>
              }
            />

            {/* 건강 / 특이사항 */}
            <SectionHeader icon={<Utensils size={12} />} label="건강 / 특이사항" />
            <InfoRow
              label="식단"
              value={<span style={{ color: dietColor }}>{dietLabel}</span>}
            />
            {p.dietType === 'allergy' && (
              <InfoRow
                label="알레르기"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
                    <span className="text-amber-300">{p.allergies || '정보 없음'}</span>
                  </span>
                }
              />
            )}
            <InfoRow label="특이사항" value={<span className="text-slate-600">없음</span>} />

          </div>

          {/* ── Footer: 수정 / 삭제 ── */}
          {isAdmin ? (
            <div
              className="sticky bottom-0 px-5 py-4 flex gap-3 flex-shrink-0"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.07)',
                background: 'linear-gradient(160deg, #0f1e3a 0%, #091525 100%)',
              }}
            >
              <button
                onClick={() => onDelete(p.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                }}
              >
                <Trash2 size={14} />
                삭제
              </button>
              <button
                onClick={() => onEdit(p)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-[#101A3D] transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(90deg, #1B3A5C, #93C5FD)',
                  boxShadow: '0 4px 16px rgba(37, 99, 235,0.3)',
                }}
              >
                <Pencil size={14} />
                수정
              </button>
            </div>
          ) : (
            <div
              className="sticky bottom-0 px-5 py-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 flex-shrink-0"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.07)',
                background: 'linear-gradient(160deg, #0f1e3a 0%, #091525 100%)',
              }}
            >
              조회 전용 모드 — 수정·삭제는 진행위원 권한이 필요합니다
            </div>
          )}
        </div>
      </div>
    </>
  );
}
