# 🤖 AI로 설치하기

아래 마스터 프롬프트를 **Claude Code** 또는 **OpenAI Codex** 데스크탑 앱에 붙여넣고 실행하면, 이 시스템이 자동으로 다운로드·설정·배포됩니다.

> 👀 **셋업 전에 먼저 체험해보세요**: [eum-camp-template.web.app](https://eum-camp-template.web.app) — 가상 50명(학생·교사·진행팀)으로 실제 운영 화면 그대로 둘러볼 수 있어요.

## 사용법

1. Claude Code([claude.com/download](https://claude.com/download)) 또는 OpenAI Codex([developers.openai.com/codex/app](https://developers.openai.com/codex/app)) 실행
2. 빈 폴더를 만들어 앱에서 「Open folder」로 열기
3. 아래 프롬프트의 「○○○○」 부분만 본인 정보로 채운 뒤 채팅창에 그대로 붙여넣고 Enter — 이후 Firebase Console 클릭 같은 화면 조작도 AI가 어디를 누를지 글로 안내합니다

## 마스터 프롬프트

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

## 확인 방법

배포가 끝나면 AI가 `https://○○○○.web.app` 형태의 사이트 주소를 알려줍니다. 그 주소를 열었을 때 진행위원 인증 설정 화면(이름·관리자 비밀번호·조회용 PIN 입력)이 뜨면 성공입니다.

## 더 필요하면

AI 없이 명령어로 직접 설치하려면 [`SETUP_GUIDE.md`](./SETUP_GUIDE.md), 문의는 [GitHub Issues](https://github.com/lgh5440/eum-camp/issues).
