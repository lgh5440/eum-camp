# Firebase 배포 순서

이 파일은 Firebase 프로젝트가 준비된 뒤 실제 온라인 주소로 배포하는 순서입니다.

## 1. 최초 1회 설정

```bash
npm install
npm run lint
npm run build
npx firebase-tools login
npx firebase-tools use --add
```

`use --add`에서 Firebase 프로젝트를 선택하면 `.firebaserc`가 생성됩니다. 예시는 `.firebaserc.example`에 있습니다.

## 2. 환경 변수

`.env.example`을 복사해 `.env.local`을 만들고 Firebase Web App 설정값을 채웁니다.

`VITE_FIREBASE_EVENT_ID`를 바꾸면 `firestore.rules`의 `retreatId == 'youth-retreat-2026'`도 같은 값으로 바꿔야 합니다.

## 3. 배포

```bash
npm run build
npx firebase-tools deploy
```

배포가 끝나면 Firebase Hosting URL을 운영진에게 공유합니다. 같은 URL을 휴대폰에서 열면 Firestore를 통해 데이터가 같이 동기화됩니다.

## 4. 체크리스트

- Authentication에서 Anonymous provider가 켜져 있는지 확인
- Firestore Database가 생성되어 있는지 확인
- `firestore.rules` 배포 완료 확인
- 앱 우측 상단 상태가 `온라인 동기화`로 보이는지 확인
- 다른 휴대폰 2대로 참가자/체크리스트 변경이 서로 반영되는지 확인
- 휴대폰 홈 화면에 추가해 앱처럼 열리는지 확인

GitHub push로 자동 배포하려면 `docs/GITHUB_FIREBASE_CI.md`를 확인하세요.
