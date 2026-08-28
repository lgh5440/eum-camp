import { useMemo, useState } from 'react';
import { PhoneCall, Printer, AlertTriangle, Users, Phone, Info } from 'lucide-react';
import ContactLinks from '../components/ContactLinks';
import { useChurchConfig, useGroupMeta, useParticipants, useRoomConfig } from '../hooks/useSharedData';
import { isStudent } from '../utils/groupAssignment';
import { VEHICLE_CONFIG, INDIVIDUAL_ID } from '../utils/vehicleAssignment';
import { EVENT } from '../data/eventInfo';
import { resolveChurchId } from '../utils/churchIdentity';
import type { Participant } from '../types';

const ALL_VEHICLES = [...VEHICLE_CONFIG.map(v => v.id as string), INDIVIDUAL_ID];

// ── 타입 ─────────────────────────────────────────────────────────────────────────
type PrimaryFilter = 'all' | 'students' | 'staff' | 'missing' | 'special';

interface LookupMaps {
  churchMap: Map<string, string>;
  groupMap: Map<string, string>;
  roomMap: Map<string, string>;
}

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────────
function getRoleLabel(p: Participant): string {
  if (p.role) return p.role;
  if (p.grade === '교사' || p.grade === '학부모' || p.grade === '운영진') return p.grade;
  return '학생';
}

function hasSpecialNeeds(p: Participant): boolean {
  return p.dietType === 'allergy' || !!(p.notes && p.notes.trim());
}

function isMissingContact(p: Participant): boolean {
  return isStudent(p)
    ? !p.parentPhone || p.parentPhone.trim() === ''
    : !p.phone || p.phone.trim() === '';
}

function formatPhone(phone: string | undefined): string {
  return phone && phone.trim() ? phone : '—';
}

// ── 인쇄 함수 ─────────────────────────────────────────────────────────────────────
function printEmergencyList(list: Participant[], maps: LookupMaps) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const th = 'padding:5px 7px;font-size:10.5px;border:1px solid #bbb;background:#f0f0f0;text-align:center;white-space:nowrap;';
  const td = 'padding:4px 7px;font-size:10.5px;border:1px solid #ddd;white-space:nowrap;';

  const rows = list.map((p, i) => {
    const church   = maps.churchMap.get(p.church) ?? p.church;
    const role     = getRoleLabel(p);
    const group    = p.groupId ? (maps.groupMap.get(p.groupId) ?? '-') : '-';
    const room     = p.roomId  ? (maps.roomMap.get(p.roomId)  ?? '-') : '-';
    const vehicle  = p.busId   ?? '-';
    const missingParent = isStudent(p) && (!p.parentPhone || !p.parentPhone.trim());
    const missingPhone  = !isStudent(p) && (!p.phone || !p.phone.trim());

    const specialText = p.dietType === 'allergy'
      ? `⚠ 알레르기: ${p.allergies ?? '확인필요'}`
      : (p.notes && p.notes.trim() ? `※ ${p.notes}` : '');

    return `<tr>
      <td style="${td}text-align:center;">${i + 1}</td>
      <td style="${td}font-weight:bold;">${p.name}</td>
      <td style="${td}">${church}</td>
      <td style="${td}text-align:center;">${role}</td>
      <td style="${td}text-align:center;">${p.grade}</td>
      <td style="${td}text-align:center;">${p.gender === 'M' ? '남' : '여'}</td>
      <td style="${td}${missingPhone ? 'color:#cc0000;font-weight:bold;' : ''}">${formatPhone(p.phone)}</td>
      <td style="${td}${missingParent ? 'color:#cc0000;font-weight:bold;' : ''}">${missingParent ? '⚠ 미등록' : formatPhone(p.parentPhone)}</td>
      <td style="${td}">${group}</td>
      <td style="${td}">${room}</td>
      <td style="${td}text-align:center;">${vehicle}</td>
      <td style="${td}${p.dietType === 'allergy' ? 'color:#c05000;font-weight:bold;' : ''}">${specialText || '-'}</td>
    </tr>`;
  }).join('');

  const html = `<div style="font-family:'Malgun Gothic',sans-serif;color:#111;padding:0;">
    <div style="text-align:center;border-bottom:2px solid #333;padding-bottom:8px;margin-bottom:10px;">
      <div style="font-size:15px;font-weight:bold;">${EVENT.title}</div>
      <div style="font-size:12px;margin-top:3px;">${EVENT.theme} &nbsp;|&nbsp; ${EVENT.venue} &nbsp;|&nbsp; ${EVENT.dates}</div>
      <div style="font-size:18px;font-weight:bold;margin-top:6px;letter-spacing:2px;">비상연락망</div>
    </div>
    <div style="font-size:10px;color:#555;margin-bottom:6px;display:flex;justify-content:space-between;">
      <span>출력일시: ${dateStr}</span>
      <span>총 ${list.length}명 &nbsp;|&nbsp; <strong style="color:#c00;">★ 운영진 전용 문서 ★</strong></span>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th style="${th}">번호</th>
        <th style="${th}">이름</th>
        <th style="${th}">교회</th>
        <th style="${th}">구분</th>
        <th style="${th}">학년</th>
        <th style="${th}">성별</th>
        <th style="${th}">본인 연락처</th>
        <th style="${th}">보호자 연락처</th>
        <th style="${th}">조</th>
        <th style="${th}">방</th>
        <th style="${th}">차량</th>
        <th style="${th}">알레르기/특이사항</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top:14px;padding:7px 10px;background:#fff8e1;border:1px solid #f0c040;font-size:9.5px;color:#664d03;">
      ※ 본 문서는 수련회 안전 관리를 위한 운영진 전용 자료이며, 행사 종료 후 안전하게 폐기해야 합니다.
    </div>
  </div>`;

  const el = document.createElement('div');
  el.id = '__ec_print';
  el.innerHTML = html;

  const style = document.createElement('style');
  style.textContent = `
    @media print {
      body > * { visibility: hidden !important; }
      #__ec_print, #__ec_print * { visibility: visible !important; }
      #__ec_print { position: fixed; top: 0; left: 0; width: 100%; background: white; padding: 16px; box-sizing: border-box; }
      @page { margin: 12mm; }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(el);
  window.print();
  document.body.removeChild(el);
  document.head.removeChild(style);
}

// ── 상수 ─────────────────────────────────────────────────────────────────────────
const PRIMARY_FILTERS: { key: PrimaryFilter; label: string }[] = [
  { key: 'all',      label: '전체' },
  { key: 'students', label: '학생' },
  { key: 'staff',    label: '교사/운영진' },
  { key: 'missing',  label: '연락처 누락' },
  { key: 'special',  label: '알레르기/복용약' },
];

// ── 스타일 상수 ──────────────────────────────────────────────────────────────────
const CARD = 'rounded-2xl p-4 flex flex-col gap-1';
const TH   = 'px-3 py-2.5 text-left text-[11px] font-semibold whitespace-nowrap';
const TD   = 'px-3 py-2 text-[12px] whitespace-nowrap';

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function EmergencyContacts() {
  const [primary,  setPrimary]  = useState<PrimaryFilter>('all');
  const [church,   setChurch]   = useState('');
  const [group,    setGroup]    = useState('');
  const [room,     setRoom]     = useState('');
  const [vehicle,  setVehicle]  = useState('');

  // ── 데이터 로드 ────────────────────────────────────────────────────────────────
  const allParticipants = useParticipants();
  const churchConfig = useChurchConfig();
  const groupMeta = useGroupMeta();
  const roomConfig = useRoomConfig();

  const lookupMaps = useMemo<LookupMaps>(() => ({
    churchMap: new Map(churchConfig.map(church => [church.id, church.name])),
    groupMap: new Map(groupMeta.map(group => [group.id, group.name])),
    roomMap: new Map(roomConfig.map(room => [room.id, `${room.building} ${room.name}`])),
  }), [churchConfig, groupMeta, roomConfig]);

  const active = useMemo(
    () => allParticipants
      .filter(p => p.status !== 'cancelled')
      .map(p => ({ ...p, church: resolveChurchId(p.church, churchConfig) })),
    [allParticipants, churchConfig],
  );

  // ── 요약 통계 ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:          active.length,
    students:       active.filter(isStudent).length,
    parentPhoneOk:  active.filter(p => isStudent(p) && p.parentPhone && p.parentPhone.trim()).length,
    missingContact: active.filter(isMissingContact).length,
    special:        active.filter(hasSpecialNeeds).length,
  }), [active]);

  // ── 2차 필터 옵션 (실제 데이터 기반) ─────────────────────────────────────────
  const churchOptions = useMemo(() => {
    const ids = [...new Set(active.map(p => p.church))].sort();
    return ids.map(id => ({ id, name: lookupMaps.churchMap.get(id) ?? id }));
  }, [active, lookupMaps.churchMap]);

  const groupOptions = useMemo(() => {
    const ids = [...new Set(active.map(p => p.groupId).filter(Boolean))] as string[];
    return ids
      .filter(id => lookupMaps.groupMap.has(id))
      .sort()
      .map(id => ({ id, name: lookupMaps.groupMap.get(id)! }));
  }, [active, lookupMaps.groupMap]);

  const roomOptions = useMemo(() => {
    const ids = [...new Set(active.map(p => p.roomId).filter(Boolean))] as string[];
    return ids
      .filter(id => lookupMaps.roomMap.has(id))
      .sort()
      .map(id => ({ id, name: lookupMaps.roomMap.get(id)! }));
  }, [active, lookupMaps.roomMap]);

  const vehicleOptions = useMemo(() => {
    const ids = [...new Set(active.map(p => p.busId).filter(Boolean))] as string[];
    return ids.filter(id => ALL_VEHICLES.includes(id)).sort();
  }, [active]);

  // ── 필터 적용 ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = active;

    switch (primary) {
      case 'students': list = list.filter(isStudent);       break;
      case 'staff':    list = list.filter(p => !isStudent(p)); break;
      case 'missing':  list = list.filter(isMissingContact); break;
      case 'special':  list = list.filter(hasSpecialNeeds);  break;
    }

    if (church)  list = list.filter(p => p.church  === church);
    if (group)   list = list.filter(p => p.groupId === group);
    if (room)    list = list.filter(p => p.roomId  === room);
    if (vehicle) list = list.filter(p => p.busId   === vehicle);

    return list;
  }, [primary, church, group, room, vehicle, active]);

  // ── SELECT 공통 스타일 ────────────────────────────────────────────────────────
  const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(37, 99, 235,0.2)',
    borderRadius: '10px',
    color: '#94a3b8',
    padding: '6px 10px',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── 페이지 헤더 ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 0 14px rgba(239,68,68,0.35)' }}
            >
              <PhoneCall size={18} className="text-[#1B3A5C]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1B3A5C] leading-tight">비상연락망</h1>
              <p className="text-[11px] text-slate-400">응급 상황 시 즉시 확인 가능한 참가자 연락처 목록</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => printEmergencyList(active, lookupMaps)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
          style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', boxShadow: '0 2px 10px rgba(239,68,68,0.3)' }}
        >
          <Printer size={15} />
          비상연락망 인쇄
        </button>
      </div>

      {/* ── 개인정보 안내 배너 ───────────────────────────────────────────────────── */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-xl"
        style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
      >
        <Info size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-300 leading-relaxed">
          <span className="font-bold text-amber-200">운영진 전용 문서 —</span>{' '}
          본 문서는 수련회 안전 관리를 위한 운영진 전용 자료이며, 행사 종료 후 안전하게 폐기해야 합니다.
        </p>
      </div>

      {/* ── 요약 카드 ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {/* 전체 연락 대상 */}
        <div className={CARD} style={{ background: 'rgba(37, 99, 235,0.08)', border: '1px solid rgba(37, 99, 235,0.2)' }}>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-cyan-400" />
            <span className="text-[11px] text-slate-400">전체 연락 대상</span>
          </div>
          <span className="text-2xl font-bold text-[#1B3A5C]">{stats.total}</span>
          <span className="text-[10px] text-slate-500">취소 제외 전체</span>
        </div>

        {/* 학생 수 */}
        <div className={CARD} style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-blue-400" />
            <span className="text-[11px] text-slate-400">학생</span>
          </div>
          <span className="text-2xl font-bold text-[#1B3A5C]">{stats.students}</span>
          <span className="text-[10px] text-slate-500">교사·운영진 제외</span>
        </div>

        {/* 보호자 연락처 등록 */}
        <div className={CARD} style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-emerald-400" />
            <span className="text-[11px] text-slate-400">보호자 연락처 등록</span>
          </div>
          <span className="text-2xl font-bold text-[#1B3A5C]">{stats.parentPhoneOk}</span>
          <span className="text-[10px] text-slate-500">학생 중 등록된 인원</span>
        </div>

        {/* 연락처 누락 */}
        <div
          className={CARD}
          style={{
            background: stats.missingContact > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${stats.missingContact > 0 ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className={stats.missingContact > 0 ? 'text-red-400' : 'text-slate-500'} />
            <span className="text-[11px] text-slate-400">연락처 누락</span>
          </div>
          <span className={`text-2xl font-bold ${stats.missingContact > 0 ? 'text-red-400' : 'text-[#1B3A5C]'}`}>
            {stats.missingContact}
          </span>
          <span className="text-[10px] text-slate-500">즉시 확인 필요</span>
        </div>

        {/* 알레르기/복용약 주의 */}
        <div
          className={CARD}
          style={{
            background: stats.special > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${stats.special > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className={stats.special > 0 ? 'text-amber-400' : 'text-slate-500'} />
            <span className="text-[11px] text-slate-400">알레르기/복용약</span>
          </div>
          <span className={`text-2xl font-bold ${stats.special > 0 ? 'text-amber-400' : 'text-[#1B3A5C]'}`}>
            {stats.special}
          </span>
          <span className="text-[10px] text-slate-500">주의 인원</span>
        </div>
      </div>

      {/* ── 필터 영역 ────────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* 1차 필터 버튼 */}
        <div className="flex flex-wrap gap-2">
          {PRIMARY_FILTERS.map(f => {
            const active_btn = primary === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setPrimary(f.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: active_btn ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${active_btn ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  color: active_btn ? '#fca5a5' : '#94a3b8',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* 2차 필터 드롭다운 */}
        <div className="flex flex-wrap gap-2">
          <select style={selectStyle} value={church} onChange={e => setChurch(e.target.value)}>
            <option value="">교회 전체</option>
            {churchOptions.map(c => (
              <option key={c.id} value={c.id} style={{ background: '#0a1628' }}>{c.name}</option>
            ))}
          </select>

          <select style={selectStyle} value={group} onChange={e => setGroup(e.target.value)}>
            <option value="">조 전체</option>
            {groupOptions.map(g => (
              <option key={g.id} value={g.id} style={{ background: '#0a1628' }}>{g.name}</option>
            ))}
          </select>

          <select style={selectStyle} value={room} onChange={e => setRoom(e.target.value)}>
            <option value="">방 전체</option>
            {roomOptions.map(r => (
              <option key={r.id} value={r.id} style={{ background: '#0a1628' }}>{r.name}</option>
            ))}
          </select>

          <select style={selectStyle} value={vehicle} onChange={e => setVehicle(e.target.value)}>
            <option value="">차량 전체</option>
            {vehicleOptions.map(v => (
              <option key={v} value={v} style={{ background: '#0a1628' }}>{v}</option>
            ))}
          </select>

          {/* 필터 초기화 */}
          {(primary !== 'all' || church || group || room || vehicle) && (
            <button
              onClick={() => { setPrimary('all'); setChurch(''); setGroup(''); setRoom(''); setVehicle(''); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
            >
              초기화
            </button>
          )}
        </div>

        {/* 표시 인원 수 */}
        <div className="text-[11px] text-slate-500">
          총 <span className="text-cyan-400 font-bold">{filtered.length}</span>명 표시 중
          {filtered.length !== active.length && (
            <span className="ml-1">(전체 {active.length}명 중)</span>
          )}
        </div>
      </div>

      {/* ── 연락망 표 ────────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            해당 조건의 참가자가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th className={`${TH} text-slate-400 text-center w-10`}>#</th>
                  <th className={`${TH} text-slate-400`}>이름</th>
                  <th className={`${TH} text-slate-400`}>교회</th>
                  <th className={`${TH} text-slate-400 text-center`}>구분</th>
                  <th className={`${TH} text-slate-400 text-center`}>학년</th>
                  <th className={`${TH} text-slate-400 text-center`}>성별</th>
                  <th className={`${TH} text-slate-400`}>본인 연락처</th>
                  <th className={`${TH} text-slate-400`}>보호자 연락처</th>
                  <th className={`${TH} text-slate-400`}>조</th>
                  <th className={`${TH} text-slate-400`}>방</th>
                  <th className={`${TH} text-slate-400 text-center`}>차량</th>
                  <th className={`${TH} text-slate-400`}>알레르기/특이사항</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const church_name  = lookupMaps.churchMap.get(p.church) ?? p.church;
                  const role         = getRoleLabel(p);
                  const groupName    = p.groupId ? (lookupMaps.groupMap.get(p.groupId) ?? '-') : '-';
                  const roomName     = p.roomId  ? (lookupMaps.roomMap.get(p.roomId)  ?? '-') : '-';
                  const vehicleName  = p.busId   ?? '-';
                  const isStud       = isStudent(p);
                  const missingParent = isStud && (!p.parentPhone || !p.parentPhone.trim());
                  const missingPhone  = !isStud  && (!p.phone || !p.phone.trim());
                  const hasAllergy    = p.dietType === 'allergy';
                  const hasNotes      = !!(p.notes && p.notes.trim());
                  const rowBg = i % 2 === 0
                    ? 'rgba(255,255,255,0.015)'
                    : 'transparent';

                  return (
                    <tr
                      key={p.id}
                      style={{ background: rowBg, borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      {/* 번호 */}
                      <td className={`${TD} text-center text-slate-500`}>{i + 1}</td>

                      {/* 이름 */}
                      <td className={`${TD} font-semibold text-[#1B3A5C]`}>{p.name}</td>

                      {/* 교회 */}
                      <td className={`${TD} text-slate-300`}>{church_name}</td>

                      {/* 구분 */}
                      <td className={`${TD} text-center`}>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            background: isStud ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                            color:      isStud ? '#93c5fd' : '#c4b5fd',
                          }}
                        >
                          {role}
                        </span>
                      </td>

                      {/* 학년 */}
                      <td className={`${TD} text-center text-slate-300`}>{p.grade}</td>

                      {/* 성별 */}
                      <td className={`${TD} text-center`}>
                        <span style={{ color: p.gender === 'M' ? '#60a5fa' : '#f472b6', fontWeight: 600 }}>
                          {p.gender === 'M' ? '남' : '여'}
                        </span>
                      </td>

                      {/* 본인 연락처 */}
                      <td className={`${TD}`}>
                        {missingPhone ? (
                          <span className="flex items-center gap-1 text-red-400 font-semibold text-[11px]">
                            <AlertTriangle size={11} />미등록
                          </span>
                        ) : (
                          <ContactLinks phone={p.phone} label={`${p.name} 본인 연락처`} compact className="text-[11px]" />
                        )}
                      </td>

                      {/* 보호자 연락처 */}
                      <td className={`${TD}`}>
                        {missingParent ? (
                          <span className="flex items-center gap-1 text-red-400 font-semibold text-[11px]">
                            <AlertTriangle size={11} />미등록
                          </span>
                        ) : (
                          <ContactLinks phone={p.parentPhone} label={`${p.name} 보호자 연락처`} compact className="text-[11px]" />
                        )}
                      </td>

                      {/* 조 */}
                      <td className={`${TD} text-slate-300 text-[11px]`}>
                        {groupName === '-' ? <span className="text-slate-600">-</span> : groupName}
                      </td>

                      {/* 방 */}
                      <td className={`${TD} text-slate-300 text-[11px]`}>
                        {roomName === '-' ? <span className="text-slate-600">-</span> : roomName}
                      </td>

                      {/* 차량 */}
                      <td className={`${TD} text-center text-[11px] text-slate-300`}>
                        {vehicleName === '-' ? <span className="text-slate-600">-</span> : vehicleName}
                      </td>

                      {/* 알레르기/특이사항 */}
                      <td className={`${TD}`}>
                        <div className="flex flex-col gap-0.5">
                          {hasAllergy && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                              style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}
                            >
                              <AlertTriangle size={9} />
                              알레르기{p.allergies ? `: ${p.allergies}` : ''}
                            </span>
                          )}
                          {hasNotes && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
                              style={{ background: 'rgba(100,116,139,0.2)', color: '#94a3b8' }}
                            >
                              {p.notes}
                            </span>
                          )}
                          {!hasAllergy && !hasNotes && (
                            <span className="text-slate-600 text-[11px]">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 하단 범례 ────────────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl px-4 py-3 flex flex-wrap gap-4 items-center"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-[10px] text-slate-500 font-medium">범례</span>
        <span className="flex items-center gap-1.5 text-[10px] text-red-400">
          <AlertTriangle size={10} /> 연락처 누락 — 즉시 확인 필요
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-amber-400">
          <AlertTriangle size={10} /> 알레르기 — 식사·활동 시 주의
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <Info size={10} /> 특이사항 — 운영진 참고
        </span>
        <span className="ml-auto text-[10px] text-slate-600">
          인쇄 버튼은 전체 명단(필터 무관)을 출력합니다
        </span>
      </div>
    </div>
  );
}
