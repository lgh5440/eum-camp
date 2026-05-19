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
import { isEventConfigured } from './config/eventConfig';
import { loadEventConfig } from './config/eventConfigStorage';
const CloudSyncProvider = lazy(() => import('./services/CloudSyncProvider'));
import ToastProvider, { useToast, registerToastBus } from './components/ToastProvider';
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

  const { state, logout } = useAuth();
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
      style={{ background: 'linear-gradient(135deg, #020818 0%, #0a1628 60%, #0f2040 100%)' }}
    >
      {/* 키보드 사용자용 스킵 링크 — 포커스되면 화면에 노출 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-lg focus:bg-cyan-500 focus:text-white focus:font-semibold focus:text-sm"
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
            borderBottom: '1px solid rgba(6,182,212,0.1)',
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
                style={{ filter: 'drop-shadow(0 0 6px rgba(240,188,120,0.4))' }}
                aria-hidden="true"
              />
              <span className="text-[11px] text-slate-500 whitespace-nowrap hidden sm:block">
                {EVENT.appName}
              </span>
              <span className="text-slate-600 hidden sm:block" aria-hidden="true">/</span>
              <span className="text-sm font-semibold text-white truncate" aria-current="page">
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
                background: isAdmin ? 'rgba(245,158,11,0.12)' : 'rgba(6,182,212,0.12)',
                border: `1px solid ${isAdmin ? 'rgba(245,158,11,0.3)' : 'rgba(6,182,212,0.3)'}`,
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
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-colors"
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
        style={{ filter: 'drop-shadow(0 0 12px rgba(240,188,120,0.45))' }}
      />
      <span>로딩 중…</span>
    </div>
  );
}

function AuthGate() {
  const { state } = useAuth();
  if (getHashPage() === 'apply') {
    return (
      <Suspense fallback={<PageLoading />}>
        <CloudSyncProvider>
          <PublicApplicationForm />
        </CloudSyncProvider>
      </Suspense>
    );
  }
  if (!state.creds)   return <SetupScreen />;
  if (!state.session) return <LoginScreen />;
  // 첫 부팅 — 행사 정보가 비어있으면 admin에게 강제 마법사. committee는 admin이 채울 때까지 대기.
  if (!isEventConfigured(loadEventConfig())) {
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

function PendingSetupScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(135deg,#020818 0%,#0a1628 60%,#0f2040 100%)' }}
    >
      <div
        className="max-w-md w-full rounded-2xl p-7 text-center"
        style={{
          background: 'rgba(2,12,28,0.85)',
          border: '1px solid rgba(252,211,77,0.22)',
        }}
      >
        <h2 className="text-base font-bold text-white mb-2">행사 정보 등록 대기 중</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
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
