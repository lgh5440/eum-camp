import { useState } from 'react';
import { Printer } from 'lucide-react';
import { EVENT } from '../data/eventInfo';
import type { Participant } from '../types';
import { useChurchConfig, useGroupMeta, useParticipants, useRoomConfig } from '../hooks/useSharedData';
import { isStudent } from '../utils/groupAssignment';
import { VEHICLE_CONFIG, VEHICLE_IDS, INDIVIDUAL_ID } from '../utils/vehicleAssignment';

// ── 상수 ────────────────────────────────────────────────────────────────────────
type DocType = 'all' | 'groups' | 'rooms' | 'vehicles' | 'churches';

const DOC_TABS: { key: DocType; label: string }[] = [
  { key: 'all',      label: '전체 참가자 명단' },
  { key: 'groups',   label: '조 편성표' },
  { key: 'rooms',    label: '방 배정표' },
  { key: 'vehicles', label: '차량 탑승표' },
  { key: 'churches', label: '교회별 확인표' },
];

const FEE_LABEL: Record<string, string> = { paid: '완납', partial: '면제', unpaid: '미납' };
const ROOM_TYPE_LABEL: Record<string, string> = { male: '남자', female: '여자', staff: '교사/스탭' };

// ── 헬퍼 함수 ──────────────────────────────────────────────────────────────────
function maskPhone(phone: string | undefined): string {
  if (!phone) return '-';
  return phone.replace(/(\d{3})-(\d{3,4})-(\d{4})/, '$1-****-$4');
}
function displayPhone(phone: string | undefined, show: boolean): string {
  if (!phone) return '-';
  return show ? phone : maskPhone(phone);
}
function getRoleLabel(p: Participant): string {
  if (p.role && p.role !== '학생') return p.role;
  if (p.grade === '교사' || p.grade === '학부모' || p.grade === '운영진') return p.grade;
  return '학생';
}
function getGradeDisplay(p: Participant): string {
  return getRoleLabel(p) === '학생' ? p.grade : '-';
}

// ── 공유 셀 스타일 ─────────────────────────────────────────────────────────────
const TH = 'px-2 py-1.5 text-left text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 whitespace-nowrap';
const TD = 'px-2 py-1.5 text-xs text-slate-700 border border-slate-200 align-top';
const TDc = 'px-2 py-1.5 text-xs text-slate-700 border border-slate-200 align-top text-center';

// ── 컴포넌트 ───────────────────────────────────────────────────────────────────
export default function PrintCenter() {
  const [docType,        setDocType]        = useState<DocType>('all');
  const [orientation,    setOrientation]    = useState<'portrait' | 'landscape'>('portrait');
  const [showPhone,      setShowPhone]      = useState(true);
  const [showParentPhone,setShowParentPhone]= useState(false);

  const participants = useParticipants();
  const churchConfig = useChurchConfig();
  const groupMeta = useGroupMeta();
  const roomConfig = useRoomConfig();

  const churchMap:     Record<string, string> = Object.fromEntries(churchConfig.map(c => [c.id, c.name]));
  const groupNameMap:  Record<string, string> = Object.fromEntries(groupMeta.map(g => [g.id, g.name]));
  const groupLeaderMap:Record<string, string> = Object.fromEntries(groupMeta.map(g => [g.id, g.leaderName]));
  const roomNameMap:   Record<string, string> = Object.fromEntries(roomConfig.map(r => [r.id, r.name]));

  const ch  = (id: string)           => churchMap[id]    ?? id;
  const grp = (id: string | undefined) => id ? (groupNameMap[id] ?? id) : '-';
  const rm  = (id: string | undefined) => id ? (roomNameMap[id]  ?? id) : '-';
  const bus = (id: string | undefined) => id ?? '-';

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── 문서 상단 공통 헤더 ─────────────────────────────────────────────────────
  function renderHeader(docTitle: string) {
    return (
      <div className="mb-5">
        <div className="text-center border-b-2 border-slate-700 pb-3">
          <div className="text-sm text-slate-500 mb-0.5">{EVENT.title}</div>
          <div className="text-[11px] text-slate-400">{EVENT.theme} · {EVENT.dates} · {EVENT.venue}</div>
          <div className="text-2xl font-black text-slate-800 mt-2">{docTitle}</div>
          <div className="text-[10px] text-slate-400 mt-1">출력일: {today}</div>
        </div>
      </div>
    );
  }

  // ── 섹션 그룹 헤더 (조/방/차량/교회별) ─────────────────────────────────────
  function SectionHeader({ children }: { children: React.ReactNode }) {
    return (
      <div className="px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
        {children}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 문서 1: 전체 참가자 명단
  // ─────────────────────────────────────────────────────────────────────────────
  function renderAll() {
    const sorted = [...participants].sort((a, b) =>
      ch(a.church).localeCompare(ch(b.church)) || a.name.localeCompare(b.name)
    );
    return (
      <>
        {renderHeader('전체 참가자 명단')}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse print-table">
            <thead>
              <tr>
                {[
                  '번호', '이름', '교회', '구분', '학년', '성별',
                  '연락처', '보호자 연락처',
                  '조', '방', '차량', '참가비', '특이사항',
                ].map(h => <th key={h} className={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={p.id} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                  <td className={TDc}>{i + 1}</td>
                  <td className={`${TD} font-medium`}>{p.name}</td>
                  <td className={TD}>{ch(p.church)}</td>
                  <td className={TDc}>{getRoleLabel(p)}</td>
                  <td className={TDc}>{getGradeDisplay(p)}</td>
                  <td className={TDc}>{p.gender === 'M' ? '남' : '여'}</td>
                  <td className={TD}>{displayPhone(p.phone, showPhone)}</td>
                  <td className={TD}>{displayPhone(p.parentPhone, showParentPhone)}</td>
                  <td className={TD}>{grp(p.groupId)}</td>
                  <td className={TD}>{rm(p.roomId)}</td>
                  <td className={TDc}>{bus(p.busId)}</td>
                  <td className={TDc}>{FEE_LABEL[p.fee] ?? p.fee}</td>
                  <td className={TD}>{p.notes ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-xs text-slate-400 text-right">총 {sorted.length}명</div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 문서 2: 조 편성표
  // ─────────────────────────────────────────────────────────────────────────────
  function renderGroups() {
    return (
      <>
        {renderHeader('조 편성표')}
        <div className="space-y-6">
          {groupMeta.map(group => {
            const members  = participants.filter(p => p.groupId === group.id);
            const students = members.filter(isStudent);
            const teacher  = members.find(p => !isStudent(p));
            return (
              <div key={group.id} className="print-break-avoid">
                <SectionHeader>
                  <span className="font-black text-slate-800 text-sm">{group.name}</span>
                  <span className="text-slate-500 text-xs">담당교사: {teacher?.name ?? groupLeaderMap[group.id] ?? group.leaderName}</span>
                  <span className="ml-auto text-xs text-slate-500">학생 {students.length}명</span>
                </SectionHeader>
                {students.length === 0 ? (
                  <p className="text-xs text-slate-400 px-3 py-2">배정된 학생이 없습니다.</p>
                ) : (
                  <table className="w-full border-collapse print-table">
                    <thead>
                      <tr>
                        {['번호', '이름', '교회', '학년', '성별', '방', '차량'].map(h =>
                          <th key={h} className={TH}>{h}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((p, i) => (
                        <tr key={p.id} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                          <td className={TDc}>{i + 1}</td>
                          <td className={`${TD} font-medium`}>{p.name}</td>
                          <td className={TD}>{ch(p.church)}</td>
                          <td className={TDc}>{p.grade}</td>
                          <td className={TDc}>{p.gender === 'M' ? '남' : '여'}</td>
                          <td className={TD}>{rm(p.roomId)}</td>
                          <td className={TDc}>{bus(p.busId)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 문서 3: 방 배정표
  // ─────────────────────────────────────────────────────────────────────────────
  function renderRooms() {
    return (
      <>
        {renderHeader('방 배정표')}
        <div className="space-y-6">
          {roomConfig.map(roomData => {
            const members = participants.filter(p => p.roomId === roomData.id);
            const teacher = members.find(p => !isStudent(p));
            return (
              <div key={roomData.id} className="print-break-avoid">
                <SectionHeader>
                  <span className="font-black text-slate-800 text-sm">{roomData.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                    {ROOM_TYPE_LABEL[roomData.type] ?? roomData.type}
                  </span>
                  <span className="text-slate-500 text-xs">수용 {roomData.capacity}명 · 배정 {members.length}명</span>
                  {teacher && <span className="text-slate-500 text-xs">담당: {teacher.name}</span>}
                </SectionHeader>
                {members.length === 0 ? (
                  <p className="text-xs text-slate-400 px-3 py-2">배정된 인원이 없습니다.</p>
                ) : (
                  <table className="w-full border-collapse print-table">
                    <thead>
                      <tr>
                        {['번호', '이름', '교회', '학년', '구분', '성별', '조', '특이사항'].map(h =>
                          <th key={h} className={TH}>{h}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((p, i) => (
                        <tr key={p.id} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                          <td className={TDc}>{i + 1}</td>
                          <td className={`${TD} font-medium`}>{p.name}</td>
                          <td className={TD}>{ch(p.church)}</td>
                          <td className={TDc}>{getGradeDisplay(p)}</td>
                          <td className={TDc}>{getRoleLabel(p)}</td>
                          <td className={TDc}>{p.gender === 'M' ? '남' : '여'}</td>
                          <td className={TD}>{grp(p.groupId)}</td>
                          <td className={TD}>{p.notes ?? ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 문서 4: 차량 탑승표
  // ─────────────────────────────────────────────────────────────────────────────
  function renderVehicles() {
    const sections = [
      ...VEHICLE_CONFIG.map(v => ({
        key: v.id, label: v.label, capacity: v.capacity as number | null,
        members: participants.filter(p => p.busId === v.id),
      })),
      {
        key: INDIVIDUAL_ID, label: '개별이동', capacity: null,
        members: participants.filter(p => p.busId === INDIVIDUAL_ID),
      },
      {
        key: 'unassigned', label: '미배정', capacity: null,
        members: participants.filter(p => {
          if (!p.busId) return true;
          return p.busId !== INDIVIDUAL_ID && !VEHICLE_IDS.includes(p.busId);
        }),
      },
    ].filter(s => s.members.length > 0);

    return (
      <>
        {renderHeader('차량 탑승표')}
        <div className="space-y-6">
          {sections.map(section => (
            <div key={section.key} className="print-break-avoid">
              <SectionHeader>
                <span className="font-black text-slate-800 text-sm">{section.label}</span>
                <span className="text-slate-500 text-xs">
                  {section.capacity
                    ? `수용 ${section.capacity}명 · 탑승 ${section.members.length}명`
                    : `총 ${section.members.length}명`}
                </span>
              </SectionHeader>
              <table className="w-full border-collapse print-table">
                <thead>
                  <tr>
                    {['번호', '이름', '교회', '구분', '연락처', '조', '방'].map(h =>
                      <th key={h} className={TH}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {section.members.map((p, i) => (
                    <tr key={p.id} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      <td className={TDc}>{i + 1}</td>
                      <td className={`${TD} font-medium`}>{p.name}</td>
                      <td className={TD}>{ch(p.church)}</td>
                      <td className={TDc}>{getRoleLabel(p)}</td>
                      <td className={TD}>{displayPhone(p.phone, showPhone)}</td>
                      <td className={TD}>{grp(p.groupId)}</td>
                      <td className={TD}>{rm(p.roomId)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 문서 5: 교회별 확인표
  // ─────────────────────────────────────────────────────────────────────────────
  function renderChurches() {
    const configuredChurchIds = new Set(churchConfig.map(c => c.id));
    const extraChurches = Array.from(new Set(
      participants
        .map(p => p.church)
        .filter(churchId => !configuredChurchIds.has(churchId)),
    )).map(churchId => ({
      id: churchId,
      name: churchMap[churchId] ?? churchId,
    }));
    const churchGroups = [...churchConfig, ...extraChurches]
      .map(c => ({ church: c, members: participants.filter(p => p.church === c.id) }))
      .filter(g => g.members.length > 0);

    return (
      <>
        {renderHeader('교회별 확인표')}
        <div className="space-y-6">
          {churchGroups.map(({ church, members }) => {
            const studentCount = members.filter(isStudent).length;
            const staffCount   = members.length - studentCount;
            return (
              <div key={church.id} className="print-break-avoid">
                <SectionHeader>
                  <span className="font-black text-slate-800 text-sm">{church.name}</span>
                  <span className="text-slate-500 text-xs">총 {members.length}명</span>
                  <span className="text-slate-500 text-xs">학생 {studentCount}명</span>
                  {staffCount > 0 && (
                    <span className="text-slate-500 text-xs">교사/학부모 {staffCount}명</span>
                  )}
                </SectionHeader>
                <table className="w-full border-collapse print-table">
                  <thead>
                    <tr>
                      {['번호', '이름', '구분', '학년', '성별', '참가비', '조', '방', '차량', '특이사항'].map(h =>
                        <th key={h} className={TH}>{h}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((p, i) => (
                      <tr key={p.id} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                        <td className={TDc}>{i + 1}</td>
                        <td className={`${TD} font-medium`}>{p.name}</td>
                        <td className={TDc}>{getRoleLabel(p)}</td>
                        <td className={TDc}>{getGradeDisplay(p)}</td>
                        <td className={TDc}>{p.gender === 'M' ? '남' : '여'}</td>
                        <td className={TDc}>{FEE_LABEL[p.fee] ?? p.fee}</td>
                        <td className={TD}>{grp(p.groupId)}</td>
                        <td className={TD}>{rm(p.roomId)}</td>
                        <td className={TDc}>{bus(p.busId)}</td>
                        <td className={TD}>{p.notes ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  function renderContent() {
    switch (docType) {
      case 'all':      return renderAll();
      case 'groups':   return renderGroups();
      case 'rooms':    return renderRooms();
      case 'vehicles': return renderVehicles();
      case 'churches': return renderChurches();
    }
  }

  return (
    <div className="space-y-5">

      {/* 동적 인쇄 CSS — 용지 방향 반영 */}
      <style>{`
        @media print {
          @page { size: A4 ${orientation}; margin: 15mm 10mm; }
        }
      `}</style>

      {/* ── 컨트롤 (인쇄 시 숨김) ── */}
      <div className="no-print space-y-4">

        {/* 페이지 헤더 */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">출력 센터</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              수련회 운영 명단을 브라우저 인쇄(Ctrl+P)로 출력합니다
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 flex-shrink-0"
            style={{ background: 'linear-gradient(90deg, #0891b2, #0ea5e9)', boxShadow: '0 4px 16px rgba(6,182,212,0.3)' }}
          >
            <Printer size={16} />
            인쇄하기
          </button>
        </div>

        {/* 문서 선택 탭 */}
        <div className="flex flex-wrap gap-2">
          {DOC_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setDocType(tab.key)}
              className="px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
              style={
                docType === tab.key
                  ? { background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.5)', color: '#22d3ee' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 설정 패널 */}
        <div
          className="rounded-xl px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* 용지 방향 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">용지 방향</span>
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              {(['portrait', 'landscape'] as const).map(o => (
                <button
                  key={o}
                  onClick={() => setOrientation(o)}
                  className="px-3 py-1.5 text-xs font-medium transition-colors"
                  style={
                    orientation === o
                      ? { background: 'rgba(6,182,212,0.25)', color: '#22d3ee' }
                      : { background: 'transparent', color: '#64748b' }
                  }
                >
                  {o === 'portrait' ? 'A4 세로' : 'A4 가로'}
                </button>
              ))}
            </div>
          </div>

          {/* 연락처 표시 */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPhone}
              onChange={e => setShowPhone(e.target.checked)}
              className="w-4 h-4 rounded accent-cyan-500"
            />
            <span className="text-xs text-slate-300 whitespace-nowrap">연락처 표시</span>
          </label>

          {/* 보호자 연락처 표시 */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showParentPhone}
              onChange={e => setShowParentPhone(e.target.checked)}
              className="w-4 h-4 rounded accent-cyan-500"
            />
            <span className="text-xs text-slate-300 whitespace-nowrap">보호자 연락처 표시</span>
          </label>

          <span className="text-xs text-slate-500 ml-auto whitespace-nowrap">
            현재 데이터 {participants.length}명 기준 · {today}
          </span>
        </div>

        {/* 연락처 마스킹 안내 */}
        {(!showPhone || !showParentPhone) && (
          <p className="text-[11px] text-slate-500 px-1">
            {!showPhone && '연락처'}
            {!showPhone && !showParentPhone && ' · '}
            {!showParentPhone && '보호자 연락처'}
            &nbsp;는 <span className="text-cyan-500 font-medium">010-****-1234</span> 형태로 마스킹되어 출력됩니다.
          </p>
        )}
      </div>

      {/* ── 문서 미리보기 / 인쇄 영역 ── */}
      <div
        id="print-area"
        className="bg-white rounded-2xl p-6 sm:p-8"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.4)', minHeight: '400px' }}
      >
        {renderContent()}
      </div>

    </div>
  );
}
