import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowUpNarrowWide,
  Check,
  CheckSquare,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  MinusCircle,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { ChecklistItem } from '../types';
import {
  getDayDiff,
  resetFullChecklistItems,
  saveFullChecklistItems,
} from '../utils/checklistStorage';
import { logChange } from '../utils/changeLogStorage';
import { useFullChecklistItems } from '../hooks/useSharedData';
import { consumeEditRequest } from '../utils/pageEditRequest';
import { useAuth } from '../auth/useAuth';

const ALL = '전체';

const statusConfig: Record<ChecklistItem['status'], {
  label: string;
  color: string;
  bg: string;
  icon: ReactNode;
}> = {
  done:       { label: '완료',   color: '#10b981', bg: 'rgba(16,185,129,0.08)',  icon: <CheckSquare size={14} /> },
  inprogress: { label: '진행중', color: '#3B82F6', bg: 'rgba(37, 99, 235,0.08)',   icon: <Clock size={14} /> },
  pending:    { label: '대기',   color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', icon: <MinusCircle size={14} /> },
  blocked:    { label: '차단',   color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   icon: <XCircle size={14} /> },
};

const priorityConfig: Record<ChecklistItem['priority'], { label: string; color: string }> = {
  high:   { label: '긴급', color: '#ef4444' },
  medium: { label: '보통', color: '#f59e0b' },
  low:    { label: '낮음', color: '#94a3b8' },
};

const STATUS_FILTERS: Array<{ key: 'all' | ChecklistItem['status']; label: string }> = [
  { key: 'all',        label: ALL },
  { key: 'done',       label: '완료' },
  { key: 'inprogress', label: '진행중' },
  { key: 'pending',    label: '대기' },
  { key: 'blocked',    label: '차단' },
];

const STATUS_OPTIONS: ChecklistItem['status'][] = ['done', 'inprogress', 'pending', 'blocked'];
const PRIORITY_OPTIONS: ChecklistItem['priority'][] = ['high', 'medium', 'low'];

type DdayBadge = { text: string; color: string; bg: string };

function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDdayBadge(diff: number, isDone: boolean): DdayBadge | null {
  if (isDone || diff > 7) return null;
  if (diff < 0) return { text: `D+${Math.abs(diff)}`, color: '#ef4444', bg: 'rgba(239,68,68,0.13)' };
  if (diff === 0) return { text: 'D-day', color: '#fb7185', bg: 'rgba(251,113,133,0.13)' };
  if (diff <= 3) return { text: `D-${diff}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.13)' };
  return { text: `D-${diff}`, color: '#3B82F6', bg: 'rgba(37, 99, 235,0.13)' };
}

function getUrgencyScore(diff: number, status: ChecklistItem['status']): number {
  if (status === 'done') return 9999;
  return diff;
}

export default function Checklist() {
  const sharedItems = useFullChecklistItems();
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>(sharedItems);

  const [filterCat, setFilterCat] = useState(ALL);
  const [filterStatus, setFilterStatus] = useState<'all' | ChecklistItem['status']>('all');
  const [filterAssignee, setFilterAssignee] = useState(ALL);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [sortByUrgency, setSortByUrgency] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const [editingItems, setEditingItems] = useState(false);
  const [editingCategories, setEditingCategories] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState<Array<{ original: string; name: string }>>([]);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editingItems) {
      const timer = window.setTimeout(() => setItems(sharedItems), 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [editingItems, sharedItems]);

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  const hasCustomStatuses = items.some(item => item.status !== 'pending');

  const catNames = useMemo(
    () => Array.from(new Set(items.map(c => c.category))).filter(Boolean),
    [items],
  );
  const allCats = [ALL, ...catNames];
  const assignees = [
    ALL,
    ...Array.from(new Set(items.map(c => c.assignee).filter(Boolean))).sort(),
  ];

  const baseFiltered = items.filter(item => {
    if (hideCompleted && item.status === 'done') return false;
    if (filterCat !== ALL && item.category !== filterCat) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (filterAssignee !== ALL && item.assignee !== filterAssignee) return false;
    return true;
  });

  const filtered = sortByUrgency
    ? [...baseFiltered].sort((a, b) =>
        getUrgencyScore(getDayDiff(a.dueDate), a.status) -
        getUrgencyScore(getDayDiff(b.dueDate), b.status)
      )
    : baseFiltered;

  const doneCount = items.filter(c => c.status === 'done').length;
  const total = items.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const catStats = catNames.map(cat => {
    const catItems = items.filter(c => c.category === cat);
    const done = catItems.filter(c => c.status === 'done').length;
    const hasBlocked = catItems.some(c => c.status === 'blocked');
    return { cat, total: catItems.length, done, hasBlocked };
  });

  const notDone = items.filter(c => c.status !== 'done');
  const overdueCount = notDone.filter(c => getDayDiff(c.dueDate) < 0).length;
  const urgentCount = notDone.filter(c => {
    const d = getDayDiff(c.dueDate);
    return d >= 0 && d <= 3;
  }).length;

  function showSavedToast() {
    setSavedToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setSavedToast(false), 2000);
  }

  function normalizeItem(item: ChecklistItem): ChecklistItem {
    return {
      ...item,
      category: item.category.trim() || '기타',
      title: item.title.trim() || '새 체크 항목',
      assignee: item.assignee.trim(),
      dueDate: item.dueDate.trim() || todayIso(),
      notes: item.notes?.trim() || undefined,
    };
  }

  function openItemEdit() {
    setItems(sharedItems.map(item => ({ ...item })));
    setOpenMenuId(null);
    setEditingItems(true);
  }

  useEffect(() => {
    if (!isAdmin || editingItems) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (consumeEditRequest('checklist', 'items')) openItemEdit();
  }, [editingItems, isAdmin, sharedItems]);

  function updateItem(id: string, patch: Partial<ChecklistItem>) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  }

  function addItem() {
    const category = filterCat !== ALL ? filterCat : catNames[0] ?? '기타';
    setItems(prev => [
      ...prev,
      {
        id: `ck_${Date.now()}`,
        category,
        title: '새 체크 항목',
        assignee: '',
        dueDate: todayIso(),
        status: 'pending',
        priority: 'medium',
      },
    ]);
  }

  function deleteItem(id: string) {
    setItems(prev => prev.filter(item => item.id !== id));
  }

  function saveItemEdit() {
    const normalized = items.map(normalizeItem);
    setItems(normalized);
    saveFullChecklistItems(normalized, '운영 체크리스트 내용 수정');
    setEditingItems(false);
    showSavedToast();
  }

  function openCategoryEdit() {
    setCategoryDraft(catNames.map(cat => ({ original: cat, name: cat })));
    setEditingCategories(true);
  }

  function saveCategoryEdit() {
    const renameMap = new Map(
      categoryDraft.map(cat => [cat.original, cat.name.trim() || cat.original]),
    );
    const updated = items.map(item => ({ ...item, category: renameMap.get(item.category) ?? item.category }));
    setItems(updated);
    saveFullChecklistItems(updated, '체크리스트 카테고리 수정');
    setFilterCat(ALL);
    setEditingCategories(false);
    showSavedToast();
  }

  function changeStatus(id: string, next: ChecklistItem['status']) {
    const target = items.find(item => item.id === id);
    const updated = items.map(item => item.id === id ? { ...item, status: next } : item);
    setItems(updated);
    setOpenMenuId(null);
    if (!editingItems) {
      saveFullChecklistItems(updated);
      showSavedToast();
      if (target) logChange('체크리스트', `${target.title} 상태를 ${statusConfig[next].label}로 변경`);
    }
  }

  function toggleHideCompleted() {
    setHideCompleted(prev => {
      if (!prev && filterStatus === 'done') setFilterStatus('all');
      return !prev;
    });
  }

  function handleReset() {
    if (!window.confirm(
      '저장된 체크리스트 상태와 편집 내용을 초기화할까요?\n변경 내용은 모두 삭제되고 기본값으로 복원됩니다.'
    )) return;
    resetFullChecklistItems();
    setItems(sharedItems);
    setEditingItems(false);
    setSavedToast(false);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }

  return (
    <div className="space-y-4">
      {openMenuId !== null && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} aria-hidden="true" />
      )}

      {savedToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 pointer-events-none"
          style={{
            background: 'rgba(16,185,129,0.22)',
            border: '1px solid rgba(16,185,129,0.45)',
            color: '#6ee7b7',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 14px rgba(31,95,217,0.35)',
          }}
          role="status"
          aria-live="polite"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
          저장됨
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#101A3D]">운영 체크리스트</h2>
          <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
            완료 {doneCount}/{total}건 · {pct}% 달성
            {hasCustomStatuses && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" title="변경된 상태가 저장되어 있습니다." />
            )}
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={editingItems ? saveItemEdit : openItemEdit}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={editingItems
                  ? { color: '#6ee7b7', background: 'rgba(16,185,129,0.16)', border: '1px solid rgba(16,185,129,0.35)' }
                  : { color: '#2563EB', background: 'rgba(37, 99, 235,0.12)', border: '1px solid rgba(37, 99, 235,0.3)' }
                }
              >
                {editingItems ? <Check size={12} /> : <Pencil size={12} />}
                {editingItems ? '항목 저장' : '항목 편집'}
              </button>
              <button
                type="button"
                onClick={editingCategories ? saveCategoryEdit : openCategoryEdit}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={editingCategories
                  ? { color: '#6ee7b7', background: 'rgba(16,185,129,0.16)', border: '1px solid rgba(16,185,129,0.35)' }
                  : { color: '#2563EB', background: 'rgba(37, 99, 235,0.12)', border: '1px solid rgba(37, 99, 235,0.3)' }
                }
              >
                {editingCategories ? <Check size={12} /> : <Pencil size={12} />}
                {editingCategories ? '카테고리 저장' : '카테고리 편집'}
              </button>
            </>
          )}

          <button
            onClick={handleReset}
            disabled={!hasCustomStatuses}
            title={hasCustomStatuses ? '저장된 상태와 편집 내용을 기본값으로 복원' : '변경된 상태가 없습니다'}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              hasCustomStatuses
                ? 'text-rose-400 hover:text-rose-300 active:scale-95'
                : 'text-slate-600 cursor-not-allowed opacity-30'
            }`}
            style={hasCustomStatuses ? {
              background: 'rgba(244,63,94,0.1)',
              border: '1px solid rgba(244,63,94,0.3)',
            } : {
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <RotateCcw size={11} />
            <span className="hidden sm:inline">저장 상태 초기화</span>
            <span className="sm:hidden">초기화</span>
          </button>
        </div>
      </div>

      {editingCategories && (
        <div
          className="rounded-2xl p-4 space-y-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(37, 99, 235,0.22)' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {categoryDraft.map((cat, index) => (
              <label
                key={cat.original}
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="w-16 text-[10px] text-slate-500 truncate">{cat.original}</span>
                <input
                  value={cat.name}
                  onChange={e => {
                    const next = [...categoryDraft];
                    next[index] = { ...cat, name: e.target.value };
                    setCategoryDraft(next);
                  }}
                  className="flex-1 min-w-0 bg-transparent text-xs text-[#101A3D] outline-none border-b border-white/10 focus:border-cyan-400 py-1"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 sm:p-5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-bold text-[#101A3D]">전체 진행률</span>
          <span className="text-xl font-black leading-none"
            style={{ color: pct === 100 ? '#10b981' : pct >= 50 ? '#3B82F6' : '#f59e0b' }}>
            {pct}%
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #3B82F6, #10b981)' }} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {STATUS_OPTIONS.map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusConfig[s].color }} />
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {statusConfig[s].label} {items.filter(c => c.status === s).length}
              </span>
            </div>
          ))}
        </div>

        {(overdueCount > 0 || urgentCount > 0) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 pt-2.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {overdueCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#ef4444' }}>
                <AlertTriangle size={10} className="flex-shrink-0" />
                마감 지남 {overdueCount}건
              </span>
            )}
            {urgentCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#f59e0b' }}>
                <AlertTriangle size={10} className="flex-shrink-0" />
                마감 임박 {urgentCount}건
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {catStats.map(({ cat, total: catTotal, done, hasBlocked }) => {
          const catPct = catTotal > 0 ? Math.round((done / catTotal) * 100) : 0;
          const isActive = filterCat === cat;
          const accentColor = hasBlocked ? '#ef4444' : catPct === 100 ? '#10b981' : '#3B82F6';
          return (
            <button
              key={cat}
              onClick={() => setFilterCat(isActive ? ALL : cat)}
              className="rounded-xl p-2.5 sm:p-3 text-left transition-all active:scale-95"
              style={{
                background: isActive ? `${accentColor}15` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? accentColor + '40' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              <div className="text-[10px] font-bold text-slate-400 truncate mb-1.5">{cat}</div>
              <div className="text-sm sm:text-base font-black leading-none mb-1.5" style={{ color: accentColor }}>
                {done}<span className="text-slate-600 font-normal text-xs">/{catTotal}</span>
              </div>
              <div className="h-1 rounded-full bg-white/10">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${catPct}%`, background: accentColor }} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {allCats.map(cat => {
            const isActive = filterCat === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isActive ? 'text-[#101A3D]' : 'text-slate-400 hover:text-slate-200'
                }`}
                style={isActive ? {
                  background: 'rgba(37, 99, 235,0.2)',
                  border: '1px solid rgba(37, 99, 235,0.4)',
                } : {
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          {STATUS_FILTERS.map(({ key, label }) => {
            const isActive = filterStatus === key;
            const sc = key !== 'all' ? statusConfig[key] : null;
            const count = key !== 'all' ? items.filter(c => c.status === key).length : null;
            const isDisabled = hideCompleted && key === 'done';
            return (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                disabled={isDisabled}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isDisabled
                    ? 'opacity-25 cursor-not-allowed'
                    : isActive
                    ? 'text-[#101A3D]'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                style={isActive && !isDisabled ? {
                  background: sc ? `${sc.color}20` : 'rgba(37, 99, 235,0.2)',
                  border: `1px solid ${sc ? sc.color + '45' : 'rgba(37, 99, 235,0.4)'}`,
                } : {
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {sc && (
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: isActive && !isDisabled ? sc.color : '#475569' }} />
                )}
                {label}
                {count !== null && <span className="text-[10px] text-slate-600">{count}</span>}
              </button>
            );
          })}

          <button
            onClick={toggleHideCompleted}
            className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 flex-shrink-0 ${
              hideCompleted ? 'text-[#101A3D]' : 'text-slate-500 hover:text-slate-300'
            }`}
            style={hideCompleted ? {
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.4)',
            } : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {hideCompleted ? <EyeOff size={11} className="flex-shrink-0" /> : <Eye size={11} className="flex-shrink-0" />}
            {hideCompleted ? '완료 숨김 중' : '완료 숨기기'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 flex-shrink-0">담당자</span>
          <select
            value={filterAssignee}
            onChange={e => setFilterAssignee(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs text-[#101A3D] outline-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {assignees.map(a => (
              <option key={a} value={a} style={{ background: '#F8FBFF' }}>{a}</option>
            ))}
          </select>
          {filterAssignee !== ALL && (
            <button onClick={() => setFilterAssignee(ALL)} className="text-[11px] text-slate-500 hover:text-cyan-400 transition-colors flex-shrink-0">
              초기화
            </button>
          )}

          <button
            onClick={() => setSortByUrgency(prev => !prev)}
            className={`ml-auto flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              sortByUrgency ? 'text-[#101A3D]' : 'text-slate-500 hover:text-slate-300'
            }`}
            style={sortByUrgency ? {
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)',
            } : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            title="마감일 기준으로 급한 항목 먼저 정렬"
          >
            <ArrowUpNarrowWide size={11} className="flex-shrink-0" />
            <span className="hidden sm:inline">긴급순</span>
            <span className="sm:hidden">D-day순</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="py-10 text-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm text-slate-600">해당하는 항목이 없습니다.</p>
          </div>
        )}

        {filtered.map(item => {
          const sc = statusConfig[item.status];
          const pc = priorityConfig[item.priority];
          const isDone = item.status === 'done';
          const isMenuOpen = openMenuId === item.id;
          const diff = getDayDiff(item.dueDate);
          const ddayBadge = getDdayBadge(diff, isDone);

          return (
            <div
              key={item.id}
              className={`rounded-xl transition-all ${isDone && !editingItems ? 'opacity-55' : ''}`}
              style={{
                background: sc.bg,
                border: `1px solid ${sc.color}25`,
                borderLeft: `3px solid ${sc.color}`,
              }}
            >
              <div className="p-3 sm:p-4">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0" style={{ color: sc.color }}>{sc.icon}</span>

                  <div className="flex-1 min-w-0">
                    {editingItems ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem_8rem_auto] gap-2">
                          <input
                            value={item.title}
                            onChange={e => updateItem(item.id, { title: e.target.value })}
                            className="bg-transparent outline-none text-sm font-bold text-[#101A3D] border-b border-white/10 focus:border-cyan-400 py-1 min-w-0"
                            placeholder="항목 제목"
                          />
                          <input
                            value={item.category}
                            onChange={e => updateItem(item.id, { category: e.target.value })}
                            className="bg-transparent outline-none text-xs text-slate-200 border-b border-white/10 focus:border-cyan-400 py-1"
                            placeholder="카테고리"
                          />
                          <input
                            type="date"
                            value={item.dueDate}
                            onChange={e => updateItem(item.id, { dueDate: e.target.value })}
                            className="bg-transparent outline-none text-xs text-slate-300 border-b border-white/10 focus:border-cyan-400 py-1"
                          />
                          <button
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            className="justify-self-start sm:justify-self-end w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            title="항목 삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            value={item.assignee}
                            onChange={e => updateItem(item.id, { assignee: e.target.value })}
                            className="bg-transparent outline-none text-xs text-slate-300 border-b border-white/10 focus:border-cyan-400 py-1"
                            placeholder="담당자"
                          />
                          <select
                            value={item.status}
                            onChange={e => updateItem(item.id, { status: e.target.value as ChecklistItem['status'] })}
                            className="bg-transparent outline-none text-xs text-slate-200 border-b border-white/10 focus:border-cyan-400 py-1"
                          >
                            {STATUS_OPTIONS.map(status => (
                              <option key={status} value={status} style={{ background: '#F8FBFF' }}>
                                {statusConfig[status].label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={item.priority}
                            onChange={e => updateItem(item.id, { priority: e.target.value as ChecklistItem['priority'] })}
                            className="bg-transparent outline-none text-xs text-slate-200 border-b border-white/10 focus:border-cyan-400 py-1"
                          >
                            {PRIORITY_OPTIONS.map(priority => (
                              <option key={priority} value={priority} style={{ background: '#F8FBFF' }}>
                                {priorityConfig[priority].label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          value={item.notes ?? ''}
                          onChange={e => updateItem(item.id, { notes: e.target.value })}
                          rows={2}
                          className="w-full bg-transparent outline-none text-xs text-slate-300 border border-white/10 focus:border-cyan-400 rounded-lg px-2 py-1.5 resize-none"
                          placeholder="특이사항 / 메모"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-2">
                          <span className={`text-sm font-semibold leading-snug flex-1 min-w-0 line-clamp-2 sm:line-clamp-1 ${
                            isDone ? 'line-through text-slate-500' : 'text-[#101A3D]'
                          }`}>
                            {item.title}
                          </span>

                          <div className="relative flex-shrink-0">
                            <button
                              onClick={e => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : item.id); }}
                              aria-label={`${item.title} 상태 변경`}
                              aria-expanded={isMenuOpen}
                              aria-haspopup="listbox"
                              className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold whitespace-nowrap transition-all hover:brightness-125 active:scale-95"
                              style={{ color: sc.color, background: `${sc.color}20`, border: `1px solid ${sc.color}35` }}
                            >
                              {sc.label}
                              <ChevronDown size={9} className={`transition-transform duration-150 ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isMenuOpen && (
                              <div
                                role="listbox"
                                aria-label="상태 선택"
                                className="absolute right-0 top-full mt-1.5 z-50 rounded-xl overflow-hidden py-1"
                                style={{
                                  background: 'var(--eum-modal-background)',
                                  border: '1px solid rgba(31,95,217,0.16)',
                                  boxShadow: '0 8px 28px rgba(31,95,217,0.18)',
                                  minWidth: '108px',
                                }}
                              >
                                {STATUS_OPTIONS.map(s => {
                                  const opt = statusConfig[s];
                                  const isCurrent = item.status === s;
                                  return (
                                    <button
                                      key={s}
                                      role="option"
                                      aria-selected={isCurrent}
                                      onClick={e => { e.stopPropagation(); changeStatus(item.id, s); }}
                                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors hover:bg-[#EAF3FF] ${isCurrent ? 'font-bold' : ''}`}
                                      style={{ color: isCurrent ? opt.color : '#94a3b8' }}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: opt.color }} />
                                      {opt.label}
                                      {isCurrent && <span className="ml-auto text-[10px] opacity-50">현재</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}>
                            {item.category}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                            style={{ color: pc.color, background: `${pc.color}15` }}>
                            {pc.label}
                          </span>
                          {ddayBadge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                              style={{ color: ddayBadge.color, background: ddayBadge.bg }}>
                              {ddayBadge.text}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                          <span className="text-[11px] sm:text-xs text-slate-500">{item.assignee || '담당자 미지정'}</span>
                          <span className="text-[11px] sm:text-xs text-slate-600">기한 {item.dueDate}</span>
                        </div>

                        {item.notes && (
                          <div className="flex items-start gap-1 mt-1.5">
                            <AlertTriangle size={10} className="text-amber-400 flex-shrink-0 mt-0.5" />
                            <span className="text-[11px] text-amber-400 line-clamp-1">{item.notes}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingItems && (
        <button
          type="button"
          onClick={addItem}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-cyan-200 hover:text-[#101A3D] transition-colors"
          style={{ background: 'rgba(37, 99, 235,0.08)', border: '1px dashed rgba(37, 99, 235,0.35)' }}
        >
          <Plus size={13} />
          체크 항목 추가
        </button>
      )}
    </div>
  );
}
