# 🤖 AI로 30분 만에 설치하기 (가장 쉬움 · 비기술자용)

> 이 가이드는 **코딩을 한 번도 안 해본 분**도 따라할 수 있도록 만들었습니다.
> Firebase Console 클릭·환경변수 복사·명령어 입력 같은 어려운 부분을
> 전부 **AI(Claude Code)가 대신 해줍니다.** 여러분은 한국어로 물음에 답하기만 하면 끝.
>
> 📅 **본 가이드 기준일: 2026년 5월** — Claude Code 데스크탑 앱 v2.x·Node.js 24 LTS·Firebase CLI 최신 기준으로 작성됐습니다. 외부 도구 UI는 자주 바뀌니, 화면이 다르면 비슷한 메뉴를 찾으세요.

소요 시간: **약 30~40분** (도구 설치 10분 + AI에게 설치 부탁 20~30분)

---

## 0. 미리 준비할 것

| 준비물 | 어디서 / 비용 |
| :--- | :--- |
| 노트북 (Windows 10 1809+ 또는 macOS 13+) | 이미 있음 ✅ |
| RAM 4GB 이상 | 일반 노트북이면 충분 ✅ |
| Google 계정 | [google.com](https://google.com) 무료 (Firebase용) |
| GitHub 계정 (선택) | [github.com/signup](https://github.com/signup) 무료 (코드 받기용 — 사실 AI가 알아서 받아주므로 없어도 됨) |
| Anthropic 계정 | [claude.ai](https://claude.ai) 무료 가입 |

### 💸 비용 안내 (가장 중요)

이 시스템 자체는 **영구 무료**입니다(Firebase Spark Plan, 1,000명 규모까지). 다만 **AI에게 설치를 부탁하는 도구(Claude Code)는 유료**입니다. 두 가지 선택지:

| 옵션 | 비용 | 추천 대상 |
| :--- | :--- | :--- |
| **A. Claude Pro 구독** | **$20/월** (약 27,000원, 1개월만 결제하고 해지 가능) | 비기술자 (설명 듣기 쉬움) ✅ 추천 |
| **B. Anthropic Console API** | 사용량만큼 (이 설치엔 약 $2~5 충당) | 카드 등록·API 키 발급에 익숙한 분 |

> Pro $20 한 번 결제하면 설치 + 시스템 실험 + 다른 교회 추가 셋업까지 한 달 안에 다 가능. 끝나면 [claude.ai/settings/billing](https://claude.ai/settings/billing) 에서 구독 해지하면 다음 달부터 청구 안 됨.

---

## 1. AI 도구 설치 (10분) — 둘 중 하나 선택

🆕 **2026년 4월부터 두 도구 모두 전용 데스크탑 앱이 출시**됐습니다. VS Code 같은 다른 프로그램 없이 이 앱 하나로 모든 게 끝나요.

### 어떤 도구를 골라야 할까?

| 본인 상황 | 추천 |
| :--- | :--- |
| **이미 ChatGPT Plus($20/월) 구독 중** | 👉 **옵션 B (OpenAI Codex)** — 추가 비용 0원 |
| **이미 Claude Pro($20/월) 구독 중** | 👉 **옵션 A (Claude Code)** — 추가 비용 0원 |
| **둘 다 안 쓰는데 새로 가입할 예정** | 👉 **옵션 A (Claude Code)** — 한국 사용자 안내 문서가 더 풍부, 추천 ✅ |
| **무료로 시도해보고 싶음** | 👉 **옵션 B (Codex)** — ChatGPT Free 등급으로 일부 가능 (사용량 제한 큼) |

> 💡 **둘 다 비기술자가 같은 마스터 프롬프트로 사용 가능합니다.** 어느 쪽을 골라도 3단계 이후는 동일.

---

### 옵션 A — Claude Code (추천, 한국 가이드 풍부)

#### A-1. 다운로드 (3분)
1. 👉 **[claude.com/download](https://claude.com/download)** 접속
2. 본인 OS(Windows / macOS) 자동 감지 → **Download** 버튼 클릭
3. 설치 파일 실행 → 기본값 그대로 **다음 / Install**

> ⚠️ **Windows 사용자 추가**: [git-scm.com/downloads/win](https://git-scm.com/downloads/win) 에서 **Git for Windows**도 같이 설치 (Claude Code가 Bash 명령에 사용). Mac은 불필요.

#### A-2. 로그인 + 결제 플랜 (5분)
1. 앱 실행 → **Sign in** → Anthropic 계정 로그인 (없으면 가입, 카드 등록 X)
2. 플랜 선택:
   - **Pro $20/월** (비기술자 추천 — 카드 등록 → 결제)
   - 또는 **Use API key** → [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) 에서 키 발급해 입력
3. 메인 화면 열림 = 준비 끝 ✅

---

### 옵션 B — OpenAI Codex (이미 ChatGPT 쓰는 분에게 유리)

#### B-1. 다운로드 (3분)

**Windows**:
1. 시작 메뉴 → **Microsoft Store** 열기
2. 검색창에 **「Codex」** 입력 → **OpenAI Codex** 앱 선택 → **설치(Install)**

**macOS**:
1. 👉 **[developers.openai.com/codex/app](https://developers.openai.com/codex/app)** 접속
2. **Download for macOS** 클릭 → 설치 파일 실행

#### B-2. 로그인 (3분)
1. 앱 실행 → **Sign in with ChatGPT** 또는 **Use API key**
2. ChatGPT 로그인 — 본인 구독 등급(Free / Plus $20 / Pro $100)에 따라 사용량 결정
   - **Plus 이상 권장** — Free 등급은 이 설치 도중 사용량 한도에 걸릴 수 있음
3. 메인 화면 열림 = 준비 끝 ✅

---

### 1-X. 한국어 응답 확인 (공통, 1분)

채팅창에 **"한국어로 답해줘"** 입력 → 한국어 답변 잘 나오면 OK.

> 🆘 막히면? Claude Code는 [code.claude.com/docs](https://code.claude.com/docs), Codex는 [developers.openai.com/codex/quickstart](https://developers.openai.com/codex/quickstart).

---

## 2. 작업 폴더 만들고 AI 도구로 열기 (1분)

1. **바탕화면**에 **새 폴더** 생성 — 이름은 `우리교회-수련회` 같이 자유 (한글·영문 모두 OK)
2. AI 도구 앱 좌측 상단 **「Open folder」** (또는 폴더 아이콘) → 방금 만든 폴더 선택
   - Claude Code: **Open folder**
   - Codex: **Open folder** 또는 **Add workspace**

---

## 3. 마스터 프롬프트 붙여넣기 (1분)

채팅창에 **아래 프롬프트를 복사해서 그대로 붙여넣고 Enter**:

```text
안녕! 우리 교회에서 청소년 수련회를 운영할 시스템을 설치하고 싶어.
나는 코딩을 전혀 몰라. 한국어로 친절하게, 한 단계씩 도와줘.

설치할 것: https://github.com/lgh5440/eum-camp
이 폴더에 다운받아서 우리 교회용으로 셋업해줘.

다음 순서로 진행해줘:
1. 코드 다운로드 (git clone https://github.com/lgh5440/eum-camp.git .)
2. Node.js 설치 확인 — 없으면 https://nodejs.org 에서 LTS 버전 (24.x) 다운로드 안내, 설치 끝날 때까지 기다려줘
3. 의존성 설치 (npm install)
   - "moderate severity vulnerability" 경고가 떠도 무시해도 된다고 안심시켜줘
4. Firebase 무료 프로젝트 만들기
   - Firebase Console (console.firebase.google.com) 어디를 클릭해야 하는지 단계마다 설명
   - Firestore Database 만들 때 「프로덕션 모드」 / 「asia-northeast3 (Seoul)」 선택
   - ⚠️ 「Authentication → 로그인 방법 → 익명」 활성화 빠뜨리지 말 것 (이거 빠뜨리면 시스템 안 돌아감)
   - 웹 앱(`</>`) 등록 시 "Firebase Hosting도 설정" 체크박스는 체크하지 말 것 (CLI에서 따로 함)
5. 환경변수(.env.local) 채우기
   - `.env.example`을 복사해서 `.env.local` 생성
   - Firebase Console에서 apiKey/projectId 등 값 복사해서 채우기
   - `VITE_FIREBASE_EVENT_ID`는 본인 행사 고유 ID로 (예: hometown-church-2027)
6. Firebase CLI 로그인 + 프로젝트 연결
   - npm install -g firebase-tools (이미 있으면 스킵)
   - firebase login (브라우저 자동 열림)
   - firebase use --add → 본인 프로젝트 선택 → alias는 'default'
   - ⚠️ 이 저장소는 firebase.json에 `"target": "camp"`가 설정돼 있어서 추가 명령 1개 필수:
     `firebase target:apply hosting camp [본인 Firebase 프로젝트 ID]`
     예: 'hometown-church-retreat'이면
     `firebase target:apply hosting camp hometown-church-retreat`
     이 명령 빠뜨리면 deploy 시 "Hosting target 'camp' not defined" 에러 발생
7. 첫 배포 (npm run deploy:firebase)
8. 배포 끝나면 사이트 주소 알려주고, 첫 진행위원 인증 설정 화면 안내

내 상황:
- 운영체제: (Windows / Mac — 본인 환경 한 단어로 적기)
- 우리 교회 이름: 「○○○○교회」
- 행사명: 「20○○ 우리 교회 수련회」
- 일정: 20○○년 ○월 ○일 ~ ○월 ○일
- Firebase 프로젝트 ID 후보: 「○○○○-retreat-20○○」 (영문·숫자·하이픈만)

진행 중 막히면 그 단계에서 멈추고 한국어로 다시 쉽게 설명해줘.
명령어 실행 전엔 항상 「이 명령 실행해도 될까요?」 라고 물어봐줘.
브라우저로 가서 클릭해야 할 일이 있으면 어디를 클릭하는지 글로 안내해줘.
```

> 📋 **위 프롬프트의 「○○○○」 부분만 본인 정보로 채우고 그대로 붙여넣으세요.** 나머지는 손대지 말 것.

---

## 4. AI가 묻는 것에 답하기 (20~30분)

AI는 차례대로 이런 것을 물어볼 거예요:

### Node.js가 안 깔려 있을 때
> AI: "Node.js가 안 보입니다. [https://nodejs.org](https://nodejs.org) 가서 **LTS 버전 (현재 24.x)** 다운로드 후 설치해주세요."

→ 시키는 대로 설치 후 **"설치 끝났어"** 답.

### npm install 후 vulnerability 경고
> 빨간 글씨로 `1 moderate severity vulnerability` 같은 메시지

→ **무시해도 됨.** AI가 알아서 안심시켜주고 다음 단계로 넘어감.

### Firebase 프로젝트 만들 때
> AI: "[console.firebase.google.com](https://console.firebase.google.com) 접속 → 「프로젝트 만들기」 클릭. 프로젝트 이름은 「우리교회-수련회-2027」 같이 영문·숫자·하이픈으로."

→ Google 로그인 → 프로젝트 만들기 → **"만들었어"** 답.

### Firebase 설정값 복사
> AI: "Firebase Console 우측 상단 톱니바퀴 「프로젝트 설정」 → 페이지 하단 「내 앱」 섹션에서 `apiKey`, `projectId` 등 6개 값을 복사해서 여기 채팅에 붙여넣어주세요."

→ 복사 → 채팅에 붙여넣기 → AI가 `.env.local` 자동 작성.

### ⚠️ 익명 로그인 활성화 (가장 중요!)
> AI: "마지막 1단계! Firebase Console 좌측 「Authentication」 → 「시작하기」 → 「로그인 방법」 탭 → 「익명」 클릭 → 「사용 설정」 토글 켜기 → 저장."

→ **이거 빠뜨리면 사이트는 떴는데 데이터가 안 저장됨.** 반드시 켜야 함.

### "Hosting target 'camp' not defined" 에러
→ AI에게 **"firebase target:apply 명령 실행해줘. 내 Firebase 프로젝트 ID는 [본인 프로젝트 ID]야"** 라고 말하면 자동 처리.

### 배포 끝!
> AI: "배포 완료! 사이트 주소는 https://○○○○.web.app 입니다."

→ 그 주소를 브라우저로 열기 → **진행위원 인증 설정** 화면에서 본인 이름·관리자 비밀번호·조회용 PIN 입력 → 끝 🎉

---

## 5. 첫 사용 + 카톡 공유 (5분)

1. 본인 이름·관리자 비밀번호·조회용 PIN 설정 (한 번만)
2. 좌측 메뉴 **「행사·운영 설정」** → 행사명·날짜·장소 입력
3. **「교회별 신청 현황」** → 가상 교회 10곳(가람·새벽이슬·푸른초장…) 삭제 → 본인 지방회 교회 추가
4. **「공개 신청서 링크 복사」** (`/apply`) → 카톡 단톡방에 공유

---

## 자주 묻는 질문

### Q. Claude Pro $20을 꼭 결제해야 하나요?
A. **아니요. 두 가지 대안:**
1. **OpenAI Codex 데스크탑 앱** 사용 (옵션 B) — 이미 ChatGPT Plus($20) 쓰는 분은 추가 비용 0원. ChatGPT Free 등급으로도 일부 가능(제한 큼).
2. **Anthropic Console** 가입 → API 키 발급 → Claude Code 앱에 입력. 사용량만큼만 청구되어 이 설치엔 약 $2~5 정도. 단, 카드 등록 필요.

### Q. 한 번 설치 끝나면 AI 도구 안 써도 되나요?
A. 네. **설치 1회용**입니다. 끝나면 Pro 구독 해지하고, 운영은 브라우저에서 사이트 열어 클릭만 하면 됨.

### Q. 진짜 시스템 운영 비용 0원인가요?
A. **네.** Firebase Spark Plan(무료) 한도:
- Firestore: 일 50,000회 읽기 / 20,000회 쓰기 / 1GB 저장
- Hosting: 월 10GB 전송
- 익명 인증: 무제한

수련회 1회(200~500명)는 이 한도 안에 충분히 들어옵니다.

### Q. AI가 중간에 헷갈려해요
A. 채팅창에 **"다시 한국어로 쉽게 설명해줘"** 또는 **"이전 단계로 돌아가서 다시 해줘"** 입력. Claude Code는 대화 기억하니까 자연스럽게 이어감.

### Q. 다른 AI 도구(Cursor·Copilot 등)로도 되나요?
A. 됩니다. 다만:
- **본 가이드는 Claude Code와 OpenAI Codex 두 도구 모두 지원** — 1단계에서 골라 진행.
- **Cursor**: 무료 등급(월 50회 호출) 가능, 다만 한국어 자료가 두 메인 도구보다 적음
- **GitHub Copilot**: 코드 자동완성 특화 — 이 같은 대화형 셋업엔 약함
- **무료 ChatGPT/Gemini 웹**: 파일 쓰기·터미널 실행 기능이 없어 **이 설치엔 불가**

### Q. 우리 교회만 쓸 거라면 Firebase 없이도 되나요?
A. 가능. AI에게 **"Firebase 건너뛰고 로컬에서만 쓰게 해줘"** 라고 부탁하면 됨. 단, 한 기기·한 브라우저에서만 데이터가 보임.

### Q. 셋업이 끝났는데 사이트가 빈 화면이에요
A. 99% **Firebase 익명 로그인 활성화 빠뜨림** (4단계). Firebase Console → Authentication → 로그인 방법 → 익명 "사용 설정됨" 확인.

### Q. 우리 학교/회사 보안 정책에 막혀 설치가 안 돼요
A. 일부 기업·학교 네트워크는 `claude.ai` 또는 `downloads.claude.ai`를 차단합니다. 집에서 시도하거나 IT 담당자에게 화이트리스트 요청.

---

## 그래도 어려우면 — 기존 수동 가이드

AI 도구 설치 자체가 부담스러우면 명령어를 직접 입력하는 기존 가이드로 가세요:

👉 [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) — 비기술자용 수동 셋업 가이드 (35~45분, IT 익숙한 분)

---

## 도움 받는 법

- 본 시스템 자체 문의: [GitHub Issues](https://github.com/lgh5440/eum-camp/issues)
- Claude Code 사용법: [code.claude.com/docs](https://code.claude.com/docs) (영문) 또는 [claude.ai](https://claude.ai) 에 한국어로 질문
- Firebase 자체 문제: [Firebase 한국어 공식 문서](https://firebase.google.com/docs?hl=ko)
- Node.js: [nodejs.org](https://nodejs.org)
