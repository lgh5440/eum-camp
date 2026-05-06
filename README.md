# 2026 서울남지방회 연합 청소년 수련회 운영 시스템

React + TypeScript + Vite 기반의 수련회 운영 대시보드입니다.

## 주요 기능

- 메인 대시보드: 인원, 배정률, 체크리스트, 안전 현황 요약
- 참가자 관리: 참가자 목록, 검색, 추가/수정, CSV 가져오기/내보내기
- 교회별 확인: 교회별 신청/확정/참가비 상태 점검
- 조/방/차량 배정: 운영 배정 현황 관리
- 현장 체크인/현장 운영 모드: 당일 도착 확인과 모바일 현장용 화면
- 문서/출력 센터: 명단, 일정표, 운영 자료 확인

## 실행

```bash
npm install
npm run dev
```

개발 서버 기본 주소는 `http://localhost:5173` 입니다.

## 다른 교회·다른 행사에 적용하려면

비기술자도 30분 안에 셋업할 수 있도록 한국어 가이드를 준비했습니다 → [`docs/SETUP_GUIDE.md`](./docs/SETUP_GUIDE.md)

Firebase 무료 등급으로 비용 0원, 수련회 1회 1,000명 규모까지 무료입니다.

## 온라인 공동 사용

Firebase 설정값을 `.env.local`에 넣으면 여러 기기에서 참가자 명단, 체크리스트, 현장 체크, 교회별 확인, 신청 대기함, 변경 내역이 Firestore로 동기화됩니다.

Google Forms는 응답 Sheet CSV URL을 `온라인 신청 대기함`에 넣어 동기화하고, Naver Forms는 CSV 파일 가져오기로 처리합니다. 자세한 설정은 [`ONLINE_SETUP.md`](./ONLINE_SETUP.md)를 확인하세요.

Firebase Hosting 배포 파일은 `firebase.json`, Firestore 보안 규칙은 `firestore.rules`에 있습니다. 배포 순서는 [`docs/FIREBASE_DEPLOY.md`](./docs/FIREBASE_DEPLOY.md)를 확인하세요.

GitHub Actions 자동 배포는 [`docs/GITHUB_FIREBASE_CI.md`](./docs/GITHUB_FIREBASE_CI.md), 현장 휴대폰 사용 안내는 [`docs/MOBILE_FIELD_USE.md`](./docs/MOBILE_FIELD_USE.md)에 정리했습니다.

## 검증

```bash
npm run lint
npm run build
```

## 행사 정보

- 행사명: 2026 서울남지방회 연합 청소년 수련회
- 주제: MY REAL IDENTITY
- 부제: AI 시대 속에서의 정체성
- 일정: 2026.07.26(주일) - 07.28(화)
- 장소: 연천 수련원

행사 기본 정보는 `src/data/eventInfo.ts`와 `src/data/mockData.ts`의 `RETREAT_INFO`를 기준으로 표시됩니다.
