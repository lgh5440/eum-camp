# 온라인 공동 사용 설정

QR 체크인은 제외하고, 여러 명이 휴대폰과 PC에서 같은 데이터를 보도록 Firebase + Google Forms/CSV 흐름을 기준으로 구성했습니다.

## 1. Firebase 준비

1. Firebase Console에서 새 프로젝트를 만듭니다.
2. Web App을 추가하고 Firebase SDK 설정값을 복사합니다.
3. Authentication에서 Anonymous provider를 켭니다.
4. Firestore Database를 만들고 `asia-northeast3` 또는 가까운 리전을 선택합니다.
5. `.env.example`을 참고해 프로젝트 루트에 `.env.local`을 만듭니다.

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_EVENT_ID=youth-retreat-2026
```

## 2. Firestore rules 예시

`firestore.rules` 파일을 추가해두었습니다. 아래 규칙은 앱이 Firebase Anonymous Auth로 접속한 사용자에게만 해당 수련회 상태 문서를 읽고 쓰게 합니다.

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /retreats/youth-retreat-2026/state/{stateDoc} {
      allow read, write: if request.auth != null;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

참가자 연락처가 들어가므로 공개 링크를 넓게 배포하지 말고, 운영자용 계정/기기 중심으로 사용하세요. 더 강하게 막으려면 Firebase Auth 계정 로그인이나 Hosting 접근 제한을 추가하는 것이 좋습니다.

## 3. Google Forms 연동

추천 흐름:

1. Google Forms에서 신청서를 만듭니다.
2. 응답을 Google Sheet로 연결합니다.
3. Google Sheet에서 `파일 > 공유 > 웹에 게시` 또는 CSV로 접근 가능한 게시 URL을 준비합니다.
4. 앱의 `온라인 신청 대기함` 화면에 Sheet URL을 넣고 `동기화`를 누릅니다.
5. 현장 관리용 기기에서는 `2분마다 자동으로 Google Sheet 새 신청 가져오기`를 켜두면 새 응답을 주기적으로 대기함에 넣습니다.

필수 컬럼 이름은 유연하게 인식합니다. 그래도 가장 안정적인 헤더는 아래와 같습니다.

```csv
이름,교회,학년,성별,연락처,보호자 연락처,참가비,식단/알레르기,알레르기 상세,특이사항
```

샘플 파일은 `docs/application-import-template.csv`에 있습니다.

## 4. Naver Forms 연동

Naver Forms는 CSV 내보내기 흐름이 가장 안정적입니다.

1. Naver Forms 응답을 CSV로 내려받습니다.
2. 앱의 `온라인 신청 대기함`에서 `CSV 가져오기`를 누릅니다.
3. 중복 의심을 확인하고, 정상 건만 `명단에 추가`합니다.

## 5. 현장 운영 팁

- 여러 사람이 동시에 볼 화면: 대시보드, 교회별 확인, 온라인 신청 대기함, 현장 운영 모드.
- 교회 담당자에게 보낼 링크: `교회별 확인`에서 각 교회 카드의 `링크` 버튼을 눌러 복사합니다.
- 인터넷이 약할 때: 앱은 먼저 로컬 저장소에 저장하고, 연결이 돌아오면 Firebase로 다시 올립니다.
- 변경 추적: `데이터 관리 > 변경 내역`에서 최근 참가자/체크리스트/신청 변경을 확인합니다.
- 백업: 행사 시작 전, 첫날 밤, 마감 후 최소 3번 `데이터 관리`에서 JSON 백업을 내려받으세요.

## 6. 배포

Firebase Hosting 배포 파일은 `firebase.json`, 보안 규칙은 `firestore.rules`에 있습니다.

배포 순서는 `docs/FIREBASE_DEPLOY.md`를 따라가면 됩니다.
