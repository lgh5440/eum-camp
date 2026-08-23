// ⚠️ 자동 생성 파일 — 직접 수정 금지.
// 마스터: _eum-family/shared/eumFamily.json
// 갱신: node _eum-family/scripts/sync-eum-family.mjs

export type EumAppKey = 'talentroad' | 'myrealid' | 'eumplay' | 'eumschool' | 'eumphoto';

export interface EumApp {
  key: EumAppKey;
  name: string;
  tagline: string;
  emoji: string;
  url: string;
  accent: string;
  status?: 'coming-soon';
}

export const EUM_FAMILY: readonly EumApp[] = [
  { key: 'talentroad', name: '달란트로드', tagline: '나의 은사 찾기 · 56유형 검사', emoji: '🗺️', url: 'https://lgh5440.github.io/talentroad-test/', accent: '#fcd34d' },
  { key: 'myrealid', name: '이음 캠프', tagline: '수련회·모임 운영 도우미', emoji: '🏕️', url: 'https://eum-camp-template.web.app/', accent: '#a5b4fc' },
  { key: 'eumplay', name: '이음 플레이', tagline: '교회 활동 게임 9종 · 진행 도우미', emoji: '🎲', url: 'https://lgh5440.github.io/eum-play/', accent: '#34d399' },
  { key: 'eumschool', name: '이음 스쿨', tagline: '교회학교 통합 양육', emoji: '📚', url: 'https://lgh5440.github.io/eum-school-v5-demo/', accent: '#06b6d4' },
  { key: 'eumphoto', name: '이음 포토', tagline: '사진 정리 데스크톱 앱', emoji: '📷', url: 'https://lgh5440.github.io/eum-photo/', accent: '#f43f5e' },
] as const;

export function buildEumFamilyUrl(target: EumApp, source: EumAppKey, medium: 'footer' | 'cta'): string {
  if (!target.url) return '';
  const u = new URL(target.url);
  u.searchParams.set('utm_source', source);
  u.searchParams.set('utm_medium', medium);
  u.searchParams.set('utm_campaign', 'eum-family');
  return u.toString();
}
