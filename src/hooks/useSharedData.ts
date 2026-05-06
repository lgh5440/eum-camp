import { useEffect, useState } from 'react';
import type { Participant } from '../types';
import { loadParticipants, PARTICIPANTS_STORAGE_KEY } from '../utils/participantStorage';
import {
  CHECKLIST_STORAGE_KEY,
  mergeChecklistWithSavedStatus,
  CHECKLIST_FULL_KEY,
  loadFullChecklistItems,
  type StatusMap,
  loadChecklistStatusMap,
} from '../utils/checklistStorage';
import { SCHEDULE_STORAGE_KEY, loadScheduleItems } from '../utils/scheduleStorage';
import { GROUP_META_KEY, loadGroupMeta, type GroupMeta } from '../utils/groupConfigStorage';
import {
  NOTICE_TARGET_CONFIG_KEY,
  SCHEDULE_CATEGORY_CONFIG_KEY,
  loadNoticeTargetConfig,
  loadScheduleCategoryConfig,
  type NoticeTargetConfig,
  type ScheduleCategoryConfig,
} from '../utils/categoryConfigStorage';
import { SAFETY_ITEMS_KEY, loadSafetyItems } from '../utils/safetyStorage';
import { NOTICE_ITEMS_KEY, loadNoticeItems } from '../utils/noticeStorage';
import { CHECKIN_KEY, loadCheckInMap, type CheckInMap } from '../utils/checkInStorage';
import {
  CHURCH_CONFIRM_KEY,
  loadChurchConfirmMap,
  type ChurchConfirmMap,
} from '../utils/churchConfirmStorage';
import {
  APPLICATION_QUEUE_KEY,
  loadApplications,
  type ApplicationRecord,
} from '../utils/applicationsStorage';
import { CHANGE_LOG_KEY, loadChangeLog, type ChangeLogEntry } from '../utils/changeLogStorage';
import { DAILY_WORD_KEY, loadDailyWord, type DailyWord } from '../utils/dailyWordStorage';
import { ROOM_CONFIG_KEY, loadRoomConfig } from '../utils/roomConfigStorage';
import { CHURCH_CONFIG_KEY, loadChurchConfig, type ChurchConfig } from '../utils/churchConfigStorage';
import { listenStorageChange } from '../utils/storageEvents';
import { MENU_VISIBILITY_KEY, loadMenuVisibility, type MenuVisibility } from '../utils/menuVisibilityStorage';
import type { ChecklistItem, Notice, Room, SafetyItem, Schedule } from '../types';

function useStoredValue<T>(key: string, loader: () => T): T {
  const [value, setValue] = useState<T>(() => loader());

  useEffect(() => {
    const refresh = () => setValue(loader());
    refresh();
    return listenStorageChange(key, refresh);
  }, [key, loader]);

  return value;
}

export function useParticipants(): Participant[] {
  return useStoredValue(PARTICIPANTS_STORAGE_KEY, loadParticipants);
}

export function useChecklistItems(): ChecklistItem[] {
  return useStoredValue(CHECKLIST_STORAGE_KEY, mergeChecklistWithSavedStatus);
}

export function useChecklistStatusMap(): StatusMap {
  return useStoredValue(CHECKLIST_STORAGE_KEY, loadChecklistStatusMap);
}

export function useCheckInMap(): CheckInMap {
  return useStoredValue(CHECKIN_KEY, loadCheckInMap);
}

export function useChurchConfirmMap(): ChurchConfirmMap {
  return useStoredValue(CHURCH_CONFIRM_KEY, loadChurchConfirmMap);
}

export function useApplications(): ApplicationRecord[] {
  return useStoredValue(APPLICATION_QUEUE_KEY, loadApplications);
}

export function useChangeLog(): ChangeLogEntry[] {
  return useStoredValue(CHANGE_LOG_KEY, loadChangeLog);
}

export function useDailyWord(): DailyWord {
  return useStoredValue(DAILY_WORD_KEY, loadDailyWord);
}

export function useFullChecklistItems(): ChecklistItem[] {
  return useStoredValue(CHECKLIST_FULL_KEY, loadFullChecklistItems);
}

export function useScheduleItems(): Schedule[] {
  return useStoredValue(SCHEDULE_STORAGE_KEY, loadScheduleItems);
}

export function useScheduleCategoryConfig(): ScheduleCategoryConfig[] {
  return useStoredValue(SCHEDULE_CATEGORY_CONFIG_KEY, loadScheduleCategoryConfig);
}

export function useGroupMeta(): GroupMeta[] {
  return useStoredValue(GROUP_META_KEY, loadGroupMeta);
}

export function useSafetyItems(): SafetyItem[] {
  return useStoredValue(SAFETY_ITEMS_KEY, loadSafetyItems);
}

export function useNoticeTargetConfig(): NoticeTargetConfig[] {
  return useStoredValue(NOTICE_TARGET_CONFIG_KEY, loadNoticeTargetConfig);
}

export function useNoticeItems(): Notice[] {
  return useStoredValue(NOTICE_ITEMS_KEY, loadNoticeItems);
}

export function useRoomConfig(): Room[] {
  return useStoredValue(ROOM_CONFIG_KEY, loadRoomConfig);
}

export function useChurchConfig(): ChurchConfig[] {
  return useStoredValue(CHURCH_CONFIG_KEY, loadChurchConfig);
}

export function useMenuVisibility(): MenuVisibility {
  return useStoredValue(MENU_VISIBILITY_KEY, loadMenuVisibility);
}
