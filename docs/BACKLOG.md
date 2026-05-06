# 📋 수정·개발 백로그

현재 상태 픽스 후 기록. 우선순위 순으로 정리. 1차 실제 운영 후 피드백 받으면 우선순위 재조정 권장.

---

## 🔴 우선 검토 (다음 세션에서)

### 보안

- [ ] **Firebase 익명 인증 차단 검증** — Firebase Console에서 Anonymous 인증 비활성화 확인. 활성화돼 있으면 PIN 모르는 사람도 직접 접근 가능
- [ ] **비밀번호 salt + PBKDF2** 적용 (3h) — 현재 SHA-256 단순 해시 → 무지개 테이블 방어
- [ ] **근본 보안 강화** (8~12h) — Firebase Functions에서 PIN 검증 → custom claim 발급 → Firestore rules에서 claim 검증

### 데이터 무결성

- [ ] 백업 복원 트랜잭션 처리 — 현재 부분 복원 가능
- [ ] "전체 초기화" 같은 위험 작업 자동 백업 → 되돌리기 안전장치
- [ ] Firestore document 1MB 한계 검증 (큰 명단·이미지 시)

---

## 🟠 안정성·구조

- [ ] **남은 ESLint 8 warning 정리** — react-hooks/exhaustive-deps (consumeEditRequest 패턴)
- [ ] **Dashboard.tsx 추가 분리** — 현재 932줄, 중간 패널 5칸·하단 패널 3개 미분리 (~600줄)
- [ ] **Vitest 테스트 확장** — 현재 27개. 추가 후보:
  - applicationsStorage (deduplication 로직)
  - churchIdentity (resolveChurchId, dedupeChurches)
  - dashboardStats (computeStats, computeCheckInStats)
- [ ] **에러 처리 일관화** — 페이지별 setError/setMessage 56개 인라인 메시지를 토스트로 일부 통일
- [ ] **공통 카드/버튼 컴포넌트 추출** — 다크 그라데이션 카드가 반복 (DashboardCard, GradientButton 등)

---

## 🟡 새 기능 (가성비 순)

| # | 작업 | 예상 시간 | 효과 |
| :-: | :--- | :-: | :--- |
| 1 | 출석 통계 엑셀 다운로드 | 2h | 행사 후 보고서 작성 편함 |
| 2 | 빠른 검색 (Cmd+K) | 3h | 어디서나 참가자·교회 즉시 검색 |
| 3 | 참가비 영수증 PDF | 2~3h | 인쇄용 |
| 4 | PWA 오프라인 모드 강화 | 2h | 현장 인터넷 약해도 명단 조회 |
| 5 | QR 체크인 | 4~6h | 참가자 휴대폰 QR로 자동 체크인 |
| 6 | 푸시 알림 (브라우저) | 3h | 새 신청 시 진행위원에게 알림 |
| 7 | 다크/라이트 토글 | 1h | 야외·실내 가독성 |

---

## 🟢 운영·콘텐츠

- [ ] **셋업 영상 가이드 5분짜리** 제작 — 비기술 교회용. SETUP_GUIDE.md를 영상으로
- [ ] **다른 교회 시범 운영** 1~2곳 — 진짜 사용자 피드백 수집
- [ ] **카톡 미리보기 OG 이미지** E:um 브랜드 반영해 새로 만들기 (현재 og-apply.png/og-system.png)
- [ ] **개인정보처리방침** 검토 (다른 교회 공유 시 필요)
- [ ] **모바일 UX 점검** — 작은 텍스트(text-[10px]) 시니어 담당교사에게 어려움. 야외 화창한 빛에서 다크 가독성

---

## 🆕 별도 앱·확장 (장기)

### Phase 2 — E:um 게임/레크 도움 앱

- [ ] 별도 저장소 (`church-game-helper` 같은 이름)
- [ ] 같은 스택 (React + Vite + TS + Firebase + Tailwind)
- [ ] 첫 1~2개월: 수련회 시스템 코드 패턴 그대로 가져오기
- [ ] 게임 카탈로그 데이터 (연령·장소·소요시간·인원·신앙 주제)
- [ ] 즐겨찾기, 진행 기록, 무작위 추천
- [ ] 콘텐츠 양이 핵심 — 체육 전공 강점 활용

### Phase 3 — 교회 관리 시스템 (1년+)

- [ ] 교인 마스터 (이름·교회·부서·연락처·생일)
- [ ] 부서별 그룹·소그룹 관리
- [ ] 수련회 시스템과 게임 앱이 모두 사용 → 모노레포로 추출 검토

### Phase 4 — 양육 시스템

- [ ] 신앙 성장 트래킹
- [ ] 심방 기록·소그룹 노트
- [ ] **개인정보 부담 큼** — PIPL 검토, 처리방침, 변호사 검토 필요
- [ ] 사역 본질 vs SaaS 사업 구분 명확히

---

## 🛡 다른 교회 공유 시 추가 요구

- [ ] **테넌트 격리** (공유 SaaS 모델 시) — Firestore rules에서 retreatId별 권한 분리
- [ ] **자동 삭제 옵션** (공유 SaaS 모델 시) — 행사 후 30일 후 자동 데이터 삭제
- [ ] **계정 시스템** — Firebase Auth 정식 사용
- [ ] **약관·정책** — 변호사 검토 필요

---

## 📌 기록·메모

### 발견된 패턴·노하우

- **lazy loading**: 페이지별 코드 분할로 초기 번들 1MB → 606KB (40%↓)
- **5단계 참가비 매핑**: 신청서 UI는 5단계, 내부는 3-bucket(fee) + feeStage 보존 → 통계 호환
- **dedupe 키**: `id` → `applicationToken` → `정규화 이름 + 공유 연락처` 우선순위
- **카톡 미리보기 분리**: Firebase rewrites로 `/apply` `/system` 별도 OG HTML 매핑
- **체험 모드 자동 감지**: Firebase env 미설정 시 `isCloudSyncEnabled() === false` → 헤더 보라색 배지

### 운영 중 발견된 이슈 (1차 운영 시 추적)

- (여기에 진짜 운영 시 발견되는 버그·요청 기록)

---

## 🔧 개발 워크플로 메모

- 매 작업: `npm run check` → `npm test` → `npm run deploy:firebase`
- 매 배포 전: [REGRESSION_CHECKLIST.md](REGRESSION_CHECKLIST.md) 5분 점검
- 작업 시작 전: 이 BACKLOG에서 우선순위 재확인

---

마지막 업데이트: 2026-05-06
