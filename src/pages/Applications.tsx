import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Link as LinkIcon,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import { churches } from '../data/mockData';
import { useApplications, useParticipants } from '../hooks/useSharedData';
import { parseParticipantsCSV } from '../utils/csvParser';
import { saveParticipants } from '../utils/participantStorage';
import {
  buildApplicationRecord,
  saveApplications,
  upsertApplications,
  type ApplicationRecord,
  type ApplicationSource,
} from '../utils/applicationsStorage';
import { findParticipantDuplicates } from '../utils/duplicateParticipants';
import { logChange } from '../utils/changeLogStorage';

const SHEET_URL_KEY = 'eum-camp:applications:sheet-url';
const SHEET_AUTO_SYNC_KEY = 'eum-camp:applications:auto-sync';

const sourceLabel: Record<ApplicationSource, string> = {
  'google-form': 'Google Forms',
  'naver-form': 'Naver Form',
  csv: 'CSV',
  manual: '수동',
};

const statusLabel: Record<ApplicationRecord['status'], string> = {
  pending: '검토 대기',
  approved: '명단 추가',
  rejected: '보류/반려',
};

const churchMap = Object.fromEntries(churches.map(c => [c.id, c.name]));
const churchNameToId = Object.fromEntries(
  churches.flatMap(c => [
    [c.name, c.id],
    [c.name.toLowerCase(), c.id],
  ]),
);

function getPublishedCsvUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.includes('/export?format=csv')) return trimmed;
  const match = trimmed.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!match) return trimmed;
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
}

function ApplicationCard({
  record,
  onApprove,
  onReject,
  onReopen,
}: {
  record: ApplicationRecord;
  onApprove: (record: ApplicationRecord) => void;
  onReject: (record: ApplicationRecord) => void;
  onReopen: (record: ApplicationRecord) => void;
}) {
  const p = record.participant;
  const duplicateTone =
    record.duplicateLevel === 'strong' ? '#ef4444' :
    record.duplicateLevel === 'possible' ? '#f59e0b' :
    '#10b981';

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${duplicateTone}30` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-[#101A3D]">{p.name}</h3>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ color: duplicateTone, background: `${duplicateTone}18` }}
            >
              {record.duplicateLevel === 'strong'
                ? '강한 중복 의심'
                : record.duplicateLevel === 'possible'
                  ? '중복 가능'
                  : '중복 없음'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
              {sourceLabel[record.source]}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {churchMap[p.church] ?? p.church} · {p.grade} · {p.gender === 'M' ? '남' : '여'}
          </p>
        </div>
        <span className="text-[11px] text-slate-500 whitespace-nowrap">
          {new Date(record.receivedAt).toLocaleString('ko-KR')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="rounded-xl px-3 py-2 bg-white/5 text-slate-300">본인 {p.phone || '-'}</div>
        <div className="rounded-xl px-3 py-2 bg-white/5 text-slate-300">보호자 {p.parentPhone || '-'}</div>
        <div className="rounded-xl px-3 py-2 bg-white/5 text-slate-300">
          식단 {p.dietType === 'allergy' ? `알레르기 ${p.allergies ?? ''}` : p.dietType}
        </div>
      </div>

      {record.duplicateReasons.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-amber-300">
          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
          <span>{record.duplicateReasons.join(', ')}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-white/5">
        <span className="text-xs text-slate-500">{statusLabel[record.status]}</span>
        {record.status === 'pending' ? (
          <div className="flex gap-2">
            <button
              onClick={() => onReject(record)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/25"
            >
              보류
            </button>
            <button
              onClick={() => onApprove(record)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-200 bg-emerald-500/15 border border-emerald-500/30"
            >
              명단에 추가
            </button>
          </div>
        ) : (
          <button
            onClick={() => onReopen(record)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[color:var(--eum-gold)] bg-cyan-500/10 border border-cyan-500/25"
          >
            다시 검토
          </button>
        )}
      </div>
    </div>
  );
}

export default function Applications() {
  const participants = useParticipants();
  const applications = useApplications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filter, setFilter] = useState<'pending' | 'all' | 'duplicates'>('pending');
  const [search, setSearch] = useState('');
  const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem(SHEET_URL_KEY) ?? '');
  const [autoSync, setAutoSync] = useState(() => localStorage.getItem(SHEET_AUTO_SYNC_KEY) === '1');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter(record => {
      if (filter === 'pending' && record.status !== 'pending') return false;
      if (filter === 'duplicates' && record.duplicateLevel === 'none') return false;
      if (!q) return true;
      const p = record.participant;
      return [
        p.name,
        churchMap[p.church] ?? p.church,
        p.phone,
        p.parentPhone,
      ].some(value => value.toLowerCase().includes(q));
    });
  }, [applications, filter, search]);

  const stats = useMemo(() => ({
    pending: applications.filter(record => record.status === 'pending').length,
    duplicates: applications.filter(record => record.duplicateLevel !== 'none').length,
    approved: applications.filter(record => record.status === 'approved').length,
    rejected: applications.filter(record => record.status === 'rejected').length,
  }), [applications]);

  const commitCsv = useCallback((text: string, source: ApplicationSource, notify = true) => {
    const result = parseParticipantsCSV(text, participants, churchNameToId);
    const records = result.rows
      .filter(row => !row.hasError)
      .map(row => buildApplicationRecord(row.data, participants, source));
    const next = upsertApplications(records);
    const addedCount = Math.max(0, next.length - applications.length);

    if (addedCount > 0) {
      saveApplications(next, `온라인 신청 ${addedCount}건을 대기함에 추가`);
    }

    if (notify) {
      setMessage(
        addedCount > 0
          ? `가져오기 완료: ${addedCount}건 추가, 오류 ${result.errorRows.length}건`
          : `새로 추가할 신청이 없습니다. 오류 ${result.errorRows.length}건`,
      );
    }
  }, [applications.length, participants]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result;
      if (typeof text === 'string') commitCsv(text, 'csv');
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }

  const fetchSheet = useCallback(async (notify = true) => {
    const url = getPublishedCsvUrl(sheetUrl);
    if (!url) return;
    if (notify) {
      setBusy(true);
      setMessage('');
    }
    try {
      localStorage.setItem(SHEET_URL_KEY, sheetUrl);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      commitCsv(await res.text(), 'google-form', notify);
    } catch {
      if (notify) {
        setMessage('Google Sheet CSV를 가져오지 못했습니다. 시트를 웹에 게시했는지 확인하세요.');
      }
    } finally {
      if (notify) setBusy(false);
    }
  }, [commitCsv, sheetUrl]);

  useEffect(() => {
    localStorage.setItem(SHEET_AUTO_SYNC_KEY, autoSync ? '1' : '0');
    if (!autoSync || !sheetUrl.trim()) return;

    const firstRun = window.setTimeout(() => {
      void fetchSheet(false);
    }, 0);
    const interval = window.setInterval(() => {
      void fetchSheet(false);
    }, 120000);

    return () => {
      window.clearTimeout(firstRun);
      window.clearInterval(interval);
    };
  }, [autoSync, fetchSheet, sheetUrl]);

  function updateRecord(record: ApplicationRecord, status: ApplicationRecord['status']) {
    const next = applications.map(item =>
      item.id === record.id
        ? { ...item, status, decidedAt: new Date().toISOString() }
        : item,
    );
    saveApplications(next, `${record.participant.name} 신청 상태를 ${statusLabel[status]}로 변경`);
  }

  function handleApprove(record: ApplicationRecord) {
    const matches = findParticipantDuplicates(record.participant, participants);
    if (matches.some(match => match.level === 'strong')) {
      const ok = window.confirm('강한 중복 의심 신청입니다. 그래도 명단에 추가할까요?');
      if (!ok) return;
    }
    saveParticipants([...participants, { ...record.participant, status: 'pending' }]);
    updateRecord(record, 'approved');
    logChange('신청 승인', `${record.participant.name} 신청을 참가자 명단에 추가`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-[#101A3D]">온라인 신청 대기함</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Google Forms·네이버폼·CSV 신청을 검토한 뒤 참가자 명단에 반영합니다.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 bg-white/5 border border-white/10"
          >
            <Download size={14} /> CSV 가져오기
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      <section className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2 text-sm font-bold text-[#101A3D]">
          <FileSpreadsheet size={16} className="text-emerald-400" />
          Google Forms 응답 시트 가져오기
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <LinkIcon size={14} className="text-slate-500 flex-shrink-0" />
            <input
              value={sheetUrl}
              onChange={e => setSheetUrl(e.target.value)}
              placeholder="Google Sheet 공유 URL 또는 CSV 게시 URL"
              className="w-full bg-transparent outline-none text-sm text-[#101A3D] placeholder-slate-500"
            />
          </div>
          <button
            onClick={() => void fetchSheet()}
            disabled={busy || !sheetUrl.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-[#101A3D] disabled:opacity-50"
            style={{ background: 'linear-gradient(90deg,#059669,#0d9488)' }}
          >
            <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
            동기화
          </button>
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-slate-300 select-none">
          <input
            type="checkbox"
            checked={autoSync}
            onChange={e => setAutoSync(e.target.checked)}
            className="accent-emerald-500"
          />
          2분마다 자동으로 Google Sheet 새 신청 가져오기
        </label>
        <p className="text-xs text-slate-500">
          Google Forms는 응답을 Google Sheet로 연결한 뒤, 시트를 CSV로 게시하면 이 대기함에서 바로 가져올 수 있습니다.
        </p>
      </section>

      {message && (
        <div className="rounded-xl px-4 py-3 text-xs text-[color:var(--eum-gold)] bg-cyan-500/10 border border-cyan-500/25">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '검토 대기', value: stats.pending, color: '#f59e0b' },
          { label: '중복 의심', value: stats.duplicates, color: '#ef4444' },
          { label: '명단 추가', value: stats.approved, color: '#10b981' },
          { label: '보류/반려', value: stats.rejected, color: '#94a3b8' },
        ].map(item => (
          <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}>
            <div className="text-2xl font-black" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="flex gap-1.5">
          {[
            ['pending', '검토 대기'],
            ['duplicates', '중복 의심'],
            ['all', '전체'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${filter === key ? 'text-[color:var(--eum-gold)] bg-cyan-500/15 border border-cyan-500/35' : 'text-slate-400 bg-white/5 border border-white/10'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
          <Search size={14} className="text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="이름, 교회, 연락처 검색"
            className="w-full bg-transparent outline-none text-sm text-[#101A3D] placeholder-slate-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white/[0.03] border border-white/[0.07]">
          <CheckCircle2 size={30} className="mx-auto text-emerald-400 mb-2" />
          <p className="text-sm text-slate-400">현재 조건에 맞는 신청이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map(record => (
            <ApplicationCard
              key={record.id}
              record={record}
              onApprove={handleApprove}
              onReject={item => updateRecord(item, 'rejected')}
              onReopen={item => updateRecord(item, 'pending')}
            />
          ))}
        </div>
      )}

      {stats.duplicates > 0 && (
        <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/25">
          <XCircle size={14} className="mt-0.5 flex-shrink-0" />
          중복 의심 신청은 명단에 추가하기 전에 이름, 교회, 연락처를 한 번 더 확인하세요.
        </div>
      )}
    </div>
  );
}
