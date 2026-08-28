import {
  LayoutDashboard, Users, Building2, Grid3X3, CalendarDays,
  BedDouble, CheckSquare, ShieldAlert, Megaphone,
  ChevronLeft, ChevronRight, X, Bus, Printer, HardDrive, PhoneCall, UserCheck, Activity, BookOpen, Inbox, Settings,
} from 'lucide-react';
import { EVENT, computeDdayLabel } from '../data/eventInfo';
import { useAuth } from '../auth/useAuth';
import { useMenuVisibility } from '../hooks/useSharedData';
import { isMenuVisible } from '../utils/menuVisibilityStorage';
import { EUM_BRAND, EUM_COLORS } from '../data/eumBrand';

export type PageKey =
  | 'dashboard' | 'participants' | 'applications' | 'churches' | 'groups'
  | 'schedule' | 'rooms' | 'vehicles' | 'checklist' | 'safety'
  | 'notices' | 'printcenter' | 'datamanager' | 'emergency' | 'checkin'
  | 'fieldmode' | 'userguide' | 'eventsettings';

export interface NavItem {
  key: PageKey;
  label: string;
  icon: React.ReactNode;
  /** 관리자에게만 노출 */
  adminOnly?: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const navItems: NavItem[] = [
  { key: 'dashboard',    label: '메인 대시보드',   icon: <LayoutDashboard size={18} /> },
  { key: 'participants', label: '참가자 관리',      icon: <Users size={18} /> },
  { key: 'applications', label: '온라인 신청 대기함', icon: <Inbox size={18} /> },
  { key: 'churches',     label: '교회별 신청 현황', icon: <Building2 size={18} /> },
  { key: 'groups',       label: '조 편성',          icon: <Grid3X3 size={18} /> },
  { key: 'schedule',     label: '일정 관리',         icon: <CalendarDays size={18} /> },
  { key: 'rooms',        label: '숙소/방 배정',      icon: <BedDouble size={18} /> },
  { key: 'vehicles',     label: '차량 배정',          icon: <Bus size={18} /> },
  { key: 'checklist',    label: '운영 체크리스트',   icon: <CheckSquare size={18} /> },
  { key: 'safety',       label: '안전 관리',         icon: <ShieldAlert size={18} /> },
  { key: 'notices',      label: '공지사항',          icon: <Megaphone size={18} /> },
  { key: 'printcenter',  label: '출력 센터',   icon: <Printer   size={18} /> },
  { key: 'datamanager',  label: '데이터 관리', icon: <HardDrive size={18} /> },
  { key: 'emergency',    label: '비상연락망',   icon: <PhoneCall  size={18} /> },
  { key: 'checkin',     label: '현장 체크인',  icon: <UserCheck  size={18} /> },
  { key: 'fieldmode',  label: '현장 운영 모드', icon: <Activity  size={18} /> },
  { key: 'userguide', label: '사용 매뉴얼',    icon: <BookOpen  size={18} /> },
  { key: 'eventsettings', label: '행사·운영 설정', icon: <Settings size={18} />, adminOnly: true },
];

export interface SidebarProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  /** 모바일 드로어 오픈 여부 */
  mobileOpen: boolean;
  /** 모바일 드로어 닫기 콜백 */
  onMobileClose: () => void;
  /** 데스크탑 축소 여부 */
  collapsed: boolean;
  /** 데스크탑 축소 토글 콜백 */
  onCollapsedChange: (v: boolean) => void;
}

export default function Sidebar({
  currentPage,
  onNavigate,
  mobileOpen,
  onMobileClose,
  collapsed,
  onCollapsedChange,
}: SidebarProps) {

  const { isAdmin } = useAuth();
  const menuVisibility = useMenuVisibility();
  const visibleItems = navItems.filter(it =>
    (!it.adminOnly || isAdmin) && isMenuVisible(it.key, menuVisibility),
  );

  function handleNavigate(key: PageKey) {
    onNavigate(key);
    // 모바일에서는 메뉴 클릭 시 드로어 닫기
    onMobileClose();
  }

  const sidebarWidth = collapsed ? 'w-16' : 'w-60';

  return (
    <>
      {/* ── 모바일 오버레이 ───────────────────────────────────── */}
      <div
        className={`
          fixed inset-0 z-40 bg-[#E4ECF7] backdrop-blur-sm
          lg:hidden transition-opacity duration-300
          ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* ── 사이드바 본체 ─────────────────────────────────────── */}
      <aside
        id="primary-sidebar"
        aria-label="주 메뉴"
        className={`
          fixed left-0 top-0 h-screen z-50 flex flex-col
          transition-all duration-300 ease-in-out
          ${sidebarWidth}
          -translate-x-full lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : ''}
        `}
        style={{
          background: 'linear-gradient(180deg, #020c1e 0%, #071a36 60%, #0a2040 100%)',
          borderRight: '1px solid rgba(201,150,43,0.18)',
        }}
      >
        {/* E:um 브랜드 영역 (모든 페이지 공통 고정) */}
        <div
          className="flex items-center gap-3 px-4 py-4 flex-shrink-0 relative"
          style={{
            borderBottom: `1px solid ${EUM_COLORS.orangeL}33`,
            background: `linear-gradient(135deg, ${EUM_COLORS.orange}0F 0%, rgba(15,37,64,0.4) 100%)`,
          }}
        >
          {/* E:um 로고 — 좌측 */}
          <div
            className="flex-shrink-0"
            style={{
              width: collapsed ? 36 : 64,
              height: collapsed ? 36 : 64,
              filter: `drop-shadow(0 0 10px ${EUM_COLORS.goldL}40)`,
              transition: 'all 0.3s ease',
            }}
          >
            <img
              src={EUM_BRAND.logoUrl}
              alt={EUM_BRAND.name}
              className="w-full h-full object-contain"
            />
          </div>

          {/* 슬로건 — 우측 (펼쳐진 상태만) */}
          {!collapsed && (
            <div className="overflow-hidden flex-1 min-w-0">
              <div
                className="text-[12px] font-bold leading-snug"
                style={{ color: 'rgba(255,255,255,0.85)', letterSpacing: '0.3px' }}
              >
                {EUM_BRAND.sloganLine1}<br/>
                {EUM_BRAND.sloganLine2}
              </div>
            </div>
          )}

          {/* 데스크탑: collapse 토글 (절대 위치로 배치) */}
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 flex-shrink-0 w-6 h-6 rounded-full items-center justify-center text-slate-400 hover:text-[color:var(--eum-gold-l)] transition-colors z-10"
            style={{
              background: '#F8FBFF',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
            title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            aria-expanded={!collapsed}
          >
            {collapsed
              ? <ChevronRight size={12} aria-hidden="true" />
              : <ChevronLeft size={12} aria-hidden="true" />}
          </button>

          {/* 모바일: 닫기 */}
          <button
            type="button"
            onClick={onMobileClose}
            className="lg:hidden flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[color:var(--eum-gold-l)] hover:bg-white/5 transition-colors"
            title="닫기"
            aria-label="메뉴 닫기"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* 날짜 배지 (펼쳐진 상태) */}
        {!collapsed && (
          <div
            className="mx-3 mt-3 mb-1 px-3 py-2 rounded-xl text-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(240,140,40,0.12) 0%, rgba(201,150,43,0.08) 100%)',
              border: '1px solid rgba(240,188,120,0.28)',
            }}
          >
            <div className="text-[10px] font-medium" style={{ color: 'rgba(240,188,120,0.9)' }}>{EVENT.dateBadge}</div>
            <div className="text-[11px] font-bold mt-0.5" style={{ color: '#fff' }}>{computeDdayLabel()}</div>
          </div>
        )}

        {/* 네비게이션 */}
        <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="페이지 이동">
          <ul className="list-none p-0 m-0">
            {visibleItems.map(item => {
              const isActive = currentPage === item.key;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => handleNavigate(item.key)}
                    title={collapsed ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1
                      transition-all duration-150 text-left group min-h-[44px]
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--eum-gold-l)]/60
                      ${isActive
                        ? 'text-[color:var(--eum-gold-l)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }
                    `}
                    style={isActive
                      ? {
                          boxShadow: 'inset 3px 0 0 var(--eum-gold)',
                          background: 'linear-gradient(90deg, rgba(240,140,40,0.16) 0%, rgba(201,150,43,0.06) 100%)',
                        }
                      : {}}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex-shrink-0 ${
                        isActive ? 'text-[color:var(--eum-gold-l)]' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="text-sm font-medium whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 하단 테마 표시 */}
        {!collapsed && (
          <div
            className="px-3 pb-4 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div
              className="mt-3 px-3 py-2.5 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(240,140,40,0.10) 0%, rgba(15,37,64,0.5) 100%)',
                border: '1px solid rgba(240,188,120,0.22)',
              }}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(240,188,120,0.9)' }}>
                2026 THEME
              </div>
              <div className="text-xs text-[#1B3A5C] font-bold mt-1 leading-tight">
                {EVENT.theme}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {EVENT.subTheme}
              </div>
            </div>

            {/* ── E:UM 크레딧 (fork되어도 고정) ─────────────── */}
            <div className="mt-3 flex items-center justify-center gap-1.5 opacity-60">
              <img src="/eum-logo.png" alt="E:UM" className="w-3.5 h-3.5 object-contain" />
              <span className="text-[9px] text-slate-500">
                Built by <span style={{ color: 'rgba(240,188,120,0.8)' }}>E:UM</span> · 이음
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
