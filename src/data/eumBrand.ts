// E:um 브랜드 상수 — 이음(E:um) 단체 컬러·텍스트
// 정확한 브랜드 가이드 HEX가 확정되면 이 값들 갱신.

export const EUM_BRAND = {
  name: 'E:um',
  nameKo: '이음',
  slogan: '하나님과 사람을 사람과 사람을',
  sloganLine1: '하나님과 사람을',
  sloganLine2: '사람과 사람을',
  logoUrl: '/eum-logo.png',
} as const;

// 브랜드 가이드 추정 컬러 — 정확한 값 받으면 즉시 교체
export const EUM_COLORS = {
  // Primary — 따뜻한 주황 (로고 골드 계열)
  orange:    '#F08C28',
  orangeD:   '#D87515',
  orangeL:   '#FFB870',
  // Secondary — 깊은 청 (다음세대 신뢰감)
  navy:      '#1B3A5C',
  navyD:     '#0F2540',
  // Neutral
  cream:     '#FFF8EC',
  gold:      '#FFD98C',
  goldL:     '#FFD98C',  // 슬로건 텍스트 등 다크 배경 위 강조용
} as const;
