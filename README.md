# 🏕️ E:UM Camp — 공유용 수련회 운영 시스템 (오픈 템플릿)

> **이 저장소는 어느 교회·단체나 무료로 가져다 쓰는 공유용 템플릿입니다.**
> 화면에 보이는 행사 정보·교회·참가자는 모두 **가상 시연 데이터**입니다.
> 본인 행사 데이터로 교체하는 방법은 아래 셋업 가이드에 있습니다.

React + TypeScript + Vite 기반의 청소년 수련회·연합 행사 운영 대시보드.
Firebase 무료(Spark Plan)로 **1,000명 규모까지 비용 0원**.

## 🚀 다른 교회에서 도입하는 법 — 2가지

### 1. 🤖 AI로 30분 만에 설치 ✅ 가장 쉬움 — 코딩 몰라도 OK

VS Code + Claude Code(AI)에게 한국어로 부탁하면 끝. 명령어·환경변수·Firebase Console 클릭을 전부 AI가 대신 안내합니다.

👉 **[AI 설치 가이드 (비기술자용)](./docs/AI_SETUP_GUIDE.md)**

### 2. 🛠️ 손으로 직접 설치 (35~45분, IT에 익숙한 분)

명령어를 직접 입력해서 설치하는 전통적인 방식.

👉 **[수동 설치 가이드](./docs/SETUP_GUIDE.md)**

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

## 시연용 가상 데이터

이 저장소에 포함된 행사 정보·교회·참가자는 모두 **가상 시연 데이터**입니다.
- 행사명: 「샘플 수련회 (예시)」
- 지방회: 「예시지방회」
- 교회: 「가람교회·새벽이슬교회·푸른초장교회…」 (실제 존재하지 않는 가상 이름)
- 참가자·교사: 가상 인물 (모든 연락처는 더미 패턴)

본인 행사 정보로 교체하는 방법:
1. 앱 첫 실행 시 **행사 설정 마법사**(EventSetupWizard)가 자동으로 뜸 → 본인 행사 정보 입력
2. 좌측 메뉴 **「행사·운영 설정」** 에서 언제든 수정 가능
3. **「교회별 신청 현황」** 에서 가상 교회 10곳 삭제 → 본인 지방회 교회 추가
4. 시드 코드 자체를 비우려면 `src/data/mockData.ts` 의 시드 배열을 `[]` 으로 변경

자세한 흐름은 [`docs/SETUP_GUIDE.md`](./docs/SETUP_GUIDE.md) 의 **6. 첫 사용** 단계를 참고하세요.
