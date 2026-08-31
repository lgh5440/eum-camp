import { lazy, Suspense, useEffect, useState } from 'react';
import { Menu, LogOut, ShieldCheck, UserCog } from 'lucide-react';
import Sidebar, { type PageKey } from './components/Sidebar';
import MobileBottomNav from './components/MobileBottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import { EVENT } from './data/eventInfo';
import { EUM_BRAND } from './data/eumBrand';
// 페이지별 코드 분할 (lazy loading) — 첫 진입 시 메인 번들 약 1MB → 약 200KB 수준으로 감소
const Dashboard            = lazy(() => import('./pages/Dashboard'));
const Participants         = lazy(() => import('./pages/Participants'));
const Applications         = lazy(() => import('./pages/Applications'));
const Churches             = lazy(() => import('./pages/Churches'));
const Groups               = lazy(() => import('./pages/Groups'));
const SchedulePage         = lazy(() => import('./pages/Schedule'));
const Rooms                = lazy(() => import('./pages/Rooms'));
const Vehicles             = lazy(() => import('./pages/Vehicles'));
const Checklist            = lazy(() => import('./pages/Checklist'));
const Safety               = lazy(() => import('./pages/Safety'));
const Notices              = lazy(() => import('./pages/Notices'));
const PrintCenter          = lazy(() => import('./pages/PrintCenter'));
const DataManager          = lazy(() => import('./pages/DataManager'));
const EmergencyContacts    = lazy(() => import('./pages/EmergencyContacts'));
const CheckIn              = lazy(() => import('./pages/CheckIn'));
const FieldMode            = lazy(() => import('./pages/FieldMode'));
const UserGuide            = lazy(() => import('./pages/UserGuide'));
const EventSettings        = lazy(() => import('./pages/EventSettings'));
const PublicApplicationForm = lazy(() => import('./pages/PublicApplicationForm'));
import ConnectionStatus from './components/ConnectionStatus';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/useAuth';
import SetupScreen from './auth/SetupScreen';
import LoginScreen from './auth/LoginScreen';
import EventSetupWizard from './auth/EventSetupWizard';
import { isEventConfigured, mergeEventConfig, type EventConfig } from './config/eventConfig';
import { loadEventConfig, EVENT_CONFIG_KEY } from './config/eventConfigStorage';
const CloudSyncProvider = lazy(() => import('./services/CloudSyncProvider'));
import ToastProvider, { useToast, registerToastBus } from './components/ToastProvider';
import { DEMO_MODE } from './demo/demoConfig';
import { DEMO_CREDENTIALS } from './demo/demoInfo';
import { saveCreds, saveSession } from './auth/storage';
import { ensureFirebaseAuth } from './services/firebase';
import { fetchCloudStateOnce } from './services/cloudStoreImpl';
import './index.css';

const PAGE_TITLES: Record<PageKey, string> = {
  dashboard:    '메인 대시보드',
  participants: '참가자 관리',
  applications:  '온라인 신청 대기함',
  churches:     '교회별 신청 현황',
  groups:       '조 편성',
  schedule:     '일정 관리',
  rooms:        '숙소/방 배정',
  vehicles:     '차량 배정',
  checklist:    '운영 체크리스트',
  safety:       '안전 관리',
  notices:      '공지사항',
  printcenter:  '출력 센터',
  datamanager:   '데이터 관리',
  emergency:     '비상연락망',
  checkin:       '현장 체크인',
  fieldmode:     '현장 운영 모드',
  userguide:     '사용 매뉴얼',
  eventsettings: '행사·운영 설정',
};

const PAGE_KEYS = Object.keys(PAGE_TITLES) as PageKey[];

function isPageKey(v: string | null): v is PageKey {
  return !!v && (PAGE_KEYS as string[]).includes(v);
}

const PAGE_STORE_KEY = 'eum-camp:ui:lastPage';

function getHashPage(): string {
  return window.location.hash.replace(/^#\/?/, '').split('?')[0];
}

function PageContent({ page, onNavigate }: { page: PageKey; onNavigate: (p: PageKey) => void }) {
  switch (page) {
    case 'dashboard':    return <Dashboard onNavigate={onNavigate} />;
    case 'participants': return <Participants />;
    case 'applications': return <Applications />;
    case 'churches':     return <Churches />;
    case 'groups':       return <Groups />;
    case 'schedule':     return <SchedulePage />;
    case 'rooms':        return <Rooms />;
    case 'vehicles':     return <Vehicles />;
    case 'checklist':    return <Checklist />;
    case 'safety':       return <Safety />;
    case 'notices':      return <Notices />;
    case 'printcenter':  return <PrintCenter />;
    case 'datamanager':   return <DataManager />;
    case 'emergency':     return <EmergencyContacts />;
    case 'checkin':       return <CheckIn />;
    case 'fieldmode':     return <FieldMode onNavigate={onNavigate} />;
    case 'userguide':     return <UserGuide onNavigate={onNavigate} />;
    case 'eventsettings': return <EventSettings />;
  }
}

function MainShell() {
  // 새로고침 후 페이지 복원: URL hash → localStorage → dashboard
  const [currentPage, setCurrentPage] = useState<PageKey>(() => {
    const fromHash = getHashPage();
    if (isPageKey(fromHash)) return fromHash;
    const stored = localStorage.getItem(PAGE_STORE_KEY);
    if (isPageKey(stored)) return stored;
    return 'dashboard';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed]   = useState(false);

  const { state, logout, resetInstallation } = useAuth();
  const session = state.session!; // MainShell은 session이 있을 때만 렌더됨

  // 페이지 변경 → URL hash + localStorage 동기화
  useEffect(() => {
    if (getHashPage() !== currentPage) window.location.hash = `/${currentPage}`;
    localStorage.setItem(PAGE_STORE_KEY, currentPage);
  }, [currentPage]);

  // 브라우저 뒤로가기 / 앞으로가기 지원
  useEffect(() => {
    function onHashChange() {
      const k = getHashPage();
      if (isPageKey(k)) setCurrentPage(k);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Esc 키로 모바일 드로어 닫기 (접근성)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const mainMargin = collapsed ? 'lg:ml-16' : 'lg:ml-60';
  const isAdmin    = session.role === 'admin';

  return (
    <div
      className="flex min-h-screen"
      style={{ background: 'linear-gradient(180deg,#CFE6FF 0%,#EAF3FF 45%,#F8FBFF 100%)' }}
    >
      {/* 키보드 사용자용 스킵 링크 — 포커스되면 화면에 노출 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-lg focus:bg-cyan-500 focus:text-[#101A3D] focus:font-semibold focus:text-sm"
      >
        본문으로 건너뛰기
      </a>

      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />

      <div className={`flex-1 ml-0 ${mainMargin} transition-all duration-300 min-w-0 flex flex-col`}>

        {/* 상단 헤더 */}
        <header
          className="sticky top-0 z-40 px-4 lg:px-6 py-3 flex items-center justify-between gap-3"
          style={{
            background: 'rgba(2,8,24,0.88)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(37, 99, 235,0.1)',
          }}
        >
          {/* 좌측: 햄버거 + 브레드크럼 */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-colors"
              aria-label="메뉴 열기"
              aria-expanded={mobileOpen}
              aria-controls="primary-sidebar"
            >
              <Menu size={18} aria-hidden="true" />
            </button>

            <nav aria-label="현재 위치" className="flex items-center gap-2 min-w-0 overflow-hidden">
              {/* 모바일에서만 보이는 E:UM 미니 로고 */}
              <img
                src={EUM_BRAND.logoUrl}
                alt={EUM_BRAND.name}
                className="lg:hidden flex-shrink-0 w-7 h-7 object-contain"
                style={{ filter: 'drop-shadow(0 0 6px rgba(47,115,242,0.4))' }}
                aria-hidden="true"
              />
              <span className="text-[11px] text-slate-500 whitespace-nowrap hidden sm:block">
                {EVENT.appName}
              </span>
              <span className="text-slate-600 hidden sm:block" aria-hidden="true">/</span>
              <span className="text-sm font-semibold text-[#101A3D] truncate" aria-current="page">
                {PAGE_TITLES[currentPage]}
              </span>
            </nav>
          </div>

          {/* 우측: 사용자 + 로그아웃 + 행사 정보 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <ConnectionStatus />
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px]"
              style={{
                background: isAdmin ? 'rgba(245,158,11,0.12)' : 'rgba(37, 99, 235,0.12)',
                border: `1px solid ${isAdmin ? 'rgba(245,158,11,0.3)' : 'rgba(37, 99, 235,0.3)'}`,
                color: isAdmin ? '#fde68a' : '#a5f3fc',
              }}
              title={isAdmin ? '진행위원 — 읽기·쓰기' : '조회 전용 — 읽기 가능'}
            >
              {isAdmin
                ? <ShieldCheck size={11} aria-hidden="true" />
                : <UserCog size={11} aria-hidden="true" />}
              <span className="font-semibold">{isAdmin ? '진행위원' : '조회 전용'}</span>
              <span className="text-slate-300">· {session.displayName}</span>
            </div>
            <span className="text-xs text-slate-500 hidden lg:block whitespace-nowrap">
              {EVENT.dateShort} · {EVENT.venue}
            </span>
            {/* 체험판 → 설치 전환 — 항상 보이는 위치(헤더)에 상시 노출, 데모 배포본에서만 */}
            {DEMO_MODE && (
              <button
                type="button"
                onClick={() => {
                  try { localStorage.setItem(DEMO_INSTALL_CHOSEN_KEY, '1'); } catch { /* 저장 실패해도 진행 */ }
                  resetInstallation();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-opacity"
                style={{ background: 'linear-gradient(135deg,#2F73F2,#1F5FD9)' }}
                aria-label="내 교회로 설정하기 — 지금은 체험판입니다"
                title="지금은 체험판입니다. 눌러서 우리 교회 계정으로 설정하세요."
              >
                <UserCog size={13} aria-hidden="true" />
                <span className="hidden sm:inline">내 교회로 설정하기</span>
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-[#101A3D] hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-colors"
              aria-label="로그아웃 (잠금화면으로)"
              title="로그아웃"
            >
              <LogOut size={13} aria-hidden="true" />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="px-4 lg:px-6 py-5 lg:py-6 w-full flex-1 outline-none"
          style={{ paddingBottom: 'calc(var(--eum-mobile-tab-h) + var(--eum-safe-bottom) + 16px)' }}
        >
          <ErrorBoundary scope={PAGE_TITLES[currentPage]} variant="inline" onReset={() => setCurrentPage('dashboard')}>
            <Suspense fallback={<PageLoading />}>
              <PageContent page={currentPage} onNavigate={setCurrentPage} />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* 모바일 하단 빠른 메뉴 — 로그인 후에만 노출 */}
      <MobileBottomNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onOpenMenu={() => setMobileOpen(true)}
      />
    </div>
  );
}

function PageLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-sm text-slate-400">
      <img
        src={EUM_BRAND.logoUrl}
        alt=""
        aria-hidden="true"
        className="w-12 h-12 object-contain animate-pulse"
        style={{ filter: 'drop-shadow(0 0 12px rgba(47,115,242,0.45))' }}
      />
      <span>로딩 중…</span>
    </div>
  );
}

// 데모 배포본 전용 — VITE_DEMO_MODE=true 일 때만 동작한다(꺼지면 이 훅은 즉시 no-op).
// 새 브라우저가 처음 로그인했을 때 이 기기 localStorage에는 아직 행사 정보가 없지만
// 클라우드(Firestore)에는 이미 샘플 데이터가 있는 경우, 마법사·대기화면으로 보내기 전에
// 클라우드를 1회 확인해 있으면 받아와서 새로고침한다. 실제 교회 배포본(스위치 OFF)이나
// 클라우드에도 아직 데이터가 없는 최초 배포는 기존 마법사/대기화면 흐름 그대로 유지된다.
const DEMO_EVENT_CONFIG_TIMEOUT_MS = 8_000;
const DEMO_BOOTSTRAP_ATTEMPTED_KEY = 'eum-camp:demo:eventConfigBootstrapped';

function useDemoEventConfigBootstrap(active: boolean): boolean {
  // sessionStorage 읽기는 렌더 중 순수 조회(부작용 없음) — 이미 이 세션에서 시도했으면
  // (성공/실패 불문) 다시 켜지 않는다. effect 안에서 동기 setState를 하지 않기 위해
  // "켜야 하나"는 렌더에서 바로 계산하고, effect는 오직 비동기 완료 시점에만 setState한다.
  let attempted = false;
  try {
    attempted = sessionStorage.getItem(DEMO_BOOTSTRAP_ATTEMPTED_KEY) === '1';
  } catch {
    // sessionStorage 접근 불가 시 매번 재시도(최악의 경우도 8초 상한 안에서 끝남)
  }
  const effectiveActive = active && !attempted;

  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (!effectiveActive) return;

    let cancelled = false;

    const check = ensureFirebaseAuth()
      .then(() => fetchCloudStateOnce<Partial<EventConfig>>('eventConfig'))
      .then(value => {
        if (cancelled || !value) return;
        const merged = mergeEventConfig(value);
        if (!isEventConfigured(merged)) return;
        try {
          sessionStorage.setItem(DEMO_BOOTSTRAP_ATTEMPTED_KEY, '1');
        } catch {
          // 저장 실패해도 계속 진행 — 최악의 경우 다음 탭에서 한 번 더 확인할 뿐
        }
        localStorage.setItem(EVENT_CONFIG_KEY, JSON.stringify(merged));
        window.location.reload();
      })
      .catch(error => {
        console.warn('[demo] event config bootstrap failed', error);
      });

    const timeout = new Promise<void>(resolve => setTimeout(resolve, DEMO_EVENT_CONFIG_TIMEOUT_MS));

    void Promise.race([check, timeout]).then(() => {
      if (!cancelled) setResolved(true);
    });

    return () => { cancelled = true; };
  }, [effectiveActive]);

  return effectiveActive && !resolved;
}

// 데모 배포본 전용 — 신규 방문자(이 브라우저에 creds가 없는 상태)를 SetupScreen/LoginScreen
// 없이 곧장 체험판(대시보드, 데모 데이터 채워진 상태)으로 자동 진입시킨다.
// 오너 피드백: "들어가면 그냥 체험부터 하고 괜찮으면 설치해서 사용하는건데 무슨 설정이고
// 지랄이고야?" — 설정 화면이 먼저 뜨는 순서 자체가 문제라 판단해 여기서 바로잡는다.
//
// setup()/login() React 콜백 대신 그 아래의 storage.ts 함수(saveCreds/saveSession)를 직접
// 호출한다 — login 콜백은 state.creds 를 closure로 캡처하므로, 방금 저장한 creds가 아직
// 리렌더에 반영되지 않은 시점에 부르면 "creds 없음"으로 오판해 실패할 수 있다(레이스).
// saveCreds/saveSession은 이미 publishStorageChange를 호출해 AuthProvider의
// listenStorageChange 구독이 같은 탭에서도 즉시 state.creds/state.session을 갱신하므로,
// 그 뒤로는 기존 useDemoEventConfigBootstrap이 평소와 똑같이 이어받아 클라우드 데모
// seed(eventConfig)를 채운다 — 새 로직을 만들지 않고 기존 두 훅을 그대로 잇기만 한다.
//
// '내 교회로 설정하기'를 눌러 설치를 선택한 브라우저는(DEMO_INSTALL_CHOSEN_KEY) 다시
// 자동 진입시키지 않는다 — 그래야 재설정 중 SetupScreen 입력이 이 훅에 덮이지 않는다.
const DEMO_INSTALL_CHOSEN_KEY = 'eum-camp:demo:installChosen';

function useDemoAutoEnter(active: boolean, hasCreds: boolean, hasSession: boolean): boolean {
  const shouldStart = active && !hasCreds;

  useEffect(() => {
    if (!shouldStart) return;
    void (async () => {
      try {
        await saveCreds({
          adminPassword: DEMO_CREDENTIALS.adminPassword,
          adminName: DEMO_CREDENTIALS.adminName,
          committeePin: DEMO_CREDENTIALS.committeePin,
        });
        saveSession({
          role: 'admin',
          displayName: DEMO_CREDENTIALS.adminName,
          loginAt: new Date().toISOString(),
        });
      } catch (error) {
        console.warn('[demo] 자동 체험 진입 실패 — 수동 설정 화면으로 진행합니다.', error);
      }
    })();
  }, [shouldStart]);

  // creds/session 둘 중 하나라도 아직 없으면(진행 중) 로딩 화면을 유지해
  // SetupScreen/LoginScreen이 한 프레임이라도 스치듯 보이는 걸 막는다.
  return active && !(hasCreds && hasSession);
}

function AuthGate() {
  const { state } = useAuth();
  const applyPage = getHashPage() === 'apply';
  const loggedIn = Boolean(state.creds) && Boolean(state.session);
  const configured = isEventConfigured(loadEventConfig());
  const demoActive = DEMO_MODE && loggedIn && !applyPage && !configured;
  const demoChecking = useDemoEventConfigBootstrap(demoActive);

  let installChosen = false;
  try {
    installChosen = localStorage.getItem(DEMO_INSTALL_CHOSEN_KEY) === '1';
  } catch {
    // 저장소를 못 읽으면 안전한 쪽(자동체험 계속 시도)으로 둔다.
  }
  const autoEnterActive = DEMO_MODE && !applyPage && !installChosen;
  const autoEntering = useDemoAutoEnter(autoEnterActive, Boolean(state.creds), Boolean(state.session));

  if (applyPage) {
    return (
      <Suspense fallback={<PageLoading />}>
        <CloudSyncProvider>
          <PublicApplicationForm />
        </CloudSyncProvider>
      </Suspense>
    );
  }
  if (autoEntering) return <DemoSyncCheckingScreen />;
  if (!state.creds)   return <SetupScreen />;
  if (!state.session) return <LoginScreen />;
  // 첫 부팅 — 행사 정보가 비어있으면 admin에게 강제 마법사. committee는 admin이 채울 때까지 대기.
  // (데모 배포본은 그 전에 클라우드 확인을 한 번 거친다 — 위 useDemoEventConfigBootstrap)
  if (!configured) {
    if (demoActive && demoChecking) return <DemoSyncCheckingScreen />;
    if (state.session.role === 'admin') return <EventSetupWizard />;
    return <PendingSetupScreen />;
  }
  return (
    <Suspense fallback={<PageLoading />}>
      <CloudSyncProvider>
        <MainShell />
      </CloudSyncProvider>
    </Suspense>
  );
}

function DemoSyncCheckingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(180deg,#CFE6FF 0%,#EAF3FF 45%,#F8FBFF 100%)' }}
    >
      <div
        className="max-w-md w-full rounded-2xl p-7 text-center"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(31,95,217,0.24)',
          boxShadow: '0 6px 24px rgba(27,58,92,0.10)',
        }}
      >
        <img
          src={EUM_BRAND.logoUrl}
          alt=""
          aria-hidden="true"
          className="w-10 h-10 object-contain mx-auto mb-3 animate-pulse"
          style={{ filter: 'drop-shadow(0 0 12px rgba(31,95,217,0.35))' }}
        />
        <h2 className="text-base font-bold text-[#101A3D] mb-2">체험용 데이터를 불러오는 중…</h2>
        <p className="text-xs text-[#5C6A93] leading-relaxed">잠시만 기다려 주세요.</p>
      </div>
    </div>
  );
}

function PendingSetupScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(180deg,#CFE6FF 0%,#EAF3FF 45%,#F8FBFF 100%)' }}
    >
      <div
        className="max-w-md w-full rounded-2xl p-7 text-center"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(31,95,217,0.24)',
          boxShadow: '0 6px 24px rgba(27,58,92,0.10)',
        }}
      >
        <h2 className="text-base font-bold text-[#101A3D] mb-2">행사 정보 등록 대기 중</h2>
        <p className="text-xs text-[#5C6A93] leading-relaxed">
          관리자가 행사 기본 정보를 입력하면 운영 화면이 활성화됩니다.<br />
          잠시 후 다시 접속해 주세요.
        </p>
      </div>
    </div>
  );
}

function ToastBusBridge() {
  // 서비스 모듈(cloudStore 등)에서 호출할 수 있는 글로벌 토스트 함수 등록
  const { showToast } = useToast();
  useEffect(() => {
    registerToastBus(showToast);
  }, [showToast]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary scope="앱 최상단" variant="page">
      <ToastProvider>
        <ToastBusBridge />
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
