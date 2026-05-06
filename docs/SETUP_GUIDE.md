# 🛠️ 다른 교회용 셋업 가이드 (비기술자 30~45분 코스)

이 시스템을 다른 교회·다른 행사에 직접 운영하려면 아래 순서대로 따라 하세요.
**Firebase 무료 등급(Spark Plan)으로 비용 0원**, 수련회 1회 1,000명 규모까지 무료입니다.

> 본 가이드는 **2026년 5월 기준** Firebase Console UI와 CLI 14.x를 기준으로 작성됐습니다. Firebase Console 메뉴명이 바뀌었을 경우 해당 단계 이미지를 보고 비슷한 항목을 찾으시면 됩니다.

---

## 0. 미리 준비할 것

- 노트북 (Windows·Mac 모두 가능)
- **Google 계정** (Firebase·GitHub용 — 새로 만드셔도 됨)
- 깃허브 계정 (코드 받기용 — 무료)
- 본인 카드는 **필요 없음** (Spark Plan은 카드 등록 불요)

소요 시간: **약 30~45분**

---

## 1. 코드 받기 (5분)

### 옵션 A — GitHub Desktop 사용 (가장 쉬움, 비추천 → 옵션 B로 가세요)
1. [desktop.github.com](https://desktop.github.com) 다운로드 후 설치
2. 원본 저장소 페이지에서 우상단 **Fork** → 본인 계정으로 복사
3. 본인 계정의 fork된 저장소 → **Code** → **Open with GitHub Desktop**
4. 폴더 선택 후 다운로드

### 옵션 B — ZIP 다운로드 (더 빠름)
1. 원본 저장소 페이지 → **Code (초록색)** → **Download ZIP**
2. 다운받은 ZIP 압축 풀기 (예: `C:\Users\○○\Desktop\youth-retreat-2026`)

---

## 2. Node.js 설치 (3분)

이미 설치돼 있으면 건너뛰세요.

1. [nodejs.org](https://nodejs.org) 접속 → **LTS 버전** 다운로드
2. 설치 파일 실행 → 기본값 그대로 **Next** 계속
3. 설치 후 **명령 프롬프트**(Windows: 시작 → "cmd") 또는 **터미널**(Mac: 응용 프로그램 → 유틸리티 → 터미널) 열고 입력:
   ```
   node -v
   npm -v
   ```
   둘 다 버전 숫자가 나오면 OK (예: `v22.10.0`, `10.9.0`).

---

## 3. Firebase 프로젝트 만들기 (15분 — 가장 신경 써야 할 단계)

### 3-1. 프로젝트 생성 (3분)
1. [console.firebase.google.com](https://console.firebase.google.com) 접속 (Google 계정 로그인)
2. **프로젝트 만들기** 또는 **프로젝트 추가** 클릭
3. 프로젝트 이름 입력 (예: `우리교회-수련회-2026`) → **계속**
4. Google Analytics: **사용 안 함** 선택 (불필요) → **프로젝트 만들기**
5. 1~2분 대기 → **계속**

### 3-2. 웹 앱 등록 (3분)
1. 프로젝트 홈에서 **`</>` (웹) 아이콘** 클릭 (또는 "앱에 Firebase 추가")
2. 앱 닉네임 입력 (예: `수련회 운영`)
3. ⚠️ **"이 앱의 Firebase Hosting도 설정"** 체크박스는 **체크하지 마세요** (CLI에서 따로 함)
4. **앱 등록** 클릭
5. 다음 화면에 SDK 코드가 나옵니다 — **이 화면을 닫지 말고 그대로 두세요** (3-5에서 사용):
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "프로젝트ID.firebaseapp.com",
     projectId: "프로젝트ID",
     storageBucket: "프로젝트ID.firebasestorage.app",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcd..."
   };
   ```

### 3-3. Cloud Firestore 활성화 (3분)
1. 좌측 메뉴 → **빌드 (Build)** → **Firestore Database** 클릭
2. **데이터베이스 만들기** 클릭
3. 위치(Location) 선택: **`asia-northeast3 (Seoul)`** ✅ (한국 서버, 응답 빠름)
4. 보안 규칙: **프로덕션 모드** 선택 (기본 차단 → 우리가 따로 규칙 배포)
5. **만들기** 클릭 → 1분 대기

### 3-4. ⚠️ 익명 인증 활성화 (3분 — 빠뜨리면 시스템이 동작 안 합니다!)
1. 좌측 메뉴 → **빌드** → **Authentication** 클릭
2. **시작하기** 클릭
3. **로그인 방법** 탭으로 이동
4. **기본 제공업체** 목록에서 **익명** 클릭
5. **사용 설정** 토글 켜기 → **저장**

> 이 시스템은 Firebase 익명 인증으로 모든 사용자가 자동 로그인된 후, 자체 PIN/비밀번호로 권한을 분기합니다. 익명 인증이 꺼져 있으면 Firestore 읽기/쓰기가 차단됩니다.

### 3-5. 환경변수 값 복사 (2분)
3-2에서 띄워둔 SDK 코드 화면으로 돌아가:
- `apiKey` 값 복사
- `authDomain` 값 복사
- `projectId` 값 복사
- `storageBucket` 값 복사
- `messagingSenderId` 값 복사
- `appId` 값 복사

> SDK 코드 화면을 이미 닫았다면: **프로젝트 설정** (톱니바퀴) → **일반** 탭 → 페이지 하단 **내 앱** 섹션 → 등록한 웹앱 → **구성** 라디오 선택

---

## 4. 환경변수 파일 만들기 (3분)

1. 다운로드한 프로젝트 폴더에서 **`.env.example`** 파일을 찾아 **`.env.local`**이라는 이름으로 복사
   - Windows 탐색기에서 파일 확장자가 안 보이면: 보기 메뉴 → "파일 확장명" 체크
2. **메모장**(Windows) 또는 **TextEdit**(Mac)으로 `.env.local` 열기
3. 3-5에서 복사한 값들을 다음과 같이 채워넣기:
   ```
   VITE_FIREBASE_API_KEY=AIza... (3-5에서 복사한 apiKey)
   VITE_FIREBASE_AUTH_DOMAIN=프로젝트ID.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=프로젝트ID
   VITE_FIREBASE_STORAGE_BUCKET=프로젝트ID.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abcd...
   VITE_FIREBASE_EVENT_ID=우리교회-2026
   ```
4. 저장 후 닫기

> ⚠️ `VITE_FIREBASE_EVENT_ID`는 데이터를 저장할 폴더 이름입니다. 영문·숫자·하이픈만 사용 (예: `our-church-summer-2027`). 한글 금지.

---

## 5. 의존성 설치 + 배포 (10분)

명령 프롬프트(Windows) 또는 터미널(Mac)에서 프로젝트 폴더로 이동:

```bash
# 프로젝트 폴더로 이동 (예시 — 실제 경로는 본인 환경에 맞게)
cd Desktop\youth-retreat-2026

# 1) 라이브러리 다운로드 (1~2분)
npm install

# 2) Firebase CLI 설치 (이미 있으면 스킵)
npm install -g firebase-tools

# 3) Firebase 로그인 — 브라우저가 열리면 본인 Google 계정으로 로그인
firebase login

# 4) 어떤 Firebase 프로젝트에 배포할지 지정 (3-1에서 만든 프로젝트 선택)
firebase use --add
# → 프로젝트 목록이 뜨면 본인 것 선택, alias는 `default` 입력

# 5) 보안 규칙 + 호스팅 한 번에 배포
npm run deploy:firebase
```

### ⚠️ 첫 배포 시 주의사항
- `firebase use --add`에서 본인이 만든 프로젝트가 안 보이면 한 번 더 `firebase login` 실행
- 배포 시 `firebase.json`에 정의된 **firestore + hosting** 둘 다 자동 배포됨 (보안 규칙도 함께)
- 배포 끝에 `Hosting URL: https://프로젝트ID.web.app` 주소가 나오면 성공 🎉

---

## 6. 첫 사용 (5분)

1. **5단계에서 나온 URL을 브라우저에서 열기**
2. **첫 화면: 진행위원 인증 설정 (SetupScreen)**
   - 진행위원 표시명: 본인 이름 (예: `김교사 / 박○○ 목사`)
   - 관리자 비밀번호: 8자 이상 (영문·숫자·기호 조합)
   - 조회용 PIN: 4~6자리 숫자 (다른 교회 담당자에게 알려줄 코드)
3. **로그인 후 좌측 메뉴 → "행사·운영 설정"**
   - 행사명·날짜·장소·강사·문의처 모두 본인 행사 정보로 변경
   - 메인 이미지 업로드 (선택)
4. **교회별 신청 현황** → 시드 예시 3개 삭제 → 본인 지방회 교회 추가
5. **공개 신청서 링크 복사** (`/apply` 경로) → 카톡으로 공유

끝! 🎉

---

## 자주 묻는 질문

### Q. 비용이 정말 0원인가요?
A. Firebase **Spark Plan(무료)** 한도:
- Firestore: 일 50,000회 읽기 / 20,000회 쓰기 / 1GB 저장
- Hosting: 월 10GB 전송 / 360MB/일
- 인증: 익명 인증 무제한

수련회 1회(200명 규모) 운영엔 **충분하고도 남습니다**. 실제 사용량은 Firebase Console > 사용량에서 실시간 확인 가능.

### Q. 카드 등록 안 하면 안 되나요?
A. Spark Plan은 **카드 등록 자체가 안 뜹니다**. Cloud Functions나 Storage 같은 유료 기능을 안 쓰면 영원히 무료. 한도 초과해도 자동 차단되며 결제 발생 안 함.

### Q. 실수로 결제 발생할 수 있나요?
A. **불가능**. Spark Plan은 한도 초과 시 자동으로 서비스 차단되도록 설계됨. Blaze Plan(유료)으로 직접 업그레이드해야만 결제 시작.

### Q. 이전 행사 데이터를 다음 해에 그대로 쓰고 싶어요
A. **데이터 관리** → **백업 다운로드** (JSON 파일) → 새 Firebase 프로젝트 만들고 같은 페이지에서 **백업 복원**.

### Q. 다른 교회 담당자가 접속만 하고 수정은 못 하게 하려면?
A. 진행위원 비밀번호와 별도로 **조회용 PIN**을 발급해 주세요. PIN으로 로그인하면 읽기 전용 모드로 들어갑니다.

### Q. 코드 업데이트(원본 저장소에 새 기능)는 어떻게 받나요?
A. GitHub에서 본인의 fork 저장소 → **Sync fork** 버튼 → 다시 `npm run deploy:firebase`. 매번 받기 부담스러우면 한 번 셋업 후 그대로 쓰셔도 OK.

### Q. 우리 교회만 쓸 거라면 Firebase 없이 될까요?
A. 가능. `.env.local`을 만들지 않거나 비어 있으면 **체험 모드**(localStorage)로 동작. 단, 한 기기·한 브라우저에서만 데이터가 보입니다.

### Q. 배포 명령에서 "Permission denied"가 떠요
A. 십중팔구 `firebase login`이 안 됐거나 `firebase use --add`로 프로젝트가 선택 안 된 상태. 다음 두 명령으로 재설정:
```bash
firebase logout
firebase login
firebase use --add
```

### Q. 배포 후 사이트는 떴는데 데이터가 저장이 안 돼요
A. 99% **익명 인증을 활성화 안 함** (3-4 단계). Firebase Console → Authentication → 로그인 방법 → 익명이 "사용 설정됨" 상태인지 확인.

### Q. Firestore 데이터를 수동으로 보고 싶어요
A. Firebase Console → Firestore Database → 데이터 탭에서 트리 구조로 직접 확인 가능. `retreats > [본인 EVENT_ID] > state > [컬렉션]` 경로.

---

## 도움이 필요하면

- 원본 시스템 제작: **E:UM (이음)** — 시스템 문의는 GitHub Issues에 남겨주세요
- Firebase 자체 문제: [Firebase 공식 문서](https://firebase.google.com/docs)
