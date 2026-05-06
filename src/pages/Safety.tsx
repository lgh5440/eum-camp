import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Pencil,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import type { SafetyItem } from '../types';
import { useParticipants, useSafetyItems } from '../hooks/useSharedData';
import { saveSafetyItems } from '../utils/safetyStorage';
import { consumeEditRequest } from '../utils/pageEditRequest';
import { useAuth } from '../auth/useAuth';

const statusConfig: Record<SafetyItem['status'], { label: string; color: string; icon: React.ReactNode }> = {
  normal:  { label: '정상',      color: '#10b981', icon: <ShieldCheck size={15} /> },
  caution: { label: '주의 필요', color: '#f59e0b', icon: <AlertTriangle size={15} /> },
  danger:  { label: '위험',      color: '#ef4444', icon: <ShieldAlert size={15} /> },
};

const STATUS_OPTIONS: SafetyItem['status'][] = ['normal', 'caution', 'danger'];

function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function Safety() {
  const safetyItems = useSafetyItems();
  const participants = useParticipants();
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<SafetyItem[]>(safetyItems);
  const [editingItems, setEditingItems] = useState(false);
  const [editingCategories, setEditingCategories] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState<Array<{ original: string; name: string }>>([]);

  useEffect(() => {
    if (!editingItems) {
      const timer = window.setTimeout(() => setItems(safetyItems), 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [editingItems, safetyItems]);

  const allergies = participants.filter(p => p.dietType === 'allergy');
  const categories = useMemo(
    () => Array.from(new Set(items.map(s => s.category))).filter(Boolean),
    [items],
  );

  const normalCount = items.filter(s => s.status === 'normal').length;
  const cautionCount = items.filter(s => s.status === 'caution').length;
  const dangerCount = items.filter(s => s.status === 'danger').length;

  function openItemEdit() {
    setItems(safetyItems.map(item => ({ ...item })));
    setEditingItems(true);
  }

  useEffect(() => {
    if (!isAdmin || editingItems) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (consumeEditRequest('safety', 'items')) openItemEdit();
  }, [editingItems, isAdmin, safetyItems]);

  function updateItem(id: string, patch: Partial<SafetyItem>) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  }

  function addItem() {
    const category = categories[0] ?? '기타';
    setItems(prev => [
      ...prev,
      {
        id: `sf_${Date.now()}`,
        category,
        description: '새 안전 점검 항목',
        responsible: '',
        status: 'normal',
        lastChecked: todayIso(),
      },
    ]);
  }

  function deleteItem(id: string) {
    setItems(prev => prev.filter(item => item.id !== id));
  }

  function saveItemEdit() {
    const normalized = items.map(item => ({
      ...item,
      category: item.category.trim() || '기타',
      description: item.description.trim() || '새 안전 점검 항목',
      responsible: item.responsible.trim(),
      lastChecked: item.lastChecked.trim() || todayIso(),
    }));
    saveSafetyItems(normalized);
    setItems(normalized);
    setEditingItems(false);
  }

  function openCategoryEdit() {
    setCategoryDraft(categories.map(category => ({ original: category, name: category })));
    setEditingCategories(true);
  }

  function saveCategoryEdit() {
    const renameMap = new Map(
      categoryDraft.map(category => [category.original, category.name.trim() || category.original]),
    );
    const updated = items.map(item => ({
      ...item,
      category: renameMap.get(item.category) ?? item.category,
    }));
    setItems(updated);
    saveSafetyItems(updated);
    setEditingCategories(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">안전 관리</h2>
          <p className="text-sm text-slate-400 mt-0.5">현장 안전 체크 및 응급 대응</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={editingItems ? saveItemEdit : openItemEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={editingItems
                ? { color: '#6ee7b7', background: 'rgba(16,185,129,0.16)', border: '1px solid rgba(16,185,129,0.35)' }
                : { color: '#67e8f9', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)' }
              }
            >
              {editingItems ? <Check size={12} /> : <Pencil size={12} />}
              {editingItems ? '항목 저장' : '항목 편집'}
            </button>
            <button
              type="button"
              onClick={editingCategories ? saveCategoryEdit : openCategoryEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={editingCategories
                ? { color: '#6ee7b7', background: 'rgba(16,185,129,0.16)', border: '1px solid rgba(16,185,129,0.35)' }
                : { color: '#67e8f9', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)' }
              }
            >
              {editingCategories ? <Check size={12} /> : <Pencil size={12} />}
              {editingCategories ? '카테고리 저장' : '카테고리 편집'}
            </button>
          </div>
        )}
      </div>

      {editingCategories && (
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(6,182,212,0.22)' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {categoryDraft.map((category, index) => (
              <label
                key={category.original}
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="w-20 text-[10px] text-slate-500 truncate">{category.original}</span>
                <input
                  value={category.name}
                  onChange={e => {
                    const next = [...categoryDraft];
                    next[index] = { ...category, name: e.target.value };
                    setCategoryDraft(next);
                  }}
                  className="flex-1 min-w-0 bg-transparent text-xs text-white outline-none border-b border-white/10 focus:border-cyan-400 py-1"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: '정상', count: normalCount, color: '#10b981', icon: <ShieldCheck size={18} /> },
          { label: '주의', count: cautionCount, color: '#f59e0b', icon: <AlertTriangle size={18} /> },
          { label: '위험', count: dangerCount, color: '#ef4444', icon: <ShieldAlert size={18} /> },
        ].map(item => (
          <div key={item.label} className="rounded-2xl p-3 sm:p-5 flex items-center gap-2 sm:gap-4"
            style={{ background: `${item.color}10`, border: `1px solid ${item.color}25` }}>
            <div className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center flex-shrink-0"
              style={{ background: `${item.color}20`, color: item.color }}>
              {item.icon}
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black" style={{ color: item.color }}>{item.count}</div>
              <div className="text-[10px] sm:text-xs text-slate-400">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {categories.map(cat => (
        <div key={cat}>
          <h3 className="text-sm font-bold text-cyan-300 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
            {cat}
          </h3>
          <div className="space-y-2">
            {items.filter(s => s.category === cat).map(item => {
              const sc = statusConfig[item.status];
              return (
                <div key={item.id} className="flex items-start gap-3 p-3 sm:p-4 rounded-xl"
                  style={{
                    background: item.status !== 'normal' ? `${sc.color}08` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${item.status !== 'normal' ? sc.color + '25' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  <span className="mt-0.5 flex-shrink-0" style={{ color: sc.color }}>{sc.icon}</span>
                  <div className="flex-1 min-w-0">
                    {editingItems ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem_8rem_auto] gap-2">
                          <input
                            value={item.description}
                            onChange={e => updateItem(item.id, { description: e.target.value })}
                            className="bg-transparent outline-none text-sm text-white border-b border-white/10 focus:border-cyan-400 py-1 min-w-0"
                            placeholder="점검 내용"
                          />
                          <select
                            value={item.status}
                            onChange={e => updateItem(item.id, { status: e.target.value as SafetyItem['status'] })}
                            className="bg-transparent outline-none text-xs text-slate-200 border-b border-white/10 focus:border-cyan-400 py-1"
                          >
                            {STATUS_OPTIONS.map(status => (
                              <option key={status} value={status} style={{ background: '#0a1628' }}>
                                {statusConfig[status].label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="date"
                            value={item.lastChecked}
                            onChange={e => updateItem(item.id, { lastChecked: e.target.value })}
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            value={item.category}
                            onChange={e => updateItem(item.id, { category: e.target.value })}
                            className="bg-transparent outline-none text-xs text-slate-300 border-b border-white/10 focus:border-cyan-400 py-1"
                            placeholder="카테고리"
                          />
                          <input
                            value={item.responsible}
                            onChange={e => updateItem(item.id, { responsible: e.target.value })}
                            className="bg-transparent outline-none text-xs text-slate-300 border-b border-white/10 focus:border-cyan-400 py-1"
                            placeholder="담당자"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm text-white leading-snug">{item.description}</div>
                        <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap gap-x-2">
                          <span>담당: {item.responsible || '-'}</span>
                          <span>최종 확인: {item.lastChecked}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {!editingItems && (
                    <span className="text-xs px-2 sm:px-2.5 py-1 rounded-full font-medium flex-shrink-0 whitespace-nowrap"
                      style={{ color: sc.color, background: `${sc.color}15` }}>
                      {sc.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {editingItems && (
        <button
          type="button"
          onClick={addItem}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-cyan-200 hover:text-white transition-colors"
          style={{ background: 'rgba(6,182,212,0.08)', border: '1px dashed rgba(6,182,212,0.35)' }}
        >
          <Plus size={13} />
          안전 점검 항목 추가
        </button>
      )}

      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="px-5 py-4 flex items-center gap-2"
          style={{ borderBottom: '1px solid rgba(245,158,11,0.15)' }}>
          <AlertTriangle size={16} className="text-amber-400" />
          <h3 className="text-sm font-bold text-amber-300">알레르기 보유 참가자 ({allergies.length}명)</h3>
        </div>
        <div className="p-4 space-y-2">
          {allergies.length === 0 ? (
            <div className="py-5 text-center text-sm text-slate-500">알레르기 등록 인원이 없습니다.</div>
          ) : allergies.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                {p.name.charAt(0)}
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-white">{p.name}</span>
                <span className="text-xs text-slate-400 ml-2">{p.grade}</span>
              </div>
              <span className="text-xs text-amber-300 font-medium">{p.allergies}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
