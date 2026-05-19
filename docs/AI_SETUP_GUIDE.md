# 🤖 AI로 30분 만에 설치하기 (가장 쉬움 · 비기술자용)

> 이 가이드는 **코딩을 한 번도 안 해본 분**도 따라할 수 있도록 만들었습니다.
> Firebase Console 클릭, 환경변수 복사, 명령어 입력 같은 어려운 부분을
> 전부 **AI(Claude Code)가 대신 해줍니다.** 여러분은 한국어로 물음에 답하기만 하면 끝.

소요 시간: **약 30~40분** (도구 설치 10분 + AI에게 설치 부탁 20~30분)
비용: **0원** (필요한 모든 도구·서비스가 무료 등급)

---

## 0. 미리 준비할 것

| 준비물 | 어디서 / 비용 |
| :--- | :--- |
| 노트북 (Windows·Mac) | 이미 있음 ✅ |
| Google 계정 | [google.com](https://google.com) 무료 가입 (Firebase용) |
| GitHub 계정 | [github.com/signup](https://github.com/signup) 무료 가입 (코드 받기용) |
| Anthropic 계정 | [console.anthropic.com](https://console.anthropic.com) 무료 가입 (AI 사용용) |

> ⚠️ **카드 등록은 필요 없습니다.** Anthropic은 가입 시 첫 무료 크레딧을 자동으로 줍니다 (현재 약 $5 — 이 설치 1번 하기에 충분).

---

## 1. 무료 도구 2개 설치 (10분)

### 1-1. VS Code 설치 (5분)

VS Code는 마이크로소프트가 만든 **전 세계 1위 무료 코드 에디터**입니다.

1. 👉 **[code.visualstudio.com](https://code.visualstudio.com)** 접속
2. 큰 파란색 **Download** 버튼 클릭 → 본인 OS(Windows/Mac) 선택
3. 다운받은 설치 파일 실행 → 기본값 그대로 **Next** 계속 → **Install**
4. 설치 끝나면 VS Code 자동으로 열림

### 1-2. Claude Code 설치 (5분)

Claude Code는 Anthropic이 만든 **한국어로 자연스럽게 대화하는 AI 코딩 도우미**입니다.

1. 👉 **[claude.com/claude-code](https://claude.com/claude-code)** 접속
2. **Download** 또는 **Get Started** 버튼 클릭
3. 본인 OS에 맞는 설치 파일 다운로드 → 실행 → 설치
4. 설치 후 자동으로 로그인 화면이 열림 → **Sign in with Anthropic** 클릭
5. 0단계에서 만든 Anthropic 계정으로 로그인 → 승인

> 🆘 **막히면?**
> - "Claude Code 어떻게 깔아요?" 라고 [claude.ai](https://claude.ai) 에 물어보세요 (이것도 무료).
> - 또는 본 가이드 끝의 [도움 받는 법](#도움-받는-법) 참고.

---

## 2. 작업 폴더 만들고 VS Code로 열기 (1분)

1. **바탕화면**(또는 어디든)에 **새 폴더** 만들기 — 이름은 `우리교회-수련회` 같이 자유
2. VS Code 화면에서 **File → Open Folder** → 방금 만든 폴더 선택

---

## 3. Claude Code 켜고 마스터 프롬프트 붙여넣기 (1분)

1. VS Code 좌측 사이드바에서 **Claude Code 아이콘** 클릭 (또는 키보드 `Ctrl+L` / Mac은 `Cmd+L`)
2. 채팅창이 열리면 **아래 프롬프트를 복사해서 그대로 붙여넣고 Enter**:

```text
안녕! 우리 교회에서 청소년 수련회를 운영할 시스템을 설치하고 싶어.
나는 코딩을 전혀 몰라. 한국어로 친절하게, 한 단계씩 도와줘.

설치할 것: https://github.com/lgh5440/eum-camp
이 폴더에 다운받아서 우리 교회용으로 셋업해줘.

다음 순서로 진행해줘:
1. 코드 다운로드 (git clone)
2. Node.js 설치 확인 — 없으면 다운로드 링크를 한국어로 알려주고 설치 끝날 때까지 기다려줘
3. 의존성 설치 (npm install)
4. Firebase 무료 프로젝트 만들기
   - Firebase Console 어디를 클릭해야 하는지 단계마다 설명
   - 「프로덕션 모드」 / 「asia-northeast3 (Seoul)」 선택
   - ⚠️ 「Authentication → 익명 로그인」 활성화 빠뜨리지 말 것
5. 환경변수(.env.local) 채우기 — 어디서 어떤 값을 복사해야 하는지 콕 짚어줘
6. firebase login + 첫 배포 (npm run deploy:firebase)
7. 배포 끝나면 사이트 주소 알려주고, 우리 교회 행사 정보 입력 화면 안내

내 상황:
- 운영체제: (Windows / Mac — 본인 환경 한 단어로 적기)
- 우리 교회 이름: 「○○○○교회」
- 행사명: 「20○○ 우리 교회 수련회」
- 일정: 20○○년 ○월 ○일 ~ ○월 ○일

진행 중 막히면 그 단계에서 멈추고 한국어로 다시 쉽게 설명해줘.
명령어 실행 전엔 항상 「이 명령 실행해도 될까요?」 라고 물어봐줘.
브라우저로 가서 클릭해야 할 일이 있으면 어디를 클릭하는지 글로 안내해줘.
```

> 📋 **위 프롬프트의 「○○○○」 부분만 본인 정보로 채우고 그대로 붙여넣으세요.** 나머지는 손대지 말 것.

---

## 4. AI가 묻는 것에 답하기만 하면 끝 (20~30분)

AI는 차례대로 이런 것을 물어볼 거예요. 당황하지 말고 차근차근 답하세요:

### Node.js가 안 깔려 있을 때
> AI: "Node.js가 안 보입니다. [https://nodejs.org] 가서 LTS 버전 다운로드 후 설치해주세요. 끝나면 알려주세요."

→ 시키는 대로 설치 후 채팅창에 **"설치 끝났어"** 라고 답하면 됨.

### Firebase 프로젝트 만들 때
> AI: "[console.firebase.google.com] 에 접속해서 「프로젝트 만들기」 클릭하세요. 프로젝트 이름은 「우리교회-수련회-2027」 같이 영문·숫자·하이픈으로 입력해주세요."

→ 시키는 대로 Google 계정 로그인 → 프로젝트 만들기 → **"만들었어"** 답.

### Firebase 설정값 복사할 때
> AI: "Firebase Console 우측 상단 「프로젝트 설정」(톱니바퀴) → 「내 앱」 섹션에서 `apiKey`, `projectId` 등을 복사해서 여기 채팅에 붙여넣어주세요."

→ 시키는 대로 복사 → 채팅에 붙여넣기 → AI가 알아서 `.env.local` 파일 작성.

### 익명 로그인 활성화
> AI: "마지막으로 한 가지만 더! Firebase Console 좌측 메뉴 「Authentication」 → 「로그인 방법」 → 「익명」 클릭 → 「사용 설정」 토글 켜기 → 저장. 끝나면 알려주세요."

→ 이거 빠뜨리면 시스템 안 돌아감. **반드시 켜야 함.**

### 배포 끝!
> AI: "배포 완료! 사이트 주소는 https://○○○○.web.app 입니다. 브라우저에서 열어보세요."

→ 그 주소 브라우저로 열기 → **진행위원 인증 설정** 화면 뜨면 본인 이름·비밀번호 입력 → 끝 🎉

---

## 5. 첫 사용 + 카톡 공유 (5분)

1. 본인 이름·관리자 비밀번호·조회용 PIN 설정 (한 번만)
2. 좌측 메뉴 **「행사·운영 설정」** → 행사명·날짜·장소 입력
3. **「교회별 신청 현황」** → 예시 교회 10곳(가람교회·새벽이슬교회…) 삭제 → 본인 지방회 교회 추가
4. **「공개 신청서 링크 복사」** (`/apply`) → 카톡으로 공유

---

## 자주 묻는 질문

### Q. 진짜 비용 0원인가요?
A. 네. Anthropic 첫 무료 크레딧($5)으로 설치 1번 가능, Firebase Spark Plan은 영구 무료(1,000명 규모까지). 한 번 깔면 평생 무료로 운영.

### Q. Claude Code 무료 크레딧 다 쓰면 어떻게 되나요?
A. 설치 끝나면 Claude Code 더 안 써도 됩니다. 운영은 브라우저에서 사이트 열어 클릭만 하면 됨. AI는 **설치 1회용**이라고 생각하세요.

### Q. Cursor 같은 다른 AI 도구도 되나요?
A. 됩니다. Cursor도 무료 등급(월 ~50회 호출)으로 가능. 다만 한국 비기술자한테는 Claude Code 한 가지로 통일된 안내가 덜 헷갈려서 이 가이드는 Claude Code 기준으로 작성.

### Q. AI가 중간에 답을 못 하거나 헷갈려요
A. 채팅창에 **"다시 한국어로 쉽게 설명해줘"** 또는 **"이전 단계로 돌아가서 다시 해줘"** 입력. AI는 사람처럼 대화 가능.

### Q. 우리 교회만 쓸 거라면 Firebase 없이도 되나요?
A. 가능. AI에게 **"Firebase 건너뛰고 로컬에서만 쓸 수 있게 해줘"** 라고 부탁하면 됨. 단, 한 기기·한 브라우저에서만 데이터가 보입니다.

### Q. 셋업이 끝났는데 사이트가 빈 화면이에요
A. 99% **Firebase 익명 로그인 활성화 빠뜨림** (4단계 마지막). Firebase Console → Authentication → 로그인 방법 → 익명 「사용 설정됨」 확인.

---

## 그래도 어려우면 — 기존 수동 가이드

AI 도구 설치 자체가 부담스러우면 명령어 손으로 입력하는 기존 가이드로 가세요 (35단계, 35~45분):

👉 [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) — 비기술자용 수동 셋업 가이드

---

## 도움 받는 법

- 본 시스템 자체 문의: GitHub Issues — [https://github.com/lgh5440/eum-camp/issues](https://github.com/lgh5440/eum-camp/issues)
- Claude Code 사용법: [https://claude.com/claude-code](https://claude.com/claude-code) 또는 [claude.ai](https://claude.ai) 에 한국어로 질문
- Firebase 자체 문제: [Firebase 한국어 공식 문서](https://firebase.google.com/docs?hl=ko)
- VS Code 사용법: [https://code.visualstudio.com/docs](https://code.visualstudio.com/docs)
