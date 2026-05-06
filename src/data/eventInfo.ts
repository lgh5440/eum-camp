// 행사 기본 정보 단일 소스 (Single Source of Truth)
//
// • EVENT 상수: 앱 부팅 시 1회 계산되는 즉시 사용용 객체.
//   관리자가 EventSettings에서 값을 변경하면 saveEventConfig()가
//   페이지 새로고침을 유도하므로 EVENT는 항상 최신 값을 반영한다.
// • useEvent() 훅: React 컴포넌트에서 변경에 반응하고 싶을 때 사용.
//
// (mockData.ts의 RETREAT_INFO는 호환을 위해 유지하지만 실제 표시는
//  loadEventConfig()의 값이 최우선)

import { useEffect, useState } from 'react';
import { loadEventConfig, subscribeEventConfig } from '../config/eventConfigStorage';
import {
  formatDateBadge, formatDatesLabel, formatDateShort,
  type EventConfig,
} from '../config/eventConfig';

function buildEventView(cfg: EventConfig) {
  return {
    title:          cfg.title,
    theme:          cfg.theme,
    subTheme:       cfg.subTheme,
    dates:          formatDatesLabel(cfg),
    venue:          cfg.venue,
    venueAddress:   cfg.venueAddress,
    eveningSpeaker: cfg.eveningSpeaker,
    lectureSpeaker: cfg.lectureSpeaker,
    worshipTeam:    cfg.worshipTeam,
    inquiry:        cfg.inquiry,
    startDate:      cfg.startDate,
    endDate:        cfg.endDate,
    dateShort:      formatDateShort(cfg),
    dateBadge:      formatDateBadge(cfg),
    district:       cfg.district,
    appName:        cfg.appName,
    totalQuota:     cfg.totalQuota,
    feeAmount:      cfg.feeAmount,
    heroImage:      cfg.heroImage,
  } as const;
}

export type EventView = ReturnType<typeof buildEventView>;

/**
 * 앱 부팅 시 한 번 빌드되는 정적 EVENT 객체.
 * (관리자가 설정 저장 시 EventSettings 페이지가 새로고침을 트리거함)
 */
export const EVENT: EventView = buildEventView(loadEventConfig());

export type EventInfo = EventView;

/** React 컴포넌트에서 EventConfig 변경에 즉시 반응하고 싶을 때 사용 */
export function useEvent(): EventView {
  const [view, setView] = useState<EventView>(() => buildEventView(loadEventConfig()));
  useEffect(() => {
    return subscribeEventConfig(() => {
      setView(buildEventView(loadEventConfig()));
    });
  }, []);
  return view;
}

// ── D-day 배지 (Dashboard Hero 전용: 색상 포함 반환) ─────────────────────────────
export function computeDday(): { text: string; color: string; bg: string; border: string } {
  return computeDdayFromConfig(loadEventConfig());
}

export function computeDdayFromConfig(cfg: { startDate: string; endDate: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [sy, sm, sd] = cfg.startDate.split('-').map(Number);
  const [ey, em, ed] = cfg.endDate.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end   = new Date(ey, em - 1, ed);
  if (today > end)    return { text: '종료',   color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.3)' };
  if (today >= start) return { text: '진행 중', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)' };
  const diff = Math.round((start.getTime() - today.getTime()) / 86400000);
  return { text: `D-${diff}`, color: '#6ee7b7', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)' };
}

// ── D-day 레이블만 (Sidebar 전용) ────────────────────────────────────────────────
export function computeDdayLabel(): string {
  const cfg = loadEventConfig();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [sy, sm, sd] = cfg.startDate.split('-').map(Number);
  const [ey, em, ed] = cfg.endDate.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end   = new Date(ey, em - 1, ed);
  if (today > end)    return '종료';
  if (today >= start) return '진행중';
  const diff = Math.round((start.getTime() - today.getTime()) / 86400000);
  return `D-${diff}`;
}
