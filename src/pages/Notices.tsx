import { useEffect, useState } from 'react';
import { Check, ChevronLeft, Megaphone, Pencil, Pin, Plus, Trash2 } from 'lucide-react';
import type { Notice } from '../types';
import { useDailyWord, useNoticeItems, useNoticeTargetConfig } from '../hooks/useSharedData';
import { saveNoticeItems } from '../utils/noticeStorage';
import { saveDailyWord, type DailyWord } from '../utils/dailyWordStorage';
import {
  DEFAULT_NOTICE_TARGET_CONFIG,
  saveNoticeTargetConfig,
  type NoticeTargetConfig,
} from '../utils/categoryConfigStorage';
import { consumeEditRequest } from '../utils/pageEditRequest';
import { useAuth } from '../auth/useAuth';

type TargetMeta = Record<Notice['target'], { label: string; color: string }>;

function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 본문 텍스트의 URL을 <a> 로 변환 (개행은 whitespace-pre-line이 처리)
function renderContentWithLinks(text: string) {
  const URL_REGEX = /(https?:\/\/[^\s<>"]+)/g;
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-300 hover:text-cyan-200 underline break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function NoticeCard({
  notice,
  isSelected,
  onClick,
  targetMeta,
}: {
  notice: Notice;
  isSelected: boolean;
  onClick: () => void;
  targetMeta: TargetMeta;
}) {
  const meta = targetMeta[notice.target];
  return (
    <div
      onClick={onClick}
      className={`p-3 sm:p-4 rounded-2xl cursor-pointer transition-all ${
        isSelected ? 'ring-1 ring-cyan-400' : 'hover:bg-white/[0.06]'
      }`}
      style={{
        background: isSelected ? 'rgba(37, 99, 235,0.1)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isSelected ? 'rgba(37, 99, 235,0.4)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          {notice.pinned && (
            <Pin size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-medium text-[#1B3A5C] line-clamp-2 sm:line-clamp-1">
            {notice.title}
          </span>
        </div>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
          style={{ color: meta.color, background: `${meta.color}15` }}
        >
          {meta.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-slate-500">
        <span>{notice.author}</span>
        <span>{notice.createdAt}</span>
      </div>
    </div>
  );
}

function NoticeDetail({
  notice,
  onBack,
  targetMeta,
}: {
  notice: Notice;
  onBack: () => void;
  targetMeta: TargetMeta;
}) {
  const meta = targetMeta[notice.target];
  return (
    <div className="p-4 sm:p-6 rounded-2xl h-full"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

      <button
        onClick={onBack}
        className="lg:hidden flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 mb-4 transition-colors"
      >
        <ChevronLeft size={16} />
        목록으로
      </button>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {notice.pinned && (
          <span className="flex items-center gap-1 text-xs text-amber-300 font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(245,158,11,0.15)' }}>
            <Pin size={11} />
            고정
          </span>
        )}
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ color: meta.color, background: `${meta.color}15` }}
        >
          {meta.label}
        </span>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-[#1B3A5C] mb-4 leading-snug">
        {notice.title}
      </h3>

      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
        {renderContentWithLinks(notice.content)}
      </p>

      <div
        className="mt-6 pt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <span>작성자: {notice.author}</span>
        <span>등록일: {notice.createdAt}</span>
      </div>
    </div>
  );
}

function EmptyDetail() {
  return (
    <div
      className="rounded-2xl p-6 hidden lg:flex items-center justify-center"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="text-center text-slate-600">
        <Megaphone size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium text-slate-500">공지를 선택하면</p>
        <p className="text-xs text-slate-600 mt-1">상세 내용이 여기에 표시됩니다.</p>
      </div>
    </div>
  );
}

export default function Notices() {
  const noticeItems = useNoticeItems();
  const dailyWord = useDailyWord();
  const targetConfig = useNoticeTargetConfig();
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Notice[]>(noticeItems);
  const [selected, setSelected] = useState<Notice | null>(null);
  const [filterTarget, setFilterTarget] = useState<'all' | Notice['target']>('all');
  const [editingNotices, setEditingNotices] = useState(false);
  const [editingTargets, setEditingTargets] = useState(false);
  const [editingDailyWord, setEditingDailyWord] = useState(false);
  const [targetDraft, setTargetDraft] = useState<NoticeTargetConfig[]>([]);
  const [wordDraft, setWordDraft] = useState<DailyWord>(dailyWord);

  useEffect(() => {
    if (!editingNotices) {
      const timer = window.setTimeout(() => setItems(noticeItems), 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [editingNotices, noticeItems]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!editingDailyWord) setWordDraft(dailyWord);
  }, [dailyWord, editingDailyWord]);

  const targetMeta = Object.fromEntries(
    targetConfig.map(target => [target.key, { label: target.label, color: target.color }]),
  ) as TargetMeta;

  const filtered = items.filter(n => filterTarget === 'all' || n.target === filterTarget);
  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  function handleSelect(notice: Notice) {
    setSelected(notice);
  }

  function handleBack() {
    setSelected(null);
  }

  function openNoticeEdit() {
    setItems(noticeItems.map(notice => ({ ...notice })));
    setSelected(null);
    setEditingNotices(true);
  }

  useEffect(() => {
    if (!isAdmin || editingNotices) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (consumeEditRequest('notices', 'notices')) openNoticeEdit();
  }, [editingNotices, isAdmin, noticeItems]);

  function openDailyWordEdit() {
    setWordDraft(dailyWord);
    setEditingDailyWord(true);
  }

  function saveDailyWordEdit() {
    saveDailyWord(wordDraft);
    setEditingDailyWord(false);
  }

  useEffect(() => {
    if (!isAdmin || editingDailyWord) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (consumeEditRequest('notices', 'word')) openDailyWordEdit();
  }, [dailyWord, editingDailyWord, isAdmin]);

  function updateNotice(id: string, patch: Partial<Notice>) {
    setItems(prev => prev.map(notice => notice.id === id ? { ...notice, ...patch } : notice));
  }

  function addNotice() {
    setItems(prev => [
      {
        id: `n_${Date.now()}`,
        title: '새 공지사항',
        content: '',
        author: '',
        createdAt: todayIso(),
        pinned: false,
        target: filterTarget === 'all' ? 'all' : filterTarget,
      },
      ...prev,
    ]);
  }

  function deleteNotice(id: string) {
    setItems(prev => prev.filter(notice => notice.id !== id));
  }

  function saveNoticeEdit() {
    const normalized = items.map(notice => ({
      ...notice,
      title: notice.title.trim() || '새 공지사항',
      content: notice.content.trim(),
      author: notice.author.trim() || '운영진',
      createdAt: notice.createdAt.trim() || todayIso(),
    }));
    saveNoticeItems(normalized);
    setItems(normalized);
    setEditingNotices(false);
  }

  function openTargetEdit() {
    setTargetDraft(targetConfig.map(target => ({ ...target })));
    setEditingTargets(true);
  }

  function saveTargetEdit() {
    const next = targetDraft.map(target => ({
      ...target,
      label: target.label.trim() || DEFAULT_NOTICE_TARGET_CONFIG.find(base => base.key === target.key)?.label || target.key,
    }));
    saveNoticeTargetConfig(next);
    setEditingTargets(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1B3A5C]">공지사항</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            총 {items.length}건 · 고정 {items.filter(n => n.pinned).length}건
          </p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={editingNotices ? saveNoticeEdit : openNoticeEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={editingNotices
                ? { color: '#6ee7b7', background: 'rgba(16,185,129,0.16)', border: '1px solid rgba(16,185,129,0.35)' }
                : { color: '#2563EB', background: 'rgba(37, 99, 235,0.12)', border: '1px solid rgba(37, 99, 235,0.3)' }
              }
            >
              {editingNotices ? <Check size={12} /> : <Pencil size={12} />}
              {editingNotices ? '공지 저장' : '공지 편집'}
            </button>
            <button
              type="button"
              onClick={editingTargets ? saveTargetEdit : openTargetEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={editingTargets
                ? { color: '#6ee7b7', background: 'rgba(16,185,129,0.16)', border: '1px solid rgba(16,185,129,0.35)' }
                : { color: '#2563EB', background: 'rgba(37, 99, 235,0.12)', border: '1px solid rgba(37, 99, 235,0.3)' }
              }
            >
              {editingTargets ? <Check size={12} /> : <Pencil size={12} />}
              {editingTargets ? '카테고리 저장' : '카테고리 편집'}
            </button>
            <button
              type="button"
              onClick={editingDailyWord ? saveDailyWordEdit : openDailyWordEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={editingDailyWord
                ? { color: '#6ee7b7', background: 'rgba(16,185,129,0.16)', border: '1px solid rgba(16,185,129,0.35)' }
                : { color: '#c4b5fd', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)' }
              }
            >
              {editingDailyWord ? <Check size={12} /> : <Pencil size={12} />}
              {editingDailyWord ? '말씀 저장' : '오늘의 말씀 편집'}
            </button>
          </div>
        )}
      </div>

      {editingDailyWord && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.28)' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              value={wordDraft.badge}
              onChange={e => setWordDraft(prev => ({ ...prev, badge: e.target.value }))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-[#1B3A5C] outline-none focus:border-violet-300"
              placeholder="배지"
            />
            <input
              value={wordDraft.title}
              onChange={e => setWordDraft(prev => ({ ...prev, title: e.target.value }))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-[#1B3A5C] outline-none focus:border-violet-300"
              placeholder="제목"
            />
            <input
              value={wordDraft.reference}
              onChange={e => setWordDraft(prev => ({ ...prev, reference: e.target.value }))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-[#1B3A5C] outline-none focus:border-violet-300"
              placeholder="성경 구절"
            />
          </div>
          <textarea
            value={wordDraft.content}
            onChange={e => setWordDraft(prev => ({ ...prev, content: e.target.value }))}
            className="w-full min-h-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-[#1B3A5C] outline-none focus:border-violet-300 resize-y"
            placeholder="말씀 내용"
          />
          <input
            value={wordDraft.note}
            onChange={e => setWordDraft(prev => ({ ...prev, note: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-[#1B3A5C] outline-none focus:border-violet-300"
            placeholder="하단 메모"
          />
        </div>
      )}

      {editingTargets && (
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(37, 99, 235,0.22)' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {targetDraft.map((target, index) => (
              <div
                key={target.key}
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: `${target.color}12`, border: `1px solid ${target.color}30` }}
              >
                <input
                  value={target.label}
                  onChange={e => {
                    const next = [...targetDraft];
                    next[index] = { ...target, label: e.target.value };
                    setTargetDraft(next);
                  }}
                  className="flex-1 min-w-0 bg-transparent text-xs text-[#1B3A5C] outline-none border-b border-white/10 focus:border-cyan-400 py-1"
                />
                <input
                  type="color"
                  value={target.color}
                  onChange={e => {
                    const next = [...targetDraft];
                    next[index] = { ...target, color: e.target.value };
                    setTargetDraft(next);
                  }}
                  className="w-8 h-7 rounded-lg bg-transparent cursor-pointer"
                  aria-label={`${target.label} 색상`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {targetConfig.map(target => {
          const isActive = filterTarget === target.key;
          return (
            <button
              key={target.key}
              onClick={() => { setFilterTarget(target.key); setSelected(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isActive ? 'text-[#1B3A5C]' : 'text-slate-400 hover:text-slate-200'
              }`}
              style={
                isActive
                  ? { background: `${target.color}20`, border: `1px solid ${target.color}40` }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {target.label}
            </button>
          );
        })}
      </div>

      {editingNotices ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={addNotice}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-cyan-200 hover:text-[#1B3A5C] transition-colors"
            style={{ background: 'rgba(37, 99, 235,0.08)', border: '1px dashed rgba(37, 99, 235,0.35)' }}
          >
            <Plus size={13} />
            공지 추가
          </button>

          {sorted.map(notice => (
            <div
              key={notice.id}
              className="rounded-2xl p-3 sm:p-4 space-y-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem_8rem_auto] gap-2">
                <input
                  value={notice.title}
                  onChange={e => updateNotice(notice.id, { title: e.target.value })}
                  className="bg-transparent outline-none text-sm font-bold text-[#1B3A5C] border-b border-white/10 focus:border-cyan-400 py-1 min-w-0"
                  placeholder="공지 제목"
                />
                <select
                  value={notice.target}
                  onChange={e => updateNotice(notice.id, { target: e.target.value as Notice['target'] })}
                  className="bg-transparent outline-none text-xs text-slate-200 border-b border-white/10 focus:border-cyan-400 py-1"
                >
                  {targetConfig.map(target => (
                    <option key={target.key} value={target.key} style={{ background: '#F8FBFF' }}>
                      {target.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={notice.createdAt}
                  onChange={e => updateNotice(notice.id, { createdAt: e.target.value })}
                  className="bg-transparent outline-none text-xs text-slate-300 border-b border-white/10 focus:border-cyan-400 py-1"
                />
                <button
                  type="button"
                  onClick={() => deleteNotice(notice.id)}
                  className="justify-self-start sm:justify-self-end w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  title="공지 삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                <input
                  value={notice.author}
                  onChange={e => updateNotice(notice.id, { author: e.target.value })}
                  className="bg-transparent outline-none text-xs text-slate-300 border-b border-white/10 focus:border-cyan-400 py-1"
                  placeholder="작성자"
                />
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={notice.pinned}
                    onChange={e => updateNotice(notice.id, { pinned: e.target.checked })}
                    className="accent-cyan-400"
                  />
                  고정
                </label>
              </div>
              <textarea
                value={notice.content}
                onChange={e => updateNotice(notice.id, { content: e.target.value })}
                rows={4}
                className="w-full bg-transparent outline-none text-sm text-slate-300 border border-white/10 focus:border-cyan-400 rounded-lg px-3 py-2 resize-y"
                placeholder="공지 본문"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`space-y-2 ${selected ? 'hidden lg:block' : 'block'}`}>
            {sorted.length === 0 ? (
              <div className="py-12 text-center text-slate-600 text-sm rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                해당하는 공지가 없습니다.
              </div>
            ) : (
              sorted.map(notice => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  isSelected={selected?.id === notice.id}
                  onClick={() => handleSelect(notice)}
                  targetMeta={targetMeta}
                />
              ))
            )}
          </div>

          {selected ? (
            <NoticeDetail notice={selected} onBack={handleBack} targetMeta={targetMeta} />
          ) : (
            <EmptyDetail />
          )}
        </div>
      )}
    </div>
  );
}
