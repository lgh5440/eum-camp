import { useEffect, useMemo, useState } from 'react';
import {
  Building2, Phone, Pencil, Check, Plus, Trash2, AlertTriangle,
  CheckCircle2, Circle, X, Printer, ChevronRight,
} from 'lucide-react';
import ContactLinks from '../components/ContactLinks';
import {
  useParticipants, useChurchConfig, useChurchConfirmMap,
} from '../hooks/useSharedData';
import { saveChurchConfig, nextChurchId, type ChurchConfig } from '../utils/churchConfigStorage';
import { saveParticipants } from '../utils/participantStorage';
import { canonicalizeChurchValue, dedupeChurches, normalizeChurchName, resolveChurchId, isCorruptChurchValue } from '../utils/churchIdentity';
import { saveChurchConfirmMap, toggleChurchConfirm } from '../utils/churchConfirmStorage';
import type { ChurchConfirmMap } from '../utils/churchConfirmStorage';
import { isStudent, GROUP_CONFIG } from '../utils/groupAssignment';
import { VALID_ROOM_IDS } from '../utils/roomAssignment';
import { VEHICLE_IDS, INDIVIDUAL_ID } from '../utils/vehicleAssignment';
import { rooms as mockRooms } from '../data/mockData';
import { consumeEditRequest } from '../utils/pageEditRequest';
import { useAuth } from '../auth/useAuth';
import { feeShortLabel, feeColor } from '../utils/feeLabels';
import type { Participant } from '../types';

// ── 모듈 상수 ─────────────────────────────────────────────────────────────────
const GIDS      = GROUP_CONFIG.map(g => g.id) as string[];
const GROUP_MAP = new Map<string, string>(GROUP_CONFIG.map(g => [g.id as string, g.name as string]));
const ROOM_MAP  = new Map<string, string>(mockRooms.map(r => [r.id, r.name]));

const CARD = {
  background: 'rgba(255,255,255,0.07)',
  border:     '1px solid rgba(255,255,255,0.12)',
  boxShadow:  '0 4px 24px rgba(31,95,217,0.25)',
} as const;

// ── 타입 ──────────────────────────────────────────────────────────────────────
type FilterKey = 'all' | 'confirmed' | 'unconfirmed' | 'fee-incomplete' | 'assign-incomplete' | 'special';

interface ChurchStat {
  churchKey:        string;
  displayName:      string;
  district?:        string;
  teacherName?:     string;
  teacherPhone?:    string;
  quota:            number;
  total:            number;
  studentCount:     number;
  staffCount:       number;
  feePaid:          number;
  feePartial:       number;
  feeUnpaid:        number;
  groupUnassigned:  number;
  roomUnassigned:   number;
  vehicleUnassigned: number;
  specialCount:     number;
  participants:     Participant[];
  confirmed:        boolean;
  confirmedAt?:     string;
  isExtra:          boolean;        // 마스터에 등록 안 된 교회
}

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────
function getRoleLabel(p: Participant): string {
  if (p.role && p.role !== '학생') return p.role;
  const nonStudent = ['교사', '학부모', '운영진', '찬양팀', '자원봉사', '진행위원'];
  if (nonStudent.includes(p.grade)) return p.grade;
  return '학생';
}

function buildChurchStats(
  participants: Participant[],
  confirmMap: ChurchConfirmMap,
  churchConfig: ChurchConfig[],
): ChurchStat[] {
  const active = participants.filter(p => p.status !== 'cancelled');

  const byChurch: Record<string, Participant[]> = {};
  active.forEach(p => {
    // churchConfig 매칭 entry가 있으면 그 ID 사용 (ID가 길어도 정상). 없을 때만 corrupt 체크.
    const exactMatch = churchConfig.some(c => c.id === p.church);
    const cid = exactMatch
      ? p.church
      : (isCorruptChurchValue(p.church) ? '__corrupt__' : resolveChurchId(p.church, churchConfig));
    (byChurch[cid] ??= []).push(p);
  });

  const configById = new Map(churchConfig.map(c => [c.id, c]));
  const configuredIds = churchConfig.map(c => c.id);
  const extraIds = Object.keys(byChurch).filter(k => !configById.has(k));
  const allIds = [...configuredIds, ...extraIds];

  return allIds
    .map(churchKey => {
      const cfg = configById.get(churchKey);
      const members = byChurch[churchKey] ?? [];
      const students = members.filter(isStudent);

      const feePaid    = members.filter(p => p.fee === 'paid').length;
      const feePartial = members.filter(p => p.fee === 'partial').length;
      const feeUnpaid  = members.filter(p => p.fee === 'unpaid').length;

      const groupUnassigned   = students.filter(p => !p.groupId || !GIDS.includes(p.groupId)).length;
      const roomUnassigned    = students.filter(p => !p.roomId  || !VALID_ROOM_IDS.has(p.roomId)).length;
      const vehicleUnassigned = members.filter(
        p => !p.busId || (!VEHICLE_IDS.includes(p.busId) && p.busId !== INDIVIDUAL_ID),
      ).length;

      const specialCount = members.filter(
        p => p.dietType === 'allergy' || (p.notes && p.notes.trim().length > 0),
      ).length;

      const sorted = [...members].sort((a, b) => {
        const aStud = isStudent(a), bStud = isStudent(b);
        if (!aStud && bStud) return -1;
        if (aStud && !bStud) return 1;
        return a.name.localeCompare(b.name, 'ko');
      });

      const entry = confirmMap[churchKey];

      return {
        churchKey,
        displayName:    cfg?.name ?? (churchKey === '__corrupt__' ? '⚠ 교회 정보 확인 필요' : churchKey),
        district:       cfg?.district,
        teacherName:    cfg?.teacherName,
        teacherPhone:   cfg?.teacherPhone,
        quota:          cfg?.quota ?? 0,
        total:          members.length,
        studentCount:   students.length,
        staffCount:     members.length - students.length,
        feePaid, feePartial, feeUnpaid,
        groupUnassigned, roomUnassigned, vehicleUnassigned,
        specialCount,
        participants:   sorted,
        confirmed:      entry?.confirmed ?? false,
        confirmedAt:    entry?.confirmedAt,
        isExtra:        !cfg,
      };
    })
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.displayName.localeCompare(b.displayName, 'ko');
    });
}

function applyFilter(stats: ChurchStat[], filter: FilterKey): ChurchStat[] {
  switch (filter) {
    case 'confirmed':         return stats.filter(s => s.confirmed);
    case 'unconfirmed':       return stats.filter(s => !s.confirmed);
    case 'fee-incomplete':    return stats.filter(s => s.feeUnpaid > 0 || s.feePartial > 0);
    case 'assign-incomplete': return stats.filter(
      s => s.groupUnassigned > 0 || s.roomUnassigned > 0 || s.vehicleUnassigned > 0,
    );
    case 'special':           return stats.filter(s => s.specialCount > 0);
    default:                  return stats;
  }
}

// ── 인쇄 헬퍼 ─────────────────────────────────────────────────────────────────
function printChurchDetail(stat: ChurchStat) {
  const esc = (s: string) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const rows = stat.participants.map((p, i) => {
    const groupName   = p.groupId ? (GROUP_MAP.get(p.groupId) ?? '-') : '-';
    const roomName    = p.roomId  ? (ROOM_MAP.get(p.roomId)  ?? '-') : '-';
    const vehicleName = p.busId ?? '-';
    const feeText     = feeShortLabel(p);
    const special     = p.dietType === 'allergy'
      ? `알레르기${p.allergies ? ': ' + p.allergies : ''}`
      : (p.notes || '-');

    return `<tr style="${i % 2 === 0 ? 'background:#f8fafc' : ''}">
      <td>${esc(p.name)}</td>
      <td style="text-align:center">${esc(getRoleLabel(p))}</td>
      <td style="text-align:center">${esc(p.grade)}</td>
      <td style="text-align:center">${p.gender === 'M' ? '남' : '여'}</td>
      <td style="text-align:center">${feeText}</td>
      <td style="text-align:center">${esc(groupName)}</td>
      <td style="text-align:center">${esc(roomName)}</td>
      <td style="text-align:center">${esc(vehicleName)}</td>
      <td>${esc(p.phone)}</td>
      <td>${esc(p.parentPhone || '-')}</td>
      <td>${esc(special)}</td>
    </tr>`;
  }).join('');

  const headers = ['이름','구분','학년','성별','참가비','조','방','차량','연락처','보호자연락처','특이사항'];
  const el = document.createElement('div');
  el.innerHTML = `
    <style>
      @media print {
        body > * { visibility: hidden !important; }
        #__cp_print, #__cp_print * { visibility: visible !important; }
        #__cp_print {
          position: fixed; top: 0; left: 0; width: 100%;
          background: white; padding: 10mm; color: #3A4568;
        }
        table { width:100%; border-collapse:collapse; font-size:8pt; }
        th { background:#e2e8f0 !important; print-color-adjust:exact;
             border:0.75pt solid #94a3b8; padding:2.5pt 4pt;
             font-weight:700; text-align:left; white-space:nowrap; }
        td { border:0.5pt solid #cbd5e1; padding:2pt 4pt; }
        h2 { font-size:14pt; margin-bottom:4pt; }
        p  { font-size:9pt; color:#64748b; margin-bottom:10pt; }
      }
    </style>
    <div id="__cp_print">
      <h2>${esc(stat.displayName)} 참가자 명단</h2>
      <p>총 ${stat.total}명 (학생 ${stat.studentCount} / 교사·운영진 ${stat.staffCount}) · ${new Date().toLocaleDateString('ko-KR')} 출력</p>
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  document.body.appendChild(el);
  window.print();
  document.body.removeChild(el);
}

// ── 상세 모달 ─────────────────────────────────────────────────────────────────
function DetailModal({ stat, onClose }: { stat: ChurchStat; onClose: () => void }) {
  const TH  = 'px-3 py-2 text-left text-[10px] font-bold text-[#1F5FD9] whitespace-nowrap sticky top-0';
  const TD  = 'px-3 py-1.5 text-[11px] text-[#3A4568] whitespace-nowrap';
  const TDc = `${TD} text-center`;
  const COL_HEADERS = ['이름','구분','학년','성별','참가비','조','방','차량','연락처','보호자연락처','특이사항'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-3 pb-6"
      style={{ background: 'rgba(31,95,217,0.78)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full rounded-2xl overflow-hidden flex flex-col"
        style={{
          maxWidth: '960px',
          maxHeight: 'calc(100vh - 80px)',
          background: '#F8FBFF',
          border:     '1px solid rgba(37, 99, 235,0.3)',
          boxShadow:  '0 20px 60px rgba(31,95,217,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <h3 className="text-sm font-bold text-[#101A3D]">⛪ {stat.displayName}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              전체 {stat.total}명 · 학생 {stat.studentCount} · 교사·운영진 {stat.staffCount}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => printChurchDetail(stat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-[#101A3D] hover:bg-white/5 transition-colors"
              title="이 교회 명단 인쇄"
            >
              <Printer size={13} /> 인쇄
            </button>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#101A3D] hover:bg-[#EAF3FF] transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse">
            <thead style={{ background: 'var(--eum-modal-background)' }}>
              <tr>
                {COL_HEADERS.map(h => (
                  <th key={h} className={TH} style={{ borderBottom: '1px solid rgba(31,95,217,0.16)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stat.participants.map((p, i) => {
                const groupName   = p.groupId ? (GROUP_MAP.get(p.groupId) ?? '-') : '-';
                const roomName    = p.roomId  ? (ROOM_MAP.get(p.roomId)  ?? '-') : '-';
                const vehicleName = p.busId ?? '-';
                const fee         = feeShortLabel(p);
                const feeColorVal = feeColor(p);

                return (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? '#F5F7FA' : 'transparent' }}>
                    <td className={`${TD} font-semibold text-[#101A3D]`}>{p.name}</td>
                    <td className={TDc}>{getRoleLabel(p)}</td>
                    <td className={TDc}>{p.grade}</td>
                    <td className={TDc}>{p.gender === 'M' ? '남' : '여'}</td>
                    <td className={TDc}><span className="text-[10px] font-bold" style={{ color: feeColorVal }}>{fee}</span></td>
                    <td className={TDc}>{groupName === '-' ? <span className="text-slate-600">-</span> : groupName}</td>
                    <td className={TDc}>{roomName === '-' ? <span className="text-slate-600">-</span> : roomName}</td>
                    <td className={TDc}>{vehicleName === '-' ? <span className="text-slate-600">-</span> : vehicleName}</td>
                    <td className={TD}>{p.phone}</td>
                    <td className={TD}>{p.parentPhone || '-'}</td>
                    <td className={TD}>
                      {p.dietType === 'allergy' ? (
                        <span className="text-[10px] font-bold" style={{ color: '#ef4444' }}>
                          🚨 알레르기{p.allergies ? `: ${p.allergies}` : ''}
                        </span>
                      ) : p.notes && p.notes.trim() ? (
                        <span className="text-[10px] text-amber-400">{p.notes}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── 보기용 카드 ───────────────────────────────────────────────────────────────
function ViewCard({
  stat, onDetail, onToggleConfirm,
}: {
  stat: ChurchStat;
  onDetail: () => void;
  onToggleConfirm: () => void;
}) {
  const hasIssue = stat.feeUnpaid > 0 || stat.feePartial > 0
    || stat.groupUnassigned > 0 || stat.roomUnassigned > 0 || stat.vehicleUnassigned > 0;
  const feePct = stat.total > 0 ? Math.round((stat.feePaid / stat.total) * 100) : 0;
  const feeBarColor = feePct === 100 ? '#10b981' : feePct >= 70 ? '#f59e0b' : '#ef4444';
  const fillRate = Math.min(100, Math.round((stat.total / Math.max(stat.quota, 1)) * 100));
  const overQuota = stat.quota > 0 && stat.total > stat.quota;

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200"
      style={stat.confirmed
        ? { background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.28)', boxShadow: '0 4px 24px rgba(31,95,217,0.25)' }
        : stat.isExtra
          ? { background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.25)' }
          : CARD
      }>
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl flex-shrink-0">⛪</span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#101A3D] truncate">{stat.displayName}</div>
            <div className="text-[10px] text-slate-500 truncate">
              {stat.isExtra ? '명단에서 발견' : (stat.district || '-')} · 총 {stat.total}명
            </div>
          </div>
        </div>
        {stat.confirmed ? (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold flex-shrink-0"
            style={{ color: '#10b981', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle2 size={11} />확인 완료
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium flex-shrink-0"
            style={{ color: '#94a3b8', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)' }}>
            <Circle size={11} />미확인
          </span>
        )}
      </div>

      {/* 담당 교사 */}
      {(stat.teacherName || stat.teacherPhone) && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Phone size={11} className="flex-shrink-0" />
          <span className="truncate">{stat.teacherName ?? '-'}</span>
          {stat.teacherPhone && <>
            <span className="text-slate-600">·</span>
            <ContactLinks phone={stat.teacherPhone} label={`${stat.teacherName ?? stat.displayName} 담당자 연락처`} compact />
          </>}
        </div>
      )}

      {/* 인원 요약 3칸 */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: '전체',     value: stat.total,        color: '#3B82F6' },
          { label: '학생',     value: stat.studentCount,  color: '#10b981' },
          { label: '교사·운영', value: stat.staffCount,    color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="rounded-xl py-2 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="text-base font-black leading-none" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[9px] text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 정원 진행률 */}
      {stat.quota > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-400">정원 대비</span>
            <span className="text-[10px] font-bold tabular-nums" style={{ color: overQuota ? '#f59e0b' : '#3B82F6' }}>
              {stat.total}/{stat.quota}명{overQuota ? ' ⚠' : ''}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${fillRate}%`, background: overQuota ? '#f59e0b' : '#3B82F6' }}/>
          </div>
        </div>
      )}

      {/* 참가비 진행바 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-slate-400">참가비 납부</span>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: feeBarColor }}>
            {stat.feePaid}/{stat.total}명 ({feePct}%)
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${feePct}%`, background: feeBarColor }}/>
        </div>
      </div>

      {/* 이슈 배지 */}
      {hasIssue ? (
        <div className="flex flex-wrap gap-1">
          {stat.feeUnpaid > 0 && <Badge color="#ef4444">미납 {stat.feeUnpaid}명</Badge>}
          {stat.feePartial > 0 && <Badge color="#f59e0b">부분납 {stat.feePartial}명</Badge>}
          {stat.groupUnassigned > 0 && <Badge color="#f59e0b">조 미배정 {stat.groupUnassigned}</Badge>}
          {stat.roomUnassigned > 0 && <Badge color="#f59e0b">방 미배정 {stat.roomUnassigned}</Badge>}
          {stat.vehicleUnassigned > 0 && <Badge color="#f59e0b">차량 미배정 {stat.vehicleUnassigned}</Badge>}
        </div>
      ) : (
        <div className="text-[10px] text-slate-500"><span style={{ color: '#10b981' }}>✓</span> 배정 이슈 없음</div>
      )}

      {/* 특이사항 */}
      {stat.specialCount > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold"
          style={{ background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
          <AlertTriangle size={11} />
          특이사항 {stat.specialCount}명 (알레르기·메모)
        </div>
      )}

      {stat.isExtra && (
        <div className="text-[10px] text-amber-400 flex items-center gap-1.5">
          <AlertTriangle size={11} />
          <span>마스터에 등록되지 않은 교회 — 편집 모드에서 추가 권장</span>
        </div>
      )}

      {stat.confirmed && stat.confirmedAt && (
        <div className="text-[9px] text-slate-600">확인: {stat.confirmedAt.replace('T', ' ')}</div>
      )}

      {/* 버튼 */}
      <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={onDetail}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-[#101A3D] hover:bg-white/5 transition-colors">
          상세 보기 <ChevronRight size={12} />
        </button>
        <button onClick={onToggleConfirm}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all duration-150"
          style={stat.confirmed
            ? { color: '#94a3b8', background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)' }
            : { color: '#10b981', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)' }
          }>
          {stat.confirmed ? <><Circle size={12} />확인 해제</> : <><CheckCircle2 size={12} />최종 확인</>}
        </button>
      </div>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
      style={{ color, background: `${color}26` }}>
      {children}
    </span>
  );
}

// ── 편집용 카드 ───────────────────────────────────────────────────────────────
function EditCard({
  draft, memberCount, onUpdate, onRemove,
}: {
  draft: ChurchConfig;
  memberCount: number;
  onUpdate: (patch: Partial<ChurchConfig>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl p-5 space-y-4"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(37, 99, 235,0.15)', border: '1px solid rgba(37, 99, 235,0.3)' }}>
            <Building2 size={18} className="text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              value={draft.name}
              onChange={e => onUpdate({ name: e.target.value })}
              className="w-full bg-transparent text-sm font-bold text-[#101A3D] outline-none border-b border-white/10 focus:border-cyan-400 py-0.5"
              placeholder="교회 이름"
            />
            <input
              value={draft.district ?? ''}
              onChange={e => onUpdate({ district: e.target.value })}
              className="w-full bg-transparent text-xs text-slate-400 outline-none border-b border-white/10 focus:border-cyan-400 py-0.5 mt-1"
              placeholder="지방회"
            />
          </div>
        </div>
        <button onClick={onRemove}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-300 hover:bg-red-500/15 flex-shrink-0"
          title="교회 삭제">
          <Trash2 size={13} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <input
          value={draft.teacherName ?? ''}
          onChange={e => onUpdate({ teacherName: e.target.value })}
          className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-slate-200 outline-none focus:border-cyan-400"
          placeholder="담당 교사명"
        />
        <input
          value={draft.teacherPhone ?? ''}
          onChange={e => onUpdate({ teacherPhone: e.target.value })}
          className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-slate-200 outline-none focus:border-cyan-400"
          placeholder="010-0000-0000"
        />
      </div>

      <label className="flex items-center justify-between text-xs text-slate-400">
        <span>정원</span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            value={draft.quota}
            onChange={e => onUpdate({ quota: Math.max(0, Number(e.target.value) || 0) })}
            className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-[#101A3D] outline-none focus:border-cyan-400 text-right"
          />
          <span className="text-slate-500">명</span>
        </div>
      </label>

      {memberCount > 0 && (
        <div className="text-[11px] text-cyan-300/80">현재 {memberCount}명 신청</div>
      )}
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
export default function Churches() {
  const participants  = useParticipants();
  const churchConfig  = useChurchConfig();
  const sharedConfirm = useChurchConfirmMap();
  const { isAdmin }   = useAuth();

  const [confirmMap, setConfirmMap] = useState<ChurchConfirmMap>(sharedConfirm);
  const [filter, setFilter]         = useState<FilterKey>('all');
  const [editing, setEditing]       = useState(false);
  const [draft, setDraft]           = useState<ChurchConfig[]>([]);
  const [detailKey, setDetailKey]   = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setConfirmMap(sharedConfirm), 0);
    return () => window.clearTimeout(t);
  }, [sharedConfirm]);

  const activeParticipants = useMemo(
    () => participants.filter(p => p.status !== 'cancelled'),
    [participants],
  );

  // 명단에서 발견된 미등록 교회
  const extraConfigs = useMemo(() => {
    const seen = new Set(churchConfig.map(c => normalizeChurchName(c.name || c.id)));
    const out: ChurchConfig[] = [];
    activeParticipants.forEach(p => {
      const cid = resolveChurchId(p.church, churchConfig);
      if (churchConfig.some(c => c.id === cid)) return;
      const raw = p.church.trim();
      if (!raw) return;
      const k = normalizeChurchName(raw);
      if (seen.has(k)) return;
      seen.add(k);
      out.push({ id: raw, name: raw, quota: 0, district: '명단에서 발견' });
    });
    return out;
  }, [activeParticipants, churchConfig]);

  const allStats = useMemo(
    () => buildChurchStats(participants, confirmMap, churchConfig),
    [participants, confirmMap, churchConfig],
  );

  const filtered = useMemo(() => applyFilter(allStats, filter), [allStats, filter]);
  const detailStat = detailKey ? (allStats.find(s => s.churchKey === detailKey) ?? null) : null;

  const confirmedCount        = allStats.filter(s => s.confirmed).length;
  const feeIncompleteCount    = allStats.filter(s => s.feeUnpaid > 0 || s.feePartial > 0).length;
  const assignIncompleteCount = allStats.filter(
    s => s.groupUnassigned > 0 || s.roomUnassigned > 0 || s.vehicleUnassigned > 0,
  ).length;

  // 편집 모드 핸들러
  function openEdit() {
    setDraft(dedupeChurches([...churchConfig, ...extraConfigs]).map(c => ({
      ...c,
      district: c.district === '명단에서 발견' ? '' : c.district,
    })));
    setEditing(true);
  }
  function cancelEdit() { setDraft([]); setEditing(false); }
  function saveEdit() {
    const normalized = dedupeChurches(draft.map(c => ({
      ...c,
      name: (c.name ?? '').trim() || c.id,
      quota: Math.max(0, Number(c.quota) || 0),
      district:     c.district?.trim()     || undefined,
      contact:      c.contact?.trim()      || undefined,
      teacherName:  c.teacherName?.trim()  || undefined,
      teacherPhone: c.teacherPhone?.trim() || undefined,
    })));
    saveChurchConfig(normalized);
    const norm = participants.map(p => canonicalizeChurchValue(p, normalized));
    if (norm.some((p, i) => p.church !== participants[i]?.church)) saveParticipants(norm);
    setDraft([]); setEditing(false);
  }
  function update(id: string, patch: Partial<ChurchConfig>) {
    setDraft(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }
  function addChurch() {
    const id = nextChurchId(draft);
    const num = id.replace(/^c0*/, '');
    setDraft(prev => [...prev, { id, name: `${num}번 교회`, quota: 10, district: '예시지방회' }]);
  }
  function removeChurch(id: string) {
    const target = draft.find(c => c.id === id);
    if (!target) return;
    const memberCount = activeParticipants.filter(p => resolveChurchId(p.church, draft) === id).length;
    const msg = memberCount > 0
      ? `'${target.name}'에 ${memberCount}명이 신청되어 있습니다.\n삭제하면 해당 신청자는 "분류 안 됨"으로 표시됩니다.\n계속하시겠습니까?`
      : `'${target.name}'을(를) 삭제하시겠습니까?`;
    if (!window.confirm(msg)) return;
    setDraft(prev => prev.filter(c => c.id !== id));
  }

  useEffect(() => {
    if (!isAdmin || editing) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (consumeEditRequest('churches', 'info')) openEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, extraConfigs, isAdmin, churchConfig]);

  function handleToggleConfirm(churchKey: string) {
    const newMap = toggleChurchConfirm(churchKey, confirmMap);
    setConfirmMap(newMap);
    saveChurchConfirmMap(newMap);
  }

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all',               label: `전체 (${allStats.length})` },
    { key: 'confirmed',         label: `확인 완료 (${confirmedCount})` },
    { key: 'unconfirmed',       label: `미확인 (${allStats.length - confirmedCount})` },
    { key: 'fee-incomplete',    label: `참가비 미완료 (${feeIncompleteCount})` },
    { key: 'assign-incomplete', label: `배정 미완료 (${assignIncompleteCount})` },
    { key: 'special',           label: '특이사항 있음' },
  ];

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-[#101A3D]">교회별 신청 현황</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            참여 교회 {allStats.length}개 · 총 {activeParticipants.length}명 신청
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap justify-end">
            {editing && (
              <button onClick={cancelEdit}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={{ color: '#94a3b8', background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.25)' }}>
                취소
              </button>
            )}
            <button onClick={editing ? saveEdit : openEdit}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={editing
                ? { color: '#6ee7b7', background: 'rgba(16,185,129,0.16)', border: '1px solid rgba(16,185,129,0.35)' }
                : { color: '#2563EB', background: 'rgba(37, 99, 235,0.12)', border: '1px solid rgba(37, 99, 235,0.3)' }
              }>
              {editing ? <Check size={13} /> : <Pencil size={13} />}
              {editing ? '교회 정보 저장' : '교회 편집'}
            </button>
          </div>
        )}
      </div>

      {/* 요약 카드 5개 (편집 중엔 숨김) */}
      {!editing && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {[
            { label: '전체 교회',     value: allStats.length,                  unit: '개', color: '#3B82F6', emoji: '⛪' },
            { label: '확인 완료',     value: confirmedCount,                   unit: '개', color: '#10b981', emoji: '✅' },
            { label: '미확인',        value: allStats.length - confirmedCount, unit: '개', color: '#94a3b8', emoji: '○' },
            { label: '참가비 미완료', value: feeIncompleteCount,               unit: '개', color: '#f59e0b', emoji: '💰' },
            { label: '배정 미완료',   value: assignIncompleteCount,            unit: '개', color: '#ef4444', emoji: '⚠️' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 sm:p-4 flex items-center gap-3"
              style={{
                background: `linear-gradient(135deg, ${s.color}14 0%, rgba(255,255,255,0.04) 100%)`,
                border: `1px solid ${s.color}30`, boxShadow: '0 4px 16px rgba(31,95,217,0.2)',
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${s.color}22` }}>{s.emoji}</div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 whitespace-nowrap">{s.label}</div>
                <div className="font-black leading-tight" style={{ color: s.color, fontSize: '1.35rem' }}>
                  {s.value}<span className="text-[11px] font-semibold ml-0.5 text-slate-300">{s.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 편집 안내 + 추가 버튼 */}
      {editing && (
        <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 flex-wrap"
          style={{ background: 'rgba(37, 99, 235,0.06)', border: '1px solid rgba(37, 99, 235,0.25)' }}>
          <div className="flex items-center gap-2 text-xs text-cyan-200">
            <AlertTriangle size={13} className="text-cyan-400" />
            교회 정보를 수정한 뒤 우측 상단 "교회 정보 저장"을 눌러 적용해 주세요.
          </div>
          <button onClick={addChurch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ color: '#2563EB', background: 'rgba(37, 99, 235,0.12)', border: '1px dashed rgba(37, 99, 235,0.45)' }}>
            <Plus size={13} /> 교회 추가
          </button>
        </div>
      )}

      {/* 필터 (보기 모드만) */}
      {!editing && (
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
              style={filter === f.key
                ? { background: 'rgba(37, 99, 235,0.2)', border: '1px solid rgba(37, 99, 235,0.5)', color: '#2563EB' }
                : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }
              }>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* 카드 그리드 */}
      {editing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {draft.map(c => {
            const memberCount = activeParticipants.filter(p => resolveChurchId(p.church, draft) === c.id).length;
            return (
              <EditCard
                key={c.id}
                draft={c}
                memberCount={memberCount}
                onUpdate={patch => update(c.id, patch)}
                onRemove={() => removeChurch(c.id)}
              />
            );
          })}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-sm">해당하는 교회가 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(stat => (
            <ViewCard
              key={stat.churchKey}
              stat={stat}
              onDetail={() => setDetailKey(stat.churchKey)}
              onToggleConfirm={() => handleToggleConfirm(stat.churchKey)}
            />
          ))}
        </div>
      )}

      {/* 상세 모달 */}
      {detailStat && <DetailModal stat={detailStat} onClose={() => setDetailKey(null)} />}
    </div>
  );
}
