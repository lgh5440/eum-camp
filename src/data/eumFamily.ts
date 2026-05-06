// 이음(E:UM) 패밀리 앱 메타 — 3개 앱이 공유하는 단일 정보원.
// 같은 내용이 church-game-app/src/data/eumFamily.js 와 talentroad index.html 에도 들어감.

export type EumAppKey = 'talentroad' | 'myrealid' | 'eumplay';

export interface EumApp {
  key: EumAppKey;
  name: string;       // 표시명
  tagline: string;    // 한 줄 설명
  emoji: string;      // 카드 아이콘
  url: string;        // 절대 URL
  accent: string;     // 카드 강조색
}

export const EUM_FAMILY: readonly EumApp[] = [
  {
    key: 'talentroad',
    name: '달란트로드',
    tagline: '나의 은사 찾기 · 56유형 검사',
    emoji: '🧭',
    url: 'https://lgh5440.github.io/talentroad-test/',
    accent: '#fcd34d',
  },
  {
    key: 'myrealid',
    name: '이음 캠프',
    tagline: '수련회·모임 운영 도우미',
    emoji: '🏕️',
    url: 'https://eum-camp-template.web.app/',
    accent: '#a5b4fc',
  },
  {
    key: 'eumplay',
    name: '이음 플레이',
    tagline: '교회 활동 게임 9종 · 진행 도우미',
    emoji: '🎲',
    url: 'https://lgh5440.github.io/eum-play/',
    accent: '#34d399',
  },
] as const;

export function buildEumFamilyUrl(target: EumApp, source: EumAppKey, medium: 'footer' | 'cta'): string {
  const u = new URL(target.url);
  u.searchParams.set('utm_source', source);
  u.searchParams.set('utm_medium', medium);
  u.searchParams.set('utm_campaign', 'eum-family');
  return u.toString();
}
