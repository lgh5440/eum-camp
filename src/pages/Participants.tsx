import { useEffect, useState, useRef } from 'react';
import { Search, Users, AlertTriangle, UserPlus, Upload, Download } from 'lucide-react';
import { rooms } from '../data/mockData';
import type { Participant } from '../types';
import ParticipantDetailModal from '../components/ParticipantDetailModal';
import ParticipantFormModal from '../components/ParticipantFormModal';
import CsvImportModal from '../components/CsvImportModal';
import { saveParticipants } from '../utils/participantStorage';
import { useParticipants, useGroupMeta, useChurchConfig } from '../hooks/useSharedData';
import { parseParticipantsCSV, type CsvParseResult } from '../utils/csvParser';
import { participantsToCSV, downloadCSV, buildFilename } from '../utils/csvExport';
import { displayChurchName } from '../utils/churchIdentity';

const statusLabel: Record<Participant['status'], string> = {
  confirmed: '확정', pending: '대기', cancelled: '취소',
};
const statusColor: Record<Participant['status'], string> = {
  confirmed: '#10b981', pending: '#f59e0b', cancelled: '#ef4444',
};
const feeLabel: Record<Participant['fee'], string> = {
  paid: '완납', partial: '부분', unpaid: '미납',
};
const feeColor: Record<Participant['fee'], string> = {
  paid: '#10b981', partial: '#f59e0b', unpaid: '#ef4444',
};
const gradeOrder = ['중1','중2','중3','고1','고2','고3','교사'];

export default function Participants() {
  const sharedParticipants = useParticipants();
  const groups             = useGroupMeta();
  const churches           = useChurchConfig();
  const [participantList, setParticipantList] = useState<Participant[]>(sharedParticipants);
  const [search, setSearch]             = useState('');
  const [filterGender, setFilterGender] = useState<'all' | 'M' | 'F'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | Participant['status']>('all');
  const [filterFee, setFilterFee]       = useState<'all' | Participant['fee']>('all');
  const [filterGrade, setFilterGrade]   = useState('all');
  const [selected, setSelected]         = useState<Participant | null>(null);
  const [showForm, setShowForm]         = useState(false);
  const [editing, setEditing]           = useState<Participant | null>(null);
  const [csvResult, setCsvResult]       = useState<CsvParseResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setParticipantList(sharedParticipants), 0);
    return () => window.clearTimeout(timer);
  }, [sharedParticipants]);

  const churchMap     = Object.fromEntries(churches.map(c => [c.id, c.name]));
  const groupMap      = Object.fromEntries(groups.map(g => [g.id, g.name]));
  const roomMap       = Object.fromEntries(rooms.map(r => [r.id, r.name]));
  // 교회명 → ID (CSV 파서용 역방향 맵)
  const churchNameToId = Object.fromEntries(
    churches.flatMap(c => [
      [c.name, c.id],
      [c.name.toLowerCase(), c.id],
    ])
  );

  const filtered = participantList.filter(p => {
    if (search && !p.name.includes(search) && !churchMap[p.church]?.includes(search)) return false;
    if (filterGender !== 'all' && p.gender !== filterGender) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterFee !== 'all' && p.fee !== filterFee) return false;
    if (filterGrade !== 'all' && p.grade !== filterGrade) return false;
    return true;
  });

  function handleFormSubmit(p: Participant) {
    if (editing) {
      // 수정 모드: id 일치 항목 교체
      const updated = participantList.map(x => x.id === p.id ? p : x);
      setParticipantList(updated);
      saveParticipants(updated);
      setEditing(null);
    } else {
      // 추가 모드: 목록 끝에 삽입
      const updated = [...participantList, p];
      setParticipantList(updated);
      saveParticipants(updated);
      setShowForm(false);
    }
  }

  function handleExport(scope: 'filtered' | 'all') {
    const list = scope === 'filtered' ? filtered : participantList;
    const csv  = participantsToCSV(list, { churchMap, groupMap, roomMap });
    const suffix = scope === 'filtered' && filtered.length < participantList.length ? '-filtered' : '';
    downloadCSV(csv, buildFilename(`eum-camp-participants${suffix}`));
  }

  function handleCsvFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';   // 같은 파일 재선택 허용

    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result;
      if (typeof text !== 'string') return;
      const result = parseParticipantsCSV(text, participantList, churchNameToId);
      setCsvResult(result);
    };
    reader.readAsText(file, 'UTF-8');
  }

  function handleCsvConfirm(toAdd: Participant[]) {
    if (toAdd.length === 0) { setCsvResult(null); return; }
    const updated = [...participantList, ...toAdd];
    setParticipantList(updated);
    saveParticipants(updated);
    setCsvResult(null);
  }

  function handleEditRequest(p: Participant) {
    setSelected(null);   // 상세 모달 닫기
    setEditing(p);       // 수정 폼 열기
  }

  function handleDelete(id: string) {
    const target = participantList.find(x => x.id === id);
    const name = target?.name ?? '이 참가자';
    if (!window.confirm(`${name}님을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    const updated = participantList.filter(x => x.id !== id);
    setParticipantList(updated);
    saveParticipants(updated);
    setSelected(null);
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-[#101A3D]">참가자 관리</h2>
          <p className="text-sm text-slate-400 mt-0.5">총 {participantList.length}명 · 표시 {filtered.length}명</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(31,95,217,0.10)', border: '1px solid rgba(47,115,242,0.28)' }}
          >
            <Users size={14} className="text-[color:var(--eum-gold)]" />
            <span className="text-sm text-[color:var(--eum-gold)] font-bold">
              {participantList.filter(p => p.status === 'confirmed').length}명 확정
            </span>
          </div>

          {/* CSV 내보내기 버튼 (필터 적용 시 분기 메뉴, 없으면 전체 즉시 다운로드) */}
          {filtered.length < participantList.length ? (
            /* 필터 적용 중 → 드롭다운 없이 두 버튼으로 분기 */
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleExport('filtered')}
                title={`필터된 ${filtered.length}명 내보내기`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-l-xl text-sm font-medium transition-all active:scale-95"
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.22)',
                  color: '#34d399',
                }}
              >
                <Download size={14} />
                <span className="hidden sm:inline">필터 내보내기</span>
                <span className="sm:hidden">필터</span>
              </button>
              <button
                onClick={() => handleExport('all')}
                title={`전체 ${participantList.length}명 내보내기`}
                className="flex items-center gap-1 px-2.5 py-2 rounded-r-xl text-xs font-medium transition-all active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderLeft: 'none',
                  color: '#64748b',
                }}
              >
                전체
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleExport('all')}
              title={`전체 ${participantList.length}명 CSV 내보내기`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#94a3b8',
              }}
            >
              <Download size={14} />
              <span className="hidden sm:inline">CSV 내보내기</span>
              <span className="sm:hidden">내보내기</span>
            </button>
          )}

          {/* CSV 가져오기 버튼 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#94a3b8',
            }}
          >
            <Upload size={14} />
            <span className="hidden sm:inline">CSV 가져오기</span>
            <span className="sm:hidden">가져오기</span>
          </button>

          {/* 참가자 추가 버튼 */}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#101A3D] transition-all active:scale-95"
            style={{
              background: 'linear-gradient(90deg, #1B3A5C, #93C5FD)',
              boxShadow: '0 4px 14px rgba(37, 99, 235,0.35)',
            }}
          >
            <UserPlus size={14} />
            <span className="hidden sm:inline">참가자 추가</span>
            <span className="sm:hidden">추가</span>
          </button>

          {/* hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvFileChange}
          />
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '알레르기', count: participantList.filter(p => p.dietType === 'allergy').length,    color: '#f59e0b', icon: '⚠️' },
          { label: '채식',     count: participantList.filter(p => p.dietType === 'vegetarian').length, color: '#10b981', icon: '🌿' },
          { label: '미납',     count: participantList.filter(p => p.fee === 'unpaid').length,          color: '#ef4444', icon: '💳' },
          { label: '확인 필요',count: participantList.filter(p => p.status === 'pending').length,      color: '#8b5cf6', icon: '❓' },
        ].map(item => (
          <div
            key={item.label}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: `${item.color}10`, border: `1px solid ${item.color}25` }}
          >
            <span className="text-xl">{item.icon}</span>
            <div>
              <div className="text-xs text-slate-400">{item.label}</div>
              <div className="text-lg font-bold" style={{ color: item.color }}>{item.count}명</div>
            </div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div
        className="flex flex-wrap gap-2 p-3 sm:p-4 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="flex items-center gap-2 w-full sm:flex-1 sm:min-w-48 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Search size={14} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="이름 또는 교회 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-[#101A3D] placeholder-slate-500 outline-none w-full"
          />
        </div>

        {[
          {
            value: filterGender, onChange: (v: string) => setFilterGender(v as typeof filterGender),
            options: [['all','전체'], ['M','남'], ['F','여']] as [string,string][],
          },
          {
            value: filterStatus, onChange: (v: string) => setFilterStatus(v as typeof filterStatus),
            options: [['all','전체 상태'], ['confirmed','확정'], ['pending','대기'], ['cancelled','취소']] as [string,string][],
          },
          {
            value: filterFee, onChange: (v: string) => setFilterFee(v as typeof filterFee),
            options: [['all','전체 납부'], ['paid','완납'], ['partial','부분납'], ['unpaid','미납']] as [string,string][],
          },
          {
            value: filterGrade, onChange: setFilterGrade,
            options: [['all','전체 학년'], ...gradeOrder.map(g => [g,g])] as [string,string][],
          },
        ].map((filter, idx) => (
          <select
            key={idx}
            value={filter.value}
            onChange={e => filter.onChange(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm text-[#101A3D] outline-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {filter.options.map(([val, label]) => (
              <option key={val} value={val} style={{ background: '#F8FBFF' }}>{label}</option>
            ))}
          </select>
        ))}
      </div>

      {/* 테이블 */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-slate-400 whitespace-nowrap w-12">#</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 whitespace-nowrap">이름</th>
                <th className="hidden sm:table-cell px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 whitespace-nowrap">교회</th>
                <th className="hidden sm:table-cell px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 whitespace-nowrap">학년</th>
                <th className="hidden md:table-cell px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 whitespace-nowrap">성별</th>
                <th className="hidden md:table-cell px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 whitespace-nowrap">연락처</th>
                <th className="hidden md:table-cell px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 whitespace-nowrap">식단</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 whitespace-nowrap">상태</th>
                <th className="hidden sm:table-cell px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 whitespace-nowrap">참가비</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr
                  key={p.id}
                  className="transition-colors hover:bg-white/5 cursor-pointer"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onClick={() => setSelected(p)}
                  title={`${p.name} 상세 보기`}
                >
                  <td className="px-2 sm:px-3 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">{idx + 1}</td>
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: p.gender === 'M' ? 'rgba(59,130,246,0.2)' : 'rgba(236,72,153,0.2)',
                          color: p.gender === 'M' ? '#60a5fa' : '#f472b6',
                        }}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-[#101A3D] whitespace-nowrap">{p.name}</span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-3 sm:px-4 py-3 text-sm text-slate-300 whitespace-nowrap max-w-[160px] truncate">
                    {displayChurchName(p.church, churchMap)}
                  </td>
                  <td className="hidden sm:table-cell px-3 sm:px-4 py-3 text-sm text-slate-300">{p.grade}</td>
                  <td className="hidden md:table-cell px-3 sm:px-4 py-3">
                    <span className={`text-xs font-medium ${p.gender === 'M' ? 'text-blue-400' : 'text-pink-400'}`}>
                      {p.gender === 'M' ? '남' : '여'}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-3 sm:px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{p.phone}</td>
                  <td className="hidden md:table-cell px-3 sm:px-4 py-3">
                    {p.dietType !== 'normal' ? (
                      <div className="flex items-center gap-1">
                        <AlertTriangle
                          size={12}
                          className={`flex-shrink-0 ${p.dietType === 'allergy' ? 'text-amber-400' : 'text-green-400'}`}
                        />
                        <span className={`text-xs ${p.dietType === 'allergy' ? 'text-amber-400' : 'text-green-400'}`}>
                          {p.dietType === 'allergy' ? '알레르기' : '채식'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">일반</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                      style={{ color: statusColor[p.status], background: `${statusColor[p.status]}20` }}
                    >
                      {statusLabel[p.status]}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-3 sm:px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                      style={{ color: feeColor[p.fee], background: `${feeColor[p.fee]}20` }}
                    >
                      {feeLabel[p.fee]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-sm">검색 결과가 없습니다.</div>
        )}
      </div>

      {selected && !editing && (
        <ParticipantDetailModal
          participant={selected}
          onClose={() => setSelected(null)}
          onEdit={handleEditRequest}
          onDelete={handleDelete}
        />
      )}

      {showForm && !editing && (
        <ParticipantFormModal
          mode="create"
          onSubmit={handleFormSubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      {editing && (
        <ParticipantFormModal
          mode="edit"
          initialValue={editing}
          onSubmit={handleFormSubmit}
          onClose={() => setEditing(null)}
        />
      )}

      {csvResult && (
        <CsvImportModal
          result={csvResult}
          churchMap={churchMap}
          onConfirm={handleCsvConfirm}
          onClose={() => setCsvResult(null)}
        />
      )}
    </div>
  );
}
