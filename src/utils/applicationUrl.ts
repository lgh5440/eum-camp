// 카톡·SMS 공유용 짧은 URL.
// Firebase Hosting 리라이트로 각 경로에 OG 메타가 분리된 정적 페이지가 매핑되어
// 카톡 링크 미리보기(제목·이미지·설명)가 신청서/운영 시스템 별로 다르게 표시된다.
//   /apply   → public/share-apply.html  (og-apply.png · "2026 수련회 참가 신청서")
//   /system  → public/share-system.html (og-system.png · "2026 수련회 운영 시스템")
// 두 페이지 모두 즉시 #/apply 또는 #/dashboard 로 redirect 한다.

function originBase(): string {
  const { origin, pathname } = window.location;
  // base path가 있는 경우(예: GitHub Pages) 보존, 그 외엔 origin만.
  // 마지막 / 또는 index.html 이전까지를 base로 추출
  const base = pathname.replace(/\/[^/]*$/, '/');
  return `${origin}${base}`.replace(/\/+$/, '');
}

/** 참가자에게 카톡으로 공유할 신청서 URL. */
export function buildApplicationUrl(): string {
  return `${originBase()}/apply`;
}

/** 운영진·교사에게 카톡으로 공유할 운영 시스템 URL. */
export function buildSystemUrl(): string {
  return `${originBase()}/system`;
}
