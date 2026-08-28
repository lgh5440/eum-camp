import { useEffect, useState } from 'react';
import { Check, MapPin, Mic, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Schedule } from '../types';
import { useScheduleCategoryConfig, useScheduleItems } from '../hooks/useSharedData';
import { useAuth } from '../auth/useAuth';
import { saveScheduleItems } from '../utils/scheduleStorage';
import {
  DEFAULT_SCHEDULE_CATEGORY_CONFIG,
  saveScheduleCategoryConfig,
  type ScheduleCategoryConfig,
} from '../utils/categoryConfigStorage';
import { consumeEditRequest } from '../utils/pageEditRequest';

const dayLabels = ['', '1일차 (7/26 주일)', '2일차 (7/27 월)', '3일차 (7/28 화)'];

export default function SchedulePage() {
  const schedules = useScheduleItems();
  const categoryConfig = useScheduleCategoryConfig();
  const { isAdmin } = useAuth();
  const [activeDay, setActiveDay] = useState(1);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState<Schedule[]>([]);
  const [editingCategories, setEditingCategories] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState<ScheduleCategoryConfig[]>([]);
  const categoryStyle = Object.fromEntries(
    categoryConfig.map(cat => [
      cat.key,
      { ...cat, bg: `${cat.color}26` },
    ]),
  ) as Record<Schedule['category'], ScheduleCategoryConfig & { bg: string }>;
  const scheduleSource = editingSchedule ? scheduleDraft : schedules;
  const filtered = scheduleSource
    .filter(s => s.day === activeDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  function openScheduleEdit() {
    setScheduleDraft(schedules.map(item => ({ ...item })));
    setEditingSchedule(true);
  }

  useEffect(() => {
    if (!isAdmin || editingSchedule) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (consumeEditRequest('schedule', 'schedule')) openScheduleEdit();
  }, [editingSchedule, isAdmin, schedules]);

  function updateScheduleItem(id: string, patch: Partial<Schedule>) {
    setScheduleDraft(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  }

  function addScheduleItem() {
    const defaultCategory = categoryConfig[0]?.key ?? 'program';
    const newItem: Schedule = {
      id: `s_${Date.now()}`,
      day: activeDay,
      time: '00:00',
      title: '새 일정',
      location: '',
      category: defaultCategory,
    };
    setScheduleDraft(prev => [...prev, newItem]);
  }

  function deleteScheduleItem(id: string) {
    setScheduleDraft(prev => prev.filter(item => item.id !== id));
  }

  function saveScheduleEdit() {
    const normalized = scheduleDraft
      .map(item => ({
        ...item,
        time: item.time.trim() || '00:00',
        title: item.title.trim() || '새 일정',
        location: item.location.trim(),
        speaker: item.speaker?.trim() || undefined,
        notes: item.notes?.trim() || undefined,
      }))
      .sort((a, b) => a.day !== b.day ? a.day - b.day : a.time.localeCompare(b.time));
    saveScheduleItems(normalized);
    setEditingSchedule(false);
  }

  function openCategoryEdit() {
    setCategoryDraft(categoryConfig.map(cat => ({ ...cat })));
    setEditingCategories(true);
  }

  function saveCategoryEdit() {
    const next = categoryDraft.map(cat => ({
      ...cat,
      label: cat.label.trim() || DEFAULT_SCHEDULE_CATEGORY_CONFIG.find(base => base.key === cat.key)?.label || cat.key,
      icon: cat.icon.trim() || DEFAULT_SCHEDULE_CATEGORY_CONFIG.find(base => base.key === cat.key)?.icon || '•',
    }));
    saveScheduleCategoryConfig(next);
    setEditingCategories(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1B3A5C]">일정 관리</h2>
          <p className="text-sm text-slate-400 mt-0.5">전체 3일 프로그램 일정</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={editingSchedule ? saveScheduleEdit : openScheduleEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={editingSchedule
                ? { color: '#6ee7b7', background: 'rgba(16,185,129,0.16)', border: '1px solid rgba(16,185,129,0.35)' }
                : { color: '#2563EB', background: 'rgba(37, 99, 235,0.12)', border: '1px solid rgba(37, 99, 235,0.3)' }
              }
            >
              {editingSchedule ? <Check size={13} /> : <Pencil size={13} />}
              {editingSchedule ? '일정 저장' : '일정 편집'}
            </button>
            <button
              type="button"
              onClick={editingCategories ? saveCategoryEdit : openCategoryEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={editingCategories
                ? { color: '#6ee7b7', background: 'rgba(16,185,129,0.16)', border: '1px solid rgba(16,185,129,0.35)' }
                : { color: '#2563EB', background: 'rgba(37, 99, 235,0.12)', border: '1px solid rgba(37, 99, 235,0.3)' }
              }
            >
              {editingCategories ? <Check size={13} /> : <Pencil size={13} />}
              {editingCategories ? '카테고리 저장' : '카테고리 편집'}
            </button>
          </div>
        )}
      </div>

      {editingCategories && (
        <div
          className="rounded-2xl p-4 space-y-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(37, 99, 235,0.22)' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {categoryDraft.map((cat, index) => (
              <div
                key={cat.key}
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: `${cat.color}12`, border: `1px solid ${cat.color}30` }}
              >
                <input
                  value={cat.icon}
                  onChange={e => {
                    const next = [...categoryDraft];
                    next[index] = { ...cat, icon: e.target.value };
                    setCategoryDraft(next);
                  }}
                  className="w-10 bg-transparent text-center text-sm outline-none border-b border-white/10 focus:border-cyan-400"
                  aria-label={`${cat.label} 아이콘`}
                />
                <input
                  value={cat.label}
                  onChange={e => {
                    const next = [...categoryDraft];
                    next[index] = { ...cat, label: e.target.value };
                    setCategoryDraft(next);
                  }}
                  className="flex-1 min-w-0 bg-transparent text-xs text-[#1B3A5C] outline-none border-b border-white/10 focus:border-cyan-400 py-1"
                  aria-label={`${cat.key} 라벨`}
                />
                <input
                  type="color"
                  value={cat.color}
                  onChange={e => {
                    const next = [...categoryDraft];
                    next[index] = { ...cat, color: e.target.value };
                    setCategoryDraft(next);
                  }}
                  className="w-8 h-7 rounded-lg bg-transparent cursor-pointer"
                  aria-label={`${cat.label} 색상`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className="flex flex-wrap gap-2">
        {categoryConfig.map(val => (
          <span key={val.key} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl"
            style={{ background: `${val.color}26`, color: val.color, border: `1px solid ${val.color}30` }}>
            <span>{val.icon}</span>
            <span>{val.label}</span>
          </span>
        ))}
      </div>

      {/* 탭 */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3].map(day => (
          <button key={day} onClick={() => setActiveDay(day)}
            className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex-1 sm:flex-none min-w-0 ${
              activeDay === day
                ? 'text-[#1B3A5C]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            style={activeDay === day ? {
              background: 'linear-gradient(90deg, rgba(37, 99, 235,0.25), rgba(37,99,235,0.2))',
              border: '1px solid rgba(37, 99, 235,0.4)',
              boxShadow: '0 0 12px rgba(37, 99, 235,0.2)',
            } : {
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
            {dayLabels[day]}
          </button>
        ))}
      </div>

      {/* 타임라인 */}
      <div className="relative pl-2 sm:pl-4">
        {/* 세로선: 모바일 left-8, 데스크탑 left-10 */}
        <div className="absolute left-8 sm:left-10 top-0 bottom-0 w-px"
          style={{ background: 'linear-gradient(180deg, rgba(37, 99, 235,0.5), rgba(37,99,235,0.2))' }} />

        <div className="space-y-3">
          {filtered.map((item) => {
            const style = categoryStyle[item.category] ?? {
              label: item.category,
              color: '#94a3b8',
              bg: 'rgba(148,163,184,0.15)',
              icon: '•',
            };
            return (
              <div key={item.id} className="flex gap-2 sm:gap-4 relative">
                {/* 시간 */}
                <div className="w-12 sm:w-14 flex-shrink-0 text-right pt-1">
                  <span className="text-[11px] sm:text-xs font-bold text-cyan-300 leading-tight">{item.time}</span>
                </div>
                {/* 타임라인 점 */}
                <div className="flex-shrink-0 w-4 flex items-start justify-center mt-1.5 relative z-10">
                  <div className="w-3 h-3 rounded-full border-2"
                    style={{ borderColor: style.color, background: '#0a1628', boxShadow: `0 0 8px ${style.color}60` }} />
                </div>
                {/* 카드 */}
                <div className="flex-1 min-w-0 p-3 sm:p-4 rounded-xl mb-1"
                  style={{ background: style.bg, border: `1px solid ${style.color}25` }}>
                  {editingSchedule ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-[5rem_1fr_8rem_auto] gap-2">
                        <input
                          value={item.time}
                          onChange={e => updateScheduleItem(item.id, { time: e.target.value })}
                          className="bg-transparent outline-none text-xs font-bold text-cyan-200 border-b border-white/10 focus:border-cyan-400 py-1"
                          placeholder="시간"
                        />
                        <input
                          value={item.title}
                          onChange={e => updateScheduleItem(item.id, { title: e.target.value })}
                          className="bg-transparent outline-none text-sm font-bold text-[#1B3A5C] border-b border-white/10 focus:border-cyan-400 py-1 min-w-0"
                          placeholder="일정 제목"
                        />
                        <select
                          value={item.category}
                          onChange={e => updateScheduleItem(item.id, { category: e.target.value as Schedule['category'] })}
                          className="bg-transparent outline-none text-xs text-slate-200 border-b border-white/10 focus:border-cyan-400 py-1"
                        >
                          {categoryConfig.map(category => (
                            <option key={category.key} value={category.key} style={{ background: '#0a1628' }}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => deleteScheduleItem(item.id)}
                          className="justify-self-start sm:justify-self-end w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          title="일정 삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          value={item.location}
                          onChange={e => updateScheduleItem(item.id, { location: e.target.value })}
                          className="bg-transparent outline-none text-xs text-slate-300 border-b border-white/10 focus:border-cyan-400 py-1"
                          placeholder="장소"
                        />
                        <input
                          value={item.speaker ?? ''}
                          onChange={e => updateScheduleItem(item.id, { speaker: e.target.value })}
                          className="bg-transparent outline-none text-xs text-slate-300 border-b border-white/10 focus:border-cyan-400 py-1"
                          placeholder="강사/담당"
                        />
                      </div>
                      <textarea
                        value={item.notes ?? ''}
                        onChange={e => updateScheduleItem(item.id, { notes: e.target.value })}
                        rows={2}
                        className="w-full bg-transparent outline-none text-xs text-slate-300 border border-white/10 focus:border-cyan-400 rounded-lg px-2 py-1.5 resize-none"
                        placeholder="세부 내용 / 메모"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="flex-shrink-0 text-sm">{style.icon}</span>
                          <span className="text-sm font-bold text-[#1B3A5C] leading-snug">{item.title}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
                          style={{ background: `${style.color}25`, color: style.color }}>
                          {style.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin size={11} className="flex-shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </span>
                        {item.speaker && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Mic size={11} className="flex-shrink-0" /> {item.speaker}
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <div className="mt-2 text-xs text-slate-400 italic">{item.notes}</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {editingSchedule && (
            <button
              type="button"
              onClick={addScheduleItem}
              className="ml-16 sm:ml-[4.5rem] w-[calc(100%-4rem)] sm:w-[calc(100%-4.5rem)] flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-cyan-200 hover:text-[#1B3A5C] transition-colors"
              style={{ background: 'rgba(37, 99, 235,0.08)', border: '1px dashed rgba(37, 99, 235,0.35)' }}
            >
              <Plus size={13} />
              {dayLabels[activeDay]} 일정 추가
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
