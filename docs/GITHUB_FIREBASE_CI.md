# GitHub Actions 자동 배포

GitHub 저장소에 push하면 Firebase Hosting과 Firestore rules를 자동 배포하도록 `.github/workflows/firebase-deploy.yml`을 추가했습니다.

## 1. GitHub 원격 저장소 연결

GitHub에서 빈 저장소를 만든 뒤 아래 명령을 실행합니다.

```bash
git remote add origin https://github.com/계정/저장소.git
git branch -M main
git push -u origin main
```

## 2. Firebase 서비스 계정 만들기

Firebase Console에서 프로젝트를 열고:

1. `Project settings > Service accounts`로 이동
2. `Generate new private key` 선택
3. 내려받은 JSON 전체 내용을 GitHub Secret에 저장

## 3. GitHub Secrets

저장소의 `Settings > Secrets and variables > Actions`에서 아래 Secrets를 추가합니다.

```text
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

선택 Variables:

```text
VITE_FIREBASE_EVENT_ID=youth-retreat-2026
```

## 4. 배포 방식

- `main` 또는 `master` 브랜치에 push하면 자동 배포됩니다.
- GitHub Actions 화면에서 `Firebase Deploy` 워크플로를 수동 실행할 수도 있습니다.
- 워크플로는 `npm ci`, `npm run lint`, `npm run build`를 통과한 뒤 배포합니다.

## 5. 운영 팁

- 수련회 전에는 운영용 Firebase 프로젝트와 연습용 Firebase 프로젝트를 나누는 것이 좋습니다.
- 참가자 개인정보가 들어가므로 GitHub 저장소는 비공개로 두는 것을 권장합니다.
- Firebase Web App 설정값은 클라이언트에 포함되는 값이라 비밀번호는 아니지만, 운영 편의상 Secrets로 관리합니다.
