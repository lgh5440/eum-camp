import { LayoutDashboard, Users, UserCheck, Activity, Menu } from 'lucide-react';
import type { PageKey } from './Sidebar';

interface Props {
  currentPage: PageKey;
  onNavigate: (p: PageKey) => void;
  onOpenMenu: () => void;
}

const TABS: { key: PageKey | 'menu'; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard',    label: '홈',     icon: <LayoutDashboard size={20} aria-hidden="true" /> },
  { key: 'participants', label: '참가자', icon: <Users           size={20} aria-hidden="true" /> },
  { key: 'checkin',      label: '체크인', icon: <UserCheck       size={20} aria-hidden="true" /> },
  { key: 'fieldmode',    label: '현장',   icon: <Activity        size={20} aria-hidden="true" /> },
  { key: 'menu',         label: '전체',   icon: <Menu            size={20} aria-hidden="true" /> },
];

export default function MobileBottomNav({ currentPage, onNavigate, onOpenMenu }: Props) {
  return (
    <nav
      aria-label="빠른 메뉴"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40"
      style={{
        height: 'calc(var(--eum-mobile-tab-h) + var(--eum-safe-bottom))',
        paddingBottom: 'var(--eum-safe-bottom)',
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(14px)',
        borderTop: '1px solid #DDEEFF',
        boxShadow: '0 -8px 24px rgba(31,95,217,0.12)',
      }}
    >
      <ul className="grid grid-cols-5 h-16 m-0 p-0 list-none">
        {TABS.map(tab => {
          const isActive = tab.key === currentPage;
          return (
            <li key={tab.key} className="flex">
              <button
                type="button"
                onClick={() => tab.key === 'menu' ? onOpenMenu() : onNavigate(tab.key as PageKey)}
                aria-current={isActive ? 'page' : undefined}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F73F2]/60"
                style={{
                  color: isActive ? '#1F5FD9' : '#5C6A93',
                  transition: 'color 0.15s ease',
                }}
              >
                <span style={{
                  filter: isActive ? 'drop-shadow(0 0 6px rgba(47,115,242,0.55))' : 'none',
                }}>
                  {tab.icon}
                </span>
                <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
