import type { Participant } from '../types';

export type DuplicateLevel = 'none' | 'possible' | 'strong';

export interface DuplicateMatch {
  participant: Participant;
  reasons: string[];
  level: DuplicateLevel;
}

function digits(value: string | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

function normalizeName(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

export function findParticipantDuplicates(
  candidate: Participant,
  existing: Participant[],
): DuplicateMatch[] {
  const candidateName = normalizeName(candidate.name);
  const candidatePhone = digits(candidate.phone);
  const candidateParentPhone = digits(candidate.parentPhone);

  return existing
    .map(participant => {
      const reasons: string[] = [];
      const sameName = normalizeName(participant.name) === candidateName;
      const sameChurch = participant.church === candidate.church;
      const phones = [digits(participant.phone), digits(participant.parentPhone)].filter(Boolean);

      if (sameName) reasons.push('이름 일치');
      if (sameChurch) reasons.push('교회 일치');
      if (candidatePhone && phones.includes(candidatePhone)) reasons.push('본인 연락처 일치');
      if (candidateParentPhone && phones.includes(candidateParentPhone)) reasons.push('보호자 연락처 일치');

      const hasPhoneMatch = reasons.some(reason => reason.includes('연락처'));
      const level: DuplicateLevel =
        sameName && hasPhoneMatch ? 'strong' :
        sameName && sameChurch ? 'possible' :
        hasPhoneMatch ? 'possible' :
        'none';

      return { participant, reasons, level };
    })
    .filter(match => match.level !== 'none');
}
