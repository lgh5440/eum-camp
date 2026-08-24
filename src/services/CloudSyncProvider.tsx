import { useEffect, type ReactNode } from 'react';
import type { Participant } from '../types';
import { CHECKIN_KEY, type CheckInMap } from '../utils/checkInStorage';
import {
  CHECKLIST_FULL_KEY,
  CHECKLIST_STORAGE_KEY,
  loadFullChecklistItems,
  type StatusMap,
} from '../utils/checklistStorage';
import {
  NOTICE_TARGET_CONFIG_KEY,
  SCHEDULE_CATEGORY_CONFIG_KEY,
  loadNoticeTargetConfig,
  loadScheduleCategoryConfig,
  type NoticeTargetConfig,
  type ScheduleCategoryConfig,
} from '../utils/categoryConfigStorage';
import { CHURCH_CONFIG_KEY, loadChurchConfig, type ChurchConfig } from '../utils/churchConfigStorage';
import { CHURCH_CONFIRM_KEY, type ChurchConfirmMap } from '../utils/churchConfirmStorage';
import { GROUP_META_KEY, loadGroupMeta, type GroupMeta } from '../utils/groupConfigStorage';
import { ROOM_CONFIG_KEY, loadRoomConfig } from '../utils/roomConfigStorage';
import { PARTICIPANTS_STORAGE_KEY } from '../utils/participantStorage';
import { NOTICE_ITEMS_KEY, loadNoticeItems } from '../utils/noticeStorage';
import { SAFETY_ITEMS_KEY, loadSafetyItems } from '../utils/safetyStorage';
import { SCHEDULE_STORAGE_KEY, loadScheduleItems } from '../utils/scheduleStorage';
import { publishStorageChange } from '../utils/storageEvents';
import { APPLICATION_QUEUE_KEY, type ApplicationRecord } from '../utils/applicationsStorage';
import { CHANGE_LOG_KEY, type ChangeLogEntry } from '../utils/changeLogStorage';
import { DAILY_WORD_KEY, loadDailyWord, type DailyWord } from '../utils/dailyWordStorage';
import { EVENT_CONFIG_KEY } from '../config/eventConfigStorage';
import { DEFAULT_EVENT_CONFIG, type EventConfig } from '../config/eventConfig';
import type { ChecklistItem, Notice, Room, SafetyItem, Schedule } from '../types';
import {
  initCloudWriteFlush,
  isCloudSyncEnabled,
  seedCloudState,
  subscribeCloudState,
  type CloudStateKey,
} from './cloudStoreImpl';
import { ensureFirebaseAuth } from './firebase';

interface SyncBinding<T> {
  cloudKey: CloudStateKey;
  storageKey: string;
  fallback: () => T | null;
}

const bindings: Array<SyncBinding<unknown>> = [
  {
    cloudKey: 'participants',
    storageKey: PARTICIPANTS_STORAGE_KEY,
    fallback: () => {
      const raw = readLocal(PARTICIPANTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) as Participant[] : [];
    },
  },
  {
    cloudKey: 'checklistStatus',
    storageKey: CHECKLIST_STORAGE_KEY,
    fallback: () => {
      const raw = readLocal(CHECKLIST_STORAGE_KEY);
      return raw ? JSON.parse(raw) as StatusMap : {};
    },
  },
  {
    cloudKey: 'checklistItems',
    storageKey: CHECKLIST_FULL_KEY,
    fallback: () => {
      const raw = readLocal(CHECKLIST_FULL_KEY);
      return raw ? JSON.parse(raw) as ChecklistItem[] : loadFullChecklistItems();
    },
  },
  {
    cloudKey: 'checkIn',
    storageKey: CHECKIN_KEY,
    fallback: () => {
      const raw = readLocal(CHECKIN_KEY);
      return raw ? JSON.parse(raw) as CheckInMap : {};
    },
  },
  {
    cloudKey: 'churchConfig',
    storageKey: CHURCH_CONFIG_KEY,
    fallback: () => {
      const raw = readLocal(CHURCH_CONFIG_KEY);
      return raw ? JSON.parse(raw) as ChurchConfig[] : loadChurchConfig();
    },
  },
  {
    cloudKey: 'churchConfirm',
    storageKey: CHURCH_CONFIRM_KEY,
    fallback: () => {
      const raw = readLocal(CHURCH_CONFIRM_KEY);
      return raw ? JSON.parse(raw) as ChurchConfirmMap : {};
    },
  },
  {
    cloudKey: 'groupMeta',
    storageKey: GROUP_META_KEY,
    fallback: () => {
      const raw = readLocal(GROUP_META_KEY);
      return raw ? JSON.parse(raw) as GroupMeta[] : loadGroupMeta();
    },
  },
  {
    cloudKey: 'roomConfig',
    storageKey: ROOM_CONFIG_KEY,
    fallback: () => {
      const raw = readLocal(ROOM_CONFIG_KEY);
      return raw ? JSON.parse(raw) as Room[] : loadRoomConfig();
    },
  },
  {
    cloudKey: 'scheduleItems',
    storageKey: SCHEDULE_STORAGE_KEY,
    fallback: () => {
      const raw = readLocal(SCHEDULE_STORAGE_KEY);
      return raw ? JSON.parse(raw) as Schedule[] : loadScheduleItems();
    },
  },
  {
    cloudKey: 'scheduleCategories',
    storageKey: SCHEDULE_CATEGORY_CONFIG_KEY,
    fallback: () => {
      const raw = readLocal(SCHEDULE_CATEGORY_CONFIG_KEY);
      return raw ? JSON.parse(raw) as ScheduleCategoryConfig[] : loadScheduleCategoryConfig();
    },
  },
  {
    cloudKey: 'safetyItems',
    storageKey: SAFETY_ITEMS_KEY,
    fallback: () => {
      const raw = readLocal(SAFETY_ITEMS_KEY);
      return raw ? JSON.parse(raw) as SafetyItem[] : loadSafetyItems();
    },
  },
  {
    cloudKey: 'noticeItems',
    storageKey: NOTICE_ITEMS_KEY,
    fallback: () => {
      const raw = readLocal(NOTICE_ITEMS_KEY);
      return raw ? JSON.parse(raw) as Notice[] : loadNoticeItems();
    },
  },
  {
    cloudKey: 'noticeTargetConfig',
    storageKey: NOTICE_TARGET_CONFIG_KEY,
    fallback: () => {
      const raw = readLocal(NOTICE_TARGET_CONFIG_KEY);
      return raw ? JSON.parse(raw) as NoticeTargetConfig[] : loadNoticeTargetConfig();
    },
  },
  {
    cloudKey: 'applicationQueue',
    storageKey: APPLICATION_QUEUE_KEY,
    fallback: () => {
      const raw = readLocal(APPLICATION_QUEUE_KEY);
      return raw ? JSON.parse(raw) as ApplicationRecord[] : [];
    },
  },
  {
    cloudKey: 'changeLog',
    storageKey: CHANGE_LOG_KEY,
    fallback: () => {
      const raw = readLocal(CHANGE_LOG_KEY);
      return raw ? JSON.parse(raw) as ChangeLogEntry[] : [];
    },
  },
  {
    cloudKey: 'dailyWord',
    storageKey: DAILY_WORD_KEY,
    fallback: () => {
      const raw = readLocal(DAILY_WORD_KEY);
      return raw ? JSON.parse(raw) as DailyWord : loadDailyWord();
    },
  },
  {
    cloudKey: 'eventConfig',
    storageKey: EVENT_CONFIG_KEY,
    fallback: (): EventConfig => {
      const raw = readLocal(EVENT_CONFIG_KEY);
      return raw ? JSON.parse(raw) as EventConfig : { ...DEFAULT_EVENT_CONFIG };
    },
  },
];

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal<T>(key: string, value: T): void {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    publishStorageChange(key);
  } catch {
    // Keep cloud sync from breaking the UI if storage is unavailable.
  }
}

function isSameJson<T>(key: string, value: T): boolean {
  const local = readLocal(key);
  const next = value === null || value === undefined ? null : JSON.stringify(value);
  return local === next;
}

export default function CloudSyncProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!isCloudSyncEnabled()) return;

    let stopped = false;
    let cleanup = () => {};

    void ensureFirebaseAuth()
      .then(() => {
        if (stopped) return;

        const stopFlush = initCloudWriteFlush();
        const unsubscribers = bindings.map(binding =>
          subscribeCloudState(
            binding.cloudKey,
            value => {
              if (value === undefined) {
                const fallback = binding.fallback();
                if (fallback !== null) {
                  void seedCloudState(binding.cloudKey, fallback).catch(error => {
                    console.warn(`[cloud sync] ${binding.cloudKey} seed failed`, error);
                  });
                }
                return;
              }

              if (!isSameJson(binding.storageKey, value)) {
                writeLocal(binding.storageKey, value);
              }
            },
            error => {
              console.warn(`[cloud sync] ${binding.cloudKey} subscription failed`, error);
            },
          ),
        );

        cleanup = () => {
          stopFlush();
          unsubscribers.forEach(unsubscribe => unsubscribe());
        };
      })
      .catch(error => {
        console.warn('[cloud sync] anonymous auth failed', error);
      });

    return () => {
      stopped = true;
      cleanup();
    };
  }, []);

  return <>{children}</>;
}
