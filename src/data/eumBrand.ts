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

// 브랜드 컬러 — 블루 미니멀 3D 카드형 디자인 시스템 정본 적용(Phase 2, 2026-09-01).
// 정본: D:\HONG\09_이음\01_부서\경영조정실\_디자인시스템\eum_웹토큰_v1.css
// 키 이름은 하위호환을 위해 유지(orange/navy/gold 등), 값만 정본 블루로 교체 —
// 과거의 주황·다크네이비·골드(다크 배경 위 강조용) 브랜드 시안은 폐기됨(오너 확정 지시).
export const EUM_COLORS = {
  // Primary — 정본 Primary Blue
  orange:    '#2F73F2',
  orangeD:   '#1F5FD9',
  orangeL:   '#6FA7FF',
  // Secondary — 정본 Primary Blue Deep (다크 배경 자체를 더 이상 쓰지 않음)
  navy:      '#1F5FD9',
  navyD:     '#101A3D',
  // Neutral — 정본 Background
  cream:     '#F5F7FA',
  gold:      '#2F73F2',
  goldL:     '#6FA7FF',  // 슬로건 텍스트 등 강조용(다크 배경 전제 폐기, 밝은 블루로 대체)
} as const;
