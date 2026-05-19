import { queueCloudSave } from '../services/cloudStore';
import { publishStorageChange } from './storageEvents';

export interface DailyWord {
  badge: string;
  title: string;
  content: string;
  reference: string;
  note: string;
}

export const DAILY_WORD_KEY = 'eum-camp:daily-word:v1';

export const DEFAULT_DAILY_WORD: DailyWord = {
  badge: '오늘의 말씀',
  title: '오늘의 말씀',
  content: '"여호와는 나의 목자시니 내게 부족함이 없으리로다"',
  reference: '시편 23:1',
  note: '말씀은 EventSettings에서 변경할 수 있습니다.',
};

export function loadDailyWord(): DailyWord {
  try {
    const raw = localStorage.getItem(DAILY_WORD_KEY);
    if (!raw) return DEFAULT_DAILY_WORD;
    const parsed = JSON.parse(raw) as Partial<DailyWord>;
    return { ...DEFAULT_DAILY_WORD, ...parsed };
  } catch {
    return DEFAULT_DAILY_WORD;
  }
}

export function saveDailyWord(word: DailyWord): void {
  const next: DailyWord = {
    badge: word.badge.trim() || DEFAULT_DAILY_WORD.badge,
    title: word.title.trim() || DEFAULT_DAILY_WORD.title,
    content: word.content.trim() || DEFAULT_DAILY_WORD.content,
    reference: word.reference.trim() || DEFAULT_DAILY_WORD.reference,
    note: word.note.trim() || DEFAULT_DAILY_WORD.note,
  };

  try {
    localStorage.setItem(DAILY_WORD_KEY, JSON.stringify(next));
    publishStorageChange(DAILY_WORD_KEY);
    queueCloudSave('dailyWord', next);
  } catch {
    // Keep the page usable even if local storage is temporarily unavailable.
  }
}
