import type { Participant } from '../types';
import { queueCloudSave } from '../services/cloudStore';
import { logChange } from './changeLogStorage';
import { findParticipantDuplicates, type DuplicateLevel } from './duplicateParticipants';
import { publishStorageChange } from './storageEvents';

export const APPLICATION_QUEUE_KEY = 'youth-retreat-application-queue-v1';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type ApplicationSource = 'google-form' | 'naver-form' | 'csv' | 'manual';

export interface ApplicationRecord {
  id: string;
  participant: Participant;
  source: ApplicationSource;
  receivedAt: string;
  status: ApplicationStatus;
  duplicateLevel: DuplicateLevel;
  duplicateReasons: string[];
  memo?: string;
  decidedAt?: string;
}

export function loadApplications(): ApplicationRecord[] {
  try {
    const raw = localStorage.getItem(APPLICATION_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as ApplicationRecord[] : [];
  } catch {
    return [];
  }
}

export function saveApplications(list: ApplicationRecord[], logDetail?: string): void {
  try {
    localStorage.setItem(APPLICATION_QUEUE_KEY, JSON.stringify(list));
    publishStorageChange(APPLICATION_QUEUE_KEY);
  } catch {
    // Ignore storage errors so the UI remains usable.
  }
  queueCloudSave('applicationQueue', list);
  if (logDetail) logChange('신청 대기함', logDetail);
}

export function buildApplicationRecord(
  participant: Participant,
  existingParticipants: Participant[],
  source: ApplicationSource,
): ApplicationRecord {
  const matches = findParticipantDuplicates(participant, existingParticipants);
  const duplicateLevel = matches.some(match => match.level === 'strong')
    ? 'strong'
    : matches.length > 0
      ? 'possible'
      : 'none';
  const duplicateReasons = Array.from(new Set(matches.flatMap(match => match.reasons)));

  return {
    id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    participant: { ...participant, status: participant.status ?? 'pending' },
    source,
    receivedAt: new Date().toISOString(),
    status: 'pending',
    duplicateLevel,
    duplicateReasons,
  };
}

export function upsertApplications(records: ApplicationRecord[]): ApplicationRecord[] {
  const current = loadApplications();
  const next = current.map(record => ({ ...record, participant: { ...record.participant } }));
  const fresh: ApplicationRecord[] = [];

  records.forEach(record => {
    const existingIndex = next.findIndex(item => isSameApplication(item.participant, record.participant));
    if (existingIndex === -1) {
      fresh.push(record);
      return;
    }

    const existing = next[existingIndex];
    next[existingIndex] = {
      ...existing,
      source: record.source,
      participant: mergeFormParticipant(existing.participant, record.participant),
      duplicateLevel: record.duplicateLevel,
      duplicateReasons: record.duplicateReasons,
    };
  });

  return [...fresh, ...next];
}

function applicationKey(participant: Participant): string {
  return [
    participant.name.replace(/\s+/g, '').toLowerCase(),
    participant.church,
    participant.phone.replace(/\D/g, ''),
    participant.parentPhone.replace(/\D/g, ''),
  ].join('|');
}

function digits(value: string | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

function normalizedName(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

function isSameApplication(a: Participant, b: Participant): boolean {
  if (applicationKey(a) === applicationKey(b)) return true;

  const sameName = normalizedName(a.name) === normalizedName(b.name);
  const sameChurch = a.church === b.church;
  const aPhones = [digits(a.phone), digits(a.parentPhone)].filter(Boolean);
  const bPhones = [digits(b.phone), digits(b.parentPhone)].filter(Boolean);
  const hasSharedPhone = aPhones.some(phone => bPhones.includes(phone));

  return (sameName && hasSharedPhone) || (sameName && sameChurch);
}

function mergeFormParticipant(existing: Participant, incoming: Participant): Participant {
  return {
    ...existing,
    ...incoming,
    id: existing.id,
    registeredAt: existing.registeredAt,
    status: incoming.status === 'pending' ? existing.status : incoming.status,
    groupId: incoming.groupId ?? existing.groupId,
    roomId: incoming.roomId ?? existing.roomId,
    busId: incoming.busId ?? existing.busId,
  };
}
